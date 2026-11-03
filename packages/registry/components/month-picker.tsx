import { Popover as BasePopover } from '@base-ui/react/popover';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { positioner } from '../lib/recipes';
import { useControllable } from '../lib/use-controllable';
import { focusSelectedDay } from './calendar';
import { Input, fieldShell, fieldSizes } from './input';
import { Popover, PopoverTrigger } from './popover';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'] as const;
const STEMS = MONTHS.map((name) => name.slice(0, 3).toLocaleLowerCase('ru'));
const QUARTERS = ['I', 'II', 'III', 'IV'] as const;

export type MonthGranularity = 'month' | 'year';

export interface MonthRange {
  /** First day of the first month. */
  start: Date;
  /** First day of the last month. */
  end: Date;
}

interface Limits {
  min?: Date;
  max?: Date;
}

/** Months are counted from year 0: year × 12 + month, so ranges and limits compare as numbers. */
const toIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();
const fromIndex = (index: number) => new Date(Math.floor(index / 12), index % 12, 1);
const monthName = (index: number) => MONTHS[index % 12] ?? '';
const decadeOf = (year: number) => Math.floor(year / 10) * 10;
const lower = (text: string) => text.toLocaleLowerCase('ru');

const monthOff = ({ min, max }: Limits, index: number) => (min !== undefined && index < toIndex(min)) || (max !== undefined && index > toIndex(max));
const yearOff = ({ min, max }: Limits, year: number) => (min !== undefined && year < min.getFullYear()) || (max !== undefined && year > max.getFullYear());

/** «Октябрь 2026», or «2026» for years. */
const formatValue = (date: Date | null, granularity: MonthGranularity) =>
  date ? (granularity === 'year' ? String(date.getFullYear()) : `${monthName(toIndex(date))} ${date.getFullYear()}`) : '';

/** «Июль — сентябрь 2026», «Ноябрь 2025 — февраль 2026», «Июль 2026». */
function formatRange({ start, end }: MonthRange): string {
  const [from, to] = [toIndex(start), toIndex(end)];
  if (from === to) return formatValue(start, 'month');
  const head = start.getFullYear() === end.getFullYear() ? monthName(from) : formatValue(start, 'month');
  return `${head} — ${lower(monthName(to))} ${end.getFullYear()}`;
}

/**
 * Reads what people type into a month field: «10.2026», «10/26», «окт 26», «Октябрь 2026», «сент.»
 * (a bare month takes `fallbackYear`); for years only four digits. Null when it is not a month.
 */
export function parseMonth(text: string, granularity: MonthGranularity = 'month', fallbackYear = new Date().getFullYear()): Date | null {
  const clean = lower(text.trim()).replace(/ё/g, 'е');
  if (granularity === 'year') return /^\d{4}$/.test(clean) ? new Date(Number(clean), 0, 1) : null;
  const toYear = (digits: string | undefined) => (digits === undefined ? fallbackYear : digits.length === 2 ? 2000 + Number(digits) : Number(digits));
  const numeric = /^(\d{1,2})\s*[./\-\s]\s*(\d{2}|\d{4})$/.exec(clean);
  if (numeric) {
    const month = Number(numeric[1]);
    return month >= 1 && month <= 12 ? new Date(toYear(numeric[2]), month - 1, 1) : null;
  }
  const named = /^([а-я]{3,})\.?(?:\s+(\d{2}|\d{4}))?$/.exec(clean);
  // «мая» is the only month whose genitive changes its first three letters.
  const stem = named?.[1]?.replace(/^мая$/, 'май').slice(0, 3);
  const month = stem === undefined ? -1 : STEMS.indexOf(stem);
  return named && month >= 0 ? new Date(toYear(named[2]), month, 1) : null;
}

/** Next focused cell of a 3-column grid that starts at `first`; `page` is the PageUp / PageDown jump. */
function step(key: string, focused: number, first: number, page: number): number | null {
  const column = (((focused - first) % 3) + 3) % 3;
  const moves: Record<string, number> = {
    ArrowLeft: focused - 1,
    ArrowRight: focused + 1,
    ArrowUp: focused - 3,
    ArrowDown: focused + 3,
    Home: focused - column,
    End: focused + 2 - column,
    PageUp: focused - page,
    PageDown: focused + page,
  };
  return moves[key] ?? null;
}

