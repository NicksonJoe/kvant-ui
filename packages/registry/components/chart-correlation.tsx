import { useId, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from 'react';
import {
  ChartLegend,
  ChartPlot,
  ChartTooltip,
  DIVERGING_COLORS,
  LegendMarker,
  SEQUENTIAL_COLORS,
  ValueAxis,
  formatAxisValue,
  formatNumber,
  linePath,
  linearScale,
  niceRangeTicks,
  niceTicks,
  seriesColor,
  stepIndex,
  svgId,
  useHiddenSeries,
  useWidth,
  type ChartTooltipRow,
  type Point,
} from '../lib/chart-kit';
import { cn } from '../lib/cn';

/* ---------- Maths: least squares, Pearson, hexagonal bins, log ticks, bubble area ---------- */

export type TrendKind = 'linear' | 'exponential';

export interface TrendFit {
  kind: TrendKind;
  /** Slope and intercept in the fitted space: y for linear, ln y for exponential. */
  slope: number;
  intercept: number;
  /** Share of variance explained, 0…1; for exponential — of ln y, as spreadsheets report it. */
  r2: number;
  at: (x: number) => number;
  /** 95 % confidence band of the fitted mean at x. */
  band: (x: number) => [number, number];
}

const mean = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

/** Least-squares trend: a line, or y = a·eᵇˣ fitted through ln y. Null below two distinct x or, for exponential, with y ≤ 0. */
export function fitTrend(points: readonly Point[], kind: TrendKind = 'linear'): TrendFit | null {
  const n = points.length;
  if (n < 2 || (kind === 'exponential' && points.some((p) => !(p.y > 0)))) return null;
  const ys = points.map((p) => (kind === 'exponential' ? Math.log(p.y) : p.y));
  const mx = mean(points.map((p) => p.x));
  const my = mean(ys);
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  points.forEach((p, i) => {
    const dx = p.x - mx;
    const dy = (ys[i] ?? my) - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  });
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const residual = Math.max(0, syy - slope * sxy);
  // shortcut: normal 1,96 instead of Student's t — the band is a little narrow below ~30 points
  const spread = n > 2 ? Math.sqrt(residual / (n - 2)) : 0;
  const back = kind === 'exponential' ? Math.exp : (value: number) => value;
  return {
    kind,
    slope,
    intercept,
    r2: syy === 0 ? 1 : 1 - residual / syy,
    at: (x) => back(intercept + slope * x),
    band: (x) => {
      const half = 1.96 * spread * Math.sqrt(1 / n + (x - mx) ** 2 / sxx);
      const mid = intercept + slope * x;
      return [back(mid - half), back(mid + half)];
    },
  };
}

/** Pearson r over the common length; NaN when either side does not vary. */
export function pearsonCorrelation(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return Number.NaN;
  const xs = a.slice(0, n);
  const ys = b.slice(0, n);
  const mx = mean(xs);
  const my = mean(ys);
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  xs.forEach((x, i) => {
    const dx = x - mx;
    const dy = (ys[i] ?? my) - my;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  });
  if (sxx === 0 || syy === 0) return Number.NaN;
  return Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy)));
}

/** Symmetric matrix of Pearson r with ones on the diagonal. */
export function correlationMatrix(variables: readonly (readonly number[])[]): number[][] {
  return variables.map((a, i) =>
    variables.map((b, j) => {
      if (i === j) return 1;
      const [first, second] = i < j ? [a, b] : [b, a];
      return pearsonCorrelation(first, second);
    }),
  );
}

export interface HexBin {
  /** Centre of the hexagon, in the units of the points. */
  x: number;
  y: number;
  count: number;
  /** Indexes of the points that fell in. */
  points: number[];
}

/** The hexagon (pointy top, circumradius `radius`) that contains the point: the nearest lattice centre of the two candidate rows. */
function hexCell(x: number, y: number, radius: number) {
  const width = Math.sqrt(3) * radius;
  const pitch = 1.5 * radius;
  const top = Math.floor(y / pitch);
  let best = { row: top, column: 0, x: 0, y: 0, distance: Number.POSITIVE_INFINITY };
  // a point between rows r and r+1 lies in a hexagon of one of them: other rows are ≥ 1,5 r away vertically
  for (const row of [top, top + 1]) {
    const shift = (Math.abs(row) % 2) / 2;
    const column = Math.round(x / width - shift);
    const cx = (column + shift) * width;
    const cy = row * pitch;
    const distance = (x - cx) ** 2 + (y - cy) ** 2;
    if (distance < best.distance) best = { row, column, x: cx, y: cy, distance };
  }
  return best;
}

/** Groups points into pointy-top hexagons of `radius` on a lattice through the origin; empty hexagons are not returned. */
export function hexBins(points: readonly Point[], radius: number): HexBin[] {
  const bins = new Map<string, HexBin>();
  points.forEach((p, index) => {
    const cell = hexCell(p.x, p.y, radius);
    const key = `${cell.row}:${cell.column}`;
    const bin = bins.get(key);
    if (bin) {
      bin.count += 1;
      bin.points.push(index);
    } else bins.set(key, { x: cell.x, y: cell.y, count: 1, points: [index] });
  });
  return [...bins.values()];
}

const tidy = (value: number) => Number(value.toPrecision(12));

/** Ticks 1-2-5 per decade from just below `min` to just above `max`, for log axes. */
export function logTicks(min: number, max: number): number[] {
  if (!(min > 0) || !(max >= min)) return [1, 10];
  const steps: number[] = [];
  for (let power = Math.floor(Math.log10(min)) - 1; power <= Math.ceil(Math.log10(max)); power += 1) {
    for (const mantissa of [1, 2, 5]) steps.push(tidy(mantissa * 10 ** power));
  }
  const low = [...steps].reverse().find((step) => step <= min) ?? min;
  const high = steps.find((step) => step >= max) ?? max;
  return steps.filter((step) => step >= low && step <= high);
}

/** Bubble radius with the area, not the radius, proportional to the value; `max` gets `maxRadius`. */
export const bubbleRadius = (value: number, max: number, maxRadius: number): number =>
  value > 0 && max > 0 ? maxRadius * Math.sqrt(value / max) : 0;

/* ---------- Shared plot pieces ---------- */

