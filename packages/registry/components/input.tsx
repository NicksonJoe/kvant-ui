import { Input as BaseInput } from '@base-ui/react/input';
import { X } from 'lucide-react';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Kbd } from './badge';

export type FieldSize = 'sm' | 'md' | 'lg';

/**
 * The text-field look shared by Input, Textarea, Select and DatePicker triggers.
 * States key off the inner control: :focus-visible → ring, aria-invalid → danger (+ one shake), disabled/read-only.
 * Disabled is read from the text control only: a stepper button that is off at its bound must not fade the field.
 */
export const fieldShell =
  'group/field relative flex items-center gap-2 bg-field text-fg-1 border border-input transition-[border-color,box-shadow] duration-(--duration-fast) ease-hover ' +
  'hover:border-fg-3 ' +
  'focus-within:border-ring focus-within:shadow-[0_0_0_1px_var(--color-ring)] ' +
  'has-[[aria-invalid=true]]:border-danger has-[[aria-invalid=true]]:animate-[kv-shake_300ms_var(--ease-out)] has-[[aria-invalid=true]]:focus-within:shadow-[0_0_0_1px_var(--color-danger)] ' +
  'has-[:is(input,textarea):disabled]:opacity-50 has-[:is(input,textarea):disabled]:bg-surface-2 has-[:is(input,textarea):disabled]:hover:border-input ' +
  'has-[[readonly]]:bg-surface-2 has-[[readonly]]:border-border ' +
  '[&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-fg-3 [&>svg]:stroke-[1.75]';

export const fieldSizes: Record<FieldSize, string> = {
  sm: 'h-control-sm rounded-control-sm px-3 text-label-sm font-regular',
  md: 'h-control-md rounded-control-md px-3.5 text-body-sm',
  lg: 'h-control-lg rounded-control-lg px-4 text-body-md',
};

// The trailing element sits on the axis of the rounding: circle 20 → 8 px, icon 16 → 10 px, kbd → 8 px.
// A segment addon takes the edge itself.
const slotPadding =
  'has-[>[data-slot=input-clear]:last-child]:pr-2 has-[>[data-slot=kbd]:last-child]:pr-2 has-[>svg:last-child]:pr-2.5 ' +
  'has-[>[data-variant=segment]:first-child]:pl-0 has-[>[data-variant=segment]:last-child]:pr-0';

const control = 'h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-3 disabled:cursor-not-allowed';

// Pops in from .8: five times the enter shrink, so reduced motion (enter scale 1) drops the scale too.
const popIn =
  'transition-[opacity,scale] duration-(--duration-quick) ease-out starting:opacity-0 starting:scale-[calc(1_-_(1_-_var(--scale-enter))_*_5)]';

export interface InputProps extends Omit<BaseInput.Props, 'className' | 'size' | 'prefix'> {
  size?: FieldSize;
  /** Leading icon, text or InputAddon (16px icon, fg-3). */
  prefix?: ReactNode;
  /** Trailing content: unit, InputAddon, eye toggle, spinner. */
  suffix?: ReactNode;
  /** Keyboard hint shown at the end, e.g. «⌘K». Hidden on touch screens. */
  kbd?: ReactNode;
  /** Shows a clear button while the (controlled) value is not empty. */
  onClear?: () => void;
  /** Standalone invalid state; inside <Field error> it is set for you. */
  invalid?: boolean;
  /** Wrapper (capsule) class. */
  className?: string;
}

export function Input({
  size = 'md',
  prefix,
  suffix,
  kbd,
  onClear,
  invalid,
  className,
  value,
  ...props
}: InputProps) {
  const showClear = onClear !== undefined && value !== undefined && String(value).length > 0;
  return (
    <div data-slot="input" className={cn(fieldShell, fieldSizes[size], slotPadding, className)}>
      {prefix}
      <BaseInput className={control} value={value} aria-invalid={invalid || undefined} {...props} />
      {showClear ? (
        <button
          type="button"
          data-slot="input-clear"
          aria-label="Очистить"
          onClick={onClear}
          className={cn(
            'relative grid size-5 shrink-0 place-items-center rounded-full bg-fill-2 text-fg-2 after:absolute after:-inset-1.5 hover:bg-fill-3 [&_svg]:size-3 [&_svg]:stroke-2',
            popIn,
          )}
        >
          <X aria-hidden />
        </button>
      ) : null}
      {suffix}
      {kbd ? <Kbd className="pointer-coarse:hidden">{kbd}</Kbd> : null}
    </div>
  );
}

