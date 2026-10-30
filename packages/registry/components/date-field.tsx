import { Calendar as CalendarIcon, CircleX } from 'lucide-react';
import { Fragment, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { cn } from '../lib/cn';
import { Calendar, focusSelectedDay } from './calendar';
import { fieldShell } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

type Part = 'day' | 'month' | 'year';
type Segments = Record<Part, string>;

const PARTS = [
  { part: 'day', label: 'день', placeholder: 'дд', length: 2, min: 1, max: 31 },
  { part: 'month', label: 'месяц', placeholder: 'мм', length: 2, min: 1, max: 12 },
  { part: 'year', label: 'год', placeholder: 'гггг', length: 4, min: 1, max: 9999 },
] as const;

const MONTHS_IN = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
const plural = new Intl.PluralRules('ru');

const EMPTY: Segments = { day: '', month: '', year: '' };
const pad = (n: number, length: number) => String(n).padStart(length, '0');
const toSegments = (date: Date | null | undefined): Segments =>
  date ? { day: pad(date.getDate(), 2), month: pad(date.getMonth() + 1, 2), year: pad(date.getFullYear(), 4) } : EMPTY;

/** The date the segments spell, or null while incomplete or impossible (31.02). */
function toDate({ day, month, year }: Segments): Date | null {
  if (!day || !month || year.length < 4) return null;
  const [d, m, y] = [Number(day), Number(month), Number(year)];
  const date = new Date(y, m - 1, d);
  date.setFullYear(y);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

/** Why the typed date cannot be used: «В феврале 2026 года 28 дней». */
function problem(segments: Segments): string | null {
  const { day, month, year } = segments;
  if (!day && !month && !year) return null;
  if (!day || !month || year.length < 4) return 'Введите дату полностью: дд.мм.гггг';
  const [d, m, y] = [Number(day), Number(month), Number(year)];
  if (m < 1 || m > 12) return 'Месяц — от 01 до 12';
  const last = new Date(y, m, 0).getDate();
  if (d < 1 || d > last) {
    const rule = plural.select(last);
    return `В ${MONTHS_IN[m - 1]} ${y} года ${last} ${rule === 'one' ? 'день' : 'дней'}`;
  }
  return null;
}

export interface DateFieldProps {
  value?: Date | null;
  defaultValue?: Date | null;
  /** A full, possible date, or null once every segment is cleared. */
  onValueChange?: (date: Date | null) => void;
  /** Limits for the calendar behind the button. */
  min?: Date;
  max?: Date;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Wrapper class (set the width here). */
  className?: string;
}

/**
 * Date typed by segments «дд.мм.гггг»: digits fill a segment and jump to the next one, ↑↓ change it,
 * ←→ move between segments, Backspace erases. The button on the right opens the calendar.
 * An impossible date is explained once focus leaves the field.
 */
export function DateField({ value, defaultValue = null, onValueChange, min, max, disabled = false, className, ...aria }: DateFieldProps) {
  const id = useId();
  const [segments, setSegments] = useState(() => toSegments(value ?? defaultValue));
  // A new `value` from the parent replaces whatever is typed.
  const [synced, setSynced] = useState(value);
  if (value !== undefined && value !== synced) {
    setSynced(value);
    setSegments(toSegments(value));
  }
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);
  // Digits typed since the segment got focus: «2» waits for a second digit, «4» completes the day.
  const entry = useRef<{ part: Part; text: string } | null>(null);

  const update = (next: Segments) => {
    setSegments(next);
    setError(null);
    const date = toDate(next);
    if (date) onValueChange?.(date);
    else if (!next.day && !next.month && !next.year) onValueChange?.(null);
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLSpanElement>) => {
    const spec = PARTS[index];
    if (!spec) return;
    const current = segments[spec.part];
    const focus = (to: number) => refs.current[to]?.focus();
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      const text = entry.current?.part === spec.part ? entry.current.text + event.key : event.key;
      const full = text.length >= spec.length || Number(text) * 10 > spec.max;
      entry.current = full ? null : { part: spec.part, text };
      update({ ...segments, [spec.part]: full ? text.padStart(spec.length, '0') : text });
      if (full) focus(index + 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const today = new Date();
      const start = { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() }[spec.part];
      const span = spec.max - spec.min + 1;
      const next = current ? Number(current) + (event.key === 'ArrowUp' ? 1 : -1) : start;
      // Day and month wrap around; the year just stops at its limits.
      const wrapped = spec.part === 'year' ? Math.min(Math.max(next, spec.min), spec.max) : ((next - spec.min + span) % span) + spec.min;
      entry.current = null;
      update({ ...segments, [spec.part]: pad(wrapped, spec.length) });
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      focus(index + (event.key === 'ArrowLeft' ? -1 : 1));
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      if (!current && event.key === 'Backspace') return focus(index - 1);
      const text = current.slice(0, -1);
      entry.current = { part: spec.part, text };
      update({ ...segments, [spec.part]: text });
    }
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    const padded = { ...segments, day: segments.day && pad(Number(segments.day), 2), month: segments.month && pad(Number(segments.month), 2) };
    if (padded.day !== segments.day || padded.month !== segments.month) setSegments(padded);
    setError(problem(padded));
  };

  return (
    <div data-slot="date-field" className={cn('flex flex-col gap-1.5', className)}>
      <div
        role="group"
        {...aria}
        aria-describedby={error ? `${id}-error` : undefined}
        onBlur={onBlur}
        className={cn(fieldShell, 'h-control-md gap-1 rounded-control-md pr-1 pl-3 text-body-sm')}
      >
        <span className="flex min-w-0 flex-1 items-center">
          {PARTS.map((spec, index) => {
            const text = segments[spec.part];
            return (
              <Fragment key={spec.part}>
                {index > 0 ? (
                  <span aria-hidden className="text-fg-3">
                    .
                  </span>
                ) : null}
                <span
                  ref={(node) => {
                    refs.current[index] = node;
                  }}
                  role="spinbutton"
                  tabIndex={disabled ? -1 : 0}
                  aria-label={spec.label}
                  aria-valuemin={spec.min}
                  aria-valuemax={spec.max}
                  aria-valuenow={text ? Number(text) : undefined}
                  aria-valuetext={text || 'Пусто'}
                  aria-invalid={error ? true : undefined}
                  aria-disabled={disabled || undefined}
                  onKeyDown={(event) => onKeyDown(index, event)}
                  onFocus={() => {
                    entry.current = null;
                  }}
                  className={cn(
                    'rounded-xs px-0.5 tabular-nums caret-transparent outline-none select-none focus:bg-accent focus:text-accent-fg',
                    text ? 'text-fg-1' : 'text-fg-3',
                  )}
                >
                  {text || spec.placeholder}
                </span>
              </Fragment>
            );
          })}
        </span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            disabled={disabled}
            aria-label="Открыть календарь"
            className="kv-pressable grid size-7 shrink-0 place-items-center rounded-control-inner text-fg-2 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-1 active:bg-fill-2 data-popup-open:bg-fill-2 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
          >
            <CalendarIcon aria-hidden />
          </PopoverTrigger>
          <PopoverContent ref={popupRef} align="end" sideOffset={8} initialFocus={() => focusSelectedDay(popupRef.current)}>
            <Calendar
              value={toDate(segments)}
              min={min}
              max={max}
              onValueChange={(date) => {
                update(toSegments(date));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1 text-caption text-danger-soft-fg transition-opacity duration-(--duration-quick) ease-out starting:opacity-0 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]"
        >
          <CircleX aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
