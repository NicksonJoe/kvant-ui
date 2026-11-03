import { Button as BaseButton } from '@base-ui/react/button';
import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { cn } from '../lib/cn';
import { LAYERS } from './portal';

export type BackToTopVariant = 'icon' | 'label' | 'progress';
export type BackToTopPlacement = 'fixed' | 'absolute' | 'inline';

/** Same cut-off as the toasts: below it they move to the top and the button sits over the Fab. */
const PHONE = '(width < 640px)';
/** spacing-3: toasts stand this far above the button. */
const TOAST_GAP = 12;

interface ScrollMetrics {
  top: number;
  height: number;
  max: number;
  /** Bottom edge of the visible area in viewport coordinates. */
  bottom: number;
}

function measure(root: HTMLElement | null): ScrollMetrics {
  if (root) {
    return { top: root.scrollTop, height: root.clientHeight, max: root.scrollHeight - root.clientHeight, bottom: root.getBoundingClientRect().bottom };
  }
  const height = window.innerHeight;
  return { top: window.scrollY, height, max: document.documentElement.scrollHeight - height, bottom: height };
}

/** Ring length as a share of pathLength 100; at 0 the round cap would still leave a dot, so the arc goes. */
function drawArc(arc: SVGCircleElement | null, share: number): void {
  const value = Math.min(1, Math.max(0, share));
  arc?.setAttribute('stroke-dasharray', `${+(value * 100).toFixed(2)} 100`);
  arc?.setAttribute('stroke-opacity', value > 0 ? '1' : '0');
}

function prefersReducedMotion(): boolean {
  return document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Back to the start of the page (or of `root`) and focus on its first h1, so the next Tab starts from the top.
 * Smooth unless the user asked for reduced motion.
 */
export function scrollToTop(root?: HTMLElement | null): void {
  // shortcut: the browser's own smooth scroll (Chrome: about 0.7 s, the last 50 px in the last 0.2 s), not a 600 ms curve.
  (root ?? window).scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  const heading = (root ?? document).querySelector<HTMLElement>('h1');
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true, focusVisible: false });
}

// Floating shadow 0 8 20 −6; hover lifts it, press settles it. The progress ring is its own edge: no hairline.
const shadow = {
  ring:
    'shadow-[0_0_0_1px_var(--color-hairline),0_2px_4px_oklch(var(--ink)/0.08),0_8px_20px_-6px_oklch(var(--ink)/0.12)] ' +
    'hover:shadow-[0_0_0_1px_var(--color-hairline),0_2px_4px_oklch(var(--ink)/0.08),0_12px_24px_-6px_oklch(var(--ink)/0.16)] ' +
    'active:shadow-[0_0_0_1px_var(--color-hairline),0_1px_2px_oklch(var(--ink)/0.08)]',
  bare:
    'shadow-[0_2px_4px_oklch(var(--ink)/0.08),0_8px_20px_-6px_oklch(var(--ink)/0.12)] ' +
    'hover:shadow-[0_2px_4px_oklch(var(--ink)/0.08),0_12px_24px_-6px_oklch(var(--ink)/0.16)] ' +
    'active:shadow-[0_1px_2px_oklch(var(--ink)/0.08)]',
};

export interface BackToTopProps extends Omit<BaseButton.Props, 'className' | 'children' | 'render' | 'style'> {
  /** icon — circle 44 (default) · label — capsule h40 with «Наверх», for articles and help · progress — circle with a reading ring. */
  variant?: BackToTopVariant;
  /** Name of the button; written next to the arrow in the `label` variant. */
  label?: string;
  /** Leave it out to follow the scroll; false hides it (bulk action bar open), true shows it (demos). */
  visible?: boolean;
  /** Share read, 0–1, for the ring instead of the scroll position: the article without the comments below it. */
  progress?: number;
  /** Scroll container to follow and to scroll back; the window by default. */
  root?: RefObject<HTMLElement | null>;
  /** Site footer: once it comes into view the button rides 24 above its top edge. */
  footer?: RefObject<HTMLElement | null>;
  /** The screen has a Fab: on a phone the button stands above it, on its axis, 12 apart. */
  fab?: boolean;
  /**
   * fixed — the window's bottom right (default without `root`) · absolute — the same corner of the nearest positioned
   * block, for a scroller wrapped in `relative` (default with `root`) · inline — in the flow, no offsets.
   */
  placement?: BackToTopPlacement;
  /** Dock classes for layout; move the corner with `style` (`{ bottom: 96 }`), classes do not override the offsets. */
  className?: string;
  style?: CSSProperties;
}

/**
 * Floating «Наверх» for long pages: hidden for the first screen, shown deeper than two (and between them it keeps
 * whatever it was, so it does not blink). On a phone it shows only while the page is pulled back up. Fixed 24 from
 * the bottom right; the toasts stand above it while it is shown.
 */
