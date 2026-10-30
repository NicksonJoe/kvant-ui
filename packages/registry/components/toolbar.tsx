import { Toggle } from '@base-ui/react/toggle';
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';
import { createContext, use, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Tooltip } from './popover';

export type ToolbarVariant = 'floating' | 'selection';
const VariantContext = createContext<ToolbarVariant>('floating');

export interface ToolbarProps extends Omit<BaseToolbar.Root.Props, 'className'> {
  /** floating: glass capsule 44 with 36 circles over a document · selection: 36 bar with 28 buttons above selected text. */
  variant?: ToolbarVariant;
  className?: string;
}

/** Grouped actions on a floating glass layer. One Tab stop; ← → move between buttons. */
export function Toolbar({ variant = 'floating', className, ...props }: ToolbarProps) {
  return (
    <VariantContext value={variant}>
      <BaseToolbar.Root
        data-slot="toolbar"
        data-variant={variant}
        className={cn(
          'inline-flex items-center gap-1 rounded-full backdrop-blur-[20px] backdrop-saturate-180',
          variant === 'floating' ? 'h-11 bg-glass p-1 shadow-glass' : 'h-9 bg-glass-strong p-1 shadow-overlay',
          className,
        )}
        {...props}
      />
    </VariantContext>
  );
}

const buttonLook = (variant: ToolbarVariant, iconOnly: boolean) =>
  cn(
    'kv-pressable inline-flex shrink-0 select-none items-center justify-center gap-1.5 rounded-full text-fg-2 [--kv-press-scale:var(--scale-press-icon)]',
    'hover:not-data-pressed:bg-fill-2 hover:text-fg-1 active:not-data-pressed:bg-fill-3 data-pressed:bg-accent-soft data-pressed:text-accent-soft-fg data-disabled:opacity-50 data-disabled:pointer-events-none',
    variant === 'floating' ? '[&_svg]:size-4 [&_svg]:stroke-[1.75]' : '[&_svg]:size-4 [&_svg]:stroke-[1.75] text-label-sm font-medium',
    iconOnly ? (variant === 'floating' ? 'size-9' : 'size-7') : variant === 'floating' ? 'h-9 px-3 text-label-md font-medium' : 'h-7 px-2.5',
  );

export interface ToolbarButtonProps extends Omit<BaseToolbar.Button.Props, 'className' | 'children'> {
  icon?: ReactNode;
  /** Accessible name and tooltip of an icon-only button; with `children` it is only the name. */
  label: string;
  /** Visible text, e.g. «Комментарий» in a selection bar. */
  children?: ReactNode;
  /** Shortcut in the tooltip: «⌘B». */
  shortcut?: string;
  className?: string;
}

export function ToolbarButton({ icon, label, children, shortcut, className, ...props }: ToolbarButtonProps) {
  const variant = use(VariantContext);
  const button = (
    <BaseToolbar.Button
      data-slot="toolbar-button"
      aria-label={children ? undefined : label}
      className={cn(buttonLook(variant, !children), className)}
      {...props}
    >
      {icon}
      {children}
    </BaseToolbar.Button>
  );
  return children ? button : <Tooltip content={label} shortcut={shortcut}>{button}</Tooltip>;
}

export interface ToolbarToggleProps extends Omit<ToolbarButtonProps, 'children'> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}

/** On/off formatting: aria-pressed, accent-soft while on (background 100ms). */
export function ToolbarToggle({ icon, label, shortcut, pressed, defaultPressed, onPressedChange, className, ...props }: ToolbarToggleProps) {
  const variant = use(VariantContext);
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <BaseToolbar.Button
        data-slot="toolbar-toggle"
        aria-label={label}
        render={<Toggle pressed={pressed} defaultPressed={defaultPressed} onPressedChange={(next) => onPressedChange?.(next)} />}
        className={cn(buttonLook(variant, true), 'transition-[background-color,color,scale] duration-(--duration-fast)', className)}
        {...props}
      >
        {icon}
      </BaseToolbar.Button>
    </Tooltip>
  );
}

export function ToolbarSeparator({ className, ...props }: Omit<BaseToolbar.Separator.Props, 'className'> & { className?: string }) {
  return <BaseToolbar.Separator data-slot="toolbar-separator" className={cn('mx-1 h-5 w-px shrink-0 bg-separator', className)} {...props} />;
}

export function ToolbarGroup({ className, ...props }: Omit<BaseToolbar.Group.Props, 'className'> & { className?: string }) {
  return <BaseToolbar.Group data-slot="toolbar-group" className={cn('flex items-center gap-1', className)} {...props} />;
}
