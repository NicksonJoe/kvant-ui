import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref } from 'react';
import {
  CHART_COLORS,
  ChartLegend,
  ChartPlot,
  ChartTooltip,
  SEQUENTIAL_COLORS,
  ValueAxis,
  columnPath,
  formatAxisValue,
  formatNumber,
  formatPercent,
  linePath,
  linearScale,
  measureText,
  niceExtentTicks,
  niceTicks,
  seriesColor,
  stepIndex,
  useHiddenSeries,
  useWidth,
  type ChartTable,
  type ChartTooltipRow,
  type LegendMarkerKind,
  type Point,
} from '../lib/chart-kit';
import { cn } from '../lib/cn';
import type { ChartSeries } from './chart';

/* «How did it change?»: layered areas, steps, columns over time, forecasts, ranges, calendars, seasons, events, prices and reversal charts. */

/* ---------- Shared frame: geometry, axes, hover, keyboard, tooltip ---------- */

const REVEAL =
  'transition-[opacity,clip-path] duration-(--duration-deliberate) ease-out [clip-path:inset(-8px_-8px_-8px_-8px)] starting:[clip-path:inset(-8px_100%_-8px_-8px)]';
const GROW = 'origin-bottom transition-[scale] duration-(--duration-slow) ease-standard [transform-box:fill-box] starting:scale-y-0';
const FADE = 'transition-opacity duration-(--duration-slow) ease-out starting:opacity-0';
const DIM = 'transition-opacity duration-(--duration-quick)';
const UP = CHART_COLORS[0] ?? 'currentColor';
const DOWN = CHART_COLORS[1] ?? 'currentColor';
const NBSP = ' ';

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** Whole svg. */
  width: number;
  height: number;
}

function makeBox(width: number, plot: number, margin: { top?: number; right?: number; bottom?: number; left?: number } = {}): Box {
  const top = margin.top ?? 8;
  const left = margin.left ?? 56;
  const bottom = top + plot;
  return { left, top, bottom, right: Math.max(left + 1, width - (margin.right ?? 0)), width, height: bottom + (margin.bottom ?? 28) };
}

/** Room for the longest tick label left of the plot. */
const axisLeft = (ticks: readonly number[], format: (value: number) => string) =>
  Math.max(40, Math.ceil(12 + Math.max(...ticks.map((tick) => format(tick).length)) * 6.6));

const pointScale = (box: Box, n: number, inset = 0) => (i: number) =>
  n > 1 ? box.left + inset + (i * (box.right - box.left - 2 * inset)) / (n - 1) : (box.left + box.right) / 2;

const bandScale = (box: Box, n: number) => {
  const band = (box.right - box.left) / Math.max(1, n);
  return { band, x: (i: number) => box.left + (i + 0.5) * band };
};

const valueScale = (box: Box, ticks: readonly number[]) => linearScale([ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1], [box.bottom, box.top]);

interface AxisLabel {
  x: number;
  text: string;
  anchor: 'start' | 'middle' | 'end';
}

/** Labels under the plot, skipping ones that would crowd; empty labels are never drawn. Edge layouts pin the first and last to the plot sides. */
function timeLabels(labels: readonly string[], x: (i: number) => number, edges: boolean): AxisLabel[] {
  const gap = edges ? 64 : 40;
  const kept: number[] = [];
  labels.forEach((text, i) => {
    if (!text) return;
    const prev = kept[kept.length - 1];
    if (prev === undefined || x(i) - x(prev) >= gap) kept.push(i);
    else if (edges && i === labels.length - 1 && kept.length > 1) kept[kept.length - 1] = i;
  });
  return kept.map((i) => ({
    x: x(i),
    text: labels[i] ?? '',
    anchor: edges && i === 0 ? 'start' : edges && i === labels.length - 1 ? 'end' : 'middle',
  }));
}

/** Smooth Catmull–Rom curve through every point; for stream graphs, where the shape matters more than the exact value. */
function catmullRom(points: readonly Point[]): string {
  const first = points[0];
  if (!first) return '';
  const at = (i: number): Point => points[Math.max(0, Math.min(points.length - 1, i))] ?? first;
  let d = `M${first.x} ${first.y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += ` C${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Closed band between an upper and a lower edge drawn with the same curve. */
const bandPath = (upper: readonly Point[], lower: readonly Point[], curve: (points: readonly Point[]) => string = linePath) =>
  upper.length ? `${curve(upper)}${curve([...lower].reverse()).replace(/^M/, 'L')}Z` : '';

/** Straight segments that break at missing values. */
const gappedPath = (points: readonly (Point | null)[]) =>
  points.reduce((d, point, i) => (point ? `${d}${i > 0 && points[i - 1] ? 'L' : 'M'}${point.x} ${point.y}` : d), '');

const signedPercent = (share: number) => `${share >= 0 ? '+' : '−'}${Math.round(Math.abs(share) * 100)}${NBSP}%`;

/** Width of a 12 px label; the on-chart labels are semibold. */
const textWidth = (text: string) => measureText(text, '600 12px Inter, sans-serif');

/** A label beside a point on its preferred side, on the other side when it would leave the svg, pinned inside when neither fits. */
function besideLabel(x: number, text: string, side: 'left' | 'right', width: number, gap = 10): { x: number; anchor: 'start' | 'end' } {
  const w = textWidth(text);
  const fitsLeft = x - gap - w >= 0;
  const fitsRight = x + gap + w <= width;
  if (fitsLeft && (side === 'left' || !fitsRight)) return { x: x - gap, anchor: 'end' };
  if (fitsRight) return { x: x + gap, anchor: 'start' };
  return { x: Math.max(0, width - w), anchor: 'start' };
}

interface TooltipContent {
  title: string;
  rows: readonly ChartTooltipRow[];
  total?: string;
}

/** Colours, hidden set and legend hover for charts whose series can hide. */
function useSeries(series: readonly ChartSeries[]) {
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const colored = series.map((item, index) => ({ ...item, color: seriesColor(index, item.color) }));
  return {
    colored,
    shown: colored.filter((item) => !hidden.has(item.name)),
    hidden,
    toggle,
    setHovered,
    opacity: (name: string) => (hovered !== null && hovered !== name ? 0.3 : 1),
  };
}

interface FrameProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  slot: string;
  plotRef: Ref<HTMLDivElement>;
  box: Box;
  legend?: ReactNode;
  /** Legend to the right of the plot (wraps under it when narrow) instead of above. */
  aside?: boolean;
  axis?: { ticks: readonly number[]; y: (value: number) => number; format?: (value: number) => string };
  xLabels?: readonly AxisLabel[];
  /** One anchor per steppable item: the tooltip points here and the pointer picks the nearest. */
  anchors: readonly Point[];
  /** Nearest by x (time) or by distance (scatter, calendar). */
  hit?: 'x' | 'xy';
  crosshair?: 'line' | 'band' | 'none';
  /** Width of the highlighted band. */
  band?: number;
  marker?: LegendMarkerKind;
  describe: (index: number) => TooltipContent;
  table: ChartTable;
  /** Keyboard step (default ← → Home End). */
  step?: (key: string, active: number | null, count: number) => number | null;
  /** Wide content scrolls sideways inside the plot, opening at the latest data. */
  scroll?: boolean;
  /** Visible width for the tooltip flip when scrolling. */
  view?: number;
  /** Marks; `scrollX` lets pinned parts (weekday labels) stay put while the content scrolls. */
  children: (active: number | null, scrollX: number) => ReactNode;
}

/** The common host of every chart here: legend, ChartPlot with table and live region, grid, time labels, pointer and ← → stepping, tooltip. */
function Frame({
  slot,
  plotRef,
  box,
  legend,
  aside = false,
  axis,
  xLabels,
  anchors,
  hit = 'x',
  crosshair = 'line',
  band = 0,
  marker = 'square',
  describe,
  table,
  step = stepIndex,
  scroll = false,
  view,
  className,
  children,
  'aria-label': label,
  ...props
}: FrameProps) {
  const [active, setActive] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');
  const [scrollX, setScrollX] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const count = anchors.length;
  const current = active !== null && active < count ? active : null;
  const anchor = current !== null ? anchors[current] : undefined;
  const content = current !== null ? describe(current) : null;

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = step(event.key, current, count);
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    const { title, rows } = describe(next);
    setSpoken(`${title}: ${rows.map((row) => `${row.name} ${row.value}`).join(', ')}`);
    const el = scroller.current;
    const target = anchors[next];
    if (el && target) {
      if (target.x - 24 < el.scrollLeft) el.scrollLeft = target.x - 24;
      else if (target.x + 24 > el.scrollLeft + el.clientWidth) el.scrollLeft = target.x + 24 - el.clientWidth;
    }
  };

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg || count === 0) return;
    const rect = svg.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    let best = 0;
    let distance = Infinity;
    anchors.forEach((point, i) => {
      const d = hit === 'xy' ? (point.x - px) ** 2 + (point.y - py) ** 2 : Math.abs(point.x - px);
      if (d < distance) {
        distance = d;
        best = i;
      }
    });
    setActive(best);
  };

  const svg = (
    <svg aria-hidden width={box.width} height={box.height} className="block overflow-visible">
      {axis ? <ValueAxis ticks={axis.ticks} y={axis.y} left={box.left} right={box.right} format={axis.format} /> : null}
      {xLabels?.map((item) => (
        <text key={`${item.x}-${item.text}`} x={item.x} y={box.bottom + 20} textAnchor={item.anchor} className="fill-fg-3 text-caption">
          {item.text}
        </text>
      ))}
      {crosshair === 'band' && anchor ? (
        <rect x={anchor.x - band / 2} y={box.top} width={band} height={box.bottom - box.top} rx={8} className="fill-fill-1" />
      ) : null}
      {crosshair === 'line' && anchor ? <line x1={anchor.x} x2={anchor.x} y1={box.top} y2={box.bottom} stroke="var(--color-fg-4)" strokeDasharray="3 3" /> : null}
      {children(current, scrollX)}
      <rect
        x={box.left}
        y={box.top}
        width={box.right - box.left}
        height={box.bottom - box.top}
        fill="transparent"
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={() => setActive(null)}
      />
    </svg>
  );

  return (
    <div data-slot={slot} className={cn(aside ? 'flex flex-wrap items-start gap-x-8 gap-y-4' : 'flex flex-col gap-3', className)} {...props}>
      {aside ? null : legend}
      <ChartPlot
        ref={plotRef}
        aria-label={label}
        table={table}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        className={aside ? 'max-w-max min-w-0 grow basis-80' : undefined}
      >
        {scroll ? (
          <div ref={scroller} className="overflow-x-auto overscroll-x-contain" onScroll={(event) => setScrollX(event.currentTarget.scrollLeft)}>
            {svg}
          </div>
        ) : (
          svg
        )}
        {content && anchor ? (
          <ChartTooltip
            x={anchor.x - (scroll ? scrollX : 0)}
            width={view ?? box.width}
            y={hit === 'xy' ? anchor.y + 14 : undefined}
            title={content.title}
            rows={content.rows}
            total={content.total}
            marker={marker}
          />
        ) : null}
      </ChartPlot>
      {aside ? legend : null}
    </div>
  );
}

