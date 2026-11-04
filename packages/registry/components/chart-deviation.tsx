import { useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import {
  CHART_COLORS,
  ChartLegend,
  ChartPlot,
  ChartTooltip,
  DIVERGING_COLORS,
  ValueAxis,
  formatAxisValue,
  fitText,
  formatNumber,
  linePath,
  linearScale,
  measureText,
  niceTicks,
  seriesColor,
  stepIndex,
  useHiddenSeries,
  useWidth,
  type ChartTable,
  type ChartTooltipRow,
} from '../lib/chart-kit';
import { cn } from '../lib/cn';

/* Deviation charts: how far above or below a norm. The zero or norm line is always drawn, the sign is spelled with «+/−». */

const tone = (index: number) => DIVERGING_COLORS[index] ?? 'currentColor';
const NEG_2 = tone(0);
const NEG_1 = tone(1);
const MID = tone(2);
const POS_1 = tone(3);
const POS_2 = tone(4);
const UP = CHART_COLORS[0] ?? 'currentColor';
const DOWN = CHART_COLORS[1] ?? 'currentColor';
const NBSP = ' ';

/** «+32 %», «−6 %», «0»: the sign from the value, the magnitude from `format`. */
const signed = (value: number, format: (magnitude: number) => string): string =>
  value > 0 ? `+${format(value)}` : value < 0 ? `−${format(-value)}` : format(0);

/** Bar along x from `from` to `to`, only the far end rounded; `to` may be left of `from`. */
function hBarPath(from: number, to: number, top: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, Math.abs(to - from), height / 2));
  const inner = to >= from ? to - r : to + r;
  return `M${from} ${top}H${inner}Q${to} ${top} ${to} ${top + r}V${top + height - r}Q${to} ${top + height} ${inner} ${top + height}H${from}Z`;
}

// SVG text fonts, for measuring labels that may need «…»
const LABEL_FONT = "400 13px 'Inter Variable', Inter, sans-serif";
const LABEL_MEDIUM_FONT = "500 13px 'Inter Variable', Inter, sans-serif";
const CAPTION_FONT = "400 12px 'Inter Variable', Inter, sans-serif";
const OVERLINE_FONT = "400 11px 'Inter Variable', Inter, sans-serif";

/** Bars and segments grow out of the zero line once. */
const growFrom = (zero: number, index: number): CSSProperties => ({ transformOrigin: `${zero}px 0px`, transitionDelay: `${index * 35}ms` });
const GROW = 'transition-[scale] duration-(--duration-slow) ease-standard [transform-box:view-box] starting:scale-x-0';
const FADE_IN = 'transition-opacity duration-(--duration-slow) ease-out starting:opacity-0';

// rows are stacked vertically: ↑ ↓ step them too
const ROW_KEYS: Readonly<Record<string, string>> = { ArrowDown: 'ArrowRight', ArrowUp: 'ArrowLeft' };

/** Active item driven by pointer and ← → Home End (and ↑ ↓ for row charts), with the spoken description. */
function useStepper(count: number, describe: (index: number) => string, rows = true) {
  const [active, setActive] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = stepIndex((rows ? ROW_KEYS[event.key] : undefined) ?? event.key, active, count);
    if (index === null) return;
    event.preventDefault();
    setActive(index);
    setSpoken(describe(index));
  };
  return {
    active: active !== null && active < count ? active : null,
    setActive,
    plot: { spoken, onKeyDown, onBlur: () => setActive(null) },
  };
}

/** Transparent row band that makes the whole row hoverable. */
function RowHit({ index, top, height, width, onActive }: { index: number; top: number; height: number; width: number; onActive: (index: number | null) => void }) {
  return (
    <rect
      data-row={index}
      x={0}
      y={top}
      width={width}
      height={height}
      fill="transparent"
      onPointerMove={() => onActive(index)}
      onPointerDown={() => onActive(index)}
      onPointerLeave={() => onActive(null)}
    />
  );
}

/** Tooltip under the row, over it when it would spill past the plot, else as low as fits; height estimated from ChartTooltip's rows. */
function tooltipY(top: number, bottom: number, rows: number, plotHeight: number): number {
  const height = 32 + rows * 22;
  if (bottom + 4 + height <= plotHeight + 16) return bottom + 4;
  if (top - 4 - height >= 0) return top - 4 - height;
  return Math.max(0, plotHeight + 16 - height);
}

const RowHighlight = ({ top, height, width }: { top: number; height: number; width: number }) => (
  <rect x={-8} y={top} width={width + 16} height={height} rx={8} className="fill-fill-1" />
);

type DeviationRootProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** What the chart shows; screen readers also get the data as a table. */
  'aria-label': string;
};

interface ChartFrameProps {
  slot: string;
  className?: string;
  legend?: ReactNode;
  rest: Omit<ComponentProps<'div'>, 'children' | 'aria-label'>;
  children: ReactNode;
}

const ChartFrame = ({ slot, className, legend, rest, children }: ChartFrameProps) => (
  <div data-slot={slot} className={cn('flex flex-col gap-3', className)} {...rest}>
    {legend}
    {children}
  </div>
);

/* ---------- 18 · Diverging bars ---------- */

export interface DeviationDatum {
  label: string;
  /** Signed deviation: above zero grows right, below grows left. */
  value: number;
}

export interface DivergingBarChartProps extends DeviationRootProps {
  data: readonly DeviationDatum[];
  /** Formats the magnitude; the chart adds «+» or «−» (default: Russian number). */
  formatValue?: (magnitude: number) => string;
  /** Legend words for the two directions. */
  positiveLabel?: string;
  negativeLabel?: string;
  legend?: boolean;
}

const DIV_ROW = 30;
const DIV_BAR = 16;
const VALUE_ROOM = 48;

