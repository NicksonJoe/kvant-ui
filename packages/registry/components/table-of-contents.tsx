import { Popover } from '@base-ui/react/popover';
import { ArrowUp, ChevronDown, List } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type MouseEvent, type RefObject } from 'react';
import { cn } from '../lib/cn';
import { positioner } from '../lib/recipes';
import { scrollToTop } from './back-to-top';

export interface TableOfContentsItem {
  /** id of the heading on the page: the link is `#id`. */
  id: string;
  label: string;
  /** 2 — section (default), 3 — its subsection, indented 28 from the line. */
  level?: 2 | 3;
}

type ItemState = 'read' | 'active' | 'ahead';

export interface TableOfContentsProps extends Omit<ComponentProps<'nav'>, 'children' | 'title'> {
  items: readonly TableOfContentsItem[];
  /** Caption above the list; it also names the navigation landmark. */
  title?: string;
  /** Distance from the top of the screen where a section becomes current, and where a click brings it: the sticky header plus a gap. */
  offset?: number;
  /** Scroll container to follow and to scroll; the window by default. */
  root?: RefObject<HTMLElement | null>;
  /** «Наверх» under the list. */
  backToTop?: boolean;
}

function prefersReducedMotion(): boolean {
  return document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const stateOf = (index: number, active: number): ItemState => (index < active ? 'read' : index === active ? 'active' : 'ahead');

/**
 * Page contents that follows the scroll: the current section has a dot on the line, the ones read are fg-2, the ones
 * ahead fg-3. From 1024 a 240 column stuck 88 from the top next to the article; narrower, a capsule «Раздел 3 из 5»
 * that opens the same list.
 */
export function TableOfContents({
  items,
  title = 'На этой странице',
  offset = 88,
  root,
  backToTop = true,
  className,
  style,
  ...props
}: TableOfContentsProps) {
  const titleId = useId();
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const scroller = root?.current ?? null;
    const update = () => {
      const top = scroller ? scroller.scrollTop : window.scrollY;
      const max = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      // The last sections may be too short to reach the line: at the very bottom the last one is current.
      if (max > 0 && top >= max - 1) {
        setActive(items.length - 1);
        return;
      }
      const edge = (scroller ? scroller.getBoundingClientRect().top : 0) + offset + 1;
      let current = 0;
      items.forEach((item, index) => {
        const heading = document.getElementById(item.id);
        if (heading && heading.getBoundingClientRect().top <= edge) current = index;
      });
      setActive(current);
    };
    update();
    const target = scroller ?? window;
    target.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      target.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [items, offset, root]);

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const heading = document.getElementById(id);
    if (event.defaultPrevented || !heading) return;
    event.preventDefault();
    setOpen(false);
    const scroller = root?.current ?? null;
    const base = scroller ? scroller.scrollTop - scroller.getBoundingClientRect().top : window.scrollY;
    // shortcut: the browser's smooth scroll, not a tuned curve.
    (scroller ?? window).scrollTo({ top: base + heading.getBoundingClientRect().top - offset, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    // Focus follows, so the next Tab continues from the section and not from the contents.
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true, focusVisible: false });
  };

  const sections = items.filter((item) => item.level !== 3);
  // Number of the top-level section the current item belongs to.
  const section = Math.max(1, items.slice(0, active + 1).filter((item) => item.level !== 3).length);
  const current = items[active];

  return (
    <nav
      data-slot="table-of-contents"
      aria-labelledby={titleId}
      style={{ top: offset, ...style }}
      className={cn('lg:sticky lg:w-60 lg:shrink-0', className)}
      {...props}
    >
      <div className="flex flex-col gap-2.5 pt-1 max-lg:hidden">
        <p id={titleId} className="pl-4 text-caption font-medium text-fg-3">
          {title}
        </p>
        <TocList items={items} active={active} onJump={jump} />
        {backToTop ? (
          <button
            type="button"
            onClick={() => scrollToTop(root?.current)}
            className="mt-3 ml-4 inline-flex items-center gap-1.5 self-start rounded-xs text-label-sm font-medium text-fg-3 transition-colors duration-(--duration-quick) ease-hover hover:text-fg-1 focus-visible:outline-offset-1 [&_svg]:size-3.5"
          >
            <ArrowUp aria-hidden className="stroke-2" />
            Наверх
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger
            data-slot="table-of-contents-capsule"
            className="kv-pressable group/capsule flex h-10 w-full min-w-0 items-center gap-2 rounded-full bg-surface-1 pr-3 pl-4 text-left text-body-sm text-fg-3 shadow-control [--kv-press-scale:var(--scale-press-wide)] [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]"
          >
            <List aria-hidden className="text-fg-2" />
            <span className="min-w-0 flex-1 truncate">
              Раздел {section} из {sections.length} · <span className="font-medium text-fg-1">{current?.label}</span>
            </span>
            <ChevronDown aria-hidden className="transition-[rotate] duration-(--duration-base) ease-standard group-data-popup-open/capsule:rotate-180" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start" sideOffset={8} className={positioner}>
              {/* As wide as the capsule; the same list, the ring around the dot in the popover colour. */}
              <Popover.Popup
                data-slot="table-of-contents-popup"
                aria-label={title}
                className="kv-popup w-(--anchor-width) max-w-(--available-width) rounded-xl bg-overlay py-3 pr-4 pl-2 shadow-overlay outline-none"
              >
                <TocList items={items} active={active} onJump={jump} popup />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        <div data-slot="table-of-contents-progress" aria-hidden className="flex gap-1 px-4">
          {sections.map((item, index) => {
            const state = stateOf(index, section - 1);
            return (
              <span
                key={item.id}
                data-state={state}
                className={cn('h-0.5 flex-1 rounded-full', state === 'read' ? 'bg-fg-4' : state === 'active' ? 'bg-accent' : 'bg-fill-3')}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}

interface TocListProps {
  items: readonly TableOfContentsItem[];
  active: number;
  onJump: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
  /** In the popover the ring around the dot takes the popover colour. */
  popup?: boolean;
}

function TocList({ items, active, onJump, popup = false }: TocListProps) {
  const list = useRef<HTMLUListElement>(null);
  // First placement without motion, so a page opened deep down does not slide the dot from the top.
  const [dot, setDot] = useState<{ y: number; moved: boolean } | null>(null);

  useLayoutEffect(() => {
    // Centre of the current label: rows are 26 at the side and 44 under a finger in the popover.
    const link = list.current?.children[active]?.querySelector('a');
    if (link) setDot((last) => ({ y: link.offsetTop + link.offsetHeight / 2 - 3.5, moved: last !== null }));
  }, [active, items]);

  return (
    <div className="relative">
      <ul ref={list} className="flex flex-col">
        {items.map((item, index) => {
          const state = stateOf(index, active);
          return (
            <li key={item.id} data-level={item.level ?? 2} className={cn('py-1', item.level === 3 ? 'pl-7' : 'pl-4', popup && 'pointer-coarse:py-[13px]')}>
              <a
                href={`#${item.id}`}
                data-state={state}
                aria-current={state === 'active' ? 'true' : undefined}
                onClick={(event) => onJump(event, item.id)}
                className={cn(
                  '-mx-1 inline-block rounded-xs px-1 text-body-xs transition-colors duration-(--duration-quick) ease-hover hover:text-fg-1 focus-visible:text-fg-1 focus-visible:outline-offset-1',
                  state === 'read' ? 'text-fg-2' : state === 'active' ? 'font-medium text-fg-1' : 'text-fg-3',
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-px bg-separator" />
      {/* Ring 2 in the page colour cuts the line around the dot; it rides the line with spring smooth. */}
      <span
        aria-hidden
        data-slot="table-of-contents-dot"
        style={{ translate: `0 ${dot?.y ?? 0}px` }}
        className={cn(
          'pointer-events-none absolute top-0 -left-[3px] size-[7px] rounded-full bg-accent',
          popup ? 'shadow-[0_0_0_2px_var(--color-overlay)]' : 'shadow-[0_0_0_2px_var(--color-background)]',
          dot === null && 'opacity-0',
          dot?.moved && '[transition:translate_var(--spring-smooth)]',
        )}
      />
    </div>
  );
}