const activeDot = (point: Point, color: string, key?: string) => (
  <circle key={key} cx={point.x} cy={point.y} r={4.5} fill="var(--color-surface-1)" stroke={color} strokeWidth={2} />
);

/* ---------- Common props ---------- */

interface TrendBaseProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the chart shows; screen readers also get the data as a table. */
  'aria-label': string;
  /** Plot height in px, without the axis labels. */
  height?: number;
  /** Values in the tooltip and the table (default: Russian number). */
  formatValue?: (value: number) => string;
}

interface TimeProps extends TrendBaseProps {
  /** X axis labels, one per value; crowded ones are skipped, empty ones never drawn. */
  labels: readonly string[];
  /** Tooltip titles per point, e.g. «16 октября, пятница» (default: the axis label). */
  tooltipLabels?: readonly string[];
  /** Value axis labels (default: «80 тыс», «1,5 млн»). */
  formatTick?: (value: number) => string;
}

const titleOf = (labels: readonly string[], tooltipLabels: readonly string[] | undefined, i: number) => tooltipLabels?.[i] ?? labels[i] ?? '';

/* ---------- 26–28 Stacked, 100 % and stream areas ---------- */

export interface StackedAreaChartProps extends TimeProps {
  /** Layers from the bottom up; the bottom one reads most precisely, put the main one there. At most four. */
  series: readonly ChartSeries[];
  /** Legend above the plot; on for several layers. Clicking a layer hides it. */
  legend?: boolean;
}

type LayerKind = 'stacked' | 'percent' | 'stream';

function LayerChart({
  kind,
  labels,
  tooltipLabels,
  series,
  formatValue = formatNumber,
  formatTick = formatAxisValue,
  height = 196,
  legend,
  ...props
}: StackedAreaChartProps & { kind: LayerKind }) {
  const [ref, width] = useWidth(560);
  const { colored, shown, hidden, toggle, setHovered, opacity } = useSeries(series);
  const n = labels.length;
  const sum = (items: readonly ChartSeries[], i: number) => items.reduce((total, item) => total + (item.values[i] ?? 0), 0);
  const totals = labels.map((_, i) => sum(shown, i));
  const maxTotal = Math.max(0, ...totals);
  const percent = kind === 'percent';
  const format = percent ? (value: number) => `${value}${NBSP}%` : formatTick;
  const ticks = percent ? [0, 25, 50, 75, 100] : niceTicks(maxTotal);
  const box = makeBox(width, height, kind === 'stream' ? { left: 8, right: 8 } : { left: axisLeft(ticks, format) });
  const x = pointScale(box, n);
  const half = (maxTotal / 2 || 1) * 1.05;
  const y = kind === 'stream' ? linearScale([-half, half], [box.bottom, box.top]) : valueScale(box, ticks);
  const share = (value: number, total: number) => (total > 0 ? value / total : 0);

  // each layer sits on the cumulative top of the ones below it
  const edges = shown.reduce<number[][]>(
    (stack, item) => [
      ...stack,
      (stack[stack.length - 1] ?? []).map((bottom, i) => {
        const value = item.values[i] ?? 0;
        return bottom + (percent ? share(value, totals[i] ?? 0) * 100 : value);
      }),
    ],
    [labels.map((_, i) => (kind === 'stream' ? -(totals[i] ?? 0) / 2 : 0))],
  );
  const toPoints = (edge: readonly number[] = []) => edge.map((value, i) => ({ x: x(i), y: y(value) }));
  const layers = shown.map((item, k) => ({ item, lower: toPoints(edges[k]), upper: toPoints(edges[k + 1]) }));
  const curve = kind === 'stream' ? catmullRom : linePath;
  const bottom = layers[0];
  const lastUpper = bottom?.upper[n - 1];
  const lastLower = bottom?.lower[n - 1];
  const lastShare = bottom ? share(bottom.item.values[n - 1] ?? 0, totals[n - 1] ?? 0) : 0;

  return (
    <Frame
      {...props}
      slot={kind === 'stacked' ? 'stacked-area-chart' : percent ? 'percent-area-chart' : 'stream-chart'}
      plotRef={ref}
      box={box}
      legend={(legend ?? series.length > 1) ? <ChartLegend items={colored} marker="square" hidden={hidden} onToggle={toggle} onHover={setHovered} /> : null}
      axis={kind === 'stream' ? undefined : { ticks, y, format }}
      xLabels={timeLabels(labels, x, true)}
      anchors={labels.map((_, i) => ({ x: x(i), y: box.top }))}
      describe={(i) => ({
        title: titleOf(labels, tooltipLabels, i),
        rows: shown.map((item) => {
          const value = item.values[i] ?? 0;
          return { name: item.name, color: item.color, value: percent ? formatPercent(share(value, totals[i] ?? 0)) : formatValue(value) };
        }),
        total: shown.length > 1 ? formatValue(totals[i] ?? 0) : undefined,
      })}
      table={{
        rowHeader: 'Период',
        columns: colored.map((item) => item.name),
        rows: labels.map((_, i) => ({
          header: titleOf(labels, tooltipLabels, i),
          cells: colored.map((item) => {
            const value = item.values[i] ?? 0;
            return percent ? formatPercent(share(value, sum(colored, i))) : formatValue(value);
          }),
        })),
      }}
    >
      {(active) => (
        <>
          {kind === 'stream' ? <line x1={box.left} x2={box.right} y1={y(0)} y2={y(0)} stroke="var(--color-separator)" shapeRendering="crispEdges" /> : null}
          <g className={REVEAL}>
            {layers.map(({ item, upper, lower }) => (
              <path
                key={item.name}
                data-slot="trend-layer"
                data-series={item.name}
                d={bandPath(upper, lower, curve)}
                fill={item.color}
                opacity={opacity(item.name)}
                stroke={kind === 'stream' ? 'var(--color-surface-1)' : undefined}
                strokeWidth={kind === 'stream' ? 1.5 : undefined}
                strokeLinejoin="round"
                className={DIM}
              />
            ))}
            {kind !== 'stream' ? (
              <path
                d={layers
                  .slice(0, -1)
                  .map(({ upper }) => linePath(upper))
                  .join('')}
                fill="none"
                stroke="var(--color-surface-1)"
                strokeWidth={2}
                strokeLinejoin="round"
              />
            ) : null}
          </g>
          {percent && lastUpper && lastLower && lastShare > 0 && lastLower.y - lastUpper.y >= 18 ? (
            <text
              data-slot="trend-share"
              x={box.right - 8}
              y={(lastUpper.y + lastLower.y) / 2 + 4}
              textAnchor="end"
              className="fill-surface-1 text-caption font-semibold tabular-nums"
            >
              {`${Math.round(lastShare * 100)}${NBSP}%`}
            </text>
          ) : null}
          {active !== null ? layers.map(({ item, upper }) => activeDot(upper[active] ?? { x: 0, y: 0 }, item.color, item.name)) : null}
        </>
      )}
    </Frame>
  );
}

/** Layers stacked into a total; layers split by a 2 px surface line, the legend hides a layer. */
export function StackedAreaChart(props: StackedAreaChartProps) {
  return <LayerChart kind="stacked" {...props} />;
}

/** Every period scaled to 100 %: shows how shares move, not the volume; the bottom layer is labelled with its last share. */
export function PercentAreaChart(props: StackedAreaChartProps) {
  return <LayerChart kind="percent" {...props} />;
}

/** Stream graph: layers around a symmetric middle line, smoothed, no value axis; numbers only in the tooltip. */
export function StreamChart(props: StackedAreaChartProps) {
  return <LayerChart kind="stream" {...props} />;
}

/* ---------- 29 Step line ---------- */

export interface StepLineChartProps extends TimeProps {
  values: readonly number[];
  /** Series name in the tooltip and table. */
  name?: string;
  color?: string;
}

