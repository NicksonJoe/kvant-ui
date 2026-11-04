import { useState, type ComponentProps, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { ChartPlot, ChartTooltip, DIVERGING_COLORS, SEQUENTIAL_COLORS, formatNumber, polar, useWidth, type ChartTooltipRow } from '../lib/chart-kit';
import { cn } from '../lib/cn';
import { Badge, type BadgeTone } from './badge';
import { Sparkline } from './chart';
import { TableBody, TableCell, TableHead, TableRow, tableClasses } from './table';

/* ---------- RAG status: colour + icon + word, never colour alone ---------- */

export type RagStatus = 'green' | 'amber' | 'red';

const RAG_ORDER: readonly RagStatus[] = ['green', 'amber', 'red'];
const RAG_TONE: Record<RagStatus, BadgeTone> = { green: 'success', amber: 'warning', red: 'danger' };
const RAG_FILL: Record<RagStatus, string> = { green: 'var(--color-success)', amber: 'var(--color-warning)', red: 'var(--color-danger)' };
const RAG_ICON: Record<RagStatus, ReactNode> = {
  green: (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.2L5 8.6L9.5 3.6" />
    </svg>
  ),
  amber: (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M6 2.5V7" />
      <circle cx={6} cy={9.5} r={0.6} fill="currentColor" />
    </svg>
  ),
  red: (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M3 3L9 9M9 3L3 9" />
    </svg>
  ),
};

function RagBadge({ status, label }: { status: RagStatus; label: string }) {
  return (
    <Badge tone={RAG_TONE[status]} icon={RAG_ICON[status]} className="font-semibold">
      {label}
    </Badge>
  );
}

/* ---------- Gauge ---------- */

export interface GaugeChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Caption under the value and the meter's name: «NPS за октябрь». */
  label: string;
  value: number;
  min?: number;
  max?: number;
  /** Plan or norm: a tick across the track with «цель …». */
  target?: number;
  /** Value, scale ends and target: «78 %», «+62». */
  formatValue?: (value: number) => string;
  /** lg: track 22 on a radius up to 130; sm: track 12 on radius 64. */
  size?: 'lg' | 'sm';
}

const GAUGE = {
  lg: { radius: 130, stroke: 22, side: 72, value: 'text-display-sm', label: 'text-label-sm font-semibold', valueDy: -14, labelDy: 8, endDy: 27 },
  sm: { radius: 64, stroke: 12, side: 64, value: 'text-heading-md', label: 'text-caption', valueDy: -6, labelDy: 12, endDy: 22 },
} as const;

const share = (value: number, min: number, max: number) => (max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0);
const gaugeAngle = (t: number) => -Math.PI / 2 + t * Math.PI;

