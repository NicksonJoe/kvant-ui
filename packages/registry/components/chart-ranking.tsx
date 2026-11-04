import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import {
  CHART_COLORS,
  ChartLegend,
  ChartPlot,
  ChartTooltip,
  formatNumber,
  formatPercent,
  linearScale,
  seriesColor,
  stepIndex,
  useHiddenSeries,
  useWidth,
  type Point,
} from '../lib/chart-kit';
import { cn } from '../lib/cn';
import { Badge } from './badge';
import { Avatar } from './card';
import { TableBody, TableCell, TableHead, TableRow, tableClasses, type TableDensity } from './table';

/* Who is higher: ordered bars, slope, bump, rank strip and a table with bars in its cells. */

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Tooltip top under the anchor, or over it when it would run past the bottom of the plot. */
const tooltipTop = (below: number, above: number, rows: number, plot: number) => {
  const height = 30 + rows * 22;
  return below + height <= plot ? below : Math.max(0, above - height);
};
const signed = (diff: number, format: (value: number) => string) => `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${format(Math.abs(diff))}`;

/** Active item driven by the pointer and by ← → ↑ ↓ Home End, read out through the plot's live region. */
function useStepper(count: number, describe: (index: number) => string) {
  const [raw, setActive] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');
  const active = raw !== null && raw < count ? raw : null;
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key === 'ArrowDown' ? 'ArrowRight' : event.key === 'ArrowUp' ? 'ArrowLeft' : event.key;
    const index = stepIndex(key, active, count);
    if (index === null) return;
    event.preventDefault();
    setActive(index);
    setSpoken(describe(index));
  };
  return { active, setActive, spoken, onKeyDown, onBlur: () => setActive(null) };
}

const reveal =
  'transition-[clip-path] duration-(--duration-deliberate) ease-out [clip-path:inset(-12px_-12px_-12px_-12px)] starting:[clip-path:inset(-12px_100%_-12px_-12px)] motion-reduce:transition-none';
const fadeIn = 'transition-opacity duration-(--duration-slow) ease-out starting:opacity-0 motion-reduce:transition-none';

/* ---------- Ordered bars ---------- */

export interface RankDatum {
  label: string;
  value: number;
}

export interface OrderedBarChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the ranking shows; screen readers also get it as a table. */
  'aria-label': string;
  /** Any order: the chart always sorts from the largest. */
  data: readonly RankDatum[];
  /** Label of the row that stands out: «Вы · Дарья Ким». */
  focus?: string;
  formatValue?: (value: number) => string;
  /** Name of the value in the tooltip and the table: «Выручка». */
  valueLabel?: string;
  /** Colour of the focus bar; the rest are border. */
  color?: string;
}

const ROW = 30;
const VALUE_SPACE = 88;

