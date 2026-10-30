import { Popover as BasePopover } from '@base-ui/react/popover';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Fragment, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '../lib/cn';
import { positioner } from '../lib/recipes';
import { fieldShell, fieldSizes, type FieldSize } from './input';
import { Popover, PopoverTrigger } from './popover';

export interface CascaderOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Options of the next level; without them the option is a leaf that can be picked. */
  children?: readonly CascaderOption[];
}

export interface CascaderProps {
  options: readonly CascaderOption[];
  /** Path of values from the top level to the picked leaf. */
  value?: readonly string[] | null;
  defaultValue?: readonly string[] | null;
  onValueChange?: (path: string[]) => void;
  placeholder?: string;
  size?: FieldSize;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

/** The options along a path of values, level by level. */
function walk(options: readonly CascaderOption[], path: readonly string[]): CascaderOption[] {
  const found: CascaderOption[] = [];
  let level = options;
  for (const value of path) {
    const option = level.find((item) => item.value === value);
    if (!option) break;
    found.push(option);
    level = option.children ?? [];
  }
  return found;
}

const HOVER_INTENT_MS = 100;

interface Cursor {
  level: number;
  index: number;
}

/**
 * Pick from a hierarchy up to three levels deep: every column opens the next one.
 * ↑↓ move inside a column, → or Enter open a branch, ← goes back, Enter on a leaf picks it.
 */
export function Cascader({
  options,
  value,
  defaultValue = null,
  onValueChange,
  placeholder = 'Выберите',
  size = 'md',
  disabled,
  className,
  'aria-label': ariaLabel,
}: CascaderProps) {
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState(defaultValue);
  const selected = walk(options, (value === undefined ? own : value) ?? []);
  // Branches opened while the popup is up; reset to the selection on every open.
  const [trail, setTrail] = useState<string[]>([]);
  const [cursor, setCursor] = useState<Cursor>({ level: 0, index: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  const intent = useRef<number | undefined>(undefined);
  const moveFocus = useRef(false);

  const branches = walk(options, trail);
  const columns = [options, ...branches.flatMap((option) => (option.children ? [option.children] : []))];
  const firstEnabled = (column: readonly CascaderOption[]) => Math.max(column.findIndex((option) => !option.disabled), 0);

  useEffect(() => () => window.clearTimeout(intent.current), []);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    popupRef.current?.querySelector<HTMLElement>('[role="option"][tabindex="0"]')?.focus();
  });

  const onOpenChange = (next: boolean) => {
    if (next) {
      const path = selected.map((option) => option.value);
      const level = Math.max(path.length - 1, 0);
      const column = walk(options, path.slice(0, level)).at(-1)?.children ?? options;
      const index = column.findIndex((option) => option.value === path[level]);
      setTrail(path.slice(0, level));
      setCursor({ level, index: index === -1 ? firstEnabled(column) : index });
    }
    setOpen(next);
  };

  const expand = (option: CascaderOption, level: number, focusChild: boolean) => {
    window.clearTimeout(intent.current);
    if (!option.children || option.disabled) return;
    setTrail([...trail.slice(0, level), option.value]);
    if (focusChild) {
      moveFocus.current = true;
      setCursor({ level: level + 1, index: firstEnabled(option.children) });
    }
  };

  const pick = (option: CascaderOption, level: number) => {
    if (option.disabled) return;
    if (option.children) return expand(option, level, true);
    const path = [...trail.slice(0, level), option.value];
    setOwn(path);
    onValueChange?.(path);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const column = columns[cursor.level] ?? [];
    const option = column[cursor.index];
    const step = (from: number, delta: number) => {
      for (let i = from + delta; i >= 0 && i < column.length; i += delta) if (!column[i]?.disabled) return i;
      return from;
    };
    const go = (next: Cursor) => {
      event.preventDefault();
      moveFocus.current = true;
      setCursor(next);
    };
    if (event.key === 'ArrowDown') go({ ...cursor, index: step(cursor.index, 1) });
    else if (event.key === 'ArrowUp') go({ ...cursor, index: step(cursor.index, -1) });
    else if (event.key === 'Home') go({ ...cursor, index: step(-1, 1) });
    else if (event.key === 'End') go({ ...cursor, index: step(column.length, -1) });
    else if (event.key === 'ArrowLeft' && cursor.level > 0) {
      const parent = columns[cursor.level - 1] ?? [];
      setTrail(trail.slice(0, cursor.level - 1));
      go({ level: cursor.level - 1, index: parent.findIndex((item) => item.value === trail[cursor.level - 1]) });
    } else if (event.key === 'ArrowRight' && option?.children) {
      event.preventDefault();
      expand(option, cursor.level, true);
    } else if ((event.key === 'Enter' || event.key === ' ') && option) {
      event.preventDefault();
      pick(option, cursor.level);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          fieldShell,
          fieldSizes[size],
          'justify-between text-left data-popup-open:border-ring data-popup-open:shadow-[0_0_0_1px_var(--color-ring)] focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-[0_0_0_1px_var(--color-ring)] disabled:opacity-50 disabled:bg-surface-2',
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          {selected.length === 0 ? <span className="truncate text-fg-3">{placeholder}</span> : null}
          {selected.map((option, index) => (
            <Fragment key={option.value}>
              {index > 0 ? <ChevronRight aria-hidden className="size-3 shrink-0 stroke-2 text-fg-4" /> : null}
              <span className={cn('truncate', index < selected.length - 1 ? 'min-w-0 text-fg-3' : 'shrink-0 text-fg-1')}>{option.label}</span>
            </Fragment>
          ))}
        </span>
        <ChevronDown aria-hidden className="transition-transform duration-(--duration-quick) ease-out group-data-popup-open/field:rotate-180" />
      </PopoverTrigger>
      <BasePopover.Portal>
        <BasePopover.Positioner side="bottom" align="start" sideOffset={4} className={positioner}>
          <BasePopover.Popup
            ref={popupRef}
            data-slot="cascader-popup"
            onKeyDown={onKeyDown}
            className="kv-popup flex max-w-(--available-width) gap-1 overflow-x-auto rounded-lg bg-overlay p-1 text-fg-1 shadow-overlay outline-none"
          >
            {columns.map((column, level) => (
              <Fragment key={level}>
                {level > 0 ? <div aria-hidden className="w-px shrink-0 bg-separator" /> : null}
                <div
                  role="listbox"
                  aria-label={level === 0 ? (ariaLabel ?? 'Уровень 1') : branches[level - 1]?.label}
                  className="flex w-50 shrink-0 flex-col transition-[opacity,translate] duration-(--duration-quick) ease-out starting:-translate-x-1 starting:opacity-0"
                >
                  {column.map((option, index) => {
                    const onTrail = trail[level] === option.value;
                    const picked = !option.children && selected[level]?.value === option.value && selected.length === level + 1;
                    return (
                      <div
                        key={option.value}
                        role="option"
                        aria-selected={onTrail || picked}
                        aria-disabled={option.disabled || undefined}
                        tabIndex={cursor.level === level && cursor.index === index ? 0 : -1}
                        onClick={() => {
                          setCursor({ level, index });
                          pick(option, level);
                        }}
                        onFocus={() => setCursor({ level, index })}
                        onPointerEnter={() => {
                          window.clearTimeout(intent.current);
                          if (option.children) intent.current = window.setTimeout(() => expand(option, level, false), HOVER_INTENT_MS);
                        }}
                        className={cn(
                          'flex h-8 shrink-0 cursor-default items-center gap-2.5 rounded-md px-2.5 text-body-sm outline-none select-none pointer-coarse:h-11',
                          'hover:bg-fill-1 focus-visible:bg-fill-2 aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]',
                          onTrail && 'bg-fill-2 font-medium hover:bg-fill-2',
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{option.label}</span>
                        {option.children ? (
                          <ChevronRight aria-hidden className={onTrail ? 'text-fg-2' : 'text-fg-4'} />
                        ) : picked ? (
                          <Check aria-hidden className="text-accent" />
                        ) : (
                          <span className="size-4 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Fragment>
            ))}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </Popover>
  );
}
