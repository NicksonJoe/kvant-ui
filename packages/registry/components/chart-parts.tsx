import { useId, useMemo, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import {
  CHART_COLORS,
  ChartLegend,
  ChartPlot,
  ChartTooltip,
  LegendMarker,
  arcPath,
  formatAxisValue,
  formatNumber,
  formatPercent,
  fitText,
  measureText,
  polar,
  seriesColor,
  stepIndex,
  svgId,
  useHiddenSeries,
  useWidth,
  type ChartTable,
  type ChartTooltipRow,
  type LegendMarkerKind,
  type Point,
} from '../lib/chart-kit';
import { cn } from '../lib/cn';

/* Parts of a whole: pie, 100 % bars, treemap, sunburst, icicle, waffle, marimekko, Nightingale rose, parliament,
   Venn and Euler, Voronoi treemap, circle packing. Every layout is computed here, deterministically. */

export interface PartDatum {
  label: string;
  value: number;
  /** Default: the chart palette in order. */
  color?: string;
}

export interface GroupedPartDatum {
  label: string;
  value: number;
  /** Colour group: the product line, not the rank. The legend lists and hides groups. */
  group?: string;
}

export interface PartNode {
  label: string;
  /** Used when there are no children; otherwise the children are summed. */
  value?: number;
  color?: string;
  children?: readonly { label: string; value: number }[];
}

export interface PartSeries {
  name: string;
  /** One value per label. */
  values: readonly number[];
  color?: string;
}

interface PartsBaseProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the chart shows; screen readers also get the data as a table. */
  'aria-label': string;
  /** Value format in the tooltip, table and announcements (default: Russian number). */
  formatValue?: (value: number) => string;
}

/* ---------- Shared ground ---------- */

const TAU = Math.PI * 2;
const DIM = 0.3;
const FALLBACK_WIDTH = 604;
const SURFACE = 'var(--color-surface-1)';

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const round = (value: number) => Math.round(value * 10) / 10;
/** Whole percent for labels on the marks: «46 %». */
const wholePercent = (share: number) => `${Math.round(share * 100)} %`;
const fits = (text: string, size: number, room: number, weight = 600) => measureText(text, `${weight} ${size}px Inter, sans-serif`) <= room;
const ofTotal = (value: number, total: number) => (total > 0 ? value / total : 0);
/** Running sums starting at 0: n + 1 edges for n sizes. */
function cumulative(sizes: readonly number[]): number[] {
  const edges = [0];
  for (const size of sizes) edges.push((edges[edges.length - 1] ?? 0) + size);
  return edges;
}

// scale enters once with the chart; opacity is the hover-dimming channel and stays quick
const ENTER = 'transition-[scale,opacity] ease-standard starting:opacity-0';
const enterStyle = (extra: CSSProperties = {}, delay = 0): CSSProperties => ({
  transitionDuration: 'var(--duration-slow), var(--duration-quick)',
  transitionDelay: `${delay}ms, 0ms`,
  ...extra,
});
const RADIAL = `${ENTER} starting:scale-75`;
const POP = `${ENTER} origin-center [transform-box:fill-box] starting:scale-0`;
const SETTLE = `${ENTER} origin-center [transform-box:fill-box] starting:scale-90`;
const GROW_RIGHT = `${ENTER} origin-left [transform-box:fill-box] starting:scale-x-0`;
const GROW_UP = `${ENTER} origin-bottom [transform-box:fill-box] starting:scale-y-0`;
const FADE = 'transition-opacity duration-(--duration-slow) starting:opacity-0';

const LABEL = 'pointer-events-none fill-fg-1 text-label-sm font-semibold';
const LABEL_SM = 'pointer-events-none fill-fg-1 text-caption font-semibold';
const CAPTION = 'pointer-events-none fill-fg-1 text-caption';
const MUTED = 'pointer-events-none fill-fg-2 text-caption';
const TINY = 'pointer-events-none fill-fg-1 text-overline';

/** Ring sector or pie slice; a full turn is drawn as two halves so the arc does not collapse. */
function sector(cx: number, cy: number, inner: number, outer: number, start: number, end: number): string {
  if (end - start >= TAU - 1e-9) return arcPath(cx, cy, inner, outer, start, start + Math.PI) + arcPath(cx, cy, inner, outer, start + Math.PI, end);
  return arcPath(cx, cy, inner, outer, start, end);
}

/** Horizontal bar with its own left and right corner radii. */
function barPath(x: number, y: number, w: number, h: number, left: number, right: number): string {
  const l = Math.max(0, Math.min(left, w / 2, h / 2));
  const r = Math.max(0, Math.min(right, w / 2, h / 2));
  return `M${x + l} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + l}Q${x} ${y + h} ${x} ${y + h - l}V${y + l}Q${x} ${y} ${x + l} ${y}Z`;
}

/** Splits `length` by shares into spans with a 2 px gap between neighbours and none at the ends. */
function spans(shares: readonly number[], start: number, length: number): { from: number; size: number }[] {
  const edges = cumulative(shares).map((edge) => start + edge * length);
  return shares.map((_, i) => {
    const from = (edges[i] ?? 0) + (i > 0 ? 1 : 0);
    const to = (edges[i + 1] ?? 0) - (i < shares.length - 1 ? 1 : 0);
    return { from, size: Math.max(0, to - from) };
  });
}

/** One hoverable, focusable part: where its tooltip goes and what it says. */
interface Mark {
  x: number;
  y: number;
  title: ReactNode;
  rows: readonly ChartTooltipRow[];
  spoken: string;
}

/** Active part from the pointer or ← → Home End, and the announcement of the last key step. */
function useNav() {
  const [index, setIndex] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');
  return {
    spoken,
    clear: () => setIndex(null),
    at: (count: number) => (index !== null && index < count ? index : null),
    keyDown: (marks: readonly Mark[]) => (event: KeyboardEvent<HTMLDivElement>) => {
      const next = stepIndex(event.key, index !== null && index < marks.length ? index : null, marks.length);
      if (next === null) return;
      event.preventDefault();
      setIndex(next);
      setSpoken(marks[next]?.spoken ?? '');
    },
    hover: (i: number) => ({ onPointerEnter: () => setIndex(i), onPointerDown: () => setIndex(i), onPointerLeave: () => setIndex(null) }),
  };
}
type Nav = ReturnType<typeof useNav>;

interface PlotProps {
  plotRef?: Ref<HTMLDivElement>;
  label: string;
  table: ChartTable;
  width: number;
  height: number;
  marks: readonly Mark[];
  nav: Nav;
  marker?: LegendMarkerKind;
  children: ReactNode;
}

/** The focusable plot with its table, the SVG and the tooltip of the active part. */
function Plot({ plotRef, label, table, width, height, marks, nav, marker, children }: PlotProps) {
  const active = nav.at(marks.length);
  const mark = active === null ? undefined : marks[active];
  return (
    <ChartPlot ref={plotRef} aria-label={label} table={table} spoken={nav.spoken} onKeyDown={nav.keyDown(marks)} onBlur={nav.clear}>
      <svg aria-hidden width={width} height={height} className="block overflow-visible">
        {children}
      </svg>
      {mark ? (
        <ChartTooltip x={mark.x} width={width} y={Math.max(0, Math.min(mark.y + 8, height - 72))} title={mark.title} rows={mark.rows} marker={marker} />
      ) : null}
    </ChartPlot>
  );
}

const shareTable = (rows: readonly { label: string; value: number; share: number; group?: string }[], formatValue: (value: number) => string, grouped = false): ChartTable => ({
  rowHeader: 'Часть',
  columns: grouped ? ['Группа', 'Значение', 'Доля'] : ['Значение', 'Доля'],
  rows: rows.map((row) => ({
    header: row.label,
    cells: [...(grouped ? [row.group ?? ''] : []), formatValue(row.value), formatPercent(row.share)],
  })),
});

/** Group names in order of appearance with their palette colours. */
function groupsOf(data: readonly GroupedPartDatum[]) {
  const names = [...new Set(data.flatMap((item) => (item.group ? [item.group] : [])))];
  return { names, color: (group?: string) => (group ? seriesColor(names.indexOf(group)) : (CHART_COLORS[0] ?? 'currentColor')) };
}

interface GroupedItem extends GroupedPartDatum {
  color: string;
  share: number;
}

/** Shown items largest first, with colours and shares of what is shown. */
function groupedItems(data: readonly GroupedPartDatum[], hidden: ReadonlySet<string>) {
  const groups = groupsOf(data);
  const shown = data.filter((item) => item.value > 0 && !(item.group && hidden.has(item.group)));
  const total = sum(shown.map((item) => item.value));
  const items: GroupedItem[] = [...shown]
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ ...item, color: groups.color(item.group), share: ofTotal(item.value, total) }));
  return { groups, items };
}

const groupedMark = (item: GroupedItem, x: number, y: number, formatValue: (value: number) => string): Mark => ({
  x,
  y,
  title: item.label,
  rows: [{ name: item.group ?? item.label, color: item.color, value: `${formatValue(item.value)} · ${formatPercent(item.share)}` }],
  spoken: `${item.label}: ${formatValue(item.value)}, ${formatPercent(item.share)}${item.group ? ` · ${item.group}` : ''}`,
});

interface GroupLegendProps {
  names: readonly string[];
  color: (group: string) => string;
  hidden: ReadonlySet<string>;
  toggle: (name: string) => void;
  onHover: (name: string | null) => void;
}

const GroupLegend = ({ names, color, hidden, toggle, onHover }: GroupLegendProps) => (
  <ChartLegend items={names.map((name) => ({ name, color: color(name) }))} marker="square" hidden={hidden} onToggle={toggle} onHover={onHover} />
);

/* ---------- 43 · Pie ---------- */

export interface PieChartProps extends PartsBaseProps {
  /** Two to four parts of one moment; they are drawn largest first. */
  data: readonly PartDatum[];
}

