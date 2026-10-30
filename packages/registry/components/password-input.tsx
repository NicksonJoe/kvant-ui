import { Toggle } from '@base-ui/react/toggle';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { Input, type InputProps } from './input';

/** 0 — empty · 1 weak · 2 medium · 3 good · 4 strong. */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

const kinds = [/\p{L}/u, /\d/, /[^\p{L}\d\s]/u] as const;

/**
 * Weak: shorter than 10. Medium: 10+ without letters, digits and symbols together.
 * Good: 10+ with all three. Strong: 14+ or a phrase of four words.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  if (password.length >= 14 || password.trim().split(/\s+/).length >= 4) return 4;
  if (password.length < 10) return 1;
  return kinds.every((kind) => kind.test(password)) ? 3 : 2;
}

const plural = new Intl.PluralRules('ru');
const charWords: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'символ', few: 'символа' };
const chars = (count: number) => `${count} ${charWords[plural.select(count)] ?? 'символов'}`;

const levels = {
  1: { word: 'Слабый', tone: 'text-danger-soft-fg', bar: 'bg-danger' },
  2: { word: 'Средний', tone: 'text-warning-soft-fg', bar: 'bg-warning' },
  3: { word: 'Хороший', tone: 'text-success-soft-fg', bar: 'bg-success' },
  4: { word: 'Надёжный', tone: 'text-success-soft-fg', bar: 'bg-success' },
} as const;

function advice(password: string, strength: Exclude<PasswordStrength, 0>): string {
  if (strength === 1) return `Ещё ${chars(10 - password.length)} — и станет средним`;
  if (strength === 2) return 'Добавьте буквы, цифры и знаки — или удлините до 14 символов';
  if (strength === 3) return `Ещё ${chars(14 - password.length)} — и станет надёжным`;
  return '';
}

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'suffix' | 'onClear' | 'kbd'> {
  /** Four-step meter and advice under the field — for a new password; autocomplete becomes new-password. */
  showStrength?: boolean;
}

/** Hidden input with a show toggle. The toggle keeps the caret, and the password is hidden again on submit. */
export function PasswordInput({
  showStrength = false,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
  ...props
}: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);
  const [own, setOwn] = useState(String(defaultValue ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);
  const selection = useRef<[number, number] | null>(null);
  const password = value !== undefined ? String(value) : own;
  const strength = passwordStrength(password);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const hide = () => setRevealed(false);
    form.addEventListener('submit', hide);
    return () => form.removeEventListener('submit', hide);
  }, []);

  // Switching the input type resets the selection in some browsers: put the caret back.
  useLayoutEffect(() => {
    const range = selection.current;
    selection.current = null;
    if (range) inputRef.current?.setSelectionRange(...range);
  }, [revealed]);

  return (
    <div data-slot="password-input" className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Input
        ref={inputRef}
        type={revealed ? 'text' : 'password'}
        autoComplete={showStrength ? 'new-password' : 'current-password'}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next, details) => {
          setOwn(next);
          onValueChange?.(next, details);
        }}
        disabled={disabled}
        className="pr-1 [&_input[type=password]]:tracking-[0.12em]"
        suffix={
          <Toggle
            pressed={revealed}
            onPressedChange={(next) => {
              const input = inputRef.current;
              selection.current =
                input && document.activeElement === input ? [input.selectionStart ?? 0, input.selectionEnd ?? 0] : null;
              setRevealed(next);
            }}
            disabled={disabled}
            aria-label="Показать пароль"
            // A mouse press must not pull focus (and the caret) out of the field.
            onMouseDown={(event) => event.preventDefault()}
            className="kv-pressable relative grid size-7 shrink-0 place-items-center rounded-full text-fg-3 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-1 hover:text-fg-2 data-pressed:bg-fill-1 data-pressed:text-fg-2 data-disabled:pointer-events-none pointer-coarse:after:absolute pointer-coarse:after:-inset-2 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
          >
            {revealed ? (
              <EyeOff key="hide" aria-hidden className="transition-[opacity,scale] duration-(--duration-quick) ease-out starting:opacity-0 starting:scale-[calc(1_-_(1_-_var(--scale-enter))_*_5)]" />
            ) : (
              <Eye key="show" aria-hidden className="transition-[opacity,scale] duration-(--duration-quick) ease-out starting:opacity-0 starting:scale-[calc(1_-_(1_-_var(--scale-enter))_*_5)]" />
            )}
          </Toggle>
        }
        {...props}
      />
      {showStrength && strength !== 0 ? (
        <div data-slot="password-strength" data-strength={strength} className="flex flex-col gap-1.5 pt-0.5">
          <div aria-hidden className="flex gap-1">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                // Segments fill left to right, 35 ms apart.
                style={{ transitionDelay: `${(step - 1) * 35}ms` }}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-(--duration-quick) ease-out',
                  step <= strength ? levels[strength].bar : 'bg-fill-3',
                )}
              />
            ))}
          </div>
          <p className="text-caption text-fg-3">
            <span className={cn('font-medium', levels[strength].tone)}>{levels[strength].word}.</span>{' '}
            {advice(password, strength)}
          </p>
          <span aria-live="polite" className="sr-only">{`Надёжность пароля: ${levels[strength].word.toLowerCase()}`}</span>
        </div>
      ) : null}
    </div>
  );
}
