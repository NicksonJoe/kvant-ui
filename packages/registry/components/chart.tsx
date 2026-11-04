import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useId, useState, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import {
  CHART_COLORS,
  ChartLegend,
  ChartPlot,
  ChartTooltip,
  ValueAxis,
  columnPath,
  formatNumber as number,
  formatPercent as percent,
  niceTicks,
  seriesColor,
  smoothPath,
  stepIndex,
  svgId,
  useHiddenSeries,
  useWidth,
} from '../lib/chart-kit';
import { cn } from '../lib/cn';

export { CHART_COLORS, formatAxisValue, niceTicks } from '../lib/chart-kit';

/* ---------- Line, area and bar charts ---------- */

export interface ChartSeries {
  name: string;
  values: readonly number[];
  /** Default: the chart palette in order. */
  color?: string;
}

type XYKind = 'area' | 'line' | 'bar';

export interface XYChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the chart shows; screen readers also get the data as a table. */
  'aria-label': string;
  /** X axis labels, one per value. Long ranges show every n-th label. */
  labels: readonly string[];
  series: readonly ChartSeries[];
  /** Tooltip titles per point, e.g. «16 октября, пятница» (default: the axis label). */
  tooltipLabels?: readonly string[];
  /** Tooltip value format (default: Russian number). */
  formatValue?: (value: number) => string;
  /** Plot height in px, without the axis labels. */
  height?: number;
  /** Legend above the plot; on by default for several series. Clicking a series hides it. */
  legend?: boolean;
}

const MARGIN = { top: 8, right: 8, bottom: 28, left: 48 };

