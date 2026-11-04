import { ListFilter, Plus, X } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { cn } from '../lib/cn';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Menu, MenuCheckboxItem, MenuContent, MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger } from './menu';
import { Sheet, SheetBody, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTrigger } from './sheet';

export interface FilterOption {
  value: string;
  label: string;
  /** Records with this value, shown on the right in the list. */
  count?: number;
}

export interface FilterField {
  id: string;
  label: string;
  icon?: ReactNode;
  options: readonly FilterOption[];
}

/** Selected option values by field id; a field without values is not in the object. */
export type FilterValue = Readonly<Record<string, readonly string[]>>;

export interface FilterBarProps extends Omit<ComponentProps<'div'>, 'children'> {
  fields: readonly FilterField[];
  value: FilterValue;
  onValueChange: (value: FilterValue) => void;
  /** Leading slot, usually a SearchField 240 wide. */
  search?: ReactNode;
  /** Result count on the right: «48 из 312». */
  count?: ReactNode;
  /** Primary button of the narrow-screen sheet: «Показать 48 сделок». */
  showLabel?: string;
}

/** «Анна, Олег +2»: two labels, the rest as a number. */
function summary(field: FilterField, values: readonly string[]): string {
  const labels = values.map((value) => field.options.find((option) => option.value === value)?.label ?? value);
  return labels.length > 2 ? `${labels.slice(0, 2).join(', ')} +${labels.length - 2}` : labels.join(', ');
}

function withValue(value: FilterValue, fieldId: string, next: readonly string[]): FilterValue {
  const rest = Object.fromEntries(Object.entries(value).filter(([id]) => id !== fieldId));
  return next.length > 0 ? { ...rest, [fieldId]: next } : rest;
}

function OptionItems({ field, value, onValueChange }: { field: FilterField; value: FilterValue; onValueChange: (value: FilterValue) => void }) {
  const selected = value[field.id] ?? [];
  return field.options.map((option) => (
    <MenuCheckboxItem
      key={option.value}
      checked={selected.includes(option.value)}
      onCheckedChange={(checked) =>
        onValueChange(withValue(value, field.id, checked ? [...selected, option.value] : selected.filter((item) => item !== option.value)))
      }
    >
      <span className="flex items-center justify-between gap-4">
        <span className="truncate">{option.label}</span>
        {option.count !== undefined ? <span className="text-fg-3 tabular-nums">{option.count}</span> : null}
      </span>
    </MenuCheckboxItem>
  ));
}

const chipText = 'text-label-sm text-accent-soft-fg';
// the real controls and their measuring copies share these, so the copy is exactly as wide
const chip = 'h-8 shrink-0 items-center gap-0.5 rounded-full bg-accent-soft pr-1';
const chipLabel = cn(chipText, 'flex h-full items-center rounded-full pl-3 whitespace-nowrap');
const chipRemove = 'grid size-6 place-items-center rounded-full';
const more = 'h-8 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft pr-1 pl-3 text-label-sm font-medium whitespace-nowrap text-accent-soft-fg';
const moreCount = 'grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-caption font-semibold text-accent-fg tabular-nums';
const add = 'h-8 shrink-0 items-center gap-1.5 rounded-full pr-3 pl-2.5 text-label-sm font-medium whitespace-nowrap';

/** How many leading chips fit: all of them alone, or as many as leave room for «Ещё». */
function fitCount(width: number, fixed: readonly number[], chips: readonly number[], moreWidth: number, gap: number): number {
  const total = (items: readonly number[]) => items.reduce((sum, item) => sum + item, 0) + gap * Math.max(0, items.length - 1);
  // half a pixel of slack for subpixel widths
  if (total([...fixed, ...chips]) <= width + 0.5) return chips.length;
  for (let count = chips.length - 1; count > 0; count--) {
    if (total([...fixed, ...chips.slice(0, count), moreWidth]) <= width + 0.5) return count;
  }
  return 0;
}

/**
 * One row above a list: search, applied filters as «field: value» chips and «+ Фильтр».
 * Changes apply at once — there is no «Применить»; the result count updates with them.
 * The row never wraps: chips that do not fit fold into «Ещё N», whose menu edits and removes them.
 */
