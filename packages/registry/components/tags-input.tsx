import { Input as BaseInput } from '@base-ui/react/input';
import { Plus, X } from 'lucide-react';
import { Fragment, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '../lib/cn';
import { listItem, listItemTone, listSeparator, popupSurface } from '../lib/recipes';
import { Kbd } from './badge';
import { HighlightMatch } from './combobox';
import { fieldShell } from './input';

const MAX_SUGGESTIONS = 6;
const same = (a: string, b: string) => a.toLocaleLowerCase('ru') === b.toLocaleLowerCase('ru');
const contains = (text: string, part: string) => text.toLocaleLowerCase('ru').includes(part.toLocaleLowerCase('ru'));

export interface TagsInputProps {
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  /** Offered while typing (up to six); the typed text can always become a new tag. */
  suggestions?: readonly string[];
  /** Outside focus only this many tags stay, the rest fold into «+N». */
  visibleTags?: number;
  /** No more tags than this. */
  max?: number;
  placeholder?: string;
  /** Each tag is submitted as its own hidden input with this name. */
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
}

/**
 * Several free values as tags in one capsule. Enter or a comma adds, a pasted list is split;
 * Backspace first selects the last tag and only the second press removes it; ← → walk the tags.
 */
export function TagsInput({
  value,
  defaultValue = [],
  onValueChange,
  suggestions,
  visibleTags,
  max = Number.POSITIVE_INFINITY,
  placeholder = 'Добавить тег',
  name,
  disabled,
  invalid,
  id,
  'aria-label': ariaLabel,
  className,
}: TagsInputProps) {
  const [own, setOwn] = useState<readonly string[]>(defaultValue);
  const tags = value ?? own;
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const [active, setActive] = useState(-1);
  const [listOpen, setListOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const needle = query.trim();
  const matches =
    suggestions && needle
      ? suggestions.filter((item) => contains(item, needle) && !tags.some((tag) => same(tag, item))).slice(0, MAX_SUGGESTIONS)
      : [];
  const creatable = suggestions !== undefined && needle !== '' && ![...tags, ...matches].some((item) => same(item, needle));
  const options = creatable ? [...matches, needle] : matches;
  const open = focused && listOpen && options.length > 0;
  const optionId = (index: number) => `${listId}-${index}`;
  const pickedTag = picked === null ? undefined : tags[picked];

  const commit = (next: readonly string[]) => {
    setOwn(next);
    onValueChange?.([...next]);
  };

  const add = (parts: readonly string[]) => {
    setQuery('');
    setActive(-1);
    setListOpen(false);
    const next = [...tags];
    for (const part of parts) {
      const tag = part.trim();
      if (tag && next.length < max && !next.some((item) => same(item, tag))) next.push(tag);
    }
    if (next.length === tags.length) return;
    commit(next);
    setAnnouncement(`Добавлено: ${next.slice(tags.length).join(', ')}`);
  };

  const remove = (index: number) => {
    const tag = tags[index];
    if (tag === undefined) return;
    commit(tags.filter((_, i) => i !== index));
    setPicked(null);
    setAnnouncement(`Тег «${tag}» удалён`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    switch (event.key) {
      case 'Enter': {
        const option = open && active >= 0 ? options[active] : undefined;
        if (option === undefined && !needle) return;
        event.preventDefault();
        add([option ?? query]);
        return;
      }
      case ',':
        event.preventDefault();
        add([query]);
        return;
      case 'ArrowDown':
      case 'ArrowUp':
        if (!open) return;
        event.preventDefault();
        setActive((current) =>
          event.key === 'ArrowDown' ? (current + 1) % options.length : current <= 0 ? options.length - 1 : current - 1,
        );
        return;
      case 'Escape':
        if (open) setListOpen(false);
        else setPicked(null);
        return;
      case 'Backspace':
      case 'Delete':
        if (picked !== null) {
          event.preventDefault();
          remove(picked);
        } else if (event.key === 'Backspace' && atStart && tags.length > 0) {
          event.preventDefault();
          setPicked(tags.length - 1);
        }
        return;
      case 'ArrowLeft':
        if (picked !== null || (atStart && tags.length > 0)) {
          event.preventDefault();
          setPicked(picked === null ? tags.length - 1 : Math.max(0, picked - 1));
        }
        return;
      case 'ArrowRight':
        if (picked !== null) {
          event.preventDefault();
          setPicked(picked + 1 < tags.length ? picked + 1 : null);
        }
        return;
      default:
        if (picked !== null && event.key.length === 1) setPicked(null);
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    if (!/[,\n]/.test(text)) return;
    event.preventDefault();
    add(text.split(/[,\n]/));
  };

  const folded = !focused && visibleTags !== undefined && tags.length > visibleTags;
  const shown = folded ? tags.slice(0, visibleTags) : tags;

  return (
    <div data-slot="tags-input" className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className="relative">
        <div
          // A press on the empty part of the capsule puts the caret in.
          onMouseDown={(event) => {
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            inputRef.current?.focus();
          }}
          className={cn(
            fieldShell,
            'min-h-control-md cursor-text flex-wrap gap-1.5 rounded-[min(var(--radius-control-md),var(--radius-xl))] py-[calc(var(--spacing-control-md)/2_-_13px)] pr-3.5 pl-1.5 text-body-sm',
            folded && 'h-control-md flex-nowrap overflow-hidden',
          )}
        >
          {shown.map((tag, index) => (
            <span
              key={tag}
              data-slot="tags-input-tag"
              data-selected={picked === index || undefined}
              className="inline-flex h-6 min-w-0 shrink-0 items-center gap-0.5 rounded-full bg-fill-2 pr-1 pl-2.5 text-label-sm font-medium text-fg-1 transition-[opacity,scale] duration-(--duration-quick) ease-out starting:opacity-0 starting:scale-[calc(1_-_(1_-_var(--scale-enter))_*_5)] data-selected:bg-accent-soft data-selected:text-accent-soft-fg data-selected:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-accent)_35%,transparent)]"
            >
              <span className="truncate">{tag}</span>
              <button
                type="button"
                // Keyboard users remove with Backspace; the cross is for pointers and touch.
                tabIndex={-1}
                aria-label={`Удалить «${tag}»`}
                disabled={disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => remove(index)}
                className="relative grid size-4 shrink-0 place-items-center rounded-full text-fg-3 after:absolute after:-inset-1 hover:bg-fill-3 hover:text-fg-1 pointer-coarse:after:-inset-3.5 in-data-selected:text-accent-soft-fg [&_svg]:size-3 [&_svg]:stroke-[2.25]"
              >
                <X aria-hidden />
              </button>
            </span>
          ))}
          {folded ? (
            <span className="inline-flex h-6 shrink-0 items-center rounded-full px-2 text-label-sm font-semibold text-fg-2 tabular-nums shadow-[inset_0_0_0_1px_var(--color-border)]">
              +{tags.length - shown.length}
            </span>
          ) : null}
          <BaseInput
            ref={inputRef}
            id={id}
            aria-label={ariaLabel}
            value={query}
            placeholder={placeholder}
            disabled={disabled}
            {...(invalid ? { 'aria-invalid': true } : {})}
            {...(suggestions
              ? {
                  role: 'combobox',
                  'aria-autocomplete': 'list' as const,
                  'aria-expanded': open,
                  'aria-controls': open ? listId : undefined,
                  'aria-activedescendant': open && active >= 0 ? optionId(active) : undefined,
                }
              : {})}
            onValueChange={(next) => {
              setQuery(next);
              setActive(-1);
              setListOpen(true);
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              setPicked(null);
              setListOpen(false);
            }}
            className="h-6 min-w-16 flex-1 bg-transparent pl-0.5 outline-none placeholder:text-fg-3 disabled:cursor-not-allowed"
          />
        </div>
        {open ? (
          <div
            id={listId}
            role="listbox"
            aria-label="Подсказки"
            className={cn(
              popupSurface,
              'absolute top-full left-0 z-50 mt-1 w-62 max-w-full transition-[opacity,translate] duration-(--duration-quick) ease-out starting:translate-y-[calc(var(--shift-sm)*-1)] starting:opacity-0',
            )}
          >
            {options.map((option, index) => {
              const isNew = creatable && index === options.length - 1;
              return (
                <Fragment key={isNew ? '__new' : option}>
                  {isNew && matches.length > 0 ? <div role="presentation" className={listSeparator} /> : null}
                  <div
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === active}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => add([option])}
                    className={cn(listItem, listItemTone, index === active && 'bg-fill-2')}
                  >
                    {isNew ? (
                      <>
                        <Plus aria-hidden />
                        <span className="truncate">Создать тег «{option}»</span>
                      </>
                    ) : (
                      <span className="truncate">
                        <HighlightMatch text={option} query={needle} />
                      </span>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>
        ) : null}
      </div>
      <p aria-live="polite" className="flex items-center gap-1.5 text-caption text-fg-3 empty:hidden">
        {pickedTag !== undefined ? (
          <>
            Ещё раз <Kbd>⌫</Kbd> — и «{pickedTag}» удалится
          </>
        ) : null}
      </p>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      {name ? tags.map((tag) => <input key={tag} type="hidden" name={name} value={tag} />) : null}
    </div>
  );
}
