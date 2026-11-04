import { useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';
import {
  ChartLegend,
  ChartPlot,
  ChartTooltip,
  ValueAxis,
  columnPath,
  formatNumber,
  formatPercent,
  linePath,
  linearScale,
  measureText,
  niceExtentTicks,
  niceRangeTicks,
  niceTicks,
  seriesColor,
  smoothPath,
  stepIndex,
  useHiddenSeries,
  useWidth,
  type ChartTable,
  type Point,
} from '../lib/chart-kit';
import { cn } from '../lib/cn';

/* «Как разбросано?»: histogram, box plot, violin, ridgeline, beeswarm, jitter, population pyramid, Pareto, Lorenz, error bars, span, stem and leaf. */

/* ---------- Statistics ---------- */

export interface DistributionQuartiles {
  q1: number;
  median: number;
  q3: number;
}

export interface DistributionBox extends DistributionQuartiles {
  count: number;
  min: number;
  max: number;
  mean: number;
  iqr: number;
  /** Whisker ends: the most extreme values within 1.5 IQR of the box. */
  low: number;
  high: number;
  outliers: number[];
}

export interface DistributionBin {
  /** Bin [x0, x1); the last one also holds its right edge. */
  x0: number;
  x1: number;
  count: number;
}

export interface StemLeafRow {
  stem: number;
  leaves: number[];
}

export interface StemLeafPlot {
  /** Value of one stem step: 10 means stems are tens, leaves are units. */
  unit: number;
  rows: StemLeafRow[];
}

const EPSILON = 1e-9;
const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);
const sortedFinite = (values: readonly number[]): number[] => values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
const round6 = (value: number): number => Math.round(value * 1e6) / 1e6;
/** [min, max] of the values, [0, 1] when there are none. */
const extent = (values: readonly number[]): [number, number] => (values.length > 0 ? [Math.min(...values), Math.max(...values)] : [0, 1]);

/** Linear interpolation between closest ranks (Hyndman–Fan type 7, Excel QUARTILE.INC, NumPy default). */
function quantileSorted(sorted: readonly number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return Number.NaN;
  const position = (n - 1) * Math.min(1, Math.max(0, p));
  const lower = Math.floor(position);
  const a = sorted[lower] ?? 0;
  const b = sorted[Math.min(n - 1, lower + 1)] ?? a;
  return a + (b - a) * (position - lower);
}

function quartilesSorted(sorted: readonly number[]): DistributionQuartiles {
  return { q1: quantileSorted(sorted, 0.25), median: quantileSorted(sorted, 0.5), q3: quantileSorted(sorted, 0.75) };
}

function boxSorted(sorted: readonly number[]): DistributionBox {
  const { q1, median, q3 } = quartilesSorted(sorted);
  const iqr = q3 - q1;
  const inFences = (value: number) => value >= q1 - 1.5 * iqr - EPSILON && value <= q3 + 1.5 * iqr + EPSILON;
  const inside = sorted.filter(inFences);
  return {
    count: sorted.length,
    min: sorted[0] ?? Number.NaN,
    max: sorted[sorted.length - 1] ?? Number.NaN,
    mean: sorted.length > 0 ? sum(sorted) / sorted.length : Number.NaN,
    q1,
    median,
    q3,
    iqr,
    low: inside[0] ?? median,
    high: inside[inside.length - 1] ?? median,
    outliers: sorted.filter((value) => !inFences(value)),
  };
}

/** Smallest 1, 2, 2.5 or 5 × 10ⁿ not below `raw`. */
function niceStep(raw: number): number {
  const power = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((candidate) => candidate >= raw - EPSILON) ?? 10 * power;
}

interface BinOptions {
  /** Bin width; default Freedman–Diaconis 2·IQR·n^−⅓ (Sturges when the IQR is 0), rounded to a nice step. */
  step?: number;
  /** Range to cover; default the data rounded out to whole steps. */
  domain?: readonly [number, number];
}

function histogramBins(values: readonly number[], { step, domain }: BinOptions = {}): DistributionBin[] {
  const sorted = sortedFinite(values);
  const n = sorted.length;
  const min = sorted[0];
  const max = sorted[n - 1];
  if (min === undefined || max === undefined) return [];
  let width = step;
  if (!(width && width > 0)) {
    const { q1, q3 } = quartilesSorted(sorted);
    const raw = q3 > q1 ? (2 * (q3 - q1)) / Math.cbrt(n) : (max - min) / (Math.ceil(Math.log2(n)) + 1);
    width = raw > 0 ? niceStep(raw) : 1;
  }
  const start = domain?.[0] ?? Math.floor(min / width + EPSILON) * width;
  const end = domain?.[1] ?? Math.max(start + width, Math.ceil(max / width - EPSILON) * width);
  const count = Math.max(1, Math.round((end - start) / width));
  const bins = Array.from({ length: count }, (_, i) => ({ x0: round6(start + i * width), x1: round6(start + (i + 1) * width), count: 0 }));
  for (const value of sorted) {
    if (value < start - EPSILON || value > end + EPSILON) continue;
    const bin = bins[Math.min(count - 1, Math.floor((value - start) / width + EPSILON))];
    if (bin) bin.count += 1;
  }
  return bins;
}

/** Silverman's rule of thumb: 0.9 · min(σ, IQR / 1.34) · n^−⅕. */
function silvermanBandwidth(values: readonly number[]): number {
  const sorted = sortedFinite(values);
  const n = sorted.length;
  if (n < 2) return 1;
  const mean = sum(sorted) / n;
  const sd = Math.sqrt(sum(sorted.map((value) => (value - mean) ** 2)) / (n - 1));
  const { q1, q3 } = quartilesSorted(sorted);
  const spread = [sd, (q3 - q1) / 1.34].filter((value) => value > 0);
  const scale = spread.length > 0 ? Math.min(...spread) : Math.abs(mean) * 0.1 || 1;
  return 0.9 * scale * n ** -0.2;
}

/** Gaussian kernel density of `values` at each point of `at`. */
function kde(values: readonly number[], at: readonly number[], bandwidth: number): number[] {
  const sample = values.filter((value) => Number.isFinite(value));
  const h = bandwidth > 0 ? bandwidth : 1;
  const norm = 1 / (sample.length * h * Math.sqrt(2 * Math.PI));
  return at.map((x) => (sample.length === 0 ? 0 : norm * sum(sample.map((value) => Math.exp(-0.5 * ((x - value) / h) ** 2)))));
}

/** Gini coefficient of non-negative values: 0 is equality, (n − 1) / n is one holder of everything. */
function gini(values: readonly number[]): number {
  const sorted = sortedFinite(values);
  const n = sorted.length;
  const total = sum(sorted);
  if (n === 0 || total <= 0) return 0;
  return sum(sorted.map((value, i) => (2 * (i + 1) - n - 1) * value)) / (n * total);
}

/** Lorenz curve: share of the smallest holders (x) against their share of the total (y), from 0,0 to 1,1. */
function lorenzCurve(values: readonly number[]): Point[] {
  const sorted = sortedFinite(values);
  const n = sorted.length;
  const total = sum(sorted);
  const points: Point[] = [{ x: 0, y: 0 }];
  let running = 0;
  sorted.forEach((value, i) => {
    running += value;
    points.push({ x: (i + 1) / n, y: total > 0 ? running / total : (i + 1) / n });
  });
  return points;
}

/** Offsets across the axis for dots at `xs` (px): each dot takes the free spot closest to the axis, `2r + gap` apart. */
function beeswarm(xs: readonly number[], radius: number, gap = 1): number[] {
  const distance = 2 * radius + gap;
  const order = xs.map((_, i) => i).sort((a, b) => (xs[a] ?? 0) - (xs[b] ?? 0));
  const placed: Point[] = [];
  const offsets = xs.map(() => 0);
  let from = 0;
  for (const index of order) {
    const x = xs[index] ?? 0;
    while (from < placed.length && x - (placed[from]?.x ?? 0) >= distance) from += 1;
    const near = placed.slice(from);
    const candidates = [
      0,
      ...near.flatMap((p) => {
        const dy = Math.sqrt(distance ** 2 - (x - p.x) ** 2);
        return [p.y - dy, p.y + dy];
      }),
    ].sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
    const y = candidates.find((c) => near.every((p) => (x - p.x) ** 2 + (c - p.y) ** 2 >= distance ** 2 - 1e-6)) ?? 0;
    placed.push({ x, y });
    offsets[index] = y;
  }
  return offsets;
}

/** Mulberry32: a tiny seeded generator, so the same data always jitters the same way. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` offsets in [−1, 1) from `seed`. */
function jitter(count: number, seed = 1): number[] {
  const random = seededRandom(seed);
  return Array.from({ length: count }, () => random() * 2 - 1);
}

/** Stems step by `unit` (default the power of ten under the range), leaves are the next digit; empty stems stay to keep the shape. */
function stemLeaf(values: readonly number[], unit?: number): StemLeafPlot {
  const sorted = sortedFinite(values);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const span = min !== undefined && max !== undefined && max > min ? max - min : Math.abs(max ?? 0) || 10;
  const step = unit && unit > 0 ? unit : 10 ** Math.floor(Math.log10(span));
  if (min === undefined || max === undefined) return { unit: step, rows: [] };
  // shortcut: negative values get leaves from floor division (−3 → stem −1, leaf 7); add signed stems if such data appears.
  const stemOf = (value: number) => Math.floor(value / step + EPSILON);
  const first = stemOf(min);
  const rows: StemLeafRow[] = Array.from({ length: stemOf(max) - first + 1 }, (_, i) => ({ stem: first + i, leaves: [] }));
  for (const value of sorted) {
    const stem = stemOf(value);
    rows[stem - first]?.leaves.push(Math.min(9, Math.floor((value - stem * step) / (step / 10) + EPSILON)));
  }
  return { unit: step, rows };
}

/** Statistics behind the distribution charts, for captions, tables and custom charts. */
export const distributionStats = {
  /** Quantile `p` ∈ [0, 1] by linear interpolation between ranks (type 7). */
  quantile: (values: readonly number[], p: number): number => quantileSorted(sortedFinite(values), p),
  quartiles: (values: readonly number[]): DistributionQuartiles => quartilesSorted(sortedFinite(values)),
  /** Five numbers, 1.5 IQR whiskers and outliers. */
  box: (values: readonly number[]): DistributionBox => boxSorted(sortedFinite(values)),
  bins: histogramBins,
  silverman: silvermanBandwidth,
  kde,
  gini,
  lorenz: lorenzCurve,
  beeswarm,
  jitter,
  random: seededRandom,
  stemLeaf,
};

/* ---------- Shared pieces ---------- */

