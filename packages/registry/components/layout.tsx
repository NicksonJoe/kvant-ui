import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { ComponentProps, CSSProperties } from 'react';
import { cn } from '../lib/cn';

// Typed apart from the calls: data-* keys are not part of the element props types.
type OwnDiv = ComponentProps<'div'> & { 'data-slot': string; 'data-size'?: string };
type OwnSection = ComponentProps<'section'> & { 'data-slot': string };

/** Steps of the spacing scale (× 4 px): 8–16 inside a group, 24 between groups, 32–48 between sections. */
export const STACK_GAPS = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24] as const;
export type StackGap = (typeof STACK_GAPS)[number];

const gaps: Record<StackGap, string> = {
  0: 'gap-0',
  0.5: 'gap-0.5',
  1: 'gap-1',
  1.5: 'gap-1.5',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
  16: 'gap-16',
  20: 'gap-20',
  24: 'gap-24',
};

export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between';

const aligns: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};
const justifies: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

export interface StackProps extends useRender.ComponentProps<'div'> {
  /** column — one under another (default) · row — side by side. */
  direction?: 'column' | 'row';
  /** Step of the spacing scale: 4 = 16 px. */
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  /** Row only: wrap onto the next line instead of squeezing. */
  wrap?: boolean;
}

/** One-dimensional layout: children one after another with a gap from the spacing scale. */
export function Stack({ direction = 'column', gap = 4, align, justify, wrap = false, render, className, ...props }: StackProps) {
  const own: OwnDiv = {
    'data-slot': 'stack',
    className: cn(
      'flex',
      direction === 'row' ? 'flex-row' : 'flex-col',
      gaps[gap],
      align && aligns[align],
      justify && justifies[justify],
      wrap && 'flex-wrap',
      className,
    ),
  };
  return useRender({ defaultTagName: 'div', render, props: mergeProps<'div'>(props, own) });
}

/** Columns in fractions (1fr): 4 on a phone, 8 from 768, 12 from 1024; gutter 16, from 768 — 24. */
export function Grid({ render, className, ...props }: useRender.ComponentProps<'div'>) {
  const own: OwnDiv = {
    'data-slot': 'grid',
    className: cn('grid grid-cols-4 gap-4 md:grid-cols-8 md:gap-6 lg:grid-cols-12', className),
  };
  return useRender({ defaultTagName: 'div', render, props: mergeProps<'div'>(props, own) });
}

export type GridBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';
/** Number of columns, or `full` for the whole row whatever the column count. */
export type GridSpanValue = number | 'full';
export type GridSpan = GridSpanValue | Partial<Record<GridBreakpoint, GridSpanValue>>;

const BREAKPOINTS: readonly GridBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl'];

export interface GridItemProps extends useRender.ComponentProps<'div'> {
  /**
   * Width in columns: `2`, or per breakpoint `{ base: 2, md: 4, lg: 7 }` — a step left out keeps the one below it.
   * Default: the whole row.
   */
  span?: GridSpan;
}

/** A cell of Grid. Its width is a number of columns, never pixels. */
export function GridItem({ span = 'full', render, className, style, ...props }: GridItemProps) {
  const steps = typeof span === 'object' ? span : { base: span };
  const columns: Record<string, string> = {};
  let value: GridSpanValue = 'full';
  for (const step of BREAKPOINTS) {
    value = steps[step] ?? value;
    columns[step === 'base' ? '--kv-col' : `--kv-col-${step}`] = value === 'full' ? '1 / -1' : `span ${value}`;
  }
  const own: OwnDiv = {
    'data-slot': 'grid-item',
    // Every step is written out, so each breakpoint class reads a value even where it repeats the one below.
    style: { ...columns, ...style } as CSSProperties,
    className: cn('col-(--kv-col) sm:col-(--kv-col-sm) md:col-(--kv-col-md) lg:col-(--kv-col-lg) xl:col-(--kv-col-xl)', className),
  };
  return useRender({ defaultTagName: 'div', render, props: mergeProps<'div'>(props, own) });
}

export type ContainerSize = 'prose' | 'md' | 'lg' | 'xl';

const containers: Record<ContainerSize, string> = {
  prose: 'max-w-(--container-prose)',
  md: 'max-w-(--container-md)',
  lg: 'max-w-(--container-lg)',
  xl: 'max-w-(--container-xl)',
};

export interface ContainerProps extends useRender.ComponentProps<'div'> {
  /** prose 680 — articles, long forms · md 960 — settings, wizards · lg 1200 — landing, reports (default) · xl 1440 — admin content. */
  size?: ContainerSize;
}

/**
 * Caps the width of the content, not of the page: centred, margins 16 → 24 from 640 → 32 from 1024 outside that
 * width and never inside the safe area. Wider than the cap only the margins grow.
 */
export function Container({ size = 'lg', render, className, ...props }: ContainerProps) {
  const own: OwnDiv = {
    'data-slot': 'container',
    'data-size': size,
    className: cn(
      'mx-auto box-content',
      containers[size],
      'pr-[max(--spacing(4),env(safe-area-inset-right))] pl-[max(--spacing(4),env(safe-area-inset-left))]',
      'sm:pr-[max(--spacing(6),env(safe-area-inset-right))] sm:pl-[max(--spacing(6),env(safe-area-inset-left))]',
      'lg:pr-[max(--spacing(8),env(safe-area-inset-right))] lg:pl-[max(--spacing(8),env(safe-area-inset-left))]',
      className,
    ),
  };
  return useRender({ defaultTagName: 'div', render, props: mergeProps<'div'>(props, own) });
}

export type SectionSpacing = 'page' | 'landing' | 'hero';

const spacings: Record<SectionSpacing, string> = { page: 'py-12', landing: 'py-20', hero: 'py-24' };

export interface SectionProps extends useRender.ComponentProps<'section'> {
  /** Padding above and below: page 48 · landing 80 · hero 96 — the first screen. */
  spacing?: SectionSpacing;
  /** Container for the content (default lg); false — the content takes the full width. */
  container?: ContainerSize | false;
}

/** A page band: its background runs edge to edge, the content keeps to the container. */
export function Section({ spacing = 'page', container = 'lg', render, className, children, ...props }: SectionProps) {
  const own: OwnSection = {
    'data-slot': 'section',
    className: cn(spacings[spacing], className),
    children: container === false ? children : <Container size={container}>{children}</Container>,
  };
  return useRender({ defaultTagName: 'section', render, props: mergeProps<'section'>(props, own) });
}
