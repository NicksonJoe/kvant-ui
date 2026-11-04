import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { sheetReleaseVelocity, type SheetSample } from './sheet';

export interface SwipeAction {
  id: string;
  label: string;
  icon?: ReactNode;
  /** accent: задача, ответить, прочитано · success: позвонить · warning: закрепить · neutral: «Ещё». */
  tone?: 'accent' | 'success' | 'warning' | 'neutral';
  onSelect: () => void;
}

const SLOT = 72;
// Paper: open past 40 % of the actions or on a 300 pt/s flick, full swipe past 60 % of the row
const OPEN_SHARE = 0.4;
const FLICK_VELOCITY = 0.3;
const FULL_SHARE = 0.6;
// a press that moves less than this stays a click
const SLOP = 8;
// a wheel gesture ends once its events pause for this long
const WHEEL_IDLE = 150;
const tones = {
  accent: 'bg-accent text-accent-fg',
  success: 'bg-success text-success-fg',
  warning: 'bg-warning text-warning-fg',
  neutral: 'bg-fg-3 text-surface-1',
} as const;

type Side = 'leading' | 'trailing';
type Widths = Record<Side, number>;

/** Offset for a raw drag: past the actions it is free towards a full-swipe action, resisted by 0.3 otherwise. */
function resistOffset(raw: number, widths: Widths, free: boolean): number {
  const limit = widths[raw > 0 ? 'leading' : 'trailing'];
  const beyond = Math.abs(raw) - limit;
  const magnitude = limit === 0 ? 0 : beyond > 0 && !free ? limit + beyond * 0.3 : Math.abs(raw);
  return Math.sign(raw) * magnitude;
}

/** Where a released row rests: a flick away from the centre opens that side, one back towards it closes the row. */
function restingSide(offset: number, velocity: number, widths: Widths): Side | null {
  const side: Side = offset > 0 ? 'leading' : 'trailing';
  const width = widths[side];
  if (width === 0) return null;
  if (Math.abs(velocity) >= FLICK_VELOCITY && offset !== 0) return Math.sign(velocity) === Math.sign(offset) ? side : null;
  return Math.abs(offset) >= width * OPEN_SHARE ? side : null;
}

const restingOffset = (side: Side | null, widths: Widths) => (side === 'leading' ? widths.leading : side === 'trailing' ? -widths.trailing : 0);

export interface SwipeActionsProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Revealed by a swipe to the right; the outer one also runs on a full swipe. Up to 3. */
  leading?: readonly SwipeAction[];
  /** Revealed by a swipe to the left. Up to 3; put «Ещё» last. */
  trailing?: readonly SwipeAction[];
  children: ReactNode;
}

/**
 * Quick actions behind a list row. Opens past 40 % of the actions or on a flick, a full swipe (60 % of the row) runs the
 * outer positive action; «Ещё» never runs by a swipe. Touch, pen and mouse drag it, a two-finger trackpad swipe moves it
 * too; from the keyboard, Tab onto an action opens its side.
 */
