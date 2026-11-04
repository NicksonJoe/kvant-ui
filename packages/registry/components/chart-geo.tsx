import { useId, useMemo, useState, type ComponentProps, type KeyboardEvent } from 'react';
import {
  CHART_COLORS,
  ChartLegend,
  ChartPlot,
  ChartTooltip,
  LegendMarker,
  SEQUENTIAL_COLORS,
  formatNumber,
  measureText,
  seriesColor,
  stepIndex,
  svgId,
  useHiddenSeries,
  useWidth,
  type ChartTooltipRow,
  type LegendMarkerKind,
  type Point,
} from '../lib/chart-kit';
import { cn } from '../lib/cn';
import {
  GARDEN_RING_PATH,
  MKAD_PATH,
  MOSCOW_OKRUG_SHAPES,
  MOSCOW_ORIGIN,
  MOSCOW_SCALE,
  MOSCOW_SIZE,
  RIVER_PATH,
  RUSSIA_TILE_SHAPES,
  TTK_PATH,
  type TileShape,
} from './chart-geo-shapes';

/* ---------- Geometry as data: basemaps, region shapes, tiles, projection ---------- */

/** Where a mark goes: a coordinate the basemap projects, or a region id of a tile basemap. */
export type GeoLocation = { lon: number; lat: number } | { region: string };

/** A named place: a city, a warehouse, a label on the map. */
export type GeoPlace = { name: string } & GeoLocation;

export interface GeoLine {
  path: string;
  /** road — a border stroke; water — a seq-2 stroke 5. */
  kind: 'road' | 'water';
  width?: number;
}

export interface GeoRegion extends Point {
  name: string;
}

export interface GeoBasemap {
  /** Drawing space of the paths, px; the map scales it down to its container, never up. */
  width: number;
  height: number;
  /** Ground shapes, fill-1. */
  land: readonly string[];
  /** Scheme lines drawn over the data layer: rings, roads, rivers. */
  lines?: readonly GeoLine[];
  /** Small fg-3 captions of the scheme: «МКАД». */
  captions?: readonly ({ text: string } & Point)[];
  /** lon/lat → drawing space. */
  project?: (lon: number, lat: number) => Point;
  /** Region id → name and centre, for marks placed by region. */
  regions?: Readonly<Record<string, GeoRegion>>;
}

export interface GeoFeature {
  id: string;
  name: string;
  /** SVG path in the drawing space of its shapes. */
  path: string;
  /** Short label drawn at `label`: «ЦАО», «МСК». */
  code?: string;
  /** Where the code and the tooltip sit. */
  label?: Point;
}

export interface GeoShapes {
  width: number;
  height: number;
  features: readonly GeoFeature[];
}

/** A tile of a tile map: one equal cell per region. */
export type GeoTile = TileShape;

/** Equirectangular projection with a scale per axis: `origin` lands on `at`, `scale` is px per degree of [lon, lat]. */
export function linearProjection(origin: { lon: number; lat: number }, at: Point, scale: readonly [number, number]) {
  return (lon: number, lat: number): Point => ({ x: at.x + (lon - origin.lon) * scale[0], y: at.y - (lat - origin.lat) * scale[1] });
}

/** Moscow inside MKAD as in Paper: the ring scheme, the river and a projection centred on the Kremlin. */
export const MOSCOW_BASEMAP: GeoBasemap = {
  ...MOSCOW_SIZE,
  land: [MKAD_PATH],
  lines: [
    { path: RIVER_PATH, kind: 'water' },
    { path: MKAD_PATH, kind: 'road', width: 2 },
    { path: TTK_PATH, kind: 'road', width: 1.5 },
    { path: GARDEN_RING_PATH, kind: 'road' },
  ],
  captions: [
    { text: 'МКАД', x: 503.2, y: 52.3 },
    { text: 'ТТК', x: 374.4, y: 103.4 },
  ],
  // shortcut: a scheme, not a survey — MKAD is an ellipse 533 × 257 around the Kremlin, up to ~15 px off at the ring; swap in real geometry and its projection for street-level maps.
  project: linearProjection(MOSCOW_ORIGIN, MOSCOW_ORIGIN, MOSCOW_SCALE),
};

const TILE = { width: 38, height: 30, stepX: 42, stepY: 34 } as const;
const tilePath = (x: number, y: number) => `M${x + 4} ${y}h30q4 0 4 4v22q0 4-4 4h-30q-4 0-4-4v-22q0-4 4-4Z`;
const tileCentre = (tile: GeoTile): Point => ({ x: tile.col * TILE.stepX + TILE.width / 2, y: tile.row * TILE.stepY + TILE.height / 2 });
const tileSize = (tiles: readonly GeoTile[]) => ({
  width: Math.max(0, ...tiles.map((tile) => tile.col)) * TILE.stepX + TILE.width,
  height: Math.max(0, ...tiles.map((tile) => tile.row)) * TILE.stepY + TILE.height,
});

/** Tiles 38 × 30 on a 42 × 34 grid as a basemap: fill-1 tiles and region centres for marks placed by `region`. */
export function tileBasemap(tiles: readonly GeoTile[]): GeoBasemap {
  return {
    ...tileSize(tiles),
    land: tiles.map((tile) => tilePath(tile.col * TILE.stepX, tile.row * TILE.stepY)),
    regions: Object.fromEntries(tiles.map((tile) => [tile.id, { name: tile.name, ...tileCentre(tile) }])),
  };
}

const tileShapes = (tiles: readonly GeoTile[]): GeoShapes => ({
  ...tileSize(tiles),
  features: tiles.map((tile) => ({
    id: tile.id,
    name: tile.name,
    code: tile.id,
    path: tilePath(tile.col * TILE.stepX, tile.row * TILE.stepY),
    label: tileCentre(tile),
  })),
});

/** 59 Russian regions as tiles, ids are their three-letter codes: «МСК», «СПБ». */
export const RUSSIA_TILES: readonly GeoTile[] = RUSSIA_TILE_SHAPES;
export const RUSSIA_BASEMAP: GeoBasemap = tileBasemap(RUSSIA_TILES);

/** Moscow okrugs inside MKAD on the ring scheme: ЦАО within TTK, eight sectors between TTK and MKAD. */
export const MOSCOW_OKRUGS: GeoShapes = {
  ...MOSCOW_SIZE,
  features: MOSCOW_OKRUG_SHAPES.map((okrug) => ({ ...okrug, code: okrug.id })),
};

