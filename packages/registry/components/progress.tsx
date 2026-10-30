import { Meter as BaseMeter } from '@base-ui/react/meter';
import { Progress as BaseProgress } from '@base-ui/react/progress';
import { useEffect, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn';

const trackHeights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' } as const;

export interface ProgressProps extends Omit<BaseProgress.Root.Props, 'className' | 'children'> {
  /** Label row above the bar («Импорт контактов»); the value «62 %» is shown at its end. */
  label?: ReactNode;
  size?: keyof typeof trackHeights;
  className?: string;
}

const percent = new Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: 0 });

/** Linear progress. `value={null}` = indeterminate (30% segment sweeping, 1500ms). */
export function Progress({ label, size = 'md', className, value, max = 100, ...props }: ProgressProps) {
  return (
    <BaseProgress.Root
      data-slot="progress"
      value={value}
      max={max}
      className={cn('flex w-full flex-col gap-2', className)}
      {...props}
    >
      {label ? (
        <div className="flex items-baseline justify-between gap-3 text-label-sm font-medium">
          <BaseProgress.Label className="text-fg-2">{label}</BaseProgress.Label>
          <BaseProgress.Value className="text-fg-3 tabular-nums">
            {(_formatted, current) => (current === null ? null : percent.format(current / max))}
          </BaseProgress.Value>
        </div>
      ) : null}
      <BaseProgress.Track className={cn('relative overflow-hidden rounded-full bg-fill-2', trackHeights[size])}>
        <BaseProgress.Indicator className="block h-full rounded-full bg-accent transition-[width] duration-(--duration-slow) ease-standard data-indeterminate:w-[30%]! data-indeterminate:animate-indeterminate" />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}

const circleSizes = { 20: 3, 32: 3, 48: 4, 64: 5 } as const;

export interface ProgressCircleProps extends Omit<BaseProgress.Root.Props, 'className' | 'children'> {
  size?: keyof typeof circleSizes;
  /** Value text in the centre (48 and 64 only). */
  showValue?: boolean;
  className?: string;
}

export function ProgressCircle({ size = 32, showValue = false, value, max = 100, className, ...props }: ProgressCircleProps) {
  const stroke = circleSizes[size];
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const ratio = value === null || value === undefined ? 0.3 : Math.min(Math.max(value / max, 0), 1);
  return (
    <BaseProgress.Root
      data-slot="progress-circle"
      value={value}
      max={max}
      className={cn('relative inline-grid shrink-0 place-items-center', value === null && 'animate-spinner', className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-fill-2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - ratio)}
          className="stroke-accent transition-[stroke-dashoffset] duration-(--duration-slow) ease-standard"
        />
      </svg>
      {showValue && value !== null && value !== undefined && size >= 48 ? (
        <span className="absolute text-caption font-medium text-fg-1 tabular-nums">{percent.format(value / max)}</span>
      ) : null}
    </BaseProgress.Root>
  );
}

export interface SkeletonProps extends ComponentProps<'div'> {
  /** text: 10px capsule line · circle: avatar · rect: thumbnail (r8). Size it with classes. */
  shape?: 'text' | 'circle' | 'rect';
}

/** Placeholder that holds the space of future content so the layout does not jump. */
export function Skeleton({ shape = 'text', className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        'kv-shimmer shrink-0',
        shape === 'text' && 'h-2.5 rounded-full',
        shape === 'circle' && 'rounded-full',
        shape === 'rect' && 'rounded-sm',
        className,
      )}
      {...props}
    />
  );
}

const emptyTones = {
  neutral: 'bg-surface-2 text-fg-3',
  danger: 'bg-danger-soft text-danger-soft-fg',
  accent: 'bg-accent-soft text-accent-soft-fg',
} as const;

export interface EmptyStateProps extends Omit<ComponentProps<'div'>, 'title'> {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Usually a small primary and a ghost button. */
  actions?: ReactNode;
  /** Icon circle: neutral (surface-2), danger for a failed load, accent for onboarding. */
  tone?: keyof typeof emptyTones;
}

/** Why it is empty and what to do next: circle 48, title, text, actions (16 / 4 / 20 apart). Children go last — e.g. an error code. */
export function EmptyState({ icon, title, description, actions, tone = 'neutral', className, children, ...props }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      data-tone={tone}
      className={cn(
        'flex flex-col items-center px-6 py-10 text-center transition-[opacity,translate] duration-(--duration-base) ease-out starting:translate-y-(--shift-md) starting:opacity-0',
        className,
      )}
      {...props}
    >
      <span aria-hidden className={cn('grid size-12 place-items-center rounded-full [&_svg]:size-6 [&_svg]:stroke-[1.5]', emptyTones[tone])}>
        {icon}
      </span>
      <h3 className="pt-4 text-heading-xs font-semibold text-fg-1">{title}</h3>
      {description ? <p className="max-w-[360px] pt-1 text-body-sm text-fg-2">{description}</p> : null}
      {actions ? <div className="flex items-center gap-2 pt-5">{actions}</div> : null}
      {children ? <div className="pt-4">{children}</div> : null}
    </div>
  );
}

/* ---------- Meter ---------- */

export type MeterZone = 'normal' | 'warning' | 'critical';

const zoneFill: Record<MeterZone, string> = { normal: 'bg-success', warning: 'bg-warning', critical: 'bg-danger' };
const zoneText: Record<MeterZone, string> = {
  normal: 'text-success-soft-fg',
  warning: 'text-warning-soft-fg',
  critical: 'text-danger-soft-fg',
};
const tickNumber = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