const NBSP = ' ';
const signedNumber = (value: number): string => (value > 0 ? `+${formatNumber(value)}` : value < 0 ? `−${formatNumber(-value)}` : '0');
const wholePercent = (share: number): string => `${formatNumber(share * 100)}${NBSP}%`;

/** Russian plural: 1 значение, 3 значения, 5 значений. */
function plural(count: number, [one, few, many]: readonly [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word = mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
  return `${count} ${word}`;
}
const VALUE_WORDS = ['значение', 'значения', 'значений'] as const;

/** Tick labels in the units of the largest tick: «0 50 100 … 300 тыс ₽». Percent ticks (or all with `every`) carry the unit, others only the last one. */
function axisFormat(ticks: readonly number[], unit = '', signed = false, every = unit === '%'): (value: number) => string {
  const top = Math.max(0, ...ticks.map((tick) => Math.abs(tick)));
  const [scale, word] = /^(тыс|млн)/.test(unit) ? [1, ''] : top >= 1e6 ? [1e6, 'млн'] : top >= 1e3 ? [1e3, 'тыс'] : [1, ''];
  const suffix = [word, unit].filter(Boolean).join(NBSP);
  const last = ticks[ticks.length - 1];
  return (value) => {
    const text = signed ? signedNumber(value / scale) : formatNumber(value / scale);
    return suffix && (every || value === last) ? `${text}${NBSP}${suffix}` : text;
  };
}

const xIntervals = (span: number): number => Math.max(3, Math.min(8, Math.floor(span / 80)));
const yIntervals = (span: number): number => Math.max(2, Math.min(6, Math.round(span / 40)));
const textWidth = (text: string, size: number, weight = 400): number => measureText(text, `${weight} ${size}px 'Inter Variable', Inter, sans-serif`);
const widest = (labels: readonly string[], size: number, weight = 400): number => Math.ceil(Math.max(0, ...labels.map((label) => textWidth(label, size, weight))));
/** Room for right-aligned row labels plus the gap to the plot. */
const labelColumn = (labels: readonly string[], size: number, min: number, pad = 24, weight = 400): number => Math.max(min, widest(labels, size, weight) + pad);

/** Plot right edge so that a label `width` px wide, 8px after each end value, stays inside `total`. */
function fitRight(total: number, left: number, [t0, t1]: readonly [number, number], ends: readonly { value: number; width: number }[]): number {
  const fractions = ends.map((end) => ({ f: (end.value - t0) / (t1 - t0 || 1), width: end.width }));
  return Math.max(left + 1, Math.min(total - 8, ...fractions.filter((end) => end.f > 0).map((end) => left + (total - 8 - end.width - left) / end.f)));
}

/** Tooltip under the anchor in the upper half of the plot, over it in the lower half. */
const tipPlace = (top: number, bottom: number, height: number): { y: number; placement: 'below' | 'above' } =>
  top + bottom < height ? { y: bottom + 4, placement: 'below' } : { y: top - 4, placement: 'above' };

/** Splits a category label into at most two lines that fit `width`. */
function wrapLabel(label: string, width: number, size: number): string[] {
  const words = label.split(' ');
  if (words.length < 2 || textWidth(label, size) <= width) return [label];
  const gap = (n: number) => Math.abs(words.slice(0, n).join(' ').length - words.slice(n).join(' ').length);
  let best = 1;
  for (let i = 2; i < words.length; i += 1) if (gap(i) < gap(best)) best = i;
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/** Horizontal bar from `inner` to `outer` with only the outer corners rounded. */
function sideBarPath(inner: number, outer: number, top: number, height: number, radius = 4): string {
  const dir = outer >= inner ? 1 : -1;
  const r = Math.max(0, Math.min(radius, Math.abs(outer - inner), height / 2));
  const bottom = top + height;
  return `M${inner} ${top}H${outer - dir * r}Q${outer} ${top} ${outer} ${top + r}V${bottom - r}Q${outer} ${bottom} ${outer - dir * r} ${bottom}H${inner}Z`;
}

// One-time entrance as in chart.tsx; with reduced motion the final state shows at once.
const REVEAL_X =
  'transition-[clip-path] duration-(--duration-deliberate) ease-out [clip-path:inset(-12px_-12px_-12px_-12px)] starting:[clip-path:inset(-12px_100%_-12px_-12px)] motion-reduce:transition-none';
const GROW_Y = 'origin-bottom transition-[scale] duration-(--duration-slow) ease-standard [transform-box:fill-box] starting:scale-y-0 motion-reduce:transition-none';
const GROW_X = 'transition-[scale] duration-(--duration-slow) ease-standard [transform-box:fill-box] starting:scale-x-0 motion-reduce:transition-none';
const FADE = 'transition-opacity duration-(--duration-slow) ease-out starting:opacity-0 motion-reduce:transition-none';
const stagger = (index: number, step = 35) => ({ transitionDelay: `${index * step}ms` });

function Frame({ kind, legend, className, children, ...props }: ComponentProps<'div'> & { kind: string; legend?: ReactNode }) {
  return (
    <div data-slot="distribution-chart" data-kind={kind} className={cn('flex flex-col gap-3', className)} {...props}>
      {legend}
      {children}
    </div>
  );
}

interface BottomAxisProps {
  ticks: readonly number[];
  x: (value: number) => number;
  /** Baseline of the labels. */
  y: number;
  format: (value: number) => string;
  /** Vertical grid from y0 to y1: separator, zero in border. */
  grid?: readonly [number, number];
}

/** Value axis along the bottom: labels 12 fg-3, the last one end-aligned; labels that would collide are skipped, the last always stays. */
function BottomAxis({ ticks, x, y, format, grid }: BottomAxisProps) {
  const last = ticks.length - 1;
  const lastTick = ticks[last] ?? 0;
  const lastLeft = last > 0 ? x(lastTick) - textWidth(format(lastTick), 12) : Number.POSITIVE_INFINITY;
  const shown = ticks.map((_, i) => i === last);
  let edge = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < last; i += 1) {
    const tick = ticks[i] ?? 0;
    const half = textWidth(format(tick), 12) / 2;
    if (x(tick) - half >= edge + 8 && x(tick) + half + 8 <= lastLeft) {
      shown[i] = true;
      edge = x(tick) + half;
    }
  }
  return (
    <g data-slot="chart-axis">
      {ticks.map((tick, i) => (
        <g key={tick}>
          {grid ? (
            <line x1={x(tick)} x2={x(tick)} y1={grid[0]} y2={grid[1]} stroke={tick === 0 ? 'var(--color-border)' : 'var(--color-separator)'} shapeRendering="crispEdges" />
          ) : null}
          {shown[i] ? (
            <text x={x(tick)} y={y} textAnchor={i === last && i > 0 ? 'end' : 'middle'} className="fill-fg-3 text-caption tabular-nums">
              {format(tick)}
            </text>
          ) : null}
        </g>
      ))}
    </g>
  );
}

const ROW_KEYS: Readonly<Record<string, string>> = { ArrowUp: 'ArrowLeft', ArrowDown: 'ArrowRight' };

/** One active item stepped by ← → ↑ ↓ Home End and announced through the plot's live region. */
function useStepper(count: number, describe: (index: number) => string) {
  const [active, setActive] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = stepIndex(ROW_KEYS[event.key] ?? event.key, active, count);
    if (index === null) return;
    event.preventDefault();
    setActive(index);
    setSpoken(describe(index));
  };
  return { active, setActive, plot: { spoken, onKeyDown, onBlur: () => setActive(null) } };
}

interface PointRef {
  group: number;
  /** Position in the group sorted by value. */
  rank: number;
}

/** Dots in groups: keys along the value axis walk the values, keys across it jump to the next group at the nearest value. */
function usePointStepper(groups: readonly (readonly number[])[], along: 'x' | 'y', describe: (ref: PointRef) => string) {
  const [active, setActive] = useState<PointRef | null>(null);
  const [spoken, setSpoken] = useState('');
  const valueKeys: Readonly<Record<string, number>> = along === 'x' ? { ArrowLeft: -1, ArrowRight: 1 } : { ArrowDown: -1, ArrowUp: 1 };
  const groupKeys: Readonly<Record<string, number>> = along === 'x' ? { ArrowUp: -1, ArrowDown: 1 } : { ArrowLeft: -1, ArrowRight: 1 };
  const nearest = (target: number, value: number): PointRef => {
    const candidates = groups[target] ?? [];
    let rank = 0;
    candidates.forEach((candidate, i) => {
      if (Math.abs(candidate - value) < Math.abs((candidates[rank] ?? 0) - value)) rank = i;
    });
    return { group: target, rank };
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    const valueStep = valueKeys[key];
    const groupStep = groupKeys[key];
    const filled = groups.flatMap((values, group) => (values.length > 0 ? [group] : []));
    const first = filled[0];
    if ((valueStep === undefined && groupStep === undefined && key !== 'Home' && key !== 'End') || first === undefined) return;
    let next: PointRef;
    if (!active) next = { group: first, rank: key === 'End' ? (groups[first]?.length ?? 1) - 1 : 0 };
    else {
      const last = (groups[active.group]?.length ?? 1) - 1;
      if (valueStep !== undefined) next = { group: active.group, rank: Math.min(last, Math.max(0, active.rank + valueStep)) };
      else if (groupStep === undefined) next = { group: active.group, rank: key === 'Home' ? 0 : last };
      else {
        const target = groupStep > 0 ? filled.find((g) => g > active.group) : filled.filter((g) => g < active.group).pop();
        next = target === undefined ? active : nearest(target, groups[active.group]?.[active.rank] ?? 0);
      }
    }
    event.preventDefault();
    setActive(next);
    setSpoken(describe(next));
  };
  return { active, setActive, plot: { spoken, onKeyDown, onBlur: () => setActive(null) } };
}

export interface DistributionGroup {
  /** Category, row or series name. */
  name: string;
  values: readonly number[];
  /** Name of each value for the tooltip: a manager, a deal. */
  labels?: readonly string[];
  color?: string;
}

interface Dot {
  value: number;
  label?: string;
}

const dotsOf = (group: DistributionGroup): Dot[] =>
  group.values.flatMap((value, i) => (Number.isFinite(value) ? [{ value, label: group.labels?.[i] }] : []));

interface BaseProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the chart shows; screen readers also get the data as a table. */
  'aria-label': string;
  /** Value format in labels and the tooltip (default: Russian number). */
  formatValue?: (value: number) => string;
  /** Unit after the last axis label: «ч», «дн», «₽»; «%» goes on every label. */
  unit?: string;
}

/* ---------- Histogram ---------- */

export interface HistogramChartProps extends BaseProps {
  values: readonly number[];
  /** Bin width; default Freedman–Diaconis rounded to 1, 2, 2,5 or 5 × 10ⁿ (Sturges when the IQR is 0). */
  step?: number;
  domain?: readonly [number, number];
  /** Name of the count in the tooltip: «Сделок». */
  countLabel?: string;
  /** Dashed median line with a caption. */
  median?: boolean;
  medianLabel?: string;
  /** Plot height in px, without the axis labels. */
  height?: number;
  color?: string;
}

