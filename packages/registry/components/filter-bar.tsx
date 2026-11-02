import { Plus, X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Menu, MenuCheckboxItem, MenuContent, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger } from './menu';

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
}

/** «Анна, Олег +2»: two labels, the rest as a number. */
function summary(field: FilterField, values: readonly string[]): string {
  const labels = values.map((value) => field.options.find((option) => option.value === value)?.label ?? value);
  return labels.length > 2 ? `${labels.slice(0, 2).join(', ')} +${labels.length - 2}` : labels.join(', ');
}

function withValue(value: FilterValue, fieldId: string, next: readonly string[]): FilterValue {
  const { [fieldId]: _removed, ...rest } = value;
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

/**
 * One row above a list: search, applied filters as «field: value» chips and «+ Фильтр».
 * Changes apply at once — there is no «Применить»; the result count updates with them.
 */
export function FilterBar({ fields, value, onValueChange, search, count, className, ...props }: FilterBarProps) {
  const applied = fields.filter((field) => (value[field.id]?.length ?? 0) > 0);
  const available = fields.filter((field) => !applied.includes(field));

  return (
    <div data-slot="filter-bar" className={cn('flex flex-wrap items-center gap-2', className)} {...props}>
      {search}
      {applied.map((field) => {
        const text = summary(field, value[field.id] ?? []);
        return (
          <div key={field.id} data-slot="filter-chip" className="flex h-8 items-center gap-0.5 rounded-full bg-accent-soft pr-1 has-[[data-popup-open]]:bg-accent-soft-hover">
            <Menu>
              <MenuTrigger
                aria-label={`Фильтр ${field.label}: ${text}, изменить`}
                className={cn(chipText, 'flex h-full items-center rounded-full pl-3 outline-offset-2 hover:text-accent-soft-fg')}
              >
                {field.label}:&nbsp;<span className="font-semibold">{text}</span>
              </MenuTrigger>
              <MenuContent className="min-w-56">
                <OptionItems field={field} value={value} onValueChange={onValueChange} />
              </MenuContent>
            </Menu>
            <button
              type="button"
              aria-label={`Снять фильтр ${field.label}`}
              onClick={() => onValueChange(withValue(value, field.id, []))}
              className="grid size-6 place-items-center rounded-full text-accent-soft-fg hover:bg-[color-mix(in_oklab,var(--color-accent-soft-fg)_14%,transparent)] active:bg-[color-mix(in_oklab,var(--color-accent-soft-fg)_22%,transparent)]"
            >
              <X aria-hidden className="size-3.5 stroke-2" />
            </button>
          </div>
        );
      })}
      {available.length > 0 ? (
        <Menu>
          <MenuTrigger className="flex h-8 items-center gap-1.5 rounded-full pr-3 pl-2.5 text-label-sm font-medium text-fg-2 hover:bg-fill-1 hover:text-fg-1 data-popup-open:bg-fill-2 data-popup-open:text-fg-1">
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
      <div className="flex-1" />
      {count !== undefined ? <span className="text-body-xs text-fg-3 tabular-nums">{count}</span> : null}
      {applied.length > 0 ? (
        <button
          type="button"
          onClick={() => onValueChange({})}
          className="h-8 rounded-full px-3 text-label-sm font-medium text-fg-1 hover:bg-fill-1 active:bg-fill-2"
        >
          Сбросить
        </button>
      ) : null}
    </div>
  );
}
