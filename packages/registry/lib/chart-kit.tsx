import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { cn } from './cn';

/* Shared ground for every chart: palette, scales, curves, the focusable plot with its screen-reader table, legend and tooltip. */

/** Series colours in legend order; all eight keep 3:1 against the surfaces in every theme. */
export const CHART_COLORS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `var(--color-chart-${n})`);
/** Sequential ramp for heat maps and choropleths, light to dark. */
export const SEQUENTIAL_COLORS = [1, 2, 3, 4, 5].map((n) => `var(--color-seq-${n})`);
/** Diverging ramp: negative 2 → 1, neutral middle, positive 1 → 2. */
export const DIVERGING_COLORS = ['var(--color-div-neg-2)', 'var(--color-div-neg-1)', 'var(--color-div-mid)', 'var(--color-div-pos-1)', 'var(--color-div-pos-2)'];

/** The palette colour of the n-th series, cycling after eight. */
export const seriesColor = (index: number, color?: string): string => color ?? CHART_COLORS[index % CHART_COLORS.length] ?? 'currentColor';

/** Russian number, at most one decimal: «1 284,5». */
export const formatNumber = (value: number): string => value.toLocaleString('ru-RU', { maximumFractionDigits: 1 });

/** Share as «24,6 %». */
export const formatPercent = (share: number): string =>
  `${(share * 100).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

/** Axis label: «80 тыс», «1,5 млн», «15». */
export function formatAxisValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${formatNumber(value / 1e6)} млн`;
  if (abs >= 1e3) return `${formatNumber(value / 1e3)} тыс`;
  return formatNumber(value);
}

const niceStep = (span: number, intervals: number) => {
  const raw = span / intervals;
  const power = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((candidate) => candidate >= raw) ?? 10 * power;
};

const round = (value: number) => Math.round(value * 1e6) / 1e6;

/** Round ticks from 0 to just above `max`: steps of 1, 2, 2.5 or 5 × 10ⁿ, about four intervals. */
export function niceTicks(max: number, intervals = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const step = niceStep(max, intervals);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) ticks.push(round(value));
  return ticks;
}

/** Round ticks covering min…max, through zero when the range crosses it; for deviations, temperatures, P&L. */
export function niceRangeTicks(min: number, max: number, intervals = 4): number[] {
  const low = Math.min(min, max, 0);
  const high = Math.max(min, max, 0);
  if (!(high - low > 0)) return [0, 1];
  const step = niceStep(high - low, intervals);
  const ticks: number[] = [];
  for (let value = Math.floor(low / step) * step; value <= Math.ceil(high / step) * step + step / 2; value += step) ticks.push(round(value));
  return ticks;
}

/** Round ticks covering min…max without forcing zero: scales that start near the data (dot plots, ranges, prices). */
export function niceExtentTicks(min: number, max: number, intervals = 4): number[] {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  const span = high - low || Math.abs(high) || 1;
  const step = niceStep(span, intervals);
  const ticks: number[] = [];
  for (let value = Math.floor(low / step) * step; value <= Math.ceil(high / step) * step + step / 2; value += step) ticks.push(round(value));
  return ticks;
}

/** Linear map from a domain to pixels; a zero-width domain maps to the range start. */
export function linearScale([d0, d1]: readonly [number, number], [r0, r1]: readonly [number, number]): (value: number) => number {
  const span = d1 - d0;
  return (value) => (span === 0 ? r0 : r0 + ((value - d0) / span) * (r1 - r0));
}

export interface Point {
  x: number;
  y: number;
}

