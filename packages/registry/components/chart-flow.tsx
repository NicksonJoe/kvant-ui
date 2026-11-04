import { useMemo, useState, type ComponentProps, type KeyboardEvent } from 'react';
import {
  ChartLegend,
  ChartPlot,
  ChartTooltip,
  SEQUENTIAL_COLORS,
  ValueAxis,
  arcPath,
  columnPath,
  formatAxisValue,
  formatNumber,
  formatPercent,
  linearScale,
  measureText,
  niceRangeTicks,
  polar,
  seriesColor,
  stepIndex,
  useHiddenSeries,
  useWidth,
  type ChartTooltipRow,
  type Point,
} from '../lib/chart-kit';
import { cn } from '../lib/cn';

/* Flow and process — where does it go? Funnel, P&L bridge, sankey, chord, network, arc diagram, cohort retention. */

const MINUS = '−';
const share = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
/** Whole percent for pills and cells: «45 %». */
const wholePercent = (value: number) => `${Math.round(value * 100)} %`;
const signed = (value: number, format: (value: number) => string) =>
  value > 0 ? `+${format(value)}` : value < 0 ? `${MINUS}${format(-value)}` : format(0);
let family = '';
/** Label width with the theme font (`--font-sans`, so the Geist variant measures right too). */
function textWidth(text: string, size: number, weight = 400): number {
  if (!family && typeof document !== 'undefined') family = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim();
  return measureText(text, `${weight} ${size}px ${family || 'Inter, sans-serif'}`);
}
const round = (value: number) => Math.round(value * 10) / 10;
const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const DIM = 'transition-opacity duration-(--duration-quick)';

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const boxAttr = (box: Box) => [box.x0, box.y0, box.x1, box.y1].map(round).join(' ');
/** The text, or its head with «…», shortened until `fits` accepts it; null when not even one letter fits. */
function shorten(text: string, fits: (candidate: string) => boolean): string | null {
  for (let length = text.length; length > 0; length -= 1) {
    const candidate = length === text.length ? text : `${text.slice(0, length).trimEnd()}…`;
    if (fits(candidate)) return candidate;
  }
  return null;
}

/** ← → Home End stepping with the announcement; `keys` remaps extra keys (↑ ↓ on vertical charts). */
function useStepper(count: number, describe: (index: number) => string, keys: Readonly<Record<string, string>> = {}) {
  const [active, setActive] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = stepIndex(keys[event.key] ?? event.key, active, count);
    if (index === null) return;
    event.preventDefault();
    setActive(index);
    setSpoken(describe(index));
  };
  return { active, setActive, plot: { spoken, onKeyDown, onBlur: () => setActive(null) } };
}

const VERTICAL = { ArrowDown: 'ArrowRight', ArrowUp: 'ArrowLeft' } as const;

export interface FlowLegendItem {
  name: string;
  color: string;
}

/* ---------- Funnel ---------- */

export interface FunnelStep {
  label: string;
  value: number;
}

export interface FunnelChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  /** Steps top to bottom; each one is compared with the previous. */
  data: readonly FunnelStep[];
  formatValue?: (value: number) => string;
  /** One hue for every bar (default chart-1). */
  color?: string;
}

const FUNNEL_ROW = 48;

const barRight = (top: number, width: number, height: number) => {
  const r = Math.min(4, width / 2);
  const w = round(width);
  return `M0 ${top}H${round(width - r)}Q${w} ${top} ${w} ${top + r}V${top + height - r}Q${w} ${top + height} ${round(width - r)} ${top + height}H0Z`;
};

