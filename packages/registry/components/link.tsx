import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { ArrowUpRight } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export interface LinkProps extends useRender.ComponentProps<'a'> {
  /** standalone — underlined on hover; inline — always underlined, so colour is not the only cue inside prose. */
  variant?: 'standalone' | 'inline';
  /** Opens in a new tab: adds the arrow, rel and a hidden «откроется в новой вкладке». */
  external?: boolean;
  /** Waiting state (a resend countdown): plain fg-3 text without href, out of the Tab order. */
  disabled?: boolean;
}

/** Navigation in text or on its own line. No padding, the size comes from the text around it. Router: `render={<RouterLink to="…" />}`. */
export function Link({ variant = 'standalone', external = false, disabled = false, render, className, children, ...props }: LinkProps) {
  // Typed apart from the call: data-* keys are not part of the anchor props type.
  const own: ComponentProps<'a'> & { 'data-slot': string } = {
    'data-slot': 'link',
    className: cn(
      'group/link rounded-full font-medium text-accent-soft-fg decoration-1 underline-offset-3 transition-colors duration-(--duration-micro) ease-hover active:text-accent-pressed',
      variant === 'inline' ? 'underline' : 'hover:underline',
      disabled && 'pointer-events-none text-fg-3 no-underline tabular-nums',
      className,
    ),
    children: (
      <>
        {children}
        {external ? (
          <>
            <ArrowUpRight
              aria-hidden
              className="ml-0.5 inline size-[0.85em] align-[-0.1em] stroke-2 opacity-60 transition-opacity duration-(--duration-micro) group-hover/link:opacity-100"
            />
            <span className="sr-only"> (откроется в новой вкладке)</span>
          </>
        ) : null}
      </>
    ),
  };
  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      props,
      external ? { target: '_blank', rel: 'noopener noreferrer' } : {},
      // After props, so a disabled link never keeps an href.
      disabled ? { href: undefined, 'aria-disabled': true } : {},
      own,
    ),
  });
}
