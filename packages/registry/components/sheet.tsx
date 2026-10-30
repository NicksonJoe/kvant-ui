import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import {
  createContext,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '../lib/cn';
import { CloseButton } from './button';

const backdrop = 'kv-backdrop fixed inset-0 z-50 bg-scrim';

export type SheetSide = 'right' | 'left' | 'bottom';

/** Heights a bottom sheet rests at (HIG detents): medium ≈ 50 % of the screen, large ≈ 92 %. */
export const SHEET_DETENTS = ['medium', 'large'] as const;
export type SheetDetent = (typeof SHEET_DETENTS)[number];

// Gesture rules (Paper, «Шиты»): close past 30 % of the lowest detent or on a 0.4 px/ms flick,
// speed is measured over the last 100 ms, pulling above the largest detent moves the sheet by 30 %.
const DISMISS_SHARE = 0.3;
const FLICK_VELOCITY = 0.4;
const VELOCITY_WINDOW = 100;
const RUBBER_BAND = 0.3;

export interface SheetSample {
  /** Time, ms. */
  t: number;
  /** Pointer position, px. */
  y: number;
}

/** Speed of the last 100 ms in px/ms, positive downwards; a finger that has stopped has none. */
export function sheetReleaseVelocity(samples: readonly SheetSample[], now: number): number {
  const recent = samples.filter((sample) => now - sample.t <= VELOCITY_WINDOW);
  const first = recent[0];
  const last = recent.at(-1);
  if (!first || !last || last.t === first.t) return 0;
  return (last.y - first.y) / (last.t - first.t);
}

/**
 * Where a released bottom sheet goes: index of a detent in `heights` (px, lowest first) or `null` to close.
 * A flick moves to the next detent in its direction; a slow release settles on the nearest one.
 */
export function sheetReleaseTarget(heights: readonly number[], height: number, velocity: number): number | null {
  if (velocity >= FLICK_VELOCITY) {
    const below = heights.findLastIndex((detent) => detent < height);
    return below === -1 ? null : below;
  }
  if (velocity <= -FLICK_VELOCITY) {
    const above = heights.findIndex((detent) => detent > height);
    return above === -1 ? heights.length - 1 : above;
  }
  if (height < (heights[0] ?? 0) * (1 - DISMISS_SHARE)) return null;
  let nearest = 0;
  heights.forEach((detent, index) => {
    if (Math.abs(detent - height) < Math.abs((heights[nearest] ?? 0) - height)) nearest = index;
  });
  return nearest;
}

const detentShare: Record<SheetDetent, number> = { medium: 0.5, large: 0.92 };

/* ---------- Root ---------- */

const ActionsContext = createContext<RefObject<BaseDialog.Root.Actions | null> | null>(null);
const SideContext = createContext<SheetSide>('right');

/** Modal root: focus stays inside, Esc and a backdrop click close it, focus returns to the trigger. */
export function Sheet({ actionsRef, ...props }: BaseDialog.Root.Props) {
  const ownActionsRef = useRef<BaseDialog.Root.Actions>(null);
  const actions = actionsRef ?? ownActionsRef;
  return (
    <ActionsContext value={actions}>
      <BaseDialog.Root actionsRef={actions} {...props} />
    </ActionsContext>
  );
}

export const SheetTrigger = BaseDialog.Trigger;
export const SheetClose = BaseDialog.Close;

/* ---------- Content ---------- */

export interface SheetContentProps extends Omit<BaseDialog.Popup.Props, 'className'> {
  /** right / left: floating side panel · bottom: phone sheet with detents and a drag gesture. */
  side?: SheetSide;
  /** Side sheet width: 440 or 560 px. */
  size?: 'md' | 'lg';
  /** Bottom sheet: heights it can rest at; the grabber switches between them. */
  detents?: readonly SheetDetent[];
  /** Bottom sheet: the detent it opens at (default — the lowest). */
  defaultDetent?: SheetDetent;
  className?: string;
}

export function SheetContent({
  side = 'right',
  size = 'md',
  detents = SHEET_DETENTS,
  defaultDetent,
  className,
  ...props
}: SheetContentProps) {
  return (
    <SideContext value={side}>
      <BaseDialog.Portal>
        {side === 'bottom' ? (
          <BottomSheet detents={detents} defaultDetent={defaultDetent} className={className} {...props} />
        ) : (
          <>
            <BaseDialog.Backdrop className={backdrop} />
            {/* Floats 8px from the viewport edges, r28, modal shadow; slides in 300ms ease-fluid, out 250ms. */}
            <BaseDialog.Popup
              data-slot="sheet"
              data-side={side}
              className={cn(
                'kv-sheet fixed inset-y-2 z-50 flex max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-3xl bg-overlay text-fg-1 shadow-modal outline-none',
                side === 'right' ? 'right-2' : 'left-2',
                size === 'md' ? 'w-[440px]' : 'w-[560px]',
                className,
              )}
              {...props}
            />
          </>
        )}
      </BaseDialog.Portal>
    </SideContext>
  );
}

const dragHandles = '[data-slot="sheet-grabber"], [data-slot="sheet-header"]';
const interactive = 'button, a, input, textarea, select, label, [role="button"], [role="slider"], [contenteditable="true"]';
const textEntry = 'input, textarea, select, [role="slider"], [contenteditable="true"]';

interface SheetDrag {
  startY: number;
  /** Detent heights for this gesture, px, lowest first. */
  heights: number[];
  start: number;
  /** Height the finger asks for, before resistance. */
  height: number;
  samples: SheetSample[];
}

interface BottomSheetProps extends Omit<BaseDialog.Popup.Props, 'className'> {
  detents: readonly SheetDetent[];
  defaultDetent?: SheetDetent;
  className?: string;
}

/**
 * Top r36, grabber 36×5. Drags 1:1 from the grabber and the header, from the body only when its list is
 * scrolled to the top. Rests at a detent on spring-gentle; leaves in 250ms ease-fluid from where it was let go.
 */
function BottomSheet({ detents, defaultDetent, className, children, ...props }: BottomSheetProps) {
  const ordered = SHEET_DETENTS.filter((detent) => detents.includes(detent));
  const [detent, setDetent] = useState<SheetDetent>(
    defaultDetent && ordered.includes(defaultDetent) ? defaultDetent : (ordered[0] ?? 'medium'),
  );
  const index = Math.max(ordered.indexOf(detent), 0);
  const actionsRef = use(ActionsContext);
  const popupRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const latest = useRef({ ordered, index });

  useLayoutEffect(() => {
    latest.current = { ordered, index };
  });

  useEffect(() => {
    const popup = popupRef.current;
    if (!popup) return undefined;
    const doc = popup.ownerDocument;
    let drag: SheetDrag | null = null;
    let pending: { x: number; y: number; body: HTMLElement } | null = null;
    let stopPointer: (() => void) | null = null;

    const begin = (y: number) => {
      const { ordered: list, index: current } = latest.current;
      const viewport = doc.defaultView?.innerHeight ?? 0;
      const heights = list.map((item) => detentShare[item] * viewport);
      const start = heights[current] ?? 0;
      drag = { startY: y, heights, start, height: start, samples: [{ t: performance.now(), y }] };
      draggedRef.current = false;
      popup.setAttribute('data-dragging', '');
      backdropRef.current?.setAttribute('data-dragging', '');
    };

    const move = (y: number) => {
      if (!drag) return;
      const lowest = drag.heights[0] ?? 0;
      const highest = drag.heights.at(-1) ?? 0;
      const height = drag.start - (y - drag.startY);
      const shown = height > highest ? highest + (height - highest) * RUBBER_BAND : Math.max(height, lowest);
      const offset = Math.max(lowest - height, 0);
      const now = performance.now();
      drag.height = height;
      drag.samples = [...drag.samples.filter((sample) => now - sample.t <= VELOCITY_WINDOW), { t: now, y }];
      if (Math.abs(y - drag.startY) > 3) draggedRef.current = true;
      popup.style.setProperty('--kv-sheet-drag-height', `${shown}px`);
      popup.style.setProperty('--kv-sheet-drag-offset', `${offset}px`);
      backdropRef.current?.style.setProperty('--kv-sheet-progress', String(lowest > 0 ? Math.min(offset / lowest, 1) : 0));
    };

    const end = () => {
      if (!drag) return;
      const { heights, height, samples } = drag;
      drag = null;
      // The click that follows this release is swallowed by the grabber; later clicks and Enter are not.
      setTimeout(() => {
        draggedRef.current = false;
      });
      const now = performance.now();
      const last = samples.at(-1);
      const velocity = sheetReleaseVelocity(last ? [...samples, { t: now, y: last.y }] : samples, now);
      const target = sheetReleaseTarget(heights, height, velocity);
      popup.removeAttribute('data-dragging');
      backdropRef.current?.removeAttribute('data-dragging');
      // Closing keeps the drag offset, so the exit starts where the finger let go.
      if (target === null) {
        actionsRef?.current?.close();
        return;
      }
      popup.style.removeProperty('--kv-sheet-drag-height');
      popup.style.removeProperty('--kv-sheet-drag-offset');
      backdropRef.current?.style.removeProperty('--kv-sheet-progress');
      const next = latest.current.ordered[target];
      if (next) setDetent(next);
    };

    // Mouse, pen and touch on the grabber and header (touch-action: none there).
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (event.button !== 0 || drag || !target?.closest(dragHandles)) return;
      if (target.closest(interactive) && !target.closest('[data-slot="sheet-grabber"]')) return;
      begin(event.clientY);
      const onMove = (moveEvent: PointerEvent) => move(moveEvent.clientY);
      const onUp = () => {
        stopPointer?.();
        end();
      };
      stopPointer = () => {
        doc.removeEventListener('pointermove', onMove);
        doc.removeEventListener('pointerup', onUp);
        doc.removeEventListener('pointercancel', onUp);
        stopPointer = null;
      };
      doc.addEventListener('pointermove', onMove);
      doc.addEventListener('pointerup', onUp);
      doc.addEventListener('pointercancel', onUp);
    };

    // Touch on the body: the list scrolls first; the sheet moves once the list is at its top.
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const target = event.target instanceof Element ? event.target : null;
      const body = target?.closest<HTMLElement>('[data-slot="sheet-body"]');
      pending = touch && event.touches.length === 1 && body && !target?.closest(textEntry) ? { x: touch.clientX, y: touch.clientY, body } : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      if (pending) {
        const { x, y, body } = pending;
        const dx = touch.clientX - x;
        const dy = touch.clientY - y;
        if (dx === 0 && dy === 0) return;
        pending = null;
        const scrollable = body.scrollHeight > body.clientHeight;
        if (Math.abs(dx) > Math.abs(dy) || (scrollable && (dy < 0 || body.scrollTop > 0))) return;
        begin(y);
      }
      if (!drag) return;
      if (event.cancelable) event.preventDefault();
      move(touch.clientY);
    };
    const onTouchEnd = () => {
      pending = null;
      end();
    };

    popup.addEventListener('pointerdown', onPointerDown);
    popup.addEventListener('touchstart', onTouchStart, { passive: true });
    popup.addEventListener('touchmove', onTouchMove, { passive: false });
    popup.addEventListener('touchend', onTouchEnd);
    popup.addEventListener('touchcancel', onTouchEnd);
    return () => {
      stopPointer?.();
      popup.removeEventListener('pointerdown', onPointerDown);
      popup.removeEventListener('touchstart', onTouchStart);
      popup.removeEventListener('touchmove', onTouchMove);
      popup.removeEventListener('touchend', onTouchEnd);
      popup.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [actionsRef]);

  const largest = index === ordered.length - 1;
  const pill = 'h-[5px] w-9 rounded-full bg-fg-4/50';

  return (
    <>
      <BaseDialog.Backdrop ref={backdropRef} className={cn(backdrop, 'kv-sheet-backdrop')} />
      <BaseDialog.Popup
        ref={popupRef}
        data-slot="sheet"
        data-side="bottom"
        data-detent={detent}
        className={cn(
          'kv-bottom-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-160 flex-col overflow-hidden rounded-t-4xl bg-overlay text-fg-1 outline-none',
          'shadow-[0_0_0_1px_var(--color-hairline),0_-12px_40px_-12px_oklch(var(--ink)/0.24)] dark:shadow-[0_0_0_1px_var(--color-hairline),0_-12px_40px_-12px_oklch(0_0_0/0.5)]',
          className,
        )}
        {...props}
      >
        {ordered.length > 1 ? (
          <button
            type="button"
            data-slot="sheet-grabber"
            aria-label={largest ? 'Свернуть шит' : 'Развернуть шит'}
            onClick={() => {
              if (draggedRef.current) {
                draggedRef.current = false;
                return;
              }
              setDetent(ordered[(index + 1) % ordered.length] ?? detent);
            }}
            className="group flex h-4 w-full shrink-0 cursor-grab touch-none justify-center pt-1.5 focus-visible:outline-none"
          >
            <span className={cn(pill, 'group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ring')} />
          </button>
        ) : (
          <div data-slot="sheet-grabber" aria-hidden className="flex h-4 shrink-0 cursor-grab touch-none justify-center pt-1.5">
            <span className={pill} />
          </div>
        )}
        {children}
      </BaseDialog.Popup>
    </>
  );
}

/* ---------- Parts ---------- */

export interface SheetHeaderProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** Bottom sheet: an action before the centred title — «Сбросить» or a back chevron. */
  leading?: ReactNode;
}