const minus = (text: string) => text.replace('-', '−');
const number = (value: number) => minus(formatNumber(value));
const axisValue = (value: number) => minus(formatAxisValue(value));
const decimal2 = (value: number) => minus(value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

type AxisScale = 'linear' | 'log';

interface Axis {
  ticks: number[];
  at: (value: number) => number;
  invert: (px: number) => number;
}

function makeAxis(values: readonly number[], scale: AxisScale, range: readonly [number, number]): Axis {
  const [r0, r1] = range;
  if (scale === 'log') {
    const positive = values.filter((value) => value > 0);
    const ticks = logTicks(Math.min(...positive), Math.max(...positive));
    const d0 = Math.log10(ticks[0] ?? 1);
    const d1 = Math.log10(ticks[ticks.length - 1] ?? 10);
    const at = linearScale([d0, d1], range);
    return {
      ticks,
      at: (value) => at(Math.log10(Math.max(value, ticks[0] ?? 1))),
      invert: (px) => 10 ** (d0 + ((px - r0) / (r1 - r0 || 1)) * (d1 - d0)),
    };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const ticks = min >= 0 ? niceTicks(max) : niceRangeTicks(min, max);
  const d0 = ticks[0] ?? 0;
  const d1 = ticks[ticks.length - 1] ?? 1;
  return { ticks, at: linearScale([d0, d1], range), invert: (px) => d0 + ((px - r0) / (r1 - r0 || 1)) * (d1 - d0) };
}

/** Left margin wide enough for the longest Y label 12px left of the plot. */
const marginFor = (ticks: readonly number[], format: (value: number) => string) =>
  Math.max(48, Math.ceil(14 + 6.5 * Math.max(0, ...ticks.map((tick) => format(tick).length))));

interface XLabelsProps {
  ticks: readonly number[];
  x: (value: number) => number;
  y: number;
  width: number;
  format: (value: number) => string;
  unit?: string;
  /** Vertical grid lines from `grid[0]` to `grid[1]`. */
  grid?: readonly [number, number];
}

/** X labels 12/16 fg-3 under the plot: the first starts at its tick, the last ends at it and carries the unit. */
function XLabels({ ticks, x, y, width, format, unit, grid }: XLabelsProps) {
  const stride = Math.max(1, Math.ceil((ticks.length * (unit ? 72 : 56)) / Math.max(1, width)));
  const shown = ticks.filter((_, i) => i % stride === 0);
  return (
    <g data-slot="chart-axis">
      {grid
        ? ticks.map((tick) => (
            <line key={tick} x1={x(tick)} x2={x(tick)} y1={grid[0]} y2={grid[1]} stroke="var(--color-separator)" shapeRendering="crispEdges" />
          ))
        : null}
      {shown.map((tick, i) => {
        const last = i === shown.length - 1;
        return (
          <text
            key={tick}
            x={x(tick)}
            y={y}
            textAnchor={i === 0 && shown.length > 1 ? 'start' : last ? 'end' : 'middle'}
            className="fill-fg-3 text-caption tabular-nums"
          >
            {last && unit ? `${format(tick)} ${unit}` : format(tick)}
          </text>
        );
      })}
    </g>
  );
}

/** ← → Home End over `count` marks with a spoken line; the active mark survives only while it exists. */
function useStepper(count: number, describe: (index: number) => string) {
  const [active, setActive] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = stepIndex(event.key, active, count);
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    setSpoken(describe(next));
  };
  return { active: active !== null && active < count ? active : null, setActive, spoken, onKeyDown, onBlur: () => setActive(null) };
}

/** Pointer position in SVG pixels. */
function pointerIn(event: PointerEvent<SVGElement>): Point {
  const box = (event.currentTarget.ownerSVGElement ?? event.currentTarget).getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

/** Nearest mark to the pointer by distance from its edge, within `reach` px: a loop over the computed marks, not the DOM. */
function nearestMark(marks: readonly { px: number; py: number; r: number }[], at: Point, reach: number): number | null {
  // shortcut: linear scan, fine to a few thousand marks — past that the data belongs in HexbinChart
  let best: number | null = null;
  let bestDistance = reach;
  marks.forEach((mark, i) => {
    const distance = Math.hypot(mark.px - at.x, mark.py - at.y) - mark.r;
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = i;
    }
  });
  return best;
}

const markTitle = (color: string, text: string) => (
  <span className="inline-flex items-center gap-2">
    <LegendMarker kind="dot" color={color} />
    {text}
  </span>
);

const POINT_MOTION =
  'origin-center [transform-box:fill-box] transition-[opacity,scale] duration-(--duration-slow) ease-standard starting:opacity-0 motion-safe:starting:scale-0';

const TOP = 8;

/* ---------- Scatter ---------- */

export interface ScatterPoint {
  x: number;
  y: number;
  /** Name for the tooltip and the table: «Склад Pro». */
  label?: string;
  /** Print the label next to the point; only for the outliers the chart is about. */
  callout?: boolean;
}

export interface ScatterSeries {
  name: string;
  points: readonly ScatterPoint[];
  color?: string;
  /** Takes part in the trend; off for the outliers series. */
  trend?: boolean;
}

export interface ScatterChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  series: readonly ScatterSeries[];
  /** Axis names for the tooltip, the table and the screen reader: «Цена», «Продано». */
  xName?: string;
  yName?: string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  formatXTick?: (value: number) => string;
  formatYTick?: (value: number) => string;
  /** Unit after the last X label: «мин на сайте». */
  xUnit?: string;
  /** Least-squares trend over the visible series with `trend` not off. */
  trend?: TrendKind;
  /** 95 % confidence band around the trend. */
  band?: boolean;
  trendLabel?: string;
  /** Plot height in px, without the axis labels. */
  height?: number;
  /** Legend above the plot; on by default for several series or a trend. */
  legend?: boolean;
}

const TREND_KEY = '\u0000trend';