/** Value that holds until the next change: horizontal to the change date, then vertical. Only the changes get a point and a «1 190 ₽ · +20 %» label. */
export function StepLineChart({
  labels,
  tooltipLabels,
  values,
  name = 'Значение',
  color = UP,
  formatValue = formatNumber,
  formatTick = formatAxisValue,
  height = 180,
  ...props
}: StepLineChartProps) {
  const [ref, width] = useWidth(560);
  const n = labels.length;
  const ticks = niceTicks(Math.max(0, ...values));
  const box = makeBox(width, height, { top: 24, left: axisLeft(ticks, formatTick) });
  const x = pointScale(box, n);
  const y = valueScale(box, ticks);
  const first = values[0];
  const d = values.reduce((path, value, i) => (i === 0 ? `M${x(0)} ${y(value)}` : `${path}H${x(i)}V${y(value)}`), '');
  const changes = values.flatMap((value, i) => {
    const before = values[i - 1];
    return i > 0 && before !== undefined && value !== before ? [{ i, value, change: before !== 0 ? (value - before) / before : 0 }] : [];
  });
  // Labels sit left of their change point; one that would collide with the label before it moves right of the point
  const boxes: { left: number; right: number; y: number }[] = first !== undefined ? [{ left: x(0) + 4, right: x(0) + 4 + textWidth(formatValue(first)), y: y(first) }] : [];
  const captions = changes.map(({ i, value, change }) => {
    const text = `${formatValue(value)} · ${signedPercent(change)}`;
    const w = textWidth(text);
    const at = y(value);
    const hits = (left: number) => left < 0 || left + w > box.width || boxes.some((other) => Math.abs(other.y - at) < 16 && left < other.right + 6 && left + w > other.left - 6);
    const left = hits(x(i) - 8 - w) && !hits(x(i) + 8) ? x(i) + 8 : x(i) - 8 - w;
    boxes.push({ left, right: left + w, y: at });
    return { i, text, left, y: at };
  });

  return (
    <Frame
      {...props}
      slot="step-line-chart"
      plotRef={ref}
      box={box}
      axis={{ ticks, y, format: formatTick }}
      xLabels={timeLabels(labels, x, true)}
      anchors={labels.map((_, i) => ({ x: x(i), y: box.top }))}
      marker="line"
      describe={(i) => ({ title: titleOf(labels, tooltipLabels, i), rows: [{ name, color, value: formatValue(values[i] ?? 0) }] })}
      table={{ rowHeader: 'Период', columns: [name], rows: labels.map((_, i) => ({ header: titleOf(labels, tooltipLabels, i), cells: [formatValue(values[i] ?? 0)] })) }}
    >
      {(active) => (
        <>
          <g className={REVEAL} style={{ color }}>
            <path data-slot="trend-line" d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
            {changes.map(({ i, value }) => (
              <circle key={i} data-slot="trend-step" cx={x(i)} cy={y(value)} r={4} fill="currentColor" stroke="var(--color-surface-1)" strokeWidth={2} />
            ))}
          </g>
          {first !== undefined ? (
            <text x={x(0) + 4} y={y(first) - 8} className="fill-fg-2 text-caption tabular-nums">
              {formatValue(first)}
            </text>
          ) : null}
          {captions.map((caption) => (
            <text key={caption.i} x={caption.left} y={caption.y - 8} className="fill-fg-1 text-caption font-semibold tabular-nums">
              {caption.text}
            </text>
          ))}
          {active !== null ? activeDot({ x: x(active), y: y(values[active] ?? 0) }, color) : null}
        </>
      )}
    </Frame>
  );
}

/* ---------- 30 Columns over time ---------- */

export interface TimeColumnChartProps extends TimeProps {
  values: readonly number[];
  name?: string;
  color?: string;
  /** Short value over the last and the lowest column (default: «5,2 млн»). */
  formatLabel?: (value: number) => string;
}

/** One series as columns 24 wide with rounded tops, no legend; only the last period and the minimum are labelled. */
export function TimeColumnChart({
  labels,
  tooltipLabels,
  values,
  name = 'Значение',
  color = UP,
  formatValue = formatNumber,
  formatTick = formatAxisValue,
  formatLabel = formatAxisValue,
  height = 196,
  ...props
}: TimeColumnChartProps) {
  const [ref, width] = useWidth(560);
  const n = values.length;
  const ticks = niceTicks(Math.max(0, ...values));
  const box = makeBox(width, height, { left: axisLeft(ticks, formatTick) });
  const { band, x } = bandScale(box, n);
  const y = valueScale(box, ticks);
  const column = Math.max(4, Math.min(24, band * 0.6));
  const last = n - 1;
  const min = values.reduce((lowest, value, i) => (value < (values[lowest] ?? Infinity) ? i : lowest), 0);
  const labelled = n > 0 ? [...new Set([min, last])].sort((a, b) => a - b) : [];

  return (
    <Frame
      {...props}
      slot="time-column-chart"
      plotRef={ref}
      box={box}
      axis={{ ticks, y, format: formatTick }}
      xLabels={timeLabels(labels, x, false)}
      anchors={values.map((_, i) => ({ x: x(i), y: box.top }))}
      crosshair="band"
      band={band}
      describe={(i) => ({ title: titleOf(labels, tooltipLabels, i), rows: [{ name, color, value: formatValue(values[i] ?? 0) }] })}
      table={{ rowHeader: 'Период', columns: [name], rows: values.map((value, i) => ({ header: titleOf(labels, tooltipLabels, i), cells: [formatValue(value)] })) }}
    >
      {() => (
        <>
          {values.map((value, i) => (
            <path
              key={i}
              data-slot="trend-column"
              d={columnPath(x(i) - column / 2, y(value), column, y(0))}
              fill={color}
              style={{ transitionDelay: `${i * 35}ms` }}
              className={GROW}
            />
          ))}
          {labelled.map((i) => (
            <text
              key={i}
              data-slot="trend-value-label"
              x={x(i)}
              y={y(values[i] ?? 0) - 8}
              textAnchor="middle"
              className={cn('text-caption tabular-nums', i === last ? 'fill-fg-1 font-semibold' : 'fill-fg-2')}
            >
              {formatLabel(values[i] ?? 0)}
            </text>
          ))}
        </>
      )}
    </Frame>
  );
}

/* ---------- 31 Columns and a line on one axis ---------- */

export interface ComboSeries {
  name: string;
  /** `null` where the line has no value yet, e.g. the first months of a rolling average. */
  values: readonly (number | null)[];
  color?: string;
}

export interface ComboChartProps extends TimeProps {
  /** Columns in the background (default seq-2). */
  bars: ChartSeries;
  /** The line that carries the meaning (default chart-1), in the same unit. */
  line: ComboSeries;
  /** Short label of the last line value (default: «4,8 млн»). */
  formatLabel?: (value: number) => string;
  legend?: boolean;
}

/** One axis, one unit — never a second axis: background columns and a line on top; the last line point is marked and labelled. */
export function ComboChart({
  labels,
  tooltipLabels,
  bars,
  line,
  formatValue = formatNumber,
  formatTick = formatAxisValue,
  formatLabel = formatAxisValue,
  height = 196,
  legend = true,
  ...props
}: ComboChartProps) {
  const [ref, width] = useWidth(560);
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const barColor = bars.color ?? SEQUENTIAL_COLORS[1] ?? UP;
  const lineColor = line.color ?? UP;
  const showBars = !hidden.has(bars.name);
  const showLine = !hidden.has(line.name);
  const n = labels.length;
  const known = line.values.filter((value): value is number => value !== null);
  const ticks = niceTicks(Math.max(0, ...(showBars ? bars.values : []), ...(showLine ? known : [])));
  const box = makeBox(width, height, { left: axisLeft(ticks, formatTick) });
  const { band, x } = bandScale(box, n);
  const y = valueScale(box, ticks);
  const column = Math.max(4, Math.min(24, band * 0.6));
  const points = line.values.map((value, i) => (value === null ? null : { x: x(i), y: y(value) }));
  const lastIndex = line.values.reduce<number>((found, value, i) => (value !== null ? i : found), -1);
  const lastPoint = points[lastIndex];
  const opacity = (name: string) => (hovered !== null && hovered !== name ? 0.3 : 1);

  return (
    <Frame
      {...props}
      slot="combo-chart"
      plotRef={ref}
      box={box}
      legend={
        legend ? (
          <ChartLegend
            marker="square"
            items={[
              { name: bars.name, color: barColor, marker: 'square' },
              { name: line.name, color: lineColor, marker: 'line' },
            ]}
            hidden={hidden}
            onToggle={toggle}
            onHover={setHovered}
          />
        ) : null
      }
      axis={{ ticks, y, format: formatTick }}
      xLabels={timeLabels(labels, x, false)}
      anchors={labels.map((_, i) => ({ x: x(i), y: box.top }))}
      crosshair="band"
      band={band}
      describe={(i) => {
        const value = line.values[i];
        return {
          title: titleOf(labels, tooltipLabels, i),
          rows: [
            ...(showBars ? [{ name: bars.name, color: barColor, value: formatValue(bars.values[i] ?? 0) }] : []),
            ...(showLine && value != null ? [{ name: line.name, color: lineColor, value: formatValue(value) }] : []),
          ],
        };
      }}
      table={{
        rowHeader: 'Период',
        columns: [bars.name, line.name],
        rows: labels.map((_, i) => {
          const value = line.values[i];
          return { header: titleOf(labels, tooltipLabels, i), cells: [formatValue(bars.values[i] ?? 0), value != null ? formatValue(value) : '—'] };
        }),
      }}
    >
      {(active) => (
        <>
          {showBars ? (
            <g opacity={opacity(bars.name)} className={DIM}>
              {bars.values.map((value, i) => (
                <path
                  key={i}
                  data-slot="trend-column"
                  d={columnPath(x(i) - column / 2, y(value), column, y(0))}
                  fill={barColor}
                  style={{ transitionDelay: `${i * 35}ms` }}
                  className={GROW}
                />
              ))}
            </g>
          ) : null}
          {showLine ? (
            <g opacity={opacity(line.name)} style={{ color: lineColor }} className={REVEAL}>
              <path data-slot="trend-line" d={gappedPath(points)} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {lastPoint ? (
                <>
                  <circle cx={lastPoint.x} cy={lastPoint.y} r={5} fill="currentColor" stroke="var(--color-surface-1)" strokeWidth={2} />
                  <text x={lastPoint.x - 19} y={lastPoint.y - 8} textAnchor="end" className="fill-fg-1 text-caption font-semibold tabular-nums">
                    {formatLabel(line.values[lastIndex] ?? 0)}
                  </text>
                </>
              ) : null}
            </g>
          ) : null}
          {showLine && active !== null && active !== lastIndex && points[active] ? activeDot(points[active] ?? { x: 0, y: 0 }, lineColor) : null}
        </>
      )}
    </Frame>
  );
}