/** Bars from a common zero so lengths compare, the step conversion in a fill-2 pill on the right, the total under it. */
export function FunnelChart({ data, formatValue = formatNumber, color, className, 'aria-label': label, ...props }: FunnelChartProps) {
  const [ref, width] = useWidth(604);
  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const max = Math.max(0, ...data.map((step) => step.value));
  const pill = width < 420 ? 64 : 76;
  const barMax = Math.max(48, width - pill - 88);
  const rate = (i: number) => share(data[i]?.value ?? 0, data[i - 1]?.value ?? 0);
  const barWidth = (value: number) => (max > 0 ? (value / max) * barMax : 0);
  const describe = (i: number) => {
    const step = data[i];
    if (!step) return '';
    return i === 0
      ? `${step.label}: ${formatValue(step.value)}`
      : `${step.label}: ${formatValue(step.value)}, ${wholePercent(rate(i))} от прошлого шага, ${formatPercent(share(step.value, first))} от начала`;
  };
  const { active, setActive, plot } = useStepper(data.length, describe, VERTICAL);
  const current = active === null ? undefined : data[active];

  return (
    <div data-slot="funnel-chart" className={cn('flex flex-col', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Шаг',
          columns: ['Значение', 'От прошлого шага', 'От начала'],
          rows: data.map((step, i) => ({
            header: step.label,
            cells: [formatValue(step.value), i > 0 ? wholePercent(rate(i)) : '—', formatPercent(share(step.value, first))],
          })),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={data.length * FUNNEL_ROW + 14} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {active !== null ? <rect x={-8} y={active * FUNNEL_ROW - 4} width={width + 16} height={FUNNEL_ROW} rx={8} className="fill-fill-1" /> : null}
          {data.map((step, i) => {
            const top = i * FUNNEL_ROW + 20;
            const w = barWidth(step.value);
            return (
              <g key={i}>
                <text x={0} y={i * FUNNEL_ROW + 13} className="fill-fg-2 text-caption">
                  {step.label}
                </text>
                <path
                  data-slot="funnel-bar"
                  data-value={step.value}
                  data-width={w}
                  d={barRight(top, w, 20)}
                  fill={seriesColor(0, color)}
                  style={{ transitionDelay: `${i * 35}ms` }}
                  className="origin-left transition-[scale] duration-(--duration-slow) ease-standard [transform-box:fill-box] starting:scale-x-0"
                />
                <text x={round(w + 8)} y={top + 10} dominantBaseline="middle" className="fill-fg-1 text-caption font-semibold tabular-nums">
                  {formatValue(step.value)}
                </text>
                {i > 0 ? (
                  <g data-slot="funnel-step">
                    <rect x={width - pill} y={i * FUNNEL_ROW + 4} width={pill} height={24} rx={6} className="fill-fill-2" />
                    <text
                      x={width - pill / 2}
                      y={i * FUNNEL_ROW + 16}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-fg-2 text-caption font-semibold tabular-nums"
                    >
                      {`→ ${wholePercent(rate(i))}`}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
          {data.length > 1 ? (
            <text x={width - pill / 2} y={data.length * FUNNEL_ROW + 10} textAnchor="middle" className="fill-fg-1 text-caption font-semibold tabular-nums">
              {`итого ${formatPercent(share(last, first))}`}
            </text>
          ) : null}
          {data.map((_, i) => (
            <rect key={i} data-slot="funnel-row" x={0} y={i * FUNNEL_ROW - 4} width={width} height={FUNNEL_ROW} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {active !== null && current ? (
          <ChartTooltip
            x={Math.min(width, barWidth(current.value) + 8)}
            width={width}
            y={active * FUNNEL_ROW + 44}
            title={current.label}
            rows={[
              { name: 'На шаге', value: formatValue(current.value) },
              ...(active > 0
                ? [
                    { name: 'От прошлого шага', value: wholePercent(rate(active)) },
                    { name: 'От начала', value: formatPercent(share(current.value, first)) },
                  ]
                : []),
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Waterfall ---------- */

export interface WaterfallStep {
  label: string;
  /** Change of this step. A total adds its own value first, so the starting «План» is a total with a value. */
  value?: number;
  /** Bar from zero to the running sum: «План», «Факт», subtotals. */
  total?: boolean;
}

export interface WaterfallBar {
  label: string;
  start: number;
  end: number;
  /** The step's own change; for a total, the total itself. */
  delta: number;
  kind: 'total' | 'up' | 'down';
}

/** Running sum: steps hang from the previous level, totals stand on zero. */
export function waterfallLayout(steps: readonly WaterfallStep[]): WaterfallBar[] {
  let level = 0;
  return steps.map((step) => {
    const delta = step.value ?? 0;
    if (step.total) {
      level += delta;
      return { label: step.label, start: 0, end: level, delta: level, kind: 'total' };
    }
    const start = level;
    level += delta;
    return { label: step.label, start, end: level, delta, kind: delta < 0 ? 'down' : 'up' };
  });
}

export interface WaterfallChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  data: readonly WaterfallStep[];
  /** Bar labels and tooltip; steps get a sign in front: «+0,9», «−0,7». */
  formatValue?: (value: number) => string;
  /** Plot height in px, without the axis labels. */
  height?: number;
  /** Legend «Итог · Рост · Потеря». */
  legend?: boolean;
}

const WATERFALL_COLORS = { total: 'var(--color-fg-3)', up: seriesColor(0), down: seriesColor(1) } as const;
const WATERFALL_NAMES = { total: 'Итог', up: 'Рост', down: 'Потеря' } as const;
const WATERFALL_MARGIN = { top: 8, bottom: 40, left: 48 };

/** Two lines at the space nearest the middle when the label is wider than its band. */
function wrapLabel(text: string, room: number, size: number): string[] {
  if (textWidth(text, size) <= room) return [text];
  const spaces = [...text.matchAll(/ /g)].map((match) => match.index);
  if (spaces.length === 0) return [text];
  const middle = text.length / 2;
  const cut = spaces.reduce((best, index) => (Math.abs(index - middle) < Math.abs(best - middle) ? index : best));
  return [text.slice(0, cut), text.slice(cut + 1)];
}

/** P&L bridge: totals from zero in fg-3, growth and losses hang on the previous level, dashed 2/2 connectors carry it. */
export function WaterfallChart({
  data,
  formatValue = formatNumber,
  height = 196,
  legend = true,
  className,
  'aria-label': label,
  ...props
}: WaterfallChartProps) {
  const [ref, width] = useWidth(604);
  const bars = waterfallLayout(data);
  const levels = bars.flatMap((bar) => [bar.start, bar.end]);
  const ticks = niceRangeTicks(Math.min(0, ...levels), Math.max(0, ...levels));
  const { top, bottom, left } = WATERFALL_MARGIN;
  const y = linearScale([ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1], [top + height, top]);
  const band = Math.max(1, width - left) / Math.max(1, bars.length);
  const barW = Math.min(36, band * 0.6);
  const cx = (i: number) => left + (i + 0.5) * band;
  // narrow plots: when even two lines do not fit the band, labels turn 45° and the bottom grows to hold them
  const tilted = bars.some((bar) => wrapLabel(bar.label, band - 4, 11).some((line) => textWidth(line, 11) > band - 4));
  const labelRoom = tilted ? Math.max(bottom, 16 + 0.72 * Math.max(0, ...bars.map((bar) => textWidth(bar.label, 11)))) : bottom;
  const stepText = (bar: WaterfallBar) => (bar.kind === 'total' ? formatValue(bar.end) : signed(bar.delta, formatValue));
  const describe = (i: number) => {
    const bar = bars[i];
    if (!bar) return '';
    return bar.kind === 'total' ? `${bar.label}: ${formatValue(bar.end)}` : `${bar.label}: ${stepText(bar)}, итог ${formatValue(bar.end)}`;
  };
  const { active, setActive, plot } = useStepper(bars.length, describe);
  const current = active === null ? undefined : bars[active];

  return (
    <div data-slot="waterfall-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {legend ? (
        <ChartLegend marker="square" items={(['total', 'up', 'down'] as const).map((kind) => ({ name: WATERFALL_NAMES[kind], color: WATERFALL_COLORS[kind] }))} />
      ) : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Статья',
          columns: ['Изменение', 'Нарастающий итог'],
          rows: bars.map((bar) => ({ header: bar.label, cells: [bar.kind === 'total' ? '—' : stepText(bar), formatValue(bar.end)] })),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={round(height + top + labelRoom)} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          <ValueAxis ticks={ticks} y={y} left={left} right={width} />
          {active !== null ? <rect x={cx(active) - band / 2} y={top} width={band} height={height} rx={8} className="fill-fill-1" /> : null}
          {bars.slice(0, -1).map((bar, i) => (
            <line
              key={i}
              data-slot="waterfall-connector"
              x1={round(cx(i) + barW / 2)}
              x2={round(cx(i + 1) - barW / 2)}
              y1={round(y(bar.end))}
              y2={round(y(bar.end))}
              stroke="var(--color-fg-3)"
              strokeDasharray="2 2"
              style={{ transitionDelay: `${(i + 1) * 35 + 150}ms` }}
              className="transition-opacity duration-(--duration-slow) starting:opacity-0"
            />
          ))}
          {bars.map((bar, i) => {
            const x = round(cx(i) - barW / 2);
            const high = round(y(Math.max(bar.start, bar.end)));
            const low = round(y(Math.min(bar.start, bar.end)));
            const common = {
              'data-slot': 'waterfall-bar',
              'data-kind': bar.kind,
              'data-end': bar.end,
              fill: WATERFALL_COLORS[bar.kind],
              style: { transitionDelay: `${i * 35}ms` },
              className: 'origin-bottom transition-[scale] duration-(--duration-slow) ease-standard [transform-box:fill-box] starting:scale-y-0',
            };
            return (
              <g key={i}>
                {bar.kind === 'total' && bar.end >= 0 ? (
                  <path {...common} d={columnPath(x, high, round(barW), low)} />
                ) : (
                  <rect {...common} x={x} y={high} width={round(barW)} height={round(Math.max(1, low - high))} rx={2} />
                )}
                <text x={round(cx(i))} y={high - 8} textAnchor="middle" className="fill-fg-1 text-caption font-semibold tabular-nums">
                  {stepText(bar)}
                </text>
                {tilted ? (
                  <text
                    x={round(cx(i) + 3)}
                    y={top + height + 14}
                    textAnchor="end"
                    transform={`rotate(-45 ${round(cx(i) + 3)} ${top + height + 14})`}
                    className="fill-fg-3 text-overline"
                  >
                    {bar.label}
                  </text>
                ) : (
                  <text x={round(cx(i))} y={top + height + 18} textAnchor="middle" className="fill-fg-3 text-overline">
                    {wrapLabel(bar.label, band - 4, 11).map((line, j) => (
                      <tspan key={j} x={round(cx(i))} dy={j === 0 ? 0 : 14}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}
              </g>
            );
          })}
          {bars.map((_, i) => (
            <rect key={i} x={cx(i) - band / 2} y={top} width={band} height={height} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {active !== null && current ? (
          <ChartTooltip
            x={cx(active) + barW / 2}
            width={width}
            title={current.label}
            rows={
              current.kind === 'total'
                ? [{ name: 'Итог', value: formatValue(current.end), color: WATERFALL_COLORS.total }]
                : [
                    { name: WATERFALL_NAMES[current.kind], value: stepText(current), color: WATERFALL_COLORS[current.kind] },
                    { name: 'Итог после шага', value: formatValue(current.end) },
                  ]
            }
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Sankey ---------- */

export interface SankeyNode {
  id: string;
  label?: string;
  /** Default: the palette for the first column, fg-2 for the rest. */
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyNodeLayout {
  id: string;
  label: string;
  /** Position in the input. */
  index: number;
  column: number;
  /** The larger of in and out. */
  value: number;
  incoming: number;
  outgoing: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface SankeyLinkLayout {
  /** Position in the input. */
  index: number;
  source: string;
  target: string;
  value: number;
  width: number;
  /** Centre of the ribbon at the source and at the target. */
  y0: number;
  y1: number;
  path: string;
}

export interface SankeyLayout {
  nodes: SankeyNodeLayout[];
  /** Links that survive (no cycles, no self-links), in input order. */
  links: SankeyLinkLayout[];
  columns: number;
}

export interface SankeyLayoutOptions {
  /** Left edge of the first column and right edge of the last. */
  x0: number;
  x1: number;
  height: number;
  nodeWidth?: number;
  /** Gap between nodes of the densest column. */
  padding?: number;
}

interface FlowEdge {
  index: number;
  s: number;
  t: number;
  value: number;
}

/**
 * Columns by the longest path from a source, sinks pushed to the last column; node heights ∝ the larger of in and out,
 * every column stretched to the full height; barycentre sweeps keep an order only when it crosses fewer links.
 */
export function sankeyLayout(nodes: readonly SankeyNode[], links: readonly SankeyLink[], options: SankeyLayoutOptions): SankeyLayout {
  const { x0, x1, height, nodeWidth = 12, padding = 16 } = options;
  const n = nodes.length;
  const ids = new Map(nodes.map((node, i) => [node.id, i]));
  const all: FlowEdge[] = links.flatMap((link, index) => {
    const s = ids.get(link.source);
    const t = ids.get(link.target);
    return s === undefined || t === undefined || s === t || !(link.value > 0) ? [] : [{ index, s, t, value: link.value }];
  });

  // depth-first in input order: an edge back onto the stack closes a cycle and is dropped
  const out: FlowEdge[][] = nodes.map(() => []);
  for (const edge of all) out[edge.s]?.push(edge);
  const state = new Array<number>(n).fill(0);
  const back = new Set<number>();
  const visit = (i: number) => {
    state[i] = 1;
    for (const edge of out[i] ?? []) {
      if (state[edge.t] === 1) back.add(edge.index);
      else if (state[edge.t] === 0) visit(edge.t);
    }
    state[i] = 2;
  };
  for (let i = 0; i < n; i += 1) if (state[i] === 0) visit(i);
  const flows = all.filter((edge) => !back.has(edge.index));

  const column = new Array<number>(n).fill(0);
  for (let pass = 0, changed = true; changed && pass < n; pass += 1) {
    changed = false;
    for (const edge of flows) {
      const next = (column[edge.s] ?? 0) + 1;
      if (next > (column[edge.t] ?? 0)) {
        column[edge.t] = next;
        changed = true;
      }
    }
  }
  const incoming = nodes.map((_, i) => sum(flows.filter((edge) => edge.t === i).map((edge) => edge.value)));
  const outgoing = nodes.map((_, i) => sum(flows.filter((edge) => edge.s === i).map((edge) => edge.value)));
  const last = Math.max(0, ...column);
  nodes.forEach((_, i) => {
    if ((incoming[i] ?? 0) > 0 && (outgoing[i] ?? 0) === 0) column[i] = last;
  });
  const value = nodes.map((_, i) => Math.max(incoming[i] ?? 0, outgoing[i] ?? 0));

  const order: number[][] = Array.from({ length: last + 1 }, () => []);
  nodes.forEach((_, i) => order[column[i] ?? 0]?.push(i));
  const scales = order.filter((col) => col.length > 0).map((col) => (height - (col.length - 1) * padding) / sum(col.map((i) => value[i] ?? 0)));
  const ky = Math.max(0, Math.min(Number.MAX_VALUE, ...scales.filter(Number.isFinite)));
  const h = (i: number) => (value[i] ?? 0) * ky;

  const place = (cols: readonly (readonly number[])[]) => {
    const top = new Array<number>(n).fill(0);
    for (const col of cols) {
      const free = height - sum(col.map(h));
      const gap = col.length > 1 ? free / (col.length - 1) : 0;
      let cursor = col.length === 1 ? free / 2 : 0;
      for (const i of col) {
        top[i] = cursor;
        cursor += h(i) + gap;
      }
    }
    return top;
  };
  const crossings = (top: readonly number[]) => {
    let count = 0;
    flows.forEach((a, i) => {
      for (const b of flows.slice(i + 1)) {
        if (a.s === b.s || a.t === b.t || column[a.s] !== column[b.s] || column[a.t] !== column[b.t]) continue;
        if (((top[a.s] ?? 0) - (top[b.s] ?? 0)) * ((top[a.t] ?? 0) - (top[b.t] ?? 0)) < 0) count += 1;
      }
    });
    return count;
  };
  const centre = (top: readonly number[], i: number) => (top[i] ?? 0) + h(i) / 2;
  const barycentre = (top: readonly number[], i: number, side: 'in' | 'out') => {
    const near = flows.filter((edge) => (side === 'in' ? edge.t === i : edge.s === i));
    const weight = sum(near.map((edge) => edge.value));
    return weight > 0 ? sum(near.map((edge) => edge.value * centre(top, side === 'in' ? edge.s : edge.t))) / weight : centre(top, i);
  };
  const sortColumn = (cols: number[][], c: number, side: 'in' | 'out') => {
    const top = place(cols);
    const keys = new Map((cols[c] ?? []).map((i) => [i, barycentre(top, i, side)]));
    cols[c] = [...(cols[c] ?? [])].sort((a, b) => (keys.get(a) ?? 0) - (keys.get(b) ?? 0));
  };

  let best = order;
  let fewest = crossings(place(order));
  const trial = order.map((col) => [...col]);
  for (let sweep = 0; sweep < 4 && fewest > 0; sweep += 1) {
    for (let c = 1; c <= last; c += 1) sortColumn(trial, c, 'in');
    for (let c = last - 1; c >= 0; c -= 1) sortColumn(trial, c, 'out');
    const count = crossings(place(trial));
    if (count < fewest) {
      fewest = count;
      best = trial.map((col) => [...col]);
    }
  }

  const top = place(best);
  const columnX = (c: number) => (last > 0 ? x0 + (c * (x1 - x0 - nodeWidth)) / last : x0);
  const laid: SankeyNodeLayout[] = nodes.map((node, i) => {
    const x = columnX(column[i] ?? 0);
    return {
      id: node.id,
      label: node.label ?? node.id,
      index: i,
      column: column[i] ?? 0,
      value: value[i] ?? 0,
      incoming: incoming[i] ?? 0,
      outgoing: outgoing[i] ?? 0,
      x0: x,
      x1: x + nodeWidth,
      y0: top[i] ?? 0,
      y1: (top[i] ?? 0) + h(i),
    };
  });

  // ribbons stack at each end in the order of the node on the other side, so they leave without crossing
  const sourceY = new Map<number, number>();
  const targetY = new Map<number, number>();
  laid.forEach((node, i) => {
    let cursor = node.y0;
    for (const edge of flows.filter((item) => item.s === i).sort((a, b) => (top[a.t] ?? 0) - (top[b.t] ?? 0))) {
      sourceY.set(edge.index, cursor + (edge.value * ky) / 2);
      cursor += edge.value * ky;
    }
    cursor = node.y0;
    for (const edge of flows.filter((item) => item.t === i).sort((a, b) => (top[a.s] ?? 0) - (top[b.s] ?? 0))) {
      targetY.set(edge.index, cursor + (edge.value * ky) / 2);
      cursor += edge.value * ky;
    }
  });

  return {
    nodes: laid,
    links: flows.map((edge) => {
      const width = edge.value * ky;
      const y0 = sourceY.get(edge.index) ?? 0;
      const y1 = targetY.get(edge.index) ?? 0;
      const xs = round(laid[edge.s]?.x1 ?? 0);
      const xt = round(laid[edge.t]?.x0 ?? 0);
      const xm = round((xs + xt) / 2);
      const [a, aw, b, bw] = [y0 - width / 2, y0 + width / 2, y1 - width / 2, y1 + width / 2].map(round);
      return {
        index: edge.index,
        source: nodes[edge.s]?.id ?? '',
        target: nodes[edge.t]?.id ?? '',
        value: edge.value,
        width,
        y0,
        y1,
        path: `M${xs} ${a}C${xm} ${a} ${xm} ${b} ${xt} ${b}V${bw}C${xm} ${bw} ${xm} ${aw} ${xs} ${aw}Z`,
      };
    }),
    columns: last + 1,
  };
}

interface MiddleLabel {
  placement: 'above' | 'below' | 'line-above' | 'line-below' | 'hidden';
  name: string;
  x: number;
  nameY: number;
  valueY?: number;
  box: Box;
}

/** Does a ribbon pass through the box? Both Bézier edges share x(t), so one walk along t checks the whole band. */
function ribbonCrosses(xs: number, xt: number, top0: number, top1: number, thickness: number, box: Box): boolean {
  const xm = (xs + xt) / 2;
  for (let i = 0; i <= 96; i += 1) {
    const t = i / 96;
    const u = 1 - t;
    const x = u * u * u * xs + 3 * u * t * xm + t * t * t * xt;
    if (x < box.x0 || x > box.x1) continue;
    const y = (u * u * u + 3 * u * u * t) * top0 + (3 * u * t * t + t * t * t) * top1;
    if (y < box.y1 && y + thickness > box.y0) return true;
  }
  return false;
}

/**
 * Narrow plots: a middle node's label tries two lines above, then below the node, then one shortened line above or below;
 * a spot is taken only when it misses every ribbon, node and earlier label. Otherwise the label is left to the tooltip.
 */
function placeMiddleLabels(layout: SankeyLayout, valueText: (node: SankeyNodeLayout) => string, width: number, band: number) {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const ribbons = layout.links.map((link) => ({
    xs: byId.get(link.source)?.x1 ?? 0,
    xt: byId.get(link.target)?.x0 ?? 0,
    top0: link.y0 - link.width / 2,
    top1: link.y1 - link.width / 2,
    thickness: link.width,
  }));
  const nodeBoxes = layout.nodes.map((node) => ({ x0: node.x0, y0: node.y0, x1: node.x1, y1: node.y1 }));
  const height = Math.max(0, ...layout.nodes.map((node) => node.y1));
  const placed: Box[] = [];
  const result = new Map<string, MiddleLabel>();
  const free = (box: Box) =>
    box.y0 >= -band &&
    box.y1 <= height &&
    !nodeBoxes.some((other) => overlaps(box, other)) &&
    !placed.some((other) => overlaps(box, other)) &&
    !ribbons.some((ribbon) => ribbonCrosses(ribbon.xs, ribbon.xt, ribbon.top0, ribbon.top1, ribbon.thickness, box));
  const centred = (centre: number, w: number, y0: number, y1: number): Box => {
    const x = clamp(centre, w / 2, width - w / 2);
    return { x0: x - w / 2 - 2, y0, x1: x + w / 2 + 2, y1 };
  };
  const last = layout.columns - 1;
  for (const node of [...layout.nodes].sort((a, b) => b.value - a.value)) {
    if (node.column === 0 || node.column === last) continue;
    const centre = (node.x0 + node.x1) / 2;
    const w = Math.max(textWidth(node.label, 13, 600), textWidth(valueText(node), 12));
    const above = centred(centre, w, node.y0 - 34, node.y0 - 3);
    const below = centred(centre, w, node.y1 + 3, node.y1 + 34);
    let label: MiddleLabel | undefined;
    if (free(above)) label = { placement: 'above', name: node.label, x: (above.x0 + above.x1) / 2, nameY: node.y0 - 20, valueY: node.y0 - 6, box: above };
    else if (free(below)) label = { placement: 'below', name: node.label, x: (below.x0 + below.x1) / 2, nameY: node.y1 + 16, valueY: node.y1 + 31, box: below };
    else {
      for (const side of ['line-above', 'line-below'] as const) {
        const spot = (text: string) => {
          const tw = textWidth(text, 13, 600);
          return side === 'line-above' ? centred(centre, tw, node.y0 - 18, node.y0 - 3) : centred(centre, tw, node.y1 + 3, node.y1 + 18);
        };
        const name = shorten(node.label, (candidate) => free(spot(candidate)));
        if (name !== null) {
          const box = spot(name);
          label = { placement: side, name, x: (box.x0 + box.x1) / 2, nameY: side === 'line-above' ? node.y0 - 6 : node.y1 + 15, box };
          break;
        }
      }
    }
    const final = label ?? { placement: 'hidden', name: node.label, x: centre, nameY: 0, box: { x0: 0, y0: 0, x1: 0, y1: 0 } };
    if (final.placement !== 'hidden') placed.push(final.box);
    result.set(node.id, final);
  }
  return result;
}

export interface SankeyChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  nodes: readonly SankeyNode[];
  links: readonly SankeyLink[];
  /** Node id: flows into it are painted seq-2, the meaningful path; the rest stay fill-3. */
  highlight?: string;
  /** Static legend above the plot: «Источник · Поток к покупке · Остальные потоки». */
  legend?: readonly FlowLegendItem[];
  formatValue?: (value: number) => string;
  /** Plot height in px. */
  height?: number;
}

/** Nodes 12 wide, ribbon width = volume, neutral ribbons and one meaningful flow; labels with numbers, the last column with shares. */
export function SankeyChart({
  nodes,
  links,
  highlight,
  legend,
  formatValue = formatNumber,
  height = 300,
  className,
  'aria-label': label,
  ...props
}: SankeyChartProps) {
  const [ref, width] = useWidth(1272);
  const [link, setLink] = useState<number | null>(null);
  // a first pass only to know the columns, so label room can be reserved before the real layout
  const probe = useMemo(() => sankeyLayout(nodes, links, { x0: 0, x1: 1, height }), [nodes, links, height]);
  const lastColumn = probe.columns - 1;
  const columnTotal = (c: number) => sum(probe.nodes.filter((node) => node.column === c).map((node) => node.value));
  const valueText = (node: SankeyNodeLayout) =>
    node.column === lastColumn && lastColumn > 0
      ? `${formatValue(node.value)} · ${formatPercent(share(node.value, columnTotal(node.column)))}`
      : formatValue(node.value);
  const room = (c: number, gap: number) =>
    Math.min(
      width * 0.3,
      gap + Math.max(0, ...probe.nodes.filter((node) => node.column === c).map((node) => Math.max(textWidth(node.label, 13, 600), textWidth(valueText(node), 12)))),
    );
  const left = room(0, 8);
  const right = lastColumn > 0 ? room(lastColumn, 10) : 0;
  // narrow plots: middle labels go above or below their node, so a band on top makes room for the first one
  const narrow = width < 560 && lastColumn > 1;
  const band = narrow ? 34 : 0;
  const plotH = height - band;
  const layout = useMemo(() => sankeyLayout(nodes, links, { x0: left, x1: width - right, height: plotH }), [nodes, links, left, right, width, plotH]);
  const steps = [...layout.nodes].sort((a, b) => a.column - b.column || a.y0 - b.y0);
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const name = (id: string) => byId.get(id)?.label ?? id;
  const firstColumn = layout.nodes.filter((node) => node.column === 0).map((node) => node.index);
  const color = (node: SankeyNodeLayout) =>
    node.column === 0 ? seriesColor(firstColumn.indexOf(node.index), nodes[node.index]?.color) : (nodes[node.index]?.color ?? 'var(--color-fg-2)');
  const flowRows = (node: SankeyNodeLayout): ChartTooltipRow[] => {
    const outgoing = layout.links.filter((item) => item.source === node.id);
    return outgoing.length > 0
      ? outgoing.map((item) => ({ name: `→ ${name(item.target)}`, value: formatValue(item.value) }))
      : layout.links.filter((item) => item.target === node.id).map((item) => ({ name: `← ${name(item.source)}`, value: formatValue(item.value) }));
  };
  const describe = (i: number) => {
    const node = steps[i];
    if (!node) return '';
    const rows = flowRows(node);
    return `${node.label}: ${valueText(node)}${rows.length > 0 ? `; ${rows.map((row) => `${row.name} ${row.value}`).join(', ')}` : ''}`;
  };
  const { active, setActive, plot } = useStepper(steps.length, describe);
  const activeNode = active === null ? undefined : steps[active];
  const activeLink = link === null ? undefined : layout.links.find((item) => item.index === link);
  const lit = (item: SankeyLinkLayout) =>
    activeLink ? item === activeLink : activeNode ? item.source === activeNode.id || item.target === activeNode.id : true;
  const sourceShare = (item: SankeyLinkLayout) => formatPercent(share(item.value, byId.get(item.source)?.value ?? 0));
  const ordered = [...layout.links].sort((a, b) => Number(a.target === highlight) - Number(b.target === highlight));
  const middleLabels = narrow ? placeMiddleLabels(layout, valueText, width, band) : new Map<string, MiddleLabel>();

  return (
    <div data-slot="sankey-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {legend?.length ? <ChartLegend items={legend} marker="square" /> : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Поток',
          columns: ['Объём', 'Доля от источника'],
          rows: layout.links.map((item) => ({ header: `${name(item.source)} → ${name(item.target)}`, cells: [formatValue(item.value), sourceShare(item)] })),
        }}
        {...plot}
      >
        <svg
          aria-hidden
          width={width}
          height={height}
          className="block overflow-visible"
          onPointerLeave={() => {
            setActive(null);
            setLink(null);
          }}
        >
          <g transform={band ? `translate(0 ${band})` : undefined}>
          <g className="transition-[clip-path] duration-(--duration-deliberate) ease-out [clip-path:inset(-2px_-2px_-2px_-2px)] starting:[clip-path:inset(-2px_100%_-2px_-2px)]">
            {ordered.map((item) => (
              <path
                key={item.index}
                data-slot="sankey-link"
                data-highlight={item.target === highlight || undefined}
                d={item.path}
                fill={item.target === highlight ? 'var(--color-seq-2)' : 'var(--color-fill-3)'}
                opacity={lit(item) ? 1 : 0.35}
                className={DIM}
                onPointerEnter={() => setLink(item.index)}
                onPointerLeave={() => setLink(null)}
              />
            ))}
          </g>
          <g className="transition-opacity duration-(--duration-slow) starting:opacity-0">
            {layout.nodes.map((node) => {
              const end = node.column === lastColumn && lastColumn > 0;
              const nameY = clamp((node.y0 + node.y1) / 2 - 2, 13, plotH - 17);
              const x = round(end ? node.x1 + 10 : node.x0 - 8);
              const middle = middleLabels.get(node.id);
              return (
                <g key={node.id}>
                  <rect
                    data-slot="sankey-node"
                    x={round(node.x0)}
                    y={round(node.y0)}
                    width={round(node.x1 - node.x0)}
                    height={round(Math.max(1, node.y1 - node.y0))}
                    fill={color(node)}
                    onPointerEnter={() => setActive(steps.indexOf(node))}
                  />
                  {middle ? (
                    middle.placement === 'hidden' ? null : (
                      <g data-slot="sankey-label" data-placement={middle.placement} data-box={boxAttr(middle.box)}>
                        <text x={round(middle.x)} y={round(middle.nameY)} textAnchor="middle" className="fill-fg-1 text-label-sm font-semibold">
                          {middle.name}
                        </text>
                        {middle.valueY !== undefined ? (
                          <text x={round(middle.x)} y={round(middle.valueY)} textAnchor="middle" className="fill-fg-2 text-caption tabular-nums">
                            {valueText(node)}
                          </text>
                        ) : null}
                      </g>
                    )
                  ) : (
                    <g data-slot="sankey-label" data-placement={end ? 'right' : 'left'}>
                      <text x={x} y={round(nameY)} textAnchor={end ? 'start' : 'end'} className="fill-fg-1 text-label-sm font-semibold">
                        {node.label}
                      </text>
                      <text x={x} y={round(nameY + 16)} textAnchor={end ? 'start' : 'end'} className="fill-fg-2 text-caption tabular-nums">
                        {valueText(node)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
          </g>
        </svg>
        {activeLink ? (
          <ChartTooltip
            x={((byId.get(activeLink.source)?.x1 ?? 0) + (byId.get(activeLink.target)?.x0 ?? 0)) / 2}
            y={band + (activeLink.y0 + activeLink.y1) / 2 + 12}
            width={width}
            title={`${name(activeLink.source)} → ${name(activeLink.target)}`}
            rows={[
              { name: 'Объём', value: formatValue(activeLink.value) },
              { name: 'Доля от источника', value: sourceShare(activeLink) },
            ]}
          />
        ) : activeNode ? (
          <ChartTooltip x={activeNode.x1} y={band + activeNode.y0} width={width} title={activeNode.label} rows={flowRows(activeNode)} total={valueText(activeNode)} />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Chord ---------- */

export interface ChordGroup {
  id: string;
  label?: string;
  /** Default: the palette in order. */
  color?: string;
}

export interface ChordFlow {
  source: string;
  target: string;
  value: number;
}

export interface ChordArc {
  /** Radians, 0 at 12 o'clock, clockwise. */
  start: number;
  end: number;
}

export interface ChordGroupLayout extends ChordArc {
  id: string;
  label: string;
  index: number;
  /** Everything in and out: the arc length. */
  value: number;
  incoming: number;
  outgoing: number;
}

export interface ChordRibbonLayout {
  source: string;
  target: string;
  value: number;
  sourceArc: ChordArc;
  targetArc: ChordArc;
}

/**
 * Directed chord: a group's arc ∝ everything that leaves and enters it, a ribbon is as wide as its flow at both ends.
 * Inside a group partners go counter-clockwise from the neighbour before it, out then in, so ribbons do not cross at the arc.
 */
export function chordLayout(groups: readonly ChordGroup[], flows: readonly ChordFlow[], padAngle = (4 * Math.PI) / 180) {
  const n = groups.length;
  const ids = new Map(groups.map((group, i) => [group.id, i]));
  const matrix = groups.map(() => new Array<number>(n).fill(0));
  for (const flow of flows) {
    const s = ids.get(flow.source);
    const t = ids.get(flow.target);
    const row = s === undefined ? undefined : matrix[s];
    if (row && t !== undefined && s !== t && flow.value > 0) row[t] = (row[t] ?? 0) + flow.value;
  }
  const at = (s: number, t: number) => matrix[s]?.[t] ?? 0;
  const outgoing = groups.map((_, i) => sum(matrix[i] ?? []));
  const incoming = groups.map((_, i) => sum(matrix.map((row) => row[i] ?? 0)));
  const total = sum(outgoing) + sum(incoming);
  const k = total > 0 ? Math.max(0, 2 * Math.PI - n * padAngle) / total : 0;

  const sourceArc = new Map<string, ChordArc>();
  const targetArc = new Map<string, ChordArc>();
  let cursor = 0;
  const laid: ChordGroupLayout[] = groups.map((group, i) => {
    const start = cursor;
    for (let step = 1; step < n; step += 1) {
      const j = (i - step + n) % n;
      for (const [key, width, arcs] of [
        [`${i}>${j}`, at(i, j), sourceArc],
        [`${j}>${i}`, at(j, i), targetArc],
      ] as const) {
        if (width > 0) arcs.set(key, { start: cursor, end: cursor + width * k });
        cursor += width * k;
      }
    }
    const end = cursor;
    cursor += padAngle;
    return { id: group.id, label: group.label ?? group.id, index: i, value: (outgoing[i] ?? 0) + (incoming[i] ?? 0), incoming: incoming[i] ?? 0, outgoing: outgoing[i] ?? 0, start, end };
  });

  const ribbons: ChordRibbonLayout[] = [];
  groups.forEach((source, s) =>
    groups.forEach((target, t) => {
      const from = sourceArc.get(`${s}>${t}`);
      const to = targetArc.get(`${s}>${t}`);
      if (from && to) ribbons.push({ source: source.id, target: target.id, value: at(s, t), sourceArc: from, targetArc: to });
    }),
  );
  return { groups: laid, ribbons };
}

/** Ribbon between two arcs of the inner radius, both sides bent through the centre. */
function ribbonPath(cx: number, cy: number, r: number, from: ChordArc, to: ChordArc): string {
  const p = (angle: number) => {
    const point = polar(cx, cy, r, angle);
    return `${round(point.x)} ${round(point.y)}`;
  };
  const arc = ({ start, end }: ChordArc) => `A${r} ${r} 0 ${end - start > Math.PI ? 1 : 0} 1 ${p(end)}`;
  const centre = `${round(cx)} ${round(cy)}`;
  return `M${p(from.start)}${arc(from)}Q${centre} ${p(to.start)}${arc(to)}Q${centre} ${p(from.start)}Z`;
}

export interface ChordChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  groups: readonly ChordGroup[];
  flows: readonly ChordFlow[];
  /** Group id whose outgoing flows take its colour on top; hover and ← → focus a group the same way. */
  highlight?: string;
  /** Static legend above the plot: «Из «Бизнеса» · Остальные». */
  legend?: readonly FlowLegendItem[];
  formatValue?: (value: number) => string;
}

const CHORD_PAD = (4 * Math.PI) / 180;

/** Ring 12 of groups with 4° gaps and neutral fill-3 ribbons; the focused group's flows take its colour on top. Up to 6–7 groups read. */
export function ChordChart({ groups, flows, highlight, legend, formatValue = formatNumber, className, 'aria-label': label, ...props }: ChordChartProps) {
  const [ref, width] = useWidth(604);
  const [ribbon, setRibbon] = useState<number | null>(null);
  const layout = useMemo(() => chordLayout(groups, flows, CHORD_PAD), [groups, flows]);
  const caption = (group: ChordGroupLayout) => `${group.label} · ${formatValue(group.value)}`;
  const labelRoom = 16 + Math.max(0, ...layout.groups.map((group) => textWidth(caption(group), 12, 600)));
  const outer = clamp((width - 2 * labelRoom) / 2, 60, 130);
  const inner = outer - 12;
  const cx = width / 2;
  const cy = outer + 20;
  const nameOf = (id: string) => layout.groups.find((group) => group.id === id)?.label ?? id;
  const describe = (i: number) => {
    const group = layout.groups[i];
    return group ? `${group.label}: ушло ${formatValue(group.outgoing)}, пришло ${formatValue(group.incoming)}` : '';
  };
  const { active, setActive, plot } = useStepper(layout.groups.length, describe);
  const focused = active === null ? highlight : layout.groups[active]?.id;
  const groupColor = (i: number) => seriesColor(i, groups[i]?.color);
  const colorOf = (id: string) => groupColor(layout.groups.findIndex((group) => group.id === id));
  const hovered = ribbon === null ? undefined : layout.ribbons[ribbon];
  const lit = (item: ChordRibbonLayout) => item === hovered || item.source === focused;
  const ordered = layout.ribbons.map((item, index) => ({ item, index })).sort((a, b) => Number(lit(a.item)) - Number(lit(b.item)));
  const current = active === null ? undefined : layout.groups[active];
  const anchor = (group: ChordGroupLayout) => polar(cx, cy, outer + 10, (group.start + group.end) / 2);

  return (
    <div data-slot="chord-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {legend?.length ? <ChartLegend items={legend} marker="square" /> : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Поток',
          columns: ['Объём'],
          rows: layout.ribbons.map((item) => ({ header: `${nameOf(item.source)} → ${nameOf(item.target)}`, cells: [formatValue(item.value)] })),
        }}
        {...plot}
      >
        <svg
          aria-hidden
          width={width}
          height={2 * outer + 40}
          className="block overflow-visible"
          onPointerLeave={() => {
            setActive(null);
            setRibbon(null);
          }}
        >
          <g style={{ transitionDelay: '150ms' }} className="transition-opacity duration-(--duration-deliberate) ease-out starting:opacity-0">
            {ordered.map(({ item, index }) => (
              <path
                key={`${item.source}>${item.target}`}
                data-slot="chord-ribbon"
                data-highlight={lit(item) || undefined}
                d={ribbonPath(cx, cy, inner, item.sourceArc, item.targetArc)}
                fill={lit(item) ? colorOf(item.source) : 'var(--color-fill-3)'}
                stroke="var(--color-surface-1)"
                className="transition-[fill] duration-(--duration-quick)"
                onPointerEnter={() => setRibbon(index)}
                onPointerLeave={() => setRibbon(null)}
              />
            ))}
          </g>
          <g className="transition-opacity duration-(--duration-slow) starting:opacity-0">
            {layout.groups.map((group, i) => {
              const point = anchor(group);
              return (
                <g key={group.id} onPointerEnter={() => setActive(i)}>
                  <path data-slot="chord-group" d={arcPath(cx, cy, inner, outer, group.start, group.end)} fill={groupColor(i)} />
                  <text
                    x={round(point.x)}
                    y={round(point.y)}
                    textAnchor={Math.sin((group.start + group.end) / 2) >= 0 ? 'start' : 'end'}
                    dominantBaseline="middle"
                    className="fill-fg-1 text-caption font-semibold tabular-nums"
                  >
                    {caption(group)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        {hovered ? (
          <ChartTooltip
            x={cx}
            y={cy}
            width={width}
            title={`${nameOf(hovered.source)} → ${nameOf(hovered.target)}`}
            rows={[{ name: 'Объём', value: formatValue(hovered.value), color: colorOf(hovered.source) }]}
          />
        ) : current ? (
          <ChartTooltip
            x={anchor(current).x}
            y={anchor(current).y + 12}
            width={width}
            title={current.label}
            rows={[
              ...layout.ribbons
                .filter((item) => item.source === current.id)
                .sort((a, b) => b.value - a.value)
                .map((item) => ({ name: `→ ${nameOf(item.target)}`, value: formatValue(item.value) })),
              { name: 'Пришло', value: formatValue(current.incoming) },
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Network ---------- */

export interface NetworkNode {
  id: string;
  label?: string;
  /** Colour and legend entry; nodes of a hidden group disappear with their links. */
  group?: string;
  /** Position from a mock-up, 0…1 of the plot; nodes with both stay put. */
  x?: number;
  y?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  /** How often the pair occurs; heavier links pull closer and draw thicker. */
  value?: number;
}

export interface NetworkLayoutOptions {
  seed?: number;
  iterations?: number;
}

/** Small seeded PRNG: the same graph always lands the same way. */
function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Force-directed layout (Fruchterman–Reingold) in the unit square, computed once and never animated:
 * seeded start on a sunflower spiral, a fixed number of iterations, linear cooling, gravity to the centre, then fit to 0…1.
 */
export function networkLayout(
  nodes: readonly NetworkNode[],
  links: readonly NetworkLink[],
  { seed = 1, iterations = 300 }: NetworkLayoutOptions = {},
): Map<string, Point> {
  const n = nodes.length;
  const ids = new Map(nodes.map((node, i) => [node.id, i]));
  const springs = links.flatMap((link) => {
    const s = ids.get(link.source);
    const t = ids.get(link.target);
    return s === undefined || t === undefined || s === t ? [] : [{ s, t, w: link.value ?? 1 }];
  });
  const heaviest = Math.max(1e-9, ...springs.map((spring) => spring.w));
  const random = mulberry32(seed);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const points = nodes.map((node, i) => {
    const radius = 0.35 * Math.sqrt((i + 0.5) / Math.max(1, n));
    return {
      x: node.x ?? 0.5 + radius * Math.cos(i * golden) + (random() - 0.5) * 0.02,
      y: node.y ?? 0.5 + radius * Math.sin(i * golden) + (random() - 0.5) * 0.02,
      dx: 0,
      dy: 0,
      fixed: node.x !== undefined && node.y !== undefined,
    };
  });
  const k = Math.sqrt(1 / Math.max(1, n));

  for (let step = 0; step < iterations; step += 1) {
    const temperature = 0.1 * (1 - step / iterations);
    for (const p of points) {
      p.dx = (0.5 - p.x) * 0.6;
      p.dy = (0.5 - p.y) * 0.6;
    }
    points.forEach((a, i) => {
      for (const b of points.slice(i + 1)) {
        const ex = a.x - b.x;
        const ey = a.y - b.y;
        const d = Math.max(1e-3, Math.hypot(ex, ey));
        const force = (k * k) / (d * d);
        a.dx += ex * force;
        a.dy += ey * force;
        b.dx -= ex * force;
        b.dy -= ey * force;
      }
    });
    for (const spring of springs) {
      const a = points[spring.s];
      const b = points[spring.t];
      if (!a || !b) continue;
      const ex = a.x - b.x;
      const ey = a.y - b.y;
      const force = (Math.hypot(ex, ey) / k) * (0.5 + spring.w / heaviest);
      a.dx -= ex * force;
      a.dy -= ey * force;
      b.dx += ex * force;
      b.dy += ey * force;
    }
    for (const p of points) {
      const length = Math.hypot(p.dx, p.dy);
      if (p.fixed || length === 0) continue;
      const move = Math.min(length, temperature) / length;
      p.x += p.dx * move;
      p.y += p.dy * move;
    }
  }

  const result = new Map<string, Point>();
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const fit = points.every((p) => !p.fixed);
  nodes.forEach((node, i) => {
    const p = points[i];
    if (!p) return;
    result.set(
      node.id,
      fit
        ? { x: maxX > minX ? (p.x - minX) / (maxX - minX) : 0.5, y: maxY > minY ? (p.y - minY) / (maxY - minY) : 0.5 }
        : { x: clamp(p.x, 0, 1), y: clamp(p.y, 0, 1) },
    );
  });
  return result;
}

interface NetworkLabelSpot {
  placement: 'below' | 'above' | 'right' | 'left';
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  box: Box;
}

/** Liang–Barsky: does the segment touch the box? */
function segmentHits([a, b]: readonly [Point, Point], box: Box): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  for (const [p, q] of [
    [-dx, a.x - box.x0],
    [dx, box.x1 - a.x],
    [-dy, a.y - box.y0],
    [dy, box.y1 - a.y],
  ] as const) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return false;
    }
  }
  return true;
}

/**
 * Labels below the node by default, else above, right or left: never over another node, another label or the plot edge,
 * and off the links when a spot allows. Hubs choose first. A label with no spot is left to the tooltip.
 */
function placeNetworkLabels(
  nodes: readonly { id: string; text: string; hub: boolean; r: number; x: number; y: number }[],
  segments: readonly (readonly [Point, Point])[],
  width: number,
  height: number,
) {
  const placed: Box[] = [];
  const result = new Map<string, NetworkLabelSpot>();
  const hitsNode = (box: Box, self: string) =>
    nodes.some((node) => {
      if (node.id === self) return false;
      const dx = node.x - clamp(node.x, box.x0, box.x1);
      const dy = node.y - clamp(node.y, box.y0, box.y1);
      return Math.hypot(dx, dy) < node.r + 1;
    });
  for (const node of [...nodes].sort((a, b) => Number(b.hub) - Number(a.hub) || b.r - a.r)) {
    const w = textWidth(node.text, node.hub ? 12 : 11, node.hub ? 600 : 400);
    const { x, y, r } = node;
    const spots: NetworkLabelSpot[] = [
      { placement: 'below', x, y: y + r + 13, anchor: 'middle', box: { x0: x - w / 2, y0: y + r + 2, x1: x + w / 2, y1: y + r + 16 } },
      { placement: 'above', x, y: y - r - 5, anchor: 'middle', box: { x0: x - w / 2, y0: y - r - 17, x1: x + w / 2, y1: y - r - 2 } },
      { placement: 'right', x: x + r + 4, y: y + 4, anchor: 'start', box: { x0: x + r + 3, y0: y - 7, x1: x + r + 5 + w, y1: y + 7 } },
      { placement: 'left', x: x - r - 4, y: y + 4, anchor: 'end', box: { x0: x - r - 5 - w, y0: y - 7, x1: x - r - 3, y1: y + 7 } },
    ];
    const allowed = spots.filter(
      ({ box }) => box.x0 >= 0 && box.x1 <= width && box.y0 >= 0 && box.y1 <= height && !hitsNode(box, node.id) && !placed.some((other) => overlaps(box, other)),
    );
    const spot = allowed.find(({ box }) => !segments.some((segment) => segmentHits(segment, box))) ?? allowed[0];
    if (!spot) continue;
    placed.push(spot.box);
    result.set(node.id, spot);
  }
  return result;
}

const linkCount = (count: number) => {
  const tens = count % 100;
  if (count % 10 === 1 && tens !== 11) return `${count} связь`;
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(tens)) return `${count} связи`;
  return `${count} связей`;
};

export interface NetworkChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  nodes: readonly NetworkNode[];
  links: readonly NetworkLink[];
  /** Group order for colours and the legend (default: as they first appear). */
  groups?: readonly string[];
  /** Plot height in px. */
  height?: number;
  /** Layout seed; change it if a particular graph lands awkwardly. */
  seed?: number;
  formatValue?: (value: number) => string;
}

/** Force layout, linked nodes closer: radius ∝ √links with a surface ring 2, links border 1–4 under the nodes. Up to ~50 nodes. */
export function NetworkChart({
  nodes,
  links,
  groups,
  height = 300,
  seed = 1,
  formatValue = formatNumber,
  className,
  'aria-label': label,
  ...props
}: NetworkChartProps) {
  const [ref, width] = useWidth(604);
  const [hidden, toggle] = useHiddenSeries();
  const at = useMemo(() => networkLayout(nodes, links, { seed }), [nodes, links, seed]);
  const groupNames = groups ?? [...new Set(nodes.flatMap((node) => (node.group === undefined ? [] : [node.group])))];
  const groupColor = (group: string | undefined) => seriesColor(group === undefined ? 0 : Math.max(0, groupNames.indexOf(group)));
  const shown = nodes.filter((node) => node.group === undefined || !hidden.has(node.group));
  const visible = new Set(shown.map((node) => node.id));
  const valid = links.filter((link) => link.source !== link.target);
  const visibleLinks = valid.filter((link) => visible.has(link.source) && visible.has(link.target));
  const touching = (list: readonly NetworkLink[], id: string) => list.filter((link) => link.source === id || link.target === id);
  const maxDegree = Math.max(1, ...nodes.map((node) => touching(valid, node.id).length));
  // sized by all links, so hiding a group does not resize the rest
  const radius = (id: string) => round(Math.max(5, 13 * Math.sqrt(touching(valid, id).length / maxDegree)));
  const radii = nodes.map((node) => radius(node.id));
  const [rMin, rMax] = [Math.min(...radii), Math.max(...radii)];
  const weights = valid.map((link) => link.value ?? 1);
  const [wMin, wMax] = [Math.min(...weights), Math.max(...weights)];
  const strokeWidth = (link: NetworkLink) => round(wMax > wMin ? 1 + (3 * ((link.value ?? 1) - wMin)) / (wMax - wMin) : 2);
  const padX = 44;
  const [top, bottom] = [16, 28];
  const position = (id: string): Point => {
    const p = at.get(id) ?? { x: 0.5, y: 0.5 };
    return { x: round(padX + p.x * Math.max(1, width - 2 * padX)), y: round(top + p.y * Math.max(1, height - top - bottom)) };
  };
  const labelOf = (id: string) => nodes.find((node) => node.id === id)?.label ?? id;
  const partners = (id: string) =>
    touching(visibleLinks, id)
      .map((link) => ({ id: link.source === id ? link.target : link.source, value: link.value ?? 1 }))
      .sort((a, b) => b.value - a.value);
  const describe = (i: number) => {
    const node = shown[i];
    if (!node) return '';
    const list = partners(node.id).map((partner) => `${labelOf(partner.id)} ${formatValue(partner.value)}`);
    return `${labelOf(node.id)}: ${linkCount(list.length)}${list.length > 0 ? ` — ${list.join(', ')}` : ''}`;
  };
  const { active, setActive, plot } = useStepper(shown.length, describe);
  const current = active === null ? undefined : shown[active];
  const touches = (link: NetworkLink) => current !== undefined && (link.source === current.id || link.target === current.id);
  const near = new Set(current ? [current.id, ...partners(current.id).map((partner) => partner.id)] : []);
  const hubOf = (id: string) => rMax > rMin && radius(id) >= (rMin + rMax) / 2;
  const labels = placeNetworkLabels(
    shown.map((node) => ({ id: node.id, text: labelOf(node.id), hub: hubOf(node.id), r: radius(node.id), ...position(node.id) })),
    visibleLinks.map((link) => [position(link.source), position(link.target)] as const),
    width,
    height,
  );
  const ordered = [...visibleLinks].sort((a, b) => (a.value ?? 1) - (b.value ?? 1));
  // below the node in the upper half, above it in the lower half; ~22 px a row, 36 for the title and padding
  const tooltipY = (node: NetworkNode) => {
    const p = position(node.id);
    const r = radius(node.id);
    const rows = partners(node.id).length + (node.group ? 1 : 0);
    return p.y < height / 2 ? p.y + r + 20 : Math.max(0, p.y - r - 8 - (36 + rows * 22));
  };

  return (
    <div data-slot="network-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {groupNames.length > 1 ? (
        <ChartLegend items={groupNames.map((name) => ({ name, color: groupColor(name) }))} marker="dot" hidden={hidden} onToggle={toggle} />
      ) : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Узел',
          columns: ['Группа', 'Связей', 'Связан с'],
          rows: shown.map((node) => ({
            header: labelOf(node.id),
            cells: [
              node.group ?? '—',
              String(partners(node.id).length),
              partners(node.id)
                .map((partner) => `${labelOf(partner.id)} (${formatValue(partner.value)})`)
                .join(', ') || '—',
            ],
          })),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={height} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          <g className="transition-opacity duration-(--duration-deliberate) ease-out starting:opacity-0">
            {ordered.map((link) => {
              const a = position(link.source);
              const b = position(link.target);
              return (
                <line
                  key={`${link.source}-${link.target}`}
                  data-slot="network-link"
                  data-active={touches(link) || undefined}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={touches(link) ? 'var(--color-fg-3)' : 'var(--color-border)'}
                  strokeWidth={strokeWidth(link)}
                  strokeLinecap="round"
                  opacity={current && !touches(link) ? 0.3 : 1}
                  className={DIM}
                />
              );
            })}
          </g>
          {shown.map((node, i) => {
            const p = position(node.id);
            const r = radius(node.id);
            const hub = hubOf(node.id);
            const spot = labels.get(node.id);
            return (
              <g key={node.id} opacity={current && !near.has(node.id) ? 0.3 : 1} className={DIM} onPointerEnter={() => setActive(i)}>
                <circle
                  data-slot="network-node"
                  data-id={node.id}
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={groupColor(node.group)}
                  stroke="var(--color-surface-1)"
                  strokeWidth={2}
                  style={{ transitionDelay: `${i * 20}ms` }}
                  className="origin-center transition-[scale] duration-(--duration-slow) ease-standard [transform-box:fill-box] starting:scale-0"
                />
                {spot ? (
                  <text
                    data-slot="network-label"
                    data-placement={spot.placement}
                    data-box={boxAttr(spot.box)}
                    x={round(spot.x)}
                    y={round(spot.y)}
                    textAnchor={spot.anchor}
                    className={hub ? 'fill-fg-1 text-caption font-semibold' : 'fill-fg-2 text-overline'}
                  >
                    {labelOf(node.id)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
        {current ? (
          <ChartTooltip
            x={position(current.id).x + radius(current.id)}
            y={tooltipY(current)}
            width={width}
            title={labelOf(current.id)}
            marker="dot"
            rows={[
              ...(current.group ? [{ name: current.group, value: linkCount(partners(current.id).length), color: groupColor(current.group) }] : []),
              ...partners(current.id).map((partner) => ({ name: labelOf(partner.id), value: formatValue(partner.value) })),
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Arc diagram ---------- */

export interface ArcNode {
  id: string;
  label?: string;
  /** Visits: radius ∝ √value (default: the larger of its in and out). */
  value?: number;
}

export interface ArcLink {
  source: string;
  target: string;
  value: number;
}

export interface ArcDiagramChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  /** Nodes on one axis in the order of the path. */
  nodes: readonly ArcNode[];
  /** A link to a later node is a step forward (above, chart-1), to an earlier one a return (below, chart-2). */
  links: readonly ArcLink[];
  formatValue?: (value: number) => string;
}

const ARC_UP = 150;
const ARC_DOWN = 78;
const ARC_AXIS = ARC_UP + 24;
const ARC_DIRECTIONS = [
  { name: 'Вперёд', color: seriesColor(0) },
  { name: 'Назад', color: seriesColor(1) },
] as const;

/** Nodes on one axis, radius ∝ √visits; arcs 1–10 by volume with big ones at the bottom; direction is side and colour, not colour alone. */
export function ArcDiagramChart({ nodes, links, formatValue = formatAxisValue, className, 'aria-label': label, ...props }: ArcDiagramChartProps) {
  const [ref, width] = useWidth(1272);
  const [hidden, toggle] = useHiddenSeries();
  const [arc, setArc] = useState<number | null>(null);
  const n = nodes.length;
  const index = new Map(nodes.map((node, i) => [node.id, i]));
  const pad = clamp(width / 21, 28, 60);
  const step = n > 1 ? Math.max(1, width - 2 * pad) / (n - 1) : 0;
  const x = (i: number) => (n > 1 ? pad + i * step : width / 2);
  const all = links.flatMap((link, i) => {
    const s = index.get(link.source);
    const t = index.get(link.target);
    return s === undefined || t === undefined || s === t || !(link.value > 0) ? [] : [{ ...link, i, s, t, forward: t > s }];
  });
  type Arc = (typeof all)[number];
  const shown = all.filter((link) => !hidden.has(link.forward ? 'Вперёд' : 'Назад')).sort((a, b) => b.value - a.value);
  const maxLink = Math.max(1e-9, ...all.map((link) => link.value));
  const values = nodes.map(
    (node) =>
      node.value ??
      Math.max(sum(all.filter((link) => link.target === node.id).map((link) => link.value)), sum(all.filter((link) => link.source === node.id).map((link) => link.value))),
  );
  const maxValue = Math.max(1e-9, ...values);
  const radius = (i: number) => round(Math.max(3, 13 * Math.sqrt((values[i] ?? 0) / maxValue)));
  // ellipse heights grow with the span; returns go below, flatter, in the smaller room under the axis
  const geometry = (link: Arc) => {
    const [xs, xt] = [x(link.s), x(link.t)];
    const f = n > 1 ? Math.abs(link.t - link.s) / (n - 1) : 0;
    const ry = round(link.forward ? 18 + (ARC_UP - 18) * f : 12 + (ARC_DOWN - 12) * f);
    const y0 = link.forward ? ARC_AXIS - 14 : ARC_AXIS + 14;
    return { d: `M${round(xs)} ${y0}A${round(Math.abs(xt - xs) / 2)} ${ry} 0 0 1 ${round(xt)} ${y0}`, apex: link.forward ? y0 - ry : y0 + ry, mid: round((xs + xt) / 2), ry };
  };
  const strokeWidth = (value: number) => round(1 + (9 * value) / maxLink);
  const names = nodes.map((node) => node.label ?? node.id);
  const rotated = n > 1 && step < Math.max(...names.map((name) => textWidth(name, 12, 600) + 4));
  const labelY = ARC_AXIS + ARC_DOWN + 40;
  const svgHeight = rotated ? labelY + Math.max(0, ...names.map((name) => textWidth(name, 12, 600))) * 0.72 - 6 : labelY + 22;
  const topForward = shown.find((link) => link.forward);
  const topBack = shown.find((link) => !link.forward);
  const nameOf = (id: string) => names[index.get(id) ?? -1] ?? id;
  const flowRows = (id: string): ChartTooltipRow[] => [
    ...shown.filter((link) => link.source === id).map((link) => ({ name: `→ ${nameOf(link.target)}`, value: formatValue(link.value) })),
    ...shown.filter((link) => link.target === id).map((link) => ({ name: `← ${nameOf(link.source)}`, value: formatValue(link.value) })),
  ];
  const describe = (i: number) => {
    const node = nodes[i];
    if (!node) return '';
    const rows = flowRows(node.id);
    return `${nameOf(node.id)}: ${formatValue(values[i] ?? 0)}${rows.length > 0 ? `; ${rows.map((row) => `${row.name} ${row.value}`).join(', ')}` : ''}`;
  };
  const { active, setActive, plot } = useStepper(n, describe);
  const currentId = active === null ? undefined : nodes[active]?.id;
  const hovered = arc === null ? undefined : shown.find((link) => link.i === arc);
  const lit = (link: Arc) => (hovered ? link === hovered : currentId ? link.source === currentId || link.target === currentId : true);
  const linked = (id: string) => currentId === undefined || id === currentId || shown.some((link) => lit(link) && (link.source === id || link.target === id));
  const forwardLabelY = (link: Arc) => {
    const { apex, ry } = geometry(link);
    return ry >= 30 ? apex + 22 : apex - strokeWidth(link.value) / 2 - 6;
  };

  return (
    <div data-slot="arc-diagram-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      <ChartLegend items={ARC_DIRECTIONS} marker="line" hidden={hidden} onToggle={toggle} />
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Переход',
          columns: ['Направление', 'Объём'],
          rows: all.map((link) => ({ header: `${nameOf(link.source)} → ${nameOf(link.target)}`, cells: [link.forward ? 'Вперёд' : 'Назад', formatValue(link.value)] })),
        }}
        {...plot}
      >
        <svg
          aria-hidden
          width={width}
          height={round(svgHeight)}
          className="block overflow-visible"
          onPointerLeave={() => {
            setActive(null);
            setArc(null);
          }}
        >
          <g className="transition-[clip-path] duration-(--duration-deliberate) ease-out [clip-path:inset(-8px_-8px_-8px_-8px)] starting:[clip-path:inset(-8px_100%_-8px_-8px)]">
            {shown.map((link) => {
              const { d, apex } = geometry(link);
              return (
                <path
                  key={link.i}
                  data-slot="arc-link"
                  data-direction={link.forward ? 'forward' : 'back'}
                  data-y={apex}
                  d={d}
                  fill="none"
                  stroke={ARC_DIRECTIONS[link.forward ? 0 : 1].color}
                  strokeWidth={strokeWidth(link.value)}
                  opacity={lit(link) ? 1 : 0.25}
                  className={DIM}
                  onPointerEnter={() => setArc(link.i)}
                  onPointerLeave={() => setArc(null)}
                />
              );
            })}
          </g>
          {topForward ? (
            <text x={geometry(topForward).mid} y={round(forwardLabelY(topForward))} textAnchor="middle" className="fill-fg-1 text-caption font-semibold tabular-nums">
              {formatValue(topForward.value)}
            </text>
          ) : null}
          {topBack ? (
            <text x={geometry(topBack).mid} y={round(geometry(topBack).apex + 15)} textAnchor="middle" className="fill-fg-1 text-caption font-semibold tabular-nums">
              {`${formatValue(topBack.value)} назад`}
            </text>
          ) : null}
          <line data-slot="arc-axis" x1={round(x(0) - 20)} x2={round(x(n - 1) + 20)} y1={ARC_AXIS + 0.5} y2={ARC_AXIS + 0.5} stroke="var(--color-separator)" />
          <g className="transition-opacity duration-(--duration-slow) starting:opacity-0">
            {nodes.map((node, i) => {
              const cx = round(x(i));
              return (
                <g key={node.id} onPointerEnter={() => setActive(i)}>
                  <circle cx={cx} cy={ARC_AXIS} r={Math.max(radius(i), 12)} fill="transparent" />
                  <circle
                    data-slot="arc-node"
                    cx={cx}
                    cy={ARC_AXIS}
                    r={radius(i)}
                    fill="var(--color-fg-1)"
                    stroke="var(--color-surface-1)"
                    strokeWidth={2}
                    opacity={linked(node.id) ? 1 : 0.3}
                    className={DIM}
                  />
                  {rotated ? (
                    <text
                      x={cx + 4}
                      y={ARC_AXIS + ARC_DOWN + 26}
                      textAnchor="end"
                      transform={`rotate(-45 ${cx + 4} ${ARC_AXIS + ARC_DOWN + 26})`}
                      className="fill-fg-1 text-caption font-semibold"
                    >
                      {names[i]}
                    </text>
                  ) : (
                    <>
                      <text x={cx} y={labelY} textAnchor="middle" className="fill-fg-1 text-caption font-semibold">
                        {names[i]}
                      </text>
                      <text x={cx} y={labelY + 15} textAnchor="middle" className="fill-fg-3 text-overline tabular-nums">
                        {formatValue(values[i] ?? 0)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        {hovered ? (
          <ChartTooltip
            x={geometry(hovered).mid}
            y={hovered.forward ? Math.max(0, geometry(hovered).apex - 8) : geometry(hovered).apex + 8}
            width={width}
            title={`${nameOf(hovered.source)} → ${nameOf(hovered.target)}`}
            marker="line"
            rows={[{ name: hovered.forward ? 'Вперёд' : 'Назад', value: formatValue(hovered.value), color: ARC_DIRECTIONS[hovered.forward ? 0 : 1].color }]}
          />
        ) : active !== null && currentId ? (
          <ChartTooltip x={x(active) + radius(active)} y={ARC_AXIS + 18} width={width} title={names[active]} rows={flowRows(currentId)} total={formatValue(values[active] ?? 0)} />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Cohort retention ---------- */

export interface CohortRow {
  /** Month of the first purchase: «Май». */
  label: string;
  /** People active in each period; the first is the cohort size (100 %). Shorter rows make the triangle. */
  values: readonly number[];
}

export interface CohortChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  data: readonly CohortRow[];
  /** Column headers (default «Месяц 0», «Месяц 1»…). */
  columns?: readonly string[];
  /** Cohort size and counts (default «1 240 чел»). */
  formatSize?: (value: number) => string;
  /** Share thresholds of seq-2…seq-5; below the first is seq-1. */
  thresholds?: readonly number[];
}

const COHORT_HEADER = 22;
const COHORT_ROW = 34;
/** Midpoints between the classes of the Paper mock-up: 22–26 % seq-1, 27–34 % seq-2, 36–44 % seq-3, 46–51 % seq-4, 100 % seq-5. */
const COHORT_THRESHOLDS = [0.265, 0.35, 0.45, 0.755];
/** Dark text on light cells, the surface colour on the darkest (4,6:1); the dark theme turns the ramp around, so seq-4 flips too. */
const COHORT_TEXT = ['fill-fg-1', 'fill-fg-1', 'fill-fg-1', 'fill-fg-1 font-semibold dark:fill-surface-1', 'fill-surface-1 font-semibold'];

const formatPeople = (value: number) => `${formatNumber(value)} чел`;

/** Retention triangle: rows are first-purchase months, cells are shares of the first column on seq-1…5; empty cells are not drawn. */
export function CohortChart({
  data,
  columns,
  formatSize = formatPeople,
  thresholds = COHORT_THRESHOLDS,
  className,
  'aria-label': label,
  ...props
}: CohortChartProps) {
  const [ref, width] = useWidth(604);
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);
  const [spoken, setSpoken] = useState('');
  const count = Math.max(0, ...data.map((row) => row.values.length));
  const header = (col: number) => columns?.[col] ?? `Месяц ${col}`;
  const labelW = clamp(width * 0.22, 72, 135);
  const cellW = Math.max(28, (width - labelW - (count - 1) * 2) / Math.max(1, count));
  const shareOf = (row: CohortRow, col: number) => share(row.values[col] ?? 0, row.values[0] ?? 0);
  const level = (value: number) => 1 + thresholds.filter((threshold) => value >= threshold).length;
  const cellX = (col: number) => labelW + col * (cellW + 2);
  // narrow cells keep only the last word of the header («Месяц 3» → «3») and a smaller value
  const narrow = cellW < 48;
  const shortHeader = (col: number) => (narrow ? header(col).replace(/^.*\s/, '') : header(col));
  const move = (row: number, col: number) => {
    const cohort = data[row];
    if (!cohort || cohort.values.length === 0) return;
    const next = { row, col: clamp(col, 0, cohort.values.length - 1) };
    setActive(next);
    setSpoken(
      `${cohort.label}, ${header(next.col).toLowerCase()}: ${wholePercent(shareOf(cohort, next.col))}, ${formatSize(cohort.values[next.col] ?? 0)}`,
    );
  };
  // rows without data are skipped by ↑ ↓
  const nearest = (from: number, direction: 1 | -1) => {
    let row = from;
    while (row > 0 && row < data.length - 1 && (data[row]?.values.length ?? 0) === 0) row += direction;
    return clamp(row, 0, data.length - 1);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const row = active?.row ?? 0;
    const col = active?.col ?? 0;
    const keys: Record<string, () => void> = {
      ArrowRight: () => move(row, active ? col + 1 : 0),
      ArrowLeft: () => move(row, active ? col - 1 : 0),
      Home: () => move(row, 0),
      End: () => move(row, (data[row]?.values.length ?? 1) - 1),
      ArrowDown: () => move(nearest(active ? row + 1 : 0, 1), col),
      ArrowUp: () => move(nearest(active ? row - 1 : 0, -1), col),
    };
    const action = keys[event.key];
    if (!action || data.length === 0) return;
    event.preventDefault();
    action();
  };
  const current = active ? data[active.row] : undefined;

  return (
    <div data-slot="cohort-chart" className={cn('flex flex-col', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Когорта',
          columns: ['Размер', ...Array.from({ length: count }, (_, col) => header(col))],
          rows: data.map((row) => ({
            header: row.label,
            cells: [formatSize(row.values[0] ?? 0), ...Array.from({ length: count }, (_, col) => (col < row.values.length ? wholePercent(shareOf(row, col)) : '—'))],
          })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg aria-hidden width={width} height={COHORT_HEADER + data.length * COHORT_ROW} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {Array.from({ length: count }, (_, col) => (
            <text key={col} x={round(cellX(col) + cellW / 2)} y={12} textAnchor="middle" className="fill-fg-3 text-overline">
              {shortHeader(col)}
            </text>
          ))}
          {data.map((row, r) => {
            const y = COHORT_HEADER + r * COHORT_ROW;
            return (
              <g key={r}>
                <text x={0} y={y + 14} className="fill-fg-1 text-caption font-semibold">
                  {row.label}
                </text>
                <text x={0} y={y + 28} className="fill-fg-3 text-overline tabular-nums">
                  {formatSize(row.values[0] ?? 0)}
                </text>
                {row.values.map((_, col) => {
                  const value = shareOf(row, col);
                  const tone = level(value);
                  return (
                    <g
                      key={col}
                      style={{ transitionDelay: `${(r + col) * 30}ms` }}
                      className="transition-opacity duration-(--duration-slow) ease-out starting:opacity-0"
                      onPointerEnter={() => setActive({ row: r, col })}
                    >
                      <rect
                        data-slot="cohort-cell"
                        data-level={tone}
                        data-share={value}
                        x={round(cellX(col))}
                        y={y}
                        width={round(cellW)}
                        height={32}
                        rx={3}
                        fill={SEQUENTIAL_COLORS[tone - 1]}
                      />
                      <text
                        data-slot="cohort-value"
                        data-level={tone}
                        x={round(cellX(col) + cellW / 2)}
                        y={y + 16}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className={cn(narrow ? 'text-overline tabular-nums' : 'text-caption tabular-nums', COHORT_TEXT[tone - 1])}
                      >
                        {wholePercent(value)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
          {active ? (
            <rect
              x={round(cellX(active.col) - 1)}
              y={COHORT_HEADER + active.row * COHORT_ROW - 1}
              width={round(cellW + 2)}
              height={34}
              rx={4}
              fill="none"
              stroke="var(--color-fg-1)"
              strokeWidth={2}
              pointerEvents="none"
            />
          ) : null}
        </svg>
        {active && current ? (
          <ChartTooltip
            x={cellX(active.col) + cellW}
            y={COHORT_HEADER + active.row * COHORT_ROW + 36}
            width={width}
            title={`${current.label} · ${header(active.col)}`}
            rows={[
              { name: 'Людей', value: formatSize(current.values[active.col] ?? 0) },
              { name: 'Доля когорты', value: formatPercent(shareOf(current, active.col)) },
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}