/** Keyboard moves re-render the grid first, then the new roving cell takes focus. */
function useGridFocus() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const moveFocusRef = useRef(false);
  useEffect(() => {
    if (!moveFocusRef.current) return;
    moveFocusRef.current = false;
    wrapRef.current?.querySelector<HTMLButtonElement>('[role=grid] button[tabindex="0"]')?.focus();
  });
  return { wrapRef, moveFocusRef };
}

function NavButton({ dir, label, disabled, onClick }: { dir: 'prev' | 'next'; label: string; disabled: boolean; onClick: () => void }) {
  const Icon = dir === 'next' ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="kv-pressable grid size-7 shrink-0 place-items-center rounded-full text-fg-2 [--kv-press-scale:var(--scale-press-icon)] hover:not-disabled:bg-fill-1 active:not-disabled:bg-fill-2 disabled:opacity-50 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
    >
      <Icon aria-hidden />
    </button>
  );
}

interface HeaderProps {
  title: ReactNode;
  unit: 'year' | 'decade';
  prevOff: boolean;
  nextOff: boolean;
  onPage: (delta: -1 | 1) => void;
}

function Header({ title, unit, prevOff, nextOff, onPage }: HeaderProps) {
  return (
    <div className="flex h-7 shrink-0 items-center gap-1">
      <h2 aria-live="polite" className="flex min-w-0 flex-1 items-center text-[15px]/5 font-semibold text-fg-1 tabular-nums">
        {title}
      </h2>
      <NavButton dir="prev" label={unit === 'year' ? 'Предыдущий год' : 'Предыдущее десятилетие'} disabled={prevOff} onClick={() => onPage(-1)} />
      <NavButton dir="next" label={unit === 'year' ? 'Следующий год' : 'Следующее десятилетие'} disabled={nextOff} onClick={() => onPage(1)} />
    </div>
  );
}

interface CellSpec {
  key: number;
  label: string;
  name: string;
  selected: boolean;
  current: boolean;
  off: boolean;
  /** Years of the neighbour decades, fg-4. */
  outside?: boolean;
  /** Inside a range, between its ends: accent-soft-fg on the band. */
  inBand?: boolean;
  /** The end a range would get on press: an accent ring. */
  preview?: boolean;
}