export function BackToTop({
  variant = 'icon',
  label = 'Наверх',
  visible,
  progress,
  root,
  footer,
  fab = false,
  placement = root ? 'absolute' : 'fixed',
  className,
  style,
  onClick,
  ...props
}: BackToTopProps) {
  const dock = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const arc = useRef<SVGCircleElement>(null);
  const [deep, setDeep] = useState(false);
  const shown = visible ?? deep;

  useEffect(() => {
    const scroller = root?.current ?? null;
    const phone = window.matchMedia(PHONE);
    let last = measure(scroller).top;
    let past = false;
    let up = false;
    const update = () => {
      const metrics = measure(scroller);
      if (metrics.top > metrics.height * 2) past = true;
      else if (metrics.top < metrics.height) past = false;
      if (metrics.top !== last) up = metrics.top < last;
      last = metrics.top;
      setDeep(past && (!phone.matches || up));
      if (progress === undefined) {
        // Straight from the scroll position, no transition: the ring follows the finger.
        drawArc(arc.current, metrics.max > 0 ? metrics.top / metrics.max : 0);
      }
      const edge = footer?.current?.getBoundingClientRect().top;
      if (edge !== undefined) dock.current?.style.setProperty('--kv-lift', `${Math.max(0, metrics.bottom - edge)}px`);
    };
    update();
    const target = scroller ?? window;
    target.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      target.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [root, footer, progress]);

  useEffect(() => {
    if (progress !== undefined) drawArc(arc.current, progress);
  }, [progress]);

  // Toasts live in the window's bottom right corner; a button inside its own scroller does not move them.
  useEffect(() => {
    if (!shown || root) return undefined;
    const style = document.documentElement.style;
    style.setProperty('--kv-toast-lift', `${(button.current?.offsetHeight ?? 0) + TOAST_GAP}px`);
    return () => {
      style.removeProperty('--kv-toast-lift');
    };
  }, [shown, root]);

  const handleClick: NonNullable<BaseButton.Props['onClick']> = (event) => {
    onClick?.(event);
    if (!event.defaultPrevented) scrollToTop(root?.current);
  };

  const circle = variant !== 'label';
  return (
    <div
      ref={dock}
      data-slot="back-to-top"
      data-variant={variant}
      data-visible={shown || undefined}
      data-fab={fab || undefined}
      data-placement={placement}
      inert={!shown}
      style={{ zIndex: LAYERS.sticky, ...style }}
      className={cn(
        // The placement names are the position classes themselves.
        placement !== 'inline' &&
          cn(
            placement,
            'right-6 bottom-[calc(--spacing(6)+var(--kv-lift,0px))]',
            fab
              ? 'max-sm:bottom-[calc(--spacing(21)+env(safe-area-inset-bottom)+var(--kv-lift,0px))]'
              : 'max-sm:right-4 max-sm:bottom-[calc(--spacing(4)+env(safe-area-inset-bottom)+var(--kv-lift,0px))]',
          ),
        // In: opacity + 8 from below + scale .9 (2.5 × the enter shrink, so reduced motion drops it) in 200 ms; out in 150.
        'invisible translate-y-(--shift-md) scale-[calc(1-(1-var(--scale-enter))*2.5)] opacity-0',
        'transition-[opacity,translate,scale,visibility] duration-(--duration-quick) ease-out',
        'data-visible:visible data-visible:translate-y-0 data-visible:scale-100 data-visible:opacity-100 data-visible:duration-(--duration-base)',
        className,
      )}
    >
      <BaseButton
        ref={button}
        data-slot="back-to-top-button"
        aria-label={circle ? label : undefined}
        onClick={handleClick}
        className={cn(
          'group/btt kv-pressable relative flex select-none items-center justify-center rounded-full bg-overlay text-fg-1 hover:bg-surface-2 active:bg-surface-3',
          variant === 'progress' ? shadow.bare : shadow.ring,
          'dark:shadow-overlay dark:hover:shadow-overlay dark:active:shadow-overlay',
          circle
            ? 'size-11 max-sm:size-10 max-sm:after:absolute max-sm:after:-inset-0.5 [&>svg:first-child]:size-4.5'
            : 'h-10 gap-1.5 pr-4 pl-3.5 text-label-md font-medium whitespace-nowrap [&>svg]:size-4',
          variant === 'progress' && 'focus-visible:outline-offset-3',
        )}
        {...props}
      >
        <ArrowUp aria-hidden className="shrink-0 stroke-2" />
        {circle ? null : label}
        {variant === 'progress' ? (
          <svg aria-hidden viewBox="0 0 44 44" fill="none" className="pointer-events-none absolute inset-0 size-full">
            <circle cx="22" cy="22" r="20.75" strokeWidth="2.5" className="stroke-fill-3" />
            <circle
              ref={arc}
              data-slot="back-to-top-progress"
              cx="22"
              cy="22"
              r="20.75"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="0 100"
              strokeOpacity={0}
              transform="rotate(-90 22 22)"
              className="stroke-accent transition-[stroke] duration-(--duration-micro) ease-hover group-hover/btt:stroke-accent-hover group-active/btt:stroke-accent-pressed"
            />
          </svg>
        ) : null}
      </BaseButton>
    </div>
  );
}