/* ---------- Shared plumbing ---------- */

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Scales the drawing space to the measured width (down only) and centres it. */
function useFrame(space: { width: number; height: number }) {
  const [ref, width] = useWidth(space.width);
  const k = Math.min(1, width / space.width);
  const dx = round1((width - space.width * k) / 2);
  const frame = {
    width,
    k,
    height: Math.ceil(space.height * k),
    transform: `translate(${dx} 0) scale(${k})`,
    at: (p: Point): Point => ({ x: round1(dx + p.x * k), y: round1(p.y * k) }),
  };
  return [ref, frame] as const;
}
type Frame = ReturnType<typeof useFrame>[1];

/** Drawing-space position of a location; null when the basemap cannot place it (no projection, unknown region). */
function locate(map: GeoBasemap, at: GeoLocation): Point | null {
  if ('region' in at) {
    const region = map.regions?.[at.region];
    return region ? { x: region.x, y: region.y } : null;
  }
  return map.project ? map.project(at.lon, at.lat) : null;
}

/** ← → Home End over `count` marks, Escape lets go; what it lands on is read out. */
function useStepper(count: number, describe: (index: number) => string) {
  const [active, setActive] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setActive(null);
      return;
    }
    const index = stepIndex(event.key, active, count);
    if (index === null) return;
    event.preventDefault();
    setActive(index);
    setSpoken(describe(index));
  };
  const hover = (index: number) => ({
    onPointerEnter: () => setActive(index),
    onPointerDown: () => setActive(index),
    onPointerLeave: () => setActive(null),
  });
  return { active: active !== null && active < count ? active : null, hover, spoken, onKeyDown, onBlur: () => setActive(null) };
}

interface MapTooltipProps {
  at: Point;
  frame: Frame;
  title: string;
  rows: readonly ChartTooltipRow[];
  marker?: LegendMarkerKind;
  total?: string;
}

/** ChartTooltip under the mark, or above it in the lower half of the map. */
function MapTooltip({ at, frame, title, rows, marker, total }: MapTooltipProps) {
  const tall = 36 + rows.length * 22 + (total === undefined ? 0 : 26);
  const y = at.y > frame.height / 2 ? Math.max(0, at.y - 18 - tall) : at.y + 18;
  return <ChartTooltip x={at.x} y={y} width={frame.width} title={title} rows={rows} marker={marker} total={total} />;
}

function BasemapLand({ map, frame }: { map: GeoBasemap; frame: Frame }) {
  return (
    <g transform={frame.transform} pointerEvents="none">
      {map.land.map((d, i) => (
        <path key={i} d={d} fill="var(--color-fill-1)" />
      ))}
    </g>
  );
}

