import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/cn';
import { fieldShell } from './input';

const stepButton =
  'kv-pressable relative grid size-7 shrink-0 place-items-center rounded-full text-fg-2 [--kv-press-scale:var(--scale-press-icon)] ' +
  'hover:not-data-disabled:bg-fill-1 active:not-data-disabled:bg-fill-2 data-disabled:opacity-50 ' +
  'pointer-coarse:after:absolute pointer-coarse:after:-inset-2 [&_svg]:size-4 [&_svg]:stroke-[1.75]';

export interface NumberFieldProps extends Omit<BaseNumberField.Root.Props, 'className' | 'children'> {
  /** Standalone invalid state; inside <Field error> it is set for you. */
  invalid?: boolean;
  'aria-label'?: string;
  /** Root class — set the width here (168 px by default). */
  className?: string;
}

/**
 * Number in a capsule with «−» and «+». Arrows step, Shift+arrows ×10, Home/End jump to min/max;
 * holding a button repeats after 400 ms. Formats for ru-RU on blur and accepts either decimal separator.
 */
export function NumberField({ locale = 'ru-RU', invalid, 'aria-label': ariaLabel, className, ...props }: NumberFieldProps) {
  return (
    <BaseNumberField.Root data-slot="number-field" locale={locale} className={cn('w-42', className)} {...props}>
      <BaseNumberField.Group className={cn(fieldShell, 'h-control-md gap-1 rounded-control-md px-[3px]')}>
        <BaseNumberField.Decrement aria-label="Уменьшить" className={stepButton}>
          <Minus aria-hidden />
        </BaseNumberField.Decrement>
        <BaseNumberField.Input
          aria-label={ariaLabel}
          aria-roledescription="Числовое поле"
          aria-invalid={invalid || undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-center text-body-sm font-medium tabular-nums outline-none disabled:cursor-not-allowed"
        />
        <BaseNumberField.Increment aria-label="Увеличить" className={stepButton}>
          <Plus aria-hidden />
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}

export interface StepperProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** What is counted, e.g. «Гостей на встрече»; the value itself is shown next to it in the row. */
  'aria-label': string;
  className?: string;
}

const half =
  'kv-pressable grid h-full w-[47px] place-items-center text-fg-1 [--kv-press-scale:1] active:not-disabled:bg-fill-3 disabled:opacity-50 ' +
  'focus-visible:-outline-offset-2 [&_svg]:size-4 [&_svg]:stroke-[1.75]';

/** iOS stepper for list rows on touch screens: two halves of a 95 × 32 capsule; the new value is announced. */
export function Stepper({
  value,
  defaultValue = 0,
  onValueChange,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  disabled = false,
  'aria-label': ariaLabel,
  className,
}: StepperProps) {
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    setOwn(clamped);
    onValueChange?.(clamped);
  };
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="stepper"
      className={cn('inline-flex h-8 shrink-0 items-center overflow-hidden rounded-full bg-fill-2', className)}
    >
      <button type="button" aria-label="Уменьшить" disabled={disabled || current <= min} onClick={() => set(current - step)} className={half}>
        <Minus aria-hidden />
      </button>
      <span aria-hidden className="h-4.5 w-px shrink-0 bg-border" />
      <button type="button" aria-label="Увеличить" disabled={disabled || current >= max} onClick={() => set(current + step)} className={half}>
        <Plus aria-hidden />
      </button>
      <span role="status" className="sr-only">
        {current}
      </span>
    </div>
  );
}