const HIST = { top: 8, bottom: 28, left: 48 };

/** Touching columns with a 2px gap over a continuous scale; the median is a dashed fg-1 line with its value. */
export function HistogramChart({
  values,
  step,
  domain,
  formatValue = formatNumber,
  unit,
  countLabel = 'Количество',
  median = true,
  medianLabel = 'Медиана',
  height = 196,
  color,
  className,
  'aria-label': label,
  ...props
}: HistogramChartProps) {
  const [ref, width] = useWidth(560);
  const bins = histogramBins(values, { step, domain });
  const total = sum(bins.map((bin) => bin.count));
  const fill = seriesColor(0, color);
  const plotW = Math.max(1, width - HIST.left);
  const yTicks = niceTicks(Math.max(0, ...bins.map((bin) => bin.count)), yIntervals(height));
  const yMax = yTicks[yTicks.length - 1] ?? 1;
  const y = (count: number) => HIST.top + height - (count / yMax) * height;
  const baseline = y(0);
  const d0 = bins[0]?.x0 ?? 0;
  const d1 = bins[bins.length - 1]?.x1 ?? 1;
  const x = linearScale([d0, d1], [HIST.left, HIST.left + plotW]);
  const xTicks = niceExtentTicks(d0, d1, xIntervals(plotW)).filter((tick) => tick >= d0 - EPSILON && tick <= d1 + EPSILON);
  const mid = quantileSorted(sortedFinite(values), 0.5);
  const range = (bin: DistributionBin) => `${formatValue(bin.x0)}–${formatValue(bin.x1)}`;
  const { active, setActive, plot } = useStepper(bins.length, (i) => {
    const bin = bins[i];
    return bin ? `${range(bin)}: ${countLabel} ${bin.count}` : '';
  });
  const current = active === null ? undefined : bins[active];
  const mx = x(mid);
  const fullText = `${medianLabel} ${formatValue(mid)}`;
  const room = Math.max(HIST.left + plotW - mx, mx - HIST.left) - 8;
  // on a narrow plot the word goes and the value stays
  const medianText = textWidth(fullText, 12, 600) <= room ? fullText : formatValue(mid);
  const flip = mx + 8 + textWidth(medianText, 12, 600) > HIST.left + plotW;

  return (
    <Frame kind="histogram" className={className} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{ rowHeader: 'Интервал', columns: [countLabel], rows: bins.map((bin) => ({ header: range(bin), cells: [String(bin.count)] })) }}
        {...plot}
      >
        <svg aria-hidden width={width} height={height + HIST.top + HIST.bottom} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          <ValueAxis ticks={yTicks} y={y} left={HIST.left} right={HIST.left + plotW} />
          <BottomAxis ticks={xTicks} x={x} y={baseline + 22} format={axisFormat(xTicks, unit)} />
          {current ? <rect x={x(current.x0)} y={HIST.top} width={x(current.x1) - x(current.x0)} height={height} rx={8} className="fill-fill-1" /> : null}
          {bins.map((bin, i) => (
            <path
              key={bin.x0}
              data-slot="histogram-bin"
              data-count={bin.count}
              fill={fill}
              d={bin.count > 0 ? columnPath(x(bin.x0) + 1, y(bin.count), Math.max(1, x(bin.x1) - x(bin.x0) - 2), baseline) : ''}
              style={stagger(i)}
              className={GROW_Y}
            />
          ))}
          {median && Number.isFinite(mid) ? (
            <g data-slot="distribution-median" className={FADE}>
              <line x1={mx} x2={mx} y1={HIST.top - 4} y2={baseline} stroke="var(--color-fg-1)" strokeWidth={1.5} strokeDasharray="4 3" />
              <text x={flip ? mx - 8 : mx + 8} y={HIST.top + 10} textAnchor={flip ? 'end' : 'start'} fontWeight={600} className="fill-fg-1 text-caption tabular-nums">
                {medianText}
              </text>
            </g>
          ) : null}
          {bins.map((bin, i) => (
            <rect
              key={bin.x0}
              data-slot="histogram-hit"
              x={x(bin.x0)}
              y={HIST.top}
              width={Math.max(1, x(bin.x1) - x(bin.x0))}
              height={height}
              fill="transparent"
              onPointerEnter={() => setActive(i)}
            />
          ))}
        </svg>
        {current ? (
          <ChartTooltip
            x={x((current.x0 + current.x1) / 2)}
            width={width}
            title={range(current)}
            rows={[
              { name: countLabel, value: String(current.count), color: fill },
              { name: 'Доля', value: formatPercent(total > 0 ? current.count / total : 0) },
            ]}
          />
        ) : null}
      </ChartPlot>
    </Frame>
  );
}

/* ---------- Box plot ---------- */

export interface BoxPlotChartProps extends BaseProps {
  groups: readonly DistributionGroup[];
  /** Row step in px; the box is 20 tall. */
  rowHeight?: number;
  /** Legend name of the box. */
  boxLabel?: string;
  outlierLabel?: string;
  /** Legend above the plot: the box and, when there are any, outliers. */
  legend?: boolean;
}

