import { Lock } from 'lucide-react';
import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { cn } from '../lib/cn';
import { Kbd } from './badge';
import { Checkbox } from './checkbox';
import { Portal } from './portal';
import { Announce } from './visually-hidden';

/** Pointer travel before a press on the handle becomes a drag. */
const THRESHOLD = 4;
/** Touch: a press this long lifts the row; moving the finger earlier scrolls the page. */
const LONG_PRESS = 250;
const TOUCH_SLOP = 8;
/** Distance from the edge of the scroll area where a drag starts scrolling it. */
const EDGE = 48;
const EDGE_SPEED = 16;
const FLIP = 'kv-sortable-flip';

export type SortableLayout = 'list' | 'grid';
export type SortableIndicator = 'slot' | 'line';

const never = () => false;

/** Index in `items` of the `at`-th movable position: where a block that starts there lands. */
function freeSlot<T>(items: readonly T[], at: number, isPinned: (item: T) => boolean): number {
  let seen = 0;
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (item === undefined || isPinned(item)) continue;
    if (seen === at) return index;
    seen++;
  }
  return items.length - 1;
}

/**
 * Moves the items with `ids` as one block, in their list order, so the first of them lands at `slot`.
 * Pinned items keep their places; a slot taken by a pinned item leaves the list as it is.
 */
export function moveSortableItems<T extends { id: string }>(
  items: readonly T[],
  ids: readonly string[],
  slot: number,
  isPinned: (item: T) => boolean = never,
): T[] {
  const target = items[slot];
  if (target === undefined || isPinned(target)) return [...items];
  const moving = new Set(ids);
  const free = items.filter((item) => !isPinned(item));
  const block = free.filter((item) => moving.has(item.id));
  if (!block.length) return [...items];
  const rest = free.filter((item) => !moving.has(item.id));
  let before = 0;
  for (let index = 0; index < slot; index++) {
    const item = items[index];
    if (item !== undefined && !isPinned(item)) before++;
  }
  const at = Math.min(before, rest.length);
  const order = [...rest.slice(0, at), ...block, ...rest.slice(at)];
  let next = 0;
  return items.map((item) => (isPinned(item) ? item : (order[next++] ?? item)));
}

