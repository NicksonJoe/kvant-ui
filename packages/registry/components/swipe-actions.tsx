import { useRef, useState, type ComponentProps, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface SwipeAction {
  id: string;
  label: string;
  icon?: ReactNode;
  /** accent: задача, ответить, прочитано · success: позвонить · warning: закрепить · neutral: «Ещё». */
  tone?: 'accent' | 'success' | 'warning' | 'neutral';
  onSelect: () => void;
}

const SLOT = 72;
const tones = {
  accent: 'bg-accent text-accent-fg',
  success: 'bg-success text-success-fg',
  warning: 'bg-warning text-warning-fg',
  neutral: 'bg-fg-3 text-surface-1',
} as const;

type Side = 'leading' | 'trailing';

export interface SwipeActionsProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Revealed by a swipe to the right; the outer one also runs on a full swipe. Up to 3. */
  leading?: readonly SwipeAction[];
  /** Revealed by a swipe to the left. Up to 3; put «Ещё» last. */
  trailing?: readonly SwipeAction[];
  children: ReactNode;
}

/**
 * Quick actions behind a list row. Opens past 40 % of the actions, a full swipe (60 % of the row) runs the outer
 * positive action; «Ещё» never runs by a swipe. Only touch drags it; the buttons stay in the DOM for screen readers.
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
  const gesture = useRef<{ x: number; y: number; base: number; axis: 'x' | 'y' | null } | null>(null);

  const widthOf = (side: Side) => (side === 'leading' ? leading : trailing).length * SLOT;
  const fullAction = (side: Side) => {
    const list = side === 'leading' ? leading : trailing;
    const outer = side === 'leading' ? list[0] : list[list.length - 1];
    return outer && outer.tone !== 'neutral' ? outer : undefined;
  };

  const settle = (side: Side | null) => {
    setOpen(side);
    setOffset(side === 'leading' ? widthOf('leading') : side === 'trailing' ? -widthOf('trailing') : 0);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    gesture.current = { x: event.clientX, y: event.clientY, base: offsetRef.current, axis: null };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (current.axis === null) {
      if (Math.hypot(dx, dy) < 8) return;
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
    const raw = current.base + dx;
    const side: Side = raw > 0 ? 'leading' : 'trailing';
    const limit = widthOf(side);
    // past the actions: free towards a full-swipe action, resistance 0.3 otherwise
    const beyond = Math.abs(raw) - limit;
    const free = fullAction(side) !== undefined;
    const magnitude = limit === 0 ? 0 : beyond > 0 && !free ? limit + beyond * 0.3 : Math.abs(raw);
    setOffset(Math.sign(raw) * magnitude);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    gesture.current = null;
    setDragging(false);
    if (!current || current.axis !== 'x') return;
    const offset = offsetRef.current;
    const side: Side = offset > 0 ? 'leading' : 'trailing';
    const width = event.currentTarget.clientWidth;
    const full = fullAction(side);
    if (full && Math.abs(offset) >= Math.max(width * 0.6, widthOf(side) + 48)) {
      navigator.vibrate?.(10);
      full.onSelect();
      settle(null);
      return;
    }
    settle(Math.abs(offset) >= widthOf(side) * 0.4 && widthOf(side) > 0 ? side : null);
  };

  const renderActions = (side: Side, list: readonly SwipeAction[]) =>
    list.length > 0 ? (
      <div className={cn('absolute inset-y-0 flex items-stretch', side === 'leading' ? 'left-0' : 'right-0')}>
        {list.map((action) => (
          <button
            key={action.id}
            type="button"
            tabIndex={open === side ? 0 : -1}
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
    <div data-slot="swipe-actions" data-state={open ?? 'closed'} className={cn('relative overflow-hidden bg-background', className)} {...props}>
      {renderActions('leading', leading)}
      {renderActions('trailing', trailing)}
      <div
        data-slot="swipe-actions-row"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          gesture.current = null;
          setDragging(false);
          settle(open);
        }}
        className={cn('relative touch-pan-y bg-background', !dragging && 'transition-transform duration-(--duration-moderate) ease-fluid')}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
