import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import type { Ref } from 'react';
import { cn } from '../lib/cn';

// The fade grows with the distance to the edge (Base UI exposes it) and is absent where content ends.
const fades = {
  vertical:
    '[mask-image:linear-gradient(to_bottom,transparent_0,#000_min(24px,var(--scroll-area-overflow-y-start,0px)),#000_calc(100%_-_min(32px,var(--scroll-area-overflow-y-end,32px))),transparent_100%)]',
  horizontal:
    '[mask-image:linear-gradient(to_right,transparent_0,#000_min(24px,var(--scroll-area-overflow-x-start,0px)),#000_calc(100%_-_min(32px,var(--scroll-area-overflow-x-end,32px))),transparent_100%)]',
} as const;

export interface ScrollAreaProps extends Omit<BaseScrollArea.Root.Props, 'className'> {
  /** Direction of scrolling; `both` shows two scrollbars and no fades. */
  orientation?: 'vertical' | 'horizontal' | 'both';
  /** Fade the edges where content continues: 24 at the start, 32 at the end. */
  fade?: boolean;
  /** Root class: give it a height (or width). */
  className?: string;
  /** The element that scrolls, for virtual lists and scroll restoration. */
  viewportRef?: Ref<HTMLDivElement>;
}

function Scrollbar({ orientation }: { orientation: 'vertical' | 'horizontal' }) {
  return (
    <BaseScrollArea.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'group/bar flex rounded-full p-0.5 opacity-0 [transition:opacity_300ms_var(--ease-out)_1000ms,background-color_var(--duration-fast)_var(--ease-hover)]',
        'data-hovering:opacity-100 data-hovering:[transition-delay:0ms] data-scrolling:opacity-100 data-scrolling:[transition-delay:0ms] data-scrolling:[transition-duration:var(--duration-quick)] hover:bg-fill-2',
        orientation === 'vertical' ? 'm-[3px] w-2.5 justify-center' : 'm-[3px] h-2.5 flex-col justify-center',
      )}
    >
      <BaseScrollArea.Thumb
        className={cn(
          'rounded-full bg-[color-mix(in_oklab,var(--color-fg-4)_60%,transparent)] transition-[width,height,background-color] duration-(--duration-fast) ease-hover',
          'group-hover/bar:bg-fg-4 active:bg-fg-3',
          orientation === 'vertical' ? 'w-1 group-hover/bar:w-1.5 active:w-1.5' : 'h-1 group-hover/bar:h-1.5 active:h-1.5',
        )}
      />
    </BaseScrollArea.Scrollbar>
  );
}

/** One scrolling style everywhere: a thin bar that shows while scrolling and fades that hint at more content. */
export function ScrollArea({ orientation = 'vertical', fade = true, className, viewportRef, children, ...props }: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root data-slot="scroll-area" className={cn('relative flex min-h-0 min-w-0 overflow-hidden', className)} {...props}>
      <BaseScrollArea.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className={cn('size-full overscroll-contain rounded-[inherit]', fade && orientation !== 'both' && fades[orientation])}
      >
        {children}
      </BaseScrollArea.Viewport>
      {orientation !== 'horizontal' ? <Scrollbar orientation="vertical" /> : null}
      {orientation !== 'vertical' ? <Scrollbar orientation="horizontal" /> : null}
    </BaseScrollArea.Root>
  );
}
