import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { Input, type InputProps } from './input';
import { Spinner } from './spinner';

/** Pause after the last key before the query goes out. */
const SEARCH_DELAY_MS = 200;

export interface SearchFieldProps
  extends Omit<InputProps, 'type' | 'prefix' | 'suffix' | 'kbd' | 'onClear' | 'value' | 'defaultValue' | 'onValueChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** The query 200 ms after typing stops; at once when the field is cleared. */
  onSearch?: (query: string) => void;
  /** Spinner in place of the clear button; it fades in after 150 ms so quick answers do not flash. */
  loading?: boolean;
  /** Hint at rest — «/» or «⌘K». Pressing it anywhere on the page focuses the field. */
  shortcut?: string;
}

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const withMod = shortcut.startsWith('⌘');
  const key = (withMod ? shortcut.slice(1) : shortcut).toLowerCase();
  if (event.key.toLowerCase() !== key) return false;
  return withMod ? event.metaKey || event.ctrlKey : !event.metaKey && !event.ctrlKey && !event.altKey;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** Query field for a filter or global search: Esc clears, a second Esc leaves the field. */
export function SearchField({
  value,
  defaultValue = '',
  onValueChange,
  onSearch,
  loading = false,
  shortcut,
  onKeyDown,
  onFocus,
  onBlur,
  className,
  ...props
}: SearchFieldProps) {
  const [own, setOwn] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const query = value ?? own;

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!shortcut) return;
    const focusOnShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !matchesShortcut(event, shortcut)) return;
      // A bare «/» typed into another field is just a slash.
      if (!shortcut.startsWith('⌘') && isTyping(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', focusOnShortcut);
    return () => document.removeEventListener('keydown', focusOnShortcut);
  }, [shortcut]);

  const change = (next: string, now: boolean) => {
    setOwn(next);
    onValueChange?.(next);
    clearTimeout(timer.current);
    if (!onSearch) return;
    if (now) onSearch(next);
    else timer.current = setTimeout(() => onSearch(next), SEARCH_DELAY_MS);
  };

  return (
    <Input
      ref={inputRef}
      type="search"
      value={query}
      onValueChange={(next) => change(next, false)}
      onClear={
        loading
          ? undefined
          : () => {
              change('', true);
              inputRef.current?.focus();
            }
      }
      prefix={<Search aria-hidden />}
      suffix={
        loading ? (
          <Spinner size={16} className="transition-opacity delay-150 duration-(--duration-fast) starting:opacity-0" />
        ) : undefined
      }
      kbd={shortcut && !focused && !query ? shortcut : undefined}
      aria-busy={loading || undefined}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        event.preventDefault();
        if (query) change('', true);
        else event.currentTarget.blur();
      }}
      className={cn('[&_input::-webkit-search-cancel-button]:appearance-none', className)}
      {...props}
    />
  );
}
