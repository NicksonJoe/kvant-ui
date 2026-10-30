import { Check } from 'lucide-react';
import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { listGroupLabel, listSeparator } from '../lib/recipes';

export interface ListboxOption<V extends string> {
  value: V;
  label: string;
  /** Second line, 12/16 fg-3. */
  description?: string;
  /** 16 px icon before the label. */
  icon?: ReactNode;
  disabled?: boolean;
  /** Consecutive options with the same group share a heading; groups are split by a line. */
  group?: string;
}

interface ListboxBase<V extends string> {
  options: readonly ListboxOption<V>[];
  disabled?: boolean;
  /** Shown when there are no options. */
  emptyText?: string;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

export type ListboxProps<V extends string> = ListboxBase<V> &
  (
    | { multiple?: false; value?: V | null; defaultValue?: V | null; onValueChange?: (value: V) => void }
    | { multiple: true; value?: readonly V[]; defaultValue?: readonly V[]; onValueChange?: (value: V[]) => void }
  );

const TYPEAHEAD_MS = 500;

/**
 * A list that lives in the form itself. Focus stays on the list (aria-activedescendant):
 * arrows, Home/End and typing move the highlight, Enter or Space picks. Multiple mode toggles.
 */
export function Listbox<V extends string>(props: ListboxProps<V>) {
  const { options, disabled = false, emptyText = 'Нет вариантов', id, className } = props;
  const baseId = useId();
  const listId = id ?? baseId;
  const toList = (value: V | null | readonly V[] | undefined): readonly V[] =>
    value === null || value === undefined ? [] : typeof value === 'string' ? [value] : value;
  const [own, setOwn] = useState(() => toList(props.defaultValue));
  const selected = props.value === undefined ? own : toList(props.value);
  const [active, setActive] = useState<V | null>(null);
  const typed = useRef({ text: '', at: 0 });
  const listRef = useRef<HTMLDivElement>(null);
  // Set by keyboard moves: a list with a max height keeps the highlight in view.
  const reveal = useRef(false);

  const enabled = disabled ? [] : options.filter((option) => !option.disabled);
  const activeValue = active ?? selected[0] ?? enabled[0]?.value;
  const optionId = (value: V) => `${listId}-${options.findIndex((option) => option.value === value)}`;

  useEffect(() => {
    if (!reveal.current) return;
    reveal.current = false;
    listRef.current?.querySelector('[data-highlighted]')?.scrollIntoView({ block: 'nearest' });
  });

  const choose = (option: ListboxOption<V>) => {
    if (option.disabled || disabled) return;
    setActive(option.value);
    if (props.multiple) {
      const next = selected.includes(option.value) ? selected.filter((value) => value !== option.value) : [...selected, option.value];
      setOwn(next);
      props.onValueChange?.(next);
    } else {
      setOwn([option.value]);
      props.onValueChange?.(option.value);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = enabled.findIndex((option) => option.value === activeValue);
    const target: Record<string, ListboxOption<V> | undefined> = {
      ArrowDown: enabled[Math.min(index + 1, enabled.length - 1)],
      ArrowUp: enabled[Math.max(index - 1, 0)],
      Home: enabled[0],
      End: enabled.at(-1),
    };
    if (event.key in target) {
      event.preventDefault();
      const next = target[event.key];
      reveal.current = true;
      if (next) setActive(next.value);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const current = enabled[index];
      if (current) choose(current);
      return;
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < TYPEAHEAD_MS ? typed.current.text : '') + event.key.toLocaleLowerCase('ru'), at: now };
      // Search from the option after the highlight, wrapping around.
      const order = [...enabled.slice(index + 1), ...enabled.slice(0, index + 1)];
      const match = order.find((option) => option.label.toLocaleLowerCase('ru').startsWith(typed.current.text));
      reveal.current = true;
      if (match) setActive(match.value);
    }
  };

  const sections: { group?: string; options: ListboxOption<V>[] }[] = [];
  for (const option of options) {
    const last = sections.at(-1);
    if (last && last.group === option.group) last.options.push(option);
    else sections.push({ group: option.group, options: [option] });
  }

  const renderOption = (option: ListboxOption<V>) => {
    const key = optionId(option.value);
    const isSelected = selected.includes(option.value);
    return (
      <div
        key={option.value}
        id={key}
        role="option"
        aria-selected={isSelected}
        aria-disabled={option.disabled || undefined}
        aria-labelledby={`${key}-label`}
        aria-describedby={option.description ? `${key}-description` : undefined}
        data-highlighted={option.value === activeValue || undefined}
        onClick={() => choose(option)}
        className={cn(
          'flex cursor-default items-start gap-2.5 rounded-md px-2.5 py-2 text-body-sm text-fg-1 select-none pointer-coarse:min-h-11 pointer-coarse:items-center',
          'hover:not-aria-disabled:bg-fill-1 group-focus-visible/listbox:data-highlighted:bg-fill-2 aria-disabled:opacity-50',
        )}
      >
        {option.icon ? (
          <span className="flex h-5 shrink-0 items-center text-fg-2 [&_svg]:size-4 [&_svg]:stroke-[1.75]">{option.icon}</span>
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span id={`${key}-label`} className={cn(option.description && 'font-medium')}>
            {option.label}
          </span>
          {option.description ? (
            <span id={`${key}-description`} className="text-caption text-fg-3">
              {option.description}
            </span>
          ) : null}
        </span>
        <span className="flex h-5 w-4 shrink-0 items-center text-accent [&_svg]:size-4 [&_svg]:stroke-[1.75]">
          {isSelected ? <Check aria-hidden /> : null}
        </span>
      </div>
    );
  };

  return (
    <div
      ref={listRef}
      id={listId}
      data-slot="listbox"
      role="listbox"
      tabIndex={disabled ? -1 : 0}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-multiselectable={props.multiple || undefined}
      aria-disabled={disabled || undefined}
      aria-activedescendant={activeValue === undefined ? undefined : optionId(activeValue)}
      onKeyDown={onKeyDown}
      className={cn('group/listbox flex flex-col rounded-lg bg-surface-1 p-1 shadow-raised', disabled && 'opacity-50', className)}
    >
      {options.length === 0 ? <div className="px-2.5 py-2 text-body-sm text-fg-3">{emptyText}</div> : null}
      {sections.map((section, index) =>
        section.group ? (
          <Fragment key={`${section.group}-${index}`}>
            {index > 0 ? <div role="none" className={listSeparator} /> : null}
            <div role="group" aria-labelledby={`${listId}-group-${index}`}>
              <div id={`${listId}-group-${index}`} role="presentation" className={listGroupLabel}>
                {section.group}
              </div>
              {section.options.map(renderOption)}
            </div>
          </Fragment>
        ) : (
          <Fragment key={`options-${index}`}>{section.options.map(renderOption)}</Fragment>
        ),
      )}
    </div>
  );
}