/* ---------- 33 Forecast with a fan ---------- */

export interface ForecastDatum {
  value: number;
  /** Narrow band, e.g. 50 %: [low, high]. */
  inner?: readonly [number, number];
  /** Wide band, e.g. 80 %. */
  outer?: readonly [number, number];
}

export interface ForecastChartProps extends TimeProps {
  data: readonly ForecastDatum[];
  /** Index of the last actual value; later points are the forecast. */
  today: number;
  name?: string;
  innerName?: string;
  outerName?: string;
  todayLabel?: string;
  /** Bold label at the end: «6,2 в марте» (default: the last value). */
  endLabel?: string;
  color?: string;
}

/** Fact solid, the forecast the same series dashed 6/4, with 50 and 80 % bands widening over time and a «Сегодня» rule. */
export function ForecastChart({
  labels,
  tooltipLabels,
  data,
  today,
  name = 'Факт и прогноз',
  innerName = `50${NBSP}%`,
  outerName = `80${NBSP}%`,
  todayLabel = 'Сегодня',
  endLabel,
  color = UP,
  formatValue = formatNumber,
  formatTick = formatAxisValue,
  height = 180,
  ...props
}: ForecastChartProps) {
  const [ref, width] = useWidth(560);
  const n = data.length;
  const ticks = niceTicks(Math.max(0, ...data.flatMap((item) => [item.value, item.inner?.[1] ?? 0, item.outer?.[1] ?? 0])));
  const box = makeBox(width, height, { top: 24, left: axisLeft(ticks, formatTick) });
  const x = pointScale(box, n, 6);
  const y = valueScale(box, ticks);
  const point = (i: number, value: number) => ({ x: x(i), y: y(value) });
  const ahead = data.map((item, i) => ({ item, i })).filter(({ i }) => i >= today);
  const band = (key: 'inner' | 'outer') =>
    bandPath(
      ahead.map(({ item, i }) => point(i, item[key]?.[1] ?? item.value)),
      ahead.map(({ item, i }) => point(i, item[key]?.[0] ?? item.value)),
    );
  const last = data[n - 1];
  const now = data[today];
  const range = (pair: readonly [number, number] | undefined) => (pair ? `${formatValue(pair[0])} – ${formatValue(pair[1])}` : '—');
  const endY = last ? Math.min(box.bottom - 20, y(Math.min(last.value, last.inner?.[0] ?? last.value, last.outer?.[0] ?? last.value)) + 20) : 0;
  const inner = SEQUENTIAL_COLORS[1] ?? color;
  const outer = SEQUENTIAL_COLORS[0] ?? color;

  return (
    <Frame
      {...props}
      slot="forecast-chart"
      plotRef={ref}
      box={box}
      legend={
        <ChartLegend
          marker="square"
          items={[
            { name, color, marker: 'line' },
            { name: innerName, color: inner, marker: 'square' },
            { name: outerName, color: outer, marker: 'square' },
          ]}
        />
      }
      axis={{ ticks, y, format: formatTick }}
      xLabels={timeLabels(labels, x, true)}
      anchors={data.map((_, i) => ({ x: x(i), y: box.top }))}
      marker="line"
      describe={(i) => {
        const item = data[i];
        const future = i > today;
        return {
          title: titleOf(labels, tooltipLabels, i),
          rows: [
            { name: future ? 'Прогноз' : 'Факт', color, value: formatValue(item?.value ?? 0) },
            ...(future && item?.inner ? [{ name: innerName, color: inner, value: range(item.inner) }] : []),
            ...(future && item?.outer ? [{ name: outerName, color: outer, value: range(item.outer) }] : []),
          ],
        };
      }}
      table={{
        rowHeader: 'Период',
        columns: ['Значение', innerName, outerName],
        rows: data.map((item, i) => ({
          header: `${titleOf(labels, tooltipLabels, i)}${i > today ? ', прогноз' : ''}`,
          cells: [formatValue(item.value), range(i > today ? item.inner : undefined), range(i > today ? item.outer : undefined)],
        })),
      }}
    >
      {(active) => (
        <>
          <g className={REVEAL}>
            <path data-slot="trend-band" data-band="outer" d={band('outer')} fill={outer} />
            <path data-slot="trend-band" data-band="inner" d={band('inner')} fill={inner} />
          </g>
          {now ? (
            <g data-slot="trend-today">
              <line x1={x(today)} x2={x(today)} y1={box.top - 8} y2={box.bottom} stroke="var(--color-border)" strokeDasharray="2 3" />
              <text x={x(today) + 6} y={box.top - 10} className="fill-fg-2 text-[11px]">
                {todayLabel}
              </text>
            </g>
          ) : null}
          <g className={REVEAL} style={{ color }}>
            <path
              data-slot="trend-line"
              d={linePath(data.slice(0, today + 1).map((item, i) => point(i, item.value)))}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              data-slot="trend-forecast"
              d={linePath(ahead.map(({ item, i }) => point(i, item.value)))}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="6 4"
            />
            {now ? <circle cx={x(today)} cy={y(now.value)} r={5} fill="currentColor" stroke="var(--color-surface-1)" strokeWidth={2} /> : null}
          </g>
          {last && n - 1 > today ? (
            <>
              <text x={x(n - 1)} y={endY} textAnchor="end" className="fill-fg-1 text-caption font-semibold tabular-nums">
                {endLabel ?? formatValue(last.value)}
              </text>
              {last.outer ? (
                <text x={x(n - 1)} y={endY + 16} textAnchor="end" className="fill-fg-3 text-[11px] tabular-nums">
                  {`${outerName}: ${range(last.outer)}`}
                </text>
              ) : null}
            </>
          ) : null}
          {active !== null ? activeDot(point(active, data[active]?.value ?? 0), color) : null}
        </>
      )}
    </Frame>
  );
}

/* ---------- 34 Min–max range ---------- */

export interface RangeDatum {
  low: number;
  high: number;
  /** The line inside the range: mean or median. */
  value: number;
}

export interface RangeAreaChartProps extends TimeProps {
  data: readonly RangeDatum[];
  name?: string;
  rangeName?: string;
  /** Bold label at the last point (default: «в среднем 234»). */
  endLabel?: string;
  color?: string;
}

/** Actual spread, not uncertainty: a seq-1 band without outline from min to max, the mean on top; only the last range is labelled. */
export function RangeAreaChart({
  labels,
  tooltipLabels,
  data,
  name = 'Среднее',
  rangeName = 'Мин – макс',
  endLabel,
  color = UP,
  formatValue = formatNumber,
  formatTick = formatAxisValue,
  height = 196,
  ...props
}: RangeAreaChartProps) {
  const [ref, width] = useWidth(560);
  const n = data.length;
  const ticks = niceTicks(Math.max(0, ...data.map((item) => item.high)));
  const box = makeBox(width, height, { left: axisLeft(ticks, formatTick) });
  const x = pointScale(box, n);
  const y = valueScale(box, ticks);
  const last = data[n - 1];
  const lastX = x(n - 1);
  const fill = SEQUENTIAL_COLORS[0] ?? color;

  return (
    <Frame
      {...props}
      slot="range-area-chart"
      plotRef={ref}
      box={box}
      legend={
        <ChartLegend
          marker="square"
          items={[
            { name, color, marker: 'line' },
            { name: rangeName, color: fill, marker: 'square' },
          ]}
        />
      }
      axis={{ ticks, y, format: formatTick }}
      xLabels={timeLabels(labels, x, true)}
      anchors={data.map((_, i) => ({ x: x(i), y: box.top }))}
      marker="line"
      describe={(i) => {
        const item = data[i];
        return {
          title: titleOf(labels, tooltipLabels, i),
          rows: [
            { name, color, value: formatValue(item?.value ?? 0) },
            { name: rangeName, color: fill, value: `${formatValue(item?.low ?? 0)} – ${formatValue(item?.high ?? 0)}` },
          ],
        };
      }}
      table={{
        rowHeader: 'Период',
        columns: [name, 'Минимум', 'Максимум'],
        rows: data.map((item, i) => ({ header: titleOf(labels, tooltipLabels, i), cells: [formatValue(item.value), formatValue(item.low), formatValue(item.high)] })),
      }}
    >
      {(active) => (
        <>
          <g className={REVEAL}>
            <path
              data-slot="trend-band"
              d={bandPath(
                data.map((item, i) => ({ x: x(i), y: y(item.high) })),
                data.map((item, i) => ({ x: x(i), y: y(item.low) })),
              )}
              fill={fill}
            />
            <path data-slot="trend-line" d={linePath(data.map((item, i) => ({ x: x(i), y: y(item.value) })))} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
            {last ? <circle cx={lastX} cy={y(last.value)} r={4} fill={color} stroke="var(--color-surface-1)" strokeWidth={2} /> : null}
          </g>
          {last ? (
            <>
              <text x={lastX - 8} y={Math.max(box.top + 4, y(last.high) - 10)} textAnchor="end" className="fill-fg-2 text-[11px] tabular-nums">
                {`${formatValue(last.low)}–${formatValue(last.high)}`}
              </text>
              <text x={lastX - 6} y={Math.min(box.bottom - 6, y(last.value) + 22)} textAnchor="end" className="fill-fg-1 text-caption font-semibold tabular-nums">
                {endLabel ?? `в среднем ${formatValue(last.value)}`}
              </text>
            </>
          ) : null}
          {active !== null ? activeDot({ x: x(active), y: y(data[active]?.value ?? 0) }, color) : null}
        </>
      )}
    </Frame>
  );
}