/** Monotone cubic curve through the points: smooth, never overshoots the data. */
export function smoothPath(points: readonly Point[]): string {
  const n = points.length;
  const first = points[0];
  if (!first) return '';
  if (n === 1) return `M${first.x} ${first.y}`;
  const at = (i: number): Point => points[i] ?? first;
  const slope = (i: number) => (at(i + 1).y - at(i).y) / (at(i + 1).x - at(i).x || 1);
  const tangent = (i: number) => {
    if (i === 0) return slope(0);
    if (i === n - 1) return slope(n - 2);
    const left = slope(i - 1);
    const right = slope(i);
    if (left * right <= 0) return 0;
    const dl = at(i).x - at(i - 1).x;
    const dr = at(i + 1).x - at(i).x;
    return (3 * (dl + dr)) / ((2 * dr + dl) / left + (dr + 2 * dl) / right);
  };
  let d = `M${first.x} ${first.y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const a = at(i);
    const b = at(i + 1);
    const third = (b.x - a.x) / 3;
    d += ` C${a.x + third} ${a.y + tangent(i) * third} ${b.x - third} ${b.y - tangent(i + 1) * third} ${b.x} ${b.y}`;
  }
  return d;
}

/** Straight segments through the points. */
export const linePath = (points: readonly Point[]): string => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join('');

/** Point on a circle; 0 rad is 12 o'clock, clockwise. */
export const polar = (cx: number, cy: number, r: number, angle: number): Point => ({ x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle) });

/** Ring sector between two angles (0 rad at 12 o'clock); inner 0 draws a pie slice. */
export function arcPath(cx: number, cy: number, inner: number, outer: number, start: number, end: number): string {
  const large = end - start > Math.PI ? 1 : 0;
  const a = polar(cx, cy, outer, start);
  const b = polar(cx, cy, outer, end);
  if (inner <= 0) return `M${cx} ${cy}L${a.x} ${a.y}A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y}Z`;
  const c = polar(cx, cy, inner, end);
  const d = polar(cx, cy, inner, start);
  return `M${a.x} ${a.y}A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y}L${c.x} ${c.y}A${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y}Z`;
}

/** Rectangle with only the top corners rounded (a column), clamped to its own size. */
export function columnPath(x: number, top: number, width: number, bottom: number, radius = 4): string {
  const r = Math.max(0, Math.min(radius, width / 2, bottom - top));
  return `M${x} ${bottom}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + width - r}Q${x + width} ${top} ${x + width} ${top + r}V${bottom}Z`;
}

/** Width of the element, measured; `fallback` until the first layout (and in tests). */
export function useWidth<T extends HTMLElement = HTMLDivElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  const [, setFontsReady] = useState(false);
  // labels are measured with measureText: draw once more when web fonts land, the first pass saw the fallback font
  useEffect(() => {
    let live = true;
    void document.fonts?.ready.then(() => {
      if (live) setFontsReady(true);
    });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** SVG ids from useId may contain characters that break `url(#…)`. */
export const svgId = (id: string): string => `kv${id.replace(/[^\w-]/g, '')}`;

/** ← → Home End over `count` items; returns the next index or null when the key is not ours. */
export function stepIndex(key: string, active: number | null, count: number): number | null {
  const keys: Record<string, number> = { ArrowRight: (active ?? -1) + 1, ArrowLeft: (active ?? count) - 1, Home: 0, End: count - 1 };
  const next = keys[key];
  if (next === undefined || count === 0) return null;
  return Math.min(count - 1, Math.max(0, next));
}

/* ---------- The plot host: focusable group, live region and data table for screen readers ---------- */

export interface ChartTable {
  /** Header of the first column: «Период», «Регион». */
  rowHeader: string;
  columns: readonly string[];
  rows: readonly { header: string; cells: readonly string[] }[];
}

export interface ChartPlotProps {
  ref?: Ref<HTMLDivElement>;
  'aria-label': string;
  /** The data as a table; every chart is readable without seeing it. */
  table: ChartTable;
  /** What ← → just landed on, read out politely. */
  spoken?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onBlur?: () => void;
  /** Off for charts without keyboard stepping: the group is then not a tab stop. */
  focusable?: boolean;
  className?: string;
  children: ReactNode;
}

/** Wraps the SVG: role group «график», a tab stop for ← →, a polite live region and the sr-only data table. */
export function ChartPlot({ ref, 'aria-label': label, table, spoken, onKeyDown, onBlur, focusable = true, className, children }: ChartPlotProps) {
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="график"
      aria-label={label}
      tabIndex={focusable ? 0 : undefined}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className={cn('relative w-full rounded-md focus-visible:outline-offset-4', className)}
    >
      {children}
      <p aria-live="polite" className="sr-only">
        {spoken}
      </p>
      {/* sr-only on the table itself does not hold: a table grows to its content and widens the page */}
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">{table.rowHeader}</th>
              {table.columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                <th scope="row">{row.header}</th>
                {row.cells.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Legend ---------- */

export type LegendMarkerKind = 'line' | 'square' | 'dot' | 'diamond';

export function LegendMarker({ kind, color, hidden }: { kind: LegendMarkerKind; color: string; hidden?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn('shrink-0', kind === 'line' ? 'h-0.5 w-3 rounded-full' : kind === 'dot' ? 'size-2 rounded-full' : kind === 'diamond' ? 'size-2 rotate-45 rounded-[1px]' : 'size-2 rounded-[2px]')}
      style={hidden ? { boxShadow: 'inset 0 0 0 1px var(--color-fg-4)' } : { background: color }}
    />
  );
}

export interface ChartLegendProps {
  /** `marker` per item overrides the legend's own, e.g. a dot for «now» next to a line for «before». */
  items: readonly { name: string; color: string; marker?: LegendMarkerKind }[];
  marker: LegendMarkerKind;
  /** Hidden series; with `onToggle` the items are toggle buttons, otherwise a plain list. */
  hidden?: ReadonlySet<string>;
  onToggle?: (name: string) => void;
  onHover?: (name: string | null) => void;
  className?: string;
}

/** Legend h28 above the plot: buttons that hide a series (aria-pressed), or a static list for charts that cannot hide. */
export function ChartLegend({ items, marker, hidden, onToggle, onHover, className }: ChartLegendProps) {
  if (!onToggle) {
    return (
      <ul className={cn('flex flex-wrap justify-end gap-x-4 gap-y-1', className)}>
        {items.map((item) => (
          <li key={item.name} className="inline-flex h-7 items-center gap-2 text-label-sm text-fg-2">
            <LegendMarker kind={item.marker ?? marker} color={item.color} />
            {item.name}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className={cn('flex flex-wrap justify-end gap-1', className)}>
      {items.map((item) => (
        <button
          key={item.name}
          type="button"
          aria-pressed={!hidden?.has(item.name)}
          onClick={() => onToggle(item.name)}
          onPointerEnter={() => onHover?.(item.name)}
          onPointerLeave={() => onHover?.(null)}
          onFocus={() => onHover?.(item.name)}
          onBlur={() => onHover?.(null)}
          className="kv-pressable inline-flex h-7 items-center gap-2 rounded-full px-2.5 text-label-sm text-fg-2 hover:bg-fill-2 hover:text-fg-1 aria-[pressed=false]:text-fg-3 aria-[pressed=false]:line-through"
        >
          <LegendMarker kind={item.marker ?? marker} color={item.color} hidden={hidden?.has(item.name)} />
          {item.name}
        </button>
      ))}
    </div>
  );
}

/** Toggle set for legends that hide series. */
export function useHiddenSeries() {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const toggle = (name: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  return [hidden, toggle] as const;
}

/* ---------- Tooltip ---------- */

export interface ChartTooltipRow {
  name: string;
  value: string;
  color?: string;
}

export interface ChartTooltipProps {
  /** Anchor in plot pixels; the tooltip flips to the left past 60 % of `width`. */
  x: number;
  width: number;
  /** Vertical position; the top of the plot by default. */
  y?: number;
  /** `above` hangs the tooltip over `y` (rows, points near the bottom); `below` starts at `y`. */
  placement?: 'below' | 'above';
  title: ReactNode;
  rows: readonly ChartTooltipRow[];
  marker?: LegendMarkerKind;
  /** «Всего» row under a separator. */
  total?: string;
}

const TOOLTIP_GAP = 12;
// min-w-44: the narrowest the tooltip gets, enough to decide the side without measuring it
const TOOLTIP_MIN = 176;

/** Right of the anchor; left when the right side has no room; pinned inside the plot when neither side has. */
function tooltipX(x: number, width: number): { left: number } {
  if (x + TOOLTIP_GAP + TOOLTIP_MIN <= width) return { left: x + TOOLTIP_GAP };
  if (x - TOOLTIP_GAP - TOOLTIP_MIN >= 0) return { left: x - TOOLTIP_GAP };
  return { left: Math.max(0, Math.min(x - TOOLTIP_MIN / 2, width - TOOLTIP_MIN)) };
}

/** Overlay r12 next to the pointer: a caption title, rows with marker, name and value, an optional total. */
export function ChartTooltip({ x, width, y = 4, placement = 'below', title, rows, marker = 'square', total }: ChartTooltipProps) {
  return (
    <div
      data-slot="chart-tooltip"
      className="pointer-events-none absolute z-10 flex min-w-44 flex-col gap-1.5 rounded-md bg-overlay px-3 py-2 text-label-sm shadow-overlay transition-opacity duration-(--duration-quick) starting:opacity-0"
      style={{ top: y, ...tooltipX(x, width), translate: `${x + TOOLTIP_GAP + TOOLTIP_MIN > width && x - TOOLTIP_GAP - TOOLTIP_MIN >= 0 ? '-100%' : '0'} ${placement === 'above' ? 'calc(-100% - 8px)' : '0'}` }}
    >
      <p className="text-caption text-fg-2">{title}</p>
      {rows.map((row) => (
        <div key={row.name} className="flex items-center gap-2">
          {row.color ? <LegendMarker kind={marker} color={row.color} /> : null}
          <span className="flex-1 text-fg-2">{row.name}</span>
          <span className="font-semibold text-fg-1 tabular-nums">{row.value}</span>
        </div>
      ))}
      {total !== undefined ? (
        <div className="mt-0.5 flex border-t border-separator pt-1.5">
          <span className="flex-1 text-fg-2">Всего</span>
          <span className="font-semibold text-fg-1 tabular-nums">{total}</span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Axes ---------- */

export interface ValueAxisProps {
  ticks: readonly number[];
  /** Value → y in px. */
  y: (value: number) => number;
  left: number;
  right: number;
  format?: (value: number) => string;
}

/** Horizontal grid in separator, the zero line in border, labels 12/16 fg-3 12px left of the plot. */
export function ValueAxis({ ticks, y, left, right, format = formatAxisValue }: ValueAxisProps) {
  return (
    <g data-slot="chart-axis">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={left} x2={right} y1={y(tick)} y2={y(tick)} stroke={tick === 0 ? 'var(--color-border)' : 'var(--color-separator)'} shapeRendering="crispEdges" />
          <text x={left - 12} y={y(tick)} textAnchor="end" dominantBaseline="middle" className="fill-fg-3 text-caption tabular-nums">
            {format(tick)}
          </text>
        </g>
      ))}
    </g>
  );
}

/* ---------- Text ---------- */

let measureContext: OffscreenCanvasRenderingContext2D | null | undefined;

/** Rendered width of a label in px; `font` is a CSS font shorthand. Falls back to 0.56 em per character where canvas is missing (jsdom). */
export function measureText(text: string, font = '400 12px Inter, sans-serif'): number {
  if (measureContext === undefined) {
    try {
      // OffscreenCanvas, not <canvas>: jsdom has none, so tests take the estimate without "not implemented" noise
      measureContext = typeof OffscreenCanvas === 'undefined' ? null : new OffscreenCanvas(1, 1).getContext('2d');
    } catch {
      measureContext = null;
    }
  }
  if (!measureContext) return text.length * 0.56 * (parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? '12') || 12);
  measureContext.font = font;
  return measureContext.measureText(text).width;
}

/** The label cut with «…» to fit `width` px; the full text belongs in the tooltip and the table. */
export function fitText(text: string, width: number, font?: string): string {
  if (measureText(text, font) <= width) return text;
  let end = text.length;
  while (end > 0 && measureText(`${text.slice(0, end).trimEnd()}…`, font) > width) end -= 1;
  return end > 0 ? `${text.slice(0, end).trimEnd()}…` : '';
}