export function FilterBar({ fields, value, onValueChange, search, count, showLabel = 'Показать', className, ...props }: FilterBarProps) {
  const applied = fields.filter((field) => (value[field.id]?.length ?? 0) > 0);
  const available = fields.filter((field) => !applied.includes(field));
  // null until measured (and in jsdom): every chip is shown
  const [limit, setLimit] = useState<number | null>(null);
  const shown = limit === null ? applied : applied.slice(0, limit);
  const folded = limit === null ? [] : applied.slice(limit);
  const row = useRef<HTMLDivElement>(null);
  const searchSlot = useRef<HTMLDivElement>(null);
  const tail = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const rowElement = row.current;
    const copyElement = copy.current;
    if (!rowElement || !copyElement) return;
    // Widths come from the row's own box and from a hidden copy of every chip, never from the visible chips:
    // what is shown cannot feed back into what fits, so a row that hugs its content does not grow itself.
    const measure = () => {
      const width = rowElement.getBoundingClientRect().width;
      if (width === 0) return;
      const size = (element: Element | null) => (element ? element.getBoundingClientRect().width : 0);
      const gap = Number.parseFloat(getComputedStyle(rowElement).columnGap) || 0;
      const fixed = [size(searchSlot.current), size(copyElement.querySelector('[data-measure="add"]')), size(tail.current)].filter((item) => item > 0);
      const chips = Array.from(copyElement.querySelectorAll('[data-measure="chip"]'), size);
      const next = fitCount(width, fixed, chips, size(copyElement.querySelector('[data-measure="more"]')), gap);
      // before paint, so the row never shows a frame of overflowing chips
      flushSync(() => setLimit(next));
    };
    const observer = new ResizeObserver(measure);
    for (const element of [rowElement, searchSlot.current, tail.current, copyElement]) if (element) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    // under 720px of its own width the chips give way to «Фильтры · N» and a bottom sheet
    <div data-slot="filter-bar" className={cn('@container relative min-w-0', className)} {...props}>
      <div ref={row} data-slot="filter-bar-row" className="flex flex-wrap items-center gap-2 @min-[720px]:flex-nowrap">
        <div ref={searchSlot} data-slot="filter-bar-search" className="flex shrink-0 empty:hidden">
          {search}
        </div>
        <Sheet>
          <SheetTrigger
            aria-label={`Фильтры, применено: ${applied.length}`}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-full pr-1.5 pl-3 text-label-md font-medium @min-[720px]:hidden',
              applied.length > 0 ? 'bg-accent-soft pr-1.5 text-accent-soft-fg' : 'pr-3 text-fg-2 hover:bg-fill-1',
            )}
          >
            <ListFilter aria-hidden className="size-4 stroke-[1.75]" />
            Фильтры
            {applied.length > 0 ? (
              <span className="grid h-5.5 min-w-5.5 place-items-center rounded-full bg-accent px-1.5 text-caption font-semibold text-accent-fg tabular-nums">
                {applied.length}
              </span>
            ) : null}
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader title="Фильтры" />
            <SheetBody>
              {fields.map((field) => {
                const selected = value[field.id] ?? [];
                return (
                  <fieldset key={field.id} className="flex flex-col gap-1">
                    <legend className="pb-1 text-label-sm font-semibold text-fg-1">{field.label}</legend>
                    {field.options.map((option) => (
                      <Checkbox
                        key={option.value}
                        size="lg"
                        checked={selected.includes(option.value)}
                        onCheckedChange={(checked) =>
                          onValueChange(
                            withValue(value, field.id, checked ? [...selected, option.value] : selected.filter((item) => item !== option.value)),
                          )
                        }
                        className="min-h-11"
                      >
                        <span className="flex flex-1 justify-between gap-4">
                          {option.label}
                          {option.count !== undefined ? <span className="text-fg-3 tabular-nums">{option.count}</span> : null}
                        </span>
                      </Checkbox>
                    ))}
                  </fieldset>
                );
              })}
            </SheetBody>
            <SheetFooter>
              <Button variant="secondary" size="lg" disabled={applied.length === 0} onClick={() => onValueChange({})}>
                Сбросить
              </Button>
              <SheetClose render={<Button size="lg" />}>{showLabel}</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        {shown.map((field) => {
          const text = summary(field, value[field.id] ?? []);
          return (
            <div key={field.id} data-slot="filter-chip" className={cn(chip, 'hidden @min-[720px]:flex has-[[data-popup-open]]:bg-accent-soft-hover')}>
              <Menu>
                <MenuTrigger aria-label={`Фильтр ${field.label}: ${text}, изменить`} className={cn(chipLabel, 'outline-offset-2 hover:text-accent-soft-fg')}>
                  {field.label}:&nbsp;
                  <span className="font-semibold">{text}</span>
                </MenuTrigger>
                <MenuContent className="min-w-56">
                  <OptionItems field={field} value={value} onValueChange={onValueChange} />
                </MenuContent>
              </Menu>
              <button
                type="button"
                aria-label={`Снять фильтр ${field.label}`}
                onClick={() => onValueChange(withValue(value, field.id, []))}
                className={cn(chipRemove, 'text-accent-soft-fg hover:bg-[color-mix(in_oklab,var(--color-accent-soft-fg)_14%,transparent)] active:bg-[color-mix(in_oklab,var(--color-accent-soft-fg)_22%,transparent)]')}
              >
                <X aria-hidden className="size-3.5 stroke-2" />
              </button>
            </div>
          );
        })}
        {folded.length > 0 ? (
          <Menu>
            <MenuTrigger
              data-slot="filter-bar-more"
              aria-label={`Ещё фильтры, применено: ${folded.length}`}
              className={cn(more, 'hidden outline-offset-2 hover:bg-accent-soft-hover data-popup-open:bg-accent-soft-hover @min-[720px]:flex')}
            >
              Ещё
              <span className={moreCount}>{folded.length}</span>
            </MenuTrigger>
            <MenuContent className="min-w-56">
              {folded.map((field) => (
                <MenuSub key={field.id}>
                  <MenuSubTrigger icon={field.icon}>
                    {field.label}: <span className="font-semibold">{summary(field, value[field.id] ?? [])}</span>
                  </MenuSubTrigger>
                  <MenuSubContent className="min-w-56">
                    <OptionItems field={field} value={value} onValueChange={onValueChange} />
                    <MenuSeparator />
                    <MenuItem
                      icon={<X aria-hidden />}
                      aria-label={`Снять фильтр ${field.label}`}
                      onClick={() => onValueChange(withValue(value, field.id, []))}
                    >
                      Снять фильтр
                    </MenuItem>
                  </MenuSubContent>
                </MenuSub>
              ))}
            </MenuContent>
          </Menu>
        ) : null}
        {available.length > 0 ? (
          <Menu>
            <MenuTrigger className={cn(add, 'hidden text-fg-2 hover:bg-fill-1 hover:text-fg-1 data-popup-open:bg-fill-2 data-popup-open:text-fg-1 @min-[720px]:flex')}>
              <Plus aria-hidden className="size-3.5 stroke-2" />
              Фильтр
            </MenuTrigger>
            <MenuContent className="min-w-56">
              {available.map((field) => (
                <MenuSub key={field.id}>
                  <MenuSubTrigger icon={field.icon}>{field.label}</MenuSubTrigger>
                  <MenuSubContent className="min-w-56">
                    <OptionItems field={field} value={value} onValueChange={onValueChange} />
                  </MenuSubContent>
                </MenuSub>
              ))}
            </MenuContent>
          </Menu>
        ) : null}
        <div ref={tail} data-slot="filter-bar-tail" className="ml-auto flex shrink-0 items-center gap-2 empty:hidden">
          {count !== undefined ? <span className="text-body-xs whitespace-nowrap text-fg-3 tabular-nums">{count}</span> : null}
          {applied.length > 0 ? (
            <button
              type="button"
              onClick={() => onValueChange({})}
              className="hidden h-8 rounded-full px-3 text-label-sm font-medium text-fg-1 hover:bg-fill-1 active:bg-fill-2 @min-[720px]:block"
            >
              Сбросить
            </button>
          ) : null}
        </div>
      </div>
      <div aria-hidden inert data-slot="filter-bar-measure" className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden">
        <div ref={copy} className="flex w-max items-center gap-2">
          {applied.map((field) => (
            <span key={field.id} data-measure="chip" className={cn(chip, 'flex')}>
              <span className={chipLabel}>
                {field.label}:&nbsp;
                <span className="font-semibold">{summary(field, value[field.id] ?? [])}</span>
              </span>
              <span className={chipRemove} />
            </span>
          ))}
          {/* the widest «Ещё N»: with every chip folded */}
          <span data-measure="more" className={cn(more, 'flex')}>
            Ещё
            <span className={moreCount}>{applied.length}</span>
          </span>
          {available.length > 0 ? (
            <span data-measure="add" className={cn(add, 'flex')}>
              <Plus aria-hidden className="size-3.5 stroke-2" />
              Фильтр
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