/* ---------- 35 Calendar heat map ---------- */

export interface CalendarDatum {
  /** Day as `YYYY-MM-DD`. */
  date: string;
  value: number;
}

export interface CalendarHeatmapChartProps extends Omit<TrendBaseProps, 'height'> {
  data: readonly CalendarDatum[];
  /** Lower bounds of the five steps seq-1…5, whole numbers; below the first is fill-2. */
  thresholds?: readonly [number, number, number, number, number];
  /** What a day counts: «Заказы». */
  name?: string;
  /** Title over the scale: «Заказов в день». */
  legendTitle?: string;
  /** Cell size, px. */
  cell?: number;
}

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const DAY = 864e5;
const CALENDAR_KEYS: Record<string, number> = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 };

/** Whole days since the epoch, in UTC so daylight saving never shifts a cell. */
const parseDay = (date: string) => {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / DAY;
};

/** 1 January 1970 was a Thursday: weekday 3 counted from Monday. */
const weekday = (day: number) => (((day + 3) % 7) + 7) % 7;

const dayTitle = (day: number) => {
  const date = new Date(day * DAY);
  const utc = { timeZone: 'UTC' } as const;
  return `${date.toLocaleDateString('ru-RU', { ...utc, day: 'numeric', month: 'long' })} ${date.getUTCFullYear()}, ${date.toLocaleDateString('ru-RU', { ...utc, weekday: 'long' })}`;
};

/** One square a day in Monday-first week columns; five bounded steps of one hue and fill-2 for zero, with the scale written out. */
export function CalendarHeatmapChart({
  data,
  thresholds = [1, 10, 25, 50, 100],
  name = 'Значение',
  legendTitle,
  cell = 16,
  formatValue = formatNumber,
  ...props
}: CalendarHeatmapChartProps) {
  const [ref, width] = useWidth(560);
  const pitch = cell + 3;
  const days = data.map((item) => ({ ...item, day: parseDay(item.date) })).sort((a, b) => a.day - b.day);
  const first = days[0]?.day ?? 0;
  const monday = first - weekday(first);
  const cells = days.map((item) => {
    const column = Math.floor((item.day - monday) / 7);
    return { ...item, column, x: 40 + column * pitch, y: 22 + weekday(item.day) * pitch, level: thresholds.filter((bound) => item.value >= bound).length };
  });
  const right = 40 + ((cells[cells.length - 1]?.column ?? 0) + 1) * pitch - 3;
  const box: Box = { left: 40, top: 22, right, bottom: 22 + 7 * pitch - 3, width: right, height: 22 + 7 * pitch };
  const colors = ['var(--color-fill-2)', ...SEQUENTIAL_COLORS];
  const months: { x: number; text: string }[] = [];
  cells.forEach((item, i) => {
    const date = new Date(item.day * DAY);
    const prev = months[months.length - 1];
    if ((i === 0 || date.getUTCDate() === 1) && (!prev || item.x - prev.x >= 28)) months.push({ x: item.x, text: MONTHS[date.getUTCMonth()] ?? '' });
  });
  const scale = [
    thresholds[0] === 1 ? '0' : `< ${formatNumber(thresholds[0])}`,
    ...thresholds.slice(1).map((bound, i) => `${formatNumber(thresholds[i] ?? 0)}–${formatNumber(bound - 1)}`),
    `${formatNumber(thresholds[4])}+`,
  ];

  // Columns are weeks and rows weekdays, so ← → move a week and ↑ ↓ a day, as the grid reads
  const step = (key: string, active: number | null, count: number): number | null => {
    if (count === 0) return null;
    if (key === 'Home') return 0;
    if (key === 'End') return count - 1;
    const delta = CALENDAR_KEYS[key];
    if (delta === undefined) return null;
    const from = active !== null ? cells[active] : undefined;
    if (!from) return delta > 0 ? 0 : count - 1;
    const target = from.day + delta;
    if (delta > 0) {
      const next = cells.findIndex((item) => item.day >= target);
      return next === -1 ? count - 1 : next;
    }
    return Math.max(0, cells.findLastIndex((item) => item.day <= target));
  };

  return (
    <Frame
      {...props}
      slot="calendar-heatmap-chart"
      plotRef={ref}
      box={box}
      view={width}
      scroll
      aside
      legend={
        <div className="flex flex-col gap-2">
          {legendTitle ? <p className="text-caption text-fg-2">{legendTitle}</p> : null}
          <ul className="flex flex-col gap-1.5">
            {scale.map((text, level) => (
              <li key={text} className="flex items-center gap-2 text-caption text-fg-2 tabular-nums">
                <span aria-hidden className="size-3 shrink-0 rounded-[3px]" style={{ background: colors[level] }} />
                {text}
              </li>
            ))}
          </ul>
        </div>
      }
      anchors={cells.map((item) => ({ x: item.x + cell / 2, y: item.y + cell / 2 }))}
      hit="xy"
      crosshair="none"
      step={step}
      describe={(i) => ({ title: dayTitle(cells[i]?.day ?? 0), rows: [{ name, color: colors[cells[i]?.level ?? 0], value: formatValue(cells[i]?.value ?? 0) }] })}
      table={{ rowHeader: 'День', columns: [name], rows: cells.map((item) => ({ header: dayTitle(item.day), cells: [formatValue(item.value)] })) }}
    >
      {(active, scrollX) => {
        const focused = active !== null ? cells[active] : undefined;
        return (
          <>
            {months.map((month) => (
              <text key={`${month.x}-${month.text}`} x={month.x} y={12} className="fill-fg-3 text-caption">
                {month.text}
              </text>
            ))}
            {cells.map((item) => (
              <rect
                key={item.date}
                data-slot="trend-cell"
                data-level={item.level}
                data-date={item.date}
                x={item.x}
                y={item.y}
                width={cell}
                height={cell}
                rx={3}
                fill={colors[item.level]}
                style={{ transitionDelay: `${item.column * 12}ms` }}
                className={FADE}
              />
            ))}
            {focused ? (
              <rect x={focused.x - 1.5} y={focused.y - 1.5} width={cell + 3} height={cell + 3} rx={4.5} fill="none" stroke="var(--color-fg-1)" strokeWidth={1.5} />
            ) : null}
            <g transform={`translate(${scrollX} 0)`}>
              {scrollX > 0 ? <rect x={0} y={box.top - 2} width={36} height={box.bottom - box.top + 4} fill="var(--color-surface-1)" /> : null}
              {['Пн', 'Ср', 'Пт'].map((text, i) => (
                <text key={text} x={0} y={22 + i * 2 * pitch + 12} className="fill-fg-3 text-caption">
                  {text}
                </text>
              ))}
            </g>
          </>
        );
      }}
    </Frame>
  );
}

/* ---------- 36 Cycle plot ---------- */

export interface CycleDatum {
  /** Season: «Янв». */
  label: string;
  /** One value per period, `null` where it has not happened yet. */
  values: readonly (number | null)[];
}

export interface CyclePlotChartProps extends Omit<TimeProps, 'labels' | 'tooltipLabels'> {
  /** Periods left to right inside every season: years. */
  periods: readonly string[];
  data: readonly CycleDatum[];
  name?: string;
  meanName?: string;
  color?: string;
}

