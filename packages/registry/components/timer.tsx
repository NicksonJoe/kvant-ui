import { Clock, Pause, TriangleAlert } from 'lucide-react';
import { Fragment, useCallback, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { VisuallyHidden } from './visually-hidden';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const MINUS = '−';

export const TIMER_MODES = ['countdown', 'stopwatch'] as const;
export type TimerMode = (typeof TIMER_MODES)[number];
export const TIMER_VARIANTS = ['display', 'inline'] as const;
export type TimerVariant = (typeof TIMER_VARIANTS)[number];

type Forms = readonly [one: string, few: string, many: string];
const plurals = new Intl.PluralRules('ru');
const pick = (count: number, [one, few, many]: Forms) => {
  const rule = plurals.select(count);
  return rule === 'one' ? one : rule === 'few' ? few : many;
};
// nominative for «осталось 2 часа», accusative for «просрочено на 1 минуту»
const UNITS: Record<'nominative' | 'accusative', readonly [Forms, Forms, Forms]> = {
  nominative: [
    ['час', 'часа', 'часов'],
    ['минута', 'минуты', 'минут'],
    ['секунда', 'секунды', 'секунд'],
  ],
  accusative: [
    ['час', 'часа', 'часов'],
    ['минуту', 'минуты', 'минут'],
    ['секунду', 'секунды', 'секунд'],
  ],
};

interface Parts {
  negative: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  tenths: number;
}

/** Countdown rounds up to whole seconds (zero shows at the deadline), a stopwatch floors to tenths. */
function split(value: number, mode: TimerMode): Parts {
  const tenthsTotal = mode === 'countdown' ? Math.ceil(value / SECOND) * 10 : Math.floor(value / 100);
  const negative = tenthsTotal < 0;
  const total = Math.abs(tenthsTotal);
  return {
    negative,
    hours: Math.floor(total / 36_000),
    minutes: Math.floor(total / 600) % 60,
    seconds: Math.floor(total / 10) % 60,
    tenths: total % 10,
  };
}

const pad = (value: number) => String(value).padStart(2, '0');

/** «2 часа 14 минут 37 секунд»; zero hours and minutes are left out. */
function spoken({ hours, minutes, seconds }: Parts, grammarCase: keyof typeof UNITS): string {
  const [h, m, s] = UNITS[grammarCase];
  const words = [hours ? `${hours} ${pick(hours, h)}` : '', minutes ? `${minutes} ${pick(minutes, m)}` : ''];
  if (seconds || (!hours && !minutes)) words.push(`${seconds} ${pick(seconds, s)}`);
  return words.filter(Boolean).join(' ');
}

const TONES = {
  neutral: 'bg-fill-2 text-fg-1 [&>svg]:text-fg-2',
  warning: 'bg-warning-soft text-warning-soft-fg',
  danger: 'bg-danger-soft text-danger-soft-fg',
  accent: 'bg-accent-soft text-accent-soft-fg',
  paused: 'bg-fill-2 text-fg-2 [&>svg]:text-fg-3',
} as const;
type TimerTone = keyof typeof TONES;

export interface TimerProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Milliseconds: left until the deadline (negative once overdue) or elapsed on a stopwatch. */
  value: number;
  mode?: TimerMode;
  /** display — 48/52 digits with unit names; inline — h24 capsule for a table row or a card. */
  variant?: TimerVariant;
  /** Stopwatch display: tenths after a comma, in fg-3. */
  tenths?: boolean;
  /** Stopwatch: stopped; inline turns fill-2 with a pause icon. */
  paused?: boolean;
  /** Inline countdown turns warning-soft below this many ms. */
  warnBelow?: number;
  /** What is timed: «До ответа клиенту». */
  'aria-label'?: string;
}

/**
 * Countdown to a deadline or a stopwatch. Digits are tabular and change without animation, so the line never
 * shakes; role="timer" is not read out on every tick, the spoken value is there when the reader comes to it.
 */