export interface MeterProps extends Omit<BaseMeter.Root.Props, 'className' | 'children'> {
  /** What is measured: «Хранилище». */
  label?: ReactNode;
  /** End of the label row and the screen reader text: «4,2 из 10 ГБ». Default — the percentage. */
  valueLabel?: string;
  /** Zone edges in % of the range: below the first — normal, up to the second — warning, above — critical. */
  thresholds?: readonly [number, number];
  /** Line under the scale in the colour of the zone: «42 % · места достаточно». */
  status?: ReactNode;
  className?: string;
}

/**
 * How full a resource is, not how far a process got. h8 scale cut into zones by the thresholds; the whole bar takes
 * the colour of the current zone. It informs, it never pulses.
 */
export function Meter({ value, min = 0, max = 100, label, valueLabel, thresholds = [60, 85], status, className, ...props }: MeterProps) {
  const share = max > min ? Math.min(Math.max((value - min) / (max - min), 0), 1) * 100 : 0;
  const [warning, critical] = thresholds;
  const zone: MeterZone = share > critical ? 'critical' : share >= warning ? 'warning' : 'normal';
  const zones = [
    [0, warning],
    [warning, critical],
    [critical, 100],
  ] as const;
  const tick = (edge: number) => tickNumber.format(min + ((max - min) * edge) / 100);

  return (
    <BaseMeter.Root
      data-slot="meter"
      data-zone={zone}
      value={value}
      min={min}
      max={max}
      aria-valuetext={valueLabel}
      className={cn('flex w-full flex-col gap-2', className)}
      {...props}
    >
      {label || valueLabel ? (
        <div className="flex items-baseline justify-between gap-3 text-label-sm">
          {label ? <BaseMeter.Label className="font-medium text-fg-2">{label}</BaseMeter.Label> : <span />}
          <span className="text-fg-3 tabular-nums">{valueLabel ?? percent.format(share / 100)}</span>
        </div>
      ) : null}
      <div aria-hidden className="flex h-2 gap-0.5">
        {zones.map(([from, to]) => (
          <span key={from} className="h-full overflow-hidden rounded-full bg-fill-2" style={{ width: `${to - from}%` }}>
            <span
              className={cn(
                'block h-full rounded-full [transition:width_var(--duration-slow)_var(--ease-standard),background-color_var(--duration-quick)_var(--ease-hover)]',
                zoneFill[zone],
              )}
              style={{ width: `${to > from ? Math.min(Math.max((share - from) / (to - from), 0), 1) * 100 : 0}%` }}
            />
          </span>
        ))}
      </div>
      <div aria-hidden className="flex gap-0.5 font-mono text-overline font-medium text-fg-3 tabular-nums">
        {zones.map(([from, to], index) => (
          <span key={from} className="flex justify-between gap-1" style={{ width: `${to - from}%` }}>
            <span>{tick(from)}</span>
            {index === zones.length - 1 ? <span>{tick(to)}</span> : null}
          </span>
        ))}
      </div>
      {status ? <p className={cn('text-caption tabular-nums', zoneText[zone])}>{status}</p> : null}
    </BaseMeter.Root>
  );
}

/* ---------- Navigation progress ---------- */

const START_DELAY = 150;
const TRICKLE_EVERY = 400;
const FINISH = 400;

/** One trickle step: +2…8 %, slower near the 90 % ceiling. */
function trickle(value: number): number {
  return Math.min(value + Math.min(Math.max((90 - value) / 10, 2), 8), 90);
}

export interface NavigationProgressProps {
  /** True while the next page loads. */
  loading: boolean;
  className?: string;
}

/**
 * 3px accent bar on the top edge of the window during a page transition. Shows only after 150ms, trickles towards
 * 90 %, runs to 100 % and fades when the page is ready. Decorative: put aria-busy on the main area instead.
 */
export function NavigationProgress({ loading, className }: NavigationProgressProps) {
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    if (loading) {
      const start = setTimeout(() => setValue(15), START_DELAY);
      const step = setInterval(() => setValue((current) => (current === null ? null : trickle(current))), TRICKLE_EVERY);
      return () => {
        clearTimeout(start);
        clearInterval(step);
      };
    }
    const finish = setTimeout(() => setValue((current) => (current === null ? null : 100)), 0);
    const hide = setTimeout(() => setValue(null), FINISH);
    return () => {
      clearTimeout(finish);
      clearTimeout(hide);
    };
  }, [loading]);

  if (value === null) return null;
  const done = value >= 100;
  const style: CSSProperties & Record<'--kv-progress', string> = { '--kv-progress': `${value}%` };
  return (
    <div
      aria-hidden
      data-slot="navigation-progress"
      data-state={done ? 'done' : 'loading'}
      style={style}
      className={cn('pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]', className)}
    >
      {/* Width 200ms ease-out; when done, it fades 200ms after reaching 100 %. Reduced motion: the fade only. */}
      <div
        className={cn(
          'h-full w-(--kv-progress) rounded-r-[2px] bg-accent starting:w-0',
          '[transition:width_var(--duration-base)_var(--ease-out),opacity_var(--duration-base)_var(--ease-out)_var(--duration-base)]',
          'motion-reduce:[transition:opacity_var(--duration-base)_var(--ease-out)_var(--duration-base)]',
          done && 'opacity-0',
        )}
      />
    </div>
  );
}