export interface InputAddonProps extends ComponentProps<'span'> {
  /** inline — text inside the capsule (fg-3); segment — a surface-2 cell on the edge behind a hairline. */
  variant?: 'inline' | 'segment';
}

/**
 * Fixed part of a value — unit, protocol, domain. Put it in Input's `prefix` or `suffix`: it is not typed,
 * not submitted, and pressing it puts the caret into the field.
 */
export function InputAddon({ variant = 'inline', className, onMouseDown, ...props }: InputAddonProps) {
  return (
    <span
      data-slot="input-addon"
      data-variant={variant}
      onMouseDown={(event) => {
        onMouseDown?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        event.currentTarget.parentElement?.querySelector('input')?.focus();
      }}
      className={cn(
        'shrink-0 cursor-text select-none whitespace-pre',
        variant === 'inline'
          ? 'text-fg-3'
          : 'flex items-center self-stretch border-border bg-surface-2 text-fg-2 first:mr-0.5 first:rounded-l-[inherit] first:border-r first:pr-2.5 first:pl-3.5 last:ml-0.5 last:rounded-r-[inherit] last:border-l last:pr-3.5 last:pl-2.5',
        className,
      )}
      {...props}
    />
  );
}

export interface TextareaProps extends Omit<BaseInput.Props, 'className' | 'value' | 'defaultValue' | 'render'> {
  value?: string;
  defaultValue?: string;
  rows?: number;
  /** Soft limit: shows «84 / 500», turns amber from 90 % and red with aria-invalid above it. Text is never cut. */
  maxLength?: number;
  invalid?: boolean;
  className?: string;
}

const plural = new Intl.PluralRules('ru');
const charWords: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'символ', few: 'символа' };
const chars = (count: number) => `${count} ${charWords[plural.select(count)] ?? 'символов'}`;

export function Textarea({
  rows = 3,
  maxLength,
  invalid,
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: TextareaProps) {
  const [ownLength, setOwnLength] = useState((defaultValue ?? '').length);
  const length = value !== undefined ? value.length : ownLength;
  const limit = maxLength === undefined ? undefined : length > maxLength ? 'over' : length >= maxLength * 0.9 ? 'near' : undefined;
  return (
    <div
      data-slot="textarea"
      className={cn(fieldShell, 'flex-col items-stretch gap-1 rounded-xl px-3.5 py-2.5 text-body-sm', className)}
    >
      <BaseInput
        render={<textarea rows={rows} />}
        className="min-h-[74px] w-full resize-none bg-transparent outline-none placeholder:text-fg-3"
        value={value}
        defaultValue={defaultValue}
        aria-invalid={invalid || limit === 'over' || undefined}
        onValueChange={(next, details) => {
          setOwnLength(next.length);
          onValueChange?.(next, details);
        }}
        {...props}
      />
      {maxLength !== undefined ? (
        <>
          <span
            data-slot="textarea-counter"
            data-limit={limit}
            aria-hidden
            className="self-end text-caption text-fg-3 tabular-nums transition-colors duration-(--duration-fast) ease-hover data-[limit]:font-medium data-[limit=near]:text-warning-soft-fg data-[limit=over]:text-danger-soft-fg"
          >
            {length} / {maxLength}
          </span>
          {/* The count itself stays silent; only crossing 90 % and the limit is announced. */}
          <span aria-live="polite" className="sr-only">
            {limit === 'near' ? `Почти лимит: ${chars(maxLength)}` : limit === 'over' ? `Лимит превышен: больше ${chars(maxLength)}` : ''}
          </span>
        </>
      ) : null}
    </div>
  );
}