export function Timer({
  value,
  mode = 'countdown',
  variant = 'display',
  tenths = false,
  paused = false,
  warnBelow = 15 * MINUTE,
  className,
  ...props
}: TimerProps) {
  const parts = split(value, mode);
  const sign = parts.negative ? MINUS : '';
  const text = parts.negative ? `просрочено на ${spoken(parts, 'accusative')}` : spoken(parts, 'nominative');
  const live = (
    <VisuallyHidden>
      {text}
      {mode === 'stopwatch' && paused ? ', на паузе' : ''}
    </VisuallyHidden>
  );

  if (variant === 'inline') {
    const tone: TimerTone =
      mode === 'stopwatch' ? (paused ? 'paused' : 'accent') : parts.negative ? 'danger' : value < warnBelow ? 'warning' : 'neutral';
    const icon =
      tone === 'accent' ? (
        <span data-slot="timer-dot" aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
      ) : tone === 'danger' ? (
        <TriangleAlert aria-hidden />
      ) : tone === 'paused' ? (
        <Pause aria-hidden />
      ) : (
        <Clock aria-hidden />
      );
    return (
      <div
        role="timer"
        data-slot="timer"
        data-variant="inline"
        data-tone={tone}
        className={cn(
          'inline-flex h-6 w-max shrink-0 items-center gap-1.5 rounded-full pr-2.5 text-caption font-medium tabular-nums',
          'transition-colors duration-(--duration-quick) ease-hover [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:stroke-[1.75]',
          tone === 'accent' ? 'pl-[9px]' : 'pl-2',
          TONES[tone],
          className,
        )}
        {...props}
      >
        {icon}
        <span data-slot="timer-value" aria-hidden>
          {sign}
          {pad(parts.hours)}:{pad(parts.minutes)}:{pad(parts.seconds)}
        </span>
        {live}
      </div>
    );
  }

  const [h, m, s] = UNITS.nominative;
  const groups: [number, Forms][] = [
    [parts.hours, h],
    [parts.minutes, m],
    [parts.seconds, s],
  ];
  return (
    <div role="timer" data-slot="timer" data-variant="display" className={cn('inline-flex', className)} {...props}>
      <div data-slot="timer-value" aria-hidden className="flex items-start gap-2">
        {sign ? (
          <span data-slot="timer-sign" className="text-display-lg font-medium text-fg-1">
            {sign}
          </span>
        ) : null}
        {groups.map(([count, forms], index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <span data-slot="timer-separator" className="text-display-lg text-fg-4">
                :
              </span>
            ) : null}
            <span className="flex flex-col gap-0.5">
              <span data-slot="timer-digits" className="text-display-lg font-medium text-fg-1 tabular-nums">
                {pad(count)}
                {index === 2 && tenths && mode === 'stopwatch' ? (
                  <span data-slot="timer-tenths" className="text-fg-3">
                    ,{parts.tenths}
                  </span>
                ) : null}
              </span>
              <span data-slot="timer-unit" className="text-caption font-medium text-fg-3">
                {pick(count, forms)}
              </span>
            </span>
          </Fragment>
        ))}
      </div>
      {live}
    </div>
  );
}

/** «12:41,2», with hours once the lap is an hour long: «1:02:41,2». */
function lapTime(value: number): string {
  const { hours, minutes, seconds, tenths } = split(value, 'stopwatch');
  return `${hours ? `${hours}:${pad(minutes)}` : pad(minutes)}:${pad(seconds)},${tenths}`;
}

export interface TimerLapsProps extends Omit<ComponentProps<'ul'>, 'children'> {
  /** Finished laps, oldest first, in ms. */
  laps: readonly number[];
  /** The lap still running, in ms; shown on top. */
  current?: number;
}

