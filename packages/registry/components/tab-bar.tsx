import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { useEffect, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { CountBadge } from './badge';

const glass = 'bg-glass shadow-glass backdrop-blur-[20px] backdrop-saturate-180';

/** Moves the fill-2 backing under the current tab; the first placement does not slide. */
function placeIndicator(track: HTMLElement | null, indicator: HTMLElement | null, animate: boolean) {
  if (!track || !indicator) return;
  const current = track.querySelector<HTMLElement>('[aria-current="page"]');
  if (!animate) indicator.style.transition = 'none';
  indicator.style.setProperty('--kv-x', `${current?.offsetLeft ?? 0}px`);
  indicator.style.setProperty('--kv-w', `${current?.offsetWidth ?? 0}px`);
  indicator.hidden = !current;
  if (!animate) {
    indicator.getBoundingClientRect();
    indicator.style.transition = '';
  }
}

export interface TabBarProps extends ComponentProps<'nav'> {
  /** Names the navigation: «Разделы приложения». */
  'aria-label': string;
  /** Collapses to the current tab while the page scrolls down. */
  minimized?: boolean;
  /** A separate 62 glass circle on the right, usually <TabBarAction> for search. */
  action?: ReactNode;
}

/** iOS 26 tab bar: a floating glass capsule 62 high, 16 from the sides. Position it with classes (fixed / absolute). */
export function TabBar({ minimized = false, action, className, children, ...props }: TabBarProps) {
  const track = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  useLayoutEffect(() => {
    placeIndicator(track.current, indicator.current, placed.current);
    placed.current = true;
  });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(() => placeIndicator(el, indicator.current, false));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <nav data-slot="tab-bar" data-minimized={minimized || undefined} className={cn('flex items-end gap-2.5', className)} {...props}>
      <div
        ref={track}
        className={cn(
          'relative flex h-15.5 items-center rounded-full p-1 transition-[width] duration-(--duration-moderate) ease-fluid',
          glass,
          minimized ? 'w-15.5 justify-center' : 'min-w-0 flex-1',
        )}
      >
        <span
          ref={indicator}
          aria-hidden
          className={cn('kv-slide pointer-events-none absolute inset-y-1 left-0 w-(--kv-w) translate-x-(--kv-x) rounded-full bg-fill-2', minimized && 'invisible')}
        />
        {children}
      </div>
      {action}
    </nav>
  );
}

export interface TabBarItemProps extends useRender.ComponentProps<'a'> {
  icon: ReactNode;
  label: string;
  /** Unread counter on the icon; read out as «Входящие, 4 новых». */
  count?: number;
  /** Current section: accent colour, aria-current="page". */
  active?: boolean;
}

/** Tab 54 high: 24px icon over a 10/12 label. A link by default; for a router pass `render={<Link to="…" />}`. */
export function TabBarItem({ icon, label, count, active, render, className, ...props }: TabBarItemProps) {
  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      {
        'aria-current': active ? 'page' : undefined,
        className: cn(
          'kv-pressable relative z-1 flex h-13.5 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px]/3 font-medium text-fg-1',
          'active:bg-fill-1 aria-[current=page]:text-accent [&_svg]:size-6 [&_svg]:stroke-[1.5]',
          // minimized: only the current tab stays, as an icon in the circle
          'in-data-minimized:not-aria-[current=page]:hidden in-data-minimized:size-13.5 in-data-minimized:flex-none',
          className,
        ),
        children: (
          <>
            <span className="relative">
              {icon}
              {count ? <CountBadge aria-hidden count={count} className="absolute -top-1 -right-2.5" /> : null}
            </span>
            <span className="max-w-full truncate in-data-minimized:sr-only">{label}</span>
            {count ? <span className="sr-only">, {count} новых</span> : null}
          </>
        ),
      },
      props,
    ),
  });
}

export interface TabBarCenterProps extends ComponentProps<'button'> {
  'aria-label': string;
}

/** Middle slot 64 between the tabs for a face, usually <AgentAvatar size={56} />; hidden while minimized. */
export function TabBarCenter({ className, ...props }: TabBarCenterProps) {
  return (
    <button
      type="button"
      data-slot="tab-bar-center"
      className={cn('kv-pressable relative z-1 grid h-13.5 w-16 shrink-0 place-items-center rounded-full in-data-minimized:hidden', className)}
      {...props}
    />
  );
}

export interface TabBarActionProps extends Omit<ComponentProps<'button'>, 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

/** Separate glass circle 62 next to the bar, e.g. search. */
export function TabBarAction({ icon, className, ...props }: TabBarActionProps) {
  return (
    <button
      type="button"
      data-slot="tab-bar-action"
      className={cn(
        'kv-pressable grid size-15.5 shrink-0 place-items-center rounded-full text-fg-1 active:bg-fill-1 [&_svg]:size-6 [&_svg]:stroke-[1.5]',
        glass,
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
