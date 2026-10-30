import { Popover as BasePopover } from '@base-ui/react/popover';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Check, ChevronDown, Clock } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '../lib/cn';
import { positioner } from '../lib/recipes';
import { fieldShell, fieldSizes, type FieldSize } from './input';
import { Popover, PopoverTrigger } from './popover';

const two = (n: number) => String(n).padStart(2, '0');

/** Scrolls the option's column so the option sits in the middle. */
function centre(option: HTMLElement, behavior: ScrollBehavior) {
  const column = option.parentElement;
  // Optional call: jsdom has no scrollTo on elements.
  column?.scrollTo?.({ top: option.offsetTop - (column.clientHeight - option.offsetHeight) / 2, behavior });
}

export interface TimePickerProps {
  /** 24-hour «HH:MM». */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (time: string) => void;
  /** Minute step: 5 → 00, 05 … 55. */
  step?: number;
  /** Earliest and latest «HH:MM»; times outside are dimmed and skipped. */
  min?: string;
  max?: string;
  placeholder?: string;
  size?: FieldSize;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

/**
 * Field-looking trigger with hour and minute columns in a popover. Picking a minute closes it.
 * ↑↓ move and pick inside a column, ←→ switch columns, Enter closes.
 */
export function TimePicker({
  value,
  defaultValue = null,
  onValueChange,
  step = 5,
  min,
  max,
  placeholder = '--:--',
  size = 'md',
  disabled,
  className,
  'aria-label': ariaLabel,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState(defaultValue);
  const time = value === undefined ? own : value;
  const [hour, minute] = time ? time.split(':').map(Number) : [undefined, undefined];
  const popupRef = useRef<HTMLDivElement | null>(null);
  // Column whose new pick should take focus after the next render (keyboard moves).
  const moveFocus = useRef<'hours' | 'minutes' | null>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
  const off = (h: number, m: number) => (min !== undefined && `${two(h)}:${two(m)}` < min) || (max !== undefined && `${two(h)}:${two(m)}` > max);
  const hourOff = (h: number) => minutes.every((m) => off(h, m));

  // The popup mounts after `open` flips (portal), so centre the selection when its node attaches.
  const attachPopup = useCallback((node: HTMLDivElement | null) => {
    popupRef.current = node;
    for (const option of node?.querySelectorAll<HTMLElement>('[aria-selected="true"]') ?? []) centre(option, 'instant');
  }, []);
  // Keyboard picks glide the column. Only the column scrolls, never the page.
  useEffect(() => {
    const column = moveFocus.current;
    if (!column) return;
    moveFocus.current = null;
    const picked = popupRef.current?.querySelector<HTMLElement>(`[data-column="${column}"] [tabindex="0"]`);
    picked?.focus({ preventScroll: true });
    if (picked) centre(picked, 'smooth');
  });

  const commit = (h: number, m: number, close: boolean) => {
    const next = `${two(h)}:${two(m)}`;
    setOwn(next);
    onValueChange?.(next);
    if (close) setOpen(false);
  };

  const pickHour = (h: number) => {
    if (hourOff(h)) return;
    const m = minute !== undefined && !off(h, minute) ? minute : minutes.find((item) => !off(h, item));
    if (m !== undefined) commit(h, m, false);
  };

  const pickMinute = (m: number, close: boolean) => {
    const h = hour ?? hours.find((item) => !off(item, m));
    if (h === undefined || off(h, m)) return;
    commit(h, m, close);
  };

  const onKeyDown = (column: 'hours' | 'minutes', event: KeyboardEvent<HTMLDivElement>) => {
    const list = column === 'hours' ? hours : minutes;
    const current = column === 'hours' ? hour : minute;
    const index = current === undefined ? -1 : list.indexOf(current);
    const usable = (item: number) => (column === 'hours' ? !hourOff(item) : hour === undefined || !off(hour, item));
    const seek = (from: number, delta: number) => {
      for (let i = from + delta; i >= 0 && i < list.length; i += delta) if (usable(list[i] ?? -1)) return list[i];
      return undefined;
    };
    const moves: Record<string, () => number | undefined> = {
      ArrowDown: () => seek(index, 1),
      ArrowUp: () => seek(index, -1),
      Home: () => seek(-1, 1),
      End: () => seek(list.length, -1),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      const next = move();
      if (next === undefined) return;
      moveFocus.current = column;
      if (column === 'hours') pickHour(next);
      else pickMinute(next, false);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const other = column === 'hours' ? 'minutes' : 'hours';
      popupRef.current?.querySelector<HTMLElement>(`[data-column="${other}"] [tabindex="0"]`)?.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      setOpen(false);
    }
  };

  const columnView = (column: 'hours' | 'minutes') => {
    const list = column === 'hours' ? hours : minutes;
    const current = column === 'hours' ? hour : minute;
    const first = list.find((item) => (column === 'hours' ? !hourOff(item) : hour === undefined || !off(hour, item)));
    return (
      <div
        role="listbox"
        aria-label={column === 'hours' ? 'Часы' : 'Минуты'}
        data-column={column}
        onKeyDown={(event) => onKeyDown(column, event)}
        className="relative flex max-h-42 flex-1 basis-0 snap-y flex-col gap-0.5 overflow-y-auto overscroll-contain [scrollbar-width:none]"
      >
        {list.map((item) => {
          const selected = item === current;
          const dim = column === 'hours' ? hourOff(item) : hour !== undefined && off(hour, item);
          return (
            <div
              key={item}
              role="option"
              aria-selected={selected}
              aria-disabled={dim || undefined}
              tabIndex={(current === undefined ? item === first : selected) ? 0 : -1}
              onClick={() => (column === 'hours' ? pickHour(item) : pickMinute(item, true))}
              className={cn(
                'grid h-8 shrink-0 cursor-default snap-center place-items-center rounded-control-sm text-body-sm tabular-nums outline-none select-none focus-visible:outline-2 focus-visible:-outline-offset-2',
                selected ? 'bg-fill-2 font-semibold text-fg-1' : 'text-fg-2 hover:bg-fill-1',
                dim && 'pointer-events-none opacity-40',
              )}
            >
              {two(item)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          fieldShell,
          fieldSizes[size],
          'text-left data-popup-open:border-ring data-popup-open:shadow-[0_0_0_1px_var(--color-ring)] focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-[0_0_0_1px_var(--color-ring)] disabled:opacity-50 disabled:bg-surface-2',
          className,
        )}
      >
        <Clock aria-hidden />
        <span className={cn('min-w-0 flex-1 tabular-nums', !time && 'text-fg-3')}>{time ?? placeholder}</span>
        <ChevronDown aria-hidden className="transition-transform duration-(--duration-quick) ease-out group-data-popup-open/field:rotate-180" />
      </PopoverTrigger>
      <BasePopover.Portal>
        <BasePopover.Positioner side="bottom" align="start" sideOffset={4} className={positioner}>
          <BasePopover.Popup
            ref={attachPopup}
            data-slot="time-picker-popup"
            className="kv-popup flex w-(--anchor-width) min-w-40 flex-col rounded-lg bg-overlay p-1 text-fg-1 shadow-overlay outline-none"
          >
            <div aria-hidden className="flex gap-1 pt-1.5 pb-1 text-center text-caption font-medium text-fg-3">
              <span className="flex-1">Часы</span>
              <span className="w-px" />
              <span className="flex-1">Минуты</span>
            </div>
            <div className="flex gap-1">
              {columnView('hours')}
              <div aria-hidden className="w-px shrink-0 bg-separator" />
              {columnView('minutes')}
            </div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </Popover>
  );
}

export interface TimeSlotsProps {
  /** «HH:MM» chips in display order. */
  slots: readonly string[];
  /** Taken slots stay visible, dimmed and struck through. */
  unavailable?: readonly string[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (slot: string) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

/** Free slots as chips — a radio group: arrows move between free slots, taken ones are skipped. */
export function TimeSlots({ slots, unavailable = [], value, defaultValue, onValueChange, className, ...aria }: TimeSlotsProps) {
  return (
    <RadioGroup<string | null>
      data-slot="time-slots"
      {...aria}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(slot) => {
        if (slot) onValueChange?.(slot);
      }}
      className={cn('flex flex-wrap gap-2', className)}
    >
      {slots.map((slot) => (
        <Radio.Root
          key={slot}
          value={slot}
          disabled={unavailable.includes(slot)}
          className={cn(
            'kv-pressable inline-flex h-8 cursor-default items-center gap-1.5 rounded-control-sm bg-control px-3 text-label-sm font-medium text-fg-1 tabular-nums shadow-control select-none',
            'hover:not-data-checked:not-data-disabled:bg-control-hover data-checked:bg-accent-soft data-checked:pl-2.5 data-checked:text-accent-soft-fg data-checked:shadow-none',
            'data-disabled:line-through data-disabled:opacity-50',
          )}
        >
          <Radio.Indicator className="flex transition-[scale,opacity] duration-(--duration-quick) ease-out data-starting-style:scale-80 data-starting-style:opacity-0 [&_svg]:size-3.5 [&_svg]:stroke-2">
            <Check aria-hidden />
          </Radio.Indicator>
          {slot}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
