import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { useEffect, useRef, type ComponentProps, type MouseEvent } from 'react';
import { cn } from '../lib/cn';
import { LAYERS } from './portal';

/**
 * Text only a screen reader gets: the name of an icon button, a full sum behind «1,3 млн ₽». 1×1 px with clip,
 * never display: none or visibility: hidden — those hide it from the screen reader too.
 */
export function VisuallyHidden({ render, className, ...props }: useRender.ComponentProps<'span'>) {
  // Typed apart from the call: data-* keys are not part of the span props type.
  const own: ComponentProps<'span'> & { 'data-slot': string } = { 'data-slot': 'visually-hidden', className: cn('sr-only', className) };
  return useRender({ defaultTagName: 'span', render, props: mergeProps<'span'>(props, own) });
}

export interface SkipLinkProps extends ComponentProps<'a'> {
  /** Main content past the menu: `#main` (default) is `<main id="main">`. */
  href?: string;
}

/** First Tab on the page. Hidden until focused, then a 36 capsule 16 from the top left corner, above the sticky header. */
export function SkipLink({ href = '#main', children = 'Перейти к содержимому', className, style, onClick, ...props }: SkipLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    const target = href.startsWith('#') ? document.getElementById(decodeURIComponent(href.slice(1))) : null;
    if (event.defaultPrevented || !target) return;
    event.preventDefault();
    // A hash alone only scrolls: focus has to move, or the next Tab lands in the menu again.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ focusVisible: false });
  };
  return (
    <a
      data-slot="skip-link"
      href={href}
      onClick={handleClick}
      style={{ zIndex: LAYERS.dropdown, ...style }}
      className={cn(
        'not-focus:sr-only fixed top-4 left-4 inline-flex h-control-md items-center rounded-full bg-fg-1 px-4 text-label-md font-medium whitespace-nowrap text-surface-1',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

export type AnnouncePoliteness = 'polite' | 'assertive';

export interface AnnounceProps extends Omit<ComponentProps<'div'>, 'children' | 'role'> {
  /** polite waits for a pause (role="status"); assertive interrupts at once (role="alert") — only for errors that lose data. */
  politeness?: AnnouncePoliteness;
  /** What happened: «Загружено 20 клиентов». A change is read out; an empty string clears the region. */
  children?: string;
}

/** The same text is not read again sooner than this. */
const REPEAT_MS = 2000;

/**
 * Live region for what happened without moving focus. It is in the DOM from the start, empty, and only its text
 * changes; the same text within 2 s is skipped, so autosave and paging do not chatter.
 */
export function Announce({ politeness = 'polite', children = '', className, ...props }: AnnounceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const said = useRef(new Map<string, number>());

  useEffect(() => {
    const region = ref.current;
    if (!region) return undefined;
    const write = () => {
      const now = Date.now();
      if (children !== '') {
        if (now - (said.current.get(children) ?? -Infinity) < REPEAT_MS) return;
        said.current.set(children, now);
      }
      region.textContent = children;
    };
    if (mounted.current) {
      write();
      return undefined;
    }
    mounted.current = true;
    if (children === '') return undefined;
    // Screen readers watch a region only once it is in the tree: text that came with it waits a beat.
    const timer = setTimeout(write, 100);
    return () => clearTimeout(timer);
  }, [children]);

  return (
    <div
      ref={ref}
      data-slot="announce"
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      className={cn('sr-only', className)}
      {...props}
    />
  );
}