/** Laps newest first; with two finished laps or more the slowest is danger-soft-fg, the fastest success-soft-fg. */
export function TimerLaps({ laps, current, className, ...props }: TimerLapsProps) {
  const marked = laps.length >= 2 && Math.max(...laps) !== Math.min(...laps);
  const slowest = marked ? laps.indexOf(Math.max(...laps)) : -1;
  const fastest = marked ? laps.indexOf(Math.min(...laps)) : -1;
  const rows: { number: number; value: number; mark?: 'slowest' | 'fastest' }[] = laps.map((value, index) => ({
    number: index + 1,
    value,
    mark: index === slowest ? 'slowest' : index === fastest ? 'fastest' : undefined,
  }));
  if (current !== undefined) rows.push({ number: laps.length + 1, value: current });

  return (
    <ul data-slot="timer-laps" className={cn('flex flex-col', className)} {...props}>
      {rows.reverse().map((row) => (
        <li
          key={row.number}
          data-slot="timer-lap"
          data-mark={row.mark}
          className="flex h-control-md shrink-0 items-center gap-3 border-t border-separator"
        >
          <span data-slot="timer-lap-label" className="flex-1 text-body-xs font-medium text-fg-2">
            Круг {row.number}
            {row.mark ? <span className="font-regular text-fg-3"> · {row.mark === 'slowest' ? 'самый долгий' : 'самый быстрый'}</span> : null}
          </span>
          <span
            data-slot="timer-lap-time"
            className={cn(
              'text-label-md font-medium tabular-nums',
              row.mark === 'slowest' ? 'text-danger-soft-fg' : row.mark === 'fastest' ? 'text-success-soft-fg' : 'text-fg-1',
            )}
          >
            {lapTime(row.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export interface TimerRecordingProps extends ComponentProps<'span'> {
  children: ReactNode;
}

/** «Идёт запись»: success dot with a ring that breathes every 2 s (still under reduced motion). */
export function TimerRecording({ className, children, ...props }: TimerRecordingProps) {
  return (
    <span data-slot="timer-recording" className={cn('inline-flex h-5 items-center gap-1.5 text-caption font-medium text-success-soft-fg', className)} {...props}>
      <span aria-hidden className="kv-timer-pulse size-2 shrink-0 rounded-full bg-success shadow-[0_0_0_3px_var(--color-success-soft)]" />
      {children}
    </span>
  );
}

/** Milliseconds left until `deadline`, negative once it has passed; re-renders when the shown second changes. */
export function useCountdown(deadline: Date | number): number {
  const target = typeof deadline === 'number' ? deadline : deadline.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      // the display rounds up, so it changes whenever the time left crosses a whole second
      const left = target - Date.now();
      const delay = ((left % SECOND) + SECOND) % SECOND || SECOND;
      timer = setTimeout(() => {
        setNow(Date.now());
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [target]);

  return target - now;
}

export interface UseStopwatchOptions {
  /** Elapsed ms to continue from, e.g. saved on the server. */
  initial?: number;
  /** Finished laps to continue from, oldest first; their sum is part of `initial`. */
  laps?: readonly number[];
  autoStart?: boolean;
  /** Re-render step, ms: 100 for tenths, 1000 for whole seconds. */
  interval?: number;
}

export interface Stopwatch {
  elapsed: number;
  running: boolean;
  /** Finished laps, oldest first. */
  laps: readonly number[];
  /** Time in the lap still running. */
  lapElapsed: number;
  start(): void;
  pause(): void;
  toggle(): void;
  lap(): void;
  reset(): void;
}

interface StopwatchState {
  /** Elapsed ms before the current run. */
  base: number;
  /** Date.now() of the current run, null while paused. */
  since: number | null;
  laps: readonly number[];
}

const elapsedAt = (value: StopwatchState, at: number) => value.base + (value.since === null ? 0 : at - value.since);

/** Stopwatch measured from the clock, not by counting ticks: a background tab does not lose time. */
export function useStopwatch({ initial = 0, laps = [], autoStart = false, interval = 100 }: UseStopwatchOptions = {}): Stopwatch {
  const [state, setState] = useState<StopwatchState>(() => ({ base: initial, since: autoStart ? Date.now() : null, laps }));
  const [now, setNow] = useState(() => Date.now());
  const running = state.since !== null;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [running, interval]);

  const elapsed = elapsedAt(state, running ? now : 0);
  const lapped = state.laps.reduce((sum, lap) => sum + lap, 0);

  const start = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setState((value) => (value.since === null ? { ...value, since: at } : value));
  }, []);
  const pause = useCallback(() => {
    const at = Date.now();
    setState((value) => (value.since === null ? value : { ...value, base: elapsedAt(value, at), since: null }));
  }, []);
  const toggle = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setState((value) => (value.since === null ? { ...value, since: at } : { ...value, base: elapsedAt(value, at), since: null }));
  }, []);
  const lap = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setState((value) => {
      const total = elapsedAt(value, at);
      return { ...value, laps: [...value.laps, total - value.laps.reduce((sum, item) => sum + item, 0)] };
    });
  }, []);
  const reset = useCallback(() => setState({ base: 0, since: null, laps: [] }), []);

  return { elapsed, running, laps: state.laps, lapElapsed: elapsed - lapped, start, pause, toggle, lap, reset };
}