/** Seasonality: a panel per month with its mean (dashed fg-3) and a mini line over the years; the dot is the latest year. */
export function CyclePlotChart({
  periods,
  data,
  name = 'Год к году',
  meanName = 'Среднее месяца',
  color = UP,
  formatValue = formatNumber,
  formatTick = formatAxisValue,
  height = 190,
  ...props
}: CyclePlotChartProps) {
  const [ref, width] = useWidth(560);
  const n = data.length;
  const m = periods.length;
  const ticks = niceTicks(Math.max(0, ...data.flatMap((item) => item.values.filter((value): value is number => value !== null))));
  const box = makeBox(width, height, { left: axisLeft(ticks, formatTick) });
  const { band, x } = bandScale(box, n);
  const y = valueScale(box, ticks);
  const panels = data.map((item, i) => {
    const known = item.values.filter((value): value is number => value !== null);
    const left = box.left + i * band;
    const px = (j: number) => (m > 1 ? left + 8 + (j * (band - 16)) / (m - 1) : left + band / 2);
    return {
      item,
      left,
      points: item.values.map((value, j) => (value === null ? null : { x: px(j), y: y(value) })),
      lastIndex: item.values.reduce<number>((found, value, j) => (value !== null ? j : found), -1),
      mean: known.length ? known.reduce((sum, value) => sum + value, 0) / known.length : null,
    };
  });
  const cell = (value: number | null | undefined) => (value != null ? formatValue(value) : '—');

  return (
    <Frame
      {...props}
      slot="cycle-plot-chart"
      plotRef={ref}
      box={box}
      legend={
        <ChartLegend
          marker="square"
          items={[
            { name, color, marker: 'line' },
            { name: meanName, color: 'var(--color-fg-3)', marker: 'line' },
          ]}
        />
      }
      axis={{ ticks, y, format: formatTick }}
      xLabels={timeLabels(
        data.map((item) => item.label),
        x,
        false,
      )}
      anchors={data.map((_, i) => ({ x: x(i), y: box.top }))}
      crosshair="band"
      band={band}
      marker="line"
      describe={(i) => {
        const panel = panels[i];
        return {
          title: panel?.item.label ?? '',
          rows: [
            ...periods.flatMap((period, j) => {
              const value = panel?.item.values[j];
              return value != null ? [{ name: period, color, value: formatValue(value) }] : [];
            }),
            ...(panel?.mean != null ? [{ name: 'Среднее', color: 'var(--color-fg-3)', value: formatValue(panel.mean) }] : []),
          ],
        };
      }}
      table={{
        rowHeader: 'Месяц',
        columns: [...periods, 'Среднее'],
        rows: panels.map((panel) => ({ header: panel.item.label, cells: [...periods.map((_, j) => cell(panel.item.values[j])), cell(panel.mean)] })),
      }}
    >
      {() => (
        <>
          <path
            d={panels
              .slice(1)
              .map((panel) => `M${panel.left} ${box.top}V${box.bottom}`)
              .join('')}
            stroke="var(--color-separator)"
            shapeRendering="crispEdges"
          />
          {panels.map((panel, i) => {
            const last = panel.points[panel.lastIndex];
            return (
              <g key={i} data-slot="trend-panel" className={REVEAL} style={{ transitionDelay: `${i * 35}ms` }}>
                {panel.mean !== null ? (
                  <line
                    data-slot="trend-mean"
                    x1={panel.left + 4}
                    x2={panel.left + band - 4}
                    y1={y(panel.mean)}
                    y2={y(panel.mean)}
                    stroke="var(--color-fg-3)"
                    strokeDasharray="3 2"
                  />
                ) : null}
                <path d={gappedPath(panel.points)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {last ? <circle data-slot="trend-last" data-period={periods[panel.lastIndex]} cx={last.x} cy={last.y} r={3} fill={color} /> : null}
              </g>
            );
          })}
        </>
      )}
    </Frame>
  );
}

/* ---------- 37 Connected scatter ---------- */

export interface ConnectedScatterDatum {
  /** Period of the point: «Ноя 2025». */
  label: string;
  x: number;
  y: number;
  /** Label for a turning point: «Янв — провал после праздников». */
  note?: string;
}

export interface ConnectedScatterChartProps extends Omit<TrendBaseProps, 'formatValue'> {
  /** Points in time order. */
  data: readonly ConnectedScatterDatum[];
  xName: string;
  yName: string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  formatXTick?: (value: number) => string;
  formatYTick?: (value: number) => string;
  color?: string;
}

/** Two measures without a second axis: points joined in time order; start, end and notes are labelled, the last point is larger. */
export function ConnectedScatterChart({
  data,
  xName,
  yName,
  formatX = formatNumber,
  formatY = formatNumber,
  formatXTick = formatAxisValue,
  formatYTick = formatAxisValue,
  color = UP,
  height = 196,
  ...props
}: ConnectedScatterChartProps) {
  const [ref, width] = useWidth(560);
  const xTicks = niceTicks(Math.max(0, ...data.map((item) => item.x)));
  const yTicks = niceTicks(Math.max(0, ...data.map((item) => item.y)));
  const box = makeBox(width, height, { left: axisLeft(yTicks, formatYTick), right: 8 });
  const sx = linearScale([0, xTicks[xTicks.length - 1] ?? 1], [box.left, box.right]);
  const sy = valueScale(box, yTicks);
  const points = data.map((item) => ({ x: sx(item.x), y: sy(item.y) }));
  const n = data.length;
  const hasNotes = data.some((item) => item.note);

  return (
    <Frame
      {...props}
      slot="connected-scatter-chart"
      plotRef={ref}
      box={box}
      axis={{ ticks: yTicks, y: sy, format: formatYTick }}
      xLabels={xTicks.map((tick, i) => ({ x: sx(tick), text: formatXTick(tick), anchor: i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle' }))}
      anchors={points}
      hit="xy"
      crosshair="none"
      describe={(i) => ({
        title: data[i]?.label ?? '',
        rows: [
          { name: xName, value: formatX(data[i]?.x ?? 0) },
          { name: yName, value: formatY(data[i]?.y ?? 0) },
        ],
      })}
      table={{
        rowHeader: 'Период',
        columns: [xName, yName, ...(hasNotes ? ['Примечание'] : [])],
        rows: data.map((item) => ({ header: item.label, cells: [formatX(item.x), formatY(item.y), ...(hasNotes ? [item.note ?? ''] : [])] })),
      }}
    >
      {(active) => (
        <>
          <g className={REVEAL} style={{ color }}>
            <path data-slot="trend-line" d={linePath(points)} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
            {points.map((point, i) => (
              <circle key={i} data-slot="trend-point" cx={point.x} cy={point.y} r={i === n - 1 ? 5 : 4} fill="currentColor" stroke="var(--color-surface-1)" strokeWidth={2} />
            ))}
          </g>
          {data.map((item, i) => {
            const point = points[i];
            if (!point) return null;
            const edge = i === 0 || i === n - 1 ? besideLabel(point.x, item.label, 'left', box.width) : null;
            const note = item.note ? besideLabel(point.x, item.note, 'right', box.width) : null;
            return (
              <g key={i}>
                {edge ? (
                  <text x={edge.x} y={i === 0 ? point.y + 4 : point.y - 8} textAnchor={edge.anchor} className="fill-fg-1 text-caption font-semibold">
                    {item.label}
                  </text>
                ) : null}
                {note ? (
                  <text x={note.x} y={point.y + 14} textAnchor={note.anchor} className="fill-fg-1 text-caption font-semibold">
                    {item.note}
                  </text>
                ) : null}
              </g>
            );
          })}
          {active !== null && points[active] ? activeDot(points[active] ?? { x: 0, y: 0 }, color) : null}
        </>
      )}
    </Frame>
  );
}

/* ---------- 38 Event markers ---------- */

export interface TrendEvent {
  /** Index of the label the event happened at. */
  index: number;
  /** Release code: «v2.4». */
  code?: string;
  label: string;
  /** Release: a dashed rule with a caption over the plot; incident: a danger diamond under the line. */
  kind?: 'release' | 'incident';
}

export interface EventMarkerChartProps extends TimeProps {
  series: ChartSeries;
  events: readonly TrendEvent[];
  releaseName?: string;
  incidentName?: string;
}

/** A line with what happened: releases as fg-3 3/3 rules captioned above the plot (code fg-1 600 + text fg-2), incidents as danger diamonds. */
export function EventMarkerChart({
  labels,
  tooltipLabels,
  series,
  events,
  releaseName = 'Релиз',
  incidentName = 'Инцидент',
  formatValue = formatNumber,
  formatTick = formatAxisValue,
  height = 200,
  ...props
}: EventMarkerChartProps) {
  const [ref, width] = useWidth(560);
  const color = seriesColor(0, series.color);
  const n = labels.length;
  const ticks = niceTicks(Math.max(0, ...series.values));
  const box = makeBox(width, height, { top: 32, left: axisLeft(ticks, formatTick) });
  const x = pointScale(box, n);
  const y = valueScale(box, ticks);
  const releases = events.filter((event) => event.kind !== 'incident');
  const incidents = events.filter((event) => event.kind === 'incident');
  const eventText = (event: TrendEvent) => (event.code ? `${event.code} ${event.label}` : event.label);
  const eventsAt = (i: number) => events.filter((event) => event.index === i);
  const captions = [...releases]
    .sort((a, b) => a.index - b.index)
    .reduce<{ event: TrendEvent; x: number; anchor: 'start' | 'end'; full: boolean; right: number }[]>((placed, event) => {
      const at = x(event.index);
      const after = placed[placed.length - 1]?.right ?? -Infinity;
      const widths: [number, boolean][] = [
        [textWidth(eventText(event)), true],
        [textWidth(event.code ?? event.label), false],
      ];
      for (const [width, full] of widths) {
        const end = at + 6 + width > box.right;
        const left = end ? at - 6 - width : at + 6;
        if (left >= after + 8 && left >= 0) return [...placed, { event, x: end ? at - 6 : at + 6, anchor: end ? 'end' : 'start', full, right: left + width }];
      }
      // no room: the tooltip and the table still name it
      return placed;
    }, []);

  return (
    <Frame
      {...props}
      slot="event-marker-chart"
      plotRef={ref}
      box={box}
      legend={
        <ChartLegend
          marker="square"
          items={[
            { name: series.name, color, marker: 'line' },
            ...(releases.length ? [{ name: releaseName, color: 'var(--color-fg-3)', marker: 'line' as const }] : []),
            ...(incidents.length ? [{ name: incidentName, color: 'var(--color-danger)', marker: 'diamond' as const }] : []),
          ]}
        />
      }
      axis={{ ticks, y, format: formatTick }}
      xLabels={timeLabels(labels, x, true)}
      anchors={labels.map((_, i) => ({ x: x(i), y: box.top }))}
      marker="line"
      describe={(i) => ({
        title: titleOf(labels, tooltipLabels, i),
        rows: [
          { name: series.name, color, value: formatValue(series.values[i] ?? 0) },
          ...eventsAt(i).map((event) => ({ name: event.kind === 'incident' ? incidentName : releaseName, value: eventText(event) })),
        ],
      })}
      table={{
        rowHeader: 'Период',
        columns: [series.name, 'События'],
        rows: labels.map((_, i) => ({ header: titleOf(labels, tooltipLabels, i), cells: [formatValue(series.values[i] ?? 0), eventsAt(i).map(eventText).join('; ')] })),
      }}
    >
      {(active) => (
        <>
          {releases.map((event) => (
            <line
              key={`${event.index}-${event.label}`}
              data-slot="trend-release"
              x1={x(event.index)}
              x2={x(event.index)}
              y1={box.top - 14}
              y2={box.bottom}
              stroke="var(--color-fg-3)"
              strokeDasharray="3 3"
            />
          ))}
          {captions.map(({ event, x: at, anchor, full }) => (
            <text key={`${event.index}-${event.label}`} x={at} y={box.top - 18} textAnchor={anchor} className="text-caption">
              {event.code ? <tspan className="fill-fg-1 font-semibold">{event.code}</tspan> : null}
              {full || !event.code ? (
                <tspan dx={event.code ? 6 : 0} className="fill-fg-2">
                  {event.label}
                </tspan>
              ) : null}
            </text>
          ))}
          <path
            data-slot="trend-line"
            d={linePath(series.values.map((value, i) => ({ x: x(i), y: y(value) })))}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            className={REVEAL}
          />
          {incidents.map((event) => {
            const cx = x(event.index);
            const cy = y(series.values[event.index] ?? 0) + 18;
            const caption = besideLabel(cx, event.label, 'right', box.width, 12);
            return (
              <g key={`${event.index}-${event.label}`}>
                <path data-slot="trend-incident" d={`M${cx} ${cy - 7}L${cx + 7} ${cy}L${cx} ${cy + 7}L${cx - 7} ${cy}Z`} fill="var(--color-danger)" />
                <text x={caption.x} y={cy + 4} textAnchor={caption.anchor} className="fill-danger-soft-fg text-caption font-semibold">
                  {event.label}
                </text>
              </g>
            );
          })}
          {active !== null ? activeDot({ x: x(active), y: y(series.values[active] ?? 0) }, color) : null}
        </>
      )}
    </Frame>
  );
}

/* ---------- 40–41 Candlestick and OHLC ---------- */

export interface PriceDatum {
  /** Date or period: «01.10». */
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandlestickChartProps extends TrendBaseProps {
  data: readonly PriceDatum[];
  formatTick?: (value: number) => string;
  /** «Рост / Падение» legend above the plot. */
  legend?: boolean;
}

const PRICE_ROWS = [
  ['Открытие', 'open'],
  ['Максимум', 'high'],
  ['Минимум', 'low'],
  ['Закрытие', 'close'],
] as const;

const DIRECTION_LEGEND = [
  { name: 'Рост', color: UP },
  { name: 'Падение', color: DOWN },
];

function PriceChart({
  kind,
  data,
  formatValue = formatNumber,
  formatTick = formatNumber,
  height = 196,
  legend = true,
  ...props
}: CandlestickChartProps & { kind: 'candle' | 'ohlc' }) {
  const [ref, width] = useWidth(560);
  const ticks = data.length ? niceExtentTicks(Math.min(...data.map((item) => item.low)), Math.max(...data.map((item) => item.high)), Math.max(2, Math.floor(height / 36))) : [0, 1];
  const box = makeBox(width, height, { left: axisLeft(ticks, formatTick) });
  const { band, x } = bandScale(box, data.length);
  const y = valueScale(box, ticks);
  const body = Math.max(3, Math.min(10, band * 0.6));
  const tick = Math.min(5, body / 2);

  return (
    <Frame
      {...props}
      slot={kind === 'candle' ? 'candlestick-chart' : 'ohlc-chart'}
      plotRef={ref}
      box={box}
      legend={legend ? <ChartLegend items={DIRECTION_LEGEND} marker="square" /> : null}
      axis={{ ticks, y, format: formatTick }}
      xLabels={timeLabels(
        data.map((item) => item.label),
        x,
        false,
      )}
      anchors={data.map((_, i) => ({ x: x(i), y: box.top }))}
      crosshair="band"
      band={band}
      describe={(i) => ({ title: data[i]?.label ?? '', rows: PRICE_ROWS.map(([name, key]) => ({ name, value: formatValue(data[i]?.[key] ?? 0) })) })}
      table={{
        rowHeader: 'Период',
        columns: PRICE_ROWS.map(([name]) => name),
        rows: data.map((item) => ({ header: item.label, cells: PRICE_ROWS.map(([, key]) => formatValue(item[key])) })),
      }}
    >
      {() =>
        data.map((item, i) => {
          const up = item.close >= item.open;
          const color = up ? UP : DOWN;
          const cx = x(i);
          const top = y(Math.max(item.open, item.close));
          const bottom = y(Math.min(item.open, item.close));
          const style = { transitionDelay: `${i * 20}ms` };
          if (kind === 'ohlc') {
            return (
              <g key={i} data-slot="trend-ohlc" data-direction={up ? 'up' : 'down'} stroke={color} strokeWidth={2} strokeLinecap="round" style={style} className={FADE}>
                <line x1={cx} x2={cx} y1={y(item.high)} y2={y(item.low)} />
                <line x1={cx - tick} x2={cx} y1={y(item.open)} y2={y(item.open)} />
                <line x1={cx} x2={cx + tick} y1={y(item.close)} y2={y(item.close)} />
              </g>
            );
          }
          return (
            <g key={i} data-slot="trend-candle" data-direction={up ? 'up' : 'down'} stroke={color} strokeWidth={1.5} style={style} className={FADE}>
              <line x1={cx} x2={cx} y1={y(item.high)} y2={top} />
              <line x1={cx} x2={cx} y1={bottom} y2={y(item.low)} />
              <rect
                x={cx - body / 2}
                y={top}
                width={body}
                height={Math.max(1.5, bottom - top)}
                fill={up ? 'var(--color-surface-1)' : color}
                stroke={up ? color : 'none'}
              />
            </g>
          );
        })
      }
    </Frame>
  );
}

/** Daily price: rising candles hollow chart-1, falling filled chart-2 — direction reads without colour too; wicks 1,5 in the same colour. */
export function CandlestickChart(props: CandlestickChartProps) {
  return <PriceChart kind="candle" {...props} />;
}

/** OHLC bars, more compact than candles on long series: a 2 px line with round caps, open tick left, close tick right. */
export function OhlcChart(props: CandlestickChartProps) {
  return <PriceChart kind="ohlc" {...props} />;
}

/* ---------- 42 Kagi, point and figure, renko ---------- */

export interface RenkoBrick {
  direction: 'up' | 'down';
  low: number;
  high: number;
  /** Index of the price that completed the brick. */
  index: number;
}

const tidy = (value: number) => Math.round(value * 1e9) / 1e9;

/** Renko on closing prices: a brick per full `size` move; a reversal needs a move of two bricks from the last brick's far edge. */
export function renkoBricks(values: readonly number[], size: number): RenkoBrick[] {
  const bricks: RenkoBrick[] = [];
  const start = values[0];
  if (start === undefined || !(size > 0)) return bricks;
  let low = start;
  let high = start;
  values.forEach((price, index) => {
    while (price >= tidy(high + size)) {
      bricks.push({ direction: 'up', low: high, high: tidy(high + size), index });
      low = high;
      high = tidy(high + size);
    }
    while (price <= tidy(low - size)) {
      bricks.push({ direction: 'down', low: tidy(low - size), high: low, index });
      high = low;
      low = tidy(low - size);
    }
  });
  return bricks;
}

export interface PointFigureColumn {
  /** X — rising, O — falling. */
  direction: 'x' | 'o';
  /** Bottom price of the lowest and of the highest box. */
  low: number;
  high: number;
  boxes: number;
  /** Index of the last price that changed the column. */
  index: number;
}

/** Point and figure on closing prices: box k spans k·size…(k+1)·size; a column grows box by box and turns after `reversal` boxes the other way. */
export function pointFigureColumns(values: readonly number[], size: number, reversal = 3): PointFigureColumn[] {
  const first = values[0];
  if (first === undefined || !(size > 0)) return [];
  const boxOf = (price: number) => Math.floor(tidy(price / size));
  const start = boxOf(first);
  const columns: { direction: 'x' | 'o'; low: number; high: number; index: number }[] = [];
  values.forEach((price, index) => {
    const at = boxOf(price);
    const last = columns[columns.length - 1];
    if (!last) {
      if (at > start) columns.push({ direction: 'x', low: start, high: at, index });
      else if (at < start) columns.push({ direction: 'o', low: at, high: start, index });
    } else if (last.direction === 'x') {
      if (at > last.high) Object.assign(last, { high: at, index });
      else if (at <= last.high - reversal) columns.push({ direction: 'o', low: at, high: last.high - 1, index });
    } else if (at < last.low) Object.assign(last, { low: at, index });
    else if (at >= last.low + reversal) columns.push({ direction: 'x', low: last.low + 1, high: at, index });
  });
  return columns.map((column) => ({ ...column, low: tidy(column.low * size), high: tidy(column.high * size), boxes: column.high - column.low + 1 }));
}

export interface KagiSegment {
  from: number;
  to: number;
  /** Yang (thick) after breaking the previous shoulder up, yin (thin) after breaking the previous waist down. */
  yang: boolean;
}

export interface KagiLine {
  direction: 'up' | 'down';
  start: number;
  end: number;
  /** Pieces of the vertical, split where its thickness changes. */
  segments: KagiSegment[];
  /** Index of the price that ended the line. */
  index: number;
}

/** Kagi on closing prices: the line turns when price reverses by `reversal` (percent of the extreme, or price units) and changes thickness at the last shoulder or waist. */
export function kagiLines(values: readonly number[], reversal: number, unit: 'percent' | 'price' = 'percent'): KagiLine[] {
  const first = values[0];
  if (first === undefined) return [];
  const threshold = (extreme: number) => (unit === 'percent' ? (Math.abs(extreme) * reversal) / 100 : reversal);
  const turns: { direction: 'up' | 'down'; start: number; end: number; index: number }[] = [];
  values.forEach((price, index) => {
    const line = turns[turns.length - 1];
    if (!line) {
      if (price !== first) turns.push({ direction: price > first ? 'up' : 'down', start: first, end: price, index });
      return;
    }
    const further = line.direction === 'up' ? price > line.end : price < line.end;
    if (further) Object.assign(line, { end: price, index });
    else if (Math.abs(price - line.end) >= threshold(line.end) - 1e-9) {
      turns.push({ direction: line.direction === 'up' ? 'down' : 'up', start: line.end, end: price, index });
    }
  });
  let yang = turns[0]?.direction === 'up';
  let shoulder = first;
  let waist = first;
  return turns.map((line) => {
    const segments: KagiSegment[] = [];
    const breaks = line.direction === 'up' ? !yang && line.end > shoulder : yang && line.end < waist;
    if (breaks) {
      const level = line.direction === 'up' ? shoulder : waist;
      segments.push({ from: line.start, to: level, yang }, { from: level, to: line.end, yang: !yang });
      yang = !yang;
    } else segments.push({ from: line.start, to: line.end, yang });
    if (line.direction === 'up') shoulder = line.end;
    else waist = line.end;
    return { ...line, segments };
  });
}

interface ReversalProps extends TrendBaseProps {
  /** Closing prices in time order. */
  values: readonly number[];
  /** Dates of the prices, for tooltips: a figure gets the date that completed it. */
  labels?: readonly string[];
  legend?: boolean;
}

const figureTitle = (word: string, i: number, labels: readonly string[] | undefined, index: number) =>
  `${word} ${i + 1}${labels?.[index] ? ` · ${labels[index]}` : ''}`;

export interface RenkoChartProps extends ReversalProps {
  /** Price move of one brick. */
  brickSize: number;
}

/** Bricks of one price step, one per column, no time axis: a new brick only when price moves; rising hollow, falling filled. */
export function RenkoChart({ values, labels, brickSize, formatValue = formatNumber, height = 220, legend = true, ...props }: RenkoChartProps) {
  const [ref, width] = useWidth(560);
  const bricks = renkoBricks(values, brickSize);
  const box = makeBox(width, height, { left: 0, bottom: 8 });
  const y = linearScale([Math.min(...bricks.map((brick) => brick.low)), Math.max(...bricks.map((brick) => brick.high))], [box.bottom, box.top]);
  const stepX = Math.min(24, (box.right - box.left) / Math.max(1, bricks.length));
  const x = (i: number) => box.left + (i + 0.5) * stepX;
  const w = Math.max(2, stepX * 0.8);
  const range = (brick: RenkoBrick) => `${formatValue(brick.low)} – ${formatValue(brick.high)}`;
  const word = (brick: RenkoBrick) => (brick.direction === 'up' ? 'Рост' : 'Падение');

  return (
    <Frame
      {...props}
      slot="renko-chart"
      plotRef={ref}
      box={box}
      legend={legend ? <ChartLegend items={DIRECTION_LEGEND} marker="square" /> : null}
      anchors={bricks.map((_, i) => ({ x: x(i), y: box.top }))}
      crosshair="band"
      band={stepX}
      describe={(i) => {
        const brick = bricks[i];
        return {
          title: figureTitle('Кирпич', i, labels, brick?.index ?? 0),
          rows: brick ? [{ name: word(brick), color: brick.direction === 'up' ? UP : DOWN, value: range(brick) }] : [],
        };
      }}
      table={{
        rowHeader: 'Кирпич',
        columns: ['Направление', 'Цена'],
        rows: bricks.map((brick, i) => ({ header: figureTitle('Кирпич', i, labels, brick.index), cells: [word(brick), range(brick)] })),
      }}
    >
      {() =>
        bricks.map((brick, i) => (
          <rect
            key={i}
            data-slot="trend-brick"
            data-direction={brick.direction}
            x={x(i) - w / 2}
            y={y(brick.high)}
            width={w}
            height={Math.max(1, y(brick.low) - y(brick.high))}
            fill={brick.direction === 'up' ? 'var(--color-surface-1)' : DOWN}
            stroke={brick.direction === 'up' ? UP : 'none'}
            strokeWidth={1.5}
            style={{ transitionDelay: `${i * 15}ms` }}
            className={FADE}
          />
        ))
      }
    </Frame>
  );
}

export interface PointFigureChartProps extends ReversalProps {
  /** Price of one box. */
  boxSize: number;
  /** Boxes against the column that start a new one. */
  reversal?: number;
}

/** Point and figure: X columns chart-1 for rises, O columns chart-2 for falls, box by box; time only moves with price. */
export function PointFigureChart({ values, labels, boxSize, reversal = 3, formatValue = formatNumber, height = 220, legend = true, ...props }: PointFigureChartProps) {
  const [ref, width] = useWidth(560);
  const columns = pointFigureColumns(values, boxSize, reversal);
  const box = makeBox(width, height, { left: 0, bottom: 8 });
  const boxIndex = (price: number) => Math.round(price / boxSize);
  const lowBox = Math.min(...columns.map((column) => boxIndex(column.low)));
  const highBox = Math.max(...columns.map((column) => boxIndex(column.high)));
  const cellH = Math.min(14, (box.bottom - box.top) / Math.max(1, highBox - lowBox + 1));
  const stepX = Math.min(14, (box.right - box.left) / Math.max(1, columns.length));
  const x = (i: number) => box.left + (i + 0.5) * stepX;
  const y = (k: number) => box.bottom - (k - lowBox + 0.5) * cellH;
  const glyph = Math.min(cellH, stepX) * 0.4;
  const range = (column: PointFigureColumn) => `${formatValue(column.low)} – ${formatValue(column.high)}`;
  const word = (column: PointFigureColumn) => (column.direction === 'x' ? 'Крестики' : 'Нолики');

  return (
    <Frame
      {...props}
      slot="point-figure-chart"
      plotRef={ref}
      box={box}
      legend={legend ? <ChartLegend items={DIRECTION_LEGEND} marker="square" /> : null}
      anchors={columns.map((_, i) => ({ x: x(i), y: box.top }))}
      crosshair="band"
      band={stepX}
      describe={(i) => {
        const column = columns[i];
        return {
          title: figureTitle('Колонка', i, labels, column?.index ?? 0),
          rows: column
            ? [
                { name: word(column), color: column.direction === 'x' ? UP : DOWN, value: range(column) },
                { name: 'Клеток', value: String(column.boxes) },
              ]
            : [],
        };
      }}
      table={{
        rowHeader: 'Колонка',
        columns: ['Знак', 'Цена', 'Клеток'],
        rows: columns.map((column, i) => ({ header: figureTitle('Колонка', i, labels, column.index), cells: [word(column), range(column), String(column.boxes)] })),
      }}
    >
      {() =>
        columns.map((column, i) => {
          const from = boxIndex(column.low);
          const cx = x(i);
          return (
            <g
              key={i}
              data-slot="trend-pf-column"
              data-direction={column.direction}
              fill="none"
              stroke={column.direction === 'x' ? UP : DOWN}
              strokeWidth={1.6}
              strokeLinecap="round"
              style={{ transitionDelay: `${i * 25}ms` }}
              className={FADE}
            >
              {Array.from({ length: column.boxes }, (_, j) => {
                const cy = y(from + j);
                return column.direction === 'x' ? (
                  <path key={j} d={`M${cx - glyph} ${cy - glyph}L${cx + glyph} ${cy + glyph}M${cx + glyph} ${cy - glyph}L${cx - glyph} ${cy + glyph}`} />
                ) : (
                  <circle key={j} cx={cx} cy={cy} r={glyph} />
                );
              })}
            </g>
          );
        })
      }
    </Frame>
  );
}

export interface KagiChartProps extends ReversalProps {
  /** Reversal threshold: percent of the last extreme (default) or price units. */
  reversal: number;
  unit?: 'percent' | 'price';
}

/** Kagi: one line that turns on a reversal threshold; yang (shoulder broken up) thick 3 chart-1, yin (waist broken down) thin 1,5 chart-2. */
export function KagiChart({ values, labels, reversal, unit = 'percent', formatValue = formatNumber, height = 220, legend = true, ...props }: KagiChartProps) {
  const [ref, width] = useWidth(560);
  const lines = kagiLines(values, reversal, unit);
  const box = makeBox(width, height, { left: 0, bottom: 8 });
  const levels = lines.flatMap((line) => [line.start, line.end]);
  const y = linearScale([Math.min(...levels), Math.max(...levels)], [box.bottom, box.top]);
  const stepX = Math.min(40, (box.right - box.left - 4) / Math.max(1, lines.length - 1));
  const x = (i: number) => box.left + 2 + i * stepX;
  const stroke = (yang: boolean) => ({ stroke: yang ? UP : DOWN, strokeWidth: yang ? 3 : 1.5 });
  const move = (line: KagiLine) => `${formatValue(line.start)} → ${formatValue(line.end)}`;

  return (
    <Frame
      {...props}
      slot="kagi-chart"
      plotRef={ref}
      box={box}
      legend={
        legend ? (
          <ChartLegend
            items={[
              { name: 'Ян — пробой плеча вверх', color: UP },
              { name: 'Инь — пробой талии вниз', color: DOWN },
            ]}
            marker="line"
          />
        ) : null
      }
      anchors={lines.map((_, i) => ({ x: x(i), y: box.top }))}
      crosshair="band"
      band={Math.min(24, stepX)}
      marker="line"
      describe={(i) => {
        const line = lines[i];
        return {
          title: figureTitle('Линия', i, labels, line?.index ?? 0),
          rows: line ? [{ name: line.direction === 'up' ? 'Рост' : 'Падение', value: move(line) }] : [],
        };
      }}
      table={{
        rowHeader: 'Линия',
        columns: ['Направление', 'Цена', 'Толщина'],
        rows: lines.map((line, i) => ({
          header: figureTitle('Линия', i, labels, line.index),
          cells: [line.direction === 'up' ? 'Рост' : 'Падение', move(line), line.segments.map((segment) => (segment.yang ? 'ян' : 'инь')).join(', затем ')],
        })),
      }}
    >
      {() => (
        <g className={REVEAL} strokeLinecap="square">
          {lines.map((line, i) => {
            const last = line.segments[line.segments.length - 1];
            return (
              <g key={i}>
                {line.segments.map((segment, j) => (
                  <line key={j} data-slot="trend-kagi-segment" data-yang={segment.yang} x1={x(i)} x2={x(i)} y1={y(segment.from)} y2={y(segment.to)} {...stroke(segment.yang)} />
                ))}
                {i < lines.length - 1 && last ? (
                  <line data-slot="trend-kagi-segment" data-yang={last.yang} x1={x(i)} x2={x(i + 1)} y1={y(line.end)} y2={y(line.end)} {...stroke(last.yang)} />
                ) : null}
              </g>
            );
          })}
        </g>
      )}
    </Frame>
  );
}
