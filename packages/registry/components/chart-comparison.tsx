import { useState, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
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
  fitText,
  linePath,
  measureText,
  niceExtentTicks,
  niceTicks,
  polar,
  seriesColor,
  stepIndex,
  useHiddenSeries,
  useWidth,
} from '../lib/chart-kit';
import { cn } from '../lib/cn';
import type { ChartSeries } from './chart';

/* Comparison of magnitudes, «how much?»: bars, groups, stacks, bullet, lollipop, Cleveland dots, radar,
   parallel coordinates, isotype, proportional areas and radial bars. */

const ROW = 30;
const ARROWS: Readonly<Record<string, string>> = { ArrowDown: 'ArrowRight', ArrowUp: 'ArrowLeft' };

const GROW_X =
  'origin-left [transform-box:fill-box] transition-[scale] duration-(--duration-slow) ease-standard starting:scale-x-0 motion-reduce:transition-none';
const GROW_Y =
  'origin-bottom [transform-box:fill-box] transition-[scale] duration-(--duration-slow) ease-standard starting:scale-y-0 motion-reduce:transition-none';
const REVEAL =
  'transition-[clip-path] duration-(--duration-deliberate) ease-out [clip-path:inset(-12px_-12px_-12px_-12px)] starting:[clip-path:inset(-12px_100%_-12px_-12px)] motion-reduce:transition-none';
const FADE = 'transition-opacity duration-(--duration-slow) ease-out starting:opacity-0 motion-reduce:transition-none';
const DIM = 'transition-opacity duration-(--duration-quick)';
const delay = (index: number, step = 35) => ({ transitionDelay: `${index * step}ms` });

/** Canvas font of a label: 13 regular for categories, heavier for values and focus names. */
const font = (size: 12 | 13, weight: 400 | 500 | 600 = 400) => `${weight} ${size}px Inter, sans-serif`;

/** Category column on the left: fits the longest label, at most 40 % of the width. */
const labelColumn = (labels: readonly string[], width: number, cap = 188) =>
  Math.round(Math.max(64, Math.min(cap, width * 0.4, Math.max(0, ...labels.map((text) => measureText(text, font(13)))) + 24)));

/** Fewer ticks on narrow plots so the horizontal axis labels never touch: one interval per 64px, two to four. */
const intervalsFor = (px: number) => Math.max(2, Math.min(4, Math.floor(px / 64)));