export function SwipeActions({ leading = [], trailing = [], className, children, ...props }: SwipeActionsProps) {
  const [offset, setOffsetState] = useState(0);
  // the latest offset for pointerup, which can run before React renders the last pointermove
  const offsetRef = useRef(0);
  const setOffset = (value: number) => {
    offsetRef.current = value;
    setOffsetState(value);
  };
  const [open, setOpen] = useState<Side | null>(null);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{ x: number; y: number; base: number; axis: 'x' | 'y' | null; samples: SheetSample[] } | null>(null);
  // set by a swipe, so the click the browser sends after it does not reach the row
  const swiped = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const widths: Widths = { leading: leading.length * SLOT, trailing: trailing.length * SLOT };
  const latestWidths = useRef(widths);
  useLayoutEffect(() => {
    latestWidths.current = { leading: leading.length * SLOT, trailing: trailing.length * SLOT };
  });

  const fullAction = (side: Side) => {
    const list = side === 'leading' ? leading : trailing;
    const outer = side === 'leading' ? list[0] : list[list.length - 1];
    return outer && outer.tone !== 'neutral' ? outer : undefined;
  };

  const settle = (side: Side | null) => {
    setOpen(side);
    setOffset(restingOffset(side, widths));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    gesture.current = { x: event.clientX, y: event.clientY, base: offsetRef.current, axis: null, samples: [] };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current) return;
    // the mouse button went up outside the row before the swipe started
    if (event.pointerType === 'mouse' && event.buttons === 0 && current.axis === null) {
      gesture.current = null;
      return;
    }
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (current.axis === null) {
      // below the slop a press stays a click
      if (Math.hypot(dx, dy) < SLOP) return;
      current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (current.axis === 'x') {
        try {
          event.currentTarget.setPointerCapture?.(event.pointerId);
        } catch {
          // a pointer that is already gone cannot be captured; the drag still works without it
        }
        setDragging(true);
      }
    }
    if (current.axis !== 'x') return;
    // a mouse press on text has already started a selection; the swipe drops it
    if (event.pointerType === 'mouse') window.getSelection()?.removeAllRanges();
    const now = event.timeStamp;
    // samples carry x in `y`: the sheet's speed helper works on any axis
    current.samples = [...current.samples.filter((sample) => now - sample.t <= 100), { t: now, y: event.clientX }];
    const raw = current.base + dx;
    setOffset(resistOffset(raw, widths, fullAction(raw > 0 ? 'leading' : 'trailing') !== undefined));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    gesture.current = null;
    setDragging(false);
    if (!current || current.axis !== 'x') return;
    swiped.current = true;
    setTimeout(() => {
      swiped.current = false;
    });
    const now = event.timeStamp;
    const last = current.samples.at(-1);
    const velocity = sheetReleaseVelocity(last ? [...current.samples, { t: now, y: last.y }] : current.samples, now);
    const offset = offsetRef.current;
    const side: Side = offset > 0 ? 'leading' : 'trailing';
    const full = fullAction(side);
    if (full && Math.abs(offset) >= Math.max(event.currentTarget.clientWidth * FULL_SHARE, widths[side] + 48)) {
      navigator.vibrate?.(10);
      full.onSelect();
      settle(null);
      return;
    }
    settle(restingSide(offset, velocity, widths));
  };

  // Two-finger trackpad swipe: wheel deltaX moves the row; a gesture whose first event is vertical stays a scroll.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    let wheel: { axis: 'x' | 'y'; base: number; dx: number } | null = null;
    let timer = 0;
    const put = (value: number) => {
      offsetRef.current = value;
      setOffsetState(value);
    };
    const end = () => {
      const current = wheel;
      wheel = null;
      if (current?.axis !== 'x') return;
      setDragging(false);
      const side = restingSide(offsetRef.current, 0, latestWidths.current);
      setOpen(side);
      put(restingOffset(side, latestWidths.current));
    };
    const onWheel = (event: WheelEvent) => {
      if (!wheel) {
        if (event.ctrlKey) return;
        wheel = { axis: Math.abs(event.deltaX) > Math.abs(event.deltaY) ? 'x' : 'y', base: offsetRef.current, dx: 0 };
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(end, WHEEL_IDLE);
      if (wheel.axis !== 'x') return;
      // also keeps the browser from going back in history on a horizontal overscroll
      event.preventDefault();
      wheel.dx -= event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaX * 16 : event.deltaX;
      setDragging(true);
      // shortcut: trackpad momentum would fire a full swipe by accident, so the wheel never runs the action
      put(resistOffset(wheel.base + wheel.dx, latestWidths.current, false));
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      root.removeEventListener('wheel', onWheel);
      window.clearTimeout(timer);
    };
  }, []);

  const renderActions = (side: Side, list: readonly SwipeAction[]) =>
    list.length > 0 ? (
      <div className={cn('absolute inset-y-0 flex items-stretch', side === 'leading' ? 'left-0' : 'right-0')}>
        {list.map((action) => (
          <button
            key={action.id}
            type="button"
            onFocus={() => settle(side)}
            onClick={() => {
              action.onSelect();
              settle(null);
            }}
            className="flex w-18 flex-col items-center justify-center gap-1 text-caption font-medium text-fg-2"
          >
            <span className={cn('grid size-11 place-items-center rounded-full [&_svg]:size-5 [&_svg]:stroke-[1.75]', tones[action.tone ?? 'accent'])}>
              {action.icon}
            </span>
            {action.label}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div
      ref={rootRef}
      data-slot="swipe-actions"
      data-state={open ?? 'closed'}
      // keyboard: focusing an action opens its side, leaving the row closes it
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) settle(null);
      }}
      className={cn('relative overflow-hidden bg-background', className)}
      {...props}
    >
      <div
        data-slot="swipe-actions-row"
        data-dragging={dragging ? '' : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          gesture.current = null;
          setDragging(false);
          settle(open);
        }}
        // links and images inside the row would start a native drag instead of the swipe
        onDragStart={(event) => {
          if (gesture.current) event.preventDefault();
        }}
        onClickCapture={(event) => {
          const afterSwipe = swiped.current;
          swiped.current = false;
          // keyboard clicks (detail 0) always reach the row content
          if (!afterSwipe && (open === null || event.detail === 0)) return;
          // the click that ends a swipe is dropped; a tap on an open row closes it
          event.preventDefault();
          event.stopPropagation();
          if (!afterSwipe) settle(null);
        }}
        className={cn(
          'relative z-10 touch-pan-y bg-background',
          dragging ? 'select-none' : 'transition-transform duration-(--duration-moderate) ease-fluid',
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
      {renderActions('leading', leading)}
      {renderActions('trailing', trailing)}
    </div>
  );
}
