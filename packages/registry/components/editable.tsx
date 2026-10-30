import { Input as BaseInput } from '@base-ui/react/input';
import { CircleCheck, Pencil } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Kbd } from './badge';

/** How long the «saved» line stays. */
const SAVED_MS = 2000;

export interface EditableProps {
  value?: string;
  defaultValue?: string;
  /** Enter or leaving the field saves the trimmed text. Esc, an empty or an unchanged value do not. */
  onValueCommit?: (value: string) => void;
  /** Shown in fg-3 while the value is empty. */
  placeholder?: string;
  /** What is edited, e.g. «Название проекта»: names the field and the text button. */
  'aria-label': string;
  disabled?: boolean;
  /** Line under the text for two seconds after a save, e.g. «Сохранено · видно всей команде». */
  savedMessage?: ReactNode;
  className?: string;
}

/**
 * Text that turns into a field in place. Preview and field share the capsule, padding and font,
 * so nothing shifts; the font comes from the text around it.
 */
export function Editable({
  value,
  defaultValue = '',
  onValueCommit,
  placeholder = 'Без названия',
  'aria-label': ariaLabel,
  disabled = false,
  savedMessage,
  className,
}: EditableProps) {
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const focusPreview = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const editing = draft !== null;

  useEffect(() => () => clearTimeout(timer.current), []);

  useLayoutEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (focusPreview.current) {
      focusPreview.current = false;
      previewRef.current?.focus();
    }
  }, [editing]);

  const finish = (save: boolean, keepFocus: boolean) => {
    // Enter and Esc unmount the field, and its blur must not finish a second time.
    if (closing.current || draft === null) return;
    closing.current = true;
    focusPreview.current = keepFocus;
    setDraft(null);
    const next = draft.trim();
    if (!save || !next || next === text) return;
    setOwn(next);
    onValueCommit?.(next);
    if (!savedMessage) return;
    setSaved(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), SAVED_MS);
  };

  return (
    // A span: the whole thing is phrasing content, so it may sit inside a heading.
    <span data-slot="editable" className={cn('inline-flex max-w-full min-w-0 flex-col gap-2', className)}>
      {editing ? (
        <>
          <BaseInput
            ref={inputRef}
            aria-label={ariaLabel}
            value={draft}
            onValueChange={setDraft}
            onBlur={() => finish(true, false)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== 'Escape') return;
              event.preventDefault();
              finish(event.key === 'Enter', true);
            }}
            className="h-control-md w-full min-w-40 rounded-control-md border border-ring bg-field px-3 shadow-[0_0_0_1px_var(--color-ring)] outline-none [field-sizing:content]"
          />
          <span aria-hidden className="flex items-center gap-1.5 pl-3 text-caption text-fg-3 pointer-coarse:hidden">
            <Kbd>Enter</Kbd>
            <span className="pr-1.5">сохранить</span>
            <Kbd>Esc</Kbd>
            отменить
          </span>
        </>
      ) : (
        <button
          ref={previewRef}
          type="button"
          disabled={disabled}
          aria-label={`${ariaLabel}: ${text || placeholder}`}
          onClick={() => {
            closing.current = false;
            setDraft(text);
          }}
          className="group/editable inline-flex h-control-md max-w-full items-center gap-2 self-start rounded-control-md border border-transparent px-3 text-left transition-colors duration-(--duration-micro) ease-hover hover:bg-fill-1 disabled:opacity-50"
        >
          <span className={cn('truncate', !text && 'text-fg-3')}>{text || placeholder}</span>
          <Pencil
            aria-hidden
            className="size-3.5 shrink-0 stroke-[1.75] text-fg-3 opacity-0 transition-opacity duration-(--duration-micro) group-hover/editable:opacity-100 group-focus-visible/editable:opacity-100 pointer-coarse:opacity-100"
          />
        </button>
      )}
      <span
        role="status"
        className="flex items-center gap-1.5 pl-3 text-caption text-success-soft-fg transition-opacity duration-(--duration-quick) ease-out empty:hidden starting:opacity-0 [&_svg]:size-3.5 [&_svg]:stroke-[1.75]"
      >
        {saved ? (
          <>
            <CircleCheck aria-hidden />
            {savedMessage}
          </>
        ) : null}
      </span>
    </span>
  );
}
