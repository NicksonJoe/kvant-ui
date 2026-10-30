import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu';
import { ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { positioner } from '../lib/recipes';

export interface NavigationMenuProps extends Omit<BaseNavigationMenu.Root.Props, 'className'> {
  className?: string;
}

/**
 * Site navigation with panels: opens on hover after 100ms or on click. The panel keeps its place
 * and smoothly changes size when moving between sections.
 */
export function NavigationMenu({ delay = 100, className, children, ...props }: NavigationMenuProps) {
  return (
    <BaseNavigationMenu.Root data-slot="navigation-menu" delay={delay} className={cn('relative min-w-0', className)} {...props}>
      <BaseNavigationMenu.List className="flex items-center gap-1">{children}</BaseNavigationMenu.List>
      <BaseNavigationMenu.Portal>
        <BaseNavigationMenu.Positioner
          sideOffset={8}
          collisionPadding={16}
          className={cn(
            positioner,
            'h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-(--duration-base) ease-standard data-instant:transition-none',
          )}
        >
          <BaseNavigationMenu.Popup
            className={cn(
              'relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) rounded-2xl bg-overlay text-fg-1 shadow-overlay outline-none',
              '[transition:opacity_var(--duration-quick)_var(--ease-out),scale_var(--duration-quick)_var(--ease-out),translate_var(--duration-quick)_var(--ease-out),width_var(--duration-base)_var(--ease-standard),height_var(--duration-base)_var(--ease-standard)]',
              'data-starting-style:-translate-y-(--shift-sm) data-starting-style:scale-(--scale-enter) data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--duration-fast)',
            )}
          >
            <BaseNavigationMenu.Viewport className="relative size-full overflow-hidden" />
          </BaseNavigationMenu.Popup>
        </BaseNavigationMenu.Positioner>
      </BaseNavigationMenu.Portal>
    </BaseNavigationMenu.Root>
  );
}

const headerLink =
  'kv-pressable relative inline-flex h-8 select-none items-center gap-1 rounded-full px-3 text-label-md font-medium text-fg-2 no-underline ' +
  'hover:bg-fill-1 hover:text-fg-1 active:bg-fill-2 data-popup-open:bg-fill-2 data-popup-open:text-fg-1 ' +
  'aria-[current=page]:text-fg-1 aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:left-1/2 aria-[current=page]:after:size-1 aria-[current=page]:after:-translate-x-1/2 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-accent';

export interface NavigationMenuItemProps {
  label: ReactNode;
  /** Panel content: NavigationMenuGroup columns and a feature card. Without it the item is a plain link. */
  children?: ReactNode;
  href?: string;
  /** Current section: fg-1 and a 4px accent dot. */
  active?: boolean;
  /** Router link for a plain item: `<Link to="…" />`. */
  render?: ReactElement;
  className?: string;
}

export function NavigationMenuItem({ label, children, href, active, render, className }: NavigationMenuItemProps) {
  if (!children) {
    return (
      <BaseNavigationMenu.Item>
        <BaseNavigationMenu.Link href={href} active={active} render={render} className={cn(headerLink, className)}>
          {label}
        </BaseNavigationMenu.Link>
      </BaseNavigationMenu.Item>
    );
  }
  return (
    <BaseNavigationMenu.Item>
      <BaseNavigationMenu.Trigger className={cn(headerLink, 'pr-2.5', className)}>
        {label}
        <BaseNavigationMenu.Icon className="grid size-3.5 place-items-center text-fg-3 transition-[rotate] duration-(--duration-base) ease-standard data-popup-open:rotate-180">
          <ChevronDown aria-hidden className="size-3.5 stroke-[1.75]" />
        </BaseNavigationMenu.Icon>
      </BaseNavigationMenu.Trigger>
      <BaseNavigationMenu.Content className="flex w-max max-w-[calc(100vw-32px)] flex-wrap gap-2 p-3 transition-opacity duration-(--duration-quick) ease-out data-ending-style:opacity-0 data-starting-style:opacity-0">
        {children}
      </BaseNavigationMenu.Content>
    </BaseNavigationMenu.Item>
  );
}

export interface NavigationMenuGroupProps extends Omit<ComponentProps<'div'>, 'title'> {
  label?: ReactNode;
}

/** Column 280 wide with a 12/16 label. */
export function NavigationMenuGroup({ label, className, children, ...props }: NavigationMenuGroupProps) {
  return (
    <div data-slot="navigation-menu-group" className={cn('flex w-70 flex-col gap-0.5', className)} {...props}>
      {label ? <p className="px-3 pt-1 pb-1.5 text-caption font-medium text-fg-3">{label}</p> : null}
      {children}
    </div>
  );
}

export interface NavigationMenuLinkProps extends Omit<BaseNavigationMenu.Link.Props, 'className' | 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** 18px icon in a 36 circle. */
  icon?: ReactNode;
  className?: string;
}

/** Panel link: r12, icon circle, title 14/20 and a two-line description. */
export function NavigationMenuLink({ title, description, icon, className, ...props }: NavigationMenuLinkProps) {
  return (
    <BaseNavigationMenu.Link
      data-slot="navigation-menu-link"
      className={cn(
        'group/link kv-pressable flex items-start gap-3 rounded-md px-3 py-2.5 text-fg-1 no-underline [--kv-press-scale:var(--scale-press-wide)] hover:bg-fill-2 active:bg-fill-3',
        className,
      )}
      {...props}
    >
      {icon ? (
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-fg-2 transition-colors duration-(--duration-micro) group-hover/link:bg-surface-1 [&_svg]:size-4.5 [&_svg]:stroke-[1.5]"
        >
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-label-md font-medium">{title}</span>
        {description ? <span className="text-body-xs text-fg-3">{description}</span> : null}
      </span>
    </BaseNavigationMenu.Link>
  );
}
