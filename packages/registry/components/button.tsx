import { Button as BaseButton } from '@base-ui/react/button';
import { mergeProps } from '@base-ui/react/merge-props';
import { Toolbar } from '@base-ui/react/toolbar';
import { useRender } from '@base-ui/react/use-render';
import { X } from 'lucide-react';
import { cloneElement, createContext, isValidElement, use, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './spinner';

export const BUTTON_VARIANTS = ['primary', 'secondary', 'soft', 'outline', 'ghost', 'danger', 'danger-soft', 'link'] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export const BUTTON_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

// Loading also sets data-disabled (no clicks) but must not fade: hence not-aria-busy.
const base =
  'kv-pressable relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap not-aria-busy:data-disabled:opacity-50 data-disabled:pointer-events-none';

const sizes: Record<ButtonSize, string> = {
  xs: 'h-control-xs gap-1 px-2.5 rounded-control-xs text-caption font-medium [&_svg]:size-3.5 [&_svg]:stroke-[1.75]',
  sm: 'h-control-sm gap-1.5 px-3.5 rounded-control-sm text-label-sm font-medium [&_svg]:size-4 [&_svg]:stroke-[1.75]',
  md: 'h-control-md gap-1.5 px-4 rounded-control-md text-label-md font-medium [&_svg]:size-4 [&_svg]:stroke-[1.75]',
  lg: 'h-control-lg gap-2 px-5 rounded-control-lg text-label-lg font-medium [&_svg]:size-5 [&_svg]:stroke-[1.5]',
  xl: 'h-control-xl gap-2 px-6 rounded-control-xl text-[17px]/[22px] font-semibold [&_svg]:size-5 [&_svg]:stroke-[1.5] [--kv-press-scale:var(--scale-press-wide)]',
};

// Icon-only: circle, width = height; small ones press deeper and get a 44px touch target.
const iconSizes: Record<ButtonSize, string> = {
  xs: 'size-control-xs rounded-control-xs [&_svg]:size-3.5 [&_svg]:stroke-[1.75] [--kv-press-scale:var(--scale-press-icon)] pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5',
  sm: 'size-control-sm rounded-control-sm [&_svg]:size-4 [&_svg]:stroke-[1.75] [--kv-press-scale:var(--scale-press-icon)] pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5',
  md: 'size-control-md rounded-control-md [&_svg]:size-4 [&_svg]:stroke-[1.75]',
  lg: 'size-control-lg rounded-control-lg [&_svg]:size-5 [&_svg]:stroke-[1.5]',
  xl: 'size-control-xl rounded-control-xl [&_svg]:size-5 [&_svg]:stroke-[1.5]',
};

const linkSizes: Record<ButtonSize, string> = {
  xs: 'gap-1 text-caption font-medium [&_svg]:size-3.5 [&_svg]:stroke-[1.75]',
  sm: 'gap-1 text-label-sm font-medium [&_svg]:size-4 [&_svg]:stroke-[1.75]',
  md: 'gap-1 text-label-md font-medium [&_svg]:size-4 [&_svg]:stroke-[1.75]',
  lg: 'gap-1 text-label-lg font-medium [&_svg]:size-5 [&_svg]:stroke-[1.5]',
  xl: 'gap-1 text-label-lg font-semibold [&_svg]:size-5 [&_svg]:stroke-[1.5]',
};

// Neutral variants (Paper 1WB-0): icons a step quieter than the label, full strength under the pointer; spinner fg-3.
const quietIcons =
  '[&>svg]:text-fg-2 hover:[&>svg]:text-fg-1 active:[&>svg]:text-fg-1 aria-expanded:[&>svg]:text-fg-1 [&>[data-slot=spinner]]:text-fg-3';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-fg shadow-accent-control hover:bg-accent-hover active:bg-accent-pressed active:shadow-pressed-accent aria-expanded:bg-accent-pressed',
  secondary: cn(
    'bg-control text-fg-1 shadow-control hover:bg-control-hover active:bg-control-pressed active:shadow-control-pressed aria-expanded:bg-control-pressed',
    quietIcons,
  ),
  soft: 'bg-accent-soft text-accent-soft-fg hover:bg-accent-soft-hover active:bg-accent-soft-hover aria-expanded:bg-accent-soft-hover',
  outline: cn('text-fg-1 shadow-[inset_0_0_0_1px_var(--color-border)] hover:bg-fill-1 active:bg-fill-2 aria-expanded:bg-fill-2', quietIcons),
  ghost: cn('text-fg-1 hover:bg-fill-1 active:bg-fill-2 aria-expanded:bg-fill-2', quietIcons),
  danger:
    'bg-danger text-danger-fg shadow-accent-control hover:bg-danger-hover active:bg-danger-hover active:shadow-pressed-accent',
  'danger-soft':
    'bg-danger-soft text-danger-soft-fg hover:bg-[image:linear-gradient(var(--color-fill-1),var(--color-fill-1))] active:bg-[image:linear-gradient(var(--color-fill-2),var(--color-fill-2))]',
  link: 'rounded-full text-accent-soft-fg underline-offset-3 decoration-1 hover:underline active:text-accent-pressed active:underline [--kv-press-scale:1]',
};

export interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
}

/** Recipe classes, for composing the button look onto other elements (e.g. a `render` prop). */
export function buttonClasses({ variant = 'primary', size = 'md', iconOnly = false }: ButtonClassOptions = {}): string {
  return cn(variant === 'link' ? cn(base, linkSizes[size]) : buttonShape({ size, iconOnly }), variants[variant]);
}

/** Geometry and press physics without colours: for pressables with their own tones (toggles). */
export function buttonShape({ size = 'md', iconOnly = false }: Omit<ButtonClassOptions, 'variant'> = {}): string {
  return cn(base, iconOnly ? iconSizes[size] : sizes[size]);
}

export interface ButtonProps extends Omit<BaseButton.Props, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Spinner replaces the leading icon, else the trailing one, else overlays the label; width never changes. */
  loading?: boolean;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  loading = false,
  disabled,
  className,
  children,
  render,
  nativeButton,
  ...props
}: ButtonProps) {
  const overlaySpinner = loading && !leadingIcon && !trailingIcon;
  const content = (
    <>
      {loading && leadingIcon ? <Spinner inherit /> : leadingIcon}
      {overlaySpinner ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner inherit />
        </span>
      ) : null}
      <span data-slot="button-label" className={cn('inline-flex items-center', overlaySpinner && 'invisible')}>
        {children}
      </span>
      {loading && !leadingIcon && trailingIcon ? <Spinner inherit /> : trailingIcon}
    </>
  );
  const own = {
    'data-slot': 'button',
    'data-variant': variant,
    'data-size': size,
    'aria-busy': loading || undefined,
    className: cn(buttonClasses({ variant, size }), className),
  };
  if (render) {
    return (
      <ComposedButton render={render} disabled={disabled || loading} {...own} {...props}>
        {content}
      </ComposedButton>
    );
  }
  return (
    <BaseButton disabled={disabled || loading} focusableWhenDisabled={loading} nativeButton={nativeButton} {...own} {...props}>
      {content}
    </BaseButton>
  );
}

type ComposedButtonProps = Omit<ButtonProps, 'variant' | 'size' | 'leadingIcon' | 'trailingIcon' | 'loading' | 'nativeButton'> & {
  render: NonNullable<ButtonProps['render']>;
};

/** Button look on another tag: the tag keeps its own role (a link stays a link); disabled is aria-disabled and keeps focus. */
function ComposedButton({ render, disabled = false, style, onClick, ref, ...props }: ComposedButtonProps) {
  const anchor = isValidElement<ComponentProps<'a'>>(render) && render.type === 'a';
  return useRender({
    // The element's own href wins the merge, so a disabled link drops it here.
    render: disabled && anchor ? cloneElement(render, { href: undefined }) : render,
    ref,
    state: { disabled },
    props: mergeProps<'button'>(props, {
      style: typeof style === 'function' ? style({ disabled }) : style,
      onClick: disabled ? (event) => event.preventDefault() : onClick,
      ...(disabled ? { 'aria-disabled': true, tabIndex: 0, role: anchor ? 'link' : undefined } : {}),
    }),
  });
}

export interface IconButtonProps extends Omit<ButtonProps, 'leadingIcon' | 'trailingIcon' | 'children'> {
  /** Required: icon buttons have no visible label. Pair with a Tooltip carrying the same text. */
  'aria-label': string;
  icon: ReactNode;
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}: IconButtonProps) {
  return (
    <BaseButton
      data-slot="icon-button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size, iconOnly: true }), className)}
      {...props}
    >
      {loading ? <Spinner inherit /> : icon}
    </BaseButton>
  );
}

export interface CloseButtonProps extends Omit<BaseButton.Props, 'className' | 'children'> {
  /** `filled` sits on a fill-2 disc (sheets, media); default is transparent (dialogs, toasts). */
  appearance?: 'ghost' | 'filled';
  'aria-label'?: string;
  className?: string;
}