export function SheetHeader({ title, description, leading, className, ...props }: SheetHeaderProps) {
  const side = use(SideContext);
  if (side !== 'bottom') {
    return (
      <div data-slot="sheet-header" className={cn('flex items-start gap-3 px-6 pt-5 pb-4', className)} {...props}>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <BaseDialog.Title className="text-heading-md font-semibold">{title}</BaseDialog.Title>
          {description ? <BaseDialog.Description className="text-body-xs text-fg-3">{description}</BaseDialog.Description> : null}
        </div>
        <BaseDialog.Close render={<CloseButton className="-mr-2" />} />
      </div>
    );
  }
  // Phone header: the whole header drags the sheet; a leading action centres the title (iOS).
  const centred = Boolean(leading);
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex shrink-0 touch-none gap-3 pr-4', centred ? 'h-13 items-center pl-4' : 'items-start pt-2 pl-5', className)}
      {...props}
    >
      {centred ? <div className="flex w-21 shrink-0">{leading}</div> : null}
      <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', centred && 'items-center text-center')}>
        <BaseDialog.Title className={cn('font-semibold tracking-[-0.01em]', centred ? 'text-[17px]/[22px]' : 'text-[22px]/[28px]')}>
          {title}
        </BaseDialog.Title>
        {description ? <BaseDialog.Description className="text-body-sm text-fg-3">{description}</BaseDialog.Description> : null}
      </div>
      <div className={cn('flex shrink-0 justify-end', centred && 'w-21')}>
        <BaseDialog.Close render={<CloseButton appearance="filled" className="size-9!" />} />
      </div>
    </div>
  );
}

export function SheetBody({ className, ...props }: ComponentProps<'div'>) {
  const side = use(SideContext);
  return (
    <div
      data-slot="sheet-body"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain',
        side === 'bottom' ? 'px-4 pt-2 pb-4' : 'px-6 pb-6',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Sticky footer. Side sheet: actions on the right (give a destructive one `className="mr-auto"`).
 * Bottom sheet: actions share the width, above the home indicator.
 */
export function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  const side = use(SideContext);
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        side === 'bottom'
          ? 'flex shrink-0 items-center gap-2 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] *:flex-1'
          : 'flex items-center justify-end gap-2 border-t border-separator px-6 py-4',
        className,
      )}
      {...props}
    />
  );
}
