import { ArrowUp, CircleAlert, File, Lock, Paperclip, X } from 'lucide-react';
import { useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import { Spinner } from './spinner';

export interface PromptInputProps extends Omit<ComponentProps<'form'>, 'onSubmit' | 'children' | 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Enter sends (Shift+Enter is a new line); the field clears itself afterwards. */
  onSubmit: (value: string) => void;
  /** Say why a disabled chat is closed: «Чат закрыт: сделка перенесена в архив». */
  placeholder?: string;
  /** PromptAttachment items, shown above the text inside the same field. */
  attachments?: ReactNode;
  /** Shows the paperclip button. */
  onAttach?: () => void;
  /** The message is on its way: the text is locked, a spinner replaces the arrow. */
  sending?: boolean;
  disabled?: boolean;
  /** Name of the text field for screen readers. */
  label?: string;
}

/**
 * Chat composer: a 52 capsule that grows to six lines (radius 28 stays), buttons pinned to the bottom edge.
 * The send button is inactive until there is text or a file.
 */
export function PromptInput({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onSubmit,
  placeholder = 'Напишите сообщение…',
  attachments,
  onAttach,
  sending = false,
  disabled = false,
  label = 'Сообщение',
  className,
  ...props
}: PromptInputProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange);
  const field = useRef<HTMLTextAreaElement>(null);
  const ready = !disabled && !sending && (value.trim().length > 0 || Boolean(attachments));

  // grow with the text up to six lines; the height change itself is a 150ms transition
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const submit = () => {
    if (!ready) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <form
      data-slot="prompt-input"
      aria-busy={sending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className={cn(
        'flex flex-col gap-2.5 rounded-[28px] border border-input bg-field p-[7px] text-fg-1 transition-[border-color,box-shadow] duration-(--duration-fast) ease-hover',
        'hover:border-fg-3 focus-within:border-ring focus-within:shadow-[0_0_0_1px_var(--color-ring)]',
        disabled && 'pointer-events-none bg-surface-2 opacity-50',
        className,
      )}
      {...props}
    >
      {attachments ? <div className="flex flex-wrap gap-2.5 px-1 pt-1">{attachments}</div> : null}
      <div className="flex items-end gap-1">
        {disabled ? (
          <span aria-hidden className="grid size-9 shrink-0 place-items-center text-fg-3 [&_svg]:size-4.5 [&_svg]:stroke-[1.5]">
            <Lock />
          </span>
        ) : onAttach ? (
          <button
            type="button"
            aria-label="Прикрепить файл"
            onClick={onAttach}
            disabled={sending}
            className="kv-pressable grid size-9 shrink-0 place-items-center rounded-full text-fg-2 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-1 hover:text-fg-1 active:bg-fill-2 disabled:opacity-50 [&_svg]:size-4.5 [&_svg]:stroke-[1.5]"
          >
            <Paperclip />
          </button>
        ) : null}
        <textarea
          ref={field}
          rows={1}
          aria-label={label}
          value={value}
          placeholder={placeholder}
          readOnly={sending}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            submit();
          }}
          className={cn(
            'max-h-[136px] min-h-9 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-body-sm outline-none transition-[height] duration-(--duration-quick) ease-standard placeholder:text-fg-3 read-only:text-fg-3',
            !onAttach && !disabled && 'pl-3',
          )}
        />
        <button
          type="submit"
          aria-label={sending ? 'Отправляется' : 'Отправить'}
          aria-busy={sending || undefined}
          aria-disabled={sending || undefined}
          disabled={!sending && !ready}
          className={cn(
            'kv-pressable grid size-9 shrink-0 place-items-center rounded-full [--kv-press-scale:var(--scale-press-icon)] [&_svg]:size-4.5 [&_svg]:stroke-[1.75]',
            ready || sending ? 'bg-accent text-accent-fg shadow-accent-control hover:bg-accent-hover active:bg-accent-pressed' : 'bg-fill-2 text-fg-4',
          )}
        >
          {sending ? <Spinner inherit size={16} /> : <ArrowUp aria-hidden />}
        </button>
      </div>
    </form>
  );
}

export interface PromptAttachmentProps extends Omit<ComponentProps<'div'>, 'children'> {
  name: string;
  /** «184 КБ · PDF». */
  meta?: ReactNode;
  /** Image URL: a 56 thumbnail instead of a file chip. */
  preview?: string;
  /** 0–100 while uploading. */
  progress?: number;
  /** What went wrong, in a way that helps: «Больше 20 МБ». */
  error?: ReactNode;
  /** Way out of the error: a link button «Сжать и отправить». */
  action?: ReactNode;
  onRemove?: () => void;
}

/** File chip 56 high (r12) or image thumbnail; × in a 20 circle on the corner removes it. */
export function PromptAttachment({ name, meta, preview, progress, error, action, onRemove, className, ...props }: PromptAttachmentProps) {
  const uploading = progress !== undefined && progress < 100;
  const remove = onRemove ? (
    <button
      type="button"
      aria-label={`Убрать «${name}»`}
      onClick={onRemove}
      className="kv-pressable absolute -top-1.5 -right-1.5 z-1 grid size-5 place-items-center rounded-full bg-fg-1 text-surface-1 shadow-[0_0_0_2px_var(--color-surface-1)] [--kv-press-scale:var(--scale-press-icon)] [&_svg]:size-3 [&_svg]:stroke-[2.25]"
    >
      <X aria-hidden />
    </button>
  ) : null;

  return (
    <div
      data-slot="prompt-attachment"
      data-invalid={error ? true : undefined}
      className={cn(
        'relative shrink-0 transition-[opacity,scale] duration-(--duration-quick) ease-out starting:scale-(--scale-enter) starting:opacity-0',
        className,
      )}
      {...props}
    >
      {preview ? (
        <div className="relative size-14 overflow-hidden rounded-md bg-surface-2">
          <img src={preview} alt={name} className={cn('size-full object-cover', uploading && 'opacity-60')} />
          {uploading ? (
            <span className="absolute inset-0 grid place-items-center bg-scrim text-surface-1">
              <Spinner inherit size={20} label={`Загрузка «${name}», ${Math.round(progress)} %`} />
            </span>
          ) : null}
        </div>
      ) : (
        <div className={cn('flex h-14 max-w-72 items-center gap-2.5 rounded-md py-2 pr-3 pl-2', error ? 'bg-danger-soft' : 'bg-surface-2')}>
          <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface-1 text-fg-2 [&_svg]:size-4.5 [&_svg]:stroke-[1.5]">
            {uploading ? <Spinner size={20} /> : error ? <CircleAlert className="text-danger-soft-fg" /> : <File />}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-label-sm font-medium text-fg-1">{name}</span>
            <span className={cn('truncate text-caption tabular-nums', error ? 'text-danger-soft-fg' : 'text-fg-3')}>
              {error ? (
                <>
                  {error}
                  {action ? <> · {action}</> : null}
                </>
              ) : uploading ? (
                `Загрузка · ${Math.round(progress)} %`
              ) : (
                meta
              )}
            </span>
          </span>
        </div>
      )}
      {remove}
    </div>
  );
}