/** Horizontal boxes: 25–75 % in seq-2, median 2 fg-1, whiskers to 1.5 IQR in fg-3, outliers as dots 8 with a surface ring. */
export function BoxPlotChart({
  groups,
  formatValue = formatNumber,
  unit,
  rowHeight = 36,
  boxLabel = `50${NBSP}% значений`,
  outlierLabel = 'Выброс',
  legend = true,
  className,
  'aria-label': label,
  ...props
}: BoxPlotChartProps) {
  const [ref, width] = useWidth(560);
  const boxes = groups.map((group) => boxSorted(sortedFinite(group.values)));
  const left = labelColumn(groups.map((group) => group.name), 13, 72);
  const right = Math.max(left + 1, width - 8);
  const [lo, hi] = extent(groups.flatMap((group) => sortedFinite(group.values)));
  const ticks = niceRangeTicks(lo, hi, xIntervals(right - left));
  const x = linearScale([ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1], [left, right]);
  const rowsH = groups.length * rowHeight;
  const cy = (i: number) => i * rowHeight + rowHeight / 2;
  const range = (a: number, b: number) => `${formatValue(a)}–${formatValue(b)}`;
  const { active, setActive, plot } = useStepper(groups.length, (i) => {
    const box = boxes[i];
    if (!box) return '';
    const outliers = box.outliers.length > 0 ? `, выбросов ${box.outliers.length}` : '';
    return `${groups[i]?.name ?? ''}: медиана ${formatValue(box.median)}, квартили ${range(box.q1, box.q3)}, усы ${range(box.low, box.high)}${outliers}`;
  });
  const current = active === null ? undefined : boxes[active];
  const hasOutliers = boxes.some((box) => box.outliers.length > 0);

  return (
    <Frame
      kind="box-plot"
      className={className}
      legend={
        legend ? (
          <ChartLegend
          marker="square"
            items={[
              { name: boxLabel, color: 'var(--color-seq-2)', marker: 'square' },
              ...(hasOutliers ? [{ name: outlierLabel, color: seriesColor(0), marker: 'dot' as const }] : []),
            ]}
          />
        ) : null
      }
      {...props}
    >
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Группа',
          columns: ['Минимум', 'Q1', 'Медиана', 'Q3', 'Максимум', 'Выбросы'],
          rows: groups.map((group, i) => {
            const box = boxes[i];
            return {
              header: group.name,
              cells: box ? [...[box.min, box.q1, box.median, box.q3, box.max].map(formatValue), box.outliers.map(formatValue).join(', ') || '—'] : [],
            };
          }),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={rowsH + 24} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          <BottomAxis ticks={ticks} x={x} y={rowsH + 18} format={axisFormat(ticks, unit, false, true)} grid={[0, rowsH]} />
          {active !== null ? <rect x={0} y={active * rowHeight} width={width} height={rowHeight} rx={8} className="fill-fill-1" /> : null}
          {groups.map((group, i) => {
            const box = boxes[i];
            const y = cy(i);
            if (!box || box.count === 0) return null;
            return (
              <g key={group.name} data-slot="box-plot-row" data-median={box.median} data-q1={box.q1} data-q3={box.q3} data-low={box.low} data-high={box.high}>
                <text x={left - 12} y={y} textAnchor="end" dominantBaseline="middle" className={cn('text-label-sm', active === i ? 'fill-fg-1' : 'fill-fg-2')}>
                  {group.name}
                </text>
                <g className={REVEAL_X} style={stagger(i, 60)}>
                  <path
                    d={`M${x(box.low)} ${y}H${x(box.q1)}M${x(box.q3)} ${y}H${x(box.high)}M${x(box.low)} ${y - 6}V${y + 6}M${x(box.high)} ${y - 6}V${y + 6}`}
                    stroke="var(--color-fg-3)"
                    strokeWidth={1.5}
                    fill="none"
                  />
                  <rect data-slot="box-plot-box" x={x(box.q1)} y={y - 10} width={Math.max(1, x(box.q3) - x(box.q1))} height={20} rx={3} fill={group.color ?? 'var(--color-seq-2)'} />
                  <line data-slot="box-plot-median" x1={x(box.median)} x2={x(box.median)} y1={y - 10} y2={y + 10} stroke="var(--color-fg-1)" strokeWidth={2} />
                  {box.outliers.map((value, j) => (
                    <circle key={j} data-slot="box-plot-outlier" data-value={value} cx={x(value)} cy={y} r={4} fill={seriesColor(0)} stroke="var(--color-surface-1)" strokeWidth={2} />
                  ))}
                </g>
              </g>
            );
          })}
          {groups.map((group, i) => (
            <rect key={group.name} data-slot="box-plot-hit" x={0} y={i * rowHeight} width={width} height={rowHeight} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={x(current.median)}
            width={width}
            {...tipPlace(active * rowHeight, (active + 1) * rowHeight, rowsH)}
            title={groups[active]?.name}
            rows={[
              { name: 'Медиана', value: formatValue(current.median), color: 'var(--color-fg-1)' },
              { name: 'Квартили', value: range(current.q1, current.q3), color: groups[active]?.color ?? 'var(--color-seq-2)' },
              { name: 'Усы', value: range(current.low, current.high) },
              ...(current.outliers.length > 0 ? [{ name: 'Выбросы', value: String(current.outliers.length) }] : []),
              { name: 'Значений', value: String(current.count) },
            ]}
          />
        ) : null}
      </ChartPlot>
    </Frame>
  );
}

/* ---------- Violin ---------- */

export interface ViolinChartProps extends BaseProps {
  groups: readonly DistributionGroup[];
  /** Kernel width in value units («сглаживание 6 тыс»); default Silverman's rule per group. */
  bandwidth?: number;
  height?: number;
}

const VIOLIN = { top: 8, bottom: 28, left: 48 };

/** Mirrored density per group, one colour each; inside — quartiles as an fg-1 bar, the median as a surface dot with its value. */
export function ViolinChart({ groups, bandwidth, formatValue = formatNumber, unit, height = 230, className, 'aria-label': label, ...props }: ViolinChartProps) {
  const [ref, width] = useWidth(560);
  const sorted = groups.map((group) => sortedFinite(group.values));
  const boxes = sorted.map(boxSorted);
  const [lo, hi] = extent(sorted.flat());
  const yTicks = lo >= 0 ? niceTicks(hi, yIntervals(height)) : niceExtentTicks(lo, hi, yIntervals(height));
  const plotW = Math.max(1, width - VIOLIN.left);
  const y = linearScale([yTicks[0] ?? 0, yTicks[yTicks.length - 1] ?? 1], [VIOLIN.top + height, VIOLIN.top]);
  const band = plotW / Math.max(1, groups.length);
  const half = Math.min(64, band * 0.4);
  const cx = (i: number) => VIOLIN.left + (i + 0.5) * band;
  const range = (a: number, b: number) => `${formatValue(a)}–${formatValue(b)}`;
  const shapes = sorted.map((values, i) => {
    const h = bandwidth ?? silvermanBandwidth(values);
    const min = values[0];
    const max = values[values.length - 1];
    if (min === undefined || max === undefined || max <= min) return { h, d: '' };
    // tails run 1.5 bandwidths past the data, as seaborn's cut, but never past the axis
    const from = Math.max(yTicks[0] ?? min, min - 1.5 * h);
    const to = Math.min(yTicks[yTicks.length - 1] ?? max, max + 1.5 * h);
    const samples = Array.from({ length: 64 }, (_, k) => from + ((to - from) * k) / 63);
    const density = kde(values, samples, h);
    const peak = Math.max(...density) || 1;
    const side = (sign: number) => samples.map((value, k) => ({ x: cx(i) + (sign * (density[k] ?? 0) * half) / peak, y: y(value) }));
    return { h, d: `${linePath([...side(1), ...side(-1).reverse()])}Z` };
  });
  const { active, setActive, plot } = useStepper(groups.length, (i) => {
    const box = boxes[i];
    return box ? `${groups[i]?.name ?? ''}: медиана ${formatValue(box.median)}, квартили ${range(box.q1, box.q3)}, от ${formatValue(box.min)} до ${formatValue(box.max)}` : '';
  });
  const current = active === null ? undefined : boxes[active];
  const baseline = VIOLIN.top + height;

  return (
    <Frame kind="violin" className={className} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Группа',
          columns: ['Минимум', 'Q1', 'Медиана', 'Q3', 'Максимум', 'Значений'],
          rows: groups.map((group, i) => {
            const box = boxes[i];
            return { header: group.name, cells: box ? [...[box.min, box.q1, box.median, box.q3, box.max].map(formatValue), String(box.count)] : [] };
          }),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={height + VIOLIN.top + VIOLIN.bottom} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          <ValueAxis ticks={yTicks} y={y} left={VIOLIN.left} right={VIOLIN.left + plotW} format={axisFormat(yTicks, unit)} />
          {active !== null ? <rect x={cx(active) - band / 2} y={VIOLIN.top} width={band} height={height} rx={8} className="fill-fill-1" /> : null}
          {groups.map((group, i) => {
            const box = boxes[i];
            const shape = shapes[i];
            if (!box || !shape || box.count === 0) return null;
            return (
              <g key={group.name}>
                <path data-slot="violin" data-bandwidth={shape.h} d={shape.d} fill={seriesColor(i, group.color)} style={stagger(i, 60)} className={cn('origin-center', GROW_X)} />
                <g className={FADE} style={stagger(i, 60)}>
                  <rect x={cx(i) - 3} y={y(box.q3)} width={6} height={Math.max(1, y(box.q1) - y(box.q3))} fill="var(--color-fg-1)" />
                  <circle cx={cx(i)} cy={y(box.median)} r={4} fill="var(--color-surface-1)" />
                  <text x={cx(i) + 8} y={y(box.median)} dominantBaseline="middle" fontWeight={600} className="fill-fg-1 text-caption tabular-nums">
                    {formatValue(box.median)}
                  </text>
                </g>
                <text x={cx(i)} y={baseline + 20} textAnchor="middle" className={cn('text-caption', active === i ? 'fill-fg-1' : 'fill-fg-2')}>
                  {group.name}
                </text>
              </g>
            );
          })}
          {groups.map((group, i) => (
            <rect key={group.name} data-slot="violin-hit" x={cx(i) - band / 2} y={VIOLIN.top} width={band} height={height} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={cx(active) + half}
            width={width}
            title={groups[active]?.name}
            rows={[
              { name: 'Медиана', value: formatValue(current.median), color: seriesColor(active, groups[active]?.color) },
              { name: 'Квартили', value: range(current.q1, current.q3) },
              { name: 'Мин–макс', value: range(current.min, current.max) },
              { name: 'Значений', value: String(current.count) },
            ]}
          />
        ) : null}
      </ChartPlot>
    </Frame>
  );
}

/* ---------- Ridgeline ---------- */

export interface RidgelineChartProps extends BaseProps {
  /** Rows from the far (top) to the near (bottom) one. */
  groups: readonly DistributionGroup[];
  /** Row in chart-1 with its median; the others are seq-2 (default: the last row). */
  focus?: number;
  /** Legend name of the other rows. */
  restLabel?: string;
  medianLabel?: string;
  /** Kernel width in value units; default Silverman's rule per row. */
  bandwidth?: number;
  rowHeight?: number;
  /** Tallest ridge in rows; above 1 the ridges overlap. */
  overlap?: number;
}

/** Densities on one x and one height scale; nearer ridges cover farther ones with a 2px surface edge. */
export function RidgelineChart({
  groups,
  focus = groups.length - 1,
  restLabel = 'Остальные',
  medianLabel = 'медиана',
  bandwidth,
  rowHeight = 34,
  overlap = 1.45,
  formatValue = formatNumber,
  unit,
  className,
  'aria-label': label,
  ...props
}: RidgelineChartProps) {
  const [ref, width] = useWidth(560);
  const sorted = groups.map((group) => sortedFinite(group.values));
  const boxes = sorted.map(boxSorted);
  const left = labelColumn(groups.map((group) => group.name), 12, 48, 16);
  const plotW = Math.max(1, width - left);
  const [lo, hi] = extent(sorted.flat());
  const ticks = niceExtentTicks(lo, hi, xIntervals(plotW));
  const d0 = ticks[0] ?? 0;
  const d1 = ticks[ticks.length - 1] ?? 1;
  const x = linearScale([d0, d1], [left, left + plotW]);
  const samples = Array.from({ length: 96 }, (_, k) => d0 + ((d1 - d0) * k) / 95);
  const densities = sorted.map((values) => (values.length > 0 ? kde(values, samples, bandwidth ?? silvermanBandwidth(values)) : samples.map(() => 0)));
  const peak = Math.max(...densities.flat()) || 1;
  const ridgeH = rowHeight * overlap;
  const top = Math.max(8, (Math.max(0, ...(densities[0] ?? [])) / peak) * ridgeH + 4);
  const base = (i: number) => top + i * rowHeight;
  const lastBase = base(Math.max(0, groups.length - 1));
  const curve = (i: number) => smoothPath(samples.map((value, k) => ({ x: x(value), y: base(i) - ((densities[i]?.[k] ?? 0) / peak) * ridgeH })));
  const ridgeAt = (i: number, value: number) => {
    const k = Math.min(95, Math.max(0, Math.round(((value - d0) / (d1 - d0 || 1)) * 95)));
    return base(i) - ((densities[i]?.[k] ?? 0) / peak) * ridgeH;
  };
  const range = (a: number, b: number) => `${formatValue(a)}–${formatValue(b)}`;
  const { active, setActive, plot } = useStepper(groups.length, (i) => {
    const box = boxes[i];
    return box ? `${groups[i]?.name ?? ''}: медиана ${formatValue(box.median)}, квартили ${range(box.q1, box.q3)}, значений ${box.count}` : '';
  });
  const current = active === null ? undefined : boxes[active];
  const focusColor = seriesColor(0, groups[focus]?.color);
  const strong = (i: number) => i === focus || i === active;

  return (
    <Frame
      kind="ridgeline"
      className={className}
      legend={
        groups.length > 1 ? (
          <ChartLegend
          marker="square"
            items={[
              { name: restLabel, color: 'var(--color-seq-2)', marker: 'square' },
              { name: groups[focus]?.name ?? '', color: focusColor, marker: 'square' },
            ]}
          />
        ) : null
      }
      {...props}
    >
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Ряд',
          columns: ['Медиана', 'Q1', 'Q3', 'Значений'],
          rows: groups.map((group, i) => {
            const box = boxes[i];
            return { header: group.name, cells: box ? [formatValue(box.median), formatValue(box.q1), formatValue(box.q3), String(box.count)] : [] };
          }),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={lastBase + 24} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {groups.map((group, i) => {
            const isFocus = i === focus;
            const line = curve(i);
            const box = boxes[i];
            return (
              <g key={group.name} data-slot="ridgeline-row" data-focus={isFocus || undefined} className={REVEAL_X} style={stagger(i, 60)}>
                <path
                  d={`${line}L${left + plotW} ${base(i)}L${left} ${base(i)}Z`}
                  fill={isFocus ? focusColor : (group.color ?? 'var(--color-seq-2)')}
                  stroke="var(--color-surface-1)"
                  strokeWidth={2}
                />
                {isFocus ? null : <path d={line} fill="none" stroke={focusColor} strokeWidth={2} />}
                <line x1={left} x2={left + plotW} y1={base(i) + 0.5} y2={base(i) + 0.5} stroke="var(--color-border)" />
                {isFocus && box && box.count > 0 ? (
                  <text x={x(box.median) + 6} y={base(i) - 6} fontWeight={600} className="fill-fg-1 text-overline tabular-nums">
                    {`${medianLabel} ${formatValue(box.median)}`}
                  </text>
                ) : null}
                {active === i && box && box.count > 0 ? (
                  <line x1={x(box.median)} x2={x(box.median)} y1={base(i)} y2={ridgeAt(i, box.median)} stroke="var(--color-fg-1)" strokeWidth={1.5} strokeDasharray="4 3" />
                ) : null}
              </g>
            );
          })}
          {groups.map((group, i) => (
            <text key={group.name} x={left - 8} y={base(i) - 2} textAnchor="end" fontWeight={strong(i) ? 600 : undefined} className={cn('text-caption', strong(i) ? 'fill-fg-1' : 'fill-fg-2')}>
              {group.name}
            </text>
          ))}
          <BottomAxis ticks={ticks} x={x} y={lastBase + 18} format={axisFormat(ticks, unit)} />
          {groups.map((group, i) => (
            <rect key={group.name} data-slot="ridgeline-hit" x={0} y={base(i) - rowHeight} width={left + plotW} height={rowHeight} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={x(current.median)}
            width={width}
            {...tipPlace(base(active) - rowHeight, base(active), lastBase)}
            title={groups[active]?.name}
            rows={[
              { name: 'Медиана', value: formatValue(current.median), color: active === focus ? focusColor : 'var(--color-seq-2)' },
              { name: 'Квартили', value: range(current.q1, current.q3) },
              { name: 'Значений', value: String(current.count) },
            ]}
          />
        ) : null}
      </ChartPlot>
    </Frame>
  );
}

/* ---------- Beeswarm and jitter ---------- */

const pointTitle = (dot: Dot | undefined, group: DistributionGroup | undefined): string =>
  dot?.label ? `${dot.label}, ${group?.name ?? ''}` : (group?.name ?? '');

const pointTable = (groups: readonly DistributionGroup[], formatValue: (value: number) => string): ChartTable => ({
  rowHeader: 'Группа',
  columns: ['Медиана', 'Значений', 'Значения'],
  rows: groups.map((group) => {
    const values = sortedFinite(group.values);
    return { header: group.name, cells: [formatValue(quantileSorted(values, 0.5)), String(values.length), values.map(formatValue).join(', ')] };
  }),
});

/** Dots of each group, their order by value and the values in that order. */
function useDots(groups: readonly DistributionGroup[]) {
  const dots = groups.map(dotsOf);
  const order = dots.map((list) => list.map((_, i) => i).sort((a, b) => (list[a]?.value ?? 0) - (list[b]?.value ?? 0)));
  const sortedValues = order.map((ranks, g) => ranks.map((i) => dots[g]?.[i]?.value ?? 0));
  const dotAt = (ref: PointRef) => {
    const index = order[ref.group]?.[ref.rank] ?? 0;
    return { index, dot: dots[ref.group]?.[index] };
  };
  const rankOf = (group: number, index: number): number => order[group]?.indexOf(index) ?? 0;
  return { dots, sortedValues, dotAt, rankOf };
}

export interface BeeswarmChartProps extends BaseProps {
  groups: readonly DistributionGroup[];
  /** Row height in px. */
  rowHeight?: number;
  /** Prefix of the median under the row name. */
  medianLabel?: string;
}

/** Every value is a dot 6; dots pack outward from the row axis 1px apart and never overlap. The median is an fg-1 line. */
export function BeeswarmChart({
  groups,
  rowHeight = 92,
  medianLabel = 'мед.',
  formatValue = formatNumber,
  unit,
  className,
  'aria-label': label,
  ...props
}: BeeswarmChartProps) {
  const [ref, width] = useWidth(560);
  const { dots, sortedValues, dotAt, rankOf } = useDots(groups);
  const left = labelColumn(groups.map((group) => group.name), 13, 72, 24, 600);
  const right = Math.max(left + 1, width - 8);
  const [lo, hi] = extent(sortedValues.flat());
  const ticks = niceRangeTicks(lo, hi, xIntervals(right - left));
  const x = linearScale([ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1], [left, right]);
  const cy = (g: number) => 8 + g * rowHeight + rowHeight / 2;
  const offsets = dots.map((list) => beeswarm(list.map((dot) => x(dot.value)), 3, 1));
  const { active, setActive, plot } = usePointStepper(sortedValues, 'x', (ref) => {
    const { dot } = dotAt(ref);
    return `${pointTitle(dot, groups[ref.group])}: ${formatValue(dot?.value ?? 0)}`;
  });
  const current = active ? dotAt(active) : undefined;
  const height = 8 + groups.length * rowHeight + 24;
  const py = (g: number, i: number) => cy(g) + (offsets[g]?.[i] ?? 0);

  return (
    <Frame kind="beeswarm" className={className} {...props}>
      <ChartPlot ref={ref} aria-label={label} table={pointTable(groups, formatValue)} {...plot}>
        <svg aria-hidden width={width} height={height} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {groups.slice(1).map((group, i) => (
            <line key={group.name} x1={left} x2={width} y1={8 + (i + 1) * rowHeight + 0.5} y2={8 + (i + 1) * rowHeight + 0.5} stroke="var(--color-separator)" />
          ))}
          {groups.map((group, g) => {
            const list = dots[g] ?? [];
            const median = quantileSorted(sortedValues[g] ?? [], 0.5);
            const color = seriesColor(g, group.color);
            return (
              <g key={group.name}>
                <text x={left - 12} y={cy(g) - 2} textAnchor="end" fontWeight={600} className="fill-fg-1 text-label-sm">
                  {group.name}
                </text>
                {list.length > 0 ? (
                  <text x={left - 12} y={cy(g) + 14} textAnchor="end" className="fill-fg-3 text-overline tabular-nums">
                    {`${medianLabel} ${formatValue(median)}`}
                  </text>
                ) : null}
                <g className={REVEAL_X} style={stagger(g, 80)}>
                  {list.map((dot, i) => (
                    <circle
                      key={i}
                      data-slot="beeswarm-point"
                      data-group={g}
                      data-value={dot.value}
                      cx={x(dot.value)}
                      cy={py(g, i)}
                      r={3}
                      fill={color}
                      onPointerEnter={() => setActive({ group: g, rank: rankOf(g, i) })}
                    />
                  ))}
                </g>
                {list.length > 0 ? (
                  <line
                    data-slot="beeswarm-median"
                    x1={x(median)}
                    x2={x(median)}
                    y1={cy(g) - rowHeight / 2 + 6}
                    y2={cy(g) + rowHeight / 2 - 6}
                    stroke="var(--color-fg-1)"
                    strokeWidth={2}
                    className="pointer-events-none"
                  />
                ) : null}
              </g>
            );
          })}
          {current?.dot && active ? (
            <circle
              cx={x(current.dot.value)}
              cy={py(active.group, current.index)}
              r={4.5}
              fill="var(--color-surface-1)"
              stroke={seriesColor(active.group, groups[active.group]?.color)}
              strokeWidth={2}
              className="pointer-events-none"
            />
          ) : null}
          <BottomAxis ticks={ticks} x={x} y={height - 6} format={axisFormat(ticks, unit)} />
        </svg>
        {current?.dot && active ? (
          <ChartTooltip
            x={x(current.dot.value)}
            width={width}
            {...tipPlace(py(active.group, current.index) - 6, py(active.group, current.index) + 6, height)}
            title={current.dot.label ?? groups[active.group]?.name}
            marker="dot"
            rows={[{ name: groups[active.group]?.name ?? '', value: formatValue(current.dot.value), color: seriesColor(active.group, groups[active.group]?.color) }]}
          />
        ) : null}
      </ChartPlot>
    </Frame>
  );
}

export interface JitterChartProps extends BaseProps {
  groups: readonly DistributionGroup[];
  /** Seed of the sideways shift: the same seed draws the same picture. */
  seed?: number;
  /** Share of the column the dots spread over. */
  spread?: number;
  height?: number;
}

const JITTER = { top: 8, bottom: 28, left: 48 };

/** Dots 8 with a surface ring, shifted sideways at random only against overlap; the median is an fg-1 line with its value. */
export function JitterChart({
  groups,
  seed = 1,
  spread = 0.6,
  height = 240,
  formatValue = formatNumber,
  unit,
  className,
  'aria-label': label,
  ...props
}: JitterChartProps) {
  const [ref, width] = useWidth(560);
  const { dots, sortedValues, dotAt, rankOf } = useDots(groups);
  const [lo, hi] = extent(sortedValues.flat());
  const yTicks = niceExtentTicks(lo, hi, yIntervals(height));
  const plotW = Math.max(1, width - JITTER.left);
  const y = linearScale([yTicks[0] ?? 0, yTicks[yTicks.length - 1] ?? 1], [JITTER.top + height, JITTER.top]);
  const band = plotW / Math.max(1, groups.length);
  const cx = (g: number) => JITTER.left + (g + 0.5) * band;
  // a seed per group keeps a group's picture when other groups change
  const shifts = dots.map((list, g) => jitter(list.length, seed * 7919 + g));
  const px = (g: number, i: number) => cx(g) + ((shifts[g]?.[i] ?? 0) * spread * band) / 2;
  // the value sits beside the median line, shortened if needed, unless it would run into the next column's dots
  const labelW = Math.max(0, ...sortedValues.map((values) => textWidth(formatValue(quantileSorted(values, 0.5)), 12, 600)));
  const fitted = Math.min(50, band * 0.36, band * (1 - spread / 2) - 8 - labelW);
  const beside = fitted >= band * 0.2;
  const half = beside ? fitted : Math.min(50, band * 0.36);
  const { active, setActive, plot } = usePointStepper(sortedValues, 'y', (ref) => {
    const { dot } = dotAt(ref);
    return `${pointTitle(dot, groups[ref.group])}: ${formatValue(dot?.value ?? 0)}`;
  });
  const current = active ? dotAt(active) : undefined;

  return (
    <Frame kind="jitter" className={className} {...props}>
      <ChartPlot ref={ref} aria-label={label} table={pointTable(groups, formatValue)} {...plot}>
        <svg aria-hidden width={width} height={height + JITTER.top + JITTER.bottom} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          <ValueAxis ticks={yTicks} y={y} left={JITTER.left} right={JITTER.left + plotW} format={axisFormat(yTicks, unit)} />
          {groups.map((group, g) => {
            const list = dots[g] ?? [];
            const median = quantileSorted(sortedValues[g] ?? [], 0.5);
            const color = seriesColor(g, group.color);
            return (
              <g key={group.name}>
                <g className={FADE} style={stagger(g, 80)}>
                  {list.map((dot, i) => (
                    <circle
                      key={i}
                      data-slot="jitter-point"
                      data-group={g}
                      data-value={dot.value}
                      cx={px(g, i)}
                      cy={y(dot.value)}
                      r={4}
                      fill={color}
                      stroke="var(--color-surface-1)"
                      strokeWidth={2}
                      onPointerEnter={() => setActive({ group: g, rank: rankOf(g, i) })}
                    />
                  ))}
                </g>
                {list.length > 0 ? (
                  <g data-slot="jitter-median" className="pointer-events-none">
                    <line x1={cx(g) - half} x2={cx(g) + half} y1={y(median)} y2={y(median)} stroke="var(--color-fg-1)" strokeWidth={2} />
                    <text
                      x={beside ? cx(g) + half + 4 : cx(g)}
                      y={beside ? y(median) : y(median) - 10}
                      textAnchor={beside ? 'start' : 'middle'}
                      dominantBaseline="middle"
                      fontWeight={600}
                      className="fill-fg-1 text-caption tabular-nums"
                    >
                      {formatValue(median)}
                    </text>
                  </g>
                ) : null}
                <text x={cx(g)} y={JITTER.top + height + 20} textAnchor="middle" className={cn('text-caption', active?.group === g ? 'fill-fg-1' : 'fill-fg-2')}>
                  {group.name}
                </text>
              </g>
            );
          })}
          {current?.dot && active ? (
            <circle
              cx={px(active.group, current.index)}
              cy={y(current.dot.value)}
              r={4.5}
              fill="var(--color-surface-1)"
              stroke={seriesColor(active.group, groups[active.group]?.color)}
              strokeWidth={2}
              className="pointer-events-none"
            />
          ) : null}
        </svg>
        {current?.dot && active ? (
          <ChartTooltip
            x={px(active.group, current.index)}
            width={width}
            {...tipPlace(y(current.dot.value) - 6, y(current.dot.value) + 6, height + JITTER.top)}
            title={current.dot.label ?? groups[active.group]?.name}
            marker="dot"
            rows={[{ name: groups[active.group]?.name ?? '', value: formatValue(current.dot.value), color: seriesColor(active.group, groups[active.group]?.color) }]}
          />
        ) : null}
      </ChartPlot>
    </Frame>
  );
}

/* ---------- Population pyramid ---------- */

export interface PyramidChartRow {
  /** Age band in the central corridor: «25–34». */
  label: string;
  left: number;
  right: number;
}

export interface PopulationPyramidChartProps extends BaseProps {
  /** Rows top to bottom, the oldest first. */
  rows: readonly PyramidChartRow[];
  /** Names of the left and right halves. */
  series: readonly [string, string];
  /** Header of the first column in the data table. */
  rowHeader?: string;
}

/** Two halves from one shared corridor 60 on one symmetric scale; values at the bar ends, the legend hides a half. */
export function PopulationPyramidChart({
  rows,
  series,
  rowHeader = 'Группа',
  formatValue = formatNumber,
  unit,
  className,
  'aria-label': label,
  ...props
}: PopulationPyramidChartProps) {
  const [ref, width] = useWidth(560);
  const [hidden, toggle] = useHiddenSeries();
  const sides = [
    { key: 'left', name: series[0], color: seriesColor(0), value: (row: PyramidChartRow) => row.left },
    { key: 'right', name: series[1], color: seriesColor(1), value: (row: PyramidChartRow) => row.right },
  ] as const;
  const shown = sides.filter((side) => !hidden.has(side.name));
  const ticks = niceTicks(Math.max(0, ...rows.flatMap((row) => shown.map((side) => side.value(row)))), 2);
  const topTick = ticks[ticks.length - 1] ?? 1;
  const format = axisFormat(ticks, unit);
  const corridor = Math.max(60, widest(rows.map((row) => row.label), 12) + 16);
  const center = width / 2;
  const inner = { left: center - corridor / 2, right: center + corridor / 2 };
  const reach = Math.max(1, inner.left - 44);
  const length = (value: number) => (Math.max(0, value) / topTick) * reach;
  const rowsH = rows.length * 36;
  const { active, setActive, plot } = useStepper(rows.length, (i) => {
    const row = rows[i];
    return row ? `${row.label}: ${shown.map((side) => `${side.name} ${formatValue(side.value(row))}`).join(', ')}` : '';
  });
  const current = active === null ? undefined : rows[active];

  return (
    <Frame
      kind="population-pyramid"
      className={className}
      legend={<ChartLegend marker="square" items={sides.map((side) => ({ name: side.name, color: side.color, marker: 'square' }))} hidden={hidden} onToggle={toggle} />}
      {...props}
    >
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{ rowHeader, columns: [series[0], series[1]], rows: rows.map((row) => ({ header: row.label, cells: [formatValue(row.left), formatValue(row.right)] })) }}
        {...plot}
      >
        <svg aria-hidden width={width} height={rowsH + 34} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {active !== null ? <rect x={0} y={4 + active * 36} width={width} height={36} rx={8} className="fill-fill-1" /> : null}
          {rows.map((row, i) => {
            const top = 8 + i * 36;
            return (
              <g key={row.label}>
                {shown.map((side) => {
                  const isLeft = side.key === 'left';
                  const edge = isLeft ? inner.left : inner.right;
                  const end = isLeft ? edge - length(side.value(row)) : edge + length(side.value(row));
                  return (
                    <g key={side.key}>
                      <path
                        data-slot="pyramid-bar"
                        data-side={side.key}
                        data-length={Math.abs(end - edge)}
                        d={sideBarPath(edge, end, top, 28)}
                        fill={side.color}
                        style={stagger(i)}
                        className={cn(isLeft ? 'origin-right' : 'origin-left', GROW_X)}
                      />
                      <text
                        x={isLeft ? end - 6 : end + 6}
                        y={top + 14}
                        textAnchor={isLeft ? 'end' : 'start'}
                        dominantBaseline="middle"
                        fontWeight={600}
                        className={cn('fill-fg-1 text-caption tabular-nums', FADE)}
                      >
                        {formatValue(side.value(row))}
                      </text>
                    </g>
                  );
                })}
                <text x={center} y={top + 14} textAnchor="middle" dominantBaseline="middle" className={cn('text-caption', active === i ? 'fill-fg-1' : 'fill-fg-2')}>
                  {row.label}
                </text>
              </g>
            );
          })}
          <path d={`M${inner.left + 0.5} 4V${rowsH + 12}M${inner.right + 0.5} 4V${rowsH + 12}`} stroke="var(--color-border)" />
          {ticks.map((tick) => (
            <g key={tick} className="fill-fg-3 text-caption tabular-nums">
              <text x={inner.left - length(tick)} y={rowsH + 28} textAnchor="middle">
                {format(tick)}
              </text>
              <text x={inner.right + length(tick)} y={rowsH + 28} textAnchor="middle">
                {format(tick)}
              </text>
            </g>
          ))}
          {rows.map((row, i) => (
            <rect key={row.label} data-slot="pyramid-hit" x={0} y={4 + i * 36} width={width} height={36} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {current && active !== null && shown.length > 0 ? (
          <ChartTooltip
            x={inner.right}
            width={width}
            {...tipPlace(8 + active * 36, 8 + active * 36 + 28, rowsH + 8)}
            title={current.label}
            rows={shown.map((side) => ({ name: side.name, value: formatValue(side.value(current)), color: side.color }))}
            total={shown.length > 1 ? formatValue(round6(current.left + current.right)) : undefined}
          />
        ) : null}
      </ChartPlot>
    </Frame>
  );
}

/* ---------- Pareto ---------- */

export interface ParetoChartItem {
  label: string;
  value: number;
}

export interface ParetoChartProps extends Omit<BaseProps, 'unit'> {
  /** Causes in any order; the chart sorts them from the largest. */
  data: readonly ParetoChartItem[];
  /** Running share that splits the vital few (chart-1) from the tail (seq-2). */
  threshold?: number;
  barLabel?: string;
  lineLabel?: string;
  /** Name of the raw value in the tooltip and the table. */
  valueLabel?: string;
  height?: number;
}

const PARETO = { top: 8, bottom: 48, left: 48 };

/** Shares as columns and the running total as a line on one % scale; causes up to the threshold in chart-1, the tail in seq-2. */
export function ParetoChart({
  data,
  threshold = 0.8,
  barLabel = 'Доля',
  lineLabel = 'Накопленно',
  valueLabel = 'Значение',
  height = 180,
  formatValue = formatNumber,
  className,
  'aria-label': label,
  ...props
}: ParetoChartProps) {
  const [ref, width] = useWidth(560);
  const [hidden, toggle] = useHiddenSeries();
  const items = [...data].sort((a, b) => b.value - a.value);
  const total = sum(items.map((item) => item.value));
  const rows = items.map((item, i) => {
    const running = sum(items.slice(0, i + 1).map((other) => other.value));
    return { ...item, share: total > 0 ? item.value / total : 0, cumulative: total > 0 ? running / total : 0 };
  });
  const vitalEnd = rows.findIndex((row) => row.cumulative >= threshold - EPSILON);
  const vital = (i: number) => vitalEnd < 0 || i <= vitalEnd;
  const crossing = rows.reduce((last, row, i) => (row.cumulative < threshold - EPSILON ? i : last), -1);
  const crossRow = rows[crossing];
  const plotW = Math.max(1, width - PARETO.left);
  const band = plotW / Math.max(1, rows.length);
  const barW = Math.max(4, Math.min(28, band * 0.5));
  const cx = (i: number) => PARETO.left + (i + 0.5) * band;
  const y = (share: number) => PARETO.top + height - share * height;
  const baseline = y(0);
  const fits = (stride: number) => rows.every((row) => wrapLabel(row.label, band * stride - 4, 11).every((line) => textWidth(line, 11) <= band * stride - 4));
  const labelStride = [1, 2, 3, 4].find(fits) ?? Math.max(1, rows.length);
  const showBars = !hidden.has(barLabel);
  const showLine = !hidden.has(lineLabel);
  const colors = { bar: seriesColor(0), line: seriesColor(1), tail: 'var(--color-seq-2)' };
  const { active, setActive, plot } = useStepper(rows.length, (i) => {
    const row = rows[i];
    return row ? `${row.label}: ${formatValue(row.value)}, доля ${formatPercent(row.share)}, накопленно ${formatPercent(row.cumulative)}` : '';
  });
  const current = active === null ? undefined : rows[active];

  return (
    <Frame
      kind="pareto"
      className={className}
      legend={
        <ChartLegend
          marker="square"
          items={[
            { name: barLabel, color: colors.bar, marker: 'square' },
            { name: lineLabel, color: colors.line, marker: 'line' },
          ]}
          hidden={hidden}
          onToggle={toggle}
        />
      }
      {...props}
    >
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Категория',
          columns: [valueLabel, barLabel, lineLabel],
          rows: rows.map((row) => ({ header: row.label, cells: [formatValue(row.value), formatPercent(row.share), formatPercent(row.cumulative)] })),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={height + PARETO.top + PARETO.bottom} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          <ValueAxis ticks={[0, 0.25, 0.5, 0.75, 1]} y={y} left={PARETO.left} right={PARETO.left + plotW} format={wholePercent} />
          <line x1={PARETO.left} x2={PARETO.left + plotW} y1={y(threshold)} y2={y(threshold)} stroke="var(--color-fg-3)" strokeDasharray="4 3" />
          <text x={PARETO.left + plotW} y={y(threshold) - 6} textAnchor="end" className="fill-fg-2 text-overline tabular-nums">
            {wholePercent(threshold)}
          </text>
          {active !== null ? <rect x={cx(active) - band / 2} y={PARETO.top} width={band} height={height} rx={8} className="fill-fill-1" /> : null}
          {showBars
            ? rows.map((row, i) => (
                <path
                  key={row.label}
                  data-slot="pareto-bar"
                  data-label={row.label}
                  data-vital={vital(i) || undefined}
                  d={columnPath(cx(i) - barW / 2, y(row.share), barW, baseline)}
                  fill={vital(i) ? colors.bar : colors.tail}
                  style={stagger(i)}
                  className={GROW_Y}
                />
              ))
            : null}
          {showLine && rows.length > 0 ? (
            <g className={REVEAL_X}>
              <path d={linePath(rows.map((row, i) => ({ x: cx(i), y: y(row.cumulative) })))} fill="none" stroke={colors.line} strokeWidth={2} strokeLinejoin="round" />
              {rows.map((row, i) => (
                <circle
                  key={row.label}
                  data-slot="pareto-point"
                  data-cumulative={round6(row.cumulative)}
                  cx={cx(i)}
                  cy={y(row.cumulative)}
                  r={active === i ? 5 : 4}
                  fill={colors.line}
                  stroke="var(--color-surface-1)"
                  strokeWidth={2}
                />
              ))}
              {crossRow ? (
                <text x={cx(crossing) + 8} y={y(crossRow.cumulative) + 16} fontWeight={600} className="fill-fg-1 text-caption tabular-nums">
                  {`${formatNumber(Math.round(crossRow.cumulative * 100))}${NBSP}%`}
                </text>
              ) : null}
            </g>
          ) : null}
          {rows.map((row, i) =>
            i % labelStride !== 0 ? null : wrapLabel(row.label, band * labelStride - 4, 11).map((line, k) => (
              <text key={`${row.label}-${k}`} x={cx(i)} y={baseline + 18 + k * 14} textAnchor="middle" className={cn('text-overline', active === i ? 'fill-fg-1' : 'fill-fg-3')}>
                {line}
              </text>
            )),
          )}
          {rows.map((row, i) => (
            <rect key={row.label} data-slot="pareto-hit" x={cx(i) - band / 2} y={PARETO.top} width={band} height={height} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={cx(active)}
            width={width}
            title={current.label}
            rows={[
              { name: barLabel, value: formatPercent(current.share), color: vital(active) ? colors.bar : colors.tail },
              { name: lineLabel, value: formatPercent(current.cumulative), color: colors.line },
              { name: valueLabel, value: formatValue(current.value) },
            ]}
          />
        ) : null}
      </ChartPlot>
    </Frame>
  );
}

/* ---------- Lorenz ---------- */

export interface LorenzChartProps extends Omit<BaseProps, 'unit' | 'formatValue'> {
  /** One value per holder: revenue per client, deals per manager. */
  values: readonly number[];
  /** Who is counted on x, after the share in the tooltip: «клиентов». */
  populationLabel?: string;
  /** What is summed on y: «Доля выручки». */
  valueLabel?: string;
  curveLabel?: string;
  equalityLabel?: string;
  giniLabel?: string;
  height?: number;
}

const LORENZ = { top: 8, bottom: 28, left: 48, right: 8 };

/** Share of the smallest holders against their share of the total; the gap to the diagonal of equality is shaded and the Gini coefficient named. */
export function LorenzChart({
  values,
  populationLabel = 'объектов',
  valueLabel = 'Доля значения',
  curveLabel = 'Кривая Лоренца',
  equalityLabel = 'Равенство',
  giniLabel = 'Джини',
  height = 240,
  className,
  'aria-label': label,
  ...props
}: LorenzChartProps) {
  const [ref, width] = useWidth(560);
  const curve = lorenzCurve(values);
  const coefficient = gini(values).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const at = (p: number) => {
    const j = curve.findIndex((point) => point.x >= p - EPSILON);
    const b = curve[j];
    const a = curve[j - 1];
    if (!b) return p;
    if (!a || b.x === a.x) return b.y;
    return a.y + ((b.y - a.y) * (p - a.x)) / (b.x - a.x);
  };
  const drawn = curve.length > 201 ? Array.from({ length: 101 }, (_, i) => ({ x: i / 100, y: at(i / 100) })) : curve;
  const deciles = Array.from({ length: 10 }, (_, i) => (i + 1) / 10);
  const plotW = Math.max(1, width - LORENZ.left - LORENZ.right);
  const x = (share: number) => LORENZ.left + share * plotW;
  const y = (share: number) => LORENZ.top + height - share * height;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = plotW < 280 ? [0, 0.5, 1] : ticks;
  const title = (p: number) => `${wholePercent(p)} ${populationLabel}`;
  const { active, setActive, plot } = useStepper(deciles.length, (i) => {
    const p = deciles[i] ?? 0;
    return `${title(p)}: ${valueLabel} ${formatPercent(at(p))}`;
  });
  const p = active === null ? undefined : deciles[active];
  const color = seriesColor(0);
  const points = drawn.map((point) => ({ x: x(point.x), y: y(point.y) }));

  return (
    <Frame
      kind="lorenz"
      className={className}
      legend={
        <ChartLegend
          marker="square"
          items={[
            { name: curveLabel, color, marker: 'line' },
            { name: equalityLabel, color: 'var(--color-fg-3)', marker: 'line' },
          ]}
        />
      }
      {...props}
    >
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: `Доля ${populationLabel}`,
          columns: [valueLabel],
          rows: [...deciles.map((share) => ({ header: wholePercent(share), cells: [formatPercent(at(share))] })), { header: `Коэффициент ${giniLabel}`, cells: [coefficient] }],
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={height + LORENZ.top + LORENZ.bottom} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          <ValueAxis ticks={ticks} y={y} left={LORENZ.left} right={LORENZ.left + plotW} format={wholePercent} />
          <BottomAxis ticks={xTicks} x={x} y={y(0) + 22} format={wholePercent} />
          {p !== undefined ? <line x1={x(p)} x2={x(p)} y1={LORENZ.top} y2={y(0)} stroke="var(--color-fg-4)" strokeDasharray="3 3" /> : null}
          <line data-slot="lorenz-equality" x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--color-fg-3)" strokeDasharray="4 3" />
          <g className={REVEAL_X}>
            <path d={`M${x(0)} ${y(0)}L${x(1)} ${y(1)}${linePath([...points].reverse()).replace(/^M/, 'L')}Z`} fill={color} fillOpacity={0.12} />
            <path data-slot="lorenz-curve" d={linePath(points)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
          </g>
          <text x={x(0.5) - 10} y={y(0.5) - 10} textAnchor="end" fontWeight={600} className={cn('fill-fg-1 text-caption tabular-nums', FADE)}>
            {`${giniLabel} ${coefficient}`}
          </text>
          {p !== undefined ? <circle cx={x(p)} cy={y(at(p))} r={4.5} fill="var(--color-surface-1)" stroke={color} strokeWidth={2} /> : null}
          {deciles.map((share, i) => (
            <rect key={share} data-slot="lorenz-hit" x={x(share - 0.1)} y={LORENZ.top} width={plotW / 10} height={height} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {p !== undefined ? <ChartTooltip x={x(p)} width={width} title={title(p)} marker="line" rows={[{ name: valueLabel, value: formatPercent(at(p)), color }]} /> : null}
      </ChartPlot>
    </Frame>
  );
}

/* ---------- Error bars ---------- */

export interface ErrorBarChartItem {
  label: string;
  /** Point estimate. */
  value: number;
  /** Interval ends, e.g. of a 95 % confidence interval. */
  low: number;
  high: number;
}

export interface ErrorBarChartProps extends BaseProps {
  data: readonly ErrorBarChartItem[];
  /** Value an interval must miss to count as significant; drawn in border. */
  reference?: number;
  significantLabel?: string;
  insignificantLabel?: string;
  rowHeight?: number;
  legend?: boolean;
}

/** Interval 2 with caps 12 and a dot 10; rows whose interval misses the reference are chart-1 with bold labels, the rest fg-4. */
export function ErrorBarChart({
  data,
  reference = 0,
  significantLabel = 'Значимо',
  insignificantLabel = 'Не отличить от нуля',
  rowHeight = 40,
  legend = true,
  formatValue = signedNumber,
  unit,
  className,
  'aria-label': label,
  ...props
}: ErrorBarChartProps) {
  const [ref, width] = useWidth(560);
  const left = labelColumn(data.map((item) => item.label), 13, 72, 24, 600);
  const [lo, hi] = extent([reference, ...data.flatMap((item) => [item.low, item.high])]);
  const ticks = niceRangeTicks(lo, hi, xIntervals(width - 8 - left));
  const domain = [ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1] as const;
  const right = fitRight(width, left, domain, data.map((item) => ({ value: item.high, width: textWidth(formatValue(item.value), 12, 600) })));
  const x = linearScale(domain, [left, right]);
  const rowsH = data.length * rowHeight;
  const cy = (i: number) => 8 + i * rowHeight + rowHeight / 2;
  const significant = (item: ErrorBarChartItem) => item.low > reference || item.high < reference;
  const verdict = (item: ErrorBarChartItem) => (significant(item) ? significantLabel : insignificantLabel);
  const color = (item: ErrorBarChartItem) => (significant(item) ? seriesColor(0) : 'var(--color-fg-4)');
  const { active, setActive, plot } = useStepper(data.length, (i) => {
    const item = data[i];
    return item ? `${item.label}: ${formatValue(item.value)}, интервал от ${formatValue(item.low)} до ${formatValue(item.high)}, ${verdict(item).toLowerCase()}` : '';
  });
  const current = active === null ? undefined : data[active];

  return (
    <Frame
      kind="error-bars"
      className={className}
      legend={
        legend ? (
          <ChartLegend
          marker="square"
            items={[
              { name: significantLabel, color: seriesColor(0), marker: 'dot' },
              { name: insignificantLabel, color: 'var(--color-fg-4)', marker: 'dot' },
            ]}
          />
        ) : null
      }
      {...props}
    >
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Показатель',
          columns: ['Оценка', 'Нижняя граница', 'Верхняя граница', 'Вывод'],
          rows: data.map((item) => ({ header: item.label, cells: [formatValue(item.value), formatValue(item.low), formatValue(item.high), verdict(item)] })),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={rowsH + 32} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          <BottomAxis ticks={ticks} x={x} y={rowsH + 26} format={axisFormat(ticks, unit, true)} grid={[8, rowsH + 8]} />
          <line x1={x(reference)} x2={x(reference)} y1={8} y2={rowsH + 8} stroke="var(--color-border)" shapeRendering="crispEdges" />
          {active !== null ? <rect x={0} y={8 + active * rowHeight} width={width} height={rowHeight} rx={8} className="fill-fill-1" /> : null}
          {data.map((item, i) => {
            const sig = significant(item);
            const y = cy(i);
            return (
              <g key={item.label}>
                <text x={left - 12} y={y} textAnchor="end" dominantBaseline="middle" fontWeight={sig ? 600 : undefined} className="fill-fg-1 text-label-sm">
                  {item.label}
                </text>
                <g data-slot="error-bar" data-significant={sig} style={stagger(i, 60)} className={cn('origin-center', GROW_X)}>
                  <path
                    d={`M${x(item.low)} ${y}H${x(item.high)}M${x(item.low)} ${y - 6}V${y + 6}M${x(item.high)} ${y - 6}V${y + 6}`}
                    stroke={color(item)}
                    strokeWidth={2}
                    fill="none"
                  />
                  <circle cx={x(item.value)} cy={y} r={5} fill={color(item)} stroke="var(--color-surface-1)" strokeWidth={2} />
                </g>
                <text
                  x={x(item.high) + 8}
                  y={y}
                  dominantBaseline="middle"
                  fontWeight={sig ? 600 : undefined}
                  className={cn('text-caption tabular-nums', sig ? 'fill-fg-1' : 'fill-fg-3', FADE)}
                >
                  {formatValue(item.value)}
                </text>
              </g>
            );
          })}
          {data.map((item, i) => (
            <rect key={item.label} data-slot="error-bar-hit" x={0} y={8 + i * rowHeight} width={width} height={rowHeight} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={x(current.high)}
            width={width}
            {...tipPlace(cy(active) - 12, cy(active) + 12, rowsH + 16)}
            title={current.label}
            marker="dot"
            rows={[
              { name: verdict(current), value: formatValue(current.value), color: color(current) },
              { name: 'Интервал', value: `${formatValue(current.low)} … ${formatValue(current.high)}` },
            ]}
          />
        ) : null}
      </ChartPlot>
    </Frame>
  );
}

/* ---------- Span ---------- */

export interface SpanChartItem {
  label: string;
  start: number;
  end: number;
  /** Tick inside the span: a median, a target. */
  mark?: number;
}

export interface SpanChartProps extends BaseProps {
  data: readonly SpanChartItem[];
  rangeLabel?: string;
  markLabel?: string;
  rowHeight?: number;
  legend?: boolean;
}

/** Start to end as a bar 20 with radius 4 and no point inside; an optional fg-1 tick 2 × 26 and the range as text on the right. */
export function SpanChart({
  data,
  rangeLabel = 'Диапазон',
  markLabel = 'Отметка',
  rowHeight = 36,
  legend = true,
  formatValue = formatNumber,
  unit,
  className,
  'aria-label': label,
  ...props
}: SpanChartProps) {
  const [ref, width] = useWidth(560);
  const range = (item: SpanChartItem) => `${formatValue(item.start)}–${formatValue(item.end)}`;
  const left = labelColumn(data.map((item) => item.label), 13, 72);
  const [lo, hi] = extent(data.flatMap((item) => [item.start, item.end]));
  const ticks = niceRangeTicks(lo, hi, xIntervals(width - 8 - left));
  const domain = [ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1] as const;
  const right = fitRight(width, left, domain, data.map((item) => ({ value: item.end, width: textWidth(range(item), 12) })));
  const x = linearScale(domain, [left, right]);
  const rowsH = data.length * rowHeight;
  const cy = (i: number) => 8 + i * rowHeight + rowHeight / 2;
  const hasMarks = data.some((item) => item.mark !== undefined);
  const { active, setActive, plot } = useStepper(data.length, (i) => {
    const item = data[i];
    return item ? `${item.label}: ${range(item)}${item.mark !== undefined ? `, ${markLabel} ${formatValue(item.mark)}` : ''}` : '';
  });
  const current = active === null ? undefined : data[active];

  return (
    <Frame
      kind="span"
      className={className}
      legend={
        legend ? (
          <ChartLegend
          marker="square"
            items={[
              { name: rangeLabel, color: 'var(--color-seq-3)', marker: 'square' },
              ...(hasMarks ? [{ name: markLabel, color: 'var(--color-fg-1)', marker: 'line' as const }] : []),
            ]}
          />
        ) : null
      }
      {...props}
    >
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Показатель',
          columns: ['Начало', 'Конец', ...(hasMarks ? [markLabel] : [])],
          rows: data.map((item) => ({
            header: item.label,
            cells: [formatValue(item.start), formatValue(item.end), ...(hasMarks ? [item.mark === undefined ? '—' : formatValue(item.mark)] : [])],
          })),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={rowsH + 32} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          <BottomAxis ticks={ticks} x={x} y={rowsH + 26} format={axisFormat(ticks, unit)} grid={[8, rowsH + 8]} />
          {active !== null ? <rect x={0} y={8 + active * rowHeight} width={width} height={rowHeight} rx={8} className="fill-fill-1" /> : null}
          {data.map((item, i) => {
            const y = cy(i);
            return (
              <g key={item.label}>
                <text x={left - 12} y={y} textAnchor="end" dominantBaseline="middle" className="fill-fg-1 text-label-sm">
                  {item.label}
                </text>
                <rect
                  data-slot="span-bar"
                  x={x(item.start)}
                  y={y - 10}
                  width={Math.max(1, x(item.end) - x(item.start))}
                  height={20}
                  rx={4}
                  fill="var(--color-seq-3)"
                  style={stagger(i, 50)}
                  className={cn('origin-left', GROW_X)}
                />
                {item.mark !== undefined ? (
                  <line data-slot="span-mark" x1={x(item.mark)} x2={x(item.mark)} y1={y - 13} y2={y + 13} stroke="var(--color-fg-1)" strokeWidth={2} className={FADE} />
                ) : null}
                <text x={x(item.end) + 8} y={y} dominantBaseline="middle" className={cn('fill-fg-2 text-caption tabular-nums', FADE)}>
                  {range(item)}
                </text>
              </g>
            );
          })}
          {data.map((item, i) => (
            <rect key={item.label} data-slot="span-hit" x={0} y={8 + i * rowHeight} width={width} height={rowHeight} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={x(current.end)}
            width={width}
            {...tipPlace(cy(active) - 14, cy(active) + 14, rowsH + 16)}
            title={current.label}
            rows={[
              { name: rangeLabel, value: range(current), color: 'var(--color-seq-3)' },
              ...(current.mark !== undefined ? [{ name: markLabel, value: formatValue(current.mark), color: 'var(--color-fg-1)' }] : []),
            ]}
          />
        ) : null}
      </ChartPlot>
    </Frame>
  );
}

/* ---------- Stem and leaf ---------- */

export interface StemLeafChartProps extends Omit<BaseProps, 'unit'> {
  values: readonly number[];
  /** Value of one stem: 10 — stems are tens, leaves units (default: the power of ten under the range). */
  stemUnit?: number;
  stemLabel?: string;
  leavesLabel?: string;
  countLabel?: string;
  medianLabel?: string;
}

/** A text histogram that keeps every value: mono 13, leaves ascending, the median row in fill-1. */
export function StemLeafChart({
  values,
  stemUnit,
  stemLabel = 'Стебель',
  leavesLabel = 'Листья',
  countLabel = 'Кол-во',
  medianLabel = 'медиана',
  formatValue = formatNumber,
  className,
  'aria-label': label,
  ...props
}: StemLeafChartProps) {
  const [ref, width] = useWidth(560);
  const sorted = sortedFinite(values);
  const { unit, rows } = stemLeaf(sorted, stemUnit);
  const median = quantileSorted(sorted, 0.5);
  const medianStem = Number.isFinite(median) ? Math.floor(median / unit + EPSILON) : null;
  const leafStep = unit / 10;
  const valuesOf = (row: StemLeafRow) => row.leaves.map((leaf) => round6(row.stem * unit + leaf * leafStep));
  const range = (row: StemLeafRow) => `${formatValue(round6(row.stem * unit))}–${formatValue(round6(row.stem * unit + unit - leafStep))}`;
  const { active, setActive, plot } = useStepper(rows.length, (i) => {
    const row = rows[i];
    return row ? [`${range(row)}: ${plural(row.leaves.length, VALUE_WORDS)}`, ...valuesOf(row).map(formatValue)].join(', ') : '';
  });
  const current = active === null ? undefined : rows[active];

  return (
    <Frame kind="stem-leaf" className={className} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: stemLabel,
          columns: [leavesLabel, countLabel],
          rows: rows.map((row) => ({ header: range(row), cells: [row.leaves.join(' '), String(row.leaves.length)] })),
        }}
        {...plot}
      >
        <div aria-hidden className="border-t border-separator" onPointerLeave={() => setActive(null)}>
          <div className="flex h-7 items-center border-b border-separator text-caption text-fg-3">
            <span className="w-16 shrink-0 pr-3 text-right">{stemLabel}</span>
            <span className="min-w-0 flex-1 pl-3">{leavesLabel}</span>
            <span className="w-26 shrink-0 text-right">{countLabel}</span>
          </div>
          {rows.map((row, i) => {
            const isMedian = row.stem === medianStem;
            return (
              <div
                key={row.stem}
                data-slot="stem-leaf-row"
                data-stem={row.stem}
                data-median={isMedian || undefined}
                onPointerEnter={() => setActive(i)}
                className={cn(
                  'flex min-h-8 items-center border-b border-separator transition-colors duration-(--duration-quick)',
                  active === i ? 'bg-fill-2' : isMedian && 'bg-fill-1',
                )}
              >
                <span className="w-16 shrink-0 border-r border-border pr-3 text-right font-mono text-[13px] leading-5 text-fg-3 tabular-nums">{row.stem}</span>
                <span style={stagger(i, 50)} className={cn('min-w-0 flex-1 pl-3 font-mono text-[13px] leading-5 tracking-[0.3em] break-all text-fg-1', REVEAL_X)}>
                  {row.leaves.join('')}
                </span>
                <span className="w-26 shrink-0 text-right font-mono text-caption leading-5 text-fg-3 tabular-nums">
                  {isMedian ? `${row.leaves.length} · ${medianLabel}` : row.leaves.length}
                </span>
              </div>
            );
          })}
        </div>
        {current && active !== null ? (
          <ChartTooltip
            x={96}
            width={width}
            {...tipPlace(28 + active * 32, 28 + (active + 1) * 32, 28 + rows.length * 32)}
            title={range(current)}
            rows={[
              { name: 'Значений', value: String(current.leaves.length), color: 'var(--color-fg-1)' },
              { name: 'Доля', value: formatPercent(sorted.length > 0 ? current.leaves.length / sorted.length : 0) },
            ]}
          />
        ) : null}
      </ChartPlot>
    </Frame>
  );
}
