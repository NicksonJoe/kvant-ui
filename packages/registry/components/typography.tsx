import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { ComponentProps, MouseEvent } from 'react';
import { cn } from '../lib/cn';

// Blocks are direct children (what Markdown renders); margins collapse, so a quote keeps 24 on both sides.
const prose = [
  'max-w-prose text-body-md/7 text-fg-1 hyphens-auto',
  '[&>*+*]:mt-4 [&>:first-child]:mt-0 [&>:is(h1,h2,h3)]:hyphens-manual [&_strong]:font-semibold',
  '[&>h1]:text-heading-xl [&>h1]:font-semibold [&>h1+*]:mt-3 [&>h1+p]:text-body-lg [&>h1+p]:text-fg-2',
  '[&>h2]:mt-10 [&>h2]:text-heading-md [&>h2]:font-semibold [&>h2+*]:mt-3',
  '[&>h3]:mt-8 [&>h3]:text-heading-xs [&>h3]:font-semibold [&>h3+*]:mt-2',
  '[&_li]:relative [&_li]:pl-6 [&_li+li]:mt-2',
  '[&>ul>li]:before:absolute [&>ul>li]:before:top-[11.5px] [&>ul>li]:before:left-1 [&>ul>li]:before:size-[5px] [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-fg-3',
  "[&>ol]:[counter-reset:kv-ol] [&>ol>li]:[counter-increment:kv-ol] [&>ol>li]:before:absolute [&>ol>li]:before:left-0 [&>ol>li]:before:content-[counter(kv-ol)_'.'] [&>ol>li]:before:font-medium [&>ol>li]:before:tabular-nums [&>ol>li]:before:text-fg-3",
  '[&>blockquote]:my-6 [&>blockquote]:border-l [&>blockquote]:border-fg-4 [&>blockquote]:pl-5 [&>blockquote]:text-body-lg',
  '[&_blockquote_footer]:mt-2 [&_blockquote_footer]:text-body-xs [&_blockquote_footer]:text-fg-3',
  '[&_:not(pre)>code]:inline-block [&_:not(pre)>code]:max-w-full [&_:not(pre)>code]:rounded-xs [&_:not(pre)>code]:bg-fill-2 [&_:not(pre)>code]:px-[5px] [&_:not(pre)>code]:py-px [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-body-sm',
  '[&_a]:text-accent-soft-fg [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-3 [&_a]:transition-colors [&_a]:duration-(--duration-micro) [&_a]:ease-hover [&_a]:hover:text-accent-hover',
  '[&_[data-footnote-ref]]:font-medium [&_[data-footnote-ref]]:no-underline',
  '[&>[data-footnotes]]:mt-6 [&>[data-footnotes]]:text-body-xs [&>[data-footnotes]]:text-fg-3 [&>[data-footnotes]]:before:mb-3 [&>[data-footnotes]]:before:block [&>[data-footnotes]]:before:h-px [&>[data-footnotes]]:before:w-12 [&>[data-footnotes]]:before:bg-border',
  '[&_[data-footnotes]_ol]:[counter-reset:kv-fn] [&_[data-footnotes]_li]:flex [&_[data-footnotes]_li]:gap-1.5 [&_[data-footnotes]_li]:pl-0 [&_[data-footnotes]_li]:[counter-increment:kv-fn] [&_[data-footnotes]_li]:before:content-[counter(kv-fn)] [&_[data-footnotes]_li]:before:font-medium [&_[data-footnotes]_li]:before:text-accent-soft-fg',
].join(' ');

/** In-article links (footnotes, contents): scroll to the target, give it focus and fade a fill-2 highlight. */
function jumpInside(event: MouseEvent<HTMLDivElement>) {
  const href = event.target instanceof Element ? event.target.closest('a')?.getAttribute('href') : null;
  if (event.defaultPrevented || !href?.startsWith('#')) return;
  const target = document.getElementById(decodeURIComponent(href.slice(1)));
  if (!target || !event.currentTarget.contains(target)) return;
  event.preventDefault();
  const reduced = document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // shortcut: the browser's smooth scroll, not exactly 250ms ease-standard; animate scrollTop if the timing must match.
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true, focusVisible: false });
  target.animate([{ backgroundColor: 'var(--color-fill-2)' }, { backgroundColor: 'transparent' }], { duration: 1500, easing: 'ease-out' });
}

/**
 * Long text — help articles, contracts, plan descriptions — from plain HTML or Markdown: a 680 column (about 70
 * characters), 16/28 text instead of the interface 16/24, rhythm between blocks, lists, quote, inline code, links and
 * footnotes. The first paragraph right after h1 is the lead. Hyphenation needs `lang` on the page.
 */
export function Prose({ render, className, ...props }: useRender.ComponentProps<'div'>) {
  // Typed apart from the call: data-* keys are not part of the div props type.
  const own: ComponentProps<'div'> & { 'data-slot': string } = { 'data-slot': 'prose', className: cn(prose, className), onClick: jumpInside };
  return useRender({ render, props: mergeProps<'div'>(own, props) });
}
