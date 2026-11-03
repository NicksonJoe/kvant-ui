import { createContext, memo, use, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { cn } from '../lib/cn';
import { ScrollArea } from './scroll-area';

const HEADER_HEIGHT = 32;
const OVERSCAN = 6;
const OVERSCAN_AHEAD = 10;
/** Screens per second that count as a fling and bring up the position. */
const FAST_SCREENS = 3;
const POSITION_HOLD = 800;
const LOADING_ROWS = 12;
/** Scrolling counts as stopped after this pause; it also restarts the fling measure. */
const IDLE = 150;
const NO_SIZES: ReadonlyMap<number, number> = new Map();
const numbers = new Intl.NumberFormat('ru-RU');

/** True while the list scrolls: rows that come in then show their placeholder at once. */
const ScrollingContext = createContext(false);

/** Last item whose top is above y; `starts[i]` is the top of item i. */
function itemAbove(starts: Float64Array, count: number, y: number): number {
  let low = 0;
  let high = count - 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if ((starts[middle] ?? 0) < y) low = middle;
    else high = middle - 1;
  }
  return low;
}

interface VirtualRowProps {
  index: number;
  row: number;
  top: number;
  /** Fixed height; measured rows take their own. */
  height: number | undefined;
  count: number;
  renderRow: (index: number) => ReactNode;
  placeholder: ReactNode;
}

// Memoized: when the window moves, only the rows coming in are drawn; the ones already on screen keep their render.
const VirtualRow = memo(function VirtualRow({ index, row, top, height, count, renderRow, placeholder }: VirtualRowProps) {
  const content = renderRow(row);
  return (
    <div
      data-index={index}
      data-slot="virtual-list-row"
      role="listitem"
      aria-setsize={count}
      aria-posinset={row + 1}
      aria-busy={content == null ? true : undefined}
      tabIndex={-1}
      className="absolute inset-x-0 top-0 focus-visible:-outline-offset-2"
      style={{ transform: `translateY(${top}px)`, height }}
    >
      {content ?? <Placeholder>{placeholder}</Placeholder>}
    </div>
  );
});

export interface VirtualListGroup {
  /** Letter or name in the header: «К». */
  title: string;
  /** Second part of the header in fg-3: «86 клиентов». */
  description?: string;
  /** Rows in the group; the groups follow each other and add up to `count`. */
  count: number;
}

export interface VirtualListProps {
  /** Name of the list for the screen reader: «Клиенты». */
  'aria-label': string;
  /** Rows in the whole list, loaded or not (aria-setsize). */
  count: number;
  /** Row by its index in the whole list; `null` while its data has not come, then the placeholder stands in. */
  renderRow: (index: number) => ReactNode;
  /** Row height; with `measureRows` it is the estimate before the first paint. */
  rowHeight?: number;
  /** Rows of different heights (messages, cards): each row is measured once it shows. */
  measureRows?: boolean;
  /** Groups with a 32 header; the header of the current group sticks to the top. */
  groups?: readonly VirtualListGroup[];
  /** First and last row in the DOM (window plus overscan), to load the pages around them. */
  onRangeChange?: (start: number, end: number) => void;
  /** Placeholder of a row without data (default: avatar and two lines). */
  placeholder?: ReactNode;
  /** First load: a skeleton for the height of the window. */
  loading?: boolean;
  /** Shown instead of the list when `count` is 0. */
  empty?: ReactNode;
  /** After the last row: «Это все 1 284 клиента», an error with «Повторить». */
  footer?: ReactNode;
  /** Root class: give the list a height. */
  className?: string;
}

function Placeholder({ children }: { children?: ReactNode }) {
  // decided once, when the placeholder appears: a later change would restart the animation and blink it
  const [delayed] = useState(!use(ScrollingContext));
  return (
    <div
      data-slot="virtual-list-placeholder"
      data-delayed={delayed ? '' : undefined}
      aria-hidden
      // at rest a row whose data comes within 100ms never flashes a placeholder; a row that scrolls in shows it at once
      className={cn('flex h-full items-center gap-3 px-5', delayed && '[animation:kv-skeleton-delay_1ms_100ms_backwards]')}
    >
      {children ?? (
        <>
          <span className="size-8 shrink-0 rounded-full bg-fill-2" />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="h-2.5 w-44 max-w-full rounded-full bg-fill-2" />
            <span className="h-2 w-28 max-w-full rounded-full bg-fill-1" />
          </span>
          <span className="h-2.5 w-20 shrink-0 rounded-full bg-fill-2" />
        </>
      )}
    </div>
  );
}