function XYChart({
  kind,
  labels,
  series,
  tooltipLabels,
  formatValue = number,
  height = 200,
  legend,
  className,
  'aria-label': label,
  ...props
}: XYChartProps & { kind: XYKind }) {
  const [ref, width] = useWidth(560);
  const gradient = svgId(useId());
  const [hidden, toggle] = useHiddenSeries();
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');

  const colored = series.map((item, index) => ({ ...item, color: seriesColor(index, item.color) }));
  const shown = colored.filter((item) => !hidden.has(item.name));
  const n = labels.length;
  const ticks = niceTicks(Math.max(0, ...shown.flatMap((item) => item.values)));
  const yMax = ticks[ticks.length - 1] ?? 1;
  const plotW = Math.max(1, width - MARGIN.left - MARGIN.right);
  const band = n > 0 ? plotW / n : plotW;
  const x = (i: number) =>
    kind === 'bar' ? MARGIN.left + (i + 0.5) * band : n > 1 ? MARGIN.left + (i * plotW) / (n - 1) : MARGIN.left + plotW / 2;
  const y = (value: number) => MARGIN.top + height - (value / yMax) * height;
  const baseline = y(0);
  const stride = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 72))));
  const showLegend = legend ?? series.length > 1;

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left;
    const index = kind === 'bar' ? Math.floor(px / band) : n > 1 ? Math.round((px / plotW) * (n - 1)) : 0;
    setActive(Math.min(n - 1, Math.max(0, index)));
  };

  const describe = (index: number) =>
    `${tooltipLabels?.[index] ?? labels[index] ?? ''}: ${shown.map((item) => `${item.name} ${formatValue(item.values[index] ?? 0)}`).join(', ')}`;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = stepIndex(event.key, active, n);
    if (index === null) return;
    event.preventDefault();
    setActive(index);
    setSpoken(describe(index));
  };

  const groupWidth = (count: number) => {
    const bar = Math.max(4, Math.min(16, (band * 0.7 - 4 * (count - 1)) / Math.max(1, count)));
    return { bar, total: count * bar + (count - 1) * 4 };
  };

  return (
    <div data-slot="chart" data-kind={kind} className={cn('flex flex-col gap-3', className)} {...props}>
      {showLegend ? (
        <ChartLegend items={colored} marker={kind === 'line' ? 'line' : 'square'} hidden={hidden} onToggle={toggle} onHover={setHovered} />
      ) : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Период',
          columns: colored.map((item) => item.name),
          rows: labels.map((text, i) => ({ header: tooltipLabels?.[i] ?? text, cells: colored.map((item) => formatValue(item.values[i] ?? 0)) })),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg aria-hidden width={width} height={height + MARGIN.top + MARGIN.bottom} className="block overflow-visible">
          <ValueAxis ticks={ticks} y={y} left={MARGIN.left} right={MARGIN.left + plotW} />
          {labels.map((text, i) =>
            i % stride === 0 ? (
              <text key={i} x={x(i)} y={baseline + 20} textAnchor="middle" className="fill-fg-3 text-caption">
                {text}
              </text>
            ) : null,
          )}

          {kind === 'bar' && active !== null ? (
            <rect x={x(active) - band / 2} y={MARGIN.top} width={band} height={height} rx={8} className="fill-fill-1" />
          ) : null}

          {shown.map((item, seriesIndex) => {
            const dim = hovered !== null && hovered !== item.name;
            if (kind === 'bar') {
              const { bar, total } = groupWidth(shown.length);
              return (
                <g key={item.name} className="transition-opacity duration-(--duration-quick)" opacity={dim ? 0.3 : 1}>
                  {item.values.map((value, i) => {
                    const left = x(i) - total / 2 + seriesIndex * (bar + 4);
                    return (
                      <path
                        key={i}
                        fill={item.color}
                        d={columnPath(left, y(value), bar, baseline)}
                        style={{ transitionDelay: `${i * 35}ms` }}
                        className="origin-bottom transition-[scale] duration-(--duration-slow) ease-standard [transform-box:fill-box] starting:scale-y-0"
                      />
                    );
                  })}
                </g>
              );
            }
            const points = item.values.map((value, i) => ({ x: x(i), y: y(value) }));
            const line = smoothPath(points);
            const last = points[points.length - 1];
            return (
              <g
                key={item.name}
                style={{ color: item.color }}
                opacity={dim ? 0.3 : 1}
                className="transition-[opacity,clip-path] duration-(--duration-deliberate) ease-out [clip-path:inset(-8px_-8px_-8px_-8px)] starting:[clip-path:inset(-8px_100%_-8px_-8px)]"
              >
                {kind === 'area' && last ? (
                  <>
                    {/* stops take the series colour explicitly: currentColor would resolve at <defs>, not here */}
                    <linearGradient id={`${gradient}-${seriesIndex}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor={item.color} stopOpacity={0.22} />
                      <stop offset="1" stopColor={item.color} stopOpacity={0} />
                    </linearGradient>
                    <path d={`${line}L${last.x} ${baseline}L${MARGIN.left} ${baseline}Z`} fill={`url(#${gradient}-${seriesIndex})`} />
                  </>
                ) : null}
                <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                {kind === 'line' && last ? <circle cx={last.x} cy={last.y} r={3.5} fill="currentColor" /> : null}
              </g>
            );
          })}

          {kind !== 'bar' && active !== null ? (
            <g>
              <line x1={x(active)} x2={x(active)} y1={MARGIN.top} y2={baseline} stroke="var(--color-fg-4)" strokeDasharray="3 3" />
              {shown.map((item) => (
                <circle key={item.name} cx={x(active)} cy={y(item.values[active] ?? 0)} r={4.5} fill="var(--color-surface-1)" stroke={item.color} strokeWidth={2} />
              ))}
            </g>
          ) : null}

          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={plotW}
            height={height}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => setActive(null)}
          />
        </svg>

        {active !== null && shown.length > 0 ? (
          <ChartTooltip
            x={x(active)}
            width={width}
            title={tooltipLabels?.[active] ?? labels[active]}
            marker={kind === 'line' ? 'line' : 'square'}
            rows={shown.map((item) => ({ name: item.name, color: item.color, value: formatValue(item.values[active] ?? 0) }))}
            total={shown.length > 1 ? formatValue(shown.reduce((sum, item) => sum + (item.values[active] ?? 0), 0)) : undefined}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/** One series as a line with a fill fading to zero. Crosshair, point and tooltip follow the pointer and ← →. */
export function AreaChart(props: XYChartProps) {
  return <XYChart kind="area" {...props} />;
}

/** Several series as lines; the last point is marked. The legend hides series. */
export function LineChart(props: XYChartProps) {
  return <XYChart kind="line" {...props} />;
}

/** Grouped bars 16 wide with a 4px gap and 4px top corners; they grow from zero once. */
export function BarChart(props: XYChartProps) {
  return <XYChart kind="bar" {...props} />;
}

/* ---------- Donut ---------- */

export interface DonutDatum {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  data: readonly DonutDatum[];
  /** Word under the total: «сделок». */
  totalLabel?: string;
  /** Ring diameter, px. */
  size?: number;
}


/** Ring 16 wide with 2px gaps, the total in the centre and a legend with counts and shares. */
export function DonutChart({ data, totalLabel, size = 136, className, 'aria-label': label, ...props }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = data.map((item, index) => {
    const before = data.slice(0, index).reduce((sum, other) => sum + other.value, 0);
    return {
      ...item,
      color: seriesColor(index, item.color),
      share: total > 0 ? item.value / total : 0,
      offset: total > 0 ? (before / total) * circumference : 0,
    };
  });

  return (
    <div data-slot="donut-chart" role="group" aria-label={label} className={cn('flex flex-wrap items-center gap-x-8 gap-y-4', className)} {...props}>
      <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
        <svg aria-hidden width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-fill-2)" strokeWidth={16} />
          {segments.map((item) => (
            <circle
              key={item.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={16}
              strokeDasharray={`${Math.max(0, item.share * circumference - (segments.length > 1 ? 2 : 0))} ${circumference}`}
              strokeDashoffset={-item.offset}
            />
          ))}
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-heading-lg font-semibold text-fg-1 tabular-nums">{total.toLocaleString('ru-RU')}</span>
          {totalLabel ? <span className="text-caption text-fg-3">{totalLabel}</span> : null}
        </div>
      </div>
      <ul className="flex min-w-48 flex-1 flex-col gap-2">
        {segments.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-body-sm">
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="min-w-0 flex-1 truncate text-fg-1">{item.label}</span>
            <span className="font-semibold text-fg-1 tabular-nums">{item.value.toLocaleString('ru-RU')}</span>
            <span className="w-16 text-right text-fg-3 tabular-nums">{percent(item.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Bar list and stacked bar ---------- */

export interface BarListItem {
  label: string;
  value: number;
}

export interface BarListProps extends Omit<ComponentProps<'ul'>, 'children'> {
  'aria-label': string;
  data: readonly BarListItem[];
  formatValue?: (value: number) => string;
  /** One hue for every bar: a ranking compares lengths, not colours. */
  color?: string;
}

/** Ranking: label and value on one line, a 6px bar under them, lengths relative to the largest value. */
export function BarList({ data, formatValue = (value) => value.toLocaleString('ru-RU'), color = CHART_COLORS[0], className, ...props }: BarListProps) {
  const max = Math.max(0, ...data.map((item) => item.value));
  return (
    <ul data-slot="bar-list" className={cn('flex flex-col gap-3', className)} {...props}>
      {data.map((item) => (
        <li key={item.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-3 text-body-sm">
            <span className="min-w-0 flex-1 truncate text-fg-1">{item.label}</span>
            <span className="font-semibold text-fg-1 tabular-nums">{formatValue(item.value)}</span>
          </div>
          <div aria-hidden className="h-1.5 rounded-full bg-fill-2">
            <div
              data-slot="bar-list-bar"
              className="h-full rounded-full"
              style={{ width: `${max > 0 ? Math.round((item.value / max) * 1000) / 10 : 0}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export interface StackedBarProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  data: readonly DonutDatum[];
  formatValue?: (value: number) => string;
}

/** Shares of one whole in a single 12px bar with 2px surface gaps, and a legend with values and percents. */
export function StackedBar({ data, formatValue = (value) => value.toLocaleString('ru-RU'), className, 'aria-label': label, ...props }: StackedBarProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const parts = data.map((item, index) => ({
    ...item,
    color: seriesColor(index, item.color),
    share: total > 0 ? item.value / total : 0,
  }));
  return (
    <div data-slot="stacked-bar" role="group" aria-label={label} className={cn('flex flex-col gap-3', className)} {...props}>
      <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-fill-2">
        {parts.map((item) => (
          <span key={item.label} data-slot="stacked-bar-segment" className="h-full" style={{ flexGrow: item.value, background: item.color }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {parts.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-body-sm">
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="text-fg-1">{item.label}</span>
            <span className="font-semibold text-fg-1 tabular-nums">{formatValue(item.value)}</span>
            <span className="text-fg-3 tabular-nums">{percent(item.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Sparkline and KPI card ---------- */

export interface SparklineProps extends Omit<ComponentProps<'div'>, 'children'> {
  data: readonly number[];
  color?: string;
  height?: number;
}

/** Shape of a trend without axes: line 1.5, fill 18 % → 0, end point. Draws left to right once. */
export function Sparkline({ data, color = CHART_COLORS[0], height = 40, className, ...props }: SparklineProps) {
  const [ref, width] = useWidth(270);
  const gradient = svgId(useId());
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data.map((value, i) => ({
    x: data.length > 1 ? 2 + (i * (width - 4)) / (data.length - 1) : width / 2,
    y: 3 + (1 - (value - min) / span) * (height - 6),
  }));
  const line = smoothPath(points);
  const last = points[points.length - 1];

  return (
    <div ref={ref} data-slot="sparkline" aria-hidden className={cn('w-full', className)} style={{ color }} {...props}>
      <svg
        width={width}
        height={height}
        className="block overflow-visible transition-[clip-path] duration-(--duration-deliberate) ease-out [clip-path:inset(-4px_-4px_-4px_-4px)] starting:[clip-path:inset(-4px_100%_-4px_-4px)]"
      >
        <defs>
          <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity={0.18} />
            <stop offset="1" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
        {last ? <path d={`${line}L${last.x} ${height}L${points[0]?.x ?? 0} ${height}Z`} fill={`url(#${gradient})`} /> : null}
        <path d={line} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {last ? <circle cx={last.x} cy={last.y} r={2.5} fill="currentColor" /> : null}
      </svg>
    </div>
  );
}

export interface KpiCardProps extends Omit<ComponentProps<'div'>, 'children'> {
  label: ReactNode;
  /** «Октябрь». */
  period?: ReactNode;
  /** Formatted value: «1 284 900 ₽», «24,6 %». */
  value: ReactNode;
  /** Formatted change: «+12,4 %», «−1,2 п. п.». */
  change?: string;
  trend?: 'up' | 'down';
  /** Growth is bad here (costs, churn): the colours flip. */
  invert?: boolean;
  /** «к сентябрю». */
  comparison?: ReactNode;
  /** Sparkline of the last weeks. */
  data?: readonly number[];
}

/** Answers three questions: how much, better or worse, for which period. */
export function KpiCard({ label, period, value, change, trend = 'up', invert = false, comparison, data, className, ...props }: KpiCardProps) {
  const good = (trend === 'up') !== invert;
  const Arrow = trend === 'up' ? ArrowUpRight : ArrowDownRight;
  return (
    <div data-slot="kpi-card" className={cn('flex flex-col gap-3 rounded-xl bg-surface-1 p-5 text-fg-1 shadow-raised', className)} {...props}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-label-sm font-medium text-fg-2">{label}</p>
        {period ? <p className="text-caption text-fg-3">{period}</p> : null}
      </div>
      <p className="text-heading-xl font-semibold tabular-nums">{value}</p>
      {change ? (
        <p className="flex flex-wrap items-center gap-2 text-label-sm text-fg-3">
          <span
            className={cn(
              'inline-flex h-5 items-center gap-1 rounded-full px-2 text-caption font-medium tabular-nums',
              good ? 'bg-success-soft text-success-soft-fg' : 'bg-danger-soft text-danger-soft-fg',
            )}
          >
            <Arrow aria-hidden className="size-3 stroke-[1.75]" />
            <span className="sr-only">{trend === 'up' ? 'Рост:' : 'Снижение:'}</span>
            {change}
          </span>
          {comparison}
        </p>
      ) : null}
      {data && data.length > 1 ? <Sparkline data={data} className="mt-1" /> : null}
    </div>
  );
}