/** Points 8 with a 2px surface ring, outliers labelled, optional dashed trend with R² and a confidence band. */
export function ScatterChart({
  series,
  xName = 'X',
  yName = 'Y',
  formatX = number,
  formatY = number,
  formatXTick = axisValue,
  formatYTick = axisValue,
  xUnit,
  trend,
  band = false,
  trendLabel = 'Тренд',
  height = 196,
  legend,
  className,
  'aria-label': label,
  ...props
}: ScatterChartProps) {
  const [ref, width] = useWidth(560);
  const clip = svgId(useId());
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);

  const colored = series.map((item, index) => ({ ...item, color: seriesColor(index, item.color) }));
  const shown = colored.filter((item) => !hidden.has(item.name));
  const all = shown.flatMap((item) => item.points);
  const bottom = TOP + height;
  const yAxis = makeAxis(
    all.map((p) => p.y),
    'linear',
    [bottom, TOP],
  );
  const left = marginFor(yAxis.ticks, formatYTick);
  const right = width - 8;
  const xAxis = makeAxis(
    all.map((p) => p.x),
    'linear',
    [left, right],
  );

  const fitted = shown.filter((item) => item.trend !== false).flatMap((item) => item.points);
  const fit = trend ? fitTrend(fitted, trend) : null;
  const trendShown = fit !== null && !hidden.has(TREND_KEY);
  const trendName = fit ? `${trendLabel}, R² = ${decimal2(fit.r2)}` : trendLabel;

  const marks = shown
    .flatMap((item) => item.points.map((point) => ({ point, item, px: xAxis.at(point.x), py: yAxis.at(point.y), r: point.callout ? 5 : 4 })))
    .sort((a, b) => a.point.x - b.point.x || a.point.y - b.point.y);
  const rank = new Map(marks.map((mark, i) => [mark.point, i]));

  const titleOf = (mark: (typeof marks)[number]) => mark.point.label ?? mark.item.name;
  const describe = (index: number) => {
    const mark = marks[index];
    return mark ? `${titleOf(mark)}: ${xName} ${formatX(mark.point.x)}, ${yName} ${formatY(mark.point.y)}` : '';
  };
  const { active, setActive, spoken, onKeyDown, onBlur } = useStepper(marks.length, describe);
  const current = active !== null ? marks[active] : undefined;

  const curve = (() => {
    if (!fit || fitted.length === 0) return null;
    const xs = fitted.map((p) => p.x);
    const from = Math.min(...xs);
    const to = Math.max(...xs);
    const steps = fit.kind === 'linear' ? 1 : 48;
    const samples = Array.from({ length: steps + 1 }, (_, i) => from + ((to - from) * i) / steps);
    const line = linePath(samples.map((x) => ({ x: xAxis.at(x), y: yAxis.at(fit.at(x)) })));
    const upper = samples.map((x) => ({ x: xAxis.at(x), y: yAxis.at(fit.band(x)[1]) }));
    const lower = samples.map((x) => ({ x: xAxis.at(x), y: yAxis.at(fit.band(x)[0]) })).reverse();
    return { line, area: `${linePath([...upper, ...lower])}Z` };
  })();

  const showLegend = legend ?? (series.length > 1 || trend !== undefined);

  return (
    <div data-slot="scatter-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {showLegend ? (
        <div className="flex flex-wrap justify-end gap-1">
          <ChartLegend items={colored} marker="dot" hidden={hidden} onToggle={toggle} onHover={setHovered} />
          {trend ? (
            <ChartLegend
              items={[{ name: trendName, color: 'var(--color-fg-3)' }]}
              marker="line"
              hidden={hidden.has(TREND_KEY) ? new Set([trendName]) : new Set()}
              onToggle={() => toggle(TREND_KEY)}
            />
          ) : null}
        </div>
      ) : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Точка',
          columns: ['Серия', xName, yName],
          rows: colored.flatMap((item) =>
            item.points.map((point) => ({ header: point.label ?? item.name, cells: [item.name, formatX(point.x), formatY(point.y)] })),
          ),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={width} height={bottom + 28} className="block overflow-visible">
          <defs>
            <clipPath id={clip}>
              <rect x={left} y={TOP} width={Math.max(0, right - left)} height={height} />
            </clipPath>
          </defs>
          <ValueAxis ticks={yAxis.ticks} y={yAxis.at} left={left} right={right} format={formatYTick} />
          <XLabels ticks={xAxis.ticks} x={xAxis.at} y={bottom + 20} width={right - left} format={formatXTick} unit={xUnit} />

          {trendShown && curve ? (
            <g clipPath={`url(#${clip})`}>
              {band ? <path data-slot="scatter-band" d={curve.area} fill="var(--color-fg-3)" fillOpacity={0.12} /> : null}
              <path
                data-slot="scatter-trend"
                data-r2={fit.r2}
                d={curve.line}
                fill="none"
                stroke="var(--color-fg-3)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                className="transition-[clip-path] duration-(--duration-deliberate) ease-out [clip-path:inset(-8px_-8px_-8px_-8px)] starting:[clip-path:inset(-8px_100%_-8px_-8px)]"
              />
            </g>
          ) : null}

          {shown.map((item) => (
            <g key={item.name} opacity={hovered !== null && hovered !== item.name ? 0.3 : 1} className="transition-opacity duration-(--duration-quick)">
              {item.points.map((point, i) => (
                <circle
                  key={i}
                  data-slot="scatter-point"
                  data-label={point.label}
                  data-active={current?.point === point ? 'true' : undefined}
                  cx={xAxis.at(point.x)}
                  cy={yAxis.at(point.y)}
                  r={point.callout ? 5 : 4}
                  fill={item.color}
                  stroke="var(--color-surface-1)"
                  strokeWidth={2}
                  className={POINT_MOTION}
                  style={{ transitionDelay: `${Math.min(400, (rank.get(point) ?? 0) * 8)}ms` }}
                />
              ))}
              {item.points.map((point, i) => {
                if (!point.callout || !point.label) return null;
                const px = xAxis.at(point.x);
                const end = px > left + (right - left) * 0.6;
                return (
                  <text
                    key={`c${i}`}
                    data-slot="scatter-callout"
                    x={end ? px - 10 : px + 10}
                    y={yAxis.at(point.y) + 4}
                    textAnchor={end ? 'end' : 'start'}
                    className="fill-fg-1 text-caption font-semibold"
                  >
                    {point.label}
                  </text>
                );
              })}
            </g>
          ))}

          {current ? <circle cx={current.px} cy={current.py} r={current.r + 3} fill="none" stroke={current.item.color} strokeWidth={2} /> : null}

          <rect
            data-slot="chart-overlay"
            x={left - 8}
            y={TOP - 8}
            width={Math.max(0, right - left + 16)}
            height={height + 16}
            fill="transparent"
            onPointerMove={(event) => setActive(nearestMark(marks, pointerIn(event), 24))}
            onPointerDown={(event) => setActive(nearestMark(marks, pointerIn(event), 24))}
            onPointerLeave={() => setActive(null)}
          />
        </svg>

        {current ? (
          <ChartTooltip
            x={current.px}
            y={Math.max(4, current.py - 64)}
            width={width}
            title={markTitle(current.item.color, titleOf(current))}
            rows={[
              { name: xName, value: formatX(current.point.x) },
              { name: yName, value: formatY(current.point.y) },
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Bubble ---------- */

export interface BubblePoint {
  label: string;
  x: number;
  y: number;
  /** Third value, shown by area. */
  size: number;
}

export interface BubbleSeries {
  name: string;
  points: readonly BubblePoint[];
  color?: string;
}

export interface BubbleChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  series: readonly BubbleSeries[];
  xScale?: 'linear' | 'log';
  yScale?: 'linear' | 'log';
  xName?: string;
  yName?: string;
  /** What the area means: «Выручка». */
  sizeName?: string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  formatSize?: (value: number) => string;
  formatXTick?: (value: number) => string;
  formatYTick?: (value: number) => string;
  xUnit?: string;
  /** Radius of the largest bubble, px. */
  maxRadius?: number;
  height?: number;
  /** Name and size printed next to each bubble. */
  labels?: boolean;
  /** Three outlined reference sizes. */
  sizeLegend?: boolean;
  legend?: boolean;
}

/** Reference sizes for the scale: about a sixth, half and the whole of the largest value. */
function sizeSteps(max: number): number[] {
  const round = (value: number, digits: number) => (value > 0 ? Number(value.toPrecision(digits)) : 0);
  return [round(max / 6, 1), round(max / 2, 1), round(max, 2)].filter((value, i, all) => value > 0 && all.indexOf(value) === i);
}

interface SizeLegendProps {
  values: readonly number[];
  max: number;
  maxRadius: number;
  /** Right edge of the largest circle. */
  right: number;
  top: number;
  title: string;
  format: (value: number) => string;
}

/** Outlined circles fg-3 1,5 standing on one line, values under them, the name on the left. */
function SizeLegend({ values, max, maxRadius, right, top, title, format }: SizeLegendProps) {
  const radii = values.map((value) => bubbleRadius(value, max, maxRadius));
  const base = top + 2 * Math.max(0, ...radii);
  const centres: number[] = [];
  let edge = right;
  for (let i = radii.length - 1; i >= 0; i -= 1) {
    // a circle narrower than its label is spaced by the label
    const half = Math.max(radii[i] ?? 0, 18);
    centres[i] = edge - half;
    edge -= 2 * half + 12;
  }
  return (
    <g data-slot="bubble-size-legend">
      <text x={edge + 2} y={top + 12} textAnchor="end" className="fill-fg-2 text-caption">
        {title}
      </text>
      {values.map((value, i) => (
        <g key={value}>
          <circle cx={centres[i]} cy={base - (radii[i] ?? 0)} r={radii[i]} fill="none" stroke="var(--color-fg-3)" strokeWidth={1.5} />
          <text x={centres[i]} y={base + 16} textAnchor="middle" className="fill-fg-3 text-[11px] tabular-nums">
            {format(value)}
          </text>
        </g>
      ))}
    </g>
  );
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const coversCircle = (box: Box, cx: number, cy: number, r: number) =>
  Math.hypot(cx - Math.max(box.x0, Math.min(cx, box.x1)), cy - Math.max(box.y0, Math.min(cy, box.y1))) < r;
// shortcut: text width estimated at 7px a character of 12px Inter; measuring would need a layout pass
const textWidth = (text: string) => Math.ceil(text.length * 7);

/** Room the size scale takes, so bubble labels stay off it. */
function sizeLegendBox(values: readonly number[], max: number, maxRadius: number, right: number, top: number, title: string): Box {
  const circles = values.reduce((sum, value) => sum + 2 * Math.max(bubbleRadius(value, max, maxRadius), 18) + 12, 0);
  return { x0: right - circles - textWidth(title), y0: top, x1: right, y1: top + 2 * maxRadius + 20 };
}

interface LabelPlace {
  x: number;
  /** Baseline of the first line. */
  y: number;
  anchor: 'start' | 'end' | 'middle';
  box: Box;
}

/** Greedy placement, biggest bubble first: right, left, below, above — the first spot clear of labels, other bubbles and the frame; none fits, no label (the tooltip still has it). */
function placeBubbleLabels(
  marks: readonly { px: number; py: number; r: number; lines: readonly [string, string] }[],
  frame: Box,
  obstacles: readonly Box[],
): (LabelPlace | null)[] {
  const taken: Box[] = [...obstacles];
  return marks.map((mark, index) => {
    const w = Math.max(...mark.lines.map(textWidth));
    const h = 30;
    const raw: LabelPlace[] = [
      { x: mark.px + mark.r + 6, y: mark.py - 2, anchor: 'start', box: { x0: mark.px + mark.r + 6, y0: mark.py - 14, x1: mark.px + mark.r + 6 + w, y1: mark.py - 14 + h } },
      { x: mark.px - mark.r - 6, y: mark.py - 2, anchor: 'end', box: { x0: mark.px - mark.r - 6 - w, y0: mark.py - 14, x1: mark.px - mark.r - 6, y1: mark.py - 14 + h } },
      { x: mark.px, y: mark.py + mark.r + 16, anchor: 'middle', box: { x0: mark.px - w / 2, y0: mark.py + mark.r + 4, x1: mark.px + w / 2, y1: mark.py + mark.r + 4 + h } },
      { x: mark.px, y: mark.py - mark.r - 22, anchor: 'middle', box: { x0: mark.px - w / 2, y0: mark.py - mark.r - 34, x1: mark.px + w / 2, y1: mark.py - mark.r - 34 + h } },
    ];
    const candidates = raw.map((place) => ({
      ...place,
      box: { x0: Math.round(place.box.x0), y0: Math.round(place.box.y0), x1: Math.round(place.box.x1), y1: Math.round(place.box.y1) },
    }));
    const place = candidates.find(
      ({ box }) =>
        box.x0 >= frame.x0 &&
        box.x1 <= frame.x1 &&
        box.y0 >= frame.y0 &&
        box.y1 <= frame.y1 &&
        taken.every((other) => !overlaps(box, other)) &&
        marks.every((other, i) => i === index || !coversCircle(box, other.px, other.py, other.r)),
    );
    if (!place) return null;
    taken.push(place.box);
    return place;
  });
}

/** Three values at once: position on two (often log) axes and area. Largest bubbles first, small ones on top. */
export function BubbleChart({
  series,
  xScale = 'linear',
  yScale = 'linear',
  xName = 'X',
  yName = 'Y',
  sizeName = 'Размер',
  formatX = number,
  formatY = number,
  formatSize = axisValue,
  formatXTick = axisValue,
  formatYTick = axisValue,
  xUnit,
  maxRadius: radiusLimit = 32,
  height = 260,
  labels = true,
  sizeLegend = true,
  legend,
  className,
  'aria-label': label,
  ...props
}: BubbleChartProps) {
  const [ref, width] = useWidth(560);
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);

  const colored = series.map((item, index) => ({ ...item, color: seriesColor(index, item.color) }));
  const shown = colored.filter((item) => !hidden.has(item.name));
  const all = shown.flatMap((item) => item.points);
  // sizes stay put when a series is hidden: the scale covers every bubble
  const maxSize = Math.max(0, ...colored.flatMap((item) => item.points.map((p) => p.size)));
  const bottom = TOP + height;
  const yAxis = makeAxis(
    all.map((p) => p.y),
    yScale,
    [bottom, TOP],
  );
  const left = marginFor(yAxis.ticks, formatYTick);
  const right = width - 8;
  const xAxis = makeAxis(
    all.map((p) => p.x),
    xScale,
    [left, right],
  );
  // on a narrow plot the largest bubble shrinks so the picture keeps its gaps
  const maxRadius = Math.min(radiusLimit, Math.max(12, (right - left) / 12));
  const steps = sizeSteps(maxSize);
  const legendInside = sizeLegend && right - left >= 520;

  const marks = shown
    .flatMap((item) =>
      item.points.map((point) => ({ point, item, px: xAxis.at(point.x), py: yAxis.at(point.y), r: bubbleRadius(point.size, maxSize, maxRadius) })),
    )
    .sort((a, b) => b.r - a.r);
  const order = marks.map((_, i) => i).sort((a, b) => (marks[a]?.point.x ?? 0) - (marks[b]?.point.x ?? 0));
  const describe = (step: number) => {
    const mark = marks[order[step] ?? -1];
    return mark
      ? `${mark.point.label}: ${xName} ${formatX(mark.point.x)}, ${yName} ${formatY(mark.point.y)}, ${sizeName} ${formatSize(mark.point.size)}`
      : '';
  };
  const stepper = useStepper(marks.length, describe);
  const current = stepper.active !== null ? marks[order[stepper.active] ?? -1] : undefined;
  const pick = (event: PointerEvent<SVGRectElement>) => {
    const at = pointerIn(event);
    // the last bubble under the pointer is the smallest one, drawn on top
    let index: number | null = null;
    marks.forEach((mark, i) => {
      if (Math.hypot(mark.px - at.x, mark.py - at.y) <= mark.r) index = i;
    });
    const found = index ?? nearestMark(marks, at, 12);
    stepper.setActive(found === null ? null : order.indexOf(found));
  };
  const dim = (name: string) => (hovered !== null && hovered !== name ? 0.3 : 1);

  return (
    <div data-slot="bubble-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? series.length > 1) ? <ChartLegend items={colored} marker="dot" hidden={hidden} onToggle={toggle} onHover={setHovered} /> : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Точка',
          columns: ['Серия', xName, yName, sizeName],
          rows: colored.flatMap((item) =>
            item.points.map((point) => ({ header: point.label, cells: [item.name, formatX(point.x), formatY(point.y), formatSize(point.size)] })),
          ),
        }}
        spoken={stepper.spoken}
        onKeyDown={stepper.onKeyDown}
        onBlur={stepper.onBlur}
      >
        <svg aria-hidden width={width} height={bottom + 28} className="block overflow-visible">
          <ValueAxis ticks={yAxis.ticks} y={yAxis.at} left={left} right={right} format={formatYTick} />
          <XLabels ticks={xAxis.ticks} x={xAxis.at} y={bottom + 20} width={right - left} format={formatXTick} unit={xUnit} grid={[TOP, bottom]} />

          {marks.map((mark, i) => (
            <circle
              key={`${mark.item.name}-${mark.point.label}-${i}`}
              data-slot="bubble"
              data-label={mark.point.label}
              data-active={current === mark ? 'true' : undefined}
              cx={mark.px}
              cy={mark.py}
              r={mark.r}
              fill={mark.item.color}
              stroke={current === mark ? 'var(--color-fg-1)' : 'var(--color-surface-1)'}
              strokeWidth={2}
              opacity={dim(mark.item.name)}
              className={POINT_MOTION}
              style={{ transitionDelay: `${Math.min(400, i * 30)}ms` }}
            />
          ))}

          {labels
            ? placeBubbleLabels(
                marks.map((mark) => ({ ...mark, lines: [mark.point.label, formatSize(mark.point.size)] as const })),
                { x0: left, y0: TOP - 8, x1: width, y1: bottom + 8 },
                legendInside ? [sizeLegendBox(steps, maxSize, maxRadius, right - 2, TOP + 6, sizeName)] : [],
              ).map((place, i) => {
                const mark = marks[i];
                if (!place || !mark) return null;
                return (
                  <g
                    key={`l${i}`}
                    data-slot="bubble-label"
                    data-label={mark.point.label}
                    data-box={`${place.box.x0} ${place.box.y0} ${place.box.x1} ${place.box.y1}`}
                    textAnchor={place.anchor}
                    opacity={dim(mark.item.name)}
                    className="transition-opacity duration-(--duration-quick)"
                  >
                    <text x={place.x} y={place.y} className="fill-fg-1 text-caption font-semibold">
                      {mark.point.label}
                    </text>
                    <text x={place.x} y={place.y + 15} className="fill-fg-2 text-caption tabular-nums">
                      {formatSize(mark.point.size)}
                    </text>
                  </g>
                );
              })
            : null}

          {legendInside ? (
            <SizeLegend values={steps} max={maxSize} maxRadius={maxRadius} right={right - 2} top={TOP + 6} title={sizeName} format={formatSize} />
          ) : null}

          <rect
            data-slot="chart-overlay"
            x={left - maxRadius}
            y={TOP - maxRadius}
            width={Math.max(0, right - left + 2 * maxRadius)}
            height={height + 2 * maxRadius}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => stepper.setActive(null)}
          />
        </svg>

        {current ? (
          <ChartTooltip
            x={current.px + current.r}
            y={Math.max(4, current.py - 64)}
            width={width}
            title={markTitle(current.item.color, current.point.label)}
            rows={[
              { name: xName, value: formatX(current.point.x) },
              { name: yName, value: formatY(current.point.y) },
              { name: sizeName, value: formatSize(current.point.size) },
            ]}
          />
        ) : null}
      </ChartPlot>
      {sizeLegend && !legendInside && steps.length > 0 ? (
        <svg aria-hidden width={width} height={2 * maxRadius + 22} className="block overflow-visible">
          <SizeLegend values={steps} max={maxSize} maxRadius={maxRadius} right={width - 2} top={0} title={sizeName} format={formatSize} />
        </svg>
      ) : null}
    </div>
  );
}