function BasemapLines({ map, frame }: { map: GeoBasemap; frame: Frame }) {
  return (
    <g pointerEvents="none">
      <g transform={frame.transform} fill="none" strokeLinecap="round">
        {map.lines?.map((line, i) => (
          <path
            key={i}
            d={line.path}
            stroke={line.kind === 'water' ? 'var(--color-seq-2)' : 'var(--color-border)'}
            strokeWidth={line.width ?? (line.kind === 'water' ? 5 : 1)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {map.captions?.map((caption) => {
        const p = frame.at(caption);
        return (
          <text key={caption.text} x={p.x} y={p.y} className="fill-fg-3 text-[11px]">
            {caption.text}
          </text>
        );
      })}
    </g>
  );
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
type Side = 'right' | 'left' | 'top' | 'bottom';
interface PlacedLabel {
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  box: Box;
}

const around = (p: Point, r: number): Box => ({ x0: p.x - r, y0: p.y - r, x1: p.x + r, y1: p.y + r });
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
/** A placed label as an obstacle: padded so the next label keeps a gap. */
const padded = ({ box }: { box: Box }): Box => ({ x0: box.x0 - 6, y0: box.y0 - 2, x1: box.x1 + 6, y1: box.y1 + 2 });

/** A 12px label beside a mark: the first side that stays inside the map and clear of `taken`; null when none does (the tooltip and the table still name it). */
function placeLabel(text: string, at: Point, gap: number, taken: readonly Box[], bounds: { width: number; height: number }, sides: readonly Side[]): PlacedLabel | null {
  const w = measureText(text, '600 12px Inter, sans-serif');
  const spot = (x: number, y: number, anchor: PlacedLabel['anchor']): PlacedLabel => {
    const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    return { x, y, anchor, box: { x0, y0: y - 12, x1: x0 + w, y1: y + 4 } };
  };
  const spots: Record<Side, PlacedLabel> = {
    right: spot(at.x + gap, at.y + 4, 'start'),
    left: spot(at.x - gap, at.y + 4, 'end'),
    top: spot(at.x, at.y - gap - 4, 'middle'),
    bottom: spot(at.x, at.y + gap + 12, 'middle'),
  };
  const fits = ({ box }: PlacedLabel) =>
    box.x0 >= 0 && box.x1 <= bounds.width && box.y0 >= 0 && box.y1 <= bounds.height && !taken.some((other) => overlaps(box, other));
  return sides.map((side) => spots[side]).find(fits) ?? null;
}

const PLURAL = new Intl.PluralRules('ru-RU');
const POINT_WORDS: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'точка', few: 'точки' };
const countPoints = (n: number) => `${formatNumber(n)} ${POINT_WORDS[PLURAL.select(n)] ?? 'точек'}`;

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/* ---------- Choropleth and tile map ---------- */

export interface GeoDatum {
  /** Id of the feature or tile. */
  id: string;
  value: number;
}

export interface GeoRegionMapProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the map shows; screen readers also get every region as a table. */
  'aria-label': string;
  data: readonly GeoDatum[];
  /** Up to four ascending breaks for classes seq-1…5: [5, 10, 20, 40] → «до 5», «5–9», … «40+». Default: data quintiles. */
  thresholds?: readonly number[];
  /** What the value is: «Заказов на 10 тыс жителей»; titles the scale and the tooltip row. */
  valueLabel?: string;
  formatValue?: (value: number) => string;
  /** Class scale under the map. */
  legend?: boolean;
}

export interface ChoroplethMapProps extends GeoRegionMapProps {
  /** Region shapes with paths (default: Moscow okrugs on the ring scheme). */
  shapes?: GeoShapes;
}

export interface TileMapProps extends GeoRegionMapProps {
  /** Tiles on the 42 × 34 grid (default: 59 Russian regions). */
  tiles?: readonly GeoTile[];
}

function classBreaks(values: readonly number[], thresholds: readonly number[] | undefined): number[] {
  if (thresholds) return thresholds.slice(0, 4);
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  return [1, 2, 3, 4].map((i) => sorted[Math.floor((i * sorted.length) / 5)] ?? 0);
}

const classOf = (value: number, breaks: readonly number[]) => breaks.filter((step) => value >= step).length;

function classLabels(breaks: readonly number[], format: (value: number) => string): string[] {
  const first = breaks[0];
  const last = breaks[breaks.length - 1];
  if (first === undefined || last === undefined) return [];
  const whole = breaks.every(Number.isInteger);
  const middle = breaks.slice(0, -1).map((step, i) => {
    const next = breaks[i + 1] ?? step;
    const top = whole ? next - 1 : next;
    return top > step ? `${format(step)}–${format(top)}` : format(step);
  });
  return [`до ${format(first)}`, ...middle, `${format(last)}+`];
}

// fg-1 is too weak on light seq-5 and on dark seq-4/5: the code flips to the surface colour there
const ON_STEP = ['fill-fg-1', 'fill-fg-1', 'fill-fg-1', 'fill-fg-1 dark:fill-surface-1', 'fill-surface-1'];

function ScaleLegend({ title, labels }: { title?: string; labels: readonly string[] }) {
  return (
    <div data-slot="geo-scale" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-caption text-fg-2">
      {title ? <span>{title}</span> : null}
      {labels.map((text, i) => (
        <span key={text} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-3 shrink-0 rounded-[3px]" style={{ background: SEQUENTIAL_COLORS[i] }} />
          {text}
        </span>
      ))}
    </div>
  );
}

function RegionMap({
  slot,
  shapes,
  outline,
  data,
  thresholds,
  valueLabel,
  formatValue = formatNumber,
  legend = true,
  className,
  'aria-label': label,
  ...props
}: GeoRegionMapProps & { slot: string; shapes: GeoShapes; outline: boolean }) {
  const [ref, frame] = useFrame(shapes);
  const [pointer, setPointer] = useState<Point | null>(null);
  const values = new Map(data.map((item) => [item.id, item.value]));
  const breaks = classBreaks(
    data.map((item) => item.value),
    thresholds,
  );
  const labels = classLabels(breaks, formatValue);
  const regions = shapes.features.map((feature) => {
    const value = values.get(feature.id);
    return { ...feature, value, step: value === undefined ? null : classOf(value, breaks) };
  });
  const describe = (index: number) => {
    const region = regions[index];
    if (!region) return '';
    return region.value === undefined || region.step === null
      ? `${region.name}: нет данных`
      : `${region.name}: ${formatValue(region.value)}, ${labels[region.step] ?? ''}`;
  };
  const { active, hover, spoken, onKeyDown, onBlur } = useStepper(regions.length, describe);
  const current = active === null ? undefined : regions[active];
  const anchor = current?.label ? frame.at(current.label) : (pointer ?? { x: frame.width / 2, y: 0 });
  const codes = frame.k >= 0.6;

  return (
    <div data-slot={slot} className={cn('flex flex-col gap-3', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Регион',
          columns: [valueLabel ?? 'Значение'],
          rows: regions.map((region) => ({ header: region.name, cells: [region.value === undefined ? '—' : formatValue(region.value)] })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg
          aria-hidden
          width={frame.width}
          height={frame.height}
          className="block overflow-visible"
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            setPointer({ x: event.clientX - box.left, y: event.clientY - box.top });
          }}
        >
          <g transform={frame.transform}>
            {regions.map((region, i) => (
              <path
                key={region.id}
                data-slot="geo-region"
                data-id={region.id}
                data-class={region.step ?? 'none'}
                d={region.path}
                fill={region.step === null ? 'var(--color-fill-2)' : SEQUENTIAL_COLORS[region.step]}
                stroke={outline ? 'var(--color-surface-1)' : undefined}
                strokeWidth={outline ? 1.5 : undefined}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ transitionDelay: `${Math.round(((region.label?.x ?? 0) / shapes.width) * 240)}ms` }}
                className="transition-opacity duration-(--duration-slow) ease-out starting:opacity-0"
                {...hover(i)}
              />
            ))}
            {current ? (
              <path
                data-slot="geo-region-active"
                d={current.path}
                fill="none"
                stroke="var(--color-fg-1)"
                strokeWidth={2}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            ) : null}
          </g>
          {codes
            ? regions.map((region) => {
                if (!region.code || !region.label) return null;
                const p = frame.at(region.label);
                return (
                  <text
                    key={region.id}
                    x={p.x}
                    y={p.y + 3.5}
                    textAnchor="middle"
                    pointerEvents="none"
                    className={cn('text-[10px] font-semibold', region.step === null ? 'fill-fg-3' : ON_STEP[region.step])}
                  >
                    {region.code}
                  </text>
                );
              })
            : null}
        </svg>
        {current ? (
          <MapTooltip
            at={anchor}
            frame={frame}
            title={current.name}
            rows={[
              {
                name: valueLabel ?? 'Значение',
                value: current.value === undefined ? 'нет данных' : formatValue(current.value),
                color: current.step === null ? undefined : SEQUENTIAL_COLORS[current.step],
              },
            ]}
          />
        ) : null}
      </ChartPlot>
      {legend && labels.length > 0 ? <ScaleLegend title={valueLabel} labels={labels} /> : null}
    </div>
  );
}

/** Regions filled by class seq-1…5 on real or schematic geometry; codes on the regions, hover and ← → read the value. */
export function ChoroplethMap({ shapes = MOSCOW_OKRUGS, ...props }: ChoroplethMapProps) {
  return <RegionMap slot="choropleth-map" shapes={shapes} outline {...props} />;
}

/** The equal-weight choropleth: every region one 38 × 30 tile, so small regions do not get lost. */
export function TileMap({ tiles = RUSSIA_TILES, ...props }: TileMapProps) {
  const shapes = useMemo(() => tileShapes(tiles), [tiles]);
  return <RegionMap slot="tile-map" shapes={shapes} outline={false} {...props} />;
}

/* ---------- Bubbles ---------- */

export type GeoBubble = { name: string; value: number } & GeoLocation;

export interface BubbleMapProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  data: readonly GeoBubble[];
  /** Default: the Russian tile grid, bubbles in region centres. */
  basemap?: GeoBasemap;
  /** «Заказов за месяц»: titles the size key and the tooltip row. */
  valueLabel?: string;
  formatValue?: (value: number) => string;
  /** Radius of the largest value, px; area is proportional to the value. */
  maxRadius?: number;
  /** How many of the largest bubbles get a «Москва 1 840» label. */
  labels?: number;
  color?: string;
}

const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
function roundNice(value: number): number {
  if (!(value > 0)) return 0;
  const power = 10 ** Math.floor(Math.log10(value));
  const mantissa = value / power;
  const best = NICE.reduce((a, b) => (Math.abs(b - mantissa) < Math.abs(a - mantissa) ? b : a));
  return Math.round(best * power * 1e6) / 1e6;
}

/** Bubbles in place with area ∝ value, the big ones underneath; the top four are labelled and a key of three sizes sits below. */
export function BubbleMap({
  data,
  basemap = RUSSIA_BASEMAP,
  valueLabel,
  formatValue = formatNumber,
  maxRadius = 32,
  labels = 4,
  color = CHART_COLORS[0],
  className,
  'aria-label': label,
  ...props
}: BubbleMapProps) {
  const [ref, frame] = useFrame(basemap);
  const max = Math.max(0, ...data.map((item) => item.value));
  const radius = (value: number) => (max > 0 ? round1(maxRadius * frame.k * Math.sqrt(Math.max(0, value) / max)) : 0);
  const bubbles = data
    .flatMap((item) => {
      const p = locate(basemap, item);
      return p ? [{ ...item, at: frame.at(p), r: radius(item.value) }] : [];
    })
    .sort((a, b) => b.value - a.value);
  const describe = (index: number) => {
    const bubble = bubbles[index];
    return bubble ? `${bubble.name}: ${formatValue(bubble.value)}` : '';
  };
  const { active, hover, spoken, onKeyDown, onBlur } = useStepper(bubbles.length, describe);
  const current = active === null ? undefined : bubbles[active];

  const circles = bubbles.map((bubble) => around(bubble.at, bubble.r));
  const placed: Box[] = [];
  const named = bubbles.slice(0, labels).flatMap((bubble, i) => {
    const text = `${bubble.name} ${formatValue(bubble.value)}`;
    const spot = placeLabel(text, bubble.at, bubble.r + 6, [...circles.filter((_, j) => j !== i), ...placed], frame, ['right', 'left', 'top', 'bottom']);
    if (!spot) return [];
    placed.push(padded(spot));
    return [{ text, spot }];
  });
  const steps = [...new Set([0.05, 0.27, 0.8].map((share) => roundNice(max * share)))].filter((value) => value > 0);

  return (
    <div data-slot="bubble-map" className={cn('flex flex-col gap-3', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{ rowHeader: 'Место', columns: [valueLabel ?? 'Значение'], rows: bubbles.map((bubble) => ({ header: bubble.name, cells: [formatValue(bubble.value)] })) }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={frame.width} height={frame.height} className="block overflow-visible">
          <BasemapLand map={basemap} frame={frame} />
          <BasemapLines map={basemap} frame={frame} />
          {bubbles.map((bubble, i) => (
            <circle
              key={`${bubble.name}-${i}`}
              data-slot="geo-bubble"
              data-name={bubble.name}
              cx={bubble.at.x}
              cy={bubble.at.y}
              r={bubble.r}
              fill={color}
              stroke="var(--color-surface-1)"
              strokeWidth={2}
              style={{ transitionDelay: `${i * 25}ms` }}
              className="origin-center transition-[scale] duration-(--duration-slow) ease-standard [transform-box:fill-box] starting:scale-0"
              {...hover(i)}
            />
          ))}
          {current ? (
            <circle cx={current.at.x} cy={current.at.y} r={current.r + 3} fill="none" stroke="var(--color-fg-1)" strokeWidth={1.5} pointerEvents="none" />
          ) : null}
          {named.map(({ text, spot }) => (
            <text key={text} x={spot.x} y={spot.y} textAnchor={spot.anchor} pointerEvents="none" className="fill-fg-1 text-caption font-semibold">
              {text}
            </text>
          ))}
        </svg>
        {current ? (
          <MapTooltip
            at={{ x: current.at.x, y: current.at.y + (current.at.y > frame.height / 2 ? -current.r : current.r) }}
            frame={frame}
            title={current.name}
            marker="dot"
            rows={[{ name: valueLabel ?? 'Значение', value: formatValue(current.value), color }]}
          />
        ) : null}
      </ChartPlot>
      {steps.length > 0 ? (
        <div data-slot="geo-size-legend" className="flex flex-wrap items-end gap-x-4 gap-y-2 text-caption text-fg-2">
          {valueLabel ? <span>{valueLabel}</span> : null}
          {steps.map((value) => {
            const r = Math.max(1, radius(value));
            return (
              <span key={value} className="inline-flex items-end gap-1.5">
                <svg aria-hidden width={r * 2 + 2} height={r * 2 + 2} className="shrink-0">
                  <circle cx={r + 1} cy={r + 1} r={r} fill="none" stroke="var(--color-fg-3)" strokeWidth={1.5} />
                </svg>
                {formatValue(value)}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Pins and clusters ---------- */

export type GeoPin = {
  name: string;
  /** Name of one of `categories`. */
  category?: string;
  /** Second line of the tooltip: an address, opening hours. */
  detail?: string;
  /** Print the name next to the mark: warehouses, offices. */
  label?: boolean;
} & GeoLocation;

export interface GeoCategory {
  name: string;
  /** Default: the chart palette in order. */
  color?: string;
  /** pin — a 14 × 18 drop with its tip on the address; square — an 18px rounded square with a building glyph. */
  marker?: 'pin' | 'square';
}

export interface PinMapProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  points: readonly GeoPin[];
  /** Point types in legend order (default: the categories met in `points`). */
  categories?: readonly GeoCategory[];
  /** Default: the Moscow ring scheme. */
  basemap?: GeoBasemap;
  /** Merge neighbouring pins into counted circles; on by default past 200 points. */
  cluster?: boolean;
  /** Pins closer than this, px, join one cluster. */
  clusterRadius?: number;
  /** Type legend with counts; on by default for two types or more. */
  legend?: boolean;
}

const pinPath = (tip: Point, r = 7) => {
  const half = round1(r * 0.82);
  const shoulder = round1(tip.y - r * 1.54);
  return `M${tip.x} ${tip.y}L${round1(tip.x - half)} ${shoulder}A${r} ${r} 0 1 1 ${round1(tip.x + half)} ${shoulder}Z`;
};
/** From the tip to the centre of the pin head. */
const PIN_HEAD = 15;
const squarePath = (c: Point, size: number) => {
  const h = size / 2;
  const side = size - 8;
  return `M${c.x - h + 4} ${c.y - h}h${side}q4 0 4 4v${side}q0 4-4 4h-${side}q-4 0-4-4v-${side}q0-4 4-4Z`;
};
const housePath = (c: Point) => `M${c.x - 4} ${c.y + 3}V${c.y - 1}L${c.x} ${c.y - 4}L${c.x + 4} ${c.y - 1}V${c.y + 3}Z`;
const clusterRadiusOf = (count: number) => (count >= 50 ? 15 : count >= 10 ? 12 : 9);

/** Greedy grouping in input order: a pin joins the first group whose seed is within `radius`. */
function groupNear<T extends { at: Point }>(items: readonly T[], radius: number): T[][] {
  const groups: { seed: Point; members: T[] }[] = [];
  for (const item of items) {
    const group = groups.find((other) => Math.hypot(other.seed.x - item.at.x, other.seed.y - item.at.y) <= radius);
    if (group) group.members.push(item);
    else groups.push({ seed: item.at, members: [item] });
  }
  return groups.map((group) => group.members);
}

interface MarkerLegendProps {
  items: readonly { name: string; label: string; color: string; marker: LegendMarkerKind }[];
  hidden: ReadonlySet<string>;
  onToggle: (name: string) => void;
  onHover: (name: string | null) => void;
}

/** ChartLegend with a marker per item: dots for pins, a square for warehouses. */
function MarkerLegend({ items, hidden, onToggle, onHover }: MarkerLegendProps) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {items.map((item) => (
        <button
          key={item.name}
          type="button"
          aria-pressed={!hidden.has(item.name)}
          onClick={() => onToggle(item.name)}
          onPointerEnter={() => onHover(item.name)}
          onPointerLeave={() => onHover(null)}
          onFocus={() => onHover(item.name)}
          onBlur={() => onHover(null)}
          className="kv-pressable inline-flex h-7 items-center gap-2 rounded-full px-2.5 text-label-sm text-fg-2 hover:bg-fill-2 hover:text-fg-1 aria-[pressed=false]:text-fg-3 aria-[pressed=false]:line-through"
        >
          <LegendMarker kind={item.marker} color={item.color} hidden={hidden.has(item.name)} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Exact addresses as pins (type by colour and shape), merged into counted clusters when they crowd. */
export function PinMap({
  points,
  categories,
  basemap = MOSCOW_BASEMAP,
  cluster,
  clusterRadius = 24,
  legend,
  className,
  'aria-label': label,
  ...props
}: PinMapProps) {
  const [ref, frame] = useFrame(basemap);
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);

  const declared = categories ?? [...new Set(points.flatMap((point) => (point.category ? [point.category] : [])))].map((name) => ({ name }));
  const types = declared.map((category: GeoCategory, i) => ({
    name: category.name,
    color: seriesColor(i, category.color),
    marker: category.marker ?? 'pin',
    label: `${category.name} · ${formatNumber(points.filter((point) => point.category === category.name).length)}`,
  }));
  type PinType = (typeof types)[number];
  const fallback: PinType = { name: '', color: seriesColor(0), marker: 'pin', label: '' };
  const typeOf = (point: GeoPin) => types.find((type) => type.name === point.category) ?? fallback;

  const located = points.flatMap((point) => {
    if (hidden.has(point.category ?? '')) return [];
    const p = locate(basemap, point);
    return p ? [{ point, at: frame.at(p), type: typeOf(point) }] : [];
  });
  type Located = (typeof located)[number];
  const groups = (cluster ?? points.length > 200) ? groupNear(located, clusterRadius) : located.map((item) => [item]);
  const clusters = groups
    .filter((group) => group.length > 1)
    .sort((a, b) => b.length - a.length)
    .map((members) => {
      const at = {
        x: round1(members.reduce((sum, item) => sum + item.at.x, 0) / members.length),
        y: round1(members.reduce((sum, item) => sum + item.at.y, 0) / members.length),
      };
      const byType = types.map((type) => ({ type, count: members.filter((item) => item.type === type).length })).filter((row) => row.count > 0);
      const lead = [...byType].sort((a, b) => b.count - a.count)[0]?.type ?? fallback;
      const regions = new Set(members.map((item) => ('region' in item.point ? item.point.region : '')));
      const [only] = regions;
      const title = regions.size === 1 && only ? (basemap.regions?.[only]?.name ?? only) : `${members[0]?.point.name ?? ''} и рядом`;
      return { kind: 'cluster' as const, members, at, color: lead.color, byType, title };
    });
  const singles = groups.flatMap((group) => (group.length === 1 ? group : [])).map((item) => ({ kind: 'pin' as const, ...item }));
  const marks = [...clusters, ...singles];

  const describe = (index: number) => {
    const mark = marks[index];
    if (!mark) return '';
    if (mark.kind === 'cluster') return `${mark.title}: ${countPoints(mark.members.length)}`;
    const facts = [mark.point.category, mark.point.detail].filter(Boolean).join(', ');
    return facts ? `${mark.point.name}: ${facts}` : mark.point.name;
  };
  const { active, hover, spoken, onKeyDown, onBlur } = useStepper(marks.length, describe);
  const current = active === null ? undefined : marks[active];
  const showLegend = legend ?? types.length > 1;
  const hasDetail = points.some((point) => point.detail);

  // pins placed by region stand in the middle of their tile; address pins keep the tip on the spot
  const tipOf = (item: Located): Point => ('region' in item.point ? { x: item.at.x, y: item.at.y + 8 } : item.at);
  const centreOf = (item: Located): Point => (item.type.marker === 'square' ? item.at : { x: tipOf(item).x, y: tipOf(item).y - PIN_HEAD });

  const taken: Box[] = [];
  const pinLabels = singles.flatMap((item) => {
    if (!item.point.label) return [];
    const at = centreOf(item);
    const spot = placeLabel(item.point.name, at, 14, taken, frame, at.x > frame.width * 0.6 ? ['left', 'right'] : ['right', 'left']);
    if (!spot) return [];
    taken.push(padded(spot));
    return [{ text: item.point.name, spot }];
  });

  const renderPin = (item: Located, index: number) => {
    const on = active === index;
    const common = {
      'data-slot': 'geo-pin',
      'data-category': item.type.name,
      'data-marker': item.type.marker,
      'data-x': tipOf(item).x,
      'data-y': tipOf(item).y,
      opacity: hovered !== null && hovered !== item.type.name ? 0.3 : 1,
      style: { transitionDelay: `${Math.min(index, 40) * 12}ms` },
      className: 'transition-[opacity,translate] duration-(--duration-slow) ease-out starting:translate-y-[calc(var(--shift-sm)*-1)] starting:opacity-0',
      ...hover(index),
    };
    if (item.type.marker === 'square') {
      return (
        <g key={index} {...common}>
          <path d={squarePath(item.at, 18)} fill={item.type.color} stroke={on ? 'var(--color-fg-1)' : 'var(--color-surface-1)'} strokeWidth={2} />
          <path d={housePath(item.at)} fill="var(--color-surface-1)" />
        </g>
      );
    }
    return (
      <path
        key={index}
        {...common}
        d={pinPath(tipOf(item))}
        fill={item.type.color}
        stroke={on ? 'var(--color-fg-1)' : 'var(--color-surface-1)'}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    );
  };

  return (
    <div data-slot="pin-map" className={cn('flex flex-col gap-3', className)} {...props}>
      {showLegend ? (
        <MarkerLegend
          items={types.map((type) => ({ ...type, marker: type.marker === 'square' ? 'square' : 'dot' }))}
          hidden={hidden}
          onToggle={toggle}
          onHover={setHovered}
        />
      ) : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Точка',
          columns: ['Тип', ...(hasDetail ? ['Подробности'] : [])],
          rows: points.map((point) => ({ header: point.name, cells: [point.category ?? '—', ...(hasDetail ? [point.detail ?? '—'] : [])] })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={frame.width} height={frame.height} className="block overflow-visible">
          <BasemapLand map={basemap} frame={frame} />
          <BasemapLines map={basemap} frame={frame} />
          {clusters.map((group, i) => {
            const count = group.members.length;
            return (
              <g
                key={`cluster-${i}`}
                opacity={hovered !== null && !group.byType.some((row) => row.type.name === hovered) ? 0.3 : 1}
                className="origin-center transition-[scale,opacity] duration-(--duration-slow) ease-standard [transform-box:fill-box] starting:scale-0"
                {...hover(i)}
              >
                <circle
                  data-slot="geo-cluster"
                  data-count={count}
                  cx={group.at.x}
                  cy={group.at.y}
                  r={clusterRadiusOf(count)}
                  fill={group.color}
                  stroke={active === i ? 'var(--color-fg-1)' : 'var(--color-surface-1)'}
                  strokeWidth={2}
                />
                <text x={group.at.x} y={group.at.y + 4} textAnchor="middle" className={cn('fill-accent-fg font-semibold', count >= 100 ? 'text-[10px]' : 'text-[11px]')}>
                  {count}
                </text>
              </g>
            );
          })}
          {singles.map((item, i) => renderPin(item, clusters.length + i))}
          {pinLabels.map(({ text, spot }) => (
            <text key={text} x={spot.x} y={spot.y} textAnchor={spot.anchor} pointerEvents="none" className="fill-fg-1 text-caption font-semibold">
              {text}
            </text>
          ))}
        </svg>
        {current?.kind === 'cluster' ? (
          <MapTooltip
            at={current.at}
            frame={frame}
            title={current.title}
            marker="dot"
            rows={
              current.byType.length > 0
                ? current.byType.map((row) => ({ name: row.type.name, value: formatNumber(row.count), color: row.type.color }))
                : [{ name: 'Точек', value: formatNumber(current.members.length), color: current.color }]
            }
            total={current.byType.length > 1 ? formatNumber(current.members.length) : undefined}
          />
        ) : null}
        {current?.kind === 'pin' ? (
          <MapTooltip
            at={centreOf(current)}
            frame={frame}
            title={current.point.name}
            marker={current.type.marker === 'square' ? 'square' : 'dot'}
            rows={[{ name: current.type.name || 'Точка', value: current.point.detail ?? '', color: current.type.color }]}
          />
        ) : null}
      </ChartPlot>
      {clusters.length > 0 ? (
        <div data-slot="geo-cluster-legend" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-fg-2">
          <span>Точек в кластере</span>
          {(
            [
              ['2–9', 6],
              ['10–49', 8],
              ['50+', 10],
            ] as const
          ).map(([text, r]) => (
            <span key={text} className="inline-flex items-center gap-1.5">
              <svg aria-hidden width={r * 2} height={r * 2} className="shrink-0">
                <circle cx={r} cy={r} r={r} fill={clusters[0]?.color} />
              </svg>
              {text}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 sm:ml-4">
            <svg aria-hidden width={12} height={16} className="shrink-0">
              <path d={pinPath({ x: 6, y: 15 }, 6)} fill={clusters[0]?.color} />
            </svg>
            одна точка
          </span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Density ---------- */

export interface DensityMapProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  /** Addresses; only those the basemap can place count. */
  points: readonly GeoLocation[];
  /** Default: the Moscow ring scheme. */
  basemap?: GeoBasemap;
  /** Area names printed over the layer: «Центр», «Юго-Запад». */
  labels?: readonly GeoPlace[];
  /** Kernel width, px of the drawing space: wider is smoother. */
  bandwidth?: number;
  /** «Мало ■■■■■ Много» above the map. */
  legend?: boolean;
}

const CELL = 6;
/** Share of the peak where each of the five steps begins; below the first the cell stays empty. */
const DENSITY_STEPS = [0.1, 0.25, 0.45, 0.65, 0.85];
const DENSITY_NAMES = ['Мало', 'Ниже среднего', 'Средне', 'Выше среднего', 'Много'];

/** Gaussian kernel density on a 6px grid: bin, blur rows then columns, cut into five steps of the peak. Pure arithmetic, so deterministic. */
function densityRaster(points: readonly Point[], width: number, height: number, bandwidth: number) {
  const cols = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const cellOf = (p: Point) => {
    const c = Math.floor(p.x / CELL);
    const r = Math.floor(p.y / CELL);
    return c >= 0 && c < cols && r >= 0 && r < rows ? r * cols + c : -1;
  };
  const bins = new Float64Array(cols * rows);
  for (const p of points) {
    const i = cellOf(p);
    if (i >= 0) bins[i] = (bins[i] ?? 0) + 1;
  }
  const sigma = Math.max(0.5, bandwidth / CELL);
  const reach = Math.ceil(sigma * 3);
  const kernel = Array.from({ length: reach * 2 + 1 }, (_, i) => Math.exp(-((i - reach) ** 2) / (2 * sigma * sigma)));
  const blur = (source: Float64Array, horizontal: boolean) => {
    const out = new Float64Array(source.length);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        let sum = 0;
        for (let k = -reach; k <= reach; k += 1) {
          const cc = horizontal ? c + k : c;
          const rr = horizontal ? r : r + k;
          if (cc >= 0 && cc < cols && rr >= 0 && rr < rows) sum += (source[rr * cols + cc] ?? 0) * (kernel[k + reach] ?? 0);
        }
        out[r * cols + c] = sum;
      }
    }
    return out;
  };
  const density = blur(blur(bins, true), false);
  const peak = density.reduce((a, b) => Math.max(a, b), 0);
  const levels = new Uint8Array(density.length);
  for (let i = 0; i < density.length && peak > 0; i += 1) {
    const share = (density[i] ?? 0) / peak;
    levels[i] = DENSITY_STEPS.filter((step) => share >= step).length;
  }

  const paths = DENSITY_STEPS.map(() => '');
  const cells = DENSITY_STEPS.map(() => 0);
  for (let r = 0; r < rows; r += 1) {
    let c = 0;
    while (c < cols) {
      const level = levels[r * cols + c] ?? 0;
      let end = c;
      while (end + 1 < cols && levels[r * cols + end + 1] === level) end += 1;
      if (level > 0) {
        const w = (end - c + 1) * CELL;
        paths[level - 1] += `M${c * CELL} ${r * CELL}h${w}v${CELL}h-${w}Z`;
        cells[level - 1] = (cells[level - 1] ?? 0) + end - c + 1;
      }
      c = end + 1;
    }
  }
  // counts[0] — addresses below the first step
  const counts = [0, 0, 0, 0, 0, 0];
  for (const p of points) {
    const i = cellOf(p);
    const level = i >= 0 ? (levels[i] ?? 0) : 0;
    counts[level] = (counts[level] ?? 0) + 1;
  }
  return { paths, cells, counts };
}

/** Where it is dense: a smoothed 6px raster in five seq steps under the scheme lines; exact addresses are PinMap's job. */
export function DensityMap({ points, basemap = MOSCOW_BASEMAP, labels, bandwidth = 18, legend = true, className, 'aria-label': label, ...props }: DensityMapProps) {
  const [ref, frame] = useFrame(basemap);
  const clip = svgId(useId());
  const raster = useMemo(
    () =>
      densityRaster(
        points.flatMap((point) => locate(basemap, point) ?? []),
        basemap.width,
        basemap.height,
        bandwidth,
      ),
    [points, basemap, bandwidth],
  );

  return (
    <div data-slot="density-map" className={cn('flex flex-col gap-3', className)} {...props}>
      {legend ? (
        <div data-slot="geo-density-legend" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-caption text-fg-2">
          {SEQUENTIAL_COLORS.map((color, i) => (
            <span key={color} className="inline-flex h-7 items-center gap-1.5">
              <LegendMarker kind="square" color={color} />
              {i === 0 ? 'Мало' : i === SEQUENTIAL_COLORS.length - 1 ? 'Много' : null}
            </span>
          ))}
        </div>
      ) : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        focusable={false}
        table={{
          rowHeader: 'Плотность',
          columns: ['Адресов'],
          rows: [
            ...DENSITY_NAMES.map((name, i) => ({ header: name, cells: [formatNumber(raster.counts[i + 1] ?? 0)] })).reverse(),
            { header: 'Ниже порога', cells: [formatNumber(raster.counts[0] ?? 0)] },
          ],
        }}
      >
        <svg aria-hidden width={frame.width} height={frame.height} className="block overflow-visible">
          <defs>
            <clipPath id={clip}>
              {basemap.land.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </clipPath>
          </defs>
          <BasemapLand map={basemap} frame={frame} />
          <g transform={frame.transform}>
            <g
              clipPath={basemap.land.length > 0 ? `url(#${clip})` : undefined}
              className="transition-opacity duration-(--duration-deliberate) ease-out starting:opacity-0"
            >
              {raster.paths.map((d, i) => (
                <path key={i} data-slot="geo-density" data-level={i + 1} data-cells={raster.cells[i]} d={d} fill={SEQUENTIAL_COLORS[i]} shapeRendering="crispEdges" />
              ))}
            </g>
          </g>
          <BasemapLines map={basemap} frame={frame} />
          {labels?.map((place) => {
            const p = locate(basemap, place);
            if (!p) return null;
            const at = frame.at(p);
            return (
              <text key={place.name} x={at.x} y={at.y + 4} textAnchor="middle" className="fill-fg-1 text-caption font-semibold">
                {place.name}
              </text>
            );
          })}
        </svg>
      </ChartPlot>
    </div>
  );
}

/* ---------- Flows ---------- */

export interface GeoFlow {
  from: GeoPlace;
  to: GeoPlace;
  value: number;
}

export interface FlowMapProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  /** Routes; each `from.name` is a warehouse with its own colour and legend button. */
  flows: readonly GeoFlow[];
  /** Default: the Russian tile grid. */
  basemap?: GeoBasemap;
  /** «Отправлений в неделю»: the tooltip row and the thickness key. */
  valueLabel?: string;
  formatValue?: (value: number) => string;
  /** Warehouse legend; on by default for two warehouses or more. */
  legend?: boolean;
}

/** Quadratic arc bowed up by 22 % of its chord (to the right when vertical), so neighbouring routes do not merge. */
function bow(a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  let nx = dy / length;
  let ny = -dx / length;
  if (ny > 0 || (ny === 0 && nx < 0)) {
    nx = -nx;
    ny = -ny;
  }
  const c = { x: round1((a.x + b.x) / 2 + nx * length * 0.22), y: round1((a.y + b.y) / 2 + ny * length * 0.22) };
  return { d: `M${a.x} ${a.y}Q${c.x} ${c.y} ${b.x} ${b.y}`, mid: { x: round1((a.x + 2 * c.x + b.x) / 4), y: round1((a.y + 2 * c.y + b.y) / 4) } };
}

/** Routes from warehouses as arcs, thickness 1.2–7 by volume, the big ones underneath; a warehouse is a square of its route colour. */
export function FlowMap({
  flows,
  basemap = RUSSIA_BASEMAP,
  valueLabel = 'Объём',
  formatValue = formatNumber,
  legend,
  className,
  'aria-label': label,
  ...props
}: FlowMapProps) {
  const [ref, frame] = useFrame(basemap);
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);

  const origins = [...new Map(flows.map((flow) => [flow.from.name, flow.from])).values()].map((place, i) => ({ place, name: place.name, color: seriesColor(i) }));
  const colorOf = (name: string) => origins.find((origin) => origin.name === name)?.color ?? seriesColor(0);
  const max = Math.max(0, ...flows.map((flow) => flow.value));
  const min = Math.min(...flows.map((flow) => flow.value));
  const widthOf = (value: number) => Math.round((1.2 + (max > 0 ? (5.8 * value) / max : 0)) * 100) / 100;
  const sorted = [...flows].sort((a, b) => b.value - a.value);
  const routes = sorted.flatMap((flow) => {
    if (hidden.has(flow.from.name)) return [];
    const a = locate(basemap, flow.from);
    const b = locate(basemap, flow.to);
    if (!a || !b) return [];
    const from = frame.at(a);
    const to = frame.at(b);
    return [{ ...flow, a: from, b: to, color: colorOf(flow.from.name), width: widthOf(flow.value), ...bow(from, to) }];
  });
  const describe = (index: number) => {
    const route = routes[index];
    return route ? `${route.from.name} → ${route.to.name}: ${formatValue(route.value)}` : '';
  };
  const { active, hover, spoken, onKeyDown, onBlur } = useStepper(routes.length, describe);
  const current = active === null ? undefined : routes[active];

  const shownOrigins = origins.flatMap((origin) => {
    if (hidden.has(origin.name)) return [];
    const p = locate(basemap, origin.place);
    return p ? [{ ...origin, at: frame.at(p) }] : [];
  });
  const destinations = [...new Map(routes.map((route) => [route.to.name, route.b])).entries()];
  const taken: Box[] = [...shownOrigins.map((origin) => around(origin.at, 9)), ...destinations.map(([, at]) => around(at, 3))];
  const originLabels = shownOrigins.flatMap((origin) => {
    const spot = placeLabel(origin.name, origin.at, 14, taken, frame, ['left', 'top', 'bottom', 'right']);
    if (!spot) return [];
    taken.push(padded(spot));
    return [{ origin, spot }];
  });
  const top = routes[0];
  const topLabel = top ? placeLabel(formatValue(top.value), top.b, 8, taken, frame, ['left', 'right', 'top', 'bottom']) : null;
  const showLegend = legend ?? origins.length > 1;

  return (
    <div data-slot="flow-map" className={cn('flex flex-col gap-3', className)} {...props}>
      {showLegend ? <ChartLegend items={origins} marker="line" hidden={hidden} onToggle={toggle} onHover={setHovered} /> : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{ rowHeader: 'Маршрут', columns: [valueLabel], rows: sorted.map((flow) => ({ header: `${flow.from.name} → ${flow.to.name}`, cells: [formatValue(flow.value)] })) }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={frame.width} height={frame.height} className="block overflow-visible">
          <BasemapLand map={basemap} frame={frame} />
          <BasemapLines map={basemap} frame={frame} />
          {routes.map((route, i) => {
            const dim = (hovered !== null && hovered !== route.from.name) || (active !== null && active !== i);
            return (
              <g
                key={`${route.from.name}-${route.to.name}-${i}`}
                data-slot="geo-route"
                data-from={route.from.name}
                data-to={route.to.name}
                opacity={dim ? 0.3 : 1}
                className="transition-opacity duration-(--duration-quick)"
                {...hover(i)}
              >
                <path
                  d={route.d}
                  fill="none"
                  stroke={route.color}
                  strokeWidth={route.width}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  style={{ transitionDelay: `${i * 40}ms` }}
                  className="transition-[stroke-dashoffset] duration-(--duration-deliberate) ease-out [stroke-dashoffset:0] starting:[stroke-dashoffset:1]"
                />
                <path d={route.d} fill="none" stroke="transparent" strokeWidth={Math.max(12, route.width + 8)} pointerEvents="stroke" />
              </g>
            );
          })}
          {destinations.map(([name, at]) => (
            <circle key={name} data-slot="geo-destination" cx={at.x} cy={at.y} r={3} fill="var(--color-fg-1)" stroke="var(--color-surface-1)" strokeWidth={1.5} pointerEvents="none" />
          ))}
          {shownOrigins.map((origin) => (
            <path key={origin.name} data-slot="geo-origin" d={squarePath(origin.at, 16)} fill={origin.color} stroke="var(--color-surface-1)" strokeWidth={2} pointerEvents="none" />
          ))}
          <g pointerEvents="none" className="fill-fg-1 text-caption font-semibold" stroke="var(--color-surface-1)" strokeWidth={3} strokeLinejoin="round" paintOrder="stroke">
            {originLabels.map(({ origin, spot }) => (
              <text key={origin.name} x={spot.x} y={spot.y} textAnchor={spot.anchor}>
                {origin.name}
              </text>
            ))}
            {top && topLabel ? (
              <text x={topLabel.x} y={topLabel.y} textAnchor={topLabel.anchor}>
                {formatValue(top.value)}
              </text>
            ) : null}
          </g>
        </svg>
        {current ? (
          <MapTooltip
            at={current.mid}
            frame={frame}
            title={`${current.from.name} → ${current.to.name}`}
            marker="line"
            rows={[{ name: valueLabel, value: formatValue(current.value), color: current.color }]}
          />
        ) : null}
      </ChartPlot>
      {flows.length > 0 ? (
        <p className="text-caption text-fg-2">
          Толщина — {lowerFirst(valueLabel)}: тонкая {formatValue(min)}, толстая {formatValue(max)}
        </p>
      ) : null}
    </div>
  );
}
