import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent } from 'react';
import { cn } from '../lib/cn';

/**
 * One ring for the whole library — solid 2px `ring`, contrast ≥ 3:1 — and only its place changes.
 * Global `:focus-visible` already draws it outside; these put it where the element lives.
 */
export const focusRing = {
  /** Buttons, tags, checkboxes, links, icons: 2px gap, so it reads even on an accent button. */
  outside: 'focus-visible:outline-offset-2',
  /** Fields: the border itself becomes the ring, 1px border + 1px shadow, no gap to collide with labels. */
  flush: 'focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-[0_0_0_1px_var(--color-ring)]',
  /** Rows of tables and lists: 2px inside, so overflow: hidden and the neighbour rows never cut it. */
  inset: 'focus-visible:-outline-offset-2',
} as const;

const FOCUSABLE = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex], [contenteditable]:not([contenteditable=false])';
// Arrows edit text here, so they are not taken for moving between items.
const TYPING = 'textarea, select, [contenteditable]:not([contenteditable=false]), input:not([type=checkbox], [type=button], [type=submit], [type=reset])';

/** Elements that can take focus right now: enabled, not inert, not hidden. */
function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) =>
      !element.matches(':disabled') &&
      !element.closest('[inert], [hidden], [aria-hidden=true]') &&
      (typeof element.checkVisibility !== 'function' || element.checkVisibility()),
  );
}

export type FocusTrapProps = Omit<ComponentProps<'div'>, 'ref'>;

/**
 * Keeps Tab inside while mounted and gives focus back to the element that had it before. For layers of your own;
 * Dialog, Sheet, Popover and Menu already trap and return focus through Base UI.
 */
export function FocusTrap({ className, onKeyDown, ...props }: FocusTrapProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Read in the first render: an autoFocus child takes focus before any effect runs.
  const [opener] = useState(() => (typeof document === 'undefined' ? null : document.activeElement));

  useLayoutEffect(() => {
    const trap = ref.current;
    if (!trap) return undefined;
    if (!trap.contains(document.activeElement)) (focusables(trap).find((element) => element.tabIndex >= 0) ?? trap).focus();
    return () => {
      const current = document.activeElement;
      // Focus the user already moved elsewhere stays there.
      if ((current === null || current === document.body || trap.contains(current)) && opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [opener]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.key !== 'Tab' || event.defaultPrevented) return;
    const tabbable = focusables(event.currentTarget).filter((element) => element.tabIndex >= 0);
    const first = tabbable[0];
    const last = tabbable.at(-1);
    const current = document.activeElement;
    if (!first || !last) event.preventDefault();
    else if (event.shiftKey ? current === first || current === event.currentTarget : current === last) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };

  return <div ref={ref} data-slot="focus-trap" tabIndex={-1} onKeyDown={handleKeyDown} className={cn('outline-none', className)} {...props} />;
}

export interface FocusGroupProps extends Omit<ComponentProps<'div'>, 'ref'> {
  /** Arrows that move focus: ← → for a row of items, ↑ ↓ for a column. */
  orientation?: 'horizontal' | 'vertical';
  /** The arrow past the last item goes to the first, and back. */
  loop?: boolean;
}

const ARROWS = { horizontal: ['ArrowLeft', 'ArrowRight'], vertical: ['ArrowUp', 'ArrowDown'] } as const;

/** Items arrows can reach: disabled and aria-disabled ones are skipped. */
const groupItems = (group: HTMLElement) => focusables(group).filter((element) => element.getAttribute('aria-disabled') !== 'true');

/** Roving tabindex: the whole group is one Tab stop, on `preferred` while it can take focus, else on the first item. */
function rove(group: HTMLElement, preferred: HTMLElement | null): void {
  const items = groupItems(group);
  const stop = preferred && items.includes(preferred) ? preferred : items[0];
  for (const element of group.querySelectorAll<HTMLElement>(FOCUSABLE)) element.tabIndex = element === stop ? 0 : -1;
}

/**
 * Tab goes between groups, arrows inside one: a row of icon buttons, chips, cards. Menus, tabs, segments, radios
 * and toolbars already move by arrows through Base UI.
 */
export function FocusGroup({ orientation = 'horizontal', loop = true, onFocus, onKeyDown, ...props }: FocusGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const group = ref.current;
    if (!group) return undefined;
    rove(group, last.current);
    // Items that come and go, or get disabled, keep the group a single Tab stop.
    const observer = new MutationObserver(() => rove(group, last.current));
    observer.observe(group, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'hidden', 'inert'] });
    return () => observer.disconnect();
  }, []);

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    onFocus?.(event);
    const item = groupItems(event.currentTarget).find((element) => element === event.target);
    if (!item) return;
    last.current = item;
    rove(event.currentTarget, item);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !(event.target instanceof HTMLElement) || event.target.matches(TYPING)) return;
    const items = groupItems(event.currentTarget);
    const target = event.target;
    const index = items.findIndex((element) => element.contains(target));
    const [back, forward] = ARROWS[orientation];
    let next: HTMLElement | undefined;
    if (event.key === 'Home') next = items[0];
    else if (event.key === 'End') next = items.at(-1);
    else if (event.key === back || event.key === forward) {
      const step = index + (event.key === forward ? 1 : -1);
      next = loop ? items[(step + items.length) % items.length] : items[Math.min(Math.max(step, 0), items.length - 1)];
    }
    if (!next) return;
    event.preventDefault();
    next.focus();
  };

  return <div ref={ref} data-slot="focus-group" role="group" data-orientation={orientation} onFocus={handleFocus} onKeyDown={handleKeyDown} {...props} />;
}