/** Places from the top: rank fg-3, name, a 16px bar from the shared axis and its value; the focus row takes the accent colour and weight. */
export function OrderedBarChart({
  data,
  focus,
  formatValue = formatNumber,
  valueLabel = 'Значение',
  color = seriesColor(0),
  className,
  'aria-label': label,
  ...props
}: OrderedBarChartProps) {
  const [ref, width] = useWidth(604);
  const rows = [...data].sort((a, b) => b.value - a.value);
  const max = Math.max(0, ...rows.map((row) => row.value));
  const total = rows.reduce((sum, row) => sum + Math.max(0, row.value), 0);
  const labelWidth = Math.round(clamp(width * 0.29, 120, 176));
  const track = Math.max(1, width - labelWidth - VALUE_SPACE);
  const barWidth = (value: number) => (max > 0 ? Math.round((Math.max(0, value) / max) * track * 10) / 10 : 0);
  const step = useStepper(rows.length, (index) => {
    const row = rows[index];
    return row ? `${index + 1} место — ${row.label}: ${formatValue(row.value)}` : '';
  });
  const active = step.active === null ? undefined : rows[step.active];

  return (
    <div data-slot="ordered-bar-chart" className={cn('w-full', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Место',
          columns: ['Название', valueLabel],
          rows: rows.map((row, index) => ({ header: String(index + 1), cells: [row.label, formatValue(row.value)] })),
        }}
        spoken={step.spoken}
        onKeyDown={step.onKeyDown}
        onBlur={step.onBlur}
      >
        <div aria-hidden className="relative" onPointerLeave={() => step.setActive(null)}>
          <span className="absolute inset-y-0 w-px bg-border" style={{ left: labelWidth }} />
          {rows.map((row, index) => {
            const isFocus = row.label === focus;
            const bar = barWidth(row.value);
            return (
              <div
                key={row.label}
                data-slot="ordered-bar-row"
                data-label={row.label}
                data-rank={index + 1}
                data-focus={isFocus || undefined}
                data-active={step.active === index || undefined}
                onPointerEnter={() => step.setActive(index)}
                className="relative flex h-7.5 items-center rounded-sm transition-colors duration-(--duration-micro) data-active:bg-fill-1"
              >
                <span className="w-6 shrink-0 text-caption text-fg-3 tabular-nums">{index + 1}</span>
                <span className={cn('truncate pr-3 text-body-xs', isFocus ? 'font-semibold text-fg-1' : 'text-fg-2')} style={{ width: labelWidth - 24 }}>
                  {row.label}
                </span>
                <span
                  data-slot="ordered-bar"
                  className="absolute top-1.75 h-4 origin-left rounded-r-[4px] transition-[scale] duration-(--duration-slow) ease-standard starting:scale-x-0 motion-reduce:transition-none"
                  style={{ left: labelWidth, width: bar, background: isFocus ? color : 'var(--color-border)', transitionDelay: `${index * 35}ms` }}
                />
                <span
                  className={cn('absolute top-1/2 -translate-y-1/2 text-caption whitespace-nowrap tabular-nums', fadeIn, isFocus ? 'font-semibold text-fg-1' : 'text-fg-2')}
                  style={{ left: labelWidth + bar + 8 }}
                >
                  {formatValue(row.value)}
                </span>
              </div>
            );
          })}
        </div>
        {active && step.active !== null ? (
          <ChartTooltip
            x={labelWidth + barWidth(active.value)}
            width={width}
            y={tooltipTop((step.active + 1) * ROW, step.active * ROW, total > 0 ? 3 : 2, rows.length * ROW)}
            title={active.label}
            rows={[
              { name: 'Место', value: `${step.active + 1} из ${rows.length}` },
              { name: valueLabel, value: formatValue(active.value) },
              ...(total > 0 ? [{ name: 'Доля', value: formatPercent(Math.max(0, active.value) / total) }] : []),
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Slope ---------- */

export interface SlopeDatum {
  label: string;
  /** Value in the first period. */
  from: number;
  /** Value in the second period. */
  to: number;
}

export interface SlopeChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  /** Names of the two axes: «Сентябрь», «Октябрь». */
  periods: readonly [string, string];
  data: readonly SlopeDatum[];
  /** Item(s) in colour, chart-1, chart-2…; the rest are fg-4. */
  focus?: string | readonly string[];
  formatValue?: (value: number) => string;
  /** Plot height in px with the period names. */
  height?: number;
}

/** Spreads label centres at least `gap` apart inside lo…hi, keeping their order. */
function spread(ys: readonly number[], gap: number, lo: number, hi: number): number[] {
  const order = ys.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y);
  let previous = -Infinity;
  for (const item of order) {
    item.y = Math.max(item.y, lo, previous + gap);
    previous = item.y;
  }
  let next = Infinity;
  for (const item of [...order].reverse()) {
    item.y = Math.min(item.y, hi, next - gap);
    next = item.y;
  }
  const out = [...ys];
  for (const item of order) out[item.index] = item.y;
  return out;
}

const SLOPE_TOP = 24;
const LABEL_GAP = 16;

/** Two period axes and a line per item: who overtook whom. Labels «канал значение» on the left, the value on the right, never overlapping. */
export function SlopeChart({ periods, data, focus, formatValue = formatNumber, height = 256, className, 'aria-label': label, ...props }: SlopeChartProps) {
  const [ref, width] = useWidth(604);
  const focused: readonly string[] = typeof focus === 'string' ? [focus] : (focus ?? []);
  // narrow: the right side only holds values, so the left labels get the room
  const narrow = width < 480;
  const rightSpace = narrow ? 64 : Math.round(clamp(width * 0.315, 64, 190));
  const left = Math.round(clamp(narrow ? width - rightSpace - 76 : width * 0.315, 120, 190));
  const right = width - rightSpace;
  const bottom = height - 4;
  const values = data.flatMap((item) => [item.from, item.to]);
  const y = values.length > 0 ? linearScale([Math.min(...values), Math.max(...values)], [bottom - 16, SLOPE_TOP + 24]) : () => bottom;
  const items = data.map((item) => {
    const at = focused.indexOf(item.label);
    return { ...item, focus: at >= 0, color: at >= 0 ? seriesColor(at) : 'var(--color-fg-4)', y1: y(item.from), y2: y(item.to) };
  });
  const starts = spread(
    items.map((item) => item.y1),
    LABEL_GAP,
    SLOPE_TOP + 8,
    bottom,
  );
  const ends = spread(
    items.map((item) => item.y2),
    LABEL_GAP,
    SLOPE_TOP + 8,
    bottom,
  );
  // keyboard order follows the left axis from the top
  const order = [...items].sort((a, b) => b.from - a.from);
  const change = (item: SlopeDatum) => signed(Math.round((item.to - item.from) * 1e6) / 1e6, formatValue);
  const step = useStepper(order.length, (index) => {
    const item = order[index];
    return item ? `${item.label}: ${periods[0]} ${formatValue(item.from)}, ${periods[1]} ${formatValue(item.to)}, изменение ${change(item)}` : '';
  });
  const active = step.active === null ? undefined : order[step.active];
  const drawn = [...items].sort((a, b) => Number(a.focus) - Number(b.focus) || Number(a === active) - Number(b === active));

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const t = clamp((event.clientX - box.left) / Math.max(1, box.width), 0, 1);
    const py = event.clientY - box.top + SLOPE_TOP;
    let best: number | null = null;
    let distance = Infinity;
    order.forEach((item, index) => {
      const gap = Math.abs(item.y1 + t * (item.y2 - item.y1) - py);
      if (gap < distance) {
        distance = gap;
        best = index;
      }
    });
    step.setActive(best);
  };

  return (
    <div data-slot="slope-chart" className={cn('w-full', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Название',
          columns: [periods[0], periods[1], 'Изменение'],
          rows: order.map((item) => ({ header: item.label, cells: [formatValue(item.from), formatValue(item.to), change(item)] })),
        }}
        spoken={step.spoken}
        onKeyDown={step.onKeyDown}
        onBlur={step.onBlur}
      >
        <svg aria-hidden width={width} height={height} className="block overflow-visible">
          {[left, right].map((x, index) => (
            <g key={index}>
              <text x={x} y={14} textAnchor="middle" className="fill-fg-3 text-caption">
                {periods[index]}
              </text>
              <line x1={x + 0.5} x2={x + 0.5} y1={SLOPE_TOP} y2={bottom} stroke="var(--color-separator)" />
            </g>
          ))}
          <g className={reveal}>
            {drawn.map((item) => {
              const isActive = item === active;
              return (
                <g key={item.label} opacity={active && !isActive ? 0.3 : 1} className="transition-opacity duration-(--duration-quick)">
                  <line
                    data-slot="slope-line"
                    data-label={item.label}
                    data-focus={item.focus || undefined}
                    data-active={isActive || undefined}
                    x1={left}
                    y1={item.y1}
                    x2={right}
                    y2={item.y2}
                    stroke={item.color}
                    strokeWidth={isActive ? 3 : 2}
                    strokeLinecap="round"
                  />
                  <circle cx={left} cy={item.y1} r={5} fill={item.color} stroke="var(--color-surface-1)" strokeWidth={2} />
                  <circle cx={right} cy={item.y2} r={5} fill={item.color} stroke="var(--color-surface-1)" strokeWidth={2} />
                </g>
              );
            })}
          </g>
          {items.map((item, index) => {
            const tone = item.focus || item === active ? 'fill-fg-1 font-semibold' : 'fill-fg-2';
            return (
              <g key={item.label} className={cn('text-caption tabular-nums', fadeIn)}>
                <text data-slot="slope-label" data-side="start" x={left - 14} y={(starts[index] ?? item.y1) + 4} textAnchor="end" className={tone}>
                  {`${item.label} ${formatValue(item.from)}`}
                </text>
                <text data-slot="slope-label" data-side="end" x={right + 14} y={(ends[index] ?? item.y2) + 4} className={tone}>
                  {formatValue(item.to)}
                </text>
              </g>
            );
          })}
          <rect
            x={left}
            y={SLOPE_TOP}
            width={Math.max(1, right - left)}
            height={bottom - SLOPE_TOP}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => step.setActive(null)}
          />
        </svg>
        {active ? (
          <ChartTooltip
            x={(left + right) / 2}
            width={width}
            y={Math.max(0, (active.y1 + active.y2) / 2 + 12)}
            title={active.label}
            rows={[
              { name: periods[0], value: formatValue(active.from) },
              { name: periods[1], value: formatValue(active.to) },
              { name: 'Изменение', value: change(active) },
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Bump ---------- */

export interface BumpSeries {
  name: string;
  /** Place in each period, 1 is the best. */
  ranks: readonly number[];
  color?: string;
}

export interface BumpChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  /** Period names under the columns. */
  labels: readonly string[];
  series: readonly BumpSeries[];
  /** Series told in colour, chart-1, chart-2…; the rest are fg-4 underneath. */
  highlight?: readonly string[];
  /** Tooltip titles per period: «Октябрь 2026». */
  tooltipLabels?: readonly string[];
  /** Legend name of the grey series. */
  othersLabel?: string;
  /** Distance between places, px. */
  rowHeight?: number;
  /** Legend above the plot; on when something is highlighted. Clicking hides the series. */
  legend?: boolean;
}

function bumpPath(points: readonly Point[]): string {
  let d = '';
  let previous: Point | undefined;
  for (const point of points) {
    if (!previous) d = `M${point.x} ${point.y}`;
    else {
      const mid = (previous.x + point.x) / 2;
      d += `C${mid} ${previous.y} ${mid} ${point.y} ${point.x} ${point.y}`;
    }
    previous = point;
  }
  return d;
}

/** Places over time on evenly spaced rows: a rank, not a value. Stories in colour, names at the start, place and name at the finish. */
export function BumpChart({
  labels,
  series,
  highlight = [],
  tooltipLabels,
  othersLabel = 'Остальные',
  rowHeight = 40,
  legend,
  className,
  'aria-label': label,
  ...props
}: BumpChartProps) {
  const [ref, width] = useWidth(604);
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const n = labels.length;
  const story = (item: BumpSeries) => `${item.name}: с ${item.ranks[0] ?? '—'} на ${item.ranks[item.ranks.length - 1] ?? '—'}`;
  const lines = series.map((item) => {
    const at = highlight.indexOf(item.name);
    return { ...item, highlighted: at >= 0, color: at >= 0 ? seriesColor(at, item.color) : 'var(--color-fg-4)', key: at >= 0 ? story(item) : othersLabel };
  });
  const shown = lines.filter((item) => !hidden.has(item.key));
  const legendItems = [
    ...highlight.flatMap((name) => lines.filter((item) => item.name === name).map((item) => ({ name: item.key, color: item.color }))),
    ...(lines.some((item) => !item.highlighted) ? [{ name: othersLabel, color: 'var(--color-fg-4)' }] : []),
  ];

  const places = Math.max(1, ...series.flatMap((item) => item.ranks));
  // narrow: start names go, the finish column still names every series
  const narrow = width < 480;
  const leftWidth = narrow ? 12 : Math.round(clamp(width * 0.185, 80, 112));
  const rightWidth = Math.round(clamp(width * 0.2, 96, 120));
  const plotW = Math.max(1, width - leftWidth - rightWidth);
  const x = (i: number) => (n > 1 ? leftWidth + (i * plotW) / (n - 1) : leftWidth + plotW / 2);
  const y = (rank: number) => 14 + (rank - 1) * rowHeight;
  const bottom = y(places);
  const band = Math.min(40, n > 1 ? plotW / (n - 1) : plotW);
  // period labels need ~40px each; count the stride from the end so the finish is always named
  const stride = Math.max(1, Math.ceil(40 / Math.max(1, n > 1 ? plotW / (n - 1) : plotW)));

  const placesAt = (index: number) =>
    shown.map((item) => ({ name: item.name, color: item.color, rank: item.ranks[index] ?? places })).sort((a, b) => a.rank - b.rank);
  const step = useStepper(n, (index) => `${tooltipLabels?.[index] ?? labels[index] ?? ''}: ${placesAt(index).map((item) => `${item.rank} — ${item.name}`).join(', ')}`);

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left - band / 2;
    step.setActive(n > 1 ? clamp(Math.round((px / plotW) * (n - 1)), 0, n - 1) : 0);
  };

  const ordered = [...shown].sort((a, b) => Number(a.highlighted) - Number(b.highlighted));

  return (
    <div data-slot="bump-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? highlight.length > 0) ? <ChartLegend items={legendItems} marker="line" hidden={hidden} onToggle={toggle} onHover={setHovered} /> : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Период',
          columns: series.map((item) => item.name),
          rows: labels.map((text, i) => ({ header: tooltipLabels?.[i] ?? text, cells: series.map((item) => `${item.ranks[i] ?? '—'} место`) })),
        }}
        spoken={step.spoken}
        onKeyDown={step.onKeyDown}
        onBlur={step.onBlur}
      >
        <svg aria-hidden width={width} height={bottom + 36} className="block overflow-visible">
          {step.active !== null ? <rect x={x(step.active) - band / 2} y={0} width={band} height={bottom + 14} rx={8} className="fill-fill-1" /> : null}
          {labels.map((text, i) => (
            <g key={i}>
              <line x1={x(i)} x2={x(i)} y1={6} y2={bottom + 8} stroke="var(--color-separator)" />
              {(n - 1 - i) % stride === 0 ? (
                <text x={x(i)} y={bottom + 28} textAnchor="middle" className="fill-fg-3 text-caption">
                  {text}
                </text>
              ) : null}
            </g>
          ))}
          <g className={reveal}>
            {ordered.map((item) => {
              const points = labels.map((_, i) => ({ x: x(i), y: y(item.ranks[i] ?? places) }));
              return (
                <g key={item.name} opacity={hovered !== null && hovered !== item.key ? 0.3 : 1} className="transition-opacity duration-(--duration-quick)">
                  <path
                    data-slot="bump-line"
                    data-series={item.name}
                    data-highlight={item.highlighted || undefined}
                    d={bumpPath(points)}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={item.highlighted ? 3 : 2}
                    strokeLinecap="round"
                  />
                  {points.map((point, i) => (
                    <circle
                      key={i}
                      data-slot="bump-point"
                      data-series={item.name}
                      cx={point.x}
                      cy={point.y}
                      r={item.highlighted ? 5 : 3.5}
                      fill={item.color}
                      stroke="var(--color-surface-1)"
                      strokeWidth={2}
                    />
                  ))}
                </g>
              );
            })}
          </g>
          {shown.map((item) => {
            const first = item.ranks[0] ?? places;
            const last = item.ranks[n - 1] ?? places;
            const tone = item.highlighted ? 'fill-fg-1 font-semibold' : 'fill-fg-3';
            return (
              <g key={item.name} className={cn('text-caption', fadeIn)}>
                {narrow ? null : (
                  <text x={leftWidth - 14} y={y(first) + 4} textAnchor="end" className={tone}>
                    {item.name}
                  </text>
                )}
                <text x={x(n - 1) + 14} y={y(last) + 4} className={tone}>
                  {`${last} · ${item.name}`}
                </text>
              </g>
            );
          })}
          <rect
            x={leftWidth - band / 2}
            y={0}
            width={plotW + band}
            height={bottom + 14}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => step.setActive(null)}
          />
        </svg>
        {step.active !== null && shown.length > 0 ? (
          <ChartTooltip
            x={x(step.active)}
            width={width}
            title={tooltipLabels?.[step.active] ?? labels[step.active]}
            marker="line"
            rows={placesAt(step.active).map((item) => ({ name: item.name, color: item.color, value: `${item.rank} место` }))}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Rank strip ---------- */

export interface RankStripDatum {
  /** What is ranked: «Цена», «Поддержка». */
  label: string;
  /** Current place, 1 is the best. */
  rank: number;
  /** Place in the previous period. */
  previous?: number;
}

export interface RankStripChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  data: readonly RankStripDatum[];
  /** Number of places on the track: «из 8». */
  places: number;
  currentLabel?: string;
  /** «Квартал назад». */
  previousLabel?: string;
  /** Colour of the current place. */
  color?: string;
}

const STRIP_TOP = 38;
const STRIP_ROW = 40;
const CHANGE_SPACE = 70;

const shift = (item: RankStripDatum) => (item.previous === undefined ? null : item.previous - item.rank);

/** A track of places per row, best on the left: the current place a numbered circle, the previous an empty ring, the move a line and «↑ 2» on the right. */
export function RankStripChart({
  data,
  places,
  currentLabel = 'Сейчас',
  previousLabel = 'Раньше',
  color = seriesColor(0),
  className,
  'aria-label': label,
  ...props
}: RankStripChartProps) {
  const [ref, width] = useWidth(604);
  const [hidden, toggle] = useHiddenSeries();
  const labelWidth = Math.round(clamp(width * 0.23, 96, 138));
  const trackLeft = labelWidth + 12;
  const trackRight = width - CHANGE_SPACE;
  const x = (place: number) => (places > 1 ? trackLeft + ((place - 1) * (trackRight - trackLeft)) / (places - 1) : (trackLeft + trackRight) / 2);
  const rowY = (index: number) => STRIP_TOP + index * STRIP_ROW;
  const height = rowY(Math.max(0, data.length - 1)) + 18;
  const showCurrent = !hidden.has(currentLabel);
  const showPrevious = !hidden.has(previousLabel);
  const hasPrevious = data.some((item) => item.previous !== undefined);

  const changeText = (item: RankStripDatum) => {
    const diff = shift(item);
    return diff === null ? '' : diff > 0 ? `↑ ${diff}` : diff < 0 ? `↓ ${-diff}` : 'без изм.';
  };
  const changeWords = (item: RankStripDatum) => {
    const diff = shift(item);
    return diff === null ? '—' : diff > 0 ? `вверх на ${diff}` : diff < 0 ? `вниз на ${-diff}` : 'без изменений';
  };
  const of = (place: number) => `${place} из ${places}`;
  const step = useStepper(data.length, (index) => {
    const item = data[index];
    if (!item) return '';
    const before = item.previous === undefined ? '' : `, ${previousLabel} ${of(item.previous)}`;
    return `${item.label}: ${currentLabel} ${of(item.rank)}${before}, ${changeWords(item)}`;
  });
  const active = step.active === null ? undefined : data[step.active];

  return (
    <div data-slot="rank-strip-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {hasPrevious ? (
        <ChartLegend
          items={[
            { name: currentLabel, color },
            { name: previousLabel, color: 'var(--color-fg-3)', marker: 'line' },
          ]}
          marker="dot"
          hidden={hidden}
          onToggle={toggle}
        />
      ) : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Показатель',
          columns: [currentLabel, ...(hasPrevious ? [previousLabel, 'Изменение'] : [])],
          rows: data.map((item) => ({
            header: item.label,
            cells: [of(item.rank), ...(hasPrevious ? [item.previous === undefined ? '—' : of(item.previous), changeWords(item)] : [])],
          })),
        }}
        spoken={step.spoken}
        onKeyDown={step.onKeyDown}
        onBlur={step.onBlur}
      >
        <svg aria-hidden width={width} height={height} className="block overflow-visible" onPointerLeave={() => step.setActive(null)}>
          <text x={labelWidth} y={14} textAnchor="end" className="fill-fg-3 text-caption">{`место среди ${places}`}</text>
          {Array.from({ length: places }, (_, i) => (
            <text key={i} x={x(i + 1)} y={14} textAnchor="middle" className="fill-fg-3 text-caption tabular-nums">
              {i + 1}
            </text>
          ))}
          {data.map((item, index) => {
            const cy = rowY(index);
            const diff = shift(item);
            return (
              <g key={item.label} data-slot="rank-strip-row" onPointerEnter={() => step.setActive(index)}>
                <rect x={0} y={cy - 18} width={width} height={36} rx={8} className={step.active === index ? 'fill-fill-1' : 'fill-transparent'} />
                <line x1={trackLeft} x2={trackRight} y1={cy} y2={cy} stroke="var(--color-separator)" strokeWidth={6} strokeLinecap="round" />
                {Array.from({ length: places }, (_, i) => (
                  <circle key={i} cx={x(i + 1)} cy={cy} r={1.5} className="fill-fg-4" />
                ))}
                {showPrevious && item.previous !== undefined && diff !== 0 ? (
                  <g data-slot="rank-strip-previous" className={fadeIn} style={{ transitionDelay: `${index * 35}ms` }}>
                    <line x1={x(item.previous)} x2={x(item.rank)} y1={cy} y2={cy} stroke="var(--color-fg-3)" strokeWidth={2} />
                    <circle cx={x(item.previous)} cy={cy} r={6} fill="var(--color-surface-1)" stroke="var(--color-fg-3)" strokeWidth={2} />
                  </g>
                ) : null}
                {showCurrent ? (
                  <g
                    data-slot="rank-strip-current"
                    data-cx={x(item.rank)}
                    className="origin-center transition-[opacity,scale] duration-(--duration-slow) ease-out [transform-box:fill-box] starting:scale-50 starting:opacity-0 motion-reduce:transition-none"
                    style={{ transitionDelay: `${index * 35}ms` }}
                  >
                    <circle cx={x(item.rank)} cy={cy} r={9} fill={color} stroke="var(--color-surface-1)" strokeWidth={2} />
                    {/* surface-1, not accent-fg: chart-1 is not the accent, and graphite's dark accent-fg would vanish on it */}
                    <text x={x(item.rank)} y={cy + 4} textAnchor="middle" fontSize={11} className="fill-surface-1 font-semibold tabular-nums">
                      {item.rank}
                    </text>
                  </g>
                ) : null}
                <text
                  data-slot="rank-strip-change"
                  x={width}
                  y={cy + 4}
                  textAnchor="end"
                  className={cn('text-caption tabular-nums', diff ? 'fill-fg-1 font-semibold' : 'fill-fg-3')}
                >
                  {changeText(item)}
                </text>
              </g>
            );
          })}
        </svg>
        {data.map((item, index) => (
          <span
            key={item.label}
            aria-hidden
            className="pointer-events-none absolute left-0 truncate pr-3 text-right text-body-xs text-fg-1"
            style={{ top: rowY(index) - 10, width: labelWidth + 12 }}
          >
            {item.label}
          </span>
        ))}
        {active && step.active !== null ? (
          <ChartTooltip
            x={x(active.rank)}
            width={width}
            y={tooltipTop(rowY(step.active) + 16, rowY(step.active) - 16, active.previous === undefined ? 1 : 2, height)}
            title={active.label}
            marker="dot"
            rows={[
              { name: currentLabel, value: of(active.rank), color },
              ...(active.previous === undefined ? [] : [{ name: previousLabel, value: of(active.previous), color: 'var(--color-fg-3)' }]),
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Table with bars in cells ---------- */

interface BarTableColumnBase {
  id: string;
  header: ReactNode;
  /** Header and cell class, e.g. a width. */
  className?: string;
}

export type BarTableColumn<Row> =
  | (BarTableColumnBase & { kind: 'label'; value: (row: Row) => string; /** Initials avatar before the name. */ avatar?: boolean })
  | (BarTableColumnBase & { kind: 'bar'; value: (row: Row) => number; format?: (value: number) => string })
  | (BarTableColumnBase & { kind: 'threshold'; value: (row: Row) => number; /** From this value the cell is filled with accent. */ threshold: number; format?: (value: number) => string })
  | (BarTableColumnBase & { kind: 'delta'; value: (row: Row) => number; format?: (value: number) => string; /** Growth is bad here: the colours flip. */ invert?: boolean });

export interface BarTableSort {
  column: string;
  direction: 'ascending' | 'descending';
}

export interface BarTableChartProps<Row> {
  'aria-label': string;
  rows: readonly Row[];
  columns: readonly BarTableColumn<Row>[];
  getRowId: (row: Row) => string;
  defaultSort?: BarTableSort | null;
  density?: TableDensity;
  className?: string;
}

const percentOf = (value: number) => `${formatNumber(value)} %`;
const deltaFormat = (value: number) => signed(value, percentOf);

/** A ranking as a native table: an 8px bar in each number cell on its column's own scale, an accent fill from a threshold, deltas as soft status with an arrow. */
export function BarTableChart<Row>({ rows, columns, getRowId, defaultSort = null, density = 'comfortable', className, 'aria-label': label }: BarTableChartProps<Row>) {
  const [ref, width] = useWidth(1272);
  const [sort, setSort] = useState<BarTableSort | null>(defaultSort);
  // bars take what the other columns leave, so the table fits before it has to scroll
  const fixed = columns.reduce((sum, column) => sum + (column.kind === 'label' ? 200 : column.kind === 'bar' ? 82 : 116), 0);
  const bars = columns.filter((column) => column.kind === 'bar').length;
  const track = Math.round(clamp((width - fixed) / Math.max(1, bars), 48, 180));
  const sortColumn = sort ? columns.find((column) => column.id === sort.column) : undefined;
  const sorted =
    sort && sortColumn
      ? [...rows].sort((a, b) => {
          const va = sortColumn.value(a);
          const vb = sortColumn.value(b);
          const diff = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'ru');
          return sort.direction === 'ascending' ? diff : -diff;
        })
      : rows;
  const maxima = new Map(columns.map((column) => [column.id, column.kind === 'bar' ? Math.max(0, ...rows.map((row) => column.value(row))) : 0]));

  // a ranking reads largest first: none → ↓ → ↑ → none
  const cycle = (id: string) =>
    setSort((current) =>
      current?.column !== id ? { column: id, direction: 'descending' } : current.direction === 'descending' ? { column: id, direction: 'ascending' } : null,
    );

  const cell = (column: BarTableColumn<Row>, row: Row, index: number): ReactNode => {
    switch (column.kind) {
      case 'label': {
        const text = column.value(row);
        return (
          <span className="flex items-center gap-2.5">
            {column.avatar ? <Avatar name={text} size={28} /> : null}
            <span data-slot="bar-table-label" className="font-medium">
              {text}
            </span>
          </span>
        );
      }
      case 'bar': {
        const value = column.value(row);
        const max = maxima.get(column.id) ?? 0;
        const share = max > 0 ? Math.round((Math.max(0, value) / max) * 1000) / 10 : 0;
        return (
          <span className="flex items-center gap-2.5">
            <span className="w-10 shrink-0 text-right text-body-xs tabular-nums">{(column.format ?? formatNumber)(value)}</span>
            <span aria-hidden className="flex h-2 shrink-0" style={{ width: track }}>
              <span
                data-slot="bar-table-bar"
                className="h-full origin-left rounded-r-[4px] transition-[scale] duration-(--duration-slow) ease-standard starting:scale-x-0 motion-reduce:transition-none"
                style={{ width: `${share}%`, background: CHART_COLORS[0], transitionDelay: `${index * 35}ms` }}
              />
            </span>
          </span>
        );
      }
      case 'threshold': {
        const value = column.value(row);
        const format = column.format ?? percentOf;
        const above = value >= column.threshold;
        return (
          <span
            data-slot="bar-table-threshold"
            data-above={above || undefined}
            className={cn(
              'inline-flex h-6 items-center rounded-[6px] px-2 text-caption font-semibold tabular-nums',
              above ? 'bg-accent text-accent-fg' : 'bg-accent-soft text-accent-soft-fg',
            )}
          >
            {format(value)}
            <span className="sr-only">{`, ${above ? 'выше порога' : 'ниже порога'} ${format(column.threshold)}`}</span>
          </span>
        );
      }
      case 'delta': {
        const value = column.value(row);
        const good = value > 0 !== Boolean(column.invert);
        return (
          <Badge
            data-slot="bar-table-delta"
            tone={value === 0 ? 'neutral' : good ? 'success' : 'danger'}
            icon={value > 0 ? <ChevronUp aria-hidden /> : value < 0 ? <ChevronDown aria-hidden /> : undefined}
            // Badge is a h20 pill; the table cell wants the h24 r6 chip of the threshold column
            style={{ height: 24, borderRadius: 6 }}
            className="font-semibold"
          >
            {value !== 0 ? <span className="sr-only">{value > 0 ? 'Рост:' : 'Снижение:'}</span> : null}
            {(column.format ?? deltaFormat)(value)}
          </Badge>
        );
      }
    }
  };

  return (
    // relative: the sr-only notes in cells are absolute; without it they position past the scroller and widen the page
    <div ref={ref} data-slot="bar-table-chart" className={cn('relative w-full overflow-x-auto', className)}>
      <table aria-label={label} className={cn(tableClasses(density), '[&_td]:whitespace-nowrap')}>
        <thead>
          <tr className="border-b border-separator">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                numeric={column.kind === 'delta'}
                className={column.className}
                sort={column.kind === 'label' ? undefined : sort?.column === column.id ? sort.direction : 'none'}
                onSort={column.kind === 'label' ? undefined : () => cycle(column.id)}
              >
                {column.header}
              </TableHead>
            ))}
          </tr>
        </thead>
        <TableBody>
          {sorted.map((row, index) => (
            <TableRow key={getRowId(row)}>
              {columns.map((column) => (
                <TableCell key={column.id} numeric={column.kind === 'delta'} className={column.className}>
                  {cell(column, row, index)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  );
}
