import { Input as BaseInput } from '@base-ui/react/input';
import { useLayoutEffect, useRef, useState, type ChangeEvent } from 'react';
import { cn } from '../lib/cn';
import { fieldShell, fieldSizes, type FieldSize } from './input';

/** Digit slot in a mask; every other character is a literal. */
const SLOT = '#';
const digitsOf = (text: string) => text.replace(/\D/g, '');

/** Lays digits into the mask; literals appear only in front of a digit: «9123» → «(912) 3». */
export function formatMask(digits: string, mask: string): string {
  let out = '';
  let next = 0;
  for (const char of mask) {
    if (next >= digits.length) break;
    out += char === SLOT ? digits.charAt(next++) : char;
  }
  return out;
}

/** Caret position right after the `count`-th digit of a formatted value. */
function caretAfter(formatted: string, count: number): number {
  if (count === 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted.charAt(index)) && ++seen === count) return index + 1;
  }
  return formatted.length;
}

export interface MaskedInputProps
  extends Omit<BaseInput.Props, 'className' | 'size' | 'prefix' | 'value' | 'defaultValue' | 'onValueChange' | 'onChange' | 'name' | 'type'> {
  /** `#` is a digit, everything else is typed for the user: «(###) ###-##-##», «#### #### #### ####». */
  mask: string;
  /** Fixed start shown before the value and added to the submitted one, e.g. the country code «+7». */
  prefix?: string;
  /** Digits only. */
  value?: string;
  defaultValue?: string;
  /** Digits only, without the mask and the prefix. */
  onValueChange?: (digits: string) => void;
  /** The form gets `prefix + digits`: «+79123456789». */
  name?: string;
  size?: FieldSize;
  invalid?: boolean;
  className?: string;
}

/**
 * Pattern entry: the user types digits only, brackets and dashes appear by themselves and the caret
 * steps over them. A pasted or autofilled number with a country code («8 912…», «+7 912…») keeps its last digits.
 */
export function MaskedInput({
  mask,
  prefix,
  value,
  defaultValue = '',
  onValueChange,
  name,
  size = 'md',
  invalid,
  inputMode = 'numeric',
  onKeyDown,
  className,
  ...props
}: MaskedInputProps) {
  const slots = [...mask].filter((char) => char === SLOT).length;
  const [own, setOwn] = useState(() => digitsOf(defaultValue).slice(0, slots));
  const digits = value !== undefined ? digitsOf(value).slice(0, slots) : own;
  const formatted = formatMask(digits, mask);
  const inputRef = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (caret.current === null) return;
    inputRef.current?.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  const update = (next: string, caretAt: number) => {
    // Unchanged digits (a letter, a digit past the end) cause no render, so no caret to restore later.
    caret.current = next === digits ? null : caretAfter(formatMask(next, mask), caretAt);
    setOwn(next);
    if (next !== digits) onValueChange?.(next);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const typed = digitsOf(input.value);
    // More than one new digit past the end is a paste or an autofill with a country code: keep the tail.
    const next = typed.length > slots && typed.length - digits.length > 1 ? typed.slice(-slots) : typed.slice(0, slots);
    const before = digitsOf(input.value.slice(0, input.selectionStart ?? input.value.length)).length;
    update(next, Math.min(before, next.length));
  };

  return (
    <div data-slot="masked-input" className={cn(fieldShell, fieldSizes[size], className)}>
      {prefix ? (
        <>
          <span className="shrink-0 font-medium text-fg-2 tabular-nums">{prefix}</span>
          <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
        </>
      ) : null}
      <span className="relative flex h-full min-w-0 flex-1 items-center">
        {/* The rest of the mask, drawn behind the text right where the typed part ends. */}
        <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre tabular-nums">
          <span className="invisible">{formatted}</span>
          <span className="tracking-[0.08em] text-fg-3">{mask.slice(formatted.length).replaceAll(SLOT, '_')}</span>
        </span>
        <BaseInput
          ref={inputRef}
          value={formatted}
          inputMode={inputMode}
          {...(invalid ? { 'aria-invalid': true } : {})}
          onChange={onChange}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            const input = event.currentTarget;
            const at = input.selectionStart ?? 0;
            // Backspace right after «) » removes the digit before it, not the bracket that would come back.
            if (event.key !== 'Backspace' || event.defaultPrevented || at !== input.selectionEnd || /\d/.test(input.value.charAt(at - 1))) return;
            const before = digitsOf(input.value.slice(0, at)).length;
            if (before === 0) return;
            event.preventDefault();
            update(digits.slice(0, before - 1) + digits.slice(before), before - 1);
          }}
          className="relative h-full w-full min-w-0 bg-transparent tabular-nums outline-none disabled:cursor-not-allowed"
          {...props}
        />
      </span>
      {name ? <input type="hidden" name={name} value={`${(prefix ?? '').replace(/\s/g, '')}${digits}`} /> : null}
    </div>
  );
}
