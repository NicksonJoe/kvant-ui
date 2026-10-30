import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { buttonShape, type ButtonSize } from './button';

// Tones are scoped by data-pressed so the off and on looks never compete for the same property.
const offLabelled =
  'not-data-pressed:bg-control not-data-pressed:text-fg-1 not-data-pressed:shadow-control not-data-pressed:[&_svg]:text-fg-2 ' +
  'not-data-pressed:hover:bg-control-hover not-data-pressed:active:bg-control-pressed not-data-pressed:active:shadow-control-pressed';
const offIcon = 'not-data-pressed:text-fg-2 not-data-pressed:hover:bg-fill-1 not-data-pressed:active:bg-fill-2';
const on =
  'data-pressed:bg-accent-soft data-pressed:text-accent-soft-fg data-pressed:hover:bg-accent-soft-hover ' +
  'data-pressed:active:bg-accent-soft-hover data-pressed:active:shadow-[inset_0_1px_2px_oklch(0_0_0/0.08)] ' +
  'data-pressed:[&_svg]:fill-current [&_svg]:transition-[fill] [&_svg]:duration-(--duration-quick) [&_svg]:ease-out';

export interface ToggleButtonProps extends Omit<Toggle.Props, 'className' | 'value'> {
  /** Same ladder as Button: 24 / 32 / 36 / 44 / 52 px. */
  size?: ButtonSize;
  /** Leading icon; while pressed it is filled with the text colour. */
  icon?: ReactNode;
  /** Circle with the icon only, transparent while off. Needs an aria-label. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Two-state button (Bold, Pin, Follow): the label never changes, the state lives in aria-pressed.
 * Off looks like a secondary button (icon-only: ghost), on — accent-soft with a filled icon.
 */
export function ToggleButton({ size = 'md', icon, iconOnly = false, className, children, ...props }: ToggleButtonProps) {
  return (
    <Toggle
      data-slot="toggle-button"
      data-size={size}
      className={cn(buttonShape({ size, iconOnly }), iconOnly ? offIcon : offLabelled, on, className)}
      {...props}
    >
      {icon}
      {iconOnly ? null : children}
    </Toggle>
  );
}

export interface ToggleGroupProps extends Omit<BaseToggleGroup.Props, 'className'> {
  className?: string;
}

/**
 * Toggles in one capsule. `multiple` — each item on its own (bold, italic); otherwise pressing an item
 * releases its neighbour and pressing it again clears the choice. One Tab stop, arrows move inside.
 */
export function ToggleGroup({ className, ...props }: ToggleGroupProps) {
  return (
    <BaseToggleGroup
      data-slot="toggle-group"
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-control-md bg-control p-0.5 shadow-control data-disabled:opacity-50 data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    />
  );
}

export interface ToggleGroupItemProps extends Omit<Toggle.Props, 'className' | 'value'> {
  /** Identifies the item in the group value. */
  value: string;
  className?: string;
}

/** 32 px circle (an icon) or capsule (a short word); give icon items an aria-label. */
export function ToggleGroupItem({ className, ...props }: ToggleGroupItemProps) {
  return (
    <Toggle
      data-slot="toggle-group-item"
      className={cn(
        'inline-flex h-control-sm min-w-(--spacing-control-sm) shrink-0 select-none items-center justify-center gap-1.5 rounded-control-inner px-2 text-label-sm font-medium text-fg-2',
        'transition-colors duration-(--duration-quick) ease-out focus-visible:-outline-offset-2 data-disabled:opacity-50',
        'not-data-pressed:hover:not-data-disabled:bg-fill-1 not-data-pressed:hover:not-data-disabled:text-fg-1 not-data-pressed:active:not-data-disabled:bg-fill-2',
        'data-pressed:bg-accent-soft data-pressed:text-accent-soft-fg data-pressed:hover:bg-accent-soft-hover',
        '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.75] data-pressed:[&_svg]:stroke-2',
        className,
      )}
      {...props}
    />
  );
}