/** Bars 16 from one zero line: growth right in chart-1, fall left in chart-2, the signed value at the bar end. */
export function DivergingBarChart({
  data,
  formatValue = formatNumber,
  positiveLabel = 'Рост',
  negativeLabel = 'Падение',
  legend = true,
  className,
  'aria-label': label,
  ...props
}: DivergingBarChartProps) {
  const [ref, width] = useWidth(560);
  const text = (value: number) => signed(value, formatValue);
  const { active, setActive, plot } = useStepper(data.length, (i) => `${data[i]?.label ?? ''}: ${text(data[i]?.value ?? 0)}`);

  const min = Math.min(0, ...data.map((item) => item.value));
  const max = Math.max(0, ...data.map((item) => item.value));
  const labelWidth = Math.min(150, Math.round(width * 0.35));
  const x = linearScale([min, max], [labelWidth + 12 + (min < 0 ? VALUE_ROOM : 0), width - (max > 0 ? VALUE_ROOM : 0)]);
  const zero = x(0);
  const height = data.length * DIV_ROW;
  const current = active === null ? undefined : data[active];

  return (
    <ChartFrame
      slot="diverging-bar-chart"
      className={className}
      rest={props}
      legend={
        legend ? (
          <ChartLegend
            marker="square"
            items={[
              { name: positiveLabel, color: UP },
              { name: negativeLabel, color: DOWN },
            ]}
          />
        ) : null
      }
    >
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{ rowHeader: 'Категория', columns: ['Отклонение'], rows: data.map((item) => ({ header: item.label, cells: [text(item.value)] })) }}
        {...plot}
      >
        <svg aria-hidden width={width} height={height} className="block overflow-visible">
          {active !== null ? <RowHighlight top={active * DIV_ROW} height={DIV_ROW} width={width} /> : null}
          <line x1={zero} x2={zero} y1={0} y2={height} stroke="var(--color-border)" shapeRendering="crispEdges" />
          {data.map((item, i) => {
            const end = x(item.value);
            const center = i * DIV_ROW + DIV_ROW / 2;
            const positive = item.value >= 0;
            return (
              <g key={`${item.label}-${i}`} data-index={i}>
                <text x={labelWidth} y={center} textAnchor="end" dominantBaseline="middle" className="fill-fg-2 text-label-sm">
                  {fitText(item.label, labelWidth, LABEL_FONT)}
                </text>
                <path
                  data-slot="diverging-bar"
                  data-sign={positive ? 'positive' : 'negative'}
                  data-start={zero}
                  data-end={end}
                  d={hBarPath(zero, end, center - DIV_BAR / 2, DIV_BAR, 4)}
                  fill={positive ? UP : DOWN}
                  style={growFrom(zero, i)}
                  className={GROW}
                />
                <text
                  x={positive ? end + 8 : end - 8}
                  y={center}
                  textAnchor={positive ? 'start' : 'end'}
                  dominantBaseline="middle"
                  className={cn('fill-fg-1 text-caption tabular-nums', FADE_IN)}
                >
                  {text(item.value)}
                </text>
              </g>
            );
          })}
          <g onPointerLeave={() => setActive(null)}>
            {data.map((item, i) => (
              <RowHit key={`${item.label}-${i}`} index={i} top={i * DIV_ROW} height={DIV_ROW} width={width} onActive={setActive} />
            ))}
          </g>
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={x(current.value)}
            y={tooltipY(active * DIV_ROW, (active + 1) * DIV_ROW, 1, height)}
            width={width}
            title={current.label}
            rows={[{ name: current.value >= 0 ? positiveLabel : negativeLabel, value: text(current.value), color: current.value >= 0 ? UP : DOWN }]}
          />
        ) : null}
      </ChartPlot>
    </ChartFrame>
  );
}

/* ---------- 19 · Likert and NPS ---------- */

export interface LikertRow {
  label: string;
  /** Answers per category, counts or percents, in the order of `categories`. */
  values: readonly number[];
}

export interface LikertChartProps extends DeviationRootProps {
  /** Answer scale from the most negative to the most positive; with an odd count the middle one is neutral. */
  categories: readonly string[];
  data: readonly LikertRow[];
  /** Right column: share of positive answers, or positive minus negative (NPS). */
  total?: 'positive' | 'net';
  /** Header of the right column (default: «да, всего» from the last category, «индекс» for net). */
  totalLabel?: string;
  /** Legend buttons that hide an answer. */
  legend?: boolean;
}

const LIKERT_ROW = 40;
const LIKERT_BAR = 26;
const LIKERT_TOP = 24;
const LIKERT_TOTAL = 52;

/** Light tone next to zero, strong tone outermost; more than two answers a side blend in between. */
function likertColor(index: number, count: number): string {
  const side = Math.floor(count / 2);
  if (count % 2 === 1 && index === side) return MID;
  const negative = index < side;
  const fromZero = negative ? side - 1 - index : index - (count - side);
  const [light, strong] = negative ? [NEG_1, NEG_2] : [POS_1, POS_2];
  if (side <= 1 || fromZero === side - 1) return strong;
  if (fromZero === 0) return light;
  return `color-mix(in oklch, ${strong} ${Math.round((fromZero / (side - 1)) * 100)}%, ${light})`;
}

const share = (value: number) => `${Math.round(value * 100)}${NBSP}%`;