/* ---------- Heat and correlation matrices ---------- */

interface MatrixCell {
  value: number;
  level: number;
  fill: string;
  /** Text inside the cell (correlation r). */
  text?: string;
  /** Strong fills take dark text in the dark theme too. */
  strong?: boolean;
}

interface MatrixGridProps {
  slot: string;
  label: string;
  rows: readonly string[];
  columns: readonly string[];
  cells: readonly (readonly MatrixCell[])[];
  formatValue: (value: number) => string;
  /** Name of the value in the tooltip. */
  valueName: string;
  legendTitle?: string;
  legend: readonly { label: string; fill: string }[];
  /** Square cells up to 64, for correlation matrices. */
  square?: boolean;
  cellHeight: number;
  className?: string;
  rest: Omit<ComponentProps<'div'>, 'children'>;
}

const GAP = 2;

/** The label cut with «…» to `room` px at 11px; the full one stays in the rows, tooltip and table. */
function fitText(text: string, room: number): string {
  const fits = Math.floor(room / 6.4);
  return text.length <= fits ? text : `${text.slice(0, Math.max(1, fits - 1))}…`;
}

function MatrixGrid({ slot, label, rows, columns, cells, formatValue, valueName, legendTitle, legend, square, cellHeight, className, rest }: MatrixGridProps) {
  const [ref, width] = useWidth(560);
  const [active, setActive] = useState<{ row: number; column: number } | null>(null);
  const [spoken, setSpoken] = useState('');
  const n = columns.length;
  const labelWidth = Math.max(32, Math.ceil(12 + 7 * Math.max(0, ...rows.map((row) => row.length))));
  const fitWidth = n > 0 ? (width - labelWidth + GAP) / n - GAP : 0;
  const cellWidth = square ? Math.max(12, Math.min(64, fitWidth)) : Math.max(4, fitWidth);
  const cellH = square ? cellWidth : cellHeight;
  const top = 22;
  const x = (column: number) => labelWidth + column * (cellWidth + GAP);
  const y = (row: number) => top + row * (cellH + GAP);
  const labelStride = square ? 1 : Math.max(1, Math.ceil(44 / (cellWidth + GAP)));
  const cellAt = (row: number, column: number) => cells[row]?.[column];
  const textOf = (cell: MatrixCell) => cell.text ?? formatValue(cell.value);
  const describe = (row: number, column: number) => {
    const cell = cellAt(row, column);
    return cell ? `${rows[row] ?? ''}, ${columns[column] ?? ''}: ${textOf(cell)}` : '';
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const column = stepIndex(event.key, active?.column ?? null, n);
    let next: { row: number; column: number } | null = null;
    if (column !== null) next = { row: active?.row ?? 0, column };
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      next = { row: active ? Math.min(rows.length - 1, Math.max(0, active.row + delta)) : 0, column: active?.column ?? 0 };
    }
    if (!next || rows.length === 0) return;
    event.preventDefault();
    setActive(next);
    setSpoken(describe(next.row, next.column));
  };

  const current = active ? cellAt(active.row, active.column) : undefined;

  return (
    <div data-slot={slot} className={cn('flex flex-col gap-3', className)} {...rest}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: '',
          columns,
          rows: rows.map((row, r) => ({
            header: row,
            cells: columns.map((_, c) => {
              const cell = cellAt(r, c);
              return cell ? textOf(cell) : '';
            }),
          })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg aria-hidden width={width} height={y(rows.length) - GAP + 2} className="block overflow-visible">
          {columns.map((column, c) =>
            c % labelStride === 0 ? (
              <text key={column} x={x(c) + cellWidth / 2} y={12} textAnchor="middle" className="fill-fg-3 text-[11px]">
                {fitText(column, cellWidth + GAP)}
              </text>
            ) : null,
          )}
          {rows.map((row, r) => (
            <text key={row} x={0} y={y(r) + cellH / 2} dominantBaseline="middle" className="fill-fg-3 text-caption">
              {row}
            </text>
          ))}
          {rows.map((_, r) =>
            columns.map((__, c) => {
              const cell = cellAt(r, c);
              if (!cell) return null;
              const on = active?.row === r && active.column === c;
              return (
                <g key={`${r}:${c}`}>
                  <rect
                    data-slot="heat-matrix-cell"
                    data-level={cell.level}
                    data-value={cell.value}
                    data-active={on ? 'true' : undefined}
                    x={x(c)}
                    y={y(r)}
                    width={cellWidth}
                    height={cellH}
                    rx={3}
                    fill={cell.fill}
                    stroke={on ? 'var(--color-fg-1)' : 'none'}
                    strokeWidth={2}
                    onPointerEnter={() => setActive({ row: r, column: c })}
                    onPointerLeave={() => setActive(null)}
                    className="transition-opacity duration-(--duration-slow) ease-standard starting:opacity-0"
                    style={{ transitionDelay: `${Math.min(400, c * 20 + r * 10)}ms` }}
                  />
                  {cell.text !== undefined ? (
                    <text
                      x={x(c) + cellWidth / 2}
                      y={y(r) + cellH / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={cn('pointer-events-none fill-fg-1 text-caption tabular-nums', cell.strong && 'dark:fill-surface-1')}
                    >
                      {cell.text}
                    </text>
                  ) : null}
                </g>
              );
            }),
          )}
        </svg>
        {active && current ? (
          <ChartTooltip
            x={x(active.column) + cellWidth}
            y={y(active.row) + cellH + 4}
            width={width}
            title={`${rows[active.row] ?? ''}, ${columns[active.column] ?? ''}`}
            rows={[{ name: valueName, value: textOf(current), color: current.fill }]}
          />
        ) : null}
      </ChartPlot>
      <ul data-slot="heat-matrix-legend" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-caption text-fg-2" style={{ paddingLeft: labelWidth }}>
        {legendTitle ? <li className="me-3">{legendTitle}</li> : null}
        {legend.map((item) => (
          <li key={item.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-3 shrink-0 rounded-[3px]" style={{ background: item.fill }} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One of five steps: how many inner bounds the value reaches. */
const levelOf = (value: number, bounds: readonly number[]) => Math.min(4, bounds.filter((bound) => value >= bound).length);

/** «до 20 · 20–39 · … · 80+» for whole numbers, «20–40» otherwise; `first` names the lowest step. */
function stepLabels(bounds: readonly number[], first: string, whole: boolean): string[] {
  const span = (from: number, to: number) => {
    const end = whole ? to - 1 : to;
    return end <= from ? number(from) : `${number(from)}–${number(end)}`;
  };
  return [first, ...bounds.slice(1).map((bound, i) => span(bounds[i] ?? 0, bound)), `${number(bounds[bounds.length - 1] ?? 0)}+`];
}

export interface HeatMatrixChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  /** Row labels: «Пн», «Вт». */
  rows: readonly string[];
  /** Column labels: «8:00», «9:00». */
  columns: readonly string[];
  /** values[row][column]. */
  values: readonly (readonly number[])[];
  /** Four inner bounds of the five steps seq-1…5 (default: round steps of the maximum). */
  thresholds?: readonly number[];
  /** Name of the value for the legend and the tooltip: «Заказов в час». */
  legendTitle?: string;
  formatValue?: (value: number) => string;
  /** Cell height, px; the width follows the container. */
  cellHeight?: number;
}

/** Rows × columns of cells 22 high with 2px gaps and r3, coloured by five threshold steps; the legend lists the bounds. */
export function HeatMatrixChart({
  rows,
  columns,
  values,
  thresholds,
  legendTitle,
  formatValue = number,
  cellHeight = 22,
  className,
  'aria-label': label,
  ...props
}: HeatMatrixChartProps) {
  const flat = values.flat();
  const bounds = thresholds ?? niceTicks(Math.max(0, ...flat), 5).slice(1, 5);
  const cells = values.map((row) =>
    row.map((value) => {
      const level = levelOf(value, bounds);
      return { value, level, fill: SEQUENTIAL_COLORS[level] ?? 'currentColor' };
    }),
  );
  const labels = stepLabels(bounds, `до ${number(bounds[0] ?? 0)}`, flat.every(Number.isInteger));
  return (
    <MatrixGrid
      slot="heat-matrix"
      label={label}
      rows={rows}
      columns={columns}
      cells={cells}
      formatValue={formatValue}
      valueName={legendTitle ?? 'Значение'}
      legendTitle={legendTitle}
      legend={labels.map((text, i) => ({ label: text, fill: SEQUENTIAL_COLORS[i] ?? 'currentColor' }))}
      cellHeight={cellHeight}
      className={className}
      rest={props}
    />
  );
}

export interface CorrelationVariable {
  name: string;
  /** Values over the same objects, in the same order for every variable. */
  values: readonly number[];
}

export interface CorrelationMatrixChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  variables: readonly CorrelationVariable[];
}

// |r| ≤ 0,2 is «no relation», 0,2…0,6 weak, above 0,6 strong; the upper bounds are exclusive
const CORRELATION_BOUNDS = [-0.6, -0.2, 0.2 + 1e-9, 0.6 + 1e-9];
const CORRELATION_LEGEND = ['сильная обратная', 'слабая обратная', 'нет связи', 'слабая прямая', 'сильная прямая'];

/** Pearson r for every pair of measures in square cells on the diverging scale, the value printed inside. */
export function CorrelationMatrixChart({ variables, className, 'aria-label': label, ...props }: CorrelationMatrixChartProps) {
  const matrix = correlationMatrix(variables.map((variable) => variable.values));
  const names = variables.map((variable) => variable.name);
  const cells = matrix.map((row, i) =>
    row.map((r, j): MatrixCell => {
      if (i === j) return { value: 1, level: 4, fill: 'var(--color-fill-2)', text: '1' };
      if (Number.isNaN(r)) return { value: r, level: 2, fill: DIVERGING_COLORS[2] ?? 'currentColor', text: '—' };
      const level = levelOf(r, CORRELATION_BOUNDS);
      return { value: r, level, fill: DIVERGING_COLORS[level] ?? 'currentColor', text: decimal2(r), strong: level === 0 || level === 4 };
    }),
  );
  return (
    <MatrixGrid
      slot="correlation-matrix"
      label={label}
      rows={names}
      columns={names}
      cells={cells}
      formatValue={decimal2}
      valueName="Корреляция r"
      legendTitle="Корреляция"
      legend={CORRELATION_LEGEND.map((text, i) => ({ label: text, fill: DIVERGING_COLORS[i] ?? 'currentColor' }))}
      square
      cellHeight={0}
      className={className}
      rest={props}
    />
  );
}

/* ---------- Hexbin ---------- */

export interface HexbinAnnotation {
  /** Point the leader starts from, in data units. */
  x: number;
  y: number;
  /** Where the label starts, in data units. */
  labelX: number;
  labelY: number;
  title: string;
  note?: string;
}

export interface HexbinChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  points: readonly Point[];
  /** Hexagon circumradius, px: 12 is 24 tall. */
  radius?: number;
  /** Four inner bounds of the five steps (default: doublings of a round step near max/16). */
  thresholds?: readonly number[];
  xName?: string;
  yName?: string;
  /** What a point is, for the tooltip: «Заказов». */
  countName?: string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  formatXTick?: (value: number) => string;
  formatYTick?: (value: number) => string;
  xUnit?: string;
  height?: number;
  annotations?: readonly HexbinAnnotation[];
}

/** Round bounds s, 2s, 4s, 8s with s a 1-2-5 step near max/16, at least 2. */
function hexThresholds(max: number): number[] {
  const raw = max / 16;
  const power = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const step = Math.max(2, [1, 2, 5, 10].map((m) => m * power).find((candidate) => candidate >= raw) ?? 2);
  return [step, 2 * step, 4 * step, 8 * step];
}

/** Scatter for thousands of points: counts in hexagons 24 tall with a 1,6px gap, five steps seq-1…5, empty hexagons not drawn. */
export function HexbinChart({
  points,
  radius = 12,
  thresholds,
  xName = 'X',
  yName = 'Y',
  countName = 'Точек',
  formatX = number,
  formatY = number,
  formatXTick = axisValue,
  formatYTick = axisValue,
  xUnit,
  height = 300,
  annotations = [],
  className,
  'aria-label': label,
  ...props
}: HexbinChartProps) {
  const [ref, width] = useWidth(560);
  const bottom = TOP + height;
  const yAxis = makeAxis(
    points.map((p) => p.y),
    'linear',
    [bottom, TOP],
  );
  const left = marginFor(yAxis.ticks, formatYTick);
  const right = width - 8;
  const xAxis = makeAxis(
    points.map((p) => p.x),
    'linear',
    [left, right],
  );
  // bins live in plot pixels so every hexagon is the same size on screen
  const bins = hexBins(
    points.map((p) => ({ x: xAxis.at(p.x) - left, y: yAxis.at(p.y) - TOP })),
    radius,
  )
    .map((bin) => ({ ...bin, cx: bin.x + left, cy: bin.y + TOP }))
    .sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  const byKey = new Map(bins.map((bin, i) => [`${bin.x}:${bin.y}`, i]));
  const bounds = thresholds ?? hexThresholds(Math.max(0, ...bins.map((bin) => bin.count)));
  const firstTop = (bounds[0] ?? 2) - 1;
  const legend = stepLabels(bounds, firstTop <= 1 ? '1' : `1–${firstTop}`, true);

  const where = (bin: { cx: number; cy: number }) => `${xName} ≈ ${formatX(xAxis.invert(bin.cx))} · ${yName} ≈ ${formatY(yAxis.invert(bin.cy))}`;
  const describe = (index: number) => {
    const bin = bins[index];
    return bin ? `${countName} ${number(bin.count)}: ${where(bin)}` : '';
  };
  const stepper = useStepper(bins.length, describe);
  const current = stepper.active !== null ? bins[stepper.active] : undefined;
  const pick = (event: PointerEvent<SVGRectElement>) => {
    const at = pointerIn(event);
    const cell = hexCell(at.x - left, at.y - TOP, radius);
    stepper.setActive(byKey.get(`${cell.x}:${cell.y}`) ?? null);
  };
  const drawn = radius - 0.8;
  const round1 = (value: number) => Math.round(value * 10) / 10;
  const hexPath = (cx: number, cy: number) => {
    const half = round1((Math.sqrt(3) / 2) * drawn);
    return `M${cx} ${round1(cy - drawn)}l${half} ${drawn / 2}v${drawn}l${-half} ${drawn / 2}l${-half} ${-drawn / 2}v${-drawn}Z`;
  };

  return (
    <div data-slot="hexbin-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      <ul data-slot="hexbin-legend" className="flex flex-wrap justify-end gap-x-4 gap-y-1">
        {legend.map((text, i) => (
          <li key={text} className="inline-flex h-7 items-center gap-2 text-label-sm text-fg-2">
            <LegendMarker kind="square" color={SEQUENTIAL_COLORS[i] ?? 'currentColor'} />
            {text}
          </li>
        ))}
      </ul>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Ячейка',
          columns: [xName, yName, countName],
          rows: bins.map((bin, i) => ({
            header: String(i + 1),
            cells: [`≈ ${formatX(xAxis.invert(bin.cx))}`, `≈ ${formatY(yAxis.invert(bin.cy))}`, number(bin.count)],
          })),
        }}
        spoken={stepper.spoken}
        onKeyDown={stepper.onKeyDown}
        onBlur={stepper.onBlur}
      >
        <svg aria-hidden width={width} height={bottom + 28} className="block overflow-visible">
          <ValueAxis ticks={yAxis.ticks} y={yAxis.at} left={left} right={right} format={formatYTick} />
          <XLabels ticks={xAxis.ticks} x={xAxis.at} y={bottom + 20} width={right - left} format={formatXTick} unit={xUnit} />
          {bins.map((bin, i) => {
            const level = levelOf(bin.count, bounds);
            const on = current === bin;
            return (
              <path
                key={`${bin.x}:${bin.y}`}
                data-slot="hexbin-cell"
                data-count={bin.count}
                data-level={level}
                data-cx={round1(bin.cx)}
                data-cy={round1(bin.cy)}
                data-active={on ? 'true' : undefined}
                d={hexPath(round1(bin.cx), round1(bin.cy))}
                fill={SEQUENTIAL_COLORS[level]}
                stroke={on ? 'var(--color-fg-1)' : 'none'}
                strokeWidth={1.5}
                className="transition-opacity duration-(--duration-slow) ease-standard starting:opacity-0"
                style={{ transitionDelay: `${Math.round((i / Math.max(1, bins.length)) * 400)}ms` }}
              />
            );
          })}
          {annotations.map((note) => {
            const px = round1(xAxis.at(note.x));
            const py = round1(yAxis.at(note.y));
            const ly = round1(yAxis.at(note.labelY));
            const wanted = round1(xAxis.at(note.labelX));
            // past the right edge the label is mirrored around the leader and ends at it
            // a note longer than the plot is dropped on narrow screens; the title stays
            const detail = note.note && textWidth(note.note) <= right - left ? note.note : undefined;
            const span = Math.max(textWidth(note.title) * 1.1, textWidth(detail ?? ''));
            const mirrored = round1(2 * px - wanted);
            // past the right edge the label is mirrored around the leader; when neither side fits it is pulled inside the plot
            const flip = wanted + span > width && mirrored - span >= 0;
            const lx = flip ? mirrored : round1(Math.max(left, Math.min(wanted, width - span)));
            const anchor = flip ? 'end' : 'start';
            return (
              <g key={note.title} data-slot="hexbin-annotation">
                <path d={`M${px} ${py}V${ly}H${round1(flip ? lx + 6 : lx - 6)}`} fill="none" stroke="var(--color-fg-3)" />
                <text x={lx} y={ly - 2} textAnchor={anchor} className="fill-fg-1 text-[13px] font-semibold">
                  {note.title}
                </text>
                {detail ? (
                  <text x={lx} y={ly + 14} textAnchor={anchor} className="fill-fg-2 text-caption">
                    {detail}
                  </text>
                ) : null}
              </g>
            );
          })}
          <rect
            data-slot="chart-overlay"
            x={left - radius}
            y={TOP - radius}
            width={Math.max(0, right - left + 2 * radius)}
            height={height + 2 * radius}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => stepper.setActive(null)}
          />
        </svg>
        {current ? (
          <ChartTooltip
            x={current.cx}
            y={Math.max(4, current.cy - 64)}
            width={width}
            title={where(current)}
            marker="square"
            rows={[{ name: countName, value: number(current.count), color: SEQUENTIAL_COLORS[levelOf(current.count, bounds)] }]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Quadrant 2×2 ---------- */

export type QuadrantId = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export interface QuadrantPoint {
  label: string;
  x: number;
  y: number;
  /** Side of the label (default: right, left near the right edge). */
  labelSide?: 'left' | 'right';
}

export interface QuadrantChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  points: readonly QuadrantPoint[];
  /** Vertical divider: a target value (default: the median x). */
  xSplit?: number;
  /** Horizontal divider (default: the median y). */
  ySplit?: number;
  /** Names in the corners: «Звёзды», «Пересмотреть». */
  quadrants?: Partial<Record<QuadrantId, string>>;
  /** The quadrant the chart is about: its points chart-1, the rest fg-4. */
  focus?: QuadrantId;
  xName?: string;
  yName?: string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  formatXTick?: (value: number) => string;
  formatYTick?: (value: number) => string;
  height?: number;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? (sorted[middle] ?? 0) : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

/** Decisions per object: two dividers fg-3 1,5 at medians or targets, quadrant names fg-3 in the corners, every point labelled. */
export function QuadrantChart({
  points,
  xSplit,
  ySplit,
  quadrants = {},
  focus,
  xName = 'X',
  yName = 'Y',
  formatX = number,
  formatY = number,
  formatXTick = axisValue,
  formatYTick = axisValue,
  height = 220,
  className,
  'aria-label': label,
  ...props
}: QuadrantChartProps) {
  const [ref, width] = useWidth(560);
  const splitX = xSplit ?? median(points.map((p) => p.x));
  const splitY = ySplit ?? median(points.map((p) => p.y));
  const bottom = TOP + height;
  const yAxis = makeAxis([...points.map((p) => p.y), splitY], 'linear', [bottom, TOP]);
  const left = marginFor(yAxis.ticks, formatYTick);
  const right = width - 8;
  const xAxis = makeAxis([...points.map((p) => p.x), splitX], 'linear', [left, right]);
  const quadrantOf = (p: QuadrantPoint): QuadrantId => `${p.y >= splitY ? 'top' : 'bottom'}${p.x >= splitX ? 'Right' : 'Left'}`;
  const isFocused = (quadrant: QuadrantId) => focus === undefined || focus === quadrant;

  const marks = points
    .map((point) => ({ point, quadrant: quadrantOf(point), px: xAxis.at(point.x), py: yAxis.at(point.y), r: 5 }))
    .sort((a, b) => a.point.x - b.point.x || a.point.y - b.point.y);
  const describe = (index: number) => {
    const mark = marks[index];
    if (!mark) return '';
    const name = quadrants[mark.quadrant];
    return `${mark.point.label}: ${xName} ${formatX(mark.point.x)}, ${yName} ${formatY(mark.point.y)}${name ? ` — ${name}` : ''}`;
  };
  const stepper = useStepper(marks.length, describe);
  const current = stepper.active !== null ? marks[stepper.active] : undefined;
  const dividerX = xAxis.at(splitX);
  const dividerY = yAxis.at(splitY);
  const corners: readonly { id: QuadrantId; x: number; y: number; anchor: 'start' | 'end' }[] = [
    { id: 'topLeft', x: left + 8, y: TOP + 16, anchor: 'start' },
    { id: 'topRight', x: right - 8, y: TOP + 16, anchor: 'end' },
    { id: 'bottomLeft', x: left + 8, y: bottom - 8, anchor: 'start' },
    { id: 'bottomRight', x: right - 8, y: bottom - 8, anchor: 'end' },
  ];
  const tooltipRows = (mark: (typeof marks)[number]): ChartTooltipRow[] => {
    const name = quadrants[mark.quadrant];
    return [
      { name: xName, value: formatX(mark.point.x) },
      { name: yName, value: formatY(mark.point.y) },
      ...(name ? [{ name: 'Квадрант', value: name }] : []),
    ];
  };
  const pick = (event: PointerEvent<SVGRectElement>) => stepper.setActive(nearestMark(marks, pointerIn(event), 24));

  return (
    <div data-slot="quadrant-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Объект',
          columns: [xName, yName, 'Квадрант'],
          rows: points.map((point) => ({ header: point.label, cells: [formatX(point.x), formatY(point.y), quadrants[quadrantOf(point)] ?? ''] })),
        }}
        spoken={stepper.spoken}
        onKeyDown={stepper.onKeyDown}
        onBlur={stepper.onBlur}
      >
        <svg aria-hidden width={width} height={bottom + 28} className="block overflow-visible">
          <ValueAxis ticks={yAxis.ticks} y={yAxis.at} left={left} right={right} format={formatYTick} />
          <XLabels ticks={xAxis.ticks} x={xAxis.at} y={bottom + 20} width={right - left} format={formatXTick} />
          <path
            data-slot="quadrant-divider"
            data-x={splitX}
            data-y={splitY}
            d={`M${dividerX} ${TOP}V${bottom}M${left} ${dividerY}H${right}`}
            fill="none"
            stroke="var(--color-fg-3)"
            strokeWidth={1.5}
          />
          {corners.map((corner) =>
            quadrants[corner.id] ? (
              <text key={corner.id} x={corner.x} y={corner.y} textAnchor={corner.anchor} className="fill-fg-3 text-caption font-semibold">
                {quadrants[corner.id]}
              </text>
            ) : null,
          )}
          {points.map((point, i) => {
            const quadrant = quadrantOf(point);
            const focused = isFocused(quadrant);
            const px = xAxis.at(point.x);
            const py = yAxis.at(point.y);
            const side = point.labelSide ?? (px > left + (right - left) * 0.75 ? 'left' : 'right');
            const on = current?.point === point;
            return (
              <g key={`${point.label}-${i}`}>
                <circle
                  data-slot="quadrant-point"
                  data-label={point.label}
                  data-quadrant={quadrant}
                  data-focus={focus !== undefined && focused ? 'true' : undefined}
                  data-active={on ? 'true' : undefined}
                  cx={px}
                  cy={py}
                  r={5}
                  fill={focused ? 'var(--color-chart-1)' : 'var(--color-fg-4)'}
                  stroke="var(--color-surface-1)"
                  strokeWidth={2}
                  className={POINT_MOTION}
                  style={{ transitionDelay: `${Math.min(400, i * 30)}ms` }}
                />
                {on ? <circle cx={px} cy={py} r={8} fill="none" stroke={focused ? 'var(--color-chart-1)' : 'var(--color-fg-3)'} strokeWidth={2} /> : null}
                <text
                  x={side === 'left' ? px - 10 : px + 10}
                  y={py + 4}
                  textAnchor={side === 'left' ? 'end' : 'start'}
                  className={cn('text-caption', focus !== undefined && focused ? 'fill-fg-1 font-semibold' : 'fill-fg-2')}
                >
                  {point.label}
                </text>
              </g>
            );
          })}
          <rect
            data-slot="chart-overlay"
            x={left - 8}
            y={TOP - 8}
            width={Math.max(0, right - left + 16)}
            height={height + 16}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => stepper.setActive(null)}
          />
        </svg>
        {current ? (
          <ChartTooltip
            x={current.px}
            y={Math.max(4, current.py - 72)}
            width={width}
            title={markTitle(isFocused(current.quadrant) ? 'var(--color-chart-1)' : 'var(--color-fg-4)', current.point.label)}
            rows={tooltipRows(current)}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}
