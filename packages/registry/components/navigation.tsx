import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { ChevronLeft } from 'lucide-react';
import { createContext, use, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Tooltip } from './popover';

const SidebarContext = createContext({ collapsed: false });

export interface SidebarProps extends ComponentProps<'aside'> {
  /** 64px icon rail; labels move into tooltips. */
  collapsed?: boolean;
}

/** Admin sidebar: 256 ↔ 64, width animates 200ms ease-standard. */
export function Sidebar({ collapsed = false, className, children, ...props }: SidebarProps) {
  return (
    <SidebarContext value={{ collapsed }}>
      <aside
        data-slot="sidebar"
        data-collapsed={collapsed || undefined}
        className={cn(
          'flex h-full shrink-0 flex-col gap-4 overflow-x-hidden overflow-y-auto bg-background p-2 shadow-[inset_-1px_0_0_var(--color-separator)] transition-[width] duration-(--duration-base) ease-standard',
          collapsed ? 'w-16' : 'w-64',
          className,
        )}
        {...props}
      >
        {children}
      </aside>
    </SidebarContext>
  );
}

export interface SidebarSectionProps extends ComponentProps<'div'> {
  label?: string;
  /** Trailing action next to the label, e.g. a «+» icon button. */
  action?: ReactNode;
}

export function SidebarSection({ label, action, className, children, ...props }: SidebarSectionProps) {
  const { collapsed } = use(SidebarContext);
  return (
    <div data-slot="sidebar-section" role="group" aria-label={label} className={cn('flex flex-col gap-0.5', className)} {...props}>
      {label ? (
        collapsed ? (
          <span aria-hidden className="mx-auto my-3.5 h-px w-6 bg-separator" />
        ) : (
          <div className="flex h-8 items-center justify-between pr-1 pl-3 text-caption font-medium text-fg-3">
            {label}
            {action}
          </div>
        )
      ) : null}
      {children}
    </div>
  );
}

export interface SidebarItemProps extends useRender.ComponentProps<'a'> {
  icon: ReactNode;
  label: string;
  /** Trailing counter (tabular) or badge. */
  count?: ReactNode;
  active?: boolean;
  /** Shortcut hint in the rail tooltip. */
  shortcut?: string;
}

/** Link by default; pass `render={<Link to="…" />}` for the router. */
export function SidebarItem({ icon, label, count, active, shortcut, render, className, ...props }: SidebarItemProps) {
  const { collapsed } = use(SidebarContext);
  const element = useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      {
        'aria-current': active ? 'page' : undefined,
        'aria-label': collapsed ? label : undefined,
        className: cn(
          'group/item kv-pressable flex h-9 shrink-0 select-none items-center gap-2.5 rounded-full text-label-md font-medium text-fg-2 [--kv-press-scale:var(--scale-press-wide)]',
          'hover:bg-fill-1 hover:text-fg-1 active:bg-fill-2 aria-[current=page]:bg-surface-1 aria-[current=page]:text-fg-1 aria-[current=page]:shadow-raised',
          '[&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:stroke-[1.75] [&>svg]:text-fg-2 aria-[current=page]:[&>svg]:text-accent',
          collapsed ? 'mx-auto w-10 justify-center' : 'px-3',
          className,
        ),
        children: (
          <>
            {icon}
            {collapsed ? null : (
              <>
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {count !== undefined ? <span className="text-caption text-fg-3 tabular-nums">{count}</span> : null}
              </>
            )}
          </>
        ),
      },
      props,
    ),
  });
  return collapsed ? (
    <Tooltip content={label} shortcut={shortcut} side="right" sideOffset={8}>
      {element}
    </Tooltip>
  ) : (
    element
  );
}

export function SidebarFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="sidebar-footer" className={cn('mt-auto flex flex-col gap-0.5', className)} {...props} />;
}

/** Admin top bar: 56 high on the page background with a bottom separator. */
export function Topbar({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      data-slot="topbar"
      className={cn('flex h-14 shrink-0 items-center gap-3 border-b border-separator bg-background px-4', className)}
      {...props}
    />
  );
}

export function TopbarTitle({ className, ...props }: ComponentProps<'h1'>) {
  return <h1 className={cn('truncate text-label-md font-medium text-fg-1', className)} {...props} />;
}

/* ---------- iOS navigation bar ---------- */

const glass = 'bg-glass shadow-glass backdrop-blur-[20px] backdrop-saturate-180';

export interface AppBarProps extends Omit<ComponentProps<'header'>, 'title'> {
  title: ReactNode;
  /** inline: 17/22 centred in the 44 row · large: 34/41 under the row, moves into the row once scrolled. */
  titleSize?: 'inline' | 'large';
  /** Content scrolls under the bar: glass and a bottom hairline appear (opacity over the first 8px). */
  scrolled?: boolean;
  /** Left of the row: AppBarBack or a round close button. */
  leading?: ReactNode;
  /** Right of the row: AppBarActions, a text button or a round confirm button. */
  trailing?: ReactNode;
  /** Under the large title, e.g. a search field. */
  children?: ReactNode;
}

