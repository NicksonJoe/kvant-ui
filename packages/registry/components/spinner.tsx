import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export interface SpinnerProps extends Omit<ComponentProps<'svg'>, 'children'> {
  size?: 16 | 20 | 24;
  /** Announces the spinner as a status. Omit when the parent already sets aria-busy. */
  label?: string;
  /** Use the parent's text colour (buttons); otherwise fg-3. */
  inherit?: boolean;
}

// `stroke-[2.5]!`: stays 2.5 even inside buttons that thin their icons.
export function Spinner({ size = 20, label, inherit = false, className, ...props }: SpinnerProps) {
  return (
    <svg
      data-slot="spinner"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('shrink-0 animate-spinner stroke-[2.5]!', !inherit && 'text-fg-3', className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