/** 100 % bars split at zero: «no» to the left, «yes» to the right, the neutral answer centred on the line. */
export function LikertChart({ categories, data, total = 'positive', totalLabel, legend = true, className, 'aria-label': label, ...props }: LikertChartProps) {
  const [ref, width] = useWidth(560);
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);

  const count = categories.length;
  const side = Math.floor(count / 2);
  const middle = count % 2 === 1 ? side : -1;
  const colors = categories.map((_, i) => likertColor(i, count));
  const visible = (i: number) => !hidden.has(categories[i] ?? '');
  const header = totalLabel ?? (total === 'net' ? 'индекс' : `${(categories[count - 1] ?? '').toLocaleLowerCase('ru-RU')}, всего`);

  const rows = data.map((row) => {
    const sum = row.values.reduce((acc, value) => acc + value, 0);
    const shares = categories.map((_, i) => (sum > 0 ? (row.values[i] ?? 0) / sum : 0));
    const at = (i: number) => (visible(i) ? (shares[i] ?? 0) : 0);
    const negatives = Array.from({ length: side }, (_, i) => at(i)).reduce((acc, value) => acc + value, 0);
    const positives = Array.from({ length: side }, (_, i) => at(count - side + i)).reduce((acc, value) => acc + value, 0);
    const half = middle >= 0 ? at(middle) / 2 : 0;
    return { row, shares, negatives, positives, left: negatives + half, right: positives + half };
  });

  const leftMax = Math.max(0, ...rows.map((row) => row.left));
  const rightMax = Math.max(0, ...rows.map((row) => row.right)) || (leftMax > 0 ? 0 : 1);
  const labelWidth = Math.min(138, Math.round(width * 0.33));
  const x = linearScale([-leftMax, rightMax], [labelWidth + 12, width - LIKERT_TOTAL]);
  const zero = x(0);
  const bottom = LIKERT_TOP + Math.max(0, data.length - 1) * LIKERT_ROW + LIKERT_BAR;
  let step = (niceTicks(Math.max(leftMax, rightMax) * 100, 5)[1] ?? 20) / 100;
  // keep axis labels apart on narrow plots
  while (x(step) - zero < 40 && step < 1) step *= 2;
  const ticks: number[] = [];
  for (let value = step; value <= rightMax + 1e-9; value += step) ticks.push(value);
  for (let value = step; value <= leftMax + 1e-9; value += step) ticks.push(-value);

  const totalText = (item: (typeof rows)[number]) =>
    total === 'net' ? signed(Math.round((item.positives - item.negatives) * 100), String) : share(item.positives);
  const shown = categories.map((name, i) => ({ name, i })).filter(({ i }) => visible(i));
  const describe = (index: number) => {
    const item = rows[index];
    return item ? `${item.row.label}: ${shown.map(({ name, i }) => `${name} ${share(item.shares[i] ?? 0)}`).join(', ')}` : '';
  };
  const { active, setActive, plot } = useStepper(data.length, describe);
  const current = active === null ? undefined : rows[active];

  /** Segments of one row from left to right, each as [from, to] in shares around zero. */
  const segments = (item: (typeof rows)[number]) => {
    const list: { i: number; from: number; to: number }[] = [];
    const half = middle >= 0 && visible(middle) ? (item.shares[middle] ?? 0) / 2 : 0;
    if (half > 0) list.push({ i: middle, from: -half, to: half });
    let edge = -half;
    for (let i = side - 1; i >= 0; i -= 1) {
      const value = visible(i) ? (item.shares[i] ?? 0) : 0;
      if (value > 0) list.push({ i, from: edge - value, to: edge });
      edge -= value;
    }
    edge = half;
    for (let i = count - side; i < count; i += 1) {
      const value = visible(i) ? (item.shares[i] ?? 0) : 0;
      if (value > 0) list.push({ i, from: edge, to: edge + value });
      edge += value;
    }
    return list.sort((p, q) => p.from - q.from);
  };

  return (
    <ChartFrame
      slot="likert-chart"
      className={className}
      rest={props}
      legend={
        legend ? (
          <ChartLegend marker="square" items={categories.map((name, i) => ({ name, color: colors[i] ?? MID }))} hidden={hidden} onToggle={toggle} onHover={setHovered} />
        ) : null
      }
    >
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Вопрос',
          columns: [...categories, header],
          rows: rows.map((item) => ({ header: item.row.label, cells: [...item.shares.map(share), totalText(item)] })),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={bottom + 24} className="block overflow-visible">
          {active !== null ? <RowHighlight top={LIKERT_TOP + active * LIKERT_ROW - 7} height={LIKERT_ROW} width={width} /> : null}
          <text x={zero} y={LIKERT_TOP - 12} textAnchor="middle" dominantBaseline="middle" className="fill-fg-3 text-overline">
            0
          </text>
          <text x={width} y={LIKERT_TOP - 12} textAnchor="end" dominantBaseline="middle" className="fill-fg-3 text-overline">
            {header}
          </text>
          <line data-slot="likert-zero" data-x={zero} x1={zero} x2={zero} y1={LIKERT_TOP - 6} y2={bottom + 6} stroke="var(--color-fg-1)" strokeWidth={1.5} />
          {rows.map((item, r) => {
            const top = LIKERT_TOP + r * LIKERT_ROW;
            const list = segments(item);
            return (
              <g key={`${item.row.label}-${r}`} data-index={r}>
                <text x={labelWidth} y={top + LIKERT_BAR / 2} textAnchor="end" dominantBaseline="middle" className="fill-fg-1 text-label-sm">
                  {fitText(item.row.label, labelWidth, LABEL_FONT)}
                </text>
                {list.map((segment, s) => {
                  const start = x(segment.from);
                  const end = x(segment.to);
                  // 2px surface gap between neighbours, none at the outer ends
                  const left = start + (s === 0 ? 0 : 1);
                  const right = end - (s === list.length - 1 ? 0 : 1);
                  const name = categories[segment.i] ?? '';
                  const value = item.shares[segment.i] ?? 0;
                  const strong = colors[segment.i] === NEG_2 || colors[segment.i] === POS_2;
                  return (
                    <g key={name} opacity={hovered !== null && hovered !== name && !hidden.has(hovered) ? 0.3 : 1} className="transition-opacity duration-(--duration-quick)">
                      <rect
                        data-slot="likert-segment"
                        data-category={name}
                        data-start={start}
                        data-end={end}
                        x={left}
                        y={top}
                        width={Math.max(0, right - left)}
                        height={LIKERT_BAR}
                        fill={colors[segment.i]}
                        style={growFrom(zero, r)}
                        className={GROW}
                      />
                      {right - left >= 20 ? (
                        <text
                          x={(left + right) / 2}
                          y={top + LIKERT_BAR / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className={cn('fill-fg-1 text-overline tabular-nums', strong && 'font-semibold', FADE_IN)}
                        >
                          {Math.round(value * 100)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
                <text
                  data-slot="likert-total"
                  x={width}
                  y={top + LIKERT_BAR / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-fg-1 text-caption font-semibold tabular-nums"
                >
                  {totalText(item)}
                </text>
              </g>
            );
          })}
          {ticks.map((tick) => (
            <text key={tick} x={x(tick)} y={bottom + 14} textAnchor="middle" dominantBaseline="middle" className="fill-fg-3 text-overline tabular-nums">
              {share(Math.abs(tick))}
            </text>
          ))}
          <g onPointerLeave={() => setActive(null)}>
            {rows.map((item, r) => (
              <RowHit key={`${item.row.label}-${r}`} index={r} top={LIKERT_TOP + r * LIKERT_ROW - 7} height={LIKERT_ROW} width={width} onActive={setActive} />
            ))}
          </g>
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={x(current.right)}
            y={tooltipY(LIKERT_TOP + active * LIKERT_ROW, LIKERT_TOP + active * LIKERT_ROW + LIKERT_BAR, shown.length, bottom + 24)}
            width={width}
            title={current.row.label}
            rows={shown.map(({ name, i }) => ({ name, value: share(current.shares[i] ?? 0), color: colors[i] }))}
          />
        ) : null}
      </ChartPlot>
    </ChartFrame>
  );
}

/* ---------- 20 · Spine chart ---------- */

export interface SpineRow {
  label: string;
  /** Our value. */
  value: number;
  /** The centre of the row: the average of the group. */
  mean: number;
  /** The whole spread of the group; the worse end goes left. */
  min: number;
  max: number;
  /** Middle half of the group (quartiles), drawn darker. */
  q1?: number;
  q3?: number;
  /** Returns, response time, costs: less is better, the row flips. */
  lowerIsBetter?: boolean;
  /** Value format of this row: «2 840 ₽», «2,9 %». */
  format?: (value: number) => string;
}

export interface SpineChartProps extends DeviationRootProps {
  data: readonly SpineRow[];
  /** Relative deviation from the mean that counts as notable (default 5 %). */
  threshold?: number;
  worseLabel?: string;
  betterLabel?: string;
  /** Header of the values column. */
  valuesLabel?: string;
  legend?: boolean;
}

type SpineTone = 'better' | 'same' | 'worse';
const SPINE_COLORS: Readonly<Record<SpineTone, string>> = { better: POS_2, same: 'var(--color-fg-4)', worse: NEG_2 };
const SPINE_WORDS: Readonly<Record<SpineTone, string>> = { better: 'заметно лучше', same: 'как все', worse: 'заметно хуже' };

const SPINE_ROW = 40;
const SPINE_TOP = 30;

/** Position on the row in halves: −1 the worst, 0 the mean, +1 the best; each side scaled on its own. */
function spinePosition(row: SpineRow, value: number): number {
  const lower = row.lowerIsBetter === true;
  const better = lower ? row.mean - value : value - row.mean;
  const span = better >= 0 ? (lower ? row.mean - row.min : row.max - row.mean) : lower ? row.max - row.mean : row.mean - row.min;
  if (!(span > 0)) return 0;
  return Math.max(-1, Math.min(1, better / span));
}

function spineTone(row: SpineRow, threshold: number): SpineTone {
  const better = row.lowerIsBetter ? row.mean - row.value : row.value - row.mean;
  const relative = row.mean !== 0 ? better / Math.abs(row.mean) : better;
  return relative > threshold ? 'better' : relative < -threshold ? 'worse' : 'same';
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Each row on its own scale: the mean in the centre, worst and best at the edges, our value as a dot. */
export function SpineChart({
  data,
  threshold = 0.05,
  worseLabel = 'хуже среднего',
  betterLabel = 'лучше среднего',
  valuesLabel = 'мы · среднее',
  legend = true,
  className,
  'aria-label': label,
  ...props
}: SpineChartProps) {
  const [ref, width] = useWidth(560);
  const narrow = width < 480;
  const labelWidth = Math.min(110, Math.round(width * 0.33));
  const plotLeft = labelWidth + 12 + (narrow ? 0 : 128);
  const plotRight = width - 6;
  const center = (plotLeft + plotRight) / 2;
  const half = (plotRight - plotLeft) / 2;
  const at = (row: SpineRow, value: number) => center + spinePosition(row, value) * half;
  const rows = data.map((row) => ({ row, verdict: spineTone(row, threshold), fmt: row.format ?? formatNumber }));
  const describe = (index: number) => {
    const item = rows[index];
    return item ? `${item.row.label}: мы ${item.fmt(item.row.value)}, среднее ${item.fmt(item.row.mean)}, ${SPINE_WORDS[item.verdict]}` : '';
  };
  const { active, setActive, plot } = useStepper(data.length, describe);
  const current = active === null ? undefined : rows[active];
  const bottom = SPINE_TOP + Math.max(0, data.length - 1) * SPINE_ROW + 10;
  const extremes = (row: SpineRow) => (row.lowerIsBetter ? { worst: row.max, best: row.min } : { worst: row.min, best: row.max });

  const tooltipRows = (item: (typeof rows)[number]): ChartTooltipRow[] => {
    const { row, fmt, verdict } = item;
    const { worst, best } = extremes(row);
    return [
      { name: 'Мы', value: fmt(row.value), color: SPINE_COLORS[verdict] },
      { name: 'Среднее', value: fmt(row.mean) },
      { name: 'Худший', value: fmt(worst) },
      { name: 'Лучший', value: fmt(best) },
      ...(row.q1 !== undefined && row.q3 !== undefined ? [{ name: 'Средняя половина', value: `${fmt(row.q1)} – ${fmt(row.q3)}` }] : []),
    ];
  };

  return (
    <ChartFrame
      slot="spine-chart"
      className={className}
      rest={props}
      legend={
        legend ? (
          <ChartLegend
            marker="dot"
            items={[
              { name: 'Заметно лучше', color: SPINE_COLORS.better },
              { name: 'Как все', color: SPINE_COLORS.same },
              { name: 'Заметно хуже', color: SPINE_COLORS.worse },
            ]}
          />
        ) : null
      }
    >
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Показатель',
          columns: ['Мы', 'Среднее', 'Худший', 'Лучший', 'Оценка'],
          rows: rows.map(({ row, verdict, fmt }) => {
            const { worst, best } = extremes(row);
            return { header: row.label, cells: [fmt(row.value), fmt(row.mean), fmt(worst), fmt(best), SPINE_WORDS[verdict]] };
          }),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={bottom + 4} className="block overflow-visible">
          {active !== null ? <RowHighlight top={SPINE_TOP + active * SPINE_ROW - SPINE_ROW / 2} height={SPINE_ROW} width={width} /> : null}
          {!narrow ? (
            <text x={plotLeft - 12} y={12} textAnchor="end" dominantBaseline="middle" className="fill-fg-3 text-overline">
              {valuesLabel}
            </text>
          ) : null}
          <text x={plotLeft} y={12} dominantBaseline="middle" className="fill-fg-3 text-overline">
            {worseLabel}
          </text>
          <text x={plotRight} y={12} textAnchor="end" dominantBaseline="middle" className="fill-fg-3 text-overline">
            {betterLabel}
          </text>
          {rows.map(({ row, fmt }, i) => {
            const y = SPINE_TOP + i * SPINE_ROW;
            const quartiles = row.q1 !== undefined && row.q3 !== undefined ? [at(row, row.q1), at(row, row.q3)].sort((p, q) => p - q) : null;
            return (
              <g key={`${row.label}-${i}`} data-index={i}>
                <text x={labelWidth} y={y} textAnchor="end" dominantBaseline="middle" className="fill-fg-1 text-label-sm">
                  {fitText(row.label, labelWidth, LABEL_FONT)}
                </text>
                {!narrow ? (
                  <text x={plotLeft - 12} y={y} textAnchor="end" dominantBaseline="middle" className="fill-fg-2 text-caption tabular-nums">
                    {`${fmt(row.value)} · ${fmt(row.mean)}`}
                  </text>
                ) : null}
                <rect x={plotLeft} y={y - 7} width={plotRight - plotLeft} height={14} className="fill-fill-1" />
                {quartiles ? (
                  <rect
                    data-slot="spine-quartiles"
                    x={quartiles[0]}
                    y={y - 7}
                    width={(quartiles[1] ?? 0) - (quartiles[0] ?? 0)}
                    height={14}
                    className="fill-fill-3"
                  />
                ) : null}
              </g>
            );
          })}
          <line x1={center} x2={center} y1={SPINE_TOP - 10} y2={bottom} stroke="var(--color-fg-1)" strokeWidth={1.5} />
          {rows.map(({ row, verdict }, i) => {
            const dot = at(row, row.value);
            return (
              <circle
                key={`${row.label}-${i}`}
                data-slot="spine-dot"
                data-tone={verdict}
                data-offset={round1(dot - center)}
                data-half={round1(half)}
                cx={dot}
                cy={SPINE_TOP + i * SPINE_ROW}
                r={active === i ? 7 : 6}
                fill={SPINE_COLORS[verdict]}
                stroke="var(--color-surface-1)"
                strokeWidth={2}
                style={{ '--kv-from': `${center - dot}px`, transitionDelay: `${i * 35}ms` } as CSSProperties}
                className="transition-[translate,r] duration-(--duration-slow) ease-standard starting:[translate:var(--kv-from)_0]"
              />
            );
          })}
          <g onPointerLeave={() => setActive(null)}>
            {rows.map(({ row }, i) => (
              <RowHit key={`${row.label}-${i}`} index={i} top={SPINE_TOP + i * SPINE_ROW - SPINE_ROW / 2} height={SPINE_ROW} width={width} onActive={setActive} />
            ))}
          </g>
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={at(current.row, current.row.value)}
            y={tooltipY(SPINE_TOP + active * SPINE_ROW - 10, SPINE_TOP + active * SPINE_ROW + 10, tooltipRows(current).length, bottom + 4)}
            width={width}
            title={`${current.row.label} · ${SPINE_WORDS[current.verdict]}`}
            marker="dot"
            rows={tooltipRows(current)}
          />
        ) : null}
      </ChartPlot>
    </ChartFrame>
  );
}

/* ---------- 21 · Surplus and deficit between two lines ---------- */

export interface DeviationSeries {
  name: string;
  values: readonly number[];
}

export interface DeviationNorm {
  name: string;
  /** A constant norm instead of a second line: plan, break-even, target. */
  value: number;
}

export interface SurplusDeficitChartProps extends DeviationRootProps {
  /** X axis labels, one per value. */
  labels: readonly string[];
  /** The measured line: income, revenue. */
  series: DeviationSeries;
  /** What it is compared with: a second line (payments) or a constant norm. */
  reference: DeviationSeries | DeviationNorm;
  surplusLabel?: string;
  deficitLabel?: string;
  /** Period in the summary: «за полгода». */
  period?: string;
  /** Unit after values and on the top axis label: «млн». */
  unit?: string;
  /** Totals of the gap in the top left corner. */
  summary?: boolean;
  tooltipLabels?: readonly string[];
  formatValue?: (value: number) => string;
  height?: number;
  legend?: boolean;
}

interface GapPoint {
  x: number;
  a: number;
  b: number;
}

type GapKind = 'surplus' | 'deficit';

/** Consecutive stretches where one line stays above the other, cut exactly where the straight segments cross. */
function gapRuns(points: readonly GapPoint[]): { kind: GapKind; points: GapPoint[] }[] {
  const runs: { kind: GapKind; points: GapPoint[] }[] = [];
  let current: { kind: GapKind; points: GapPoint[] } | null = null;
  let previous: GapPoint | null = null;
  for (const point of points) {
    const gap = point.a - point.b;
    const kind: GapKind | null = gap > 0 ? 'surplus' : gap < 0 ? 'deficit' : null;
    if (kind && current && current.kind !== kind && previous) {
      const before = previous.a - previous.b;
      const t = before === 0 ? 0 : before / (before - gap);
      const cross = {
        x: previous.x + (point.x - previous.x) * t,
        a: previous.a + (point.a - previous.a) * t,
        b: previous.b + (point.b - previous.b) * t,
      };
      // a touching point is already the last point of the run
      if (before !== 0) current.points.push(cross);
      runs.push(current);
      current = { kind, points: [cross] };
    } else if (kind && !current) {
      current = { kind, points: previous ? [previous] : [] };
    }
    current?.points.push(point);
    previous = point;
  }
  if (current) runs.push(current);
  return runs.filter((run) => run.points.length > 1);
}

/** About three round intervals over min…max without forcing zero; steps of 2·10ⁿ may start on an odd multiple (3, 5, 7, 9), centred on the data. */
function extentTicks(min: number, max: number, intervals = 3): number[] {
  const span = max - min || Math.abs(max) || 1;
  const step = niceTicks(span, intervals)[1] ?? 1;
  const mantissa = Math.round(step / 10 ** Math.floor(Math.log10(step)));
  const unit = mantissa === 2 ? step / 2 : step;
  let count = Math.max(intervals, Math.ceil(span / step));
  let start = Math.round(((min + max) / 2 - (count * step) / 2) / unit) * unit;
  while (start > min) start -= unit;
  while (start + count * step < max) count += 1;
  return Array.from({ length: count + 1 }, (_, i) => Math.round((start + i * step) * 1e6) / 1e6);
}

const SD_MARGIN = { top: 8, right: 0, bottom: 28, left: 48 };

/** Two lines with the gap filled: light pos where the line is above, light neg below, the colour switching at every crossing. */
export function SurplusDeficitChart({
  labels,
  series,
  reference,
  surplusLabel = 'Профицит',
  deficitLabel = 'Дефицит',
  period,
  unit,
  summary = true,
  tooltipLabels,
  formatValue = formatNumber,
  height = 220,
  legend = true,
  className,
  'aria-label': label,
  ...props
}: SurplusDeficitChartProps) {
  const [ref, width] = useWidth(560);
  const [hidden, toggle] = useHiddenSeries();
  const n = labels.length;
  const norm = 'value' in reference;
  const a = labels.map((_, i) => series.values[i] ?? 0);
  const b = labels.map((_, i) => ('value' in reference ? reference.value : (reference.values[i] ?? 0)));
  const showA = !hidden.has(series.name);
  const showB = !hidden.has(reference.name);
  const both = showA && showB;
  const refColor = norm ? 'var(--color-fg-3)' : NEG_2;
  const withUnit = (value: number) => `${formatValue(value)}${unit ? `${NBSP}${unit}` : ''}`;

  const values = [...(showA ? a : []), ...(showB ? b : [])];
  const ticks = values.length > 0 ? extentTicks(Math.min(...values), Math.max(...values)) : [0, 1];
  const low = ticks[0] ?? 0;
  const top = ticks[ticks.length - 1] ?? 1;
  const plotW = Math.max(1, width - SD_MARGIN.left - SD_MARGIN.right);
  const x = (i: number) => (n > 1 ? SD_MARGIN.left + (i * plotW) / (n - 1) : SD_MARGIN.left + plotW / 2);
  const y = linearScale([low, top], [SD_MARGIN.top + height, SD_MARGIN.top]);
  const fit = Math.max(1, Math.floor(plotW / 72));
  // round strides as in the mockup: every 1st, 2nd, 5th, 10th… label
  const stride = [1, 2, 5, 10, 20, 50, 100].find((every) => Math.ceil(n / every) <= fit) ?? Math.ceil(n / fit);
  const runs = both ? gapRuns(labels.map((_, i) => ({ x: x(i), a: a[i] ?? 0, b: b[i] ?? 0 }))) : [];
  const gaps = a.map((value, i) => value - (b[i] ?? 0));
  const surplus = gaps.reduce((sum, gap) => sum + Math.max(0, gap), 0);
  const deficit = gaps.reduce((sum, gap) => sum + Math.max(0, -gap), 0);
  const gapName = (gap: number) => (gap >= 0 ? surplusLabel : deficitLabel);

  const title = (i: number) => tooltipLabels?.[i] ?? labels[i] ?? '';
  const describe = (i: number) => {
    const parts = [...(showA ? [`${series.name} ${withUnit(a[i] ?? 0)}`] : []), ...(showB ? [`${reference.name} ${withUnit(b[i] ?? 0)}`] : [])];
    if (both) parts.push(`${gapName(gaps[i] ?? 0)} ${signed(gaps[i] ?? 0, withUnit)}`);
    return `${title(i)}: ${parts.join(', ')}`;
  };
  const { active, setActive, plot } = useStepper(n, describe, false);

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const index = n > 1 ? Math.round(((event.clientX - box.left) / plotW) * (n - 1)) : 0;
    setActive(Math.min(n - 1, Math.max(0, index)));
  };

  const line = (data: readonly number[]) => linePath(data.map((value, i) => ({ x: x(i), y: y(value) })));
  const areaPath = (points: readonly GapPoint[]) =>
    `${points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${y(p.a)}`).join('')}${[...points]
      .reverse()
      .map((p) => `L${p.x} ${y(p.b)}`)
      .join('')}Z`;
  const gapAt = active === null ? 0 : (gaps[active] ?? 0);

  return (
    <ChartFrame
      slot="surplus-deficit-chart"
      className={className}
      rest={props}
      legend={
        legend ? (
          <div className="flex flex-wrap items-center justify-end gap-x-3">
            <ChartLegend
              marker="line"
              items={[
                { name: series.name, color: POS_2 },
                { name: reference.name, color: refColor },
              ]}
              hidden={hidden}
              onToggle={toggle}
            />
            {both ? (
              <ChartLegend
                marker="square"
                items={[
                  { name: surplusLabel, color: POS_1 },
                  { name: deficitLabel, color: NEG_1 },
                ]}
              />
            ) : null}
          </div>
        ) : null
      }
    >
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Период',
          columns: [series.name, reference.name, 'Разрыв'],
          rows: labels.map((_, i) => ({ header: title(i), cells: [withUnit(a[i] ?? 0), withUnit(b[i] ?? 0), signed(gaps[i] ?? 0, withUnit)] })),
        }}
        {...plot}
      >
        <svg aria-hidden width={width} height={height + SD_MARGIN.top + SD_MARGIN.bottom} className="block overflow-visible">
          <ValueAxis
            ticks={ticks}
            y={y}
            left={SD_MARGIN.left}
            right={SD_MARGIN.left + plotW}
            format={(value) => (value === top && unit ? `${formatAxisValue(value)}${NBSP}${unit}` : formatAxisValue(value))}
          />
          {labels.map((text, i) =>
            i % stride === 0 ? (
              <text
                key={i}
                data-x-label
                x={x(i)}
                y={SD_MARGIN.top + height + 20}
                textAnchor={n > 1 && i === 0 ? 'start' : n > 1 && i === n - 1 ? 'end' : 'middle'}
                className="fill-fg-3 text-caption"
              >
                {text}
              </text>
            ) : null,
          )}
          <g className="transition-[clip-path] duration-(--duration-deliberate) ease-out [clip-path:inset(-8px_-8px_-8px_-8px)] starting:[clip-path:inset(-8px_100%_-8px_-8px)]">
            {runs.map((run, i) => (
              <path
                key={i}
                data-slot="surplus-area"
                data-kind={run.kind}
                data-from={run.points[0]?.x}
                data-to={run.points[run.points.length - 1]?.x}
                d={areaPath(run.points)}
                fill={run.kind === 'surplus' ? POS_1 : NEG_1}
              />
            ))}
            {showB ? (
              <path
                d={line(b)}
                fill="none"
                stroke={refColor}
                strokeWidth={norm ? 1.5 : 2}
                strokeDasharray={norm ? '4 4' : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {showA ? <path d={line(a)} fill="none" stroke={POS_2} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" /> : null}
          </g>
          {summary && both ? (
            <g data-slot="surplus-summary">
              <text x={SD_MARGIN.left + 6} y={SD_MARGIN.top + 18} className="fill-fg-1 text-caption font-semibold tabular-nums">
                {`${surplusLabel}${period ? ` ${period}` : ''} ${signed(surplus, withUnit)}`}
              </text>
              <text x={SD_MARGIN.left + 6} y={SD_MARGIN.top + 34} className="fill-fg-2 text-caption tabular-nums">
                {`${deficitLabel} ${signed(-deficit, withUnit)}`}
              </text>
            </g>
          ) : null}
          {active !== null ? (
            <g>
              <line x1={x(active)} x2={x(active)} y1={SD_MARGIN.top} y2={SD_MARGIN.top + height} stroke="var(--color-fg-4)" strokeDasharray="3 3" />
              {showB ? <circle cx={x(active)} cy={y(b[active] ?? 0)} r={4.5} fill="var(--color-surface-1)" stroke={refColor} strokeWidth={2} /> : null}
              {showA ? <circle cx={x(active)} cy={y(a[active] ?? 0)} r={4.5} fill="var(--color-surface-1)" stroke={POS_2} strokeWidth={2} /> : null}
            </g>
          ) : null}
          <rect
            x={SD_MARGIN.left}
            y={SD_MARGIN.top}
            width={plotW}
            height={height}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
        {active !== null && (showA || showB) ? (
          <ChartTooltip
            x={x(active)}
            width={width}
            title={title(active)}
            marker="line"
            rows={[
              ...(showA ? [{ name: series.name, value: withUnit(a[active] ?? 0), color: POS_2 }] : []),
              ...(showB ? [{ name: reference.name, value: withUnit(b[active] ?? 0), color: refColor }] : []),
              ...(both ? [{ name: gapName(gapAt), value: signed(gapAt, withUnit), color: gapAt >= 0 ? POS_1 : NEG_1 }] : []),
            ]}
          />
        ) : null}
      </ChartPlot>
    </ChartFrame>
  );
}

/* ---------- 22 · Tornado and butterfly ---------- */

interface SideBar {
  value: number;
  text: string;
  color: string;
}

interface TwoSidedRow {
  label: string;
  low: SideBar | null;
  high: SideBar | null;
}

interface TwoSidedChartProps {
  slot: string;
  barSlot: string;
  rows: readonly TwoSidedRow[];
  lowLabel: string;
  highLabel: string;
  baseLabel?: string;
  label: string;
  legend: ReactNode;
  className?: string;
  rest: Omit<ComponentProps<'div'>, 'children' | 'aria-label'>;
}

const TWO_ROW = 34;
const TWO_BAR = 22;
const TWO_TOP = 26;
const TWO_SIDES = ['low', 'high'] as const;

/** Shared body of tornado and butterfly: a centre line, bars to both sides, the value outside each bar. */
function TwoSidedChart({ slot, barSlot, rows, lowLabel, highLabel, baseLabel, label, legend, className, rest }: TwoSidedChartProps) {
  const [ref, width] = useWidth(560);
  const describe = (index: number) => {
    const row = rows[index];
    if (!row) return '';
    const parts = [...(row.low ? [`${lowLabel} ${row.low.text}`] : []), ...(row.high ? [`${highLabel} ${row.high.text}`] : [])];
    return `${row.label}: ${parts.join(', ')}`;
  };
  const { active, setActive, plot } = useStepper(rows.length, describe);
  const labelWidth = Math.min(164, Math.round(width * 0.33));
  const plotLeft = labelWidth + 12;
  // side headers that do not fit on one line stack in two
  const stacked = measureText(lowLabel, OVERLINE_FONT) + measureText(highLabel, OVERLINE_FONT) + 16 > width - plotLeft;
  const rowsTop = TWO_TOP + (stacked ? 14 : 0);
  const center = (plotLeft + width) / 2;
  const half = (width - plotLeft) / 2;
  const maxAbs = Math.max(0, ...rows.flatMap((row) => [Math.abs(row.low?.value ?? 0), Math.abs(row.high?.value ?? 0)])) || 1;
  // 56px outside the longest bar for its value label
  const scale = Math.max(0, half - 56) / maxAbs;
  const bottom = rowsTop + Math.max(0, rows.length - 1) * TWO_ROW + TWO_BAR;
  const current = active === null ? undefined : rows[active];
  const end = (side: 'low' | 'high', bar: SideBar) => (side === 'low' ? center - 1 - Math.abs(bar.value) * scale : center + 1 + Math.abs(bar.value) * scale);

  return (
    <ChartFrame slot={slot} className={className} rest={rest} legend={legend}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{ rowHeader: 'Показатель', columns: [lowLabel, highLabel], rows: rows.map((row) => ({ header: row.label, cells: [row.low?.text ?? '—', row.high?.text ?? '—'] })) }}
        {...plot}
      >
        <svg aria-hidden width={width} height={bottom + 6} className="block overflow-visible">
          {active !== null ? <RowHighlight top={rowsTop + active * TWO_ROW - (TWO_ROW - TWO_BAR) / 2} height={TWO_ROW} width={width} /> : null}
          <text x={plotLeft} y={10} dominantBaseline="middle" className="fill-fg-3 text-overline">
            {lowLabel}
          </text>
          {baseLabel && !stacked && half >= 150 ? (
            <text x={center} y={10} textAnchor="middle" dominantBaseline="middle" className="fill-fg-3 text-overline">
              {baseLabel}
            </text>
          ) : null}
          <text x={width} y={stacked ? 24 : 10} textAnchor="end" dominantBaseline="middle" className="fill-fg-3 text-overline">
            {highLabel}
          </text>
          {rows.map((row, i) => {
            const top = rowsTop + i * TWO_ROW;
            const middle = top + TWO_BAR / 2;
            return (
              <g key={`${row.label}-${i}`} data-index={i}>
                <text x={labelWidth} y={middle} textAnchor="end" dominantBaseline="middle" className="fill-fg-1 text-caption">
                  {fitText(row.label, labelWidth, CAPTION_FONT)}
                </text>
                {TWO_SIDES.map((side) => {
                  const bar = row[side];
                  if (!bar) return null;
                  const from = side === 'low' ? center - 1 : center + 1;
                  const to = end(side, bar);
                  return (
                    <g key={side}>
                      <path
                        data-slot={barSlot}
                        data-side={side}
                        data-sign={bar.value >= 0 ? 'positive' : 'negative'}
                        data-start={from}
                        data-end={to}
                        d={hBarPath(from, to, top, TWO_BAR, 4)}
                        fill={bar.color}
                        style={growFrom(center, i)}
                        className={GROW}
                      />
                      <text
                        x={side === 'low' ? to - 6 : to + 6}
                        y={middle}
                        textAnchor={side === 'low' ? 'end' : 'start'}
                        dominantBaseline="middle"
                        className={cn('fill-fg-1 text-caption font-semibold tabular-nums', FADE_IN)}
                      >
                        {bar.text}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
          <line x1={center} x2={center} y1={rowsTop - 6} y2={bottom + 6} stroke="var(--color-fg-1)" strokeWidth={1.5} />
          <g onPointerLeave={() => setActive(null)}>
            {rows.map((row, i) => (
              <RowHit
                key={`${row.label}-${i}`}
                index={i}
                top={rowsTop + i * TWO_ROW - (TWO_ROW - TWO_BAR) / 2}
                height={TWO_ROW}
                width={width}
                onActive={setActive}
              />
            ))}
          </g>
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={current.high ? end('high', current.high) : center}
            y={tooltipY(rowsTop + active * TWO_ROW, rowsTop + active * TWO_ROW + TWO_BAR, 2, bottom + 6)}
            width={width}
            title={current.label}
            rows={[
              ...(current.low ? [{ name: lowLabel, value: current.low.text, color: current.low.color }] : []),
              ...(current.high ? [{ name: highLabel, value: current.high.text, color: current.high.color }] : []),
            ]}
          />
        ) : null}
      </ChartPlot>
    </ChartFrame>
  );
}

export interface TornadoDatum {
  /** Driver: «Цена товара ±10 %». */
  label: string;
  /** Effect on the result when the driver goes down. */
  low: number;
  /** Effect when it goes up. */
  high: number;
}

export interface TornadoChartProps extends DeviationRootProps {
  data: readonly TornadoDatum[];
  /** Header over the left side: «показатель −10 %». */
  lowLabel?: string;
  highLabel?: string;
  /** Over the centre line: «база 4,2 млн». */
  baseLabel?: string;
  /** Legend words for the sign of the effect. */
  positiveLabel?: string;
  negativeLabel?: string;
  /** Strongest swing on top (default); off keeps the given order. */
  sort?: boolean;
  /** Formats the magnitude; the chart adds «+» or «−». */
  formatValue?: (magnitude: number) => string;
  legend?: boolean;
}

/** Sensitivity: each driver moved down (left) and up (right), the colour is the sign of the effect, not the side. */
export function TornadoChart({
  data,
  lowLabel = 'Показатель ниже',
  highLabel = 'Показатель выше',
  baseLabel,
  positiveLabel = 'Рост',
  negativeLabel = 'Снижение',
  sort = true,
  formatValue = formatNumber,
  legend = true,
  className,
  'aria-label': label,
  ...props
}: TornadoChartProps) {
  const swing = (item: TornadoDatum) => Math.abs(item.low) + Math.abs(item.high);
  const ordered = sort ? [...data].sort((p, q) => swing(q) - swing(p)) : data;
  const bar = (value: number): SideBar => ({ value, text: signed(value, formatValue), color: value >= 0 ? POS_2 : NEG_2 });
  return (
    <TwoSidedChart
      slot="tornado-chart"
      barSlot="tornado-bar"
      rows={ordered.map((item) => ({ label: item.label, low: bar(item.low), high: bar(item.high) }))}
      lowLabel={lowLabel}
      highLabel={highLabel}
      baseLabel={baseLabel}
      label={label}
      className={className}
      rest={props}
      legend={
        legend ? (
          <ChartLegend
            marker="square"
            items={[
              { name: positiveLabel, color: POS_2 },
              { name: negativeLabel, color: NEG_2 },
            ]}
          />
        ) : null
      }
    />
  );
}

export interface ButterflySide {
  name: string;
  values: readonly number[];
  color?: string;
}

export interface ButterflyChartProps extends DeviationRootProps {
  /** Row labels, one per value. */
  labels: readonly string[];
  /** Group drawn to the left. */
  left: ButterflySide;
  /** Group drawn to the right. */
  right: ButterflySide;
  formatValue?: (value: number) => string;
  /** Legend buttons that hide a side. */
  legend?: boolean;
}

/** Two groups mirrored around a centre line, row by row: clients by age in two cities, new and returning buyers. */
export function ButterflyChart({ labels, left, right, formatValue = formatNumber, legend = true, className, 'aria-label': label, ...props }: ButterflyChartProps) {
  const [hidden, toggle] = useHiddenSeries();
  const leftColor = seriesColor(0, left.color);
  const rightColor = seriesColor(1, right.color);
  const bar = (side: ButterflySide, color: string, i: number): SideBar | null =>
    hidden.has(side.name) ? null : { value: side.values[i] ?? 0, text: formatValue(side.values[i] ?? 0), color };
  return (
    <TwoSidedChart
      slot="butterfly-chart"
      barSlot="butterfly-bar"
      rows={labels.map((text, i) => ({ label: text, low: bar(left, leftColor, i), high: bar(right, rightColor, i) }))}
      lowLabel={left.name}
      highLabel={right.name}
      label={label}
      className={className}
      rest={props}
      legend={
        legend ? (
          <ChartLegend
            marker="square"
            items={[
              { name: left.name, color: leftColor },
              { name: right.name, color: rightColor },
            ]}
            hidden={hidden}
            onToggle={toggle}
          />
        ) : null
      }
    />
  );
}

/* ---------- 23 · Plan and fact with the deviation in % ---------- */

export interface PlanFactDatum {
  label: string;
  plan: number;
  fact: number;
  /** Going over plan is bad here (costs, returns): the badge colours flip. */
  invert?: boolean;
}

export interface PlanFactChartProps extends DeviationRootProps {
  data: readonly PlanFactDatum[];
  formatValue?: (value: number) => string;
  /** Default for rows without their own `invert`. */
  invert?: boolean;
  planLabel?: string;
  factLabel?: string;
}

type PlanTone = 'good' | 'bad' | 'neutral';
const PLAN_TONES: Readonly<Record<PlanTone, { bg: string; fg: string }>> = {
  good: { bg: 'var(--color-success-soft)', fg: 'var(--color-success-soft-fg)' },
  bad: { bg: 'var(--color-danger-soft)', fg: 'var(--color-danger-soft-fg)' },
  neutral: { bg: 'var(--color-fill-2)', fg: 'var(--color-fg-2)' },
};

const PF_ROW = 44;
const PF_BADGE = 64;

/** Fact as a 12 bar over the plan as a fill-2 backdrop with a 2×28 tick; the deviation as a soft status with an arrow. */
export function PlanFactChart({
  data,
  formatValue = formatNumber,
  invert = false,
  planLabel = 'План',
  factLabel = 'Факт',
  className,
  'aria-label': label,
  ...props
}: PlanFactChartProps) {
  const [ref, width] = useWidth(560);
  const narrow = width < 480;
  const labelWidth = Math.min(120, Math.round(width * 0.25));
  const plotRight = width - PF_BADGE - (narrow ? 16 : 120);
  // 10 % headroom past the larger of plan and fact
  const max = Math.max(0, ...data.flatMap((item) => [item.plan, item.fact])) * 1.1 || 1;
  const x = linearScale([0, max], [labelWidth, plotRight]);
  const rows = data.map((item) => {
    const percent = item.plan !== 0 ? Math.round(((item.fact - item.plan) / Math.abs(item.plan)) * 100) : null;
    const flipped = item.invert ?? invert;
    const verdict: PlanTone = percent === null || percent === 0 ? 'neutral' : percent > 0 !== flipped ? 'good' : 'bad';
    return { item, percent, verdict, deviation: percent === null ? '—' : signed(percent, (value) => `${value}${NBSP}%`) };
  });
  const describe = (index: number) => {
    const row = rows[index];
    return row ? `${row.item.label}: ${factLabel.toLocaleLowerCase('ru-RU')} ${formatValue(row.item.fact)} из ${formatValue(row.item.plan)}, ${row.deviation}` : '';
  };
  const { active, setActive, plot } = useStepper(data.length, describe);
  const current = active === null ? undefined : rows[active];
  const height = data.length * PF_ROW;
  const table: ChartTable = {
    rowHeader: 'Направление',
    columns: [factLabel, planLabel, 'Отклонение'],
    rows: rows.map((row) => ({ header: row.item.label, cells: [formatValue(row.item.fact), formatValue(row.item.plan), row.deviation] })),
  };

  return (
    <ChartFrame slot="plan-fact-chart" className={className} rest={props}>
      <ChartPlot ref={ref} aria-label={label} table={table} {...plot}>
        <svg aria-hidden width={width} height={height} className="block overflow-visible">
          {active !== null ? <RowHighlight top={active * PF_ROW} height={PF_ROW} width={width} /> : null}
          {rows.map(({ item, percent, verdict, deviation }, i) => {
            const middle = i * PF_ROW + PF_ROW / 2;
            const colors = PLAN_TONES[verdict];
            const target = x(item.plan);
            const fact = x(item.fact);
            return (
              <g key={`${item.label}-${i}`} data-index={i}>
                <text x={0} y={middle} dominantBaseline="middle" className="fill-fg-1 text-label-sm font-medium">
                  {fitText(item.label, labelWidth - 8, LABEL_MEDIUM_FONT)}
                </text>
                <rect x={labelWidth} y={middle - 10} width={Math.max(0, target - labelWidth)} height={20} className="fill-fill-2" />
                <path
                  data-slot="plan-fact-bar"
                  data-start={labelWidth}
                  data-end={fact}
                  d={hBarPath(labelWidth, fact, middle - 6, 12, 3)}
                  fill={UP}
                  style={growFrom(labelWidth, i)}
                  className={GROW}
                />
                <rect data-slot="plan-fact-target" data-x={target} x={target - 1} y={middle - 14} width={2} height={28} className="fill-fg-1" />
                {!narrow ? (
                  <text x={plotRight + 24} y={middle} dominantBaseline="middle" className="fill-fg-2 text-caption tabular-nums">
                    {`${formatValue(item.fact)} из ${formatValue(item.plan)}`}
                  </text>
                ) : null}
                <g data-slot="plan-fact-badge" data-tone={verdict} className={FADE_IN}>
                  <rect x={width - PF_BADGE} y={middle - 12} width={PF_BADGE} height={24} rx={6} fill={colors.bg} />
                  {percent !== null && percent !== 0 ? (
                    <path
                      d={percent > 0 ? `M${width - 56} ${middle + 2.5}l4 -5l4 5` : `M${width - 56} ${middle - 2.5}l4 5l4 -5`}
                      fill="none"
                      stroke={colors.fg}
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}
                  <text x={width - 8} y={middle} textAnchor="end" dominantBaseline="middle" fill={colors.fg} className="text-caption font-semibold tabular-nums">
                    {deviation}
                  </text>
                </g>
              </g>
            );
          })}
          <line x1={labelWidth} x2={labelWidth} y1={0} y2={height} stroke="var(--color-border)" shapeRendering="crispEdges" />
          <g onPointerLeave={() => setActive(null)}>
            {rows.map(({ item }, i) => (
              <RowHit key={`${item.label}-${i}`} index={i} top={i * PF_ROW} height={PF_ROW} width={width} onActive={setActive} />
            ))}
          </g>
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={Math.max(x(current.item.fact), x(current.item.plan))}
            y={tooltipY(active * PF_ROW + 4, (active + 1) * PF_ROW - 4, 3, height)}
            width={width}
            title={current.item.label}
            rows={[
              { name: factLabel, value: formatValue(current.item.fact), color: UP },
              { name: planLabel, value: formatValue(current.item.plan), color: 'var(--color-fill-3)' },
              { name: 'Отклонение', value: current.deviation },
            ]}
          />
        ) : null}
      </ChartPlot>
    </ChartFrame>
  );
}