/** Slices from 12 o’clock clockwise, largest first, separated by the surface; labels outside with a leader line, a list under a narrow pie. */
export function PieChart({ data, formatValue = formatNumber, className, 'aria-label': label, ...props }: PieChartProps) {
  const [ref, width] = useWidth(FALLBACK_WIDTH);
  const nav = useNav();
  const narrow = width < 460;
  const radius = narrow ? Math.max(40, Math.min(110, width / 2 - 8)) : 110;
  const cx = width / 2;
  const cy = narrow ? radius + 8 : 140;
  const height = narrow ? 2 * radius + 16 : 290;

  const total = sum(data.map((item) => Math.max(0, item.value)));
  const sorted = [...data].filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  const starts = cumulative(sorted.map((item) => ofTotal(item.value, total) * TAU));
  const slices = sorted.map((item, index) => {
    const start = starts[index] ?? 0;
    const end = starts[index + 1] ?? TAU;
    return { ...item, color: seriesColor(index, item.color), share: ofTotal(item.value, total), start, end, mid: (start + end) / 2 };
  });
  const marks = slices.map<Mark>((slice) => ({
    ...polar(cx, cy, radius * 0.6, slice.mid),
    title: slice.label,
    rows: [{ name: slice.label, color: slice.color, value: `${formatValue(slice.value)} · ${formatPercent(slice.share)}` }],
    spoken: `${slice.label}: ${formatValue(slice.value)}, ${formatPercent(slice.share)}`,
  }));
  const active = nav.at(marks.length);

  return (
    <div data-slot="parts-chart" data-kind="pie" className={cn('flex flex-col gap-3', className)} {...props}>
      <Plot plotRef={ref} label={label} table={shareTable(slices, formatValue)} width={width} height={height} marks={marks} nav={nav}>
        {slices.map((slice, i) => (
          <path
            key={slice.label}
            data-slot="parts-chart-mark"
            data-label={slice.label}
            data-start={slice.start}
            data-end={slice.end}
            d={sector(cx, cy, 0, radius, slice.start, slice.end)}
            fill={slice.color}
            stroke={SURFACE}
            strokeWidth={2}
            strokeLinejoin="round"
            opacity={active === null || active === i ? 1 : DIM}
            className={RADIAL}
            style={enterStyle({ transformOrigin: `${cx}px ${cy}px` })}
            {...nav.hover(i)}
          />
        ))}
        {narrow
          ? null
          : slices.map((slice) => {
              if (slice.share < 0.02) return null;
              const from = polar(cx, cy, radius - 4, slice.mid);
              const to = polar(cx, cy, radius + 18, slice.mid);
              const right = Math.sin(slice.mid) >= 0;
              const x = to.x + (right ? 6 : -6);
              return (
                <g key={slice.label} className={FADE}>
                  <path data-slot="parts-chart-leader" d={`M${round(from.x)} ${round(from.y)}L${round(to.x)} ${round(to.y)}`} fill="none" stroke="var(--color-fg-3)" />
                  <text x={x} y={to.y - 2} textAnchor={right ? 'start' : 'end'} className={LABEL}>
                    {slice.label}
                  </text>
                  <text x={x} y={to.y + 14} textAnchor={right ? 'start' : 'end'} className={MUTED}>
                    {wholePercent(slice.share)}
                  </text>
                </g>
              );
            })}
      </Plot>
      {narrow ? (
        <ul data-slot="parts-chart-list" className="flex flex-col gap-2">
          {slices.map((slice) => (
            <li key={slice.label} className="flex items-center gap-2 text-body-sm">
              <LegendMarker kind="dot" color={slice.color} />
              <span className="min-w-0 flex-1 truncate text-fg-1">{slice.label}</span>
              <span className="font-semibold text-fg-1 tabular-nums">{formatValue(slice.value)}</span>
              <span className="w-14 text-right text-fg-3 tabular-nums">{formatPercent(slice.share)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ---------- 45 · 100 % bars ---------- */

export interface PercentBarChartProps extends PartsBaseProps {
  /** One row per label: «Москва», «Казань». */
  labels: readonly string[];
  series: readonly PartSeries[];
  /** Legend above; on by default for several series. Clicking a series hides it and the rows re-normalise. */
  legend?: boolean;
}

/** Every row is 100 %: rows 24 high, segments 2 px apart, corners 4 only at the row ends, the share inside wide segments. */
export function PercentBarChart({ labels, series, formatValue = formatNumber, legend, className, 'aria-label': label, ...props }: PercentBarChartProps) {
  const [ref, width] = useWidth(FALLBACK_WIDTH);
  const nav = useNav();
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const colored = series.map((item, i) => ({ ...item, color: seriesColor(i, item.color) }));
  const shown = colored.filter((item) => !hidden.has(item.name));
  const labelWidth = Math.min(128, Math.round(width * 0.3));
  const left = labelWidth + 12;
  const plotW = Math.max(1, width - left);
  const height = labels.length * 36 - 4;

  const rows = labels.map((text, row) => {
    const values = shown.map((item) => Math.max(0, item.values[row] ?? 0));
    const total = sum(values);
    const shares = values.map((value) => ofTotal(value, total));
    const segments = spans(shares, left, plotW).map((span, k) => ({ ...span, item: shown[k], value: values[k] ?? 0, share: shares[k] ?? 0 }));
    return { text, y: 4 + row * 36, segments };
  });
  const marks = rows.map<Mark>((row) => ({
    x: left + plotW * 0.5,
    y: row.y + 24,
    title: row.text,
    rows: row.segments.map((segment) => ({
      name: segment.item?.name ?? '',
      color: segment.item?.color,
      value: `${formatValue(segment.value)} · ${formatPercent(segment.share)}`,
    })),
    spoken: `${row.text}: ${row.segments.map((segment) => `${segment.item?.name ?? ''} ${formatPercent(segment.share)}`).join(', ')}`,
  }));
  const active = nav.at(marks.length);

  return (
    <div data-slot="parts-chart" data-kind="percent-bar" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? series.length > 1) ? <ChartLegend items={colored} marker="square" hidden={hidden} onToggle={toggle} onHover={setHovered} /> : null}
      <Plot
        plotRef={ref}
        label={label}
        table={{
          rowHeader: 'Строка',
          columns: colored.map((item) => item.name),
          rows: labels.map((text, row) => {
            const total = sum(colored.map((item) => item.values[row] ?? 0));
            return { header: text, cells: colored.map((item) => `${formatValue(item.values[row] ?? 0)} (${formatPercent(ofTotal(item.values[row] ?? 0, total))})`) };
          }),
        }}
        width={width}
        height={height}
        marks={marks}
        nav={nav}
      >
        {active !== null ? <rect x={left - 4} y={(rows[active]?.y ?? 0) - 4} width={plotW + 8} height={32} rx={8} className="fill-fill-1" /> : null}
        {rows.map((row, r) => (
          <g key={row.text}>
            <text x={labelWidth} y={row.y + 16} textAnchor="end" className="pointer-events-none fill-fg-2 text-label-sm">
              {fitText(row.text, labelWidth, '400 13px Inter, sans-serif')}
            </text>
            {row.segments.map((segment, k) =>
              segment.size > 0 && segment.item ? (
                <path
                  key={segment.item.name}
                  data-slot="parts-chart-mark"
                  data-row={r}
                  data-series={segment.item.name}
                  data-x={segment.from}
                  data-width={segment.size}
                  data-share={segment.share}
                  d={barPath(segment.from, row.y, segment.size, 24, k === 0 ? 4 : 0, k === row.segments.length - 1 ? 4 : 0)}
                  fill={segment.item.color}
                  opacity={hovered !== null && hovered !== segment.item.name ? DIM : 1}
                  className={GROW_RIGHT}
                  style={enterStyle({}, r * 35)}
                />
              ) : null,
            )}
            {row.segments.map((segment) =>
              segment.item && segment.size >= 40 ? (
                <text key={segment.item.name} x={segment.from + 8} y={row.y + 16} className={cn(LABEL_SM, FADE)}>
                  {wholePercent(segment.share)}
                </text>
              ) : null,
            )}
            <rect x={left} y={row.y - 6} width={plotW} height={36} fill="transparent" {...nav.hover(r)} />
          </g>
        ))}
      </Plot>
    </div>
  );
}

/* ---------- 46 · Treemap ---------- */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Squarified treemap (Bruls, Huizing, van Wijk): rows along the short side while the worst aspect ratio improves. Values sorted descending. */
function squarify(values: readonly number[], box: Rect): Rect[] {
  const total = sum(values);
  const scale = total > 0 ? (box.w * box.h) / total : 0;
  const areas = values.map((value) => value * scale);
  const out: Rect[] = [];
  let { x, y, w, h } = box;
  const worst = (row: readonly number[], side: number) => {
    const s = sum(row);
    const max = Math.max(...row);
    const min = Math.min(...row);
    return s > 0 && min > 0 ? Math.max((side * side * max) / (s * s), (s * s) / (side * side * min)) : Infinity;
  };
  let i = 0;
  while (i < areas.length) {
    const side = Math.min(w, h);
    const row = [areas[i] ?? 0];
    let j = i + 1;
    while (j < areas.length && worst([...row, areas[j] ?? 0], side) <= worst(row, side)) {
      row.push(areas[j] ?? 0);
      j += 1;
    }
    const s = sum(row);
    if (w >= h) {
      const strip = h > 0 ? s / h : 0;
      let top = y;
      for (const area of row) {
        const size = strip > 0 ? area / strip : 0;
        out.push({ x, y: top, w: strip, h: size });
        top += size;
      }
      x += strip;
      w -= strip;
    } else {
      const strip = w > 0 ? s / w : 0;
      let start = x;
      for (const area of row) {
        const size = strip > 0 ? area / strip : 0;
        out.push({ x: start, y, w: size, h: strip });
        start += size;
      }
      y += strip;
      h -= strip;
    }
    i = j;
  }
  return out;
}

export interface TreemapChartProps extends PartsBaseProps {
  data: readonly GroupedPartDatum[];
  /** Plot height, px. */
  height?: number;
  /** Group legend above; on by default for several groups. Clicking a group hides its tiles. */
  legend?: boolean;
}

/** Squarified tiles, largest at the top left, 2 px apart with corners 4; colour is the group, the name and share only where they fit. */
export function TreemapChart({ data, height = 260, formatValue = formatNumber, legend, className, 'aria-label': label, ...props }: TreemapChartProps) {
  const [ref, width] = useWidth(FALLBACK_WIDTH);
  const nav = useNav();
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const { groups, items } = groupedItems(data, hidden);
  const rects = squarify(
    items.map((item) => item.value),
    { x: 0, y: 0, w: width, h: height },
  );
  const rect = (i: number) => rects[i] ?? { x: 0, y: 0, w: 0, h: 0 };
  const marks = items.map((item, i) => groupedMark(item, rect(i).x + rect(i).w / 2, rect(i).y + rect(i).h / 2, formatValue));
  const active = nav.at(marks.length);

  return (
    <div data-slot="parts-chart" data-kind="treemap" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? groups.names.length > 1) ? <GroupLegend names={groups.names} color={groups.color} hidden={hidden} toggle={toggle} onHover={setHovered} /> : null}
      <Plot plotRef={ref} label={label} table={shareTable(items, formatValue, groups.names.length > 0)} width={width} height={height} marks={marks} nav={nav}>
        {items.map((item, i) => {
          const { x, y, w: rw, h: rh } = rect(i);
          const w = Math.max(0, rw - 2);
          const h = Math.max(0, rh - 2);
          const dim = (active !== null && active !== i) || (hovered !== null && hovered !== item.group);
          const named = h >= 44 && fits(item.label, 12, w - 14);
          return (
            <g key={item.label}>
              <rect
                data-slot="parts-chart-mark"
                data-label={item.label}
                data-group={item.group}
                data-value={item.value}
                data-x={x}
                data-y={y}
                data-width={rw}
                data-height={rh}
                x={x + 1}
                y={y + 1}
                width={w}
                height={h}
                rx={Math.min(4, w / 2, h / 2)}
                fill={item.color}
                opacity={dim ? DIM : 1}
                className={SETTLE}
                style={enterStyle({}, i * 30)}
                {...nav.hover(i)}
              />
              {named ? (
                <g className={FADE}>
                  <text x={x + 11} y={y + 21} className={LABEL_SM}>
                    {item.label}
                  </text>
                  <text x={x + 11} y={y + 37} className={CAPTION}>
                    {wholePercent(item.share)}
                  </text>
                </g>
              ) : w >= 30 && h >= 24 ? (
                <text x={x + 8} y={y + 18} className={cn(TINY, 'font-semibold', FADE)}>
                  {wholePercent(item.share)}
                </text>
              ) : null}
            </g>
          );
        })}
      </Plot>
    </div>
  );
}

/* ---------- 47 · Sunburst and 48 · Icicle: two levels of one hierarchy ---------- */

interface Level {
  label: string;
  value: number;
  color: string;
  children: { label: string; value: number }[];
}

function levelsOf(data: readonly PartNode[], hidden: ReadonlySet<string>) {
  const all = data.map<Level>((node, i) => {
    const children = (node.children ?? []).filter((child) => child.value > 0);
    return { label: node.label, color: seriesColor(i, node.color), children, value: children.length > 0 ? sum(children.map((child) => child.value)) : Math.max(0, node.value ?? 0) };
  });
  const shown = all.filter((node) => !hidden.has(node.label) && node.value > 0);
  return { all, shown, total: sum(shown.map((node) => node.value)) };
}

interface HierarchyMark extends Mark {
  depth: 1 | 2;
  label: string;
  name: string;
  parent: Level;
  value: number;
  share: number;
}

/** Depth-first parts: each line, then its products. */
function hierarchyMarks(levels: readonly Level[], total: number, formatValue: (value: number) => string, anchor: (depth: 1 | 2, index: number) => Point): HierarchyMark[] {
  const marks: HierarchyMark[] = [];
  for (const node of levels) {
    for (const [depth, part] of [[1, node] as const, ...node.children.map((child) => [2, child] as const)]) {
      const share = ofTotal(part.value, total);
      const name = depth === 1 ? part.label : `${node.label} · ${part.label}`;
      marks.push({
        ...anchor(depth, marks.length),
        depth,
        label: part.label,
        name,
        parent: node,
        value: part.value,
        share,
        title: name,
        rows: [{ name: part.label, color: node.color, value: `${formatValue(part.value)} · ${formatPercent(share)}` }],
        spoken: `${name}: ${formatValue(part.value)}, ${formatPercent(share)}`,
      });
    }
  }
  return marks;
}

const hierarchyRows = (marks: readonly HierarchyMark[], formatValue: (value: number) => string) =>
  marks.map((mark) => ({ header: mark.name, cells: [formatValue(mark.value), formatPercent(mark.share)] }));

/** The active part, its parent and its children stay lit; the rest dims. */
const litWith = (marks: readonly HierarchyMark[], active: number | null, hovered: string | null) => (mark: HierarchyMark) => {
  if (hovered !== null) return mark.parent.label === hovered;
  const current = active === null ? undefined : marks[active];
  if (!current) return true;
  return current === mark || (current.depth === 1 && mark.parent === current.parent) || (current.depth === 2 && mark.depth === 1 && mark.parent === current.parent);
};

export interface SunburstChartProps extends PartsBaseProps {
  /** Lines with their products; two levels, no more. */
  data: readonly PartNode[];
  /** Number in the centre (default: the value format). */
  formatTotal?: (total: number) => string;
  /** Word under the total: «млн ₽». */
  totalLabel?: string;
  /** Line legend above; on by default for several lines. Clicking a line hides it. */
  legend?: boolean;
}

/** Inner ring — lines, outer — their products in the line’s colour; 4 px between the rings, 2 between sectors, the total in the centre. */
export function SunburstChart({ data, formatValue = formatNumber, formatTotal = formatValue, totalLabel, legend, className, 'aria-label': label, ...props }: SunburstChartProps) {
  const [ref, width] = useWidth(FALLBACK_WIDTH);
  const nav = useNav();
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const { all, shown, total } = levelsOf(data, hidden);
  const wide = width >= 520;
  const R = wide ? 128 : Math.max(48, Math.min(128, width / 2 - 8));
  const k = R / 128;
  const rings = { 1: [42 * k, 82 * k], 2: [86 * k, R] } as const;
  const cx = width / 2;
  const cy = wide ? R + 17 : R + 8;
  const height = wide ? 2 * R + 44 : 2 * R + 16;

  const angles: { start: number; end: number }[] = [];
  let angle = 0;
  for (const node of shown) {
    const start = angle;
    angles.push({ start, end: (angle += ofTotal(node.value, total) * TAU) });
    let inner = start;
    for (const child of node.children) angles.push({ start: inner, end: (inner += ofTotal(child.value, total) * TAU) });
  }
  const span = (i: number) => angles[i] ?? { start: 0, end: 0 };
  const marks = hierarchyMarks(shown, total, formatValue, (depth, i) => {
    const [inner, outer] = rings[depth];
    return polar(cx, cy, (inner + outer) / 2, (span(i).start + span(i).end) / 2);
  });
  const lit = litWith(marks, nav.at(marks.length), hovered);
  const colorOf = (name: string) => all.find((node) => node.label === name)?.color ?? '';

  return (
    <div data-slot="parts-chart" data-kind="sunburst" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? all.length > 1) ? <GroupLegend names={all.map((node) => node.label)} color={colorOf} hidden={hidden} toggle={toggle} onHover={setHovered} /> : null}
      <Plot plotRef={ref} label={label} table={{ rowHeader: 'Часть', columns: ['Значение', 'Доля'], rows: hierarchyRows(marks, formatValue) }} width={width} height={height} marks={marks} nav={nav}>
        {marks.map((mark, i) => {
          const [inner, outer] = rings[mark.depth];
          const { start, end } = span(i);
          return (
            <path
              key={`${mark.depth}/${mark.name}`}
              data-slot="parts-chart-mark"
              data-depth={mark.depth}
              data-label={mark.label}
              data-group={mark.depth === 2 ? mark.parent.label : undefined}
              data-start={start}
              data-end={end}
              data-inner={inner}
              data-outer={outer}
              d={sector(cx, cy, inner, outer, start, end)}
              fill={mark.parent.color}
              stroke={SURFACE}
              strokeWidth={2}
              strokeLinejoin="round"
              opacity={lit(mark) ? 1 : DIM}
              className={RADIAL}
              style={enterStyle({ transformOrigin: `${cx}px ${cy}px` }, mark.depth === 2 ? 120 : 0)}
              {...nav.hover(i)}
            />
          );
        })}
        {marks.map((mark, i) => {
          const { start, end } = span(i);
          const mid = (start + end) / 2;
          if (mark.depth === 1) {
            if (62 * k * (end - start) < 30) return null;
            const at = polar(cx, cy, 62 * k, mid);
            return (
              <text key={`in/${mark.name}`} x={at.x} y={at.y} textAnchor="middle" dominantBaseline="central" className={cn(LABEL_SM, FADE)}>
                {wholePercent(mark.share)}
              </text>
            );
          }
          if (!wide || mark.share < 0.02) return null;
          const at = polar(cx, cy, R + 12, mid);
          const side = Math.sin(mid);
          return (
            <text key={`out/${mark.name}`} x={at.x} y={at.y + 4} textAnchor={Math.abs(side) < 0.15 ? 'middle' : side > 0 ? 'start' : 'end'} className={cn(MUTED, FADE)}>
              {`${mark.label} ${wholePercent(mark.share)}`}
            </text>
          );
        })}
        <g data-slot="parts-chart-total" className={FADE}>
          <text x={cx} y={totalLabel ? cy - 2 : cy + 6} textAnchor="middle" className="fill-fg-1 text-heading-xs font-semibold tabular-nums">
            {formatTotal(total)}
          </text>
          {totalLabel ? (
            <text x={cx} y={cy + 14} textAnchor="middle" className="fill-fg-3 text-overline">
              {totalLabel}
            </text>
          ) : null}
        </g>
      </Plot>
    </div>
  );
}

export interface IcicleChartProps extends PartsBaseProps {
  /** Lines with their products; two levels under the root. */
  data: readonly PartNode[];
  /** Name of the root row: «Выручка». */
  rootLabel?: string;
  /** Height of each of the three rows, px. */
  rowHeight?: number;
  /** Line legend above; off by default — the rows are labelled. */
  legend?: boolean;
}

/** The rectangular sunburst: root, lines and products in rows 2 px apart, width = share of the total; labels from 52 px. */
export function IcicleChart({ data, rootLabel = 'Всего', rowHeight = 72, formatValue = formatNumber, legend = false, className, 'aria-label': label, ...props }: IcicleChartProps) {
  const [ref, width] = useWidth(FALLBACK_WIDTH);
  const nav = useNav();
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const { all, shown, total } = levelsOf(data, hidden);
  const height = rowHeight * 3 + 4;
  const top = (depth: number) => depth * (rowHeight + 2);

  const lines = spans(
    shown.map((node) => ofTotal(node.value, total)),
    0,
    width,
  );
  const leaves = spans(
    shown.flatMap((node) => node.children.map((child) => ofTotal(child.value, total))),
    0,
    width,
  );
  const boxes: { from: number; size: number }[] = [];
  let line = 0;
  let leaf = 0;
  for (const node of shown) {
    boxes.push(lines[line++] ?? { from: 0, size: 0 });
    for (let c = 0; c < node.children.length; c += 1) boxes.push(leaves[leaf++] ?? { from: 0, size: 0 });
  }
  const box = (i: number) => boxes[i] ?? { from: 0, size: 0 };
  const root: Mark = {
    x: width / 2,
    y: rowHeight / 2,
    title: rootLabel,
    rows: [{ name: rootLabel, value: `${formatValue(total)} · ${formatPercent(1)}` }],
    spoken: `${rootLabel}: ${formatValue(total)}, ${formatPercent(1)}`,
  };
  const parts = hierarchyMarks(shown, total, formatValue, (depth, i) => ({ x: box(i).from + box(i).size / 2, y: top(depth) + rowHeight / 2 }));
  const marks = [root, ...parts];
  const active = nav.at(marks.length);
  const lit = litWith(parts, active === null || active === 0 ? null : active - 1, hovered);
  const colorOf = (name: string) => all.find((node) => node.label === name)?.color ?? '';

  return (
    <div data-slot="parts-chart" data-kind="icicle" className={cn('flex flex-col gap-3', className)} {...props}>
      {legend ? <GroupLegend names={all.map((node) => node.label)} color={colorOf} hidden={hidden} toggle={toggle} onHover={setHovered} /> : null}
      <Plot
        plotRef={ref}
        label={label}
        table={{ rowHeader: 'Часть', columns: ['Значение', 'Доля'], rows: [{ header: rootLabel, cells: [formatValue(total), formatPercent(1)] }, ...hierarchyRows(parts, formatValue)] }}
        width={width}
        height={height}
        marks={marks}
        nav={nav}
      >
        <rect
          data-slot="parts-chart-mark"
          data-depth={0}
          data-label={rootLabel}
          data-x={0}
          data-y={0}
          data-width={width}
          x={0}
          y={0}
          width={width}
          height={rowHeight}
          fill="var(--color-surface-3)"
          className={GROW_RIGHT}
          style={enterStyle()}
          {...nav.hover(0)}
        />
        <text x={10} y={rowHeight / 2} dominantBaseline="central" className={cn(LABEL, FADE)}>
          {`${rootLabel} · ${formatValue(total)} · 100 %`}
        </text>
        {parts.map((mark, i) => {
          const { from, size } = box(i);
          const y = top(mark.depth);
          return (
            <rect
              key={`${mark.depth}/${mark.name}`}
              data-slot="parts-chart-mark"
              data-depth={mark.depth}
              data-label={mark.label}
              data-group={mark.depth === 2 ? mark.parent.label : undefined}
              data-x={from}
              data-y={y}
              data-width={size}
              x={from}
              y={y}
              width={size}
              height={rowHeight}
              fill={mark.parent.color}
              opacity={lit(mark) ? 1 : DIM}
              className={GROW_RIGHT}
              style={enterStyle({}, mark.depth * 90)}
              {...nav.hover(i + 1)}
            />
          );
        })}
        {parts.map((mark, i) => {
          const { from, size } = box(i);
          if (size < 52) return null;
          const y = top(mark.depth);
          if (mark.depth === 1) {
            const text = `${mark.label} · ${wholePercent(mark.share)}`;
            return (
              <text key={`t/${mark.name}`} x={from + 10} y={y + rowHeight / 2} dominantBaseline="central" className={cn(LABEL, FADE)}>
                {fits(text, 13, size - 20) ? text : wholePercent(mark.share)}
              </text>
            );
          }
          const named = fits(mark.label, 12, size - 12);
          return (
            <g key={`t/${mark.name}`} className={FADE}>
              {named ? (
                <text x={from + 8} y={y + 32} className={LABEL_SM}>
                  {mark.label}
                </text>
              ) : null}
              <text x={from + 8} y={named ? y + 48 : y + 32} className={TINY}>
                {wholePercent(mark.share)}
              </text>
            </g>
          );
        })}
      </Plot>
    </div>
  );
}

/* ---------- 49 · Waffle ---------- */

/** Whole cells per part that add up to `cells`: floors first, then the largest remainders get one more each. */
function largestRemainder(values: readonly number[], cells: number): number[] {
  const total = sum(values);
  if (!(total > 0)) return values.map(() => 0);
  const exact = values.map((value) => (value / total) * cells);
  const counts = exact.map(Math.floor);
  const order = exact.map((value, i) => ({ i, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest || a.i - b.i);
  for (const { i } of order.slice(0, cells - sum(counts))) counts[i] = (counts[i] ?? 0) + 1;
  return counts;
}

export interface WaffleChartProps extends PartsBaseProps {
  data: readonly PartDatum[];
}

const WAFFLE = { cell: 22, gap: 4, side: 10 } as const;

/** 10 × 10 cells 22 with gaps 4 and corners 3, one cell per percent, filled bottom up column by column; the legend counts cells. */
export function WaffleChart({ data, formatValue = formatNumber, className, 'aria-label': label, ...props }: WaffleChartProps) {
  const nav = useNav();
  const pitch = WAFFLE.cell + WAFFLE.gap;
  const size = WAFFLE.side * pitch - WAFFLE.gap;
  const cellCount = WAFFLE.side * WAFFLE.side;
  const values = data.map((item) => Math.max(0, item.value));
  const total = sum(values);
  const counts = largestRemainder(values, cellCount);
  const parts = data.map((item, i) => ({ ...item, color: seriesColor(i, item.color), share: ofTotal(values[i] ?? 0, total), count: counts[i] ?? 0 }));
  const owner = parts.flatMap((part, i) => Array.from({ length: part.count }, () => i));
  const cells = owner.map((part, k) => {
    const col = Math.floor(k / WAFFLE.side);
    const row = WAFFLE.side - 1 - (k % WAFFLE.side);
    return { part, col, row, x: col * pitch, y: row * pitch };
  });
  const firsts = cumulative(parts.map((part) => part.count));
  const marks = parts.map<Mark>((part, i) => {
    const middle = cells[(firsts[i] ?? 0) + Math.floor(part.count / 2)] ?? { x: 0, y: 0 };
    return {
      x: middle.x + WAFFLE.cell,
      y: middle.y,
      title: part.label,
      rows: [{ name: `${part.count} из ${cellCount}`, color: part.color, value: `${formatValue(part.value)} · ${formatPercent(part.share)}` }],
      spoken: `${part.label}: ${part.count} из ${cellCount}, ${formatPercent(part.share)}`,
    };
  });
  const active = nav.at(marks.length);

  return (
    <div data-slot="parts-chart" data-kind="waffle" className={cn('flex flex-wrap items-start gap-x-7 gap-y-4', className)} {...props}>
      <div className="shrink-0" style={{ width: size }}>
        <Plot
          label={label}
          table={{
            rowHeader: 'Часть',
            columns: ['Клеток', 'Значение', 'Доля'],
            rows: parts.map((part) => ({ header: part.label, cells: [`${part.count} из ${cellCount}`, formatValue(part.value), formatPercent(part.share)] })),
          }}
          width={size}
          height={size}
          marks={marks}
          nav={nav}
        >
          {cells.map((cell, k) => (
            <rect
              key={k}
              data-slot="parts-chart-mark"
              data-label={parts[cell.part]?.label}
              data-col={cell.col}
              data-row={cell.row}
              data-x={cell.x}
              data-y={cell.y}
              x={cell.x}
              y={cell.y}
              width={WAFFLE.cell}
              height={WAFFLE.cell}
              rx={3}
              fill={parts[cell.part]?.color}
              opacity={active === null || active === cell.part ? 1 : DIM}
              className={POP}
              style={enterStyle({}, k * 4)}
              {...nav.hover(cell.part)}
            />
          ))}
        </Plot>
      </div>
      <ul data-slot="parts-chart-list" className="flex flex-col gap-3">
        {parts.map((part, i) => {
          const { onPointerEnter, onPointerLeave } = nav.hover(i);
          return (
            <li key={part.label} className="flex items-start gap-2" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
              <span aria-hidden className="mt-0.5 size-3 shrink-0" style={{ background: part.color }} />
              <span className="flex flex-col">
                <span className="text-label-sm font-semibold text-fg-1">{part.label}</span>
                <span className="text-caption text-fg-2 tabular-nums">{`${part.count} из ${cellCount} · ${wholePercent(part.share)}`}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- 50 · Marimekko ---------- */

export interface MarimekkoChartProps extends PartsBaseProps {
  /** Columns: «Москва», «Урал». No more than six read well. */
  labels: readonly string[];
  /** Segments stacked from the bottom; no more than four. */
  series: readonly PartSeries[];
  /** Plot height without the column captions, px. */
  height?: number;
  /** Word after the column share: «38 % рынка». */
  shareSuffix?: string;
  /** Legend above; on by default for several series. Clicking a series hides it. */
  legend?: boolean;
}

/** Column width — the column’s share of the whole, segment height — the share inside the column: rectangle area = share of the whole market. */
export function MarimekkoChart({ labels, series, height = 220, shareSuffix = 'рынка', formatValue = formatNumber, legend, className, 'aria-label': label, ...props }: MarimekkoChartProps) {
  const [ref, width] = useWidth(FALLBACK_WIDTH);
  const nav = useNav();
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const colored = series.map((item, i) => ({ ...item, color: seriesColor(i, item.color) }));
  const shown = colored.filter((item) => !hidden.has(item.name));
  const top = 8;
  const bottom = top + height;
  const columnTotals = labels.map((_, c) => sum(shown.map((item) => Math.max(0, item.values[c] ?? 0))));
  const total = sum(columnTotals);
  const columns = spans(
    columnTotals.map((value) => ofTotal(value, total)),
    0,
    width,
  );

  const segments = labels.flatMap((text, c) => {
    const columnTotal = columnTotals[c] ?? 0;
    const values = shown.map((item) => Math.max(0, item.values[c] ?? 0));
    const shares = values.map((value) => ofTotal(value, columnTotal));
    const column = columns[c] ?? { from: 0, size: 0 };
    // spans() runs top down, the first series sits at the bottom
    const vertical = spans([...shares].reverse(), top, height).reverse();
    return shown.map((item, s) => ({
      column: c,
      text,
      item,
      value: values[s] ?? 0,
      share: shares[s] ?? 0,
      columnShare: ofTotal(columnTotal, total),
      x: column.from,
      w: column.size,
      y: vertical[s]?.from ?? 0,
      h: vertical[s]?.size ?? 0,
    }));
  });
  const marks = segments.map<Mark>((segment) => ({
    x: segment.x + segment.w / 2,
    y: segment.y + segment.h / 2,
    title: `${segment.text} · ${formatPercent(segment.columnShare)} ${shareSuffix}`,
    rows: [{ name: segment.item.name, color: segment.item.color, value: `${formatValue(segment.value)} · ${formatPercent(segment.share)}` }],
    spoken: `${segment.text} · ${segment.item.name}: ${formatValue(segment.value)}, ${formatPercent(segment.share)}`,
  }));
  const active = nav.at(marks.length);
  const everything = sum(colored.flatMap((item) => item.values));

  return (
    <div data-slot="parts-chart" data-kind="marimekko" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? series.length > 1) ? <ChartLegend items={colored} marker="square" hidden={hidden} onToggle={toggle} onHover={setHovered} /> : null}
      <Plot
        plotRef={ref}
        label={label}
        table={{
          rowHeader: 'Столбец',
          columns: [...colored.map((item) => item.name), `Доля ${shareSuffix}`],
          rows: labels.map((text, c) => {
            const columnTotal = sum(colored.map((item) => item.values[c] ?? 0));
            return {
              header: text,
              cells: [
                ...colored.map((item) => `${formatValue(item.values[c] ?? 0)} (${formatPercent(ofTotal(item.values[c] ?? 0, columnTotal))})`),
                formatPercent(ofTotal(columnTotal, everything)),
              ],
            };
          }),
        }}
        width={width}
        height={bottom + 40}
        marks={marks}
        nav={nav}
      >
        {segments.map((segment, i) =>
          segment.w > 0 && segment.h > 0 ? (
            <rect
              key={`${segment.column}/${segment.item.name}`}
              data-slot="parts-chart-mark"
              data-column={segment.column}
              data-series={segment.item.name}
              data-x={segment.x}
              data-y={segment.y}
              data-width={segment.w}
              data-height={segment.h}
              x={segment.x}
              y={segment.y}
              width={segment.w}
              height={segment.h}
              fill={segment.item.color}
              opacity={(active !== null && active !== i) || (hovered !== null && hovered !== segment.item.name) ? DIM : 1}
              className={GROW_UP}
              style={enterStyle({}, segment.column * 35)}
              {...nav.hover(i)}
            />
          ) : null,
        )}
        {segments.map((segment) =>
          segment.w >= 64 && segment.h >= 22 ? (
            <text key={`t/${segment.column}/${segment.item.name}`} x={segment.x + 8} y={segment.y + 18} className={cn(LABEL_SM, FADE)}>
              {wholePercent(segment.share)}
            </text>
          ) : null,
        )}
        {labels.map((text, c) => {
          const column = columns[c] ?? { from: 0, size: 0 };
          const share = `${wholePercent(ofTotal(columnTotals[c] ?? 0, total))} ${shareSuffix}`;
          return (
            <g key={text} className={FADE}>
              {fits(text, 12, column.size - 4, 400) ? (
                <text x={column.from} y={bottom + 20} className={MUTED}>
                  {text}
                </text>
              ) : null}
              {fits(share, 11, column.size - 4, 400) ? (
                <text x={column.from} y={bottom + 35} className="pointer-events-none fill-fg-3 text-overline">
                  {share}
                </text>
              ) : null}
            </g>
          );
        })}
      </Plot>
    </div>
  );
}

/* ---------- 51 · Nightingale rose ---------- */

export interface NightingaleChartProps extends PartsBaseProps {
  /** Cyclic parts in order from 12 o’clock clockwise: months, hours, weekdays. */
  data: readonly PartDatum[];
  /** Labels drawn in colour; the rest stay seq-3. Without it every petal is coloured. */
  highlight?: readonly string[];
  /** Static legend for the two colours: { base: «Месяц», highlight: «Последний квартал» }. */
  legendLabels?: { base: string; highlight: string };
}

/** Equal angles, radius ∝ √value so the petal area tells the truth; guide rings at half and full maximum; focus in colour, the rest seq-3. */
export function NightingaleChart({ data, highlight, legendLabels, formatValue = formatNumber, className, 'aria-label': label, ...props }: NightingaleChartProps) {
  const [ref, width] = useWidth(FALLBACK_WIDTH);
  const nav = useNav();
  const R = Math.max(48, Math.min(128, width / 2 - 40));
  const cx = width / 2;
  const cy = R + 22;
  const height = 2 * R + 44;
  const max = Math.max(0, ...data.map((item) => item.value));
  const step = data.length > 0 ? TAU / data.length : TAU;
  const focus = new Set(highlight ?? []);
  const petals = data.map((item, i) => {
    const lit = !highlight || focus.has(item.label);
    return {
      ...item,
      start: i * step,
      end: (i + 1) * step,
      r: max > 0 ? R * Math.sqrt(Math.max(0, item.value) / max) : 0,
      color: item.color ?? (lit ? 'var(--color-chart-1)' : 'var(--color-seq-3)'),
      group: lit && highlight ? legendLabels?.highlight : legendLabels?.base,
    };
  });
  const marks = petals.map<Mark>((petal) => ({
    ...polar(cx, cy, Math.max(petal.r * 0.6, 12), (petal.start + petal.end) / 2),
    title: petal.label,
    rows: [{ name: petal.group ?? petal.label, color: petal.color, value: formatValue(petal.value) }],
    spoken: `${petal.label}: ${formatValue(petal.value)}`,
  }));
  const active = nav.at(marks.length);

  return (
    <div data-slot="parts-chart" data-kind="nightingale" className={cn('flex flex-col gap-3', className)} {...props}>
      {legendLabels && highlight ? (
        <ChartLegend
          items={[
            { name: legendLabels.base, color: 'var(--color-seq-3)' },
            { name: legendLabels.highlight, color: 'var(--color-chart-1)' },
          ]}
          marker="square"
        />
      ) : null}
      <Plot
        plotRef={ref}
        label={label}
        table={{ rowHeader: 'Часть', columns: ['Значение'], rows: petals.map((petal) => ({ header: petal.label, cells: [formatValue(petal.value)] })) }}
        width={width}
        height={height}
        marks={marks}
        nav={nav}
      >
        {[Math.SQRT1_2 * R, R].map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-separator)" />
        ))}
        {petals.map((petal, i) => (
          <path
            key={petal.label}
            data-slot="parts-chart-mark"
            data-label={petal.label}
            data-start={petal.start}
            data-r={petal.r}
            d={petal.r > 0 ? sector(cx, cy, 0, petal.r, petal.start, petal.end) : ''}
            fill={petal.color}
            stroke={SURFACE}
            strokeWidth={2}
            strokeLinejoin="round"
            opacity={active === null || active === i ? 1 : DIM}
            className={RADIAL}
            style={enterStyle({ transformOrigin: `${cx}px ${cy}px` }, i * 25)}
            {...nav.hover(i)}
          />
        ))}
        {petals.map((petal) => {
          const at = polar(cx, cy, R + 14, (petal.start + petal.end) / 2);
          return (
            <text key={petal.label} x={at.x} y={at.y + 4} textAnchor="middle" className="pointer-events-none fill-fg-3 text-caption">
              {petal.label}
            </text>
          );
        })}
      </Plot>
    </div>
  );
}

/* ---------- 52 · Parliament arc ---------- */

export interface ParliamentDatum extends PartDatum {
  /** «Прочее»: drawn in fg-4 instead of a palette colour. */
  other?: boolean;
}

export interface ParliamentChartProps extends PartsBaseProps {
  /** Parts in seat order from left to right; values are whole units. */
  data: readonly ParliamentDatum[];
  /** Rows of seats (default: by the count, 5 for about 120). */
  rows?: number;
  /** Word under the total: «сотрудников». */
  totalLabel?: string;
}

interface Seat {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

/** Seats on concentric half rings, as many per row as its length allows, ordered by angle from the left so each part takes a wedge. */
function parliamentSeats(count: number, rows: number, outer: number, cx: number, cy: number): { seats: Seat[]; seat: number } {
  const inner = rows > 1 ? outer * 0.47 : outer;
  const pitch = rows > 1 ? (outer - inner) / (rows - 1) : outer;
  const radii = Array.from({ length: rows }, (_, i) => inner + i * pitch);
  const length = sum(radii);
  const perRow = radii.map((r) => Math.round((count * r) / length));
  // rounding drift goes to the outer rows, which have the most room
  let drift = count - sum(perRow);
  for (let i = rows - 1; drift !== 0; i = i === 0 ? rows - 1 : i - 1) {
    const step = Math.sign(drift);
    if ((perRow[i] ?? 0) + step >= 0) {
      perRow[i] = (perRow[i] ?? 0) + step;
      drift -= step;
    }
  }
  const seats = radii.flatMap((r, i) => {
    const n = perRow[i] ?? 0;
    return Array.from({ length: n }, (_, j) => {
      const angle = n === 1 ? Math.PI / 2 : Math.PI - (j * Math.PI) / (n - 1);
      return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle), angle, radius: r };
    });
  });
  seats.sort((a, b) => b.angle - a.angle || a.radius - b.radius);
  const crowded = Math.min(...radii.map((r, i) => ((perRow[i] ?? 0) > 1 ? (Math.PI * r) / ((perRow[i] ?? 2) - 1) : Infinity)));
  return { seats, seat: Math.max(1.5, Math.min(7, rows > 1 ? pitch * 0.3 : 7, crowded * 0.4)) };
}

/** Half circle of dots 14, one per unit, parts left to right, the total in the centre; «other» in fg-4. */
export function ParliamentChart({ data, rows, totalLabel, formatValue = formatNumber, className, 'aria-label': label, ...props }: ParliamentChartProps) {
  const [ref, width] = useWidth(FALLBACK_WIDTH);
  const nav = useNav();
  const parts = data.map((item, i) => ({
    ...item,
    seats: Math.max(0, Math.round(item.value)),
    color: item.other ? 'var(--color-fg-4)' : seriesColor(data.slice(0, i).filter((other) => !other.other).length, item.color),
  }));
  const count = sum(parts.map((part) => part.seats));
  const rowCount = rows ?? Math.min(10, Math.max(1, Math.round(Math.sqrt(count / 4.8))));
  const outer = Math.max(40, Math.min(196, width / 2 - 8));
  const cx = width / 2;
  const cy = outer + 8;
  const height = cy + 22;
  const { seats, seat } = parliamentSeats(count, rowCount, outer, cx, cy);
  const owner = parts.flatMap((part, i) => Array.from({ length: part.seats }, () => i));
  const firsts = cumulative(parts.map((part) => part.seats));
  const marks = parts.map<Mark>((part, i) => {
    const middle = seats[(firsts[i] ?? 0) + Math.floor(part.seats / 2)] ?? { x: cx, y: cy };
    const share = ofTotal(part.seats, count);
    return {
      x: middle.x,
      y: middle.y,
      title: part.label,
      rows: [{ name: part.label, color: part.color, value: `${formatValue(part.seats)} · ${formatPercent(share)}` }],
      spoken: `${part.label}: ${formatValue(part.seats)}, ${formatPercent(share)}`,
    };
  });
  const active = nav.at(marks.length);

  return (
    <div data-slot="parts-chart" data-kind="parliament" className={cn('flex flex-col gap-3', className)} {...props}>
      <Plot
        plotRef={ref}
        label={label}
        table={shareTable(
          parts.map((part) => ({ label: part.label, value: part.seats, share: ofTotal(part.seats, count) })),
          formatValue,
        )}
        width={width}
        height={height}
        marks={marks}
        nav={nav}
        marker="dot"
      >
        {seats.map((place, k) => {
          const part = owner[k] ?? 0;
          return (
            <circle
              key={k}
              data-slot="parts-chart-mark"
              data-label={parts[part]?.label}
              data-angle={place.angle}
              data-radius={place.radius}
              data-r={seat}
              data-cx={place.x}
              data-cy={place.y}
              cx={place.x}
              cy={place.y}
              r={seat}
              fill={parts[part]?.color}
              opacity={active === null || active === part ? 1 : DIM}
              className={POP}
              style={enterStyle({}, k * 3)}
              {...nav.hover(part)}
            />
          );
        })}
        <g data-slot="parts-chart-total" className={FADE}>
          <text x={cx} y={cy - 4} textAnchor="middle" className="fill-fg-1 text-heading-lg font-semibold tabular-nums">
            {formatNumber(count)}
          </text>
          {totalLabel ? (
            <text x={cx} y={cy + 14} textAnchor="middle" className="fill-fg-3 text-caption">
              {totalLabel}
            </text>
          ) : null}
        </g>
      </Plot>
      <ul data-slot="parts-chart-list" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {parts.map((part, i) => {
          const { onPointerEnter, onPointerLeave } = nav.hover(i);
          return (
            <li key={part.label} className="inline-flex h-7 items-center gap-2 text-caption text-fg-2" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
              <LegendMarker kind="dot" color={part.color} />
              {`${part.label} · ${formatValue(part.seats)}`}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- 53 · Venn and Euler ---------- */

export interface VennSet {
  /** Name on the circle: «Касса». */
  label: string;
  /** Legend text: «Купили кассу» (default: the label). */
  legend?: string;
  color?: string;
}

export interface VennRegion {
  /** Labels of the sets this region belongs to, and to no other. */
  sets: readonly string[];
  /** Count of exactly this combination. */
  value: number;
}

export interface VennChartProps extends PartsBaseProps {
  /** Two or three sets; more than three read better as an UpSet chart. */
  sets: readonly VennSet[];
  regions: readonly VennRegion[];
  /** Euler mode: circle areas ∝ set totals, pairwise overlaps ∝ shared counts. Off: equal circles, the numbers carry the data. */
  proportional?: boolean;
  /** Plot height, px. */
  height?: number;
}

interface Circle {
  x: number;
  y: number;
  r: number;
}

/** Area of the lens where two circles overlap. */
function lensArea(r1: number, r2: number, d: number): number {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const a = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
  const b = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
  return a + b - 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
}

/** Centre distance at which two circles overlap by `overlap`: the lens shrinks monotonically with distance, so bisection. */
function distanceFor(r1: number, r2: number, overlap: number): number {
  if (overlap <= 0) return r1 + r2 + Math.min(r1, r2) * 0.1;
  let lo = Math.abs(r1 - r2);
  let hi = r1 + r2;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (lensArea(r1, r2, mid) > overlap) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Circles in unit space: the equal Venn template, or an Euler layout where circle areas and every pairwise lens
 * match the counts. With three sets the triple overlap follows from the pairs and is only approximate.
 */
function vennCircles(count: number, regions: readonly { mask: number; value: number }[], proportional: boolean): Circle[] {
  if (!proportional) {
    if (count === 1) return [{ x: 0, y: 0, r: 1 }];
    if (count === 2) return [{ x: -0.6, y: 0, r: 1 }, { x: 0.6, y: 0, r: 1 }];
    return [{ x: -0.6, y: -0.46, r: 1 }, { x: 0.6, y: -0.46, r: 1 }, { x: 0, y: 0.46, r: 1 }];
  }
  const within = (bits: number) => sum(regions.filter((region) => (region.mask & bits) === bits).map((region) => region.value));
  const radii = Array.from({ length: count }, (_, i) => Math.sqrt(Math.max(within(1 << i), 1e-9) / Math.PI));
  const r = (i: number) => radii[i] ?? 0;
  const d = (i: number, j: number) => distanceFor(r(i), r(j), within((1 << i) | (1 << j)));
  if (count === 1) return [{ x: 0, y: 0, r: r(0) }];
  const ab = d(0, 1);
  const circles = [{ x: 0, y: 0, r: r(0) }, { x: ab, y: 0, r: r(1) }];
  if (count === 3) {
    const ac = d(0, 2);
    const bc = d(1, 2);
    const x = (ab * ab + ac * ac - bc * bc) / (2 * ab);
    circles.push({ x, y: Math.sqrt(Math.max(0, ac * ac - x * x)), r: r(2) });
  }
  return circles;
}

const joinNames = (names: readonly string[]) => (names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} и ${names[names.length - 1] ?? ''}`);

/** Outline circles 2,5 in the set colours, the count of each exact combination in its region; set names outside. */
export function VennChart({ sets, regions, proportional = false, height = 304, formatValue = formatNumber, className, 'aria-label': label, ...props }: VennChartProps) {
  const [ref, width] = useWidth(FALLBACK_WIDTH);
  const nav = useNav();
  const id = svgId(useId());
  const named = sets.slice(0, 3).map((set, i) => ({ ...set, color: seriesColor(i, set.color) }));
  const bit = (name: string) => {
    const index = named.findIndex((set) => set.label === name);
    return index < 0 ? 0 : 1 << index;
  };
  const areas = regions.map((region) => ({ ...region, mask: region.sets.reduce((mask, name) => mask | bit(name), 0) })).filter((region) => region.mask > 0);
  const key = JSON.stringify([named.length, proportional, areas.map((area) => [area.mask, area.value])]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the key is the content of the inputs
  const unit = useMemo(() => vennCircles(named.length, areas, proportional), [key]);

  const minX = Math.min(...unit.map((c) => c.x - c.r));
  const maxX = Math.max(...unit.map((c) => c.x + c.r));
  const minY = Math.min(...unit.map((c) => c.y - c.r));
  const maxY = Math.max(...unit.map((c) => c.y + c.r));
  const scale = Math.max(1, Math.min((width - 96) / (maxX - minX || 1), (height - 36) / (maxY - minY || 1)));
  const ox = width / 2 - ((minX + maxX) / 2) * scale;
  const oy = 24 + (height - 36) / 2 - ((minY + maxY) / 2) * scale;
  const circles = unit.map((c) => ({ x: ox + c.x * scale, y: oy + c.y * scale, r: c.r * scale }));
  const centre = { x: sum(circles.map((c) => c.x)) / Math.max(1, circles.length), y: sum(circles.map((c) => c.y)) / Math.max(1, circles.length) };

  // each region is labelled at the centroid of a 3 px sample grid of exactly its combination
  const centroids = useMemo(() => {
    const acc = new Map<number, { x: number; y: number; n: number }>();
    for (let y = oy + minY * scale; y <= oy + maxY * scale; y += 3) {
      for (let x = ox + minX * scale; x <= ox + maxX * scale; x += 3) {
        const mask = circles.reduce((bits, c, i) => ((x - c.x) ** 2 + (y - c.y) ** 2 <= c.r * c.r ? bits | (1 << i) : bits), 0);
        if (mask === 0) continue;
        const cell = acc.get(mask) ?? { x: 0, y: 0, n: 0 };
        acc.set(mask, { x: cell.x + x, y: cell.y + y, n: cell.n + 1 });
      }
    }
    return acc;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the circles follow from these
  }, [key, width, height]);

  const names = (mask: number) => named.filter((_, i) => mask & (1 << i)).map((set) => set.label);
  const title = (mask: number) => {
    const list = names(mask);
    return list.length === 1 && named.length > 1 ? `Только ${list[0] ?? ''}` : joinNames(list);
  };
  const marks = areas.map<Mark>((area) => {
    const at = centroids.get(area.mask);
    return {
      x: at ? at.x / at.n : centre.x,
      y: at ? at.y / at.n : centre.y,
      title: title(area.mask),
      rows: [{ name: 'В области', value: formatValue(area.value) }],
      spoken: `${title(area.mask)}: ${formatValue(area.value)}`,
    };
  });
  const active = nav.at(marks.length);
  const activeMask = active === null ? 0 : (areas[active]?.mask ?? 0);
  // hit-testing follows clip paths: regions with more sets are drawn later and win where they overlap
  const order = areas.map((area, i) => ({ area, i })).sort((a, b) => names(a.area.mask).length - names(b.area.mask).length);
  const full = (1 << named.length) - 1;

  const region = (mask: number, i: number) => {
    const inside = circles.map((c, k) => ({ c, k })).filter(({ k }) => mask & (1 << k));
    const last = inside[inside.length - 1];
    if (!last) return null;
    const lit = activeMask === mask;
    const shape = (
      <circle
        data-slot="parts-chart-mark"
        data-label={title(mask)}
        cx={last.c.x}
        cy={last.c.y}
        r={last.c.r}
        fill={lit ? 'var(--color-fill-3)' : 'transparent'}
        mask={lit ? `url(#${id}-m)` : undefined}
        className="transition-[fill] duration-(--duration-quick)"
        {...nav.hover(i)}
      />
    );
    return inside.slice(0, -1).reduceRight<ReactNode>((child, { k }) => <g clipPath={`url(#${id}-c${k})`}>{child}</g>, shape);
  };

  return (
    <div data-slot="parts-chart" data-kind="venn" className={cn('flex flex-col gap-3', className)} {...props}>
      <ChartLegend items={named.map((set) => ({ name: set.legend ?? set.label, color: set.color }))} marker="line" />
      <Plot
        plotRef={ref}
        label={label}
        table={{ rowHeader: 'Комбинация', columns: ['Значение'], rows: areas.map((area) => ({ header: title(area.mask), cells: [formatValue(area.value)] })) }}
        width={width}
        height={height}
        marks={marks}
        nav={nav}
      >
        <defs>
          {circles.map((c, k) => (
            <clipPath key={k} id={`${id}-c${k}`}>
              <circle cx={c.x} cy={c.y} r={c.r} />
            </clipPath>
          ))}
          <mask id={`${id}-m`}>
            <rect x={0} y={0} width={width} height={height} fill="white" />
            {circles.map((c, k) => (activeMask & (1 << k) ? null : <circle key={k} cx={c.x} cy={c.y} r={c.r} fill="black" />))}
          </mask>
        </defs>
        {order.map(({ area, i }) => (
          <g key={area.mask}>{region(area.mask, i)}</g>
        ))}
        {circles.map((c, k) => (
          <circle
            key={k}
            data-slot="parts-chart-set"
            data-cx={c.x}
            data-cy={c.y}
            data-r={c.r}
            cx={c.x}
            cy={c.y}
            r={c.r}
            fill="none"
            stroke={named[k]?.color}
            strokeWidth={2.5}
            className={cn('pointer-events-none', SETTLE)}
            style={enterStyle({}, k * 60)}
          />
        ))}
        {circles.map((c, k) => {
          const right = c.x - centre.x >= 0;
          const up = circles.length < 3 || c.y - centre.y < -1e-6;
          return (
            <text key={`n${k}`} x={c.x + (right ? 0.87 : -0.87) * c.r} y={up ? c.y - c.r : c.y + c.r} textAnchor={right ? 'start' : 'end'} className={cn(LABEL, FADE)}>
              {named[k]?.label}
            </text>
          );
        })}
        {areas.map((area, i) => {
          const mark = marks[i];
          if (!mark || !centroids.has(area.mask)) return null;
          const all = named.length === 3 && area.mask === full;
          return (
            <g key={`v${area.mask}`} className={FADE}>
              <text x={mark.x} y={all ? mark.y - 4 : mark.y} textAnchor="middle" dominantBaseline="central" className={cn(LABEL, 'tabular-nums')}>
                {formatValue(area.value)}
              </text>
              {all ? (
                <text x={mark.x} y={mark.y + 12} textAnchor="middle" dominantBaseline="central" className="pointer-events-none fill-fg-3 text-overline">
                  все три
                </text>
              ) : null}
            </g>
          );
        })}
      </Plot>
    </div>
  );
}

/* ---------- 54 · Voronoi treemap ---------- */

const polygonArea = (points: readonly Point[]) => {
  let s = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i] ?? { x: 0, y: 0 };
    const b = points[(i + 1) % points.length] ?? a;
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
};

function polygonCentroid(points: readonly Point[]): Point {
  let cx = 0;
  let cy = 0;
  let s = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i] ?? { x: 0, y: 0 };
    const b = points[(i + 1) % points.length] ?? a;
    const cross = a.x * b.y - b.x * a.y;
    s += cross;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  return s === 0 ? (points[0] ?? { x: 0, y: 0 }) : { x: cx / (3 * s), y: cy / (3 * s) };
}

/** Sutherland–Hodgman against one half-plane: keeps the points where ax·x + ay·y ≤ b. */
function clipHalfPlane(polygon: readonly Point[], ax: number, ay: number, b: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const p = polygon[i] ?? { x: 0, y: 0 };
    const q = polygon[(i + 1) % polygon.length] ?? p;
    const fp = ax * p.x + ay * p.y - b;
    const fq = ax * q.x + ay * q.y - b;
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push({ x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) });
    }
  }
  return out;
}

/** Power-diagram cells inside the convex bound: a point belongs to the site with the smallest |p − s|² − w. */
function powerCells(bound: readonly Point[], sites: readonly Point[], weights: readonly number[]): Point[][] {
  return sites.map((s, i) => {
    let cell: Point[] = [...bound];
    for (let j = 0; j < sites.length && cell.length > 2; j += 1) {
      const t = sites[j];
      if (j === i || !t) continue;
      cell = clipHalfPlane(cell, 2 * (t.x - s.x), 2 * (t.y - s.y), t.x * t.x + t.y * t.y - s.x * s.x - s.y * s.y - (weights[j] ?? 0) + (weights[i] ?? 0));
    }
    return cell;
  });
}

/**
 * Voronoi treemap in the unit circle (Nocaj & Brandes, as in d3-voronoi-map): sites start on a golden-angle spiral,
 * then every round moves them to their cell centroids and scales the power weights by target ÷ current area,
 * capped by the squared distance to the nearest site so no cell can vanish. Deterministic: no randomness.
 */
function voronoiTreemap(values: readonly number[]): Point[][] {
  const sides = 96;
  const bound = Array.from({ length: sides }, (_, k) => polar(0, 0, 1, (k / sides) * TAU));
  const total = sum(values);
  if (values.length === 0 || !(total > 0)) return [];
  if (values.length === 1) return [bound];
  const whole = polygonArea(bound);
  const target = values.map((value) => (value / total) * whole);
  const n = values.length;
  let sites = values.map((_, k) => polar(0, 0, 0.8 * Math.sqrt((k + 0.5) / n), k * 2.399963));
  let weights = values.map(() => 1e-4);
  let cells = powerCells(bound, sites, weights);
  for (let pass = 0; pass < 300; pass += 1) {
    const areas = cells.map((cell) => (cell.length > 2 ? polygonArea(cell) : 0));
    const error = sum(areas.map((area, i) => Math.abs(area - (target[i] ?? 0)))) / whole;
    if (error < 0.003) break;
    sites = cells.map((cell, i) => (cell.length > 2 ? polygonCentroid(cell) : (sites[i] ?? { x: 0, y: 0 })));
    weights = weights.map((w, i) => w * Math.min(2, Math.max(0.5, (target[i] ?? 0) / Math.max(areas[i] ?? 0, 1e-9))));
    weights = weights.map((w, i) => {
      const s = sites[i] ?? { x: 0, y: 0 };
      let nearest = Infinity;
      for (const [j, t] of sites.entries()) if (j !== i) nearest = Math.min(nearest, (s.x - t.x) ** 2 + (s.y - t.y) ** 2);
      return Math.max(1e-6, Math.min(w, nearest));
    });
    cells = powerCells(bound, sites, weights);
  }
  return cells;
}

export interface VoronoiTreemapChartProps extends PartsBaseProps {
  data: readonly GroupedPartDatum[];
  /** Group legend above; on by default for several groups. Clicking a group hides its cells. */
  legend?: boolean;
}

/** A weighted Voronoi diagram in a circle: cell area = share, surface borders 2; the name from 9 %, a number below. */
export function VoronoiTreemapChart({ data, formatValue = formatNumber, legend, className, 'aria-label': label, ...props }: VoronoiTreemapChartProps) {
  const [ref, width] = useWidth(FALLBACK_WIDTH);
  const nav = useNav();
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const { groups, items } = groupedItems(data, hidden);
  const R = Math.max(40, Math.min(135, width / 2 - 4));
  const cx = width / 2;
  const cy = R + 10;
  const height = 2 * R + 20;
  const key = items.map((item) => item.value).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the key is the content of the values
  const unit = useMemo(() => voronoiTreemap(items.map((item) => item.value)), [key]);
  const cells = unit.map((cell) => cell.map((p) => ({ x: cx + p.x * R, y: cy + p.y * R })));
  const centres = cells.map((cell) => (cell.length > 2 ? polygonCentroid(cell) : { x: cx, y: cy }));
  const marks = items.map((item, i) => {
    const c = centres[i] ?? { x: cx, y: cy };
    return groupedMark(item, c.x, c.y, formatValue);
  });
  const active = nav.at(marks.length);

  return (
    <div data-slot="parts-chart" data-kind="voronoi-treemap" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? groups.names.length > 1) ? <GroupLegend names={groups.names} color={groups.color} hidden={hidden} toggle={toggle} onHover={setHovered} /> : null}
      <Plot plotRef={ref} label={label} table={shareTable(items, formatValue, groups.names.length > 0)} width={width} height={height} marks={marks} nav={nav}>
        <circle data-slot="parts-chart-bound" data-cx={cx} data-cy={cy} data-r={R} cx={cx} cy={cy} r={R} fill="var(--color-fill-1)" />
        {items.map((item, i) => {
          const cell = cells[i] ?? [];
          if (cell.length < 3) return null;
          const dim = (active !== null && active !== i) || (hovered !== null && hovered !== item.group);
          return (
            <path
              key={item.label}
              data-slot="parts-chart-mark"
              data-label={item.label}
              data-group={item.group}
              data-value={item.value}
              data-area={polygonArea(cell)}
              d={`${cell.map((p, k) => `${k === 0 ? 'M' : 'L'}${round(p.x)} ${round(p.y)}`).join('')}Z`}
              fill={item.color}
              stroke={SURFACE}
              strokeWidth={2}
              strokeLinejoin="round"
              opacity={dim ? DIM : 1}
              className={RADIAL}
              style={enterStyle({ transformOrigin: `${cx}px ${cy}px` }, i * 30)}
              {...nav.hover(i)}
            />
          );
        })}
        {items.map((item, i) => {
          const c = centres[i];
          if (!c || (cells[i]?.length ?? 0) < 3) return null;
          return Math.round(item.share * 100) >= 9 ? (
            <g key={item.label} className={FADE}>
              <text x={c.x} y={c.y - 2} textAnchor="middle" className={LABEL_SM}>
                {item.label}
              </text>
              <text x={c.x} y={c.y + 13} textAnchor="middle" className={TINY}>
                {wholePercent(item.share)}
              </text>
            </g>
          ) : (
            <text key={item.label} x={c.x} y={c.y + 4} textAnchor="middle" className={cn(TINY, 'font-semibold', FADE)}>
              {wholePercent(item.share)}
            </text>
          );
        })}
      </Plot>
    </div>
  );
}

/* ---------- 55 · Circle packing ---------- */

/** Greedy front placement: each circle, largest first, goes to the spot tangent to two placed ones that is nearest the centre. */
function packCircles(radii: readonly number[], pad: number): Circle[] {
  const placed: Circle[] = [];
  for (const [i, base] of radii.entries()) {
    const r = base + pad;
    const first = placed[0];
    if (!first) {
      placed.push({ x: 0, y: 0, r });
      continue;
    }
    if (i === 1) {
      placed.push({ x: first.r + r, y: 0, r });
      continue;
    }
    let best: Circle | null = null;
    let bestDistance = Infinity;
    for (let a = 0; a < placed.length; a += 1) {
      for (let b = a + 1; b < placed.length; b += 1) {
        const A = placed[a];
        const B = placed[b];
        if (!A || !B) continue;
        const ra = A.r + r;
        const rb = B.r + r;
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const d = Math.hypot(dx, dy);
        if (d === 0 || d > ra + rb || d < Math.abs(ra - rb)) continue;
        const along = (ra * ra - rb * rb + d * d) / (2 * d);
        const across = Math.sqrt(Math.max(0, ra * ra - along * along));
        for (const side of [1, -1]) {
          const x = A.x + (along * dx - side * across * dy) / d;
          const y = A.y + (along * dy + side * across * dx) / d;
          const distance = Math.hypot(x, y);
          if (distance < bestDistance && placed.every((c) => Math.hypot(c.x - x, c.y - y) >= c.r + r - 1e-9)) {
            bestDistance = distance;
            best = { x, y, r };
          }
        }
      }
    }
    placed.push(best ?? { x: sum(placed.map((c) => c.r)) * 2, y: 0, r });
  }
  return placed;
}

/** Near-minimal enclosing circle: Bădoiu–Clarkson steps toward the farthest circle edge. */
function encloseCircles(circles: readonly Circle[]): Circle {
  let c = { x: 0, y: 0 };
  const far = () => {
    let best = { x: 0, y: 0, d: -1 };
    for (const k of circles) {
      const dx = k.x - c.x;
      const dy = k.y - c.y;
      const d = Math.hypot(dx, dy);
      const reach = d + k.r;
      if (reach > best.d) best = d > 0 ? { x: k.x + (dx / d) * k.r, y: k.y + (dy / d) * k.r, d: reach } : { x: k.x + k.r, y: k.y, d: reach };
    }
    return best;
  };
  for (let i = 0; i < 300; i += 1) {
    const p = far();
    c = { x: c.x + (p.x - c.x) / (i + 2), y: c.y + (p.y - c.y) / (i + 2) };
  }
  return { ...c, r: far().d };
}

/** Packs radii (sorted descending) so that once scaled into `radius` the circles stay `gap` px apart. */
function packInto(radii: readonly number[], radius: number, gap: number): Circle[] {
  if (radii.length === 0) return [];
  let scale = radius / Math.max(1e-9, encloseCircles(packCircles(radii, 0)).r);
  let circles: Circle[] = [];
  let bound: Circle = { x: 0, y: 0, r: 1 };
  for (let pass = 0; pass < 4; pass += 1) {
    circles = packCircles(radii, gap / 2 / scale);
    bound = encloseCircles(circles);
    scale = radius / bound.r;
  }
  return circles.map((c, i) => ({ x: (c.x - bound.x) * scale, y: (c.y - bound.y) * scale, r: (radii[i] ?? 0) * scale }));
}

export interface CirclePackingChartProps extends PartsBaseProps {
  data: readonly GroupedPartDatum[];
  /** Group legend above; on by default for several groups. Clicking a group hides its circles. */
  legend?: boolean;
}

/** Circle area ∝ value, 1,5 px apart, packed tight on a fill-1 whole; the name inside when it fits, otherwise the number. */
export function CirclePackingChart({ data, formatValue = formatNumber, legend, className, 'aria-label': label, ...props }: CirclePackingChartProps) {
  const [ref, width] = useWidth(FALLBACK_WIDTH);
  const nav = useNav();
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const { groups, items } = groupedItems(data, hidden);
  const R = Math.max(40, Math.min(136, width / 2 - 4));
  const cx = width / 2;
  const cy = R + 9;
  const height = 2 * R + 18;
  const key = `${items.map((item) => item.value).join(',')}|${R}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the key is the content of the values
  const packed = useMemo(() => packInto(items.map((item) => Math.sqrt(item.value)), R - 6, 1.5), [key]);
  const circles = packed.map((c) => ({ x: cx + c.x, y: cy + c.y, r: c.r }));
  const marks = items.map((item, i) => {
    const c = circles[i] ?? { x: cx, y: cy, r: 0 };
    return groupedMark(item, c.x, c.y, formatValue);
  });
  const active = nav.at(marks.length);

  return (
    <div data-slot="parts-chart" data-kind="circle-packing" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? groups.names.length > 1) ? <GroupLegend names={groups.names} color={groups.color} hidden={hidden} toggle={toggle} onHover={setHovered} /> : null}
      <Plot plotRef={ref} label={label} table={shareTable(items, formatValue, groups.names.length > 0)} width={width} height={height} marks={marks} nav={nav}>
        <circle data-slot="parts-chart-bound" data-cx={cx} data-cy={cy} data-r={R} cx={cx} cy={cy} r={R} fill="var(--color-fill-1)" />
        {items.map((item, i) => {
          const c = circles[i] ?? { x: cx, y: cy, r: 0 };
          const dim = (active !== null && active !== i) || (hovered !== null && hovered !== item.group);
          return (
            <circle
              key={item.label}
              data-slot="parts-chart-mark"
              data-label={item.label}
              data-group={item.group}
              data-value={item.value}
              data-cx={c.x}
              data-cy={c.y}
              data-r={c.r}
              cx={c.x}
              cy={c.y}
              r={c.r}
              fill={item.color}
              opacity={dim ? DIM : 1}
              className={POP}
              style={enterStyle({}, i * 30)}
              {...nav.hover(i)}
            />
          );
        })}
        {items.map((item, i) => {
          const c = circles[i];
          if (!c) return null;
          const value = formatValue(item.value);
          if (c.r >= 20 && fits(item.label, 11, 2 * c.r - 8) && fits(value, 11, 2 * c.r - 8)) {
            return (
              <g key={item.label} className={FADE}>
                <text x={c.x} y={c.y - 2} textAnchor="middle" className={cn(TINY, 'font-semibold')}>
                  {item.label}
                </text>
                <text x={c.x} y={c.y + 12} textAnchor="middle" className={TINY}>
                  {value}
                </text>
              </g>
            );
          }
          const short = formatAxisValue(item.value);
          return c.r >= 9 && fits(short, 11, 2 * c.r - 4) ? (
            <text key={item.label} x={c.x} y={c.y + 4} textAnchor="middle" className={cn(TINY, 'font-semibold', FADE)}>
              {short}
            </text>
          ) : null;
        })}
      </Plot>
    </div>
  );
}
