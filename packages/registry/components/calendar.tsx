import { Popover as BasePopover } from '@base-ui/react/popover';
import { Calendar as CalendarIcon, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { positioner } from '../lib/recipes';
import { Button } from './button';
import { fieldShell, fieldSizes, type FieldSize } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const monthName = new Intl.DateTimeFormat('ru', { month: 'long' });
const fullDate = new Intl.DateTimeFormat('ru', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('ru', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dayMonth = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' });
const plural = new Intl.PluralRules('ru');
const WEEKDAYS = [
  ['Пн', 'понедельник'],
  ['Вт', 'вторник'],
  ['Ср', 'среда'],
  ['Чт', 'четверг'],
  ['Пт', 'пятница'],
  ['Сб', 'суббота'],
  ['Вс', 'воскресенье'],
] as const;

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthsBetween = (a: Date, b: Date) => (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
/** Monday = 0 … Sunday = 6. */
const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

/** Same day-of-month n months later, clamped to the month length (31.01 + 1 → 28/29.02). */
export function addMonths(d: Date, n: number): Date {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last));
}

/** Weeks (Monday first) covering the month: 4–6 rows, neighbour days included. */
export function monthWeeks(month: Date): Date[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -weekdayIndex(first));
  const weeks: Date[][] = [];
  for (let cursor = start; weeks.length === 0 || sameMonth(cursor, first); cursor = addDays(cursor, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
  }
  return weeks;
}

/** «29.10.2026». */
export const formatDate = (d: Date) => shortDate.format(d);
/** «Октябрь 2026». */
export const formatMonth = (d: Date) => {
  const name = monthName.format(d);
  return `${name.charAt(0).toLocaleUpperCase('ru')}${name.slice(1)} ${d.getFullYear()}`;
};

export interface DateRange {
  start: Date;
  end: Date;
}

interface DayLimits {
  min?: Date;
  max?: Date;
  isDateDisabled?: (date: Date) => boolean;
}

const isOff = ({ min, max, isDateDisabled }: DayLimits, d: Date) =>
  (min !== undefined && d < day(min)) || (max !== undefined && d > day(max)) || (isDateDisabled?.(d) ?? false);

/** Roving focus over the visible months: arrows ±day/week, Home/End, PageUp/PageDown (Shift: year). */
function useCursor(initialFocus: Date, initialFirst: Date, count: number) {
  const [focused, setFocused] = useState(() => day(initialFocus));
  const [first, setFirst] = useState(() => startOfMonth(initialFirst));
  const [direction, setDirection] = useState<'next' | 'prev' | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const moveFocusRef = useRef(false);

  useEffect(() => {
    if (!moveFocusRef.current) return;
    moveFocusRef.current = false;
    wrapRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  });

  const scroll = (nextFirst: Date) => {
    setDirection(nextFirst > first ? 'next' : 'prev');
    setFirst(nextFirst);
  };

  /** Moves the focused day, scrolling the months when it leaves them. */
  const go = (next: Date, viaKeyboard: boolean) => {
    const offset = monthsBetween(first, next);
    if (offset < 0) scroll(startOfMonth(next));
    else if (offset >= count) scroll(startOfMonth(addMonths(next, 1 - count)));
    moveFocusRef.current = viaKeyboard;
    setFocused(day(next));
  };

  /** Prev / next buttons: every visible month moves by one. */
  const page = (delta: number) => {
    scroll(addMonths(first, delta));
    setFocused(addMonths(focused, delta));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -weekdayIndex(focused)),
      End: () => addDays(focused, 6 - weekdayIndex(focused)),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    go(step(), true);
  };

  const months = Array.from({ length: count }, (_, i) => addMonths(first, i));
  return { focused, direction, wrapRef, go, page, onKeyDown, months };
}

function NavButton({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  const Icon = dir === 'next' ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      aria-label={dir === 'next' ? 'Следующий месяц' : 'Предыдущий месяц'}
      onClick={onClick}
      className="kv-pressable grid size-7 shrink-0 place-items-center rounded-control-xs text-fg-2 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-1 active:bg-fill-2 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
    >
      <Icon aria-hidden />
    </button>
  );
}

interface MonthGridProps {
  month: Date;
  focused: Date;
  today: Date;
  limits: DayLimits;
  direction?: 'next' | 'prev';
  /** Days drawn as filled accent circles. */
  isSelected: (d: Date) => boolean;
  /** Range mode: an accent-soft band per week; days of other months are hidden. */
  range?: DateRange | null;
  onSelect: (d: Date) => void;
}

function MonthGrid({ month, focused, today, limits, direction, isSelected, range, onSelect }: MonthGridProps) {
  const title = formatMonth(month);
  const inRange = (d: Date) => !!range && d >= day(range.start) && d <= day(range.end);
  return (
    <div role="grid" aria-label={title} className="flex flex-col gap-1">
      <div role="row" className="grid grid-cols-7 gap-x-1.5">
        {WEEKDAYS.map(([short, long]) => (
          <abbr key={short} role="columnheader" title={long} className="grid h-6 place-items-center text-caption font-medium text-fg-3 no-underline">
            {short}
          </abbr>
        ))}
      </div>
      <div key={`${month.getFullYear()}-${month.getMonth()}`} data-direction={direction} className="kv-month flex flex-col gap-1">
        {monthWeeks(month).map((week) => {
          const banded = range ? week.flatMap((d, i) => (sameMonth(d, month) && inRange(d) ? [i] : [])) : [];
          const from = banded[0];
          const to = banded.at(-1);
          return (
            <div role="row" key={week[0]?.toISOString()} className="relative grid grid-cols-7 gap-x-1.5">
              {from !== undefined && to !== undefined && to > from ? (
                <span
                  aria-hidden
                  className="absolute inset-y-0 rounded-full bg-accent-soft transition-[left,width] duration-(--duration-quick) ease-out starting:w-0"
                  // 7 columns of 36 with 6 px gaps: column i starts at i × (100% + 6px) / 7.
                  style={{ left: `calc(${from} * (100% + 6px) / 7)`, width: `calc(${to - from + 1} * (100% + 6px) / 7 - 6px)` }}
                />
              ) : null}
              {week.map((date) => {
                const outside = !sameMonth(date, month);
                if (range !== undefined && outside) return <div role="gridcell" key={date.toISOString()} />;
                const selected = isSelected(date);
                const isToday = sameDay(date, today);
                const off = isOff(limits, date);
                return (
                  <div role="gridcell" key={date.toISOString()} aria-selected={selected || inRange(date)}>
                    <button
                      type="button"
                      tabIndex={sameDay(date, focused) ? 0 : -1}
                      aria-label={fullDate.format(date)}
                      aria-current={isToday ? 'date' : undefined}
                      aria-disabled={off || undefined}
                      onClick={() => (off ? undefined : onSelect(date))}
                      className={cn(
                        'relative grid size-9 place-items-center rounded-full text-body-sm tabular-nums transition-colors duration-(--duration-fast) ease-out',
                        selected
                          ? 'bg-accent font-semibold text-accent-fg'
                          : cn('hover:bg-fill-2 active:bg-fill-3', isToday ? 'text-accent-soft-fg' : outside ? 'text-fg-4' : 'text-fg-1'),
                        isToday && 'font-semibold',
                        off && 'pointer-events-none opacity-40',
                      )}
                    >
                      {date.getDate()}
                      {isToday ? (
                        <span aria-hidden className={cn('absolute bottom-1 size-1 rounded-full', selected ? 'bg-accent-fg' : 'bg-accent-soft-fg')} />
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface CalendarProps extends DayLimits {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date) => void;
  /** Month shown first; defaults to the value or today. */
  defaultMonth?: Date;
  /** Override «today» (demos, tests). */
  today?: Date;
  className?: string;
}

/**
 * Month grid, Monday first. Keyboard: arrows ±1 day / ±1 week, Home/End week edges,
 * PageUp/PageDown ±1 month (Shift: ±1 year), Enter/Space selects.
 */
export function Calendar({ value, defaultValue = null, onValueChange, defaultMonth, min, max, isDateDisabled, today: todayProp, className }: CalendarProps) {
  const [today] = useState(() => day(todayProp ?? new Date()));
  const [own, setOwn] = useState<Date | null>(defaultValue);
  const selected = value === undefined ? own : value;
  const start = defaultMonth ?? selected ?? today;
  const { focused, direction, wrapRef, go, page, onKeyDown, months } = useCursor(start, start, 1);
  const month = months[0] ?? focused;

  const select = (d: Date) => {
    setOwn(d);
    go(d, false);
    onValueChange?.(d);
  };

  return (
    <div data-slot="calendar" ref={wrapRef} onKeyDown={onKeyDown} className={cn('flex w-[288px] flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <h2 aria-live="polite" className="pl-1.5 text-[15px]/5 font-semibold text-fg-1">
          {formatMonth(month)}
        </h2>
        <div className="flex gap-1">
          <NavButton dir="prev" onClick={() => page(-1)} />
          <NavButton dir="next" onClick={() => page(1)} />
        </div>
      </div>
      <MonthGrid
        month={month}
        focused={focused}
        today={today}
        limits={{ min, max, isDateDisabled }}
        direction={direction}
        isSelected={(d) => sameDay(d, selected)}
        onSelect={select}
      />
    </div>
  );
}

export interface RangeCalendarProps extends DayLimits {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  /** Fires when the second end is picked. */
  onValueChange?: (range: DateRange) => void;
  /** First month shown; defaults to the month before the range end (or today). */
  defaultMonth?: Date;
  /** Months side by side. */
  months?: 1 | 2;
  today?: Date;
  className?: string;
}

/** Range calendar: the first press sets the start, the second the end; ends swap when picked backwards. */
export function RangeCalendar({
  value,
  defaultValue = null,
  onValueChange,
  defaultMonth,
  months: count = 2,
  min,
  max,
  isDateDisabled,
  today: todayProp,
  className,
}: RangeCalendarProps) {
  const [today] = useState(() => day(todayProp ?? new Date()));
  const [own, setOwn] = useState<DateRange | null>(defaultValue);
  const range = value === undefined ? own : value;
  const [anchor, setAnchor] = useState<Date | null>(null);
  const focusStart = range?.end ?? today;
  const { focused, direction, wrapRef, go, page, onKeyDown, months } = useCursor(focusStart, defaultMonth ?? addMonths(focusStart, 1 - count), count);
  const shown = anchor ? { start: anchor, end: anchor } : range;

  const select = (d: Date) => {
    go(d, false);
    if (!anchor) {
      setAnchor(d);
      return;
    }
    const next = d < anchor ? { start: d, end: anchor } : { start: anchor, end: d };
    setAnchor(null);
    setOwn(next);
    onValueChange?.(next);
  };

  return (
    <div data-slot="range-calendar" ref={wrapRef} onKeyDown={onKeyDown} className={cn('flex gap-8', className)}>
      {months.map((month, index) => (
        <div key={index} className="flex w-[288px] shrink-0 flex-col gap-3">
          <div className="flex h-7 items-center">
            {index === 0 ? <NavButton dir="prev" onClick={() => page(-1)} /> : <span className="size-7" />}
            <h2 aria-live="polite" className="flex-1 text-center text-[15px]/5 font-semibold text-fg-1">
              {formatMonth(month)}
            </h2>
            {index === count - 1 ? <NavButton dir="next" onClick={() => page(1)} /> : <span className="size-7" />}
          </div>
          <MonthGrid
            month={month}
            focused={focused}
            today={today}
            limits={{ min, max, isDateDisabled }}
            direction={direction}
            isSelected={(d) => sameDay(d, shown?.start) || sameDay(d, shown?.end)}
            range={shown}
            onSelect={select}
          />
        </div>
      ))}
    </div>
  );
}

export interface DatePickerProps extends Omit<CalendarProps, 'className' | 'onValueChange'> {
  onValueChange?: (date: Date | null) => void;
  placeholder?: string;
  size?: FieldSize;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

/** Opening a calendar popover lands on the selected day (or today), not on the month buttons. */
export const focusSelectedDay = (popup: HTMLElement | null): HTMLElement | true =>
  popup?.querySelector<HTMLElement>('button[tabindex="0"]') ?? true;

const triggerLook = (size: FieldSize) =>
  cn(
    fieldShell,
    fieldSizes[size],
    'justify-between text-left data-popup-open:border-ring data-popup-open:shadow-[0_0_0_1px_var(--color-ring)] focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-[0_0_0_1px_var(--color-ring)] disabled:opacity-50 disabled:bg-surface-2',
  );

/** Field-looking trigger («29.10.2026») that opens the calendar in a 320 popover; picking a day closes it. */
export function DatePicker({
  value,
  defaultValue = null,
  onValueChange,
  placeholder = 'дд.мм.гггг',
  size = 'md',
  disabled,
  className,
  'aria-label': ariaLabel,
  ...calendar
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState<Date | null>(defaultValue);
  const selected = value === undefined ? own : value;
  const popupRef = useRef<HTMLDivElement>(null);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger disabled={disabled} aria-label={ariaLabel} className={cn(triggerLook(size), className)}>
        <span className={cn('tabular-nums', !selected && 'text-fg-3')}>{selected ? formatDate(selected) : placeholder}</span>
        <CalendarIcon aria-hidden />
      </PopoverTrigger>
      <PopoverContent ref={popupRef} align="start" sideOffset={4} initialFocus={() => focusSelectedDay(popupRef.current)}>
        <Calendar
          {...calendar}
          value={selected}
          onValueChange={(date) => {
            setOwn(date);
            onValueChange?.(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface DateRangePreset {
  label: string;
  range: (today: Date) => DateRange;
}

/** «Сегодня», «7 дней», «30 дней», «Этот месяц» — each ends today. */
export const DATE_RANGE_PRESETS: readonly DateRangePreset[] = [
  { label: 'Сегодня', range: (today) => ({ start: today, end: today }) },
  { label: '7 дней', range: (today) => ({ start: addDays(today, -6), end: today }) },
  { label: '30 дней', range: (today) => ({ start: addDays(today, -29), end: today }) },
  { label: 'Этот месяц', range: (today) => ({ start: startOfMonth(today), end: today }) },
];

const sameRange = (a: DateRange, b: DateRange) => sameDay(a.start, b.start) && sameDay(a.end, b.end);
const rangeDays = ({ start, end }: DateRange) => Math.round((day(end).getTime() - day(start).getTime()) / 86_400_000) + 1;

/** «30 дней», «1 день», «2 дня». */
function daysLabel(n: number): string {
  const rule = plural.select(n);
  return `${n} ${rule === 'one' ? 'день' : rule === 'few' ? 'дня' : 'дней'}`;
}

/** «30 сентября — 29 октября 2026»; the start year only when it differs from the end year. */
function formatRangeLong({ start, end }: DateRange): string {
  const tail = `${dayMonth.format(end)} ${end.getFullYear()}`;
  if (sameDay(start, end)) return tail;
  const head = start.getFullYear() === end.getFullYear() ? dayMonth.format(start) : `${dayMonth.format(start)} ${start.getFullYear()}`;
  return `${head} — ${tail}`;
}

export interface DateRangePickerProps extends Omit<RangeCalendarProps, 'className' | 'months'> {
  /** Quick ranges on the left; the one matching the draft stays highlighted. Pass `[]` to hide the column. */
  presets?: readonly DateRangePreset[];
  placeholder?: ReactNode;
  size?: FieldSize;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

/**
 * Two months with presets. A preset or two presses draw a draft range; the value changes only on
 * «Применить», so an edge can be fixed calmly. «Отмена» and Esc keep the old range.
 */
export function DateRangePicker({
  value,
  defaultValue = null,
  onValueChange,
  presets = DATE_RANGE_PRESETS,
  placeholder = 'дд.мм.гггг — дд.мм.гггг',
  size = 'md',
  disabled,
  className,
  'aria-label': ariaLabel,
  today: todayProp,
  defaultMonth,
  ...limits
}: DateRangePickerProps) {
  const [today] = useState(() => day(todayProp ?? new Date()));
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState<DateRange | null>(defaultValue);
  const committed = value === undefined ? own : value;
  const [draft, setDraft] = useState<DateRange | null>(committed);
  // A preset remounts the months so they scroll to its range.
  const [view, setView] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const active = draft ? presets.find((preset) => sameRange(preset.range(today), draft)) : undefined;

  const onOpenChange = (next: boolean) => {
    if (next) setDraft(committed);
    setOpen(next);
  };

  const apply = () => {
    if (!draft) return;
    setOwn(draft);
    onValueChange?.(draft);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger disabled={disabled} aria-label={ariaLabel} className={cn(triggerLook(size), className)}>
        <CalendarIcon aria-hidden />
        <span className={cn('min-w-0 flex-1 truncate tabular-nums', !committed && 'text-fg-3')}>
          {committed ? `${formatDate(committed.start)} — ${formatDate(committed.end)}` : placeholder}
        </span>
        <ChevronDown aria-hidden className="transition-transform duration-(--duration-quick) ease-out group-data-popup-open/field:rotate-180" />
      </PopoverTrigger>
      <BasePopover.Portal>
        <BasePopover.Positioner side="bottom" align="start" sideOffset={4} className={positioner}>
          <BasePopover.Popup
            ref={popupRef}
            initialFocus={() => focusSelectedDay(popupRef.current)}
            data-slot="date-range-picker"
            className="kv-popup flex max-w-(--available-width) flex-col overflow-x-auto rounded-xl bg-overlay text-fg-1 shadow-overlay outline-none"
          >
            <div className="flex">
              {presets.length > 0 ? (
                <div className="flex w-42 shrink-0 flex-col gap-0.5 border-r border-separator p-3">
                  <span className="px-3 py-1.5 text-caption font-medium text-fg-3">Быстрый выбор</span>
                  {presets.map((preset) => {
                    const pressed = preset === active;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        aria-pressed={pressed}
                        onClick={() => {
                          setDraft(preset.range(today));
                          setView((n) => n + 1);
                        }}
                        className={cn(
                          'flex h-8 items-center gap-2 rounded-control-sm px-3 text-left text-body-sm transition-colors duration-(--duration-quick) ease-hover [&_svg]:size-3.5 [&_svg]:stroke-2',
                          pressed ? 'bg-accent-soft font-medium text-accent-soft-fg' : 'text-fg-1 hover:bg-fill-1 active:bg-fill-2',
                        )}
                      >
                        <span className="flex-1">{preset.label}</span>
                        {pressed ? <Check aria-hidden /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <RangeCalendar
                key={view}
                {...limits}
                today={today}
                value={draft}
                onValueChange={setDraft}
                defaultMonth={view > 0 && draft ? addMonths(draft.end, -1) : defaultMonth}
                className="p-4"
              />
            </div>
            <div className="flex items-center gap-2 border-t border-separator px-4 py-3">
              <p className="flex min-w-0 flex-1 items-baseline gap-2 text-label-sm tabular-nums">
                {draft ? (
                  <>
                    <span className="font-medium text-fg-1">{formatRangeLong(draft)}</span>
                    <span className="text-fg-3">{daysLabel(rangeDays(draft))}</span>
                  </>
                ) : (
                  <span className="text-fg-3">Выберите начало и конец</span>
                )}
              </p>
              <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button size="sm" disabled={!draft} onClick={apply}>
                Применить
              </Button>
            </div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </Popover>
  );
}
