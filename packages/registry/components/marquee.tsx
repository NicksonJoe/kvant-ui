import { Children, useId, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface MarqueeProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Logos or quotes, one item each; draw them in currentColor, 24 high. */
  children: ReactNode;
  /** Line above the row, 14/20 fg-3, 24 above it; it also names the list. */
  caption?: ReactNode;
  /** Seconds per loop. */
  duration?: number;
  /** Step between items, px. */
  gap?: number;
  /** Width of the fade at each edge, px. */
  fade?: number;
  /** Name of the list when there is no caption: «Клиенты». */
  'aria-label'?: string;
}

/**
 * Endless row of logos: moves left at a constant speed, stops under the pointer and while focus is inside,
 * edges dissolve into whatever is behind. Reduced motion: a still row in the middle.
 */
export function Marquee({
  children,
  caption,
  duration = 40,
  gap = 64,
  fade = 160,
  'aria-label': label,
  className,
  style,
  ...props
}: MarqueeProps) {
  const captionId = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLUListElement>(null);
  // a copy must always be waiting off-screen: one row plus as many as it takes to cover the viewport
  const [copies, setCopies] = useState(2);

  useLayoutEffect(() => {
    const outer = viewport.current;
    const inner = row.current;
    if (!outer || !inner) return;
    const measure = () => {
      const width = inner.offsetWidth;
      if (width > 0) setCopies(Math.max(2, Math.ceil(outer.clientWidth / width) + 1));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  const items = Children.toArray(children).map((child, index) => (
    <li key={index} data-slot="marquee-item" className="flex h-6 shrink-0 items-center">
      {child}
    </li>
  ));
  const list = 'flex shrink-0 items-center gap-(--kv-marquee-gap) pr-(--kv-marquee-gap)';
  // at most a fifth per side: on a phone a 160 fade would eat the row
  const edge = `min(${fade}px, 20%)`;
  const mask = `linear-gradient(to right, transparent, #000 ${edge}, #000 calc(100% - ${edge}), transparent)`;

  return (
    <div
      data-slot="marquee"
      className={cn('flex w-full flex-col items-center gap-6 text-fg-3', className)}
      style={{ '--kv-marquee-gap': `${gap}px`, ...style } as CSSProperties}
      {...props}
    >
      {caption ? (
        <p id={captionId} data-slot="marquee-caption" className="text-center text-body-sm text-fg-3">
          {caption}
        </p>
      ) : null}
      <div
        ref={viewport}
        data-slot="marquee-viewport"
        // width never comes from the track: in a content-sized parent each copy would widen it and ask for another copy
        className="kv-marquee flex h-14 w-full items-center overflow-hidden [contain-intrinsic-inline-size:40rem] [contain:inline-size]"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        <div
          data-slot="marquee-track"
          className="flex w-max shrink-0"
          style={{ '--kv-marquee-duration': `${duration}s`, '--kv-marquee-copies': copies } as CSSProperties}
        >
          <ul
            ref={row}
            data-slot="marquee-list"
            aria-label={caption ? undefined : label}
            aria-labelledby={caption ? captionId : undefined}
            className={list}
          >
            {items}
          </ul>
          {Array.from({ length: copies - 1 }, (_, index) => (
            <ul key={index} data-slot="marquee-list" aria-hidden inert className={list}>
              {items}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