/** Slot for the block `delta` movable positions further (±1 in a list, ± a row of columns in a grid); null past an edge. */
export function sortableStep<T extends { id: string }>(
  items: readonly T[],
  ids: readonly string[],
  delta: number,
  isPinned: (item: T) => boolean = never,
): number | null {
  const moving = new Set(ids);
  const free = items.filter((item) => !isPinned(item));
  const first = free.findIndex((item) => moving.has(item.id));
  if (first < 0) return null;
  const rest = free.length - free.filter((item) => moving.has(item.id)).length;
  const at = first + delta;
  if (at < 0 || at > rest) return null;
  return freeSlot(items, at, isPinned);
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Slot whose box is closest to the point; inside a box the distance is 0. */
function nearestSlot(boxes: readonly Box[], x: number, y: number): number {
  let best = 0;
  let distance = Infinity;
  boxes.forEach((box, index) => {
    const dx = Math.max(box.left - x, 0, x - box.right);
    const dy = Math.max(box.top - y, 0, y - box.bottom);
    if (dx * dx + dy * dy < distance) {
      distance = dx * dx + dy * dy;
      best = index;
    }
  });
  return best;
}

type Source = 'pointer' | 'touch' | 'keyboard';

interface Drag {
  /** Rows that move: the grabbed one, or every selected movable row when it is selected. */
  ids: readonly string[];
  grabbed: string;
  source: Source;
  /** Where the first moving row lands; null over a pinned row. */
  slot: number | null;
  /** Pinned row under the pointer. */
  blocked: string | null;
  /** Gap between rows for the insertion line (line indicator). */
  gap: number;
  /** Rows at the start of the drag, relative to the list: the slots do not move while the rows do. */
  boxes: readonly Box[];
  x: number;
  y: number;
  /** Where the row was taken, inside it. */
  dx: number;
  dy: number;
  width: number;
  height: number;
  /** Released: the overlay is flying to its place. */
  landing?: boolean;
}

/** Nested quotes for names inside announcements: «Позвонить „Чайной лавке“». */
const quote = (text: string) => `«${text.replace(/«/g, '„').replace(/»/g, '“')}»`;

function cssValue(element: Element, name: string, fallback: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

function Grip() {
  return (
    <svg aria-hidden viewBox="0 0 10 16" className="h-4 w-2.5" fill="currentColor">
      <circle cx="2.5" cy="3" r="1.5" />
      <circle cx="7.5" cy="3" r="1.5" />
      <circle cx="2.5" cy="8" r="1.5" />
      <circle cx="7.5" cy="8" r="1.5" />
      <circle cx="2.5" cy="13" r="1.5" />
      <circle cx="7.5" cy="13" r="1.5" />
    </svg>
  );
}

// Rows of a list: 48 high, r12; selected rows in a run merge into one plate (like `mergedRows`, keyed on data-selected).
const listRow =
  'relative flex min-h-12 items-center gap-2.5 rounded-md px-2 text-body-sm text-fg-1 ' +
  'data-selected:bg-accent-soft data-selected:[&:has(+[data-selected])]:rounded-b-none [[data-selected]+&]:data-selected:rounded-t-none ' +
  'hover:[&:has(+[data-selected])]:rounded-b-none hover:[[data-selected]+&]:rounded-t-none ' +
  'data-selected:[&:has(+:hover)]:rounded-b-none data-selected:[:hover+&]:rounded-t-none';

const lifted = {
  list: 'rounded-md -rotate-[1.2deg] shadow-[0_0_0_1px_var(--color-hairline),0_4px_8px_oklch(var(--ink)/0.08),0_16px_32px_oklch(var(--ink)/0.12)] dark:shadow-[0_0_0_1px_var(--color-hairline),0_4px_8px_oklch(0_0_0/0.3),0_16px_32px_oklch(0_0_0/0.45)]',
  grid: 'rounded-lg rotate-2 shadow-[0_0_0_1px_var(--color-hairline),0_4px_8px_oklch(var(--ink)/0.08),0_20px_40px_oklch(var(--ink)/0.14)] dark:shadow-[0_0_0_1px_var(--color-hairline),0_4px_8px_oklch(0_0_0/0.3),0_20px_40px_oklch(0_0_0/0.5)]',
} as const;

export interface SortableListProps<T extends { id: string }> extends Omit<ComponentProps<'div'>, 'children' | 'onChange'> {
  'aria-label': string;
  items: readonly T[];
  /** The new order after a drop; nothing is called while the row is still in the air. */
  onItemsChange: (items: T[]) => void;
  /** Row content after the handle (and the checkbox): text, avatar, date. */
  renderItem: (item: T) => ReactNode;
  /** Row name for the handle, the checkbox and the announcements. */
  getLabel: (item: T) => string;
  /** list — rows 48 under each other; grid — cards in a grid, the handle shows on hover. */
  layout?: SortableLayout;
  /** slot — neighbours make room for an empty slot; line — rows stay put and a line shows the place (dense lists). */
  indicator?: SortableIndicator;
  /** Pinned rows never move and nothing can be dropped in their place. */
  isPinned?: (item: T) => boolean;
  /** Ids of selected rows: each row gets a checkbox, and dragging a selected row moves them all. */
  selected?: readonly string[];
  onSelectedChange?: (ids: string[]) => void;
  disabled?: boolean;
}

/**
 * Rows reorder by their handle only, so the rest of the row stays clickable. A lifted row leaves a slot and its
 * neighbours make room (or a line shows the place in dense lists); the same works from the keyboard:
 * Space lifts and drops, arrows move, Esc puts it back. Every step is announced.
 */
export function SortableList<T extends { id: string }>({
  'aria-label': ariaLabel,
  items,
  onItemsChange,
  renderItem,
  getLabel,
  layout = 'list',
  indicator = 'slot',
  isPinned = never,
  selected,
  onSelectedChange,
  disabled = false,
  className,
  ...props
}: SortableListProps<T>) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [tracking, setTracking] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const current = useRef<Drag | null>(null);
  const pending = useRef<{ id: string; x: number; y: number } | null>(null);
  const touch = useRef<{ id: string; x: number; y: number; timer: number; active: boolean } | null>(null);
  const snapshot = useRef<Map<string, DOMRect> | null>(null);
  const refocus = useRef<string | null>(null);
  const hint = useId();
  const grid = layout === 'grid';
  const line = !grid && indicator === 'line';
  const selectable = selected !== undefined;

  const put = (next: Drag | null) => {
    current.current = next;
    setDrag(next);
  };
  const rows = () => Array.from(list.current?.querySelectorAll<HTMLElement>(':scope > [data-slot=sortable-item]') ?? []);
  const label = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    return item ? quote(getLabel(item)) : '';
  };
  // the visual place of every row right before an order change: the layout effect slides them from there
  const remember = () => {
    snapshot.current = new Map(rows().map((row) => [row.dataset.sortableId ?? '', row.getBoundingClientRect()]));
  };
  const reordering = drag !== null && drag.slot !== null && (drag.source === 'keyboard' || !line);
  const view = reordering ? moveSortableItems(items, drag.ids, drag.slot ?? 0, isPinned) : items;

  useLayoutEffect(() => {
    if (refocus.current !== null) {
      list.current?.querySelector<HTMLElement>(`[data-sortable-id="${CSS.escape(refocus.current)}"] [data-slot=sortable-handle]`)?.focus();
      refocus.current = null;
    }
    const before = snapshot.current;
    snapshot.current = null;
    const element = list.current;
    if (!before || !element) return;
    const duration = Number.parseFloat(cssValue(element, '--duration-base', '200')) || 200;
    const easing = cssValue(element, '--ease-standard', 'cubic-bezier(0.2, 0, 0, 1)');
    for (const row of rows()) {
      if (typeof row.animate !== 'function') return;
      const from = before.get(row.dataset.sortableId ?? '');
      if (!from) continue;
      for (const animation of row.getAnimations()) if (animation.id === FLIP) animation.cancel();
      const to = row.getBoundingClientRect();
      const x = from.left - to.left;
      const y = from.top - to.top;
      if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;
      row.animate([{ translate: `${x}px ${y}px` }, { translate: '0 0' }], { duration, easing, id: FLIP });
    }
  });

  const announceMove = (next: readonly T[], id: string, moved: boolean) => {
    const position = next.findIndex((item) => item.id === id) + 1;
    setAnnouncement(moved ? `${label(id)} перемещена на позицию ${position} из ${next.length}` : `${label(id)} осталась на позиции ${position} из ${next.length}`);
  };

  const commit = (state: Drag) => {
    const next = state.slot === null ? [...items] : moveSortableItems(items, state.ids, state.slot, isPinned);
    const moved = next.some((item, index) => item !== items[index]);
    if (moved) onItemsChange(next);
    announceMove(next, state.grabbed, moved);
  };

  const movingIds = (id: string): string[] =>
    selected?.includes(id) ? items.filter((item) => selected.includes(item.id) && !isPinned(item)).map((item) => item.id) : [id];

  const begin = (id: string, x: number, y: number, source: 'pointer' | 'touch') => {
    const element = list.current;
    const row = rows().find((entry) => entry.dataset.sortableId === id);
    if (!element || !row) return;
    const base = element.getBoundingClientRect();
    const boxes = rows().map((entry) => {
      const box = entry.getBoundingClientRect();
      return { left: box.left - base.left, top: box.top - base.top, right: box.right - base.left, bottom: box.bottom - base.top };
    });
    const box = row.getBoundingClientRect();
    const ids = movingIds(id);
    const first = items.findIndex((item) => item.id === ids[0]);
    remember();
    put({ ids, grabbed: id, source, slot: first, blocked: null, gap: first, boxes, x, y, dx: x - box.left, dy: y - box.top, width: box.width, height: box.height });
  };

  const aim = (state: Drag, x: number, y: number): Pick<Drag, 'slot' | 'blocked' | 'gap'> => {
    const base = list.current?.getBoundingClientRect();
    const px = x - (base?.left ?? 0);
    const py = y - (base?.top ?? 0);
    if (line) {
      const over = state.boxes.findIndex((box) => px >= box.left && px <= box.right && py >= box.top && py <= box.bottom);
      const under = items[over];
      if (under && isPinned(under)) return { slot: null, blocked: under.id, gap: state.gap };
      const gap = state.boxes.filter((box) => (box.top + box.bottom) / 2 < py).length;
      const moving = new Set(state.ids);
      const before = items.slice(0, gap).filter((item) => !isPinned(item) && !moving.has(item.id)).length;
      return { slot: freeSlot(items, before, isPinned), blocked: null, gap };
    }
    // the centre of the lifted row decides, wherever it was taken
    const slot = nearestSlot(state.boxes, px - state.dx + state.width / 2, py - state.dy + state.height / 2);
    const under = items[slot];
    if (under && isPinned(under)) return { slot: null, blocked: under.id, gap: state.gap };
    return { slot, blocked: null, gap: state.gap };
  };

  const follow = (x: number, y: number) => {
    const state = current.current;
    if (!state || state.source === 'keyboard' || state.landing) return;
    const target = aim(state, x, y);
    if (target.slot !== state.slot && !line) remember();
    put({ ...state, ...target, x, y });
  };

  // Released: the overlay flies to the slot (or home) and the row takes its place.
  const release = () => {
    const state = current.current;
    if (!state || state.landing) return;
    const home = state.slot === null;
    const finish = () => {
      if (home) setAnnouncement(`${label(state.grabbed)} осталась на месте`);
      else commit(state);
      if (line && !home) remember();
      put(null);
    };
    const ghost = overlay.current;
    const target = rows().find((row) => row.dataset.sortableId === state.grabbed);
    if (!ghost || !target || typeof ghost.animate !== 'function' || (line && !home)) {
      finish();
      return;
    }
    const to = target.getBoundingClientRect();
    const from = ghost.getBoundingClientRect();
    const [springDuration = '350ms', ...springCurve] = cssValue(ghost, '--spring-smooth', '350ms ease-out').split(' ');
    const spring = !home && !line;
    put({ ...state, landing: true });
    const flight = ghost.animate(
      [
        { left: `${state.x - state.dx}px`, top: `${state.y - state.dy}px` },
        line
          ? { left: `${to.left + 28}px`, top: `${to.top + (to.height - from.height) / 2}px`, opacity: 0 }
          : { left: `${to.left}px`, top: `${to.top}px`, rotate: '0deg', scale: '1', boxShadow: 'none' },
      ],
      {
        duration: spring ? Number.parseFloat(springDuration) : Number.parseFloat(cssValue(ghost, '--duration-base', '200')),
        easing: spring ? springCurve.join(' ') : cssValue(ghost, '--ease-standard', 'ease-out'),
        fill: 'forwards',
      },
    );
    flight.onfinish = finish;
    flight.oncancel = finish;
  };

  const cancel = () => {
    const state = current.current;
    if (!state) return;
    remember();
    put(null);
    setAnnouncement(`Перемещение отменено, ${label(state.grabbed)} на позиции ${items.findIndex((item) => item.id === state.grabbed) + 1} из ${items.length}`);
  };

  const onWindowMove = useEffectEvent((event: PointerEvent) => {
    const press = pending.current;
    if (press && !current.current) {
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > THRESHOLD) begin(press.id, press.x, press.y, 'pointer');
      else return;
    }
    follow(event.clientX, event.clientY);
  });
  const onWindowUp = useEffectEvent(() => {
    pending.current = null;
    setTracking(false);
    if (current.current?.source === 'pointer') release();
  });
  const onWindowKey = useEffectEvent((event: globalThis.KeyboardEvent) => {
    if (event.key !== 'Escape' || !current.current || current.current.source === 'keyboard') return;
    event.preventDefault();
    pending.current = null;
    setTracking(false);
    cancel();
  });
  useEffect(() => {
    if (!tracking) return;
    const up = () => onWindowUp();
    const move = (event: PointerEvent) => onWindowMove(event);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [tracking]);

  const pointerDrag = drag !== null && drag.source !== 'keyboard';
  useEffect(() => {
    if (!pointerDrag) return;
    const key = (event: globalThis.KeyboardEvent) => onWindowKey(event);
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [pointerDrag]);

  useEffect(() => {
    const element = list.current;
    if (!element) return;
    // React's touchmove is passive; only a native listener can stop the page from scrolling under the finger
    const hold = (event: TouchEvent) => {
      if (touch.current?.active) event.preventDefault();
    };
    element.addEventListener('touchmove', hold, { passive: false });
    return () => element.removeEventListener('touchmove', hold);
  }, []);
  useEffect(() => () => window.clearTimeout(touch.current?.timer), []);

  // Near the top or bottom edge of the scroll area the page scrolls under the lifted row.
  const edgeScroll = useEffectEvent(() => {
    const state = current.current;
    const element = list.current;
    if (!state || state.landing || !element) return;
    const parent = scrollParent(element);
    const top = parent ? Math.max(parent.getBoundingClientRect().top, 0) : 0;
    const bottom = parent ? Math.min(parent.getBoundingClientRect().bottom, window.innerHeight) : window.innerHeight;
    const step = state.y < top + EDGE ? -Math.ceil(((top + EDGE - state.y) / EDGE) * EDGE_SPEED) : state.y > bottom - EDGE ? Math.ceil(((state.y - bottom + EDGE) / EDGE) * EDGE_SPEED) : 0;
    if (!step) return;
    (parent ?? document.scrollingElement ?? document.documentElement).scrollTop += step;
    follow(state.x, state.y);
  });
  useEffect(() => {
    if (!pointerDrag) return;
    let frame = requestAnimationFrame(function tick() {
      edgeScroll();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [pointerDrag]);

  // grabbing hand everywhere while a row is in the air, not-allowed over a pinned row
  const blocked = drag?.blocked ?? null;
  useEffect(() => {
    if (!pointerDrag) return;
    const root = document.documentElement;
    const previous = { cursor: root.style.cursor, select: root.style.userSelect };
    root.style.cursor = blocked ? 'not-allowed' : 'grabbing';
    root.style.userSelect = 'none';
    return () => {
      root.style.cursor = previous.cursor;
      root.style.userSelect = previous.select;
    };
  }, [pointerDrag, blocked]);

  const endTouch = () => {
    if (touch.current) window.clearTimeout(touch.current.timer);
    touch.current = null;
  };

  const onHandlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    if (event.pointerType === 'touch' || event.button !== 0 || current.current) return;
    pending.current = { id, x: event.clientX, y: event.clientY };
    setTracking(true);
  };

  const onHandleTouchStart = (event: ReactTouchEvent<HTMLButtonElement>, id: string) => {
    const point = event.touches[0];
    if (!point || current.current) return;
    const x = point.clientX;
    const y = point.clientY;
    const timer = window.setTimeout(() => {
      if (!touch.current) return;
      touch.current.active = true;
      navigator.vibrate?.(10);
      begin(id, x, y, 'touch');
    }, LONG_PRESS);
    touch.current = { id, x, y, timer, active: false };
  };
  const onHandleTouchMove = (event: ReactTouchEvent<HTMLButtonElement>) => {
    const point = event.touches[0];
    const press = touch.current;
    if (!point || !press) return;
    if (press.active) follow(point.clientX, point.clientY);
    else if (Math.hypot(point.clientX - press.x, point.clientY - press.y) > TOUCH_SLOP) endTouch();
  };
  const onHandleTouchEnd = (event: ReactTouchEvent<HTMLButtonElement>) => {
    const point = event.changedTouches[0];
    if (touch.current?.active) {
      // no click after a drag
      event.preventDefault();
      if (point) follow(point.clientX, point.clientY);
      release();
    }
    endTouch();
  };

  const columns = () => {
    const tops = rows().map((row) => row.getBoundingClientRect().top);
    const first = tops[0];
    return Math.max(1, tops.filter((top) => Math.abs(top - (first ?? 0)) < 1).length);
  };

  const onHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const state = current.current;
    if (!state) {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      const ids = movingIds(id);
      const first = items.findIndex((item) => item.id === ids[0]);
      remember();
      refocus.current = id;
      put({ ids, grabbed: id, source: 'keyboard', slot: first, blocked: null, gap: first, boxes: [], x: 0, y: 0, dx: 0, dy: 0, width: 0, height: 0 });
      const next = moveSortableItems(items, ids, first, isPinned);
      const position = next.findIndex((item) => item.id === id) + 1;
      setAnnouncement(`${label(id)} поднята, позиция ${position} из ${items.length}. Стрелки — двигать, Space — положить, Esc — отменить`);
      return;
    }
    if (state.source !== 'keyboard') return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      refocus.current = id;
      put(null);
      commit(state);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      refocus.current = id;
      cancel();
      return;
    }
    const delta = grid
      ? { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns(), ArrowDown: columns() }[event.key]
      : { ArrowUp: -1, ArrowDown: 1 }[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const slot = sortableStep(view, state.ids, delta, isPinned);
    if (slot === null) return;
    remember();
    refocus.current = id;
    put({ ...state, slot });
    const next = moveSortableItems(items, state.ids, slot, isPinned);
    setAnnouncement(`${label(id)} — позиция ${next.findIndex((item) => item.id === id) + 1} из ${items.length}`);
  };

  // Tab or a click elsewhere while lifted from the keyboard drops the row where it is.
  const onHandleBlur = () => {
    if (current.current?.source !== 'keyboard') return;
    requestAnimationFrame(() => {
      const state = current.current;
      if (state?.source !== 'keyboard') return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest('[data-slot=sortable-item]')?.getAttribute('data-sortable-id') === state.grabbed) return;
      put(null);
      commit(state);
    });
  };

  const toggle = (id: string) => {
    if (!selected) return;
    onSelectedChange?.(selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id]);
  };
  const onRowClick = (event: MouseEvent<HTMLDivElement>, id: string) => {
    if (!selectable || disabled) return;
    if (event.target instanceof Element && event.target.closest('button, a, input, label, select, textarea, [role=checkbox]')) return;
    toggle(id);
  };

  const keyboard = drag?.source === 'keyboard';
  const grabbedItem = drag ? items.find((item) => item.id === drag.grabbed) : undefined;
  const lineTop = (() => {
    if (!drag || !line || drag.source === 'keyboard' || drag.slot === null || !drag.boxes.length) return null;
    const above = drag.boxes[drag.gap - 1];
    const below = drag.boxes[drag.gap];
    if (above && below) return (above.bottom + below.top) / 2;
    return above ? above.bottom : (below?.top ?? 0);
  })();

  const handle = (item: T, pinnedItem: boolean, state: { grabbed: boolean; lifted?: boolean }) => (
    <button
      type="button"
      data-slot="sortable-handle"
      aria-label={`Переместить ${quote(getLabel(item))}`}
      aria-describedby={hint}
      aria-pressed={state.grabbed && keyboard ? true : undefined}
      disabled={disabled || pinnedItem}
      tabIndex={state.lifted ? -1 : undefined}
      onPointerDown={(event) => onHandlePointerDown(event, item.id)}
      onTouchStart={(event) => onHandleTouchStart(event, item.id)}
      onTouchMove={onHandleTouchMove}
      onTouchEnd={onHandleTouchEnd}
      onTouchCancel={endTouch}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => onHandleKeyDown(event, item.id)}
      onBlur={onHandleBlur}
      className={cn(
        'grid shrink-0 cursor-grab touch-manipulation select-none place-items-center rounded-xs [-webkit-touch-callout:none] focus-visible:outline-offset-0',
        'transition-[background-color,color,opacity] duration-(--duration-quick) ease-hover disabled:cursor-default disabled:opacity-50',
        grid
          ? 'absolute top-2.5 right-2.5 size-6 bg-fill-2 text-fg-2 opacity-0 group-hover/sortable:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 disabled:opacity-0'
          : 'h-7 w-5 text-fg-4 hover:not-disabled:bg-fill-1 hover:not-disabled:text-fg-3',
        'active:not-disabled:cursor-grabbing active:not-disabled:bg-fill-2 active:not-disabled:text-fg-2',
        state.lifted && 'bg-fill-2 text-fg-2',
        // the row's ring already marks focus while lifted
        state.grabbed && keyboard && cn('bg-surface-1 text-accent focus-visible:outline-none', grid && 'opacity-100'),
      )}
    >
      <Grip />
    </button>
  );

  const content = (item: T, state: { grabbed: boolean; lifted?: boolean }) => {
    const pinnedItem = isPinned(item);
    const isBlocked = drag?.blocked === item.id;
    const checked = selected?.includes(item.id) ?? false;
    return (
      <>
        {isBlocked && !grid ? (
          <span data-slot="sortable-lock" className="grid h-7 w-5 shrink-0 place-items-center text-danger-soft-fg">
            <Lock aria-hidden className="size-3.5 stroke-2" />
          </span>
        ) : (
          handle(item, pinnedItem, state)
        )}
        {selectable && !grid ? (
          <Checkbox
            checked={checked}
            disabled={disabled}
            onCheckedChange={() => toggle(item.id)}
            aria-label={`Выбрать ${quote(getLabel(item))}`}
            tabIndex={state.lifted ? -1 : undefined}
          />
        ) : null}
        <div data-slot="sortable-content" className={cn('min-w-0 flex-1', (state.lifted || (state.grabbed && keyboard)) && 'font-medium')}>
          {renderItem(item)}
        </div>
        {state.grabbed && keyboard && !grid ? (
          <span className="shrink-0 text-caption font-semibold text-accent-soft-fg tabular-nums">
            {view.findIndex((entry) => entry.id === item.id) + 1} из {items.length}
          </span>
        ) : null}
        {isBlocked && !grid ? <span className="shrink-0 text-caption font-medium text-danger-soft-fg">Закреплённые не двигаются</span> : null}
      </>
    );
  };

  return (
    <div data-slot="sortable-list" className={cn('flex flex-col', className)} {...props}>
      <div
        ref={list}
        role="list"
        aria-label={ariaLabel}
        data-layout={layout}
        className={cn(
          'relative',
          grid
            ? 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-3 rounded-xl bg-surface-2 p-4'
            : 'flex flex-col rounded-xl bg-surface-1 p-2 shadow-raised',
        )}
      >
        {view.map((item) => {
          const moving = drag?.ids.includes(item.id) ?? false;
          const placeholder = moving && pointerDrag && !line;
          const grabbed = drag?.grabbed === item.id;
          return (
            <div
              key={item.id}
              role="listitem"
              data-slot="sortable-item"
              data-sortable-id={item.id}
              data-pinned={isPinned(item) || undefined}
              data-selected={(selected?.includes(item.id) && !placeholder) || undefined}
              data-placeholder={placeholder || undefined}
              data-dragging={(moving && pointerDrag && line) || undefined}
              data-grabbed={(moving && keyboard) || undefined}
              data-blocked={drag?.blocked === item.id || undefined}
              onClick={(event) => onRowClick(event, item.id)}
              className={cn(
                grid
                  ? 'group/sortable relative flex min-h-28 flex-col gap-1.5 rounded-lg bg-surface-1 p-4 text-fg-1 shadow-[0_0_0_1px_var(--color-hairline)] transition-shadow duration-(--duration-quick) ease-hover hover:shadow-[0_0_0_1px_var(--color-border),0_2px_6px_oklch(var(--ink)/0.05)]'
                  : listRow,
                selectable && !disabled && !grid && 'cursor-default not-data-selected:hover:bg-fill-2',
                'data-dragging:opacity-45',
                'data-blocked:bg-danger-soft data-blocked:shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--color-danger)_40%,transparent)]',
                'data-grabbed:bg-accent-soft data-grabbed:shadow-[inset_0_0_0_2px_var(--color-ring)]',
                grid
                  ? 'data-placeholder:bg-accent/6 data-placeholder:shadow-none data-placeholder:outline-[1.5px] data-placeholder:outline-offset-[-1.5px] data-placeholder:outline-dashed data-placeholder:outline-accent/45 data-placeholder:[&>*]:invisible'
                  : 'data-placeholder:bg-fill-1 data-placeholder:outline-[1.5px] data-placeholder:outline-offset-[-1.5px] data-placeholder:outline-dashed data-placeholder:outline-border data-placeholder:[&>*]:invisible',
              )}
            >
              {content(item, { grabbed })}
              {placeholder && grid ? (
                <span aria-hidden className="visible! absolute inset-0 grid place-items-center text-label-sm font-medium text-accent-soft-fg">
                  Отпустите здесь
                </span>
              ) : null}
            </div>
          );
        })}
        {lineTop !== null ? (
          <div data-slot="sortable-line" aria-hidden className="pointer-events-none absolute inset-x-2 h-0" style={{ top: lineTop }}>
            <span className="absolute -top-[5px] left-1 size-2.5 rounded-full bg-surface-1 shadow-[inset_0_0_0_2px_var(--color-accent)]" />
            <span className="absolute -top-px right-1 left-[13px] h-0.5 rounded-full bg-accent" />
          </div>
        ) : null}
        {keyboard ? (
          <div
            data-slot="sortable-hint"
            aria-hidden
            className={cn('flex flex-wrap items-center gap-1.5 text-caption text-fg-3', grid ? 'col-span-full' : 'mt-1 border-t border-separator px-2 pt-2.5 pb-1')}
          >
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            {grid ? (
              <>
                <Kbd>←</Kbd>
                <Kbd>→</Kbd>
              </>
            ) : null}
            <span className="pr-2">двигать</span>
            <Kbd>Space</Kbd>
            <span className="pr-2">положить</span>
            <Kbd>Esc</Kbd>
            <span>отменить</span>
          </div>
        ) : null}
      </div>
      <p id={hint} hidden>
        Space — взять, стрелки — двигать, Space — положить, Esc — отменить
      </p>
      <Announce>{announcement}</Announce>
      {pointerDrag && grabbedItem ? (
        <Portal layer="dropdown">
          {line ? (
            <div
              ref={overlay}
              data-slot="sortable-ghost"
              aria-hidden
              className="pointer-events-none fixed flex h-8 max-w-52 -rotate-[1.5deg] items-center rounded-sm bg-surface-1 px-3 text-label-sm font-medium text-fg-1 shadow-[0_0_0_1px_var(--color-hairline),0_8px_24px_oklch(var(--ink)/0.12)] motion-reduce:rotate-0 dark:shadow-[0_0_0_1px_var(--color-hairline),0_8px_24px_oklch(0_0_0/0.45)]"
              style={{ left: drag.x + 12, top: drag.y - 16 }}
            >
              <span className="truncate">{getLabel(grabbedItem)}</span>
            </div>
          ) : (
            <div
              ref={overlay}
              data-slot="sortable-overlay"
              aria-hidden
              className={cn(
                'pointer-events-none fixed origin-top-left scale-(--scale-lift) bg-surface-1 text-fg-1 motion-reduce:rotate-0',
                grid ? cn('flex flex-col gap-1.5 p-4', lifted.grid) : cn('flex items-center gap-2.5 px-2 text-body-sm', lifted.list),
              )}
              style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.width, height: drag.height }}
            >
              {grid ? (
                <div data-slot="sortable-content" className="min-w-0 flex-1">
                  {renderItem(grabbedItem)}
                </div>
              ) : (
                content(grabbedItem, { grabbed: true, lifted: true })
              )}
              {drag.ids.length > 1 ? (
                <span className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-caption font-semibold text-accent-fg tabular-nums">
                  {drag.ids.length}
                </span>
              ) : null}
            </div>
          )}
        </Portal>
      ) : null}
    </div>
  );
}
