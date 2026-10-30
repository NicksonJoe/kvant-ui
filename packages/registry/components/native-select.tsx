import { Input as BaseInput } from '@base-ui/react/input';
import { ChevronsUpDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { fieldShell, fieldSizes, type FieldSize } from './input';

// The select fills the whole capsule (one hit target), so the padding moves onto it.
const padding: Record<FieldSize, string> = { sm: 'pl-3 pr-9', md: 'pl-3.5 pr-10', lg: 'pl-4 pr-11' };
const chevron: Record<FieldSize, string> = { sm: 'right-3', md: 'right-3.5', lg: 'right-4' };

export interface NativeSelectProps extends Omit<ComponentProps<'select'>, 'size' | 'className' | 'multiple'> {
  size?: FieldSize;
  /** Standalone invalid state; inside <Field error> it is set for you. */
  invalid?: boolean;
  /** Capsule class. */
  className?: string;
}

/**
 * The field look over a real <select>: the system draws the list (wheel on iOS, menu on macOS).
 * The double chevron hints that a system picker opens. Children are <option> and <optgroup>.
 */
export function NativeSelect({ size = 'md', invalid, className, children, ...props }: NativeSelectProps) {
  return (
    <div data-slot="native-select" className={cn(fieldShell, fieldSizes[size], 'px-0', className)}>
      <BaseInput
        render={<select {...props}>{children}</select>}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-full w-full min-w-0 cursor-pointer appearance-none truncate rounded-[inherit] bg-transparent outline-none disabled:cursor-not-allowed',
          padding[size],
        )}
      />
      <ChevronsUpDown aria-hidden className={cn('pointer-events-none absolute', chevron[size])} />
    </div>
  );
}