/** 32px circle with a 16px ×. Esc does the same in overlays. */
export function CloseButton({ appearance = 'ghost', className, ...props }: CloseButtonProps) {
  return (
    <BaseButton
      data-slot="close-button"
      aria-label="Закрыть"
      className={cn(
        'kv-pressable inline-grid size-8 shrink-0 place-items-center rounded-full text-fg-2 [--kv-press-scale:var(--scale-press-icon)] data-disabled:opacity-50 data-disabled:pointer-events-none',
        appearance === 'filled' ? 'bg-fill-2 hover:bg-fill-3 active:bg-fill-3' : 'hover:bg-fill-2 active:bg-fill-3',
        className,
      )}
      {...props}
    >
      <X aria-hidden className="size-4 stroke-[1.75]" />
    </BaseButton>
  );
}

type GroupVariant = 'secondary' | 'primary';
const GroupContext = createContext<{ variant: GroupVariant; size: ButtonSize }>({ variant: 'secondary', size: 'md' });

const groupShell: Record<GroupVariant, string> = {
  secondary: 'bg-control text-fg-1 shadow-control divide-border',
  primary: 'bg-accent text-accent-fg shadow-accent-control divide-[color-mix(in_oklab,var(--color-accent-fg)_24%,transparent)]',
};
const groupItem: Record<GroupVariant, string> = {
  secondary: 'hover:not-data-disabled:bg-control-hover active:not-data-disabled:bg-control-pressed aria-expanded:bg-control-pressed',
  primary:
    'hover:not-data-disabled:bg-accent-hover active:not-data-disabled:bg-accent-pressed aria-expanded:bg-accent-pressed focus-visible:outline-accent-fg',
};
const groupRadius: Record<ButtonSize, string> = {
  xs: 'rounded-control-xs',
  sm: 'rounded-control-sm',
  md: 'rounded-control-md',
  lg: 'rounded-control-lg',
  xl: 'rounded-control-xl',
};

export interface ButtonGroupProps extends Omit<Toolbar.Root.Props, 'className'> {
  variant?: GroupVariant;
  size?: ButtonSize;
  className?: string;
}

/** Attached capsule: one outer shape, hairline-separated segments. Arrows move between segments, Tab leaves. */
export function ButtonGroup({ variant = 'secondary', size = 'md', className, ...props }: ButtonGroupProps) {
  return (
    <GroupContext value={{ variant, size }}>
      <Toolbar.Root
        data-slot="button-group"
        className={cn('inline-flex divide-x overflow-hidden', groupRadius[size], groupShell[variant], className)}
        {...props}
      />
    </GroupContext>
  );
}

export interface ButtonGroupItemProps extends Omit<Toolbar.Button.Props, 'className'> {
  /** Square segment for a lone icon. */
  iconOnly?: boolean;
  className?: string;
}

const groupItemSizes: Record<ButtonSize, string> = {
  xs: 'h-control-xs gap-1 px-2.5 text-caption font-medium [&_svg]:size-3.5 [&_svg]:stroke-[1.75]',
  sm: 'h-control-sm gap-1.5 px-3 text-label-sm font-medium [&_svg]:size-4 [&_svg]:stroke-[1.75]',
  md: 'h-control-md gap-1.5 px-3.5 text-label-md font-medium [&_svg]:size-4 [&_svg]:stroke-[1.75]',
  lg: 'h-control-lg gap-2 px-4 text-label-lg font-medium [&_svg]:size-5 [&_svg]:stroke-[1.5]',
  xl: 'h-control-xl gap-2 px-5 text-label-lg font-semibold [&_svg]:size-5 [&_svg]:stroke-[1.5]',
};
const groupIconSizes: Record<ButtonSize, string> = {
  xs: 'size-control-xs [&_svg]:size-3.5 [&_svg]:stroke-[1.75]',
  sm: 'size-control-sm [&_svg]:size-4 [&_svg]:stroke-[1.75]',
  md: 'size-control-md [&_svg]:size-4 [&_svg]:stroke-[1.75]',
  lg: 'size-control-lg [&_svg]:size-5 [&_svg]:stroke-[1.5]',
  xl: 'size-control-xl [&_svg]:size-5 [&_svg]:stroke-[1.5]',
};

export function ButtonGroupItem({ iconOnly = false, className, ...props }: ButtonGroupItemProps) {
  const { variant, size } = use(GroupContext);
  return (
    <Toolbar.Button
      data-slot="button-group-item"
      className={cn(
        // focus ring goes inside the segment so it never overlaps the neighbours
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-colors duration-(--duration-micro) ease-hover focus-visible:-outline-offset-2 data-disabled:opacity-50',
        iconOnly ? groupIconSizes[size] : groupItemSizes[size],
        groupItem[variant],
        className,
      )}
      {...props}
    />
  );
}