interface CellGridProps {
  label: string;
  cells: readonly CellSpec[];
  focused: number;
  /** Year paging slides the grid 12 px; switching months ↔ years scales it in instead. */
  direction?: 'next' | 'prev';
  /** Per row of three: the band from the first to the last column, open at an edge the range continues past. */
  band?: (row: readonly CellSpec[]) => { from: number; to: number; openStart: boolean; openEnd: boolean; preview: boolean } | null;
  onPick: (cell: CellSpec) => void;
  onHover?: (key: number | null) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

// Column i of 3 starts at i × (100% + 12px) / 3; its centre is half a column further.
const columnCentre = (index: number) => `calc(${index} * (100% + 12px) / 3 + (100% - 24px) / 6)`;

function CellGrid({ label, cells, focused, direction, band, onPick, onHover, onKeyDown }: CellGridProps) {
  const rows = [0, 1, 2, 3].map((row) => cells.slice(row * 3, row * 3 + 3));
  return (
    <div
      role="grid"
      aria-label={label}
      data-direction={direction}
      onKeyDown={onKeyDown}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'flex flex-col gap-1',
        direction ? 'kv-month' : 'transition-[opacity,scale] duration-(--duration-quick) ease-out starting:scale-(--scale-enter) starting:opacity-0',
      )}
    >
      {rows.map((row) => {
        const stripe = band?.(row);
        return (
          <div role="row" key={row[0]?.key} className="relative grid grid-cols-3 gap-x-3">
            {stripe ? (
              <span
                aria-hidden
                data-slot="month-picker-band"
                className={cn('absolute inset-y-0', stripe.preview ? 'bg-fill-2' : 'bg-accent-soft')}
                style={{
                  left: stripe.openStart ? 0 : columnCentre(stripe.from),
                  right: stripe.openEnd ? 0 : `calc(100% - ${columnCentre(stripe.to)})`,
                }}
              />
            ) : null}
            {row.map((cell) => (
              <div role="gridcell" key={cell.key} aria-selected={cell.selected || cell.inBand || false}>
                <button
                  type="button"
                  data-slot="month-picker-cell"
                  data-outside={cell.outside || undefined}
                  tabIndex={cell.key === focused ? 0 : -1}
                  aria-label={cell.name}
                  aria-current={cell.current ? 'date' : undefined}
                  aria-disabled={cell.off || undefined}
                  onClick={() => (cell.off ? undefined : onPick(cell))}
                  onMouseEnter={() => onHover?.(cell.off ? null : cell.key)}
                  className={cn(
                    'relative grid h-10 w-full place-items-center rounded-full text-body-sm tabular-nums select-none transition-colors duration-(--duration-fast) ease-out',
                    cell.selected
                      ? 'bg-accent font-semibold text-accent-fg'
                      : cell.preview
                        ? 'bg-surface-1 text-fg-1 shadow-[inset_0_0_0_1.5px_var(--color-accent)]'
                        : cell.inBand
                          ? cn('text-accent-soft-fg', cell.current ? 'font-semibold' : 'font-medium')
                          : cn('hover:bg-fill-2 active:bg-fill-3', cell.current ? 'font-semibold text-accent-soft-fg' : cell.outside ? 'text-fg-4' : 'text-fg-1'),
                    cell.off && 'pointer-events-none opacity-40',
                  )}
                >
                  {cell.label}
                  {cell.current ? (
                    <span aria-hidden className={cn('absolute bottom-1 size-1 rounded-full', cell.selected ? 'bg-accent-fg' : 'bg-accent-soft-fg')} />
                  ) : null}
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export interface MonthCalendarProps extends Limits {
  value?: Date | null;
  defaultValue?: Date | null;
  /** The first day of the picked month (of January for years). */
  onValueChange?: (date: Date) => void;
  /** `year`: a decade of years instead of months. */
  granularity?: MonthGranularity;
  /** Override «today» (demos, tests). */
  today?: Date;
  className?: string;
}

/**
 * Twelve months 3 × 4 for one year; the year in the header opens a decade of years (± a year at the edges).
 * Keyboard: ←→ ±1, ↑↓ ±3, Home / End the row edges, PageUp / PageDown a year (a decade among years).
 */
export function MonthCalendar({
  value,
  defaultValue = null,
  onValueChange,
  granularity = 'month',
  min,
  max,
  today: todayProp,
  className,
}: MonthCalendarProps) {
  const [today] = useState(() => todayProp ?? new Date());
  const [selected, setSelected] = useControllable<Date | null>(value, defaultValue);
  const start = selected ?? today;
  const [view, setView] = useState<'months' | 'years'>(granularity === 'year' ? 'years' : 'months');
  const [focusMonth, setFocusMonth] = useState(() => toIndex(start));
  const [focusYear, setFocusYear] = useState(() => start.getFullYear());
  const [decade, setDecade] = useState(() => decadeOf(start.getFullYear()));
  const [direction, setDirection] = useState<'next' | 'prev' | undefined>(undefined);
  const { wrapRef, moveFocusRef } = useGridFocus();
  const limits = { min, max };
  const year = Math.floor(focusMonth / 12);
  const months = view === 'months';

  const goMonth = (next: number, viaKeyboard: boolean) => {
    const nextYear = Math.floor(next / 12);
    if (nextYear !== year) setDirection(nextYear > year ? 'next' : 'prev');
    moveFocusRef.current = viaKeyboard;
    setFocusMonth(next);
  };

  const goYear = (next: number, viaKeyboard: boolean) => {
    if (next < decade - 1 || next > decade + 10) {
      setDirection(next > decade ? 'next' : 'prev');
      setDecade(decadeOf(next));
    }
    moveFocusRef.current = viaKeyboard;
    setFocusYear(next);
  };

  const switchView = (next: 'months' | 'years') => {
    setDirection(undefined);
    moveFocusRef.current = true;
    setView(next);
  };

  const pickYear = (picked: number) => {
    if (granularity === 'year') {
      setSelected(new Date(picked, 0, 1));
      onValueChange?.(new Date(picked, 0, 1));
      setFocusYear(picked);
      // A neighbour decade's year at the edge pages there.
      if (decadeOf(picked) !== decade) {
        setDirection(picked > decade ? 'next' : 'prev');
        setDecade(decadeOf(picked));
      }
      return;
    }
    setFocusMonth(picked * 12 + (focusMonth % 12));
    switchView('months');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = months ? step(event.key, focusMonth, year * 12, 12) : step(event.key, focusYear, decade - 1, 10);
    if (next === null) return;
    event.preventDefault();
    if (months) goMonth(next, true);
    else goYear(next, true);
  };

  const monthCells: CellSpec[] = Array.from({ length: 12 }, (_, index) => {
    const key = year * 12 + index;
    return {
      key,
      label: monthName(key),
      name: `${monthName(key)} ${year}`,
      selected: selected !== null && toIndex(selected) === key,
      current: toIndex(today) === key,
      off: monthOff(limits, key),
    };
  });
  // In a month picker the decade marks the year being browsed; in a year picker, the value.
  const markedYear = granularity === 'year' ? selected?.getFullYear() : year;
  const yearCells: CellSpec[] = Array.from({ length: 12 }, (_, index) => {
    const key = decade - 1 + index;
    return {
      key,
      label: String(key),
      name: String(key),
      selected: key === markedYear,
      current: key === today.getFullYear(),
      off: yearOff(limits, key),
      outside: index === 0 || index === 11,
    };
  });
  const decadeLabel = `${decade} – ${decade + 9}`;

  return (
    <div data-slot="month-calendar" data-view={view} ref={wrapRef} className={cn('flex w-[288px] flex-col gap-3', className)}>
      <Header
        title={
          months ? (
            <button
              type="button"
              aria-label={`Выбрать год, сейчас ${year}`}
              onClick={() => {
                setFocusYear(year);
                setDecade(decadeOf(year));
                switchView('years');
              }}
              className="kv-pressable inline-flex h-7 items-center gap-1 rounded-full px-1.5 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-2 active:bg-fill-3"
            >
              {year}
              <ChevronDown aria-hidden className="size-3.5 stroke-2 text-fg-3" />
            </button>
          ) : (
            <span className="pl-1.5">{decadeLabel}</span>
          )
        }
        unit={months ? 'year' : 'decade'}
        prevOff={months ? yearOff(limits, year - 1) : yearOff(limits, decade - 1)}
        nextOff={months ? yearOff(limits, year + 1) : yearOff(limits, decade + 10)}
        onPage={(delta) => {
          if (months) {
            setDirection(delta > 0 ? 'next' : 'prev');
            setFocusMonth(focusMonth + delta * 12);
          } else {
            setDirection(delta > 0 ? 'next' : 'prev');
            setDecade(decade + delta * 10);
            setFocusYear(focusYear + delta * 10);
          }
        }}
      />
      <CellGrid
        key={months ? `m${year}` : `y${decade}`}
        label={months ? String(year) : decadeLabel}
        cells={months ? monthCells : yearCells}
        focused={months ? focusMonth : focusYear}
        direction={direction}
        onPick={(cell) => {
          if (!months) return pickYear(cell.key);
          setSelected(fromIndex(cell.key));
          setFocusMonth(cell.key);
          onValueChange?.(fromIndex(cell.key));
        }}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

interface RangeViewProps extends Limits {
  today: Date;
  draft: MonthRange | null;
  /** The first press of a new range, waiting for the second. */
  anchor: number | null;
  onPress: (index: number) => void;
  onQuarter: (range: MonthRange) => void;
}

/** One year with quarter presets above; the band runs from the centre of the first month to the centre of the last. */
function MonthRangeView({ today, draft, anchor, onPress, onQuarter, min, max }: RangeViewProps) {
  const start = draft?.end ?? today;
  const [focusMonth, setFocusMonth] = useState(() => toIndex(start));
  const [direction, setDirection] = useState<'next' | 'prev' | undefined>(undefined);
  const [hover, setHover] = useState<number | null>(null);
  const { wrapRef, moveFocusRef } = useGridFocus();
  const limits = { min, max };
  const year = Math.floor(focusMonth / 12);

  const preview = anchor !== null && hover !== null;
  const [from, to] = anchor !== null ? (preview && hover !== null ? [Math.min(anchor, hover), Math.max(anchor, hover)] : [anchor, anchor]) : draft ? [toIndex(draft.start), toIndex(draft.end)] : [null, null];

  const cells: CellSpec[] = Array.from({ length: 12 }, (_, index) => {
    const key = year * 12 + index;
    const end = key === from || key === to;
    const isEnd = anchor !== null ? key === anchor : end;
    return {
      key,
      label: monthName(key),
      name: `${monthName(key)} ${year}`,
      selected: isEnd,
      current: toIndex(today) === key,
      off: monthOff(limits, key),
      inBand: !isEnd && !preview && from !== null && to !== null && key > from && key < to,
      preview: preview && key === hover && key !== anchor,
    };
  });

  const band = (row: readonly CellSpec[]) => {
    const first = row[0]?.key;
    if (from === null || to === null || from === to || first === undefined) return null;
    const last = first + 2;
    if (to < first || from > last) return null;
    return { from: Math.max(from, first) - first, to: Math.min(to, last) - first, openStart: from < first, openEnd: to > last, preview };
  };

  const page = (delta: -1 | 1) => {
    setDirection(delta > 0 ? 'next' : 'prev');
    setFocusMonth(focusMonth + delta * 12);
  };

  return (
    <div ref={wrapRef} className="flex flex-col gap-3">
      <Header title={<span className="pl-1.5">{year}</span>} unit="year" prevOff={yearOff(limits, year - 1)} nextOff={yearOff(limits, year + 1)} onPage={page} />
      <div className="flex gap-1.5">
        {QUARTERS.map((name, quarter) => {
          const first = year * 12 + quarter * 3;
          const pressed = anchor === null && draft !== null && toIndex(draft.start) === first && toIndex(draft.end) === first + 2;
          const off = monthOff(limits, first) || monthOff(limits, first + 2);
          return (
            <button
              key={name}
              type="button"
              data-slot="month-picker-quarter"
              aria-label={`${name} квартал ${year}`}
              aria-pressed={pressed}
              disabled={off}
              onClick={() => onQuarter({ start: fromIndex(first), end: fromIndex(first + 2) })}
              className={cn(
                'kv-pressable h-7 flex-1 rounded-full text-caption transition-colors duration-(--duration-fast) ease-out disabled:opacity-50',
                pressed ? 'bg-accent-soft font-semibold text-accent-soft-fg' : 'bg-fill-1 font-medium text-fg-2 hover:not-disabled:bg-fill-2 active:not-disabled:bg-fill-3',
              )}
            >
              {name} кв
            </button>
          );
        })}
      </div>
      <CellGrid
        key={year}
        label={String(year)}
        cells={cells}
        focused={focusMonth}
        direction={direction}
        band={band}
        onPick={(cell) => {
          setFocusMonth(cell.key);
          onPress(cell.key);
        }}
        onHover={setHover}
        onKeyDown={(event) => {
          const next = step(event.key, focusMonth, year * 12, 12);
          if (next === null) return;
          event.preventDefault();
          if (Math.floor(next / 12) !== year) setDirection(next > focusMonth ? 'next' : 'prev');
          moveFocusRef.current = true;
          setFocusMonth(next);
        }}
      />
    </div>
  );
}

const popupClass = 'kv-popup flex w-80 max-w-(--available-width) flex-col gap-3 rounded-xl bg-overlay p-4 text-fg-1 shadow-overlay outline-none';

export interface MonthPickerProps extends Limits {
  value?: Date | null;
  defaultValue?: Date | null;
  /** The first day of the month (of January for years), or null once the field is cleared. */
  onValueChange?: (date: Date | null) => void;
  granularity?: MonthGranularity;
  /** Default: «Месяц и год», for years «Год». */
  placeholder?: string;
  disabled?: boolean;
  /** Standalone invalid state; inside <Field error> it is set for you. */
  invalid?: boolean;
  today?: Date;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Field class (set the width here). */
  className?: string;
}

/**
 * Month field: type «10.2026» or «окт 26», or press it for the months below (4 px, left edges aligned).
 * ↓ moves into the months, Enter tidies the text, a pick closes the popover at once.
 */
export function MonthPicker({
  value,
  defaultValue = null,
  onValueChange,
  granularity = 'month',
  min,
  max,
  placeholder = granularity === 'year' ? 'Год' : 'Месяц и год',
  disabled = false,
  invalid,
  today: todayProp,
  className,
  ...aria
}: MonthPickerProps) {
  const [today] = useState(() => todayProp ?? new Date());
  const [selected, setSelected] = useControllable<Date | null>(value, defaultValue, onValueChange);
  const [text, setText] = useState(() => formatValue(selected, granularity));
  // A new month from the parent replaces the text; the field's own commits do not.
  const [synced, setSynced] = useState(selected ? toIndex(selected) : null);
  const current = selected ? toIndex(selected) : null;
  if (current !== synced) {
    setSynced(current);
    setText(formatValue(selected, granularity));
  }
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const viaKeyboard = useRef(false);
  // The month before this round of typing: garbage left in the field brings it back.
  const before = useRef(selected);
  const popupId = useId();
  const limits = { min, max };

  const commit = (date: Date | null) => {
    setSynced(date ? toIndex(date) : null);
    setSelected(date);
  };

  const type = (next: string) => {
    setText(next);
    if (next.trim() === '') {
      if (selected !== null) commit(null);
      return;
    }
    const parsed = parseMonth(next, granularity, today.getFullYear());
    const allowed = parsed && (granularity === 'year' ? !yearOff(limits, parsed.getFullYear()) : !monthOff(limits, toIndex(parsed)));
    if (parsed && allowed && toIndex(parsed) !== current) commit(parsed);
  };

  const show = (keyboard: boolean) => {
    viaKeyboard.current = keyboard;
    setOpen(true);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        // A press on the field itself is not «outside»: it keeps the months open.
        const target = details.event?.target;
        if (!next && details.reason === 'outside-press' && target instanceof Node && inputRef.current?.parentElement?.contains(target)) return;
        setOpen(next);
      }}
    >
      <Input
        ref={inputRef}
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        autoComplete="off"
        {...aria}
        data-slot="month-picker"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        invalid={invalid}
        prefix={<CalendarIcon aria-hidden />}
        onClear={disabled ? undefined : () => type('')}
        onChange={(event) => type(event.currentTarget.value)}
        onClick={() => show(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (open) focusSelectedDay(popupRef.current);
            else show(true);
          } else if (event.key === 'Enter') {
            setText(formatValue(selected, granularity));
            setOpen(false);
          }
        }}
        onFocus={() => {
          before.current = selected;
        }}
        onBlur={(event) => {
          if (popupRef.current?.contains(event.relatedTarget)) return;
          const kept = text.trim() !== '' && selected === null ? before.current : selected;
          if (kept !== selected) commit(kept);
          setText(formatValue(kept, granularity));
          setOpen(false);
        }}
        className={cn('hover:[&>svg]:text-fg-2', granularity === 'year' && 'tabular-nums', className)}
      />
      <BasePopover.Portal>
        <BasePopover.Positioner anchor={() => inputRef.current?.parentElement ?? null} side="bottom" align="start" sideOffset={4} className={positioner}>
          <BasePopover.Popup
            ref={popupRef}
            id={popupId}
            data-slot="month-picker-popup"
            initialFocus={() => (viaKeyboard.current ? focusSelectedDay(popupRef.current) : false)}
            finalFocus={inputRef}
            className={popupClass}
          >
            <MonthCalendar
              key={current ?? 'empty'}
              value={selected}
              granularity={granularity}
              min={min}
              max={max}
              today={today}
              onValueChange={(date) => {
                commit(date);
                setText(formatValue(date, granularity));
                setOpen(false);
              }}
            />
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </Popover>
  );
}

export interface MonthRangePickerProps extends Limits {
  value?: MonthRange | null;
  defaultValue?: MonthRange | null;
  /** Fires on «Применить». */
  onValueChange?: (range: MonthRange) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  today?: Date;
  'aria-label'?: string;
  className?: string;
}

/**
 * Months from–to with quarter presets. A quarter or two presses draw a draft (the ends swap when picked
 * backwards); the value changes only on «Применить», Esc keeps the old one.
 */
export function MonthRangePicker({
  value,
  defaultValue = null,
  onValueChange,
  placeholder = 'Период',
  disabled,
  invalid,
  today: todayProp,
  className,
  'aria-label': ariaLabel,
  min,
  max,
}: MonthRangePickerProps) {
  const [today] = useState(() => todayProp ?? new Date());
  const [committed, setCommitted] = useControllable<MonthRange | null>(value, defaultValue);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MonthRange | null>(committed);
  const [anchor, setAnchor] = useState<number | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const onOpenChange = (next: boolean) => {
    if (next) {
      setDraft(committed);
      setAnchor(null);
    }
    setOpen(next);
  };

  const press = (index: number) => {
    if (anchor === null) {
      setAnchor(index);
      setDraft(null);
      return;
    }
    setDraft({ start: fromIndex(Math.min(anchor, index)), end: fromIndex(Math.max(anchor, index)) });
    setAnchor(null);
  };

  const apply = () => {
    if (!draft) return;
    setCommitted(draft);
    onValueChange?.(draft);
    setOpen(false);
  };

  const shown = committed ? formatRange(committed) : null;
  const [head, tail] = shown?.split(' — ') ?? [];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        data-slot="month-range-picker"
        className={cn(
          fieldShell,
          fieldSizes.md,
          'text-left hover:[&>svg]:text-fg-2 aria-invalid:border-danger data-popup-open:border-ring data-popup-open:shadow-[0_0_0_1px_var(--color-ring)] focus-visible:border-ring focus-visible:shadow-[0_0_0_1px_var(--color-ring)] focus-visible:outline-none disabled:bg-surface-2 disabled:opacity-50',
          className,
        )}
      >
        <CalendarIcon aria-hidden />
        <span className={cn('min-w-0 flex-1 truncate', !shown && 'text-fg-3')}>
          {tail === undefined ? (shown ?? placeholder) : (
            <>
              {head}
              <span className="px-0.5 text-fg-4">{' — '}</span>
              {tail}
            </>
          )}
        </span>
      </PopoverTrigger>
      <BasePopover.Portal>
        <BasePopover.Positioner side="bottom" align="start" sideOffset={4} className={positioner}>
          <BasePopover.Popup ref={popupRef} data-slot="month-range-popup" initialFocus={() => focusSelectedDay(popupRef.current)} className={popupClass}>
            <MonthRangeView
              today={today}
              draft={draft}
              anchor={anchor}
              min={min}
              max={max}
              onPress={press}
              onQuarter={(range) => {
                setAnchor(null);
                setDraft(range);
              }}
            />
            <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-t border-separator px-1.5 pt-1">
              <p className="min-w-0 truncate text-label-sm text-fg-2">
                {draft ? formatRange(draft) : anchor !== null ? 'Выберите конец периода' : 'Выберите начало и конец'}
              </p>
              <button
                type="button"
                disabled={!draft}
                onClick={apply}
                className="kv-pressable h-7 shrink-0 rounded-full bg-accent px-3 text-label-sm font-medium text-accent-fg hover:not-disabled:bg-accent-hover active:not-disabled:bg-accent-pressed disabled:opacity-50"
              >
                Применить
              </button>
            </div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </Popover>
  );
}