function GroupHeader({ group, sticky = false }: { group: VirtualListGroup; sticky?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-8 items-center gap-3 px-5',
        sticky ? 'bg-glass-strong shadow-[0_4px_8px_rgb(0_0_0/0.06)] backdrop-blur-[20px] backdrop-saturate-[1.8]' : 'bg-surface-2',
      )}
    >
      <span className="w-5 text-label-md font-semibold text-fg-1">{group.title}</span>
      {group.description ? <span className="text-caption text-fg-3">{group.description}</span> : null}
    </div>
  );
}

/**
 * Long list that keeps only the visible rows plus overscan in the DOM; the rest is empty height,
 * so the scrollbar stays honest. Headers of groups stick, rows without data show placeholders of the same height.
 */
export function VirtualList({
  'aria-label': label,
  count,
  renderRow,
  rowHeight = 56,
  measureRows = false,
  groups,
  onRangeChange,
  placeholder,
  loading = false,
  empty,
  footer,
  className,
}: VirtualListProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [offset, setOffset] = useState(0);
  const [height, setHeight] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward' | null>(null);
  const [fast, setFast] = useState(false);
  // index (in the flat layout) of the row that holds focus: it stays in the DOM wherever the list scrolls
  const [focused, setFocused] = useState<number | null>(null);
  const [focusTarget, setFocusTarget] = useState<number | null>(null);

  // Flat layout with headers: a row is its index ≥ 0, the header of group g is -(g + 1).
  const layout = useMemo(() => {
    if (!groups) return null;
    const items: number[] = [];
    const groupOf: number[] = [];
    let row = 0;
    groups.forEach((group, at) => {
      items.push(-(at + 1));
      groupOf.push(at);
      for (let i = 0; i < group.count; i++) {
        items.push(row++);
        groupOf.push(at);
      }
    });
    return { items, groupOf };
  }, [groups]);
  const itemAt = (flat: number) => (layout ? (layout.items[flat] ?? 0) : flat);
  const flatCount = layout ? layout.items.length : count;

  // Measured heights by flat index; they belong to one layout and are dropped when it changes.
  const [measured, setMeasured] = useState({ layout, flatCount, sizes: NO_SIZES });
  const sizes = measured.layout === layout && measured.flatCount === flatCount ? measured.sizes : NO_SIZES;

  // starts[i] — top of item i, starts[flatCount] — the whole height
  const starts = useMemo(() => {
    const result = new Float64Array(flatCount + 1);
    for (let i = 0; i < flatCount; i++) {
      const header = (layout ? (layout.items[i] ?? 0) : i) < 0;
      result[i + 1] = (result[i] ?? 0) + (sizes.get(i) ?? (header ? HEADER_HEIGHT : rowHeight));
    }
    return result;
  }, [flatCount, layout, rowHeight, sizes]);
  const total = starts[flatCount] ?? 0;
  // what the scroll handler compares against: it renders only when the visible rows or the direction change
  const geometry = useRef({ starts, flatCount, offset, direction });
  useLayoutEffect(() => {
    geometry.current = { starts, flatCount, offset, direction };
  });

  const hasList = !(loading || (count === 0 && empty));
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element || !hasList) return;
    setHeight(element.clientHeight);
    setOffset(element.scrollTop);
    let last = element.scrollTop;
    let anchor = { offset: last, time: performance.now() };
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const top = element.scrollTop;
      const now = performance.now();
      const current = geometry.current;
      const next = top === last ? current.direction : top > last ? 'forward' : 'backward';
      last = top;
      const screen = element.clientHeight;
      const edges = (y: number) =>
        current.flatCount ? `${itemAbove(current.starts, current.flatCount, y + 1)}:${itemAbove(current.starts, current.flatCount, y + screen)}` : '';
      if (next !== current.direction || edges(top) !== edges(current.offset)) {
        // the new window must be in the DOM before this frame paints, or a fling shows empty height
        flushSync(() => {
          setDirection(next);
          setOffset(top);
        });
      }
      const distance = Math.abs(top - anchor.offset);
      const elapsed = now - anchor.time;
      // a wheel tick is far shorter than a screen; a fling covers more than one at 3 screens a second
      if (screen > 0 && distance > screen && (distance / screen / Math.max(elapsed, 1)) * 1000 > FAST_SCREENS) {
        setFast(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setFast(false), POSITION_HOLD);
      }
      if (elapsed > 250) anchor = { offset: top, time: now };
      clearTimeout(idle);
      idle = setTimeout(() => {
        setDirection(null);
        setOffset(element.scrollTop);
        anchor = { offset: element.scrollTop, time: performance.now() };
      }, IDLE);
    };
    const resize = new ResizeObserver(() => setHeight(element.clientHeight));
    element.addEventListener('scroll', onScroll, { passive: true });
    resize.observe(element);
    return () => {
      element.removeEventListener('scroll', onScroll);
      resize.disconnect();
      clearTimeout(idle);
    };
  }, [hasList]);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // Rows of different heights: a ResizeObserver reports each row when it mounts and whenever it resizes.
  const measure = useEffectEvent(() => {
    const element = list.current;
    if (!measureRows || !element) return;
    const changes: [number, number][] = [];
    let shift = 0;
    const top = viewport.current?.scrollTop ?? 0;
    for (const row of element.querySelectorAll<HTMLElement>('[data-slot=virtual-list-row]')) {
      const index = Number(row.dataset.index);
      const size = row.offsetHeight;
      const known = sizes.get(index) ?? rowHeight;
      if (size === 0 || size === known) continue;
      changes.push([index, size]);
      // a row above the window changed: move the scroll by the same amount so the visible rows stay put
      if ((starts[index] ?? 0) < top) shift += size - known;
    }
    if (!changes.length) return;
    if (shift && viewport.current) viewport.current.scrollTop += shift;
    setMeasured((current) => {
      const next = new Map(current.layout === layout && current.flatCount === flatCount ? current.sizes : NO_SIZES);
      for (const [index, size] of changes) next.set(index, size);
      return { layout, flatCount, sizes: next };
    });
  });
  const rowObserver = useRef<ResizeObserver>(null);
  useEffect(() => {
    if (!measureRows) return;
    const observer = new ResizeObserver(() => measure());
    rowObserver.current = observer;
    return () => {
      observer.disconnect();
      rowObserver.current = null;
    };
  }, [measureRows]);
  useLayoutEffect(() => {
    const observer = rowObserver.current;
    if (!observer || !list.current) return;
    const rows = list.current.querySelectorAll<HTMLElement>('[data-slot=virtual-list-row]');
    rows.forEach((row) => observer.observe(row));
    return () => rows.forEach((row) => observer.unobserve(row));
  });

  const ready = flatCount > 0 && height > 0;
  const firstVisible = ready ? itemAbove(starts, flatCount, offset + 1) : -1;
  const lastVisible = ready ? itemAbove(starts, flatCount, offset + height) : -1;
  const indexes: number[] = [];
  // more rows ahead of the scroll than behind it
  const start = ready ? Math.max(firstVisible - (direction === 'backward' ? OVERSCAN_AHEAD : OVERSCAN), 0) : 0;
  const end = ready ? Math.min(lastVisible + (direction === 'forward' ? OVERSCAN_AHEAD : OVERSCAN), flatCount - 1) : -1;
  if (ready) {
    if (focused !== null && focused < start) indexes.push(focused);
    for (let i = start; i <= end; i++) indexes.push(i);
    if (focused !== null && focused > end && focused < flatCount) indexes.push(focused);
  }
  const visibleRows: number[] = [];
  for (let i = firstVisible; ready && i <= lastVisible; i++) if (itemAt(i) >= 0) visibleRows.push(itemAt(i));
  const rendered = indexes.map(itemAt).filter((row) => row >= 0);
  const firstRendered = rendered.length ? Math.min(...rendered) : null;
  const lastRendered = rendered.length ? Math.max(...rendered) : null;
  const group = groups && layout ? groups[firstVisible >= 0 ? (layout.groupOf[firstVisible] ?? 0) : 0] : undefined;

  const reportRange = useEffectEvent((start: number, end: number) => onRangeChange?.(start, end));
  useEffect(() => {
    if (firstRendered !== null && lastRendered !== null) reportRange(firstRendered, lastRendered);
  }, [firstRendered, lastRendered]);

  // Home / End land on a row; focus moves to it once it is in the DOM (with or without its data).
  useEffect(() => {
    if (focusTarget === null) return;
    const row = list.current?.querySelector<HTMLElement>(`[data-index="${focusTarget}"]`);
    if (!row) return;
    row.focus({ preventScroll: true });
    setFocusTarget(null);
  }, [focusTarget]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Home' && event.key !== 'End') return;
    if ((event.target as HTMLElement).closest('input, textarea, [contenteditable="true"]')) return;
    const element = viewport.current;
    if (!element || !flatCount) return;
    event.preventDefault();
    const home = event.key === 'Home';
    const target = home ? (layout ? 1 : 0) : flatCount - 1;
    // End goes to the very bottom, so the footer shows too
    element.scrollTo({ top: home ? 0 : element.scrollHeight });
    setFocused(target);
    setFocusTarget(target);
  };
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-index]');
    if (row) setFocused(Number(row.dataset.index));
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
  };

  if (!loading && count === 0 && empty) {
    return (
      <div data-slot="virtual-list" data-empty="" className={cn('flex flex-col items-center justify-center p-6 text-center', className)}>
        {empty}
      </div>
    );
  }

  return (
    <div data-slot="virtual-list" className={cn('relative flex min-h-0 flex-col', className)}>
      <ScrollArea viewportRef={viewport} fade={false} className="size-full" onKeyDown={onKeyDown}>
        {loading ? (
          <div role="list" aria-label={label} aria-busy="true" className="flex flex-col">
            {Array.from({ length: LOADING_ROWS }, (_, at) => (
              <div key={at} style={{ height: rowHeight }}>
                <Placeholder>{placeholder}</Placeholder>
              </div>
            ))}
          </div>
        ) : (
          <>
            {group ? (
              // zero-height dock: the current header rides the top while its own copy scrolls under it
              <div data-slot="virtual-list-sticky" aria-hidden="true" className="pointer-events-none sticky top-0 z-10 h-0">
                <GroupHeader group={group} sticky />
              </div>
            ) : null}
            <ScrollingContext value={direction !== null}>
              <div
                ref={list}
                role="list"
                aria-label={label}
                className="relative w-full"
                style={{ height: total }}
                onFocus={onFocus}
                onBlur={onBlur}
              >
                {/* The browser scrolls ahead of the page's script: until the new rows are drawn, the empty height
                    above and below them shows skeleton rows of the row height instead of white. */}
                <div
                  data-slot="virtual-list-filler"
                  aria-hidden="true"
                  className="kv-virtual-filler absolute inset-x-0"
                  style={{ top: 0, height: starts[start] ?? 0, '--kv-row': `${rowHeight}px` } as CSSProperties}
                />
                <div
                  data-slot="virtual-list-filler"
                  aria-hidden="true"
                  className="kv-virtual-filler absolute inset-x-0"
                  style={{ top: starts[end + 1] ?? 0, height: total - (starts[end + 1] ?? 0), '--kv-row': `${rowHeight}px` } as CSSProperties}
                />
                {indexes.map((index) => {
                  const row = itemAt(index);
                  const style = { transform: `translateY(${starts[index] ?? 0}px)` };
                  if (row < 0) {
                    const header = groups?.[-row - 1];
                    return header ? (
                      <div key={index} data-index={index} data-slot="virtual-list-group" className="absolute inset-x-0 top-0" style={style}>
                        <GroupHeader group={header} />
                      </div>
                    ) : null;
                  }
                  return (
                    <VirtualRow
                      key={index}
                      index={index}
                      row={row}
                      top={starts[index] ?? 0}
                      height={measureRows ? undefined : rowHeight}
                      count={count}
                      renderRow={renderRow}
                      placeholder={placeholder}
                    />
                  );
                })}
              </div>
            </ScrollingContext>
            {footer}
          </>
        )}
      </ScrollArea>
      {visibleRows.length ? (
        <div
          data-slot="virtual-list-position"
          data-visible={fast ? '' : undefined}
          aria-hidden="true"
          // shortcut: shows on fling speed only; dragging the thumb slowly does not bring it up, add a thumb listener if asked
          className="pointer-events-none absolute top-1/2 right-4 z-20 flex h-9 -translate-y-1/2 items-center gap-2 rounded-full bg-fg-1 pr-3.5 pl-1.5 text-label-md font-medium whitespace-nowrap text-surface-1 tabular-nums opacity-0 shadow-tooltip transition-opacity duration-(--duration-quick) ease-out data-visible:opacity-100"
        >
          {group ? <span className="flex size-6 items-center justify-center rounded-full bg-surface-1/15 text-caption font-semibold">{group.title}</span> : null}
          {`${numbers.format(Math.min(...visibleRows) + 1)}–${numbers.format(Math.max(...visibleRows) + 1)} из ${numbers.format(count)}`}
        </div>
      ) : null}
    </div>
  );
}
