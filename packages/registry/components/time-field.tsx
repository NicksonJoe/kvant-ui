import { ChevronDown, Clock } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '../lib/cn';
import { fieldShell, fieldSizes, type FieldSize } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const pad = (value: number) => String(value).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, hour) => pad(hour));

/**
 * «HH:MM» in 24 hours from what was typed: «9» → 09:00, «930» → 09:30, «9:5» → 09:05; '' stays ''.
 * Null when it is not a time of day.
 */
export function parseTime(text: string): string | null {
  const value = text.trim();
  if (!value) return '';
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value) ?? /^(\d{1,2})()$/.exec(value) ?? /^(\d{1,2})(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  return hours <= 23 && minutes <= 59 ? `${pad(hours)}:${pad(minutes)}` : null;
}

/** Digits and one colon; a third digit in a row brings the colon: «174» → «17:4», «930» → «9:30». */
function mask(text: string): string {
  const cleaned = text.replace(/[^\d:]/g, '').slice(0, 5);
  if (!/^\d{3,4}$/.test(cleaned)) return cleaned;
  const split = Number(cleaned.slice(0, 2)) <= 23 ? 2 : 1;
  return `${cleaned.slice(0, split)}:${cleaned.slice(split)}`;
}

/** Minutes since midnight ↔ «HH:MM», wrapping around the day. */
const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const fromMinutes = (total: number) => {
  const minutes = ((total % 1440) + 1440) % 1440;
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
};

export interface TimeFieldProps {
  /** «HH:MM» or '' (no time). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Minutes between the picker's options and per ↑/↓. */
  step?: number;
  placeholder?: string;
  size?: FieldSize;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
}

/**
 * Time of day as «чч:мм», 24 hours whatever the browser's locale: typed digits (numeric keyboard on phones,
 * ↑/↓ step through the day), or hours and minutes picked from two columns. A value that is not a time is put back.
 */
export function TimeField({
  value,
  defaultValue = '',
  onValueChange,
  step = 5,
  placeholder = 'чч:мм',
  size = 'md',
  disabled,
  invalid,
  className,
  ...aria
}: TimeFieldProps) {
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  const [text, setText] = useState(current);
  const [shown, setShown] = useState(current);
  const [open, setOpen] = useState(false);
  // An outside change (another day picked, a reset) replaces what is typed.
  if (current !== shown) {
    setShown(current);
    setText(current);
  }

  const commit = (next: string) => {
    setText(next);
    if (next === current) return;
    setOwn(next);
    setShown(next);
    onValueChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const parsed = parseTime(text);
      if (parsed !== null && parsed !== current) {
        event.preventDefault();
        commit(parsed);
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const base = parseTime(text) || current;
      const minutes = base ? toMinutes(base) : 9 * 60;
      const delta = event.key === 'ArrowUp' ? 15 : -15;
      commit(fromMinutes(base ? Math.round((minutes + delta) / 15) * 15 : minutes));
    }
  };

  const minutes = Array.from({ length: Math.ceil(60 / step) }, (_, index) => pad(index * step));
  const [hour, minute] = current ? [current.slice(0, 2), current.slice(3, 5)] : ['', ''];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        data-slot="time-field"
        className={cn(fieldShell, fieldSizes[size], 'pr-1', open && 'border-ring shadow-[0_0_0_1px_var(--color-ring)]', className)}
      >
        <Clock aria-hidden />
        <input
          {...aria}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={5}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          value={text}
          onChange={(event) => {
            const next = mask(event.target.value);
            setText(next);
            // A complete time applies at once; anything shorter waits for Enter or leaving the field.
            if (/^\d{2}:\d{2}$/.test(next) && parseTime(next) !== null) commit(next);
          }}
          onBlur={() => {
            const parsed = parseTime(text);
            commit(parsed === null ? current : parsed);
          }}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent tabular-nums outline-none placeholder:text-fg-3 disabled:cursor-not-allowed"
        />
        <PopoverTrigger
          disabled={disabled}
          tabIndex={-1}
          aria-label="Выбрать время"
          className="grid size-7 shrink-0 place-items-center rounded-full text-fg-3 hover:bg-fill-1 hover:text-fg-1 data-popup-open:bg-fill-2 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
        >
          <ChevronDown aria-hidden />
        </PopoverTrigger>
      </div>
      <PopoverContent align="end" sideOffset={4} className="w-52 gap-1 rounded-lg p-1" initialFocus={false}>
        <TimeColumns
          open={open}
          hour={hour}
          minute={minute}
          minutes={minutes}
          onHour={(next) => commit(`${next}:${minute || '00'}`)}
          onMinute={(next) => {
            commit(`${hour || '09'}:${next}`);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

interface TimeColumnsProps {
  open: boolean;
  hour: string;
  minute: string;
  minutes: readonly string[];
  onHour: (hour: string) => void;
  onMinute: (minute: string) => void;
}

/** «Часы» and «Минуты»: capsules h32, the chosen one fill-2 and semibold, scrolled to the middle on open. */
function TimeColumns({ open, hour, minute, minutes, onHour, onMinute }: TimeColumnsProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    for (const selected of ref.current?.querySelectorAll('[aria-pressed="true"]') ?? []) selected.scrollIntoView({ block: 'center' });
  }, [open]);

  const column = (label: string, unit: string, options: readonly string[], chosen: string, onPick: (value: string) => void) => (
    <div role="group" aria-label={label} className="flex min-w-0 flex-1 flex-col">
      <span aria-hidden className="pt-1.5 pb-1 text-center text-caption font-medium text-fg-3">
        {label}
      </span>
      <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto overscroll-contain">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-label={`${option} ${unit}`}
            aria-pressed={option === chosen}
            onClick={() => onPick(option)}
            className={cn(
              'grid h-8 shrink-0 place-items-center rounded-full text-body-sm tabular-nums transition-colors duration-(--duration-quick) ease-hover',
              option === chosen ? 'bg-fill-2 font-semibold text-fg-1' : 'text-fg-2 hover:bg-fill-1',
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div ref={ref} className="flex gap-1">
      {column('Часы', 'ч', HOURS, hour, onHour)}
      <span aria-hidden className="w-px shrink-0 bg-separator" />
      {column('Минуты', 'мин', minutes, minute, onMinute)}
    </div>
  );
}
