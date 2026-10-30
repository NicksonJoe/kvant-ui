import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { listItem, listItemTone, popupSurface, positioner } from '../lib/recipes';
import { fieldShell, fieldSizes, type FieldSize } from './input';

const control = 'h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-3';
const emptyState = 'px-2.5 py-2 text-body-sm text-fg-3 empty:hidden';

/** Wraps the part of `text` that matches `query` (case-insensitive) in semibold. */
export function HighlightMatch({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLocaleLowerCase('ru').indexOf(query.toLocaleLowerCase('ru')) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="font-semibold">{text.slice(at, at + query.length)}</span>
      {text.slice(at + query.length)}
    </>
  );
}

export interface ComboboxOption<V extends string> {
  value: V;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

type ListEntry<V extends string> = ComboboxOption<V> | { create: string };

export interface ComboboxProps<V extends string> {
  options: readonly ComboboxOption<V>[];
  value?: V | null;
  defaultValue?: V | null;
  onValueChange?: (value: V | null) => void;
  /** Creatable: shows «Создать «…»» when nothing matches exactly. */
  onCreate?: (label: string) => void;
  placeholder?: string;
  emptyText?: string;
  size?: FieldSize;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

/** Text field that filters a listbox; the match is set in semibold. */
export function Combobox<V extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  onCreate,
  placeholder,
  emptyText = 'Ничего не найдено',
  size = 'md',
  disabled,
  className,
  'aria-label': ariaLabel,
}: ComboboxProps<V>) {
  const [query, setQuery] = useState('');
  const find = (v: V | null | undefined) => options.find((option) => option.value === v) ?? null;
  const needle = query.trim().toLocaleLowerCase('ru');
  const matches = options.filter((option) => option.label.toLocaleLowerCase('ru').includes(needle));
  const exact = matches.some((option) => option.label.toLocaleLowerCase('ru') === needle);
  const entries: ListEntry<V>[] = onCreate && needle && !exact ? [...matches, { create: query.trim() }] : matches;

  return (
    <BaseCombobox.Root<ListEntry<V>>
      items={entries}
      filter={null}
      value={value === undefined ? undefined : find(value)}
      defaultValue={find(defaultValue)}
      onValueChange={(next) => {
        if (next && 'create' in next) {
          onCreate?.(next.create);
          return;
        }
        onValueChange?.(next?.value ?? null);
      }}
      onInputValueChange={setQuery}
      itemToStringLabel={(entry) => ('create' in entry ? entry.create : entry.label)}
      isItemEqualToValue={(a, b) => ('value' in a && 'value' in b ? a.value === b.value : a === b)}
      disabled={disabled}
    >
      <BaseCombobox.InputGroup data-slot="combobox" className={cn(fieldShell, fieldSizes[size], 'pr-2', className)}>
        <BaseCombobox.Input aria-label={ariaLabel} placeholder={placeholder} className={control} />
        <BaseCombobox.Trigger
          aria-label="Показать варианты"
          className="grid size-6 shrink-0 place-items-center rounded-full text-fg-3 hover:bg-fill-1 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
        >
          <ChevronDown aria-hidden />
        </BaseCombobox.Trigger>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner sideOffset={4} className={positioner}>
          <BaseCombobox.Popup data-slot="combobox-popup" className={cn(popupSurface, 'min-w-(--anchor-width)')}>
            <BaseCombobox.Empty className={emptyState}>{emptyText}</BaseCombobox.Empty>
            <BaseCombobox.List className="max-h-[min(320px,var(--available-height))] overflow-y-auto empty:hidden">
              {(entry: ListEntry<V>) =>
                'create' in entry ? (
                  <BaseCombobox.Item key="__create" value={entry} className={cn(listItem, 'text-accent-soft-fg [&>svg]:text-accent-soft-fg')}>
                    <Plus aria-hidden />
                    <span className="truncate">Создать «{entry.create}»</span>
                  </BaseCombobox.Item>
                ) : (
                  <BaseCombobox.Item key={entry.value} value={entry} disabled={entry.disabled} className={cn(listItem, listItemTone)}>
                    {entry.icon}
                    <span className="min-w-0 flex-1 truncate">
                      <HighlightMatch text={entry.label} query={query.trim()} />
                    </span>
                    <BaseCombobox.ItemIndicator className="ml-auto flex [&_svg]:text-accent">
                      <Check aria-hidden />
                    </BaseCombobox.ItemIndicator>
                  </BaseCombobox.Item>
                )
              }
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

export interface AutocompleteProps {
  /** Suggestions filtered by the typed text. */
  suggestions: readonly string[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  prefix?: ReactNode;
  size?: FieldSize;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

/** Free text with suggestions: the value is whatever is typed; picking a suggestion fills it in. */
export function Autocomplete({
  suggestions,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  emptyText = 'Ничего не найдено',
  prefix,
  size = 'md',
  disabled,
  className,
  'aria-label': ariaLabel,
}: AutocompleteProps) {
  const [query, setQuery] = useState(value ?? defaultValue ?? '');
  return (
    <BaseAutocomplete.Root
      items={suggestions}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => {
        setQuery(next);
        onValueChange?.(next);
      }}
      disabled={disabled}
    >
      <BaseAutocomplete.InputGroup data-slot="autocomplete" className={cn(fieldShell, fieldSizes[size], className)}>
        {prefix}
        <BaseAutocomplete.Input aria-label={ariaLabel} placeholder={placeholder} className={control} />
      </BaseAutocomplete.InputGroup>
      <BaseAutocomplete.Portal>
        <BaseAutocomplete.Positioner sideOffset={4} className={positioner}>
          <BaseAutocomplete.Popup data-slot="autocomplete-popup" className={cn(popupSurface, 'min-w-(--anchor-width)')}>
            <BaseAutocomplete.Empty className={emptyState}>{emptyText}</BaseAutocomplete.Empty>
            <BaseAutocomplete.List className="max-h-[min(320px,var(--available-height))] overflow-y-auto empty:hidden">
              {(item: string) => (
                <BaseAutocomplete.Item key={item} value={item} className={cn(listItem, listItemTone)}>
                  <span className="min-w-0 flex-1 truncate">
                    <HighlightMatch text={item} query={query.trim()} />
                  </span>
                </BaseAutocomplete.Item>
              )}
            </BaseAutocomplete.List>
          </BaseAutocomplete.Popup>
        </BaseAutocomplete.Positioner>
      </BaseAutocomplete.Portal>
    </BaseAutocomplete.Root>
  );
}