/** Mobile screen header: transparent at rest, glass when content goes under it. Make it sticky with classes. */
export function AppBar({ title, titleSize = 'inline', scrolled = false, leading, trailing, className, children, ...props }: AppBarProps) {
  const large = titleSize === 'large';
  const collapsed = large && scrolled;
  return (
    <header
      data-slot="app-bar"
      data-scrolled={scrolled || undefined}
      className={cn(
        'group/bar z-30 flex flex-col text-fg-1 transition-[background-color,box-shadow] duration-(--duration-quick) ease-out',
        'data-scrolled:bg-glass data-scrolled:shadow-[0_1px_0_var(--color-hairline)] data-scrolled:backdrop-blur-[20px] data-scrolled:backdrop-saturate-180',
        className,
      )}
      {...props}
    >
      <div className="relative flex h-11 items-center gap-2 px-4">
        <div className="flex min-w-0 flex-1 items-center">{leading}</div>
        {large ? (
          <span
            aria-hidden
            className={cn(
              'absolute inset-x-24 truncate text-center text-[17px]/[22px] font-semibold transition-opacity duration-(--duration-quick) ease-out',
              collapsed ? 'opacity-100' : 'opacity-0',
            )}
          >
            {title}
          </span>
        ) : (
          <h1 className="absolute inset-x-24 truncate text-center text-[17px]/[22px] font-semibold">{title}</h1>
        )}
        <div className="flex min-w-0 flex-1 items-center justify-end">{trailing}</div>
      </div>
      {large ? (
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-(--duration-quick) ease-out',
            collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <h1 className="px-4 pt-1 pb-2 text-[34px]/[41px] font-bold tracking-[-0.01em]">{title}</h1>
          </div>
        </div>
      ) : null}
      {children ? <div className="px-4 pb-2">{children}</div> : null}
    </header>
  );
}

export interface AppBarBackProps extends useRender.ComponentProps<'a'> {
  /** Title of the previous screen. */
  label: string;
}

/** Back: chevron 24 and the previous screen title in accent, 17/22. A link by default. */
export function AppBarBack({ label, render, className, ...props }: AppBarBackProps) {
  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      {
        className: cn(
          'kv-pressable -ml-2 inline-flex min-h-11 max-w-full items-center gap-0.5 rounded-full pr-2 text-[17px]/[22px] text-accent-soft-fg [--kv-press-scale:1] active:opacity-60 [&_svg]:size-6 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]',
          className,
        ),
        children: (
          <>
            <ChevronLeft aria-hidden />
            <span className="truncate">{label}</span>
          </>
        ),
      },
      props,
    ),
  });
}

/** Glass capsule 44 for icon buttons; on a glass bar it drops its own backing (no glass on glass). */
export function AppBarActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="app-bar-actions"
      className={cn(
        'flex h-11 items-center rounded-full px-1',
        glass,
        'group-data-scrolled/bar:bg-transparent group-data-scrolled/bar:shadow-none group-data-scrolled/bar:backdrop-blur-none',
        className,
      )}
      {...props}
    />
  );
}

export interface AppBarButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  icon: ReactNode;
  'aria-label': string;
  /** plain: 40×44 inside AppBarActions · glass: round 44 (close) · accent: round 44 confirm. */
  variant?: 'plain' | 'glass' | 'accent';
}

export function AppBarButton({ icon, variant = 'plain', className, ...props }: AppBarButtonProps) {
  return (
    <button
      type="button"
      data-slot="app-bar-button"
      className={cn(
        'kv-pressable grid shrink-0 place-items-center rounded-full [--kv-press-scale:var(--scale-press-icon)] [&_svg]:size-5 [&_svg]:stroke-[1.5] disabled:opacity-50',
        variant === 'plain' && 'h-11 w-10 text-fg-1 active:bg-fill-2',
        variant === 'glass' && cn('size-11 text-fg-1 active:bg-fill-2', glass),
        variant === 'accent' && 'size-11 bg-accent text-accent-fg shadow-accent-control active:bg-accent-pressed',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}

/* ---------- Site header ---------- */

export interface SiteHeaderProps extends ComponentProps<'header'> {
  /** After 8px of scroll: the bar leaves the edge and becomes a glass capsule 56 with a 12 offset. */
  scrolled?: boolean;
  /** Logo link on the left. */
  logo: ReactNode;
  /** Right side: «Войти» and a small CTA. */
  actions?: ReactNode;
}

/** Landing header: transparent and in the content grid at the top, a floating glass capsule after scrolling. */
export function SiteHeader({ scrolled = false, logo, actions, className, children, ...props }: SiteHeaderProps) {
  return (
    <header
      data-slot="site-header"
      data-scrolled={scrolled || undefined}
      className={cn('group/header z-40 transition-[padding] duration-(--duration-moderate) ease-standard data-scrolled:px-3 data-scrolled:pt-3', className)}
      {...props}
    >
      <div
        className={cn(
          'mx-auto flex h-16 max-w-280 items-center gap-6 rounded-full px-6',
          '[transition:height_var(--duration-moderate)_var(--ease-standard),padding_var(--duration-moderate)_var(--ease-standard),background-color_var(--duration-quick)_var(--ease-hover),box-shadow_var(--duration-quick)_var(--ease-hover)]',
          'group-data-scrolled/header:h-14 group-data-scrolled/header:px-3',
          'group-data-scrolled/header:bg-glass group-data-scrolled/header:shadow-glass group-data-scrolled/header:backdrop-blur-[20px] group-data-scrolled/header:backdrop-saturate-180',
        )}
      >
        <div className="flex shrink-0 items-center">{logo}</div>
        <div className="flex min-w-0 flex-1 items-center max-md:hidden">{children}</div>
        <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
