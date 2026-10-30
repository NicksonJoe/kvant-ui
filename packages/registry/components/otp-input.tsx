import { OTPField } from '@base-ui/react/otp-field';
import { Fragment, useId } from 'react';
import { cn } from '../lib/cn';

const cell =
  'h-13 w-11 shrink-0 rounded-md border border-input bg-field text-center text-[22px]/7 font-semibold text-fg-1 tabular-nums outline-none ' +
  'transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-hover hover:border-fg-3 ' +
  'focus-visible:border-ring focus-visible:shadow-[0_0_0_1px_var(--color-ring)] ' +
  'aria-invalid:border-danger data-invalid:border-danger aria-invalid:focus-visible:shadow-[0_0_0_1px_var(--color-danger)] ' +
  'data-success:border-success data-success:bg-success-soft disabled:bg-surface-2 disabled:hover:border-input';

export interface OtpInputProps extends Omit<OTPField.Root.Props, 'className' | 'children' | 'length'> {
  /** Number of cells. */
  length?: number;
  /** A dash after every N cells — 3 + 3 is easier to check against the SMS; 0 removes the dashes. */
  groupSize?: number;
  /** Wrong code: red cells and one shake of the row. Clear the value afterwards. */
  invalid?: boolean;
  /** Code accepted: green cells. */
  success?: boolean;
  /** Name of the first cell when there is no visible label. */
  'aria-label'?: string;
  className?: string;
}

/**
 * One-time code by cells (44 × 52). Typing moves to the next cell, Backspace goes back, a paste or an
 * SMS autofill (`one-time-code`) fills them all; `onValueComplete` fires when the last one is filled.
 */
export function OtpInput({
  length = 6,
  groupSize = 3,
  invalid = false,
  success = false,
  validationType = 'numeric',
  'aria-label': ariaLabel,
  className,
  ...props
}: OtpInputProps) {
  const unit = validationType === 'numeric' ? 'Цифра' : 'Символ';
  const labelId = useId();
  return (
    <OTPField.Root
      data-slot="otp-input"
      length={length}
      validationType={validationType}
      className={cn('flex items-center gap-2 data-disabled:opacity-50', invalid && 'animate-[kv-shake_300ms_var(--ease-out)]', className)}
      {...props}
    >
      {/* Base UI drops aria-label on the first cell: it takes its name from a label element */}
      {ariaLabel ? (
        <span id={labelId} hidden>
          {ariaLabel}
        </span>
      ) : null}
      {Array.from({ length }, (_, index) => (
        <Fragment key={index}>
          {groupSize > 0 && index > 0 && index % groupSize === 0 ? (
            <OTPField.Separator data-slot="otp-input-separator" className="h-0.5 w-2.5 shrink-0 rounded-full bg-fg-4" />
          ) : null}
          <OTPField.Input
            {...(index > 0 ? { 'aria-label': `${unit} ${index + 1} из ${length}` } : ariaLabel ? { 'aria-labelledby': labelId } : {})}
            // Only ever add aria-invalid: an undefined here would hide the invalid state a Field sets.
            {...(invalid ? { 'aria-invalid': true } : {})}
            data-success={success || undefined}
            className={cell}
          />
        </Fragment>
      ))}
    </OTPField.Root>
  );
}