/** Half circle: track fill-2, value chart-1 with round caps, target tick fg-1 2 across the track. Only for bounded scales (%, NPS). */
export function GaugeChart({ label, value, min = 0, max = 100, target, formatValue = formatNumber, size = 'lg', className, ...props }: GaugeChartProps) {
  const [ref, width] = useWidth(size === 'lg' ? 360 : 200);
  const [tip, setTip] = useState(false);
  // a large gauge squeezed under radius 90 has no room for its value and caption: draw it small instead
  const g = size === 'lg' && (width - 2 * GAUGE.lg.side) / 2 - GAUGE.lg.stroke / 2 < 90 ? GAUGE.sm : GAUGE[size];
  const r = Math.max(32, Math.min(g.radius, (width - 2 * g.side) / 2 - g.stroke / 2));
  const top = 18;
  const cx = width / 2;
  const cy = top + r + g.stroke / 2;
  const t = share(value, min, max);
  const arc = (to: number) => {
    const a = polar(cx, cy, r, gaugeAngle(0));
    const b = polar(cx, cy, r, gaugeAngle(to));
    return `M${a.x} ${a.y}A${r} ${r} 0 0 1 ${b.x} ${b.y}`;
  };
  const targetText = target === undefined ? undefined : formatValue(target);
  const tick = target === undefined ? null : gaugeAngle(share(target, min, max));
  const inner = tick === null ? null : polar(cx, cy, r - g.stroke / 2 - 4, tick);
  const outer = tick === null ? null : polar(cx, cy, r + g.stroke / 2 + 4, tick);
  const tickLabel = tick === null ? null : polar(cx, cy, r + g.stroke / 2 + 8, tick);
  const lean = tick === null ? 0 : Math.sin(tick);
  const diff = target === undefined ? '' : formatValue(value - target);
  const gap = target !== undefined && value > target && !/^[+−-]/.test(diff) ? `+${diff}` : diff;
  const show = () => setTip(true);
  const hide = () => setTip(false);

  return (
    <div
      ref={ref}
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={targetText ? `${formatValue(value)}, цель ${targetText}` : formatValue(value)}
      tabIndex={0}
      data-slot="gauge-chart"
      data-size={size}
      onFocus={show}
      onBlur={hide}
      onPointerEnter={show}
      onPointerLeave={hide}
      className={cn('relative w-full min-w-0 rounded-md focus-visible:outline-offset-4', className)}
      {...props}
    >
      <svg aria-hidden width={width} height={cy + g.endDy + 6} className="block overflow-visible">
        <path d={arc(1)} fill="none" stroke="var(--color-fill-2)" strokeWidth={g.stroke} strokeLinecap="round" />
        <path
          data-slot="gauge-value"
          data-share={Math.round(t * 1000) / 1000}
          d={arc(t)}
          pathLength={1}
          fill="none"
          stroke="var(--color-chart-1)"
          strokeWidth={g.stroke}
          strokeLinecap="round"
          strokeDasharray="1 1"
          className="transition-[stroke-dashoffset] duration-(--duration-deliberate) ease-out [stroke-dashoffset:0] starting:[stroke-dashoffset:1]"
        />
        {inner && outer && tickLabel ? (
          <g data-slot="gauge-target">
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="var(--color-fg-1)" strokeWidth={2} />
            <text
              x={tickLabel.x}
              y={tickLabel.y}
              textAnchor={lean > 0.15 ? 'start' : lean < -0.15 ? 'end' : 'middle'}
              dominantBaseline={Math.abs(lean) > 0.15 ? 'middle' : 'auto'}
              className="fill-fg-2 text-overline"
            >
              цель {targetText}
            </text>
          </g>
        ) : null}
        <text x={cx} y={cy + g.valueDy} textAnchor="middle" className={cn('fill-fg-1 font-semibold tabular-nums', g.value)}>
          {formatValue(value)}
        </text>
        <text x={cx} y={cy + g.labelDy} textAnchor="middle" className={cn('fill-fg-2', g.label)}>
          {label}
        </text>
        <text x={cx - r} y={cy + g.endDy} textAnchor="middle" className="fill-fg-3 text-overline tabular-nums">
          {formatValue(min)}
        </text>
        <text x={cx + r} y={cy + g.endDy} textAnchor="middle" className="fill-fg-3 text-overline tabular-nums">
          {formatValue(max)}
        </text>
      </svg>
      {tip ? (
        <ChartTooltip
          x={cx + r + g.stroke / 2}
          width={width}
          y={top}
          title={label}
          rows={[
            { name: 'Значение', value: formatValue(value), color: 'var(--color-chart-1)' },
            ...(targetText ? [{ name: 'Цель', value: targetText }, { name: 'Отклонение', value: gap }] : []),
          ]}
        />
      ) : null}
    </div>
  );
}

/* ---------- RAG list ---------- */

export interface RagListItem {
  label: string;
  /** Formatted fact: «18,4 млн ₽». */
  value: string;
  /** What it is measured against: «план 18,0», «не выше 4 %». */
  target?: string;
  owner?: string;
  status: RagStatus;
}

export interface RagListProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Name of the table. */
  'aria-label': string;
  items: readonly RagListItem[];
  /** Status words; default «В норме», «Риск», «Срыв». */
  statusLabels?: Partial<Record<RagStatus, string>>;
  /** Bar of counts per status above the list. */
  summary?: boolean;
}

const RAG_LIST_LABELS: Record<RagStatus, string> = { green: 'В норме', amber: 'Риск', red: 'Срыв' };

