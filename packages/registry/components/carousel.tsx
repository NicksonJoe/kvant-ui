import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Children, createContext, use, useEffect, useRef, useState, type CSSProperties, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { IconButton } from './button';

const SlideContext = createContext({ index: 0, total: 0 });

function prefersReducedMotion(): boolean {
  return document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Slide under the start edge and whether the strip can scroll further; the gap between slides is 16. */
function readPosition(el: HTMLElement) {
  const first = el.firstElementChild;
  const step = first instanceof HTMLElement ? first.offsetWidth + 16 : 0;
  const scrollable = el.scrollWidth > el.clientWidth;
  return {
    index: step > 0 ? Math.min(el.children.length - 1, Math.round(el.scrollLeft / step)) : 0,
    atStart: el.scrollLeft <= 1,
    // jsdom and unmeasured layouts report zero sizes: keep the arrows usable there
    atEnd: scrollable ? el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 : el.scrollWidth > 0,
  };
}

export interface CarouselProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** Names the carousel for screen readers, e.g. «Кейсы клиентов». */
  'aria-label': string;
  /** Heading above the slides; the arrows sit on its right. */
  title?: ReactNode;
  description?: ReactNode;
  /** Slide width, px; on narrow screens a 64px peek of the next slide is kept. */
  slideWidth?: number;
}

/**
 * Horizontal strip that snaps to slides. The next slide always peeks from the edge; arrows and ← → repeat the swipe,
 * dots only show the position. No autoplay.
 */
export function Carousel({ title, description, slideWidth = 400, className, children, ...props }: CarouselProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ index: 0, atStart: true, atEnd: false });
  const slides = Children.toArray(children);
  const total = slides.length;

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setPosition(readPosition(el)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const go = (index: number) => {
    const el = viewport.current;
    const slide = el?.children[Math.min(Math.max(0, index), total - 1)];
    if (!el || !(slide instanceof HTMLElement)) return;
    el.scrollTo({ left: slide.offsetLeft, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <section data-slot="carousel" aria-roledescription="карусель" className={cn('flex flex-col gap-4', className)} {...props}>
      <div className="flex items-end gap-4">
        {title || description ? (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {title ? <h2 className="text-heading-lg font-semibold text-fg-1">{title}</h2> : null}
            {description ? <p className="text-body-md text-fg-2">{description}</p> : null}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex shrink-0 gap-2">
          <IconButton variant="secondary" icon={<ChevronLeft />} aria-label="Предыдущий слайд" disabled={position.atStart} onClick={() => go(position.index - 1)} />
          <IconButton variant="secondary" icon={<ChevronRight />} aria-label="Следующий слайд" disabled={position.atEnd} onClick={() => go(position.index + 1)} />
        </div>
      </div>
      <div
        ref={viewport}
        tabIndex={0}
        aria-label="Слайды"
        onScroll={(event) => setPosition(readPosition(event.currentTarget))}
        style={{ '--kv-slide': `${slideWidth}px` } as CSSProperties}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          go(position.index + (event.key === 'ArrowRight' ? 1 : -1));
        }}
        className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain rounded-xl [scrollbar-width:none] focus-visible:outline-offset-4 [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <SlideContext key={index} value={{ index, total }}>
            {slide}
          </SlideContext>
        ))}
      </div>
      {total > 1 ? (
        <div aria-hidden className="flex justify-center gap-1.5">
          {slides.map((_, index) => (
            <span
              key={index}
              className={cn(
                'h-1.5 rounded-full transition-[width,background-color] duration-(--duration-slow) [transition-timing-function:var(--ease-spring-10)]',
                index === position.index ? 'w-4.5 bg-fg-1' : 'w-1.5 bg-fg-4',
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export type CarouselSlideProps = ComponentProps<'div'>;

/** Width from the carousel's `slideWidth` (a 64px peek stays on narrow screens); snaps to its start edge. */
export function CarouselSlide({ className, ...props }: CarouselSlideProps) {
  const { index, total } = use(SlideContext);
  return (
    <div
      data-slot="carousel-slide"
      role="group"
      aria-roledescription="слайд"
      aria-label={`${index + 1} из ${total}`}
      className={cn('w-[min(var(--kv-slide),calc(100%-64px))] shrink-0 snap-start', className)}
      {...props}
    />
  );
}