/** «+0,8», «−0,1»: the sign is always written. */
const signed = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumber(Math.abs(value))}`;

/** Horizontal bar with the far end rounded. */
function barPath(left: number, top: number, length: number, thickness: number, radius = 4): string {
  const r = Math.max(0, Math.min(radius, thickness / 2, length));
  const right = left + length;
  const bottom = top + thickness;
  return `M${left} ${top}H${right - r}Q${right} ${top} ${right} ${top + r}V${bottom - r}Q${right} ${bottom} ${right - r} ${bottom}H${left}Z`;
}

/** Active item for pointer and keys: ← → ↑ ↓ Home End move it, the live region reads it, blur clears it. */
function useStepper(count: number, describe: (index: number) => string) {
  const [active, setActive] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = stepIndex(ARROWS[event.key] ?? event.key, active, count);
    if (index === null) return;
    event.preventDefault();
    setActive(index);
    setSpoken(describe(index));
  };
  return { active: active !== null && active < count ? active : null, setActive, spoken, onKeyDown, onBlur: () => setActive(null) };
}

/** Series with palette colours, legend toggles and legend-hover dimming. */
function useSeries(series: readonly ChartSeries[], palette?: readonly string[]) {
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const colored = series.map((item, index) => ({ ...item, color: item.color ?? palette?.[index] ?? seriesColor(index) }));
  const shown = colored.filter((item) => !hidden.has(item.name));
  const dim = (name: string) => (hovered !== null && hovered !== name ? 0.3 : 1);
  return { colored, shown, hidden, toggle, setHovered, dim };
}

interface BottomAxisProps {
  ticks: readonly number[];
  x: (value: number) => number;
  top: number;
  bottom: number;
  format: (value: number) => string;
}

/** Value axis under horizontal charts: vertical grid in separator, zero in border, labels 12 fg-3. */
function BottomAxis({ ticks, x, top, bottom, format }: BottomAxisProps) {
  return (
    <g data-slot="chart-axis">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={x(tick)} x2={x(tick)} y1={top} y2={bottom} stroke={tick === 0 ? 'var(--color-border)' : 'var(--color-separator)'} shapeRendering="crispEdges" />
          <text x={x(tick)} y={bottom + 18} textAnchor="middle" className="fill-fg-3 text-caption tabular-nums">
            {format(tick)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Category label right-aligned to the column, 13 fg-2. */
function RowLabel({ text, column, y }: { text: string; column: number; y: number }) {
  return (
    <text x={column - 12} y={y} textAnchor="end" dominantBaseline="middle" className="fill-fg-2 text-body-xs">
      {fitText(text, column - 16, font(13))}
    </text>
  );
}

/** Hover band behind the active row or column. */
function Band({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  return <rect x={x} y={y} width={width} height={height} rx={8} className="fill-fill-1" />;
}

const sortByValue = <T extends { value: number }>(data: readonly T[], sort: boolean): readonly T[] => (sort ? [...data].sort((a, b) => b.value - a.value) : data);

export interface ComparisonDatum {
  label: string;
  value: number;
  color?: string;
}

interface RowChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the chart shows; screen readers also get the data as a table. */
  'aria-label': string;
  data: readonly ComparisonDatum[];
  /** Name of the measure in the tooltip and the table header: «Выручка». */
  name?: string;
  formatValue?: (value: number) => string;
  /** Largest first (default); off keeps the given order, e.g. funnel stages. */
  sort?: boolean;
  /** One hue for every row: rows compare by length, not colour. */
  color?: string;
}

/* ---------- 2. Horizontal bars ---------- */

export type HorizontalBarChartProps = RowChartProps;

/** Bars 16 in rows of 30 from one zero line; category right-aligned on the left, value at the end. */
export function HorizontalBarChart({
  data,
  name = 'Значение',
  formatValue = formatNumber,
  sort = true,
  color = CHART_COLORS[0],
  className,
  'aria-label': label,
  ...props
}: HorizontalBarChartProps) {
  const [ref, width] = useWidth(560);
  const rows = sortByValue(data, sort);
  const column = labelColumn(rows.map((row) => row.label), width);
  const reserve = Math.max(0, ...rows.map((row) => measureText(formatValue(row.value)))) + 12;
  const plotW = Math.max(1, width - column - reserve);
  const max = Math.max(0, ...rows.map((row) => row.value));
  const length = (value: number) => (max > 0 ? (Math.max(0, value) / max) * plotW : 0);
  const { active, setActive, spoken, onKeyDown, onBlur } = useStepper(rows.length, (i) => `${rows[i]?.label ?? ''}: ${formatValue(rows[i]?.value ?? 0)}`);
  const current = active !== null ? rows[active] : undefined;

  return (
    <div data-slot="horizontal-bar-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{ rowHeader: 'Категория', columns: [name], rows: rows.map((row) => ({ header: row.label, cells: [formatValue(row.value)] })) }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={width} height={rows.length * ROW} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {active !== null ? <Band x={0} y={active * ROW} width={width} height={ROW} /> : null}
          <line x1={column + 0.5} x2={column + 0.5} y1={0} y2={rows.length * ROW} stroke="var(--color-border)" />
          {rows.map((row, i) => {
            const top = i * ROW;
            const size = length(row.value);
            return (
              <g key={row.label}>
                <RowLabel text={row.label} column={column} y={top + ROW / 2} />
                <path
                  data-slot="chart-bar"
                  data-label={row.label}
                  data-length={size}
                  data-thickness={16}
                  d={barPath(column, top + 7, size, 16)}
                  fill={row.color ?? color}
                  className={GROW_X}
                  style={delay(i)}
                />
                <text x={column + size + 8} y={top + ROW / 2} dominantBaseline="middle" className={cn('fill-fg-1 text-caption tabular-nums', FADE)}>
                  {formatValue(row.value)}
                </text>
                <rect data-slot="chart-hit" x={0} y={top} width={width} height={ROW} fill="transparent" onPointerEnter={() => setActive(i)} />
              </g>
            );
          })}
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={column + length(current.value)}
            width={width}
            y={active * ROW}
            placement="above"
            title={current.label}
            rows={[{ name, value: formatValue(current.value), color: current.color ?? color }]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- 3. Grouped columns and bars ---------- */

interface SeriesChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  /** Categories or periods, one per value. */
  labels: readonly string[];
  series: readonly ChartSeries[];
  /** Tooltip titles per category: «III квартал 2026» (default: the label). */
  tooltipLabels?: readonly string[];
  formatValue?: (value: number) => string;
  /** Legend above the plot; on by default for several series. Clicking a series hides it. */
  legend?: boolean;
}

export interface GroupedBarChartProps extends SeriesChartProps {
  /** Columns over periods, or bars for long category names. */
  orientation?: 'vertical' | 'horizontal';
  /** Plot height of columns, px, without axis labels. */
  height?: number;
  /** Short note over a group, e.g. «идёт» for an unfinished quarter. */
  notes?: readonly (string | undefined)[];
}

const COLUMN_MARGIN = { top: 8, right: 8, bottom: 28, left: 48 };

/** Columns 24 (bars 12) with a 2px gap inside the group, groups centred in their band; up to three series read well. */
export function GroupedBarChart({
  labels,
  series,
  orientation = 'vertical',
  tooltipLabels,
  formatValue = formatNumber,
  height = 200,
  legend,
  notes,
  className,
  'aria-label': label,
  ...props
}: GroupedBarChartProps) {
  const [ref, width] = useWidth(560);
  const { colored, shown, hidden, toggle, setHovered, dim } = useSeries(series);
  const n = labels.length;
  const k = Math.max(1, shown.length);
  const horizontalW = width - labelColumn(labels, width) - 24;
  const ticks = niceTicks(Math.max(0, ...shown.flatMap((item) => item.values)), orientation === 'horizontal' ? intervalsFor(horizontalW) : 4);
  const top = ticks[ticks.length - 1] ?? 1;
  const title = (i: number) => tooltipLabels?.[i] ?? labels[i] ?? '';
  const describe = (i: number) => `${title(i)}: ${shown.map((item) => `${item.name} ${formatValue(item.values[i] ?? 0)}`).join(', ')}`;
  const { active, setActive, spoken, onKeyDown, onBlur } = useStepper(n, describe);
  const lastShown = shown[shown.length - 1];

  let plot: ReactNode;
  let anchor = { x: 0, y: 4 };
  if (orientation === 'horizontal') {
    const thickness = 12;
    const group = k * thickness + (k - 1) * 2;
    const rowH = Math.max(ROW, group + 14);
    const column = labelColumn(labels, width);
    const plotW = Math.max(1, width - column - 24);
    const x = (value: number) => column + (Math.max(0, value) / top) * plotW;
    if (active !== null) anchor = { x: x(Math.max(0, ...shown.map((item) => item.values[active] ?? 0))), y: active * rowH };
    plot = (
      <svg aria-hidden width={width} height={n * rowH + 24} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
        {active !== null ? <Band x={0} y={active * rowH} width={width} height={rowH} /> : null}
        <BottomAxis ticks={ticks} x={x} top={0} bottom={n * rowH} format={formatAxisValue} />
        {labels.map((text, i) => (
          <RowLabel key={i} text={text} column={column} y={i * rowH + rowH / 2} />
        ))}
        {shown.map((item, j) => (
          <g key={item.name} opacity={dim(item.name)} className={DIM}>
            {labels.map((_, i) => {
              const size = x(item.values[i] ?? 0) - column;
              const y = i * rowH + (rowH - group) / 2 + j * (thickness + 2);
              return (
                <path
                  key={i}
                  data-slot="chart-bar"
                  data-series={item.name}
                  data-index={i}
                  data-x={column}
                  data-y={y}
                  data-length={size}
                  data-thickness={thickness}
                  d={barPath(column, y, size, thickness, 3)}
                  fill={item.color}
                  className={GROW_X}
                  style={delay(i)}
                />
              );
            })}
          </g>
        ))}
        {lastShown
          ? notes?.map((note, i) =>
              note ? (
                <text
                  key={i}
                  data-slot="chart-note"
                  x={x(lastShown.values[i] ?? 0) + 8}
                  y={i * rowH + (rowH + group) / 2 - thickness / 2}
                  dominantBaseline="middle"
                  className="fill-fg-3 text-[11px]"
                >
                  {note}
                </text>
              ) : null,
            )
          : null}
        {labels.map((_, i) => (
          <rect key={i} data-slot="chart-hit" x={0} y={i * rowH} width={width} height={rowH} fill="transparent" onPointerEnter={() => setActive(i)} />
        ))}
      </svg>
    );
  } else {
    const margin = { ...COLUMN_MARGIN, top: COLUMN_MARGIN.top + (notes ? 16 : 0) };
    const plotW = Math.max(1, width - margin.left - margin.right);
    const band = n > 0 ? plotW / n : plotW;
    const thickness = Math.max(4, Math.min(24, (band * 0.8 - 2 * (k - 1)) / k));
    const group = k * thickness + (k - 1) * 2;
    const center = (i: number) => margin.left + (i + 0.5) * band;
    const left = (i: number, j: number) => center(i) - group / 2 + j * (thickness + 2);
    const y = (value: number) => margin.top + height - (Math.max(0, value) / top) * height;
    const baseline = y(0);
    const stride = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 72))));
    if (active !== null) anchor = { x: center(active) + group / 2, y: 4 };
    plot = (
      <svg aria-hidden width={width} height={height + margin.top + margin.bottom} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
        <ValueAxis ticks={ticks} y={y} left={margin.left} right={margin.left + plotW} />
        {labels.map((text, i) =>
          i % stride === 0 ? (
            <text key={i} x={center(i)} y={baseline + 20} textAnchor="middle" className="fill-fg-3 text-caption">
              {text}
            </text>
          ) : null,
        )}
        {active !== null ? <Band x={center(active) - band / 2} y={margin.top} width={band} height={height} /> : null}
        {shown.map((item, j) => (
          <g key={item.name} opacity={dim(item.name)} className={DIM}>
            {labels.map((_, i) => {
              const value = item.values[i] ?? 0;
              return (
                <path
                  key={i}
                  data-slot="chart-bar"
                  data-series={item.name}
                  data-index={i}
                  data-x={left(i, j)}
                  data-y={y(value)}
                  data-length={baseline - y(value)}
                  data-thickness={thickness}
                  d={columnPath(left(i, j), y(value), thickness, baseline)}
                  fill={item.color}
                  className={GROW_Y}
                  style={delay(i)}
                />
              );
            })}
          </g>
        ))}
        {lastShown
          ? notes?.map((note, i) =>
              note ? (
                <text key={i} data-slot="chart-note" x={left(i, shown.length - 1) + thickness / 2} y={y(lastShown.values[i] ?? 0) - 8} textAnchor="middle" className="fill-fg-3 text-[11px]">
                  {note}
                </text>
              ) : null,
            )
          : null}
        {labels.map((_, i) => (
          <rect key={i} data-slot="chart-hit" x={center(i) - band / 2} y={margin.top} width={band} height={height} fill="transparent" onPointerEnter={() => setActive(i)} />
        ))}
      </svg>
    );
  }

  return (
    <div data-slot="grouped-bar-chart" data-orientation={orientation} className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? series.length > 1) ? <ChartLegend items={colored} marker="square" hidden={hidden} onToggle={toggle} onHover={setHovered} /> : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Категория',
          columns: colored.map((item) => item.name),
          rows: labels.map((_, i) => ({ header: title(i), cells: colored.map((item) => formatValue(item.values[i] ?? 0)) })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        {plot}
        {active !== null && shown.length > 0 ? (
          <ChartTooltip
            x={anchor.x}
            width={width}
            y={anchor.y}
            placement={orientation === 'horizontal' ? 'above' : 'below'}
            title={title(active)}
            rows={shown.map((item) => ({ name: item.name, color: item.color, value: formatValue(item.values[active] ?? 0) }))}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- 4. Stacked columns ---------- */

export interface StackedBarChartProps extends SeriesChartProps {
  /** Plot height, px, without axis labels. */
  height?: number;
  /** Total over each column (default on). */
  totals?: boolean;
  /** Format of the totals: «1,28» for millions (default: formatValue). */
  formatTotal?: (value: number) => string;
}

const STACK_MARGIN = { top: 20, right: 8, bottom: 28, left: 64 };

/** Columns 24 of stacked segments split by 2px of surface; only the top segment is rounded, the total sits above in 11 fg-2. */
export function StackedBarChart({
  labels,
  series,
  tooltipLabels,
  formatValue = formatNumber,
  formatTotal = formatValue,
  height = 200,
  totals = true,
  legend,
  className,
  'aria-label': label,
  ...props
}: StackedBarChartProps) {
  const [ref, width] = useWidth(560);
  const { colored, shown, hidden, toggle, setHovered, dim } = useSeries(series);
  const n = labels.length;
  const sums = labels.map((_, i) => shown.reduce((sum, item) => sum + Math.max(0, item.values[i] ?? 0), 0));
  const ticks = niceTicks(Math.max(0, ...sums));
  const top = ticks[ticks.length - 1] ?? 1;
  const plotW = Math.max(1, width - STACK_MARGIN.left - STACK_MARGIN.right);
  const band = n > 0 ? plotW / n : plotW;
  const thickness = Math.max(4, Math.min(24, band * 0.6));
  const center = (i: number) => STACK_MARGIN.left + (i + 0.5) * band;
  const y = (value: number) => STACK_MARGIN.top + height - (value / top) * height;
  const baseline = y(0);
  const stride = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 72))));
  const title = (i: number) => tooltipLabels?.[i] ?? labels[i] ?? '';
  const describe = (i: number) =>
    `${title(i)}: ${shown.map((item) => `${item.name} ${formatValue(item.values[i] ?? 0)}`).join(', ')}, всего ${formatTotal(sums[i] ?? 0)}`;
  const { active, setActive, spoken, onKeyDown, onBlur } = useStepper(n, describe);

  return (
    <div data-slot="stacked-bar-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? series.length > 1) ? <ChartLegend items={colored} marker="square" hidden={hidden} onToggle={toggle} onHover={setHovered} /> : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Период',
          columns: [...colored.map((item) => item.name), 'Всего'],
          rows: labels.map((_, i) => ({
            header: title(i),
            cells: [...colored.map((item) => formatValue(item.values[i] ?? 0)), formatTotal(colored.reduce((sum, item) => sum + Math.max(0, item.values[i] ?? 0), 0))],
          })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={width} height={height + STACK_MARGIN.top + STACK_MARGIN.bottom} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          <ValueAxis ticks={ticks} y={y} left={STACK_MARGIN.left} right={STACK_MARGIN.left + plotW} />
          {labels.map((text, i) =>
            i % stride === 0 ? (
              <text key={i} x={center(i)} y={baseline + 20} textAnchor="middle" className="fill-fg-3 text-caption">
                {text}
              </text>
            ) : null,
          )}
          {active !== null ? <Band x={center(active) - band / 2} y={STACK_MARGIN.top - 16} width={band} height={height + 16} /> : null}
          {labels.map((_, i) => {
            const x = center(i) - thickness / 2;
            const last = shown.findLast((item) => (item.values[i] ?? 0) > 0);
            let sum = 0;
            return (
              <g key={i} className={GROW_Y} style={delay(i)}>
                {shown.map((item) => {
                  const value = Math.max(0, item.values[i] ?? 0);
                  if (value === 0) return null;
                  const bottom = y(sum) - (sum > 0 ? 2 : 0);
                  sum += value;
                  const segmentTop = y(sum);
                  const isTop = item === last;
                  return (
                    <path
                      key={item.name}
                      data-slot="chart-bar"
                      data-series={item.name}
                      data-index={i}
                      data-top={isTop}
                      data-y={segmentTop}
                      data-length={bottom - segmentTop}
                      data-thickness={thickness}
                      d={isTop ? columnPath(x, segmentTop, thickness, bottom) : `M${x} ${bottom}V${segmentTop}H${x + thickness}V${bottom}Z`}
                      fill={item.color}
                      opacity={dim(item.name)}
                      className={DIM}
                    />
                  );
                })}
              </g>
            );
          })}
          {totals
            ? sums.map((sum, i) =>
                sum > 0 ? (
                  <text key={i} data-slot="chart-total" x={center(i)} y={y(sum) - 6} textAnchor="middle" className={cn('fill-fg-2 text-[11px] tabular-nums', FADE)}>
                    {formatTotal(sum)}
                  </text>
                ) : null,
              )
            : null}
          {labels.map((_, i) => (
            <rect
              key={i}
              data-slot="chart-hit"
              x={center(i) - band / 2}
              y={STACK_MARGIN.top - 16}
              width={band}
              height={height + 16}
              fill="transparent"
              onPointerEnter={() => setActive(i)}
            />
          ))}
        </svg>
        {active !== null && shown.length > 0 ? (
          <ChartTooltip
            x={center(active) + thickness / 2}
            width={width}
            title={title(active)}
            rows={shown.map((item) => ({ name: item.name, color: item.color, value: formatValue(item.values[active] ?? 0) }))}
            total={formatTotal(sums[active] ?? 0)}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- 7. Bullet ---------- */

export interface BulletDatum {
  label: string;
  /** «млн ₽», «шт», «%». */
  unit?: string;
  value: number;
  target: number;
  /** Zone bounds from bad to good, ascending; the last one ends the scale. */
  ranges: readonly number[];
  /** Number format of this row (default: the chart's formatValue). */
  format?: (value: number) => string;
}

export interface BulletChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  data: readonly BulletDatum[];
  formatValue?: (value: number) => string;
}

/** Darker is worse: border → fill-2 → fill-1. */
const ZONE_COLORS = ['var(--color-border)', 'var(--color-fill-2)', 'var(--color-fill-1)'];

/** Fact against target on one row: zones 24 high, measure 8 in chart-1, target a 2×28 stroke in fg-1; length instead of a speedometer angle. */
export function BulletChart({ data, formatValue = formatNumber, className, 'aria-label': label, ...props }: BulletChartProps) {
  const [ref, width] = useWidth(560);
  // below 440 the label and numbers move above the track
  const narrow = width < 440;
  const pitch = narrow ? 64 : 52;
  const trackLeft = narrow ? 0 : 150;
  const track = Math.max(1, (narrow ? width : width - 94) - trackLeft);
  const format = (row: BulletDatum) => row.format ?? formatValue;
  const completion = (row: BulletDatum) => formatPercent(row.target > 0 ? row.value / row.target : 0);
  const describe = (i: number) => {
    const row = data[i];
    if (!row) return '';
    const fmt = format(row);
    return `${row.label}: ${fmt(row.value)}${row.unit ? ` ${row.unit}` : ''}, цель ${fmt(row.target)}, выполнено ${completion(row)}`;
  };
  const { active, setActive, spoken, onKeyDown, onBlur } = useStepper(data.length, describe);
  const scale = (row: BulletDatum) => {
    const max = Math.max(0, row.value, row.target, ...row.ranges) || 1;
    return (value: number) => trackLeft + (Math.max(0, value) / max) * track;
  };
  const current = active !== null ? data[active] : undefined;

  return (
    <div data-slot="bullet-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Показатель',
          columns: ['Факт', 'Цель', 'Выполнено'],
          rows: data.map((row) => ({ header: row.unit ? `${row.label}, ${row.unit}` : row.label, cells: [format(row)(row.value), format(row)(row.target), completion(row)] })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={width} height={Math.max(0, data.length * pitch - 8)} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {active !== null ? <Band x={-8} y={active * pitch - 4} width={width + 16} height={pitch} /> : null}
          {data.map((row, i) => {
            const top = i * pitch;
            const x = scale(row);
            const fmt = format(row);
            const zoneTop = top + (narrow ? 24 : 10);
            const bounds = [...row.ranges].sort((a, b) => a - b);
            const value = fmt(row.value);
            return (
              <g key={row.label}>
                {narrow ? (
                  <>
                    <text x={0} y={top + 14} className="fill-fg-1 text-body-xs font-medium">
                      {fitText(row.label, width * 0.5, font(13, 500))}
                      {row.unit ? <tspan className="fill-fg-3 font-normal">{` · ${row.unit}`}</tspan> : null}
                    </text>
                    <text x={width} y={top + 14} textAnchor="end" className="fill-fg-1 text-body-xs font-semibold tabular-nums">
                      {value}
                    </text>
                    <text x={width - measureText(value, font(13, 600)) - 8} y={top + 14} textAnchor="end" className="fill-fg-3 text-caption tabular-nums">
                      {`цель ${fmt(row.target)}`}
                    </text>
                  </>
                ) : (
                  <>
                    <text x={0} y={top + 20} className="fill-fg-1 text-body-xs font-medium">
                      {fitText(row.label, trackLeft - 12, font(13, 500))}
                    </text>
                    {row.unit ? (
                      <text x={0} y={top + 37} className="fill-fg-3 text-caption">
                        {row.unit}
                      </text>
                    ) : null}
                    <text x={width} y={top + 20} textAnchor="end" className="fill-fg-1 text-body-xs font-semibold tabular-nums">
                      {value}
                    </text>
                    <text x={width} y={top + 37} textAnchor="end" className="fill-fg-3 text-caption tabular-nums">
                      {`цель ${fmt(row.target)}`}
                    </text>
                  </>
                )}
                {bounds.map((bound, j) => {
                  const from = x(bounds[j - 1] ?? 0);
                  return (
                    <rect
                      key={j}
                      data-slot="chart-zone"
                      data-x={from}
                      data-length={x(bound) - from}
                      x={from}
                      y={zoneTop}
                      width={Math.max(0, x(bound) - from)}
                      height={24}
                      fill={ZONE_COLORS[Math.min(j, ZONE_COLORS.length - 1)]}
                    />
                  );
                })}
                <path
                  data-slot="chart-bar"
                  data-length={x(row.value) - trackLeft}
                  data-thickness={8}
                  d={barPath(trackLeft, zoneTop + 8, x(row.value) - trackLeft, 8, 2)}
                  fill={CHART_COLORS[0]}
                  className={GROW_X}
                  style={delay(i, 60)}
                />
                <rect data-slot="chart-target" data-x={x(row.target)} x={x(row.target) - 1} y={zoneTop - 2} width={2} height={28} className={cn('fill-fg-1', FADE)} />
                <rect data-slot="chart-hit" x={-8} y={top - 4} width={width + 16} height={pitch} fill="transparent" onPointerEnter={() => setActive(i)} />
              </g>
            );
          })}
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={scale(current)(Math.max(current.value, current.target))}
            width={width}
            y={active * pitch - 4}
            placement="above"
            title={current.unit ? `${current.label}, ${current.unit}` : current.label}
            rows={[
              { name: 'Факт', value: format(current)(current.value), color: CHART_COLORS[0] },
              { name: 'Цель', value: format(current)(current.target), color: 'var(--color-fg-1)' },
              { name: 'Выполнено', value: completion(current) },
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- 5. Lollipop ---------- */

export interface LollipopChartProps extends RowChartProps {
  /** Axis labels (default: «80 тыс», «1,5 млн»). */
  formatAxis?: (value: number) => string;
}

/** Stem 2 and a 10px dot with a surface ring, always from zero; lighter than bars when categories are many and values close. */
export function LollipopChart({
  data,
  name = 'Значение',
  formatValue = formatNumber,
  formatAxis = formatAxisValue,
  sort = true,
  color = CHART_COLORS[0],
  className,
  'aria-label': label,
  ...props
}: LollipopChartProps) {
  const [ref, width] = useWidth(560);
  const rows = sortByValue(data, sort);
  const column = labelColumn(rows.map((row) => row.label), width);
  const ticks = niceTicks(Math.max(0, ...rows.map((row) => row.value)), intervalsFor(width - column - 48));
  const top = ticks[ticks.length - 1] ?? 1;
  const reserve = Math.max(measureText(formatAxis(top)) / 2 + 2, Math.max(0, ...rows.map((row) => measureText(formatValue(row.value)))) + 18);
  const plotW = Math.max(1, width - column - reserve);
  const x = (value: number) => column + (Math.max(0, value) / top) * plotW;
  const bottom = rows.length * ROW;
  const { active, setActive, spoken, onKeyDown, onBlur } = useStepper(rows.length, (i) => `${rows[i]?.label ?? ''}: ${formatValue(rows[i]?.value ?? 0)}`);
  const current = active !== null ? rows[active] : undefined;

  return (
    <div data-slot="lollipop-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{ rowHeader: 'Категория', columns: [name], rows: rows.map((row) => ({ header: row.label, cells: [formatValue(row.value)] })) }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={width} height={bottom + 24} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {active !== null ? <Band x={0} y={active * ROW} width={width} height={ROW} /> : null}
          <BottomAxis ticks={ticks} x={x} top={0} bottom={bottom} format={formatAxis} />
          {rows.map((row, i) => (
            <RowLabel key={row.label} text={row.label} column={column} y={i * ROW + ROW / 2} />
          ))}
          <g className={REVEAL}>
            {rows.map((row, i) => {
              const cy = i * ROW + ROW / 2;
              return (
                <g key={row.label}>
                  <line data-slot="chart-stem" x1={column} x2={x(row.value)} y1={cy} y2={cy} stroke={row.color ?? color} strokeWidth={2} />
                  <circle
                    data-slot="chart-dot"
                    data-label={row.label}
                    cx={x(row.value)}
                    cy={cy}
                    r={5}
                    fill={row.color ?? color}
                    stroke="var(--color-surface-1)"
                    strokeWidth={2}
                  />
                  <text x={x(row.value) + 12} y={cy} dominantBaseline="middle" className="fill-fg-1 text-caption tabular-nums">
                    {formatValue(row.value)}
                  </text>
                </g>
              );
            })}
          </g>
          {rows.map((row, i) => (
            <rect key={row.label} data-slot="chart-hit" x={0} y={i * ROW} width={width} height={ROW} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {current && active !== null ? (
          <ChartTooltip
            x={x(current.value)}
            width={width}
            y={active * ROW}
            placement="above"
            title={current.label}
            marker="dot"
            rows={[{ name, value: formatValue(current.value), color: current.color ?? color }]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- 6. Cleveland dot plot ---------- */

export interface ClevelandDotChartProps extends SeriesChartProps {
  /** Format of the signed difference between two series (default «+0,8»). */
  formatDelta?: (value: number) => string;
  formatAxis?: (value: number) => string;
}

/** «Before — after» per row: the past in fg-4, the present in chart-1, a 4px border bridge and the signed difference. The scale need not start at zero. */
export function ClevelandDotChart({
  labels,
  series,
  tooltipLabels,
  formatValue = formatNumber,
  formatDelta = signed,
  formatAxis = formatAxisValue,
  legend,
  className,
  'aria-label': label,
  ...props
}: ClevelandDotChartProps) {
  const [ref, width] = useWidth(560);
  const { colored, shown, hidden, toggle, setHovered, dim } = useSeries(series, series.length === 2 ? ['var(--color-fg-4)', seriesColor(0)] : undefined);
  const values = shown.flatMap((item) => item.values);
  const column = labelColumn(labels, width);
  const ticks = values.length > 0 ? niceExtentTicks(Math.min(...values), Math.max(...values), intervalsFor(width - column - 48)) : [0, 1];
  const lo = ticks[0] ?? 0;
  const hi = ticks[ticks.length - 1] ?? 1;
  const paired = shown.length === 2;
  const delta = (i: number) => (shown[1]?.values[i] ?? 0) - (shown[0]?.values[i] ?? 0);
  const reserve = Math.max(measureText(formatAxis(hi)) / 2 + 2, paired ? Math.max(0, ...labels.map((_, i) => measureText(formatDelta(delta(i)), font(12, 600)))) + 18 : 8);
  const plotW = Math.max(1, width - column - reserve);
  const x = (value: number) => column + ((value - lo) / (hi - lo || 1)) * plotW;
  const bottom = labels.length * ROW;
  const title = (i: number) => tooltipLabels?.[i] ?? labels[i] ?? '';
  const describe = (i: number) =>
    `${title(i)}: ${shown.map((item) => `${item.name} ${formatValue(item.values[i] ?? 0)}`).join(', ')}${paired ? `, разница ${formatDelta(delta(i))}` : ''}`;
  const { active, setActive, spoken, onKeyDown, onBlur } = useStepper(labels.length, describe);
  const right = (i: number) => x(Math.max(lo, ...shown.map((item) => item.values[i] ?? lo)));
  const pairTable = colored.length === 2;

  return (
    <div data-slot="cleveland-dot-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? series.length > 1) ? <ChartLegend items={colored} marker="dot" hidden={hidden} onToggle={toggle} onHover={setHovered} /> : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Категория',
          columns: [...colored.map((item) => item.name), ...(pairTable ? ['Разница'] : [])],
          rows: labels.map((_, i) => ({
            header: title(i),
            cells: [
              ...colored.map((item) => formatValue(item.values[i] ?? 0)),
              ...(pairTable ? [formatDelta((colored[1]?.values[i] ?? 0) - (colored[0]?.values[i] ?? 0))] : []),
            ],
          })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={width} height={bottom + 24} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {active !== null ? <Band x={0} y={active * ROW} width={width} height={ROW} /> : null}
          <BottomAxis ticks={ticks} x={x} top={0} bottom={bottom} format={formatAxis} />
          {labels.map((text, i) => (
            <RowLabel key={i} text={text} column={column} y={i * ROW + ROW / 2} />
          ))}
          <g className={REVEAL}>
            {labels.map((_, i) => {
              const cy = i * ROW + ROW / 2;
              const xs = shown.map((item) => x(item.values[i] ?? lo));
              const change = delta(i);
              return (
                <g key={i}>
                  {xs.length > 1 ? (
                    <line x1={Math.min(...xs)} x2={Math.max(...xs)} y1={cy} y2={cy} stroke="var(--color-border)" strokeWidth={4} strokeLinecap="round" />
                  ) : null}
                  {shown.map((item) => (
                    <circle
                      key={item.name}
                      data-slot="chart-dot"
                      data-series={item.name}
                      cx={x(item.values[i] ?? lo)}
                      cy={cy}
                      r={5}
                      fill={item.color}
                      stroke="var(--color-surface-1)"
                      strokeWidth={2}
                      opacity={dim(item.name)}
                      className={DIM}
                    />
                  ))}
                  {paired ? (
                    <text
                      data-slot="chart-delta"
                      data-negative={change < 0}
                      x={right(i) + 12}
                      y={cy}
                      dominantBaseline="middle"
                      className={cn('text-caption tabular-nums', change < 0 ? 'fill-fg-2 font-semibold' : 'fill-fg-1')}
                    >
                      {formatDelta(change)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
          {labels.map((_, i) => (
            <rect key={i} data-slot="chart-hit" x={0} y={i * ROW} width={width} height={ROW} fill="transparent" onPointerEnter={() => setActive(i)} />
          ))}
        </svg>
        {active !== null && shown.length > 0 ? (
          <ChartTooltip
            x={right(active)}
            width={width}
            y={active * ROW}
            placement="above"
            title={title(active)}
            marker="dot"
            rows={[
              ...shown.map((item) => ({ name: item.name, color: item.color, value: formatValue(item.values[active] ?? 0) })),
              ...(paired ? [{ name: 'Разница', value: formatDelta(delta(active)) }] : []),
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- 8. Radar ---------- */

export interface RadarChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  /** Up to eight axes, clockwise from 12 o'clock. */
  axes: readonly string[];
  /** Up to three series, one value per axis. */
  series: readonly ChartSeries[];
  /** End of the scale (default: rounded up from the largest value). */
  max?: number;
  formatValue?: (value: number) => string;
  /** Plot height, px. */
  height?: number;
  legend?: boolean;
}

/** Profile on a polygon grid: rings in separator, the outer one in border, outlines 2 without fill, points 8 with a surface ring. */
export function RadarChart({ axes, series, max, formatValue = formatNumber, height = 300, legend, className, 'aria-label': label, ...props }: RadarChartProps) {
  const [ref, width] = useWidth(560);
  const { colored, shown, hidden, toggle, setHovered, dim } = useSeries(series);
  const m = axes.length;
  const ticks = niceTicks(max ?? Math.max(0, ...shown.flatMap((item) => item.values)));
  const top = ticks[ticks.length - 1] ?? 1;
  const angle = (i: number) => (i * 2 * Math.PI) / Math.max(1, m);
  // side labels limit the radius by their horizontal reach, top and bottom ones by height
  const fitWidth = axes.map((axis, i) => {
    const sin = Math.abs(Math.sin(angle(i)));
    return sin > 0.2 ? (width / 2 - measureText(axis, font(13, 500)) - 4) / sin - 17 : Infinity;
  });
  const radius = Math.max(40, Math.min(112, height / 2 - 38, ...fitWidth));
  const plotH = Math.min(height, 2 * radius + 76);
  const cx = width / 2;
  const cy = plotH / 2;
  const point = (i: number, value: number) => polar(cx, cy, (Math.min(top, Math.max(0, value)) / top) * radius, angle(i));
  const ring = (r: number) => `${linePath(axes.map((_, i) => polar(cx, cy, r, angle(i))))}Z`;
  const describe = (i: number) => `${axes[i] ?? ''}: ${shown.map((item) => `${item.name} ${formatValue(item.values[i] ?? 0)}`).join(', ')}`;
  const { active, setActive, spoken, onKeyDown, onBlur } = useStepper(m, describe);

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - box.left - cx;
    const dy = event.clientY - box.top - cy;
    if (m === 0 || Math.hypot(dx, dy) > radius + 24) {
      setActive(null);
      return;
    }
    const turn = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI);
    setActive(Math.round(turn / angle(1)) % m);
  };
  const anchor = active !== null ? polar(cx, cy, radius, angle(active)) : undefined;

  return (
    <div data-slot="radar-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? series.length > 1) ? <ChartLegend items={colored} marker="line" hidden={hidden} onToggle={toggle} onHover={setHovered} /> : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Ось',
          columns: colored.map((item) => item.name),
          rows: axes.map((axis, i) => ({ header: axis, cells: colored.map((item) => formatValue(item.values[i] ?? 0)) })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={width} height={plotH} className="block overflow-visible">
          <g data-slot="chart-axis">
            {ticks.slice(1).map((tick, i, rings) => (
              <path key={tick} data-slot="chart-ring" d={ring((tick / top) * radius)} fill="none" stroke={i === rings.length - 1 ? 'var(--color-border)' : 'var(--color-separator)'} />
            ))}
            {axes.map((_, i) => {
              const end = polar(cx, cy, radius, angle(i));
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={end.x}
                  y2={end.y}
                  stroke={active === i ? 'var(--color-fg-4)' : 'var(--color-separator)'}
                  strokeDasharray={active === i ? '3 3' : undefined}
                />
              );
            })}
            {ticks.map((tick, i) =>
              i > 0 && i % 2 === 0 ? (
                <text key={tick} x={cx + 4} y={cy - (tick / top) * radius + 12} className="fill-fg-3 text-[11px] tabular-nums">
                  {formatValue(tick)}
                </text>
              ) : null,
            )}
            {axes.map((axis, i) => {
              const p = polar(cx, cy, radius + 17, angle(i));
              const sin = Math.sin(angle(i));
              return (
                <text
                  key={axis}
                  x={p.x}
                  y={p.y + 4 - 3 * Math.cos(angle(i))}
                  textAnchor={sin > 0.2 ? 'start' : sin < -0.2 ? 'end' : 'middle'}
                  className="fill-fg-2 text-body-xs font-medium"
                >
                  {axis}
                </text>
              );
            })}
          </g>
          {shown.map((item) => (
            <g key={item.name} opacity={dim(item.name)} className={DIM}>
              <g
                style={{ transformOrigin: `${cx}px ${cy}px` }}
                className="transition-[scale,opacity] duration-(--duration-slow) ease-out starting:scale-0 starting:opacity-0 motion-reduce:transition-none"
              >
                <path
                  data-slot="chart-line"
                  data-series={item.name}
                  d={`${linePath(axes.map((_, i) => point(i, item.values[i] ?? 0)))}Z`}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {axes.map((_, i) => {
                  const p = point(i, item.values[i] ?? 0);
                  return (
                    <circle
                      key={i}
                      data-slot="chart-dot"
                      data-series={item.name}
                      cx={p.x}
                      cy={p.y}
                      r={active === i ? 5 : 4}
                      fill={item.color}
                      stroke="var(--color-surface-1)"
                      strokeWidth={2}
                    />
                  );
                })}
              </g>
            </g>
          ))}
          <rect data-slot="chart-hit" x={0} y={0} width={width} height={plotH} fill="transparent" onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setActive(null)} />
        </svg>
        {active !== null && anchor && shown.length > 0 ? (
          <ChartTooltip
            x={anchor.x}
            width={width}
            y={Math.max(4, anchor.y - 12)}
            title={axes[active]}
            marker="line"
            rows={shown.map((item) => ({ name: item.name, color: item.color, value: formatValue(item.values[active] ?? 0) }))}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- 9. Parallel coordinates ---------- */

export interface ParallelAxis {
  /** «Цена, тыс ₽». */
  label: string;
  /** Scale bounds (default: the data range). */
  min?: number;
  max?: number;
  /** Lower is better: the scale flips so «better» is always up; the title gets ↓. */
  invert?: boolean;
  format?: (value: number) => string;
}

export interface ParallelRow {
  name: string;
  /** One value per axis. */
  values: readonly number[];
}

export interface ParallelCoordinatesChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  axes: readonly ParallelAxis[];
  rows: readonly ParallelRow[];
  /** Rows in focus: chart-1, chart-2… with points and a name at the end; the rest are the fill-3 background. */
  highlight?: readonly string[];
  /** Legend name of the background rows. */
  othersLabel?: string;
  /** Plot height, px. */
  height?: number;
  legend?: boolean;
}

const PARALLEL = { top: 30, bottom: 12, left: 60, gap: 96 };

/** Many items over several metrics: axes in border, background lines fill-3 1.5, focus lines chart-1/2 with points; dragging along an axis filters. */
export function ParallelCoordinatesChart({
  axes,
  rows,
  highlight = [],
  othersLabel = 'Остальные',
  height = 272,
  legend,
  className,
  'aria-label': label,
  ...props
}: ParallelCoordinatesChartProps) {
  const [ref, width] = useWidth(1000);
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const [brushes, setBrushes] = useState<ReadonlyMap<number, readonly [number, number]>>(new Map());
  const [drag, setDrag] = useState<{ axis: number; from: number } | null>(null);

  const m = axes.length;
  const focus = highlight.filter((name) => rows.some((row) => row.name === name));
  const colorOf = (name: string) => seriesColor(Math.max(0, focus.indexOf(name)));
  const hasOthers = rows.some((row) => !focus.includes(row.name));
  const visible = rows.filter((row) => !hidden.has(focus.includes(row.name) ? row.name : othersLabel));
  const labelsW = Math.max(16, ...focus.map((name) => measureText(name, font(13, 600)) + 20));
  // narrow screens scroll sideways instead of crushing the axes together
  const svgW = Math.max(width, PARALLEL.left + labelsW + Math.max(0, m - 1) * PARALLEL.gap);
  const top = PARALLEL.top;
  const bottom = height - PARALLEL.bottom;
  const plotH = Math.max(1, bottom - top);
  const xs = axes.map((_, j) => PARALLEL.left + (m > 1 ? (j * (svgW - PARALLEL.left - labelsW)) / (m - 1) : 0));
  const domains = axes.map((axis, j) => {
    const column = rows.map((row) => row.values[j] ?? 0);
    const lo = axis.min ?? Math.min(...column);
    const hi = axis.max ?? Math.max(...column);
    return [lo, hi > lo ? hi : lo + 1] as const;
  });
  const domain = (j: number) => domains[j] ?? ([0, 1] as const);
  const y = (j: number, value: number) => {
    const [lo, hi] = domain(j);
    const t = (value - lo) / (hi - lo);
    return axes[j]?.invert ? top + t * plotH : bottom - t * plotH;
  };
  const valueAt = (j: number, py: number) => {
    const [lo, hi] = domain(j);
    const t = Math.min(1, Math.max(0, axes[j]?.invert ? (py - top) / plotH : (bottom - py) / plotH));
    return lo + t * (hi - lo);
  };
  const fmt = (j: number) => axes[j]?.format ?? formatNumber;
  const passes = (row: ParallelRow) => [...brushes].every(([j, [a, b]]) => (row.values[j] ?? 0) >= a && (row.values[j] ?? 0) <= b);
  const describe = (i: number) => {
    const row = visible[i];
    return row ? `${row.name}: ${axes.map((axis, j) => `${axis.label} ${fmt(j)(row.values[j] ?? 0)}`).join(', ')}` : '';
  };
  const stepper = useStepper(visible.length, describe);
  const { active, setActive } = stepper;
  const current = active !== null ? visible[active] : undefined;

  const svgY = (event: PointerEvent<Element>) => event.clientY - (event.currentTarget.closest('svg') ?? event.currentTarget).getBoundingClientRect().top;
  const brushTo = (event: PointerEvent<SVGSVGElement>, end: boolean) => {
    if (!drag) return;
    const to = valueAt(drag.axis, svgY(event));
    const [lo, hi] = domain(drag.axis);
    const next = new Map(brushes);
    // a click without a drag clears the axis filter
    if (end && Math.abs(to - drag.from) < (hi - lo) * 0.02) next.delete(drag.axis);
    else next.set(drag.axis, [Math.min(drag.from, to), Math.max(drag.from, to)]);
    setBrushes(next);
    if (end) setDrag(null);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && brushes.size > 0) {
      event.preventDefault();
      setBrushes(new Map());
      return;
    }
    stepper.onKeyDown(event);
  };
  const path = (row: ParallelRow) => linePath(axes.map((_, j) => ({ x: xs[j] ?? 0, y: y(j, row.values[j] ?? 0) })));
  const legendItems = [...focus.map((name) => ({ name, color: colorOf(name) })), ...(hasOthers ? [{ name: othersLabel, color: 'var(--color-fill-3)' }] : [])];
  const dim = (name: string) => (hovered !== null && hovered !== name ? 0.3 : 1);
  const last = m - 1;

  return (
    <div data-slot="parallel-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      {(legend ?? focus.length > 0) ? <ChartLegend items={legendItems} marker="line" hidden={hidden} onToggle={toggle} onHover={setHovered} /> : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Название',
          columns: axes.map((axis) => axis.label),
          rows: rows.map((row) => ({ header: row.name, cells: axes.map((_, j) => fmt(j)(row.values[j] ?? 0)) })),
        }}
        spoken={stepper.spoken}
        onKeyDown={onKeyDown}
        onBlur={stepper.onBlur}
        className={svgW > width ? 'overflow-x-auto' : undefined}
      >
        <svg
          aria-hidden
          width={svgW}
          height={height}
          className={cn('block', drag ? 'cursor-ns-resize select-none' : undefined)}
          onPointerMove={(event) => brushTo(event, false)}
          onPointerUp={(event) => brushTo(event, true)}
          onPointerLeave={(event) => {
            brushTo(event, true);
            setActive(null);
          }}
        >
          {axes.map((axis, j) => {
            const x = xs[j] ?? 0;
            const [lo, hi] = domain(j);
            return (
              <g key={axis.label} data-slot="chart-axis">
                <line x1={x + 0.5} x2={x + 0.5} y1={top} y2={bottom} stroke="var(--color-border)" />
                <text x={x} y={14} textAnchor="middle" className="fill-fg-1 text-caption font-semibold">
                  {axis.invert ? `${axis.label} ↓` : axis.label}
                </text>
                <text x={x - 6} y={top + 4} textAnchor="end" className="fill-fg-3 text-[11px] tabular-nums">
                  {fmt(j)(axis.invert ? lo : hi)}
                </text>
                <text x={x - 6} y={bottom + 4} textAnchor="end" className="fill-fg-3 text-[11px] tabular-nums">
                  {fmt(j)(axis.invert ? hi : lo)}
                </text>
              </g>
            );
          })}
          <g className={REVEAL}>
            {[...visible.filter((row) => !focus.includes(row.name)), ...visible.filter((row) => focus.includes(row.name))].map((row) => {
              const isFocus = focus.includes(row.name);
              const filtered = !passes(row);
              const color = isFocus ? colorOf(row.name) : 'var(--color-fill-3)';
              return (
                <g key={row.name} opacity={(filtered ? 0.25 : 1) * dim(isFocus ? row.name : othersLabel)} className={DIM}>
                  <path
                    data-slot="chart-line"
                    data-series={row.name}
                    data-highlight={isFocus}
                    data-filtered={filtered}
                    d={path(row)}
                    fill="none"
                    stroke={color}
                    strokeWidth={isFocus ? 2 : 1.5}
                    strokeLinejoin="round"
                  />
                  {isFocus ? (
                    <>
                      {axes.map((_, j) => (
                        <circle
                          key={j}
                          data-slot="chart-dot"
                          data-series={row.name}
                          cx={xs[j] ?? 0}
                          cy={y(j, row.values[j] ?? 0)}
                          r={4}
                          fill={color}
                          stroke="var(--color-surface-1)"
                          strokeWidth={2}
                        />
                      ))}
                      <text data-slot="chart-label" x={(xs[last] ?? 0) + 14} y={y(last, row.values[last] ?? 0) + 4} className="fill-fg-1 text-body-xs font-semibold">
                        {row.name}
                      </text>
                    </>
                  ) : null}
                </g>
              );
            })}
          </g>
          {current ? <path d={path(current)} fill="none" stroke="var(--color-fg-2)" strokeWidth={2} strokeLinejoin="round" /> : null}
          {visible.map((row, i) => (
            <path
              key={row.name}
              d={path(row)}
              fill="none"
              stroke="transparent"
              strokeWidth={10}
              onPointerEnter={() => {
                if (!drag) setActive(i);
              }}
            />
          ))}
          {[...brushes].map(([j, [a, b]]) => (
            <rect
              key={j}
              data-slot="chart-brush"
              x={(xs[j] ?? 0) - 6}
              y={Math.min(y(j, a), y(j, b))}
              width={12}
              height={Math.max(2, Math.abs(y(j, b) - y(j, a)))}
              rx={3}
              className="pointer-events-none fill-chart-1/15 stroke-chart-1"
            />
          ))}
          {axes.map((axis, j) => (
            <rect
              key={axis.label}
              data-slot="chart-brush-area"
              x={(xs[j] ?? 0) - 12}
              y={top}
              width={24}
              height={plotH}
              fill="transparent"
              className="cursor-ns-resize"
              onPointerDown={(event) => {
                event.preventDefault();
                setDrag({ axis: j, from: valueAt(j, svgY(event)) });
              }}
            />
          ))}
        </svg>
        {current ? (
          <ChartTooltip
            x={xs[Math.floor(last / 2)] ?? 0}
            width={svgW}
            y={top}
            title={current.name}
            rows={axes.map((axis, j) => ({ name: axis.label, value: fmt(j)(current.values[j] ?? 0) }))}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- 10. Isotype ---------- */

export interface IsotypeChartProps extends Omit<RowChartProps, 'sort'> {
  /** How much one icon stands for; values round to whole icons. */
  unit?: number;
  /** Key under the chart (default «Один значок — 100»). */
  unitLabel?: string;
}

const ICON_STEP = 23;
const iconPath = (x: number, y: number) => `M${x + 2.5} ${y + 4.5}a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0ZM${x} ${y + 20}v-4q0-6 7-6q7 0 7 6v4Z`;
const iconsWord = (n: number) =>
  n % 10 === 1 && n % 100 !== 11 ? 'значок' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'значка' : 'значков';

/** Rows of person icons 14×20 at a step of 23, one icon per `unit`, the exact number at the end; for reports and presentations. */
export function IsotypeChart({
  data,
  unit = 100,
  unitLabel,
  name = 'Значение',
  formatValue = (value) => value.toLocaleString('ru-RU'),
  color = CHART_COLORS[0],
  className,
  'aria-label': label,
  ...props
}: IsotypeChartProps) {
  const [ref, width] = useWidth(560);
  const column = labelColumn(data.map((row) => row.label), width, 140);
  const valueW = Math.max(0, ...data.map((row) => measureText(formatValue(row.value), font(12, 600)))) + 14;
  // long rows wrap onto more lines of icons rather than overflow
  const perLine = Math.max(1, Math.floor((width - column - valueW + ICON_STEP - 14) / ICON_STEP));
  const count = (value: number) => (unit > 0 ? Math.max(0, Math.round(value / unit)) : 0);
  const rowHeight = (lines: number) => 40 + (lines - 1) * 24;
  const layout = data.reduce<{ top: number; lines: number }[]>((acc, row) => {
    const prev = acc[acc.length - 1];
    return [...acc, { top: prev ? prev.top + rowHeight(prev.lines) : 0, lines: Math.max(1, Math.ceil(count(row.value) / perLine)) }];
  }, []);
  const end = layout[layout.length - 1];
  const total = end ? end.top + rowHeight(end.lines) : 0;
  const describe = (i: number) => {
    const row = data[i];
    return row ? `${row.label}: ${formatValue(row.value)}, ${count(row.value)} ${iconsWord(count(row.value))}` : '';
  };
  const { active, setActive, spoken, onKeyDown, onBlur } = useStepper(data.length, describe);
  const current = active !== null ? data[active] : undefined;
  const box = active !== null ? layout[active] : undefined;

  return (
    <div data-slot="isotype-chart" className={cn('flex flex-col gap-2', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Категория',
          columns: [name, 'Значков'],
          rows: data.map((row) => ({ header: row.label, cells: [formatValue(row.value), String(count(row.value))] })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={width} height={total} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {box ? <Band x={-8} y={box.top} width={width + 16} height={rowHeight(box.lines)} /> : null}
          {data.map((row, i) => {
            const { top, lines } = layout[i] ?? { top: 0, lines: 1 };
            const icons = count(row.value);
            const onLast = icons - (lines - 1) * perLine;
            return (
              <g key={row.label}>
                <text x={0} y={top + 18} dominantBaseline="middle" className="fill-fg-2 text-body-xs">
                  {fitText(row.label, column - 12, font(13))}
                </text>
                {Array.from({ length: icons }, (_, j) => (
                  <path
                    key={j}
                    data-slot="chart-icon"
                    data-label={row.label}
                    d={iconPath(column + (j % perLine) * ICON_STEP, top + 8 + Math.floor(j / perLine) * 24)}
                    fill={row.color ?? color}
                    className="transition-opacity duration-(--duration-base) ease-out starting:opacity-0 motion-reduce:transition-none"
                    style={{ transitionDelay: `${i * 60 + j * 20}ms` }}
                  />
                ))}
                <text
                  x={icons > 0 ? column + (onLast - 1) * ICON_STEP + 28 : column}
                  y={top + 18 + (lines - 1) * 24}
                  dominantBaseline="middle"
                  className={cn('fill-fg-1 text-caption font-semibold tabular-nums', FADE)}
                >
                  {formatValue(row.value)}
                </text>
                <rect data-slot="chart-hit" x={-8} y={top} width={width + 16} height={rowHeight(lines)} fill="transparent" onPointerEnter={() => setActive(i)} />
              </g>
            );
          })}
        </svg>
        {current && box ? (
          <ChartTooltip
            x={column + Math.min(count(current.value), perLine) * ICON_STEP}
            width={width}
            y={box.top}
            placement="above"
            title={current.label}
            rows={[
              { name, value: formatValue(current.value), color: current.color ?? color },
              { name: 'Значков', value: String(count(current.value)) },
            ]}
          />
        ) : null}
      </ChartPlot>
      <p data-slot="chart-caption" className="text-caption text-fg-3">
        {unitLabel ?? `Один значок — ${formatNumber(unit)}`}
      </p>
    </div>
  );
}

/* ---------- 11. Proportional areas ---------- */

export interface ProportionalDatum extends ComparisonDatum {
  /** Second line of the callout: «весь рынок». */
  description?: string;
}

export interface ProportionalAreaChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  data: readonly ProportionalDatum[];
  formatValue?: (value: number) => string;
  /** Plot height, px. */
  height?: number;
}

/** Sequential tone of the i-th of n circles, seq-1 for the largest: three circles get seq-1/3/5. */
const sequential = (i: number, n: number) => SEQUENTIAL_COLORS[n === 1 ? 2 : Math.round((i * 4) / (n - 1))] ?? CHART_COLORS[0];

/** Nested circles on a common bottom, area proportional to the value, seq-1 → seq-5 from large to small, border callouts from the top points. */
export function ProportionalAreaChart({ data, formatValue = formatNumber, height = 274, className, 'aria-label': label, ...props }: ProportionalAreaChartProps) {
  const [ref, width] = useWidth(560);
  const items = sortByValue(data, true);
  const n = items.length;
  const max = Math.max(0, ...items.map((item) => item.value));
  const title = (item: ProportionalDatum) => `${item.label} · ${formatValue(item.value)}`;
  const labelW = Math.max(0, ...items.flatMap((item) => [measureText(title(item), font(13, 600)), measureText(item.description ?? '')]));
  const radius = Math.max(16, Math.min(120, (height - 34) / 2, (width - labelW - 44) / 2));
  const pad = Math.min(30, Math.max(2, width - 2 * radius - 82 - labelW));
  const cx = pad + radius;
  const lineEnd = Math.min(cx + radius + 70, width - labelW - 12);
  // narrow screens shrink the circles; the plot shrinks with them instead of leaving air on top
  const plotH = Math.min(height, 2 * radius + 34);
  const bottom = plotH - 4;
  const circles = items.map((item, i) => {
    const r = max > 0 ? radius * Math.sqrt(Math.max(0, item.value) / max) : 0;
    return { item, r, cy: bottom - r, top: bottom - 2 * r, color: item.color ?? sequential(i, n) };
  });
  // callouts keep 40px apart even when circles are close in size
  const callouts = circles.reduce<number[]>((acc, circle) => [...acc, Math.max(circle.top, (acc[acc.length - 1] ?? -Infinity) + 40)], []);
  const describe = (i: number) => {
    const item = items[i];
    return item ? `${item.label}: ${formatValue(item.value)}${item.description ? `, ${item.description}` : ''}` : '';
  };
  const { active, setActive, spoken, onKeyDown, onBlur } = useStepper(n, describe);
  const current = active !== null ? circles[active] : undefined;

  return (
    <div data-slot="proportional-area-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Показатель',
          columns: ['Значение', 'Описание'],
          rows: items.map((item) => ({ header: item.label, cells: [formatValue(item.value), item.description ?? ''] })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={width} height={Math.max(plotH, (callouts[callouts.length - 1] ?? 0) + 24)} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {circles.map(({ item, r, cy, color }, i) => (
            <circle
              key={item.label}
              data-slot="chart-circle"
              data-label={item.label}
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              stroke={active === i ? 'var(--color-fg-1)' : 'none'}
              strokeWidth={1.5}
              style={{ transformOrigin: `${cx}px ${bottom}px`, transitionDelay: `${i * 80}ms` }}
              className="transition-[scale] duration-(--duration-slow) ease-standard starting:scale-0 motion-reduce:transition-none"
              onPointerMove={() => setActive(i)}
            />
          ))}
          <g className={FADE} style={{ transitionDelay: `${n * 80}ms` }}>
            {circles.map(({ item, top }, i) => {
              const y = callouts[i] ?? top;
              return (
                <g key={item.label}>
                  <line x1={cx} y1={top + 0.5} x2={lineEnd} y2={y + 0.5} stroke="var(--color-border)" />
                  <circle cx={cx} cy={top} r={2.5} className="fill-fg-1" />
                  <text x={lineEnd + 12} y={y + 4} className="fill-fg-1 text-body-xs font-semibold tabular-nums">
                    {title(item)}
                  </text>
                  {item.description ? (
                    <text x={lineEnd + 12} y={y + 20} className="fill-fg-3 text-caption">
                      {item.description}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>
        {current ? (
          <ChartTooltip
            x={cx + current.r}
            width={width}
            y={Math.max(4, current.cy - 20)}
            title={current.item.label}
            marker="dot"
            rows={[{ name: current.item.description ?? 'Значение', value: formatValue(current.item.value), color: current.color }]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- 12. Radial bars ---------- */

export interface RadialBarChartProps extends Omit<RowChartProps, 'sort'> {
  /** Value of a full 270° arc (default 100, for percent of plan). */
  max?: number;
  /** Plot height, px. */
  height?: number;
}

const FULL_TURN = 1.5 * Math.PI;

function arc(cx: number, cy: number, r: number, angle: number): string {
  if (angle <= 0) return '';
  const end = polar(cx, cy, r, angle);
  return `M${cx} ${cy - r}A${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${end.x} ${end.y}`;
}

/** Concentric arcs 14 with round caps on fill-2 tracks, 270° is the maximum, labels in the empty quarter; for showcases, not analytics. */
export function RadialBarChart({
  data,
  name = 'Значение',
  max = 100,
  formatValue = formatNumber,
  height = 300,
  color = CHART_COLORS[0],
  className,
  'aria-label': label,
  ...props
}: RadialBarChartProps) {
  const [ref, width] = useWidth(560);
  const n = data.length;
  const caption = (row: ComparisonDatum) => `${row.label} · ${formatValue(row.value)}`;
  const labelW = Math.max(0, ...data.map((row) => measureText(caption(row))));
  const geometry = (outer: number) => {
    const step = n > 1 ? Math.min(24, (outer - 18) / (n - 1)) : 24;
    return { outer, step, stroke: Math.max(4, Math.round((step * 14) / 24)) };
  };
  const wide = geometry(Math.min(132, height / 2 - 18));
  const fits = wide.outer + wide.stroke / 2 + Math.max(wide.outer + wide.stroke / 2, 14 + labelW) <= width;
  // on narrow screens the rings shrink so the labels in the empty quarter still fit
  const { outer, step, stroke } = fits ? wide : geometry(Math.max(24 + (n - 1) * 8, Math.min(wide.outer, width - 14 - labelW - wide.stroke)));
  const half = outer + stroke / 2;
  const leftNeed = Math.max(half, 14 + labelW);
  const cx = Math.max(0, (width - half - leftNeed) / 2) + leftNeed;
  const cy = height / 2;
  const angle = (value: number) => (max > 0 ? Math.min(1, Math.max(0, value / max)) : 0) * FULL_TURN;
  const describe = (i: number) => {
    const row = data[i];
    return row ? `${row.label}: ${formatValue(row.value)}` : '';
  };
  const { active, setActive, spoken, onKeyDown, onBlur } = useStepper(n, describe);
  const current = active !== null ? data[active] : undefined;
  const tip = current && active !== null ? polar(cx, cy, outer - active * step, angle(current.value)) : undefined;

  return (
    <div data-slot="radial-bar-chart" className={cn('flex flex-col gap-3', className)} {...props}>
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{ rowHeader: 'Категория', columns: [name], rows: data.map((row) => ({ header: row.label, cells: [formatValue(row.value)] })) }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <svg aria-hidden width={width} height={height} className="block overflow-visible" onPointerLeave={() => setActive(null)}>
          {data.map((row, i) => {
            const r = outer - i * step;
            const a = angle(row.value);
            return (
              <g key={row.label} opacity={active !== null && active !== i ? 0.35 : 1} className={DIM} onPointerEnter={() => setActive(i)}>
                <path d={arc(cx, cy, r, FULL_TURN)} fill="none" stroke="var(--color-fill-2)" strokeWidth={stroke} strokeLinecap="round" />
                <path
                  data-slot="chart-arc"
                  data-label={row.label}
                  data-angle={Math.round((a * 1800) / Math.PI) / 10}
                  data-radius={r}
                  d={arc(cx, cy, r, a)}
                  pathLength={1}
                  fill="none"
                  stroke={row.color ?? color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  style={{ strokeDasharray: 1, transitionDelay: `${i * 60}ms` }}
                  className="transition-[stroke-dashoffset] duration-(--duration-deliberate) ease-out starting:[stroke-dashoffset:1] motion-reduce:transition-none"
                />
                <text x={cx - 14} y={cy - r} textAnchor="end" dominantBaseline="middle" className="fill-fg-2 text-caption tabular-nums">
                  {caption(row)}
                </text>
              </g>
            );
          })}
        </svg>
        {current && tip ? (
          <ChartTooltip x={tip.x} width={width} y={Math.max(4, tip.y - 12)} title={current.label} rows={[{ name, value: formatValue(current.value), color: current.color ?? color }]} />
        ) : null}
      </ChartPlot>
    </div>
  );
}