/** Status of every KPI against its plan: a summary bar, then rows of status, KPI, fact, target and owner. Narrow: target and owner go under the name. */
export function RagList({ items, statusLabels, summary = true, className, 'aria-label': label, ...props }: RagListProps) {
  const [ref, width] = useWidth(604);
  const compact = width < 520;
  const words = { ...RAG_LIST_LABELS, ...statusLabels };
  const counts = RAG_ORDER.map((status) => ({ status, count: items.filter((item) => item.status === status).length }));

  return (
    <div ref={ref} data-slot="rag-list" className={cn('flex flex-col gap-5', className)} {...props}>
      {summary ? (
        <div data-slot="rag-summary" className="flex flex-col gap-2">
          <div aria-hidden className="flex gap-0.5">
            {counts
              .filter((part) => part.count > 0)
              .map((part) => (
                <span
                  key={part.status}
                  data-slot="rag-summary-segment"
                  className="h-2 basis-0 origin-left rounded-[2px] transition-[scale] duration-(--duration-slow) ease-standard starting:scale-x-0"
                  style={{ flexGrow: part.count, background: RAG_FILL[part.status] }}
                />
              ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {counts.map((part) => (
              <li key={part.status} className="inline-flex items-center gap-1.5 text-caption text-fg-2">
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: RAG_FILL[part.status] }} />
                {`${words[part.status]} · ${part.count}`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <table aria-label={label} className="w-full border-collapse border-t border-separator text-body-xs text-fg-1 [--kv-row-h:44px]">
        <thead className="sr-only">
          <tr>
            <TableHead>Статус</TableHead>
            <TableHead>Показатель</TableHead>
            <TableHead numeric>Факт</TableHead>
            {compact ? null : (
              <>
                <TableHead numeric>Цель</TableHead>
                <TableHead numeric>Владелец</TableHead>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <TableRow key={item.label} className="border-b border-separator">
              <TableCell className="w-px pl-0 whitespace-nowrap">
                <RagBadge status={item.status} label={words[item.status]} />
              </TableCell>
              <TableCell className="font-medium">
                {item.label}
                {compact && (item.target || item.owner) ? (
                  <span className="block text-caption font-normal text-fg-3">{[item.target, item.owner].filter(Boolean).join(' · ')}</span>
                ) : null}
              </TableCell>
              <TableCell numeric className={cn('font-semibold whitespace-nowrap', compact && 'pr-0')}>
                {item.value}
              </TableCell>
              {compact ? null : (
                <>
                  <TableCell numeric className="text-caption whitespace-nowrap text-fg-3">
                    {item.target}
                  </TableCell>
                  <TableCell numeric className="pr-0 text-caption whitespace-nowrap text-fg-2">
                    {item.owner}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Heat table ---------- */

export interface HeatTableRow {
  label: string;
  /** Second line under the label: «1 240 чел». */
  caption?: string;
  /** One per column; null leaves the cell empty (cohort triangle). */
  values: readonly (number | null)[];
}

export interface HeatTableProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  columns: readonly string[];
  rows: readonly HeatTableRow[];
  /** Header of the row labels in the screen-reader table: «Когорта». */
  rowHeader?: string;
  formatValue?: (value: number) => string;
  /** seq-1…5 for magnitude, div-neg-2…pos-2 around `midpoint` for deviation. */
  scale?: 'sequential' | 'diverging';
  /** Four ascending band edges: a value goes to the band of the last edge ≤ it. Default: five equal bands. */
  thresholds?: readonly number[];
  /** Centre of the diverging scale. */
  midpoint?: number;
  /** Title of the band legend under the table; without it there is no legend. */
  legend?: string;
  /** Extra column without fill, semibold: mean or sum of the row. */
  summary?: 'mean' | 'sum';
  summaryLabel?: string;
  formatSummary?: (value: number) => string;
}

// text on the darkest steps of a ramp flips to surface-1: 4.6:1 and better in both themes
const SEQ_TEXT = ['text-fg-1', 'text-fg-1', 'text-fg-1', 'text-fg-1 dark:text-surface-1', 'text-surface-1 font-semibold'];
const DIV_TEXT = ['text-fg-1 dark:text-surface-1', 'text-fg-1', 'text-fg-1', 'text-fg-1', 'text-fg-1 dark:text-surface-1'];
const HEAD = 22;
const CELL = 32;

const isValue = (value: number | null | undefined): value is number => typeof value === 'number';

function autoEdges(values: readonly number[], scale: 'sequential' | 'diverging', midpoint: number): number[] {
  if (scale === 'diverging') {
    const extent = Math.max(0, ...values.map((value) => Math.abs(value - midpoint))) || 1;
    return [-0.6, -0.2, 0.2, 0.6].map((k) => midpoint + k * extent);
  }
  const low = Math.min(...values);
  const span = Math.max(...values) - low || 1;
  return [1, 2, 3, 4].map((k) => low + (span * k) / 5);
}

/** «до 85», «85–94», «115+»; whole edges read as whole ranges. */
function legendLabels(edges: readonly number[], format: (value: number) => string): string[] {
  const whole = edges.every(Number.isInteger);
  return [
    `до ${format(edges[0] ?? 0)}`,
    ...edges.slice(0, -1).map((edge, i) => {
      const next = edges[i + 1] ?? edge;
      return `${format(edge)}–${format(whole ? next - 1 : next)}`;
    }),
    `${format(edges[edges.length - 1] ?? 0)}+`,
  ];
}

/** Matrix of numbers tinted by band: the number is always printed, colour only helps to find. Cohorts, plan by manager and month. */
export function HeatTable({
  columns,
  rows,
  rowHeader = 'Строка',
  formatValue = formatNumber,
  scale = 'sequential',
  thresholds,
  midpoint = 0,
  legend,
  summary,
  summaryLabel = summary === 'sum' ? 'Итого' : 'Среднее',
  formatSummary = formatValue,
  className,
  'aria-label': label,
  ...props
}: HeatTableProps) {
  const [ref, width] = useWidth(604);
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);
  const [spoken, setSpoken] = useState('');
  const edges = thresholds ?? autoEdges(rows.flatMap((row) => row.values).filter(isValue), scale, midpoint);
  const palette = scale === 'diverging' ? DIVERGING_COLORS : SEQUENTIAL_COLORS;
  const textOf = scale === 'diverging' ? DIV_TEXT : SEQ_TEXT;
  const bin = (value: number) => edges.filter((edge) => edge <= value).length;
  const reduce = (row: HeatTableRow) => {
    const own = row.values.filter(isValue);
    const sum = own.reduce((total, value) => total + value, 0);
    return summary === 'sum' || own.length === 0 ? sum : sum / own.length;
  };

  const headerW = width < 520 ? 88 : 132;
  const summaryW = summary ? 64 : 0;
  const n = Math.max(1, columns.length);
  const gaps = 2 * (n + (summary ? 1 : 0));
  // cells never get narrower than 44: below that the grid scrolls sideways instead of wrapping «100 %»
  const gridW = Math.max(width, headerW + summaryW + gaps + n * 44);
  const cellW = (gridW - headerW - summaryW - gaps) / n;
  const [scroll, setScroll] = useState(0);

  const at = (row: number, col: number) => rows[row]?.values[col];
  const find = (row: number, from: number, step: 1 | -1) => {
    for (let col = from; col >= 0 && col < columns.length; col += step) if (isValue(at(row, col))) return col;
    return null;
  };
  const nearest = (row: number, col: number) => find(row, col, -1) ?? find(row, col, 1);
  const go = (row: number, col: number | null) => {
    const value = col === null ? undefined : at(row, col);
    if (col === null || !isValue(value)) return;
    setActive({ row, col });
    setSpoken(`${rows[row]?.label ?? ''}, ${columns[col] ?? ''}: ${formatValue(value)}`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = rows.length - 1;
    const row = active?.row ?? 0;
    const col = active?.col ?? 0;
    const below = active ? Math.min(last, row + 1) : 0;
    const above = Math.max(0, row - 1);
    const moves: Record<string, () => void> = {
      ArrowRight: () => go(row, active ? find(row, col + 1, 1) : find(row, 0, 1)),
      ArrowLeft: () => go(row, active ? find(row, col - 1, -1) : find(row, 0, 1)),
      ArrowDown: () => go(below, nearest(below, col)),
      ArrowUp: () => go(above, nearest(above, col)),
      Home: () => go(row, find(row, 0, 1)),
      End: () => go(row, find(row, columns.length - 1, -1)),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    move();
  };

  const activeValue = active ? at(active.row, active.col) : undefined;

  return (
    <div data-slot="heat-table" className={cn('flex flex-col gap-4', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader,
          columns: [...columns, ...(summary ? [summaryLabel] : [])],
          rows: rows.map((row) => ({
            header: row.caption ? `${row.label}, ${row.caption}` : row.label,
            cells: [...row.values.map((value) => (isValue(value) ? formatValue(value) : '—')), ...(summary ? [formatSummary(reduce(row))] : [])],
          })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <div className="overflow-x-auto" onScroll={(event) => setScroll(event.currentTarget.scrollLeft)}>
          <div
            aria-hidden
            className="grid gap-0.5 whitespace-nowrap"
            style={{ minWidth: gridW, gridTemplateColumns: `${headerW}px repeat(${n}, minmax(0, 1fr))${summary ? ` ${summaryW}px` : ''}` }}
            onPointerLeave={() => setActive(null)}
          >
            <span />
            {columns.map((column) => (
              <span key={column} className="truncate text-center text-overline text-fg-3" style={{ height: HEAD }}>
                {column}
              </span>
            ))}
            {summary ? (
              <span className="text-right text-overline text-fg-3" style={{ height: HEAD }}>
                {summaryLabel}
              </span>
            ) : null}
            {rows.map((row, r) => (
              <div key={row.label} className="contents">
                <span className="flex min-w-0 flex-col justify-center pr-2" style={{ height: CELL }}>
                  <span className={cn('truncate text-caption text-fg-1', row.caption ? 'font-semibold' : 'font-medium')}>{row.label}</span>
                  {row.caption ? <span className="truncate text-overline text-fg-3">{row.caption}</span> : null}
                </span>
                {columns.map((column, c) => {
                  const value = row.values[c];
                  if (!isValue(value)) return <span key={column} />;
                  const b = bin(value);
                  return (
                    <span
                      key={column}
                      data-slot="heat-table-cell"
                      data-bin={b}
                      data-active={active?.row === r && active.col === c ? '' : undefined}
                      onPointerEnter={() => go(r, c)}
                      className={cn(
                        'grid min-w-0 place-items-center rounded-[3px] text-caption tabular-nums transition-opacity duration-(--duration-slow) ease-out starting:opacity-0',
                        'data-active:relative data-active:shadow-[0_0_0_2px_var(--color-fg-1)]',
                        textOf[b],
                      )}
                      style={{ height: CELL, background: palette[b], transitionDelay: `${c * 40}ms` }}
                    >
                      {formatValue(value)}
                    </span>
                  );
                })}
                {summary ? (
                  <span data-slot="heat-table-summary" className="self-center text-right text-caption font-semibold text-fg-1 tabular-nums">
                    {formatSummary(reduce(row))}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        {active && isValue(activeValue) ? (
          <ChartTooltip
            x={headerW + (active.col + 1) * (cellW + 2) - scroll}
            width={width}
            y={HEAD + 2 + (active.row + 1) * (CELL + 2)}
            title={`${rows[active.row]?.label ?? ''} · ${columns[active.col] ?? ''}`}
            rows={[{ name: legend ?? 'Значение', value: formatValue(activeValue), color: palette[bin(activeValue)] }]}
          />
        ) : null}
      </ChartPlot>
      {legend ? (
        <div data-slot="heat-table-legend" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-fg-2">
          <span>{legend}</span>
          {legendLabels(edges, formatValue).map((text, i) => (
            <span key={text} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-3 rounded-[3px]" style={{ background: palette[i] }} />
              {text}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Scorecard ---------- */

export interface ScorecardRow {
  label: string;
  /** Under the label: «млн ₽», «% · чем ниже, тем лучше». */
  unit?: string;
  value: number;
  target: number;
  /** Digits after the comma for fact and plan: 1 → «5,0». */
  decimals?: number;
  /** Churn, costs: attainment is plan / fact. */
  lowerIsBetter?: boolean;
  /** Last months, oldest first; the last point is the current month. */
  trend?: readonly number[];
  status: RagStatus;
}

export interface ScorecardProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  rows: readonly ScorecardRow[];
  /** Month names of the trend points for the tooltip. */
  trendLabels?: readonly string[];
  /** Header of the trend column. */
  trendLabel?: string;
  /** Status words; default «В норме», «Внимание», «Риск». */
  statusLabels?: Partial<Record<RagStatus, string>>;
}

const SCORECARD_LABELS: Record<RagStatus, string> = { green: 'В норме', amber: 'Внимание', red: 'Риск' };
const SCALE_TOP = 1.3;

const fixed = (value: number, decimals = 0) => value.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const attainment = (row: ScorecardRow) => {
  const ratio = row.lowerIsBetter ? row.target / row.value : row.value / row.target;
  return Number.isFinite(ratio) ? ratio : 0;
};

/** One row per KPI: fact, plan, attainment on a 0–130 % bar with the plan tick, six-month trend and status. Read top to bottom in half a minute. */
export function Scorecard({ rows, trendLabels, trendLabel = 'Полгода', statusLabels, className, 'aria-label': label, ...props }: ScorecardProps) {
  const [root, width] = useWidth(1272);
  const [tip, setTip] = useState<{ row: number; x: number; y: number } | null>(null);
  const words = { ...SCORECARD_LABELS, ...statusLabels };
  // below 760 the plan moves under the fact and the bar shortens, so a half-width card still fits without scrolling
  const compact = width < 760;
  const narrow = width < 520;
  const barW = width >= 1000 ? 240 : compact ? 96 : 160;

  const point = (index: number) => (event: FocusEvent<HTMLElement> | PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const origin = root.current?.getBoundingClientRect();
    setTip({ row: index, x: box.left - (origin?.left ?? 0), y: box.top - (origin?.top ?? 0) });
  };
  const tipRow = tip ? rows[tip.row] : undefined;
  const tipRows: ChartTooltipRow[] = tipRow?.trend?.map((value, i) => ({ name: trendLabels?.[i] ?? `${i + 1}`, value: fixed(value, tipRow.decimals) })) ?? [];

  return (
    <div ref={root} data-slot="scorecard" className={cn('relative', className)} {...props}>
      <div className="overflow-x-auto">
        <table aria-label={label} className={tableClasses('touch')}>
          <thead>
            <tr className="border-b border-separator">
              <TableHead>Показатель</TableHead>
              <TableHead>Факт</TableHead>
              {compact ? null : <TableHead>План</TableHead>}
              <TableHead>Выполнение</TableHead>
              {narrow ? null : <TableHead>{trendLabel}</TableHead>}
              <TableHead numeric>Статус</TableHead>
            </tr>
          </thead>
          <TableBody>
            {rows.map((row, index) => {
              const ratio = attainment(row);
              const trend = row.trend ?? [];
              return (
                <TableRow key={row.label}>
                  <TableCell>
                    <span className="block font-medium whitespace-nowrap">{row.label}</span>
                    {row.unit ? <span className="block text-caption text-fg-3">{row.unit}</span> : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    <span className="block text-heading-xs font-semibold">{fixed(row.value, row.decimals)}</span>
                    {compact ? <span className="block text-caption text-fg-3">план {fixed(row.target, row.decimals)}</span> : null}
                  </TableCell>
                  {compact ? null : <TableCell className="text-fg-2 tabular-nums">{fixed(row.target, row.decimals)}</TableCell>}
                  <TableCell>
                    <span className="flex items-center gap-2.5">
                      <span aria-hidden className={cn('relative h-2 shrink-0 rounded-full bg-fill-2', narrow && 'hidden')} style={{ width: barW }}>
                        <span
                          data-slot="scorecard-bar"
                          data-attainment={Math.round(ratio * 1000) / 1000}
                          className="absolute inset-y-0 left-0 origin-left rounded-full transition-[scale] duration-(--duration-slow) ease-standard starting:scale-x-0"
                          style={{
                            width: `${Math.round((Math.min(ratio, SCALE_TOP) / SCALE_TOP) * 1000) / 10}%`,
                            background: ratio >= 1 ? 'var(--color-chart-1)' : 'var(--color-seq-3)',
                            transitionDelay: `${index * 40}ms`,
                          }}
                        />
                        <span
                          data-slot="scorecard-plan"
                          className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-[1px] bg-fg-1"
                          style={{ left: `${Math.round(1000 / SCALE_TOP) / 10}%` }}
                        />
                      </span>
                      <span className="text-body-xs font-semibold whitespace-nowrap tabular-nums">{`${Math.round(ratio * 100)} %`}</span>
                    </span>
                  </TableCell>
                  {narrow ? null : (
                    <TableCell>
                      {trend.length > 1 ? (
                        <span
                          role="img"
                          tabIndex={0}
                          aria-label={`${row.label}, ${trendLabel.toLowerCase()}: ${trend
                            .map((value, i) => `${trendLabels?.[i] ? `${trendLabels[i]} ` : ''}${fixed(value, row.decimals)}`)
                            .join(', ')}`}
                          onFocus={point(index)}
                          onBlur={() => setTip(null)}
                          onPointerEnter={point(index)}
                          onPointerLeave={() => setTip(null)}
                          className="block w-[120px] rounded-sm focus-visible:outline-offset-2"
                        >
                          <Sparkline data={trend} color="var(--color-fg-3)" height={28} />
                        </span>
                      ) : null}
                    </TableCell>
                  )}
                  <TableCell numeric>
                    <RagBadge status={row.status} label={words[row.status]} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </table>
      </div>
      {tip && tipRow ? <ChartTooltip x={tip.x} width={width} y={tip.y} title={tipRow.label} marker="line" rows={tipRows} /> : null}
    </div>
  );
}
