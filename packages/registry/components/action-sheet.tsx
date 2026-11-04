import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createContext, use, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';
import { sheetReleaseVelocity, type SheetSample } from './sheet';

// Paper «Закрытие жестом»: close past 35 % of the sheet or on an 800 pt/s flick; a pull up moves it by 30 %.
const DISMISS_SHARE = 0.35;
const FLICK_VELOCITY = 0.8;
const RUBBER_BAND = 0.3;
// a press that moves less than this stays a tap
const DRAG_SLOP = 6;

const list = '[data-slot="action-sheet-list"]';
const textEntry = 'input, textarea, select, [contenteditable="true"]';
const focusRing = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring';

const reducedMotion = (element: Element) =>
  element.closest('[data-reduce-motion]') !== null || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Root ---------- */

interface RootContextValue {
  actionsRef: RefObject<BaseDialog.Root.Actions | null>;
  /** Registers the way back while a second level is open: Esc then goes back instead of closing. */
  setBack: (back: (() => void) | null) => void;
}

const RootContext = createContext<RootContextValue | null>(null);

/** Phone list of actions about one thing; Esc, the scrim, a swipe down and «Отмена» close it. */
export function ActionSheet({ actionsRef, onOpenChange, ...props }: BaseDialog.Root.Props) {
  const ownActionsRef = useRef<BaseDialog.Root.Actions>(null);
  const actions = actionsRef ?? ownActionsRef;
  const backRef = useRef<(() => void) | null>(null);
  return (
    <RootContext
      value={{
        actionsRef: actions,
        setBack: (back) => {
          backRef.current = back;
        },
      }}
    >
      <BaseDialog.Root
        actionsRef={actions}
        onOpenChange={(open, details) => {
          const back = backRef.current;
          if (!open && details.reason === 'escape-key' && back) {
            details.cancel();
            back();
            return;
          }
          onOpenChange?.(open, details);
        }}
        {...props}
      />
    </RootContext>
  );
}

export const ActionSheetTrigger = BaseDialog.Trigger;

/* ---------- Content ---------- */

interface LevelContextValue {
  /** Id of the open second level, `null` on the first. */
  level: string | null;
  host: HTMLElement | null;
  title: string;
  open: (id: string, opener: HTMLElement) => void;
  back: () => void;
}

const LevelContext = createContext<LevelContextValue | null>(null);

export interface ActionSheetContentProps extends Omit<BaseDialog.Popup.Props, 'className' | 'title'> {
  /** What the actions are about: «Айдентика для пекарни». Read as «Действия: …». */
  title: string;
  description?: ReactNode;
  /** Text of the separate cancel plaque. */
  cancelLabel?: string;
  className?: string;
}

/**
 * Overlay r28, 8 from the edges and above the safe area; groups split by an 8px band; cancel is its own plaque.
 * Drags down 1:1 from anywhere (a list scrolled away from its top scrolls first) and closes past 35 % or on a flick.
 */
export function ActionSheetContent(props: ActionSheetContentProps) {
  return (
    <BaseDialog.Portal>
      <ActionSheetPopup {...props} />
    </BaseDialog.Portal>
  );
}

const listClass = 'flex min-h-0 flex-col overflow-y-auto overscroll-contain';

// Mounted only while open, so the level and the drag start fresh every time.
function ActionSheetPopup({ title, description, cancelLabel = 'Отмена', className, children, ...props }: ActionSheetContentProps) {
  const root = use(RootContext);
  const popupRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [returned, setReturned] = useState(false);
  // panel height before a level change, for the height transition
  const fromHeight = useRef<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const change = (next: string | null) => {
    fromHeight.current = panelRef.current?.getBoundingClientRect().height ?? null;
    setReturned(next === null);
    setLevel(next);
  };
  const levels: LevelContextValue = {
    level,
    host,
    title,
    open: (id, element) => {
      opener.current = element;
      change(id);
    },
    back: () => change(null),
  };

  useLayoutEffect(() => {
    if (!root) return undefined;
    root.setBack(level === null ? null : () => change(null));
    return () => root.setBack(null);
  });

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const start = fromHeight.current;
    fromHeight.current = null;
    if (level === null && opener.current) {
      opener.current.focus();
      opener.current = null;
    }
    if (!panel || start === null || reducedMotion(panel)) return;
    panel.style.height = '';
    const end = panel.getBoundingClientRect().height;
    if (Math.abs(end - start) < 1) return;
    panel.style.height = `${start}px`;
    // flush the start height so the change below is transitioned
    panel.getBoundingClientRect();
    panel.style.transition = 'height var(--spring-smooth)';
    panel.style.height = `${end}px`;
    const done = (event: TransitionEvent) => {
      if (event.target !== panel || event.propertyName !== 'height') return;
      panel.style.height = '';
      panel.style.transition = '';
      panel.removeEventListener('transitionend', done);
    };
    panel.addEventListener('transitionend', done);
  }, [level]);

  useEffect(() => {
    const popup = popupRef.current;
    if (!popup) return undefined;
    let drag: { source: 'pointer' | 'touch'; startY: number; height: number; offset: number; samples: SheetSample[] } | null = null;
    let pressed: { id: number; x: number; y: number } | null = null;
    let pending: { x: number; y: number; list: HTMLElement } | null = null;
    // the click that follows a drag must not run the item under the finger
    let dragged = false;

    const begin = (source: 'pointer' | 'touch', y: number) => {
      drag = { source, startY: y, height: popup.getBoundingClientRect().height, offset: 0, samples: [{ t: performance.now(), y }] };
      dragged = true;
      popup.setAttribute('data-dragging', '');
      popup.style.transition = 'none';
      const backdrop = backdropRef.current;
      if (backdrop) backdrop.style.transition = 'none';
    };

    const move = (y: number) => {
      if (!drag) return;
      const offset = y - drag.startY;
      const now = performance.now();
      drag.offset = offset;
      drag.samples = [...drag.samples.filter((sample) => now - sample.t <= 100), { t: now, y }];
      popup.style.translate = `0 ${offset >= 0 ? offset : offset * RUBBER_BAND}px`;
      const backdrop = backdropRef.current;
      if (backdrop) backdrop.style.opacity = String(1 - Math.min(Math.max(offset / (drag.height || 1), 0), 1));
    };

    const end = (cancelled: boolean) => {
      if (!drag) return;
      const { offset, height, samples } = drag;
      drag = null;
      setTimeout(() => {
        dragged = false;
      });
      popup.removeAttribute('data-dragging');
      const backdrop = backdropRef.current;
      const now = performance.now();
      const last = samples.at(-1);
      const velocity = sheetReleaseVelocity(last ? [...samples, { t: now, y: last.y }] : samples, now);
      const dismiss =
        !cancelled && offset > 0 && (velocity >= FLICK_VELOCITY || (offset >= height * DISMISS_SHARE && velocity > -FLICK_VELOCITY));
      if (dismiss) {
        // leaves from where it was let go
        popup.style.transition = 'translate var(--duration-moderate) var(--ease-fluid)';
        popup.style.translate = '0 calc(100% + 16px)';
        if (backdrop) {
          backdrop.style.transition = 'opacity var(--duration-moderate) var(--ease-fluid)';
          backdrop.style.opacity = '0';
        }
        root?.actionsRef.current?.close();
        return;
      }
      popup.style.transition = 'translate var(--spring-smooth)';
      popup.style.translate = '';
      if (backdrop) {
        backdrop.style.transition = '';
        backdrop.style.opacity = '';
      }
      const settled = (event: TransitionEvent) => {
        if (event.target !== popup || event.propertyName !== 'translate') return;
        popup.style.transition = '';
        popup.removeEventListener('transitionend', settled);
      };
      popup.addEventListener('transitionend', settled);
    };

    // Mouse, pen and touch outside the list (touch-action: none there); captured once the drag starts.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (event.button !== 0 || drag || !target || target.closest(textEntry)) return;
      if (event.pointerType === 'touch' && target.closest(list)) return;
      pressed = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pressed || event.pointerId !== pressed.id) return;
      if (!drag) {
        const dx = event.clientX - pressed.x;
        const dy = event.clientY - pressed.y;
        if (Math.hypot(dx, dy) < DRAG_SLOP) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          pressed = null;
          return;
        }
        begin('pointer', pressed.y);
        try {
          popup.setPointerCapture?.(event.pointerId);
        } catch {
          // a pointer that is already gone cannot be captured; the drag still works without it
        }
      }
      if (drag?.source === 'pointer') move(event.clientY);
    };
    const onPointerEnd = (event: PointerEvent) => {
      if (!pressed || event.pointerId !== pressed.id) return;
      pressed = null;
      if (drag?.source === 'pointer') end(event.type === 'pointercancel');
    };

    // Touch on the list: it scrolls first; the sheet moves once the list is at its top or cannot scroll.
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const target = event.target instanceof Element ? event.target : null;
      const scroller = target?.closest<HTMLElement>(list);
      pending =
        touch && event.touches.length === 1 && scroller && !drag && !target?.closest(textEntry)
          ? { x: touch.clientX, y: touch.clientY, list: scroller }
          : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      if (pending) {
        const { x, y, list: scroller } = pending;
        const dx = touch.clientX - x;
        const dy = touch.clientY - y;
        if (Math.hypot(dx, dy) < DRAG_SLOP) return;
        pending = null;
        const scrollable = scroller.scrollHeight > scroller.clientHeight;
        if (Math.abs(dx) > Math.abs(dy) || (scrollable && (dy < 0 || scroller.scrollTop > 0))) return;
        begin('touch', y);
      }
      if (drag?.source !== 'touch') return;
      if (event.cancelable) event.preventDefault();
      move(touch.clientY);
    };
    const onTouchEnd = (event: TouchEvent) => {
      pending = null;
      if (drag?.source === 'touch') end(event.type === 'touchcancel');
    };

    const onClick = (event: MouseEvent) => {
      if (!dragged) return;
      dragged = false;
      event.preventDefault();
      event.stopPropagation();
    };

    popup.addEventListener('pointerdown', onPointerDown);
    popup.addEventListener('pointermove', onPointerMove);
    popup.addEventListener('pointerup', onPointerEnd);
    popup.addEventListener('pointercancel', onPointerEnd);
    popup.addEventListener('touchstart', onTouchStart, { passive: true });
    popup.addEventListener('touchmove', onTouchMove, { passive: false });
    popup.addEventListener('touchend', onTouchEnd);
    popup.addEventListener('touchcancel', onTouchEnd);
    popup.addEventListener('click', onClick, true);
    return () => {
      popup.removeEventListener('pointerdown', onPointerDown);
      popup.removeEventListener('pointermove', onPointerMove);
      popup.removeEventListener('pointerup', onPointerEnd);
      popup.removeEventListener('pointercancel', onPointerEnd);
      popup.removeEventListener('touchstart', onTouchStart);
      popup.removeEventListener('touchmove', onTouchMove);
      popup.removeEventListener('touchend', onTouchEnd);
      popup.removeEventListener('touchcancel', onTouchEnd);
      popup.removeEventListener('click', onClick, true);
    };
  }, [root]);

  return (
    <>
      <BaseDialog.Backdrop ref={backdropRef} className="kv-backdrop fixed inset-0 z-50 bg-scrim" />
      <BaseDialog.Popup
        ref={popupRef}
        data-slot="action-sheet"
        data-side="bottom"
        data-level={level === null ? 'root' : 'nested'}
        initialFocus={titleRef}
        className={cn(
          'kv-sheet fixed inset-x-2 select-none bottom-[calc(env(safe-area-inset-bottom)+8px)] z-50 mx-auto flex max-h-[calc(100dvh-64px-env(safe-area-inset-bottom))] max-w-md flex-col gap-2 outline-none',
          className,
        )}
        {...props}
      >
        <div
          ref={panelRef}
          data-slot="action-sheet-panel"
          className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-overlay text-fg-1 shadow-[0_0_0_1px_var(--color-hairline),0_-8px_32px_-12px_oklch(var(--ink)/0.28)] dark:shadow-[0_0_0_1px_var(--color-hairline),0_-8px_32px_-12px_oklch(0_0_0/0.5)]"
        >
          <div
            hidden={level !== null}
            className={cn(
              'flex min-h-0 flex-col',
              returned &&
                'transition-[opacity,translate] duration-(--duration-base) ease-out starting:translate-x-[calc(var(--shift-xl)*-1)] starting:opacity-0',
            )}
          >
            <div
              data-slot="action-sheet-header"
              className="flex shrink-0 touch-none flex-col items-center gap-0.5 border-b border-separator px-5 pt-4 pb-3.5 text-center"
            >
              <BaseDialog.Title ref={titleRef} tabIndex={-1} className="text-[15px]/5 font-semibold text-fg-1 outline-none">
                <span className="sr-only">{`Действия: ${title}`}</span>
                <span aria-hidden>{title}</span>
              </BaseDialog.Title>
              {description ? <BaseDialog.Description className="text-body-xs text-fg-3 tabular-nums">{description}</BaseDialog.Description> : null}
            </div>
            <div data-slot="action-sheet-list" className={listClass}>
              <LevelContext value={levels}>{children}</LevelContext>
            </div>
          </div>
          <div ref={setHost} className="flex min-h-0 flex-col empty:hidden" />
        </div>
        <BaseDialog.Close
          data-slot="action-sheet-cancel"
          className={cn(
            'h-14 shrink-0 touch-none rounded-3xl bg-overlay text-[17px]/[22px] font-semibold tracking-[-0.01em] text-fg-1 shadow-[0_0_0_1px_var(--color-hairline),0_8px_24px_-8px_oklch(var(--ink)/0.16)] active:bg-surface-2',
            focusRing,
          )}
        >
          {cancelLabel}
        </BaseDialog.Close>
      </BaseDialog.Popup>
    </>
  );
}

/* ---------- Parts ---------- */

/** A run of related actions; the next group starts after an 8px fill-1 band between separators. */
export function ActionSheetGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="action-sheet-group"
      role="group"
      className={cn(
        'flex shrink-0 flex-col py-1.5',
        // the band sits in the top margin of every group after the first
        '[[data-slot=action-sheet-group]+&]:relative [[data-slot=action-sheet-group]+&]:mt-2 [[data-slot=action-sheet-group]+&]:before:absolute [[data-slot=action-sheet-group]+&]:before:inset-x-0 [[data-slot=action-sheet-group]+&]:before:-top-2 [[data-slot=action-sheet-group]+&]:before:h-2 [[data-slot=action-sheet-group]+&]:before:border-y [[data-slot=action-sheet-group]+&]:before:border-separator [[data-slot=action-sheet-group]+&]:before:bg-fill-1',
        className,
      )}
      {...props}
    />
  );
}

interface ItemButtonProps extends Omit<ComponentProps<'button'>, 'type' | 'value'> {
  icon?: ReactNode;
  value?: ReactNode;
  destructive?: boolean;
  chevron?: boolean;
}

/** Action 52: icon slot 24, label 17/500, then the value 15 fg-3 and a chevron 16 when it leads further. */
function ItemButton({ icon, value, destructive, chevron, className, children, ...props }: ItemButtonProps) {
  return (
    <button
      type="button"
      data-slot="action-sheet-item"
      className={cn(
        'flex h-13 w-full shrink-0 items-center gap-3.5 px-5 text-left active:bg-fill-2 disabled:pointer-events-none disabled:opacity-50',
        focusRing,
        destructive ? 'text-danger-soft-fg' : 'text-fg-1',
        className,
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden className={cn('grid size-6 shrink-0 place-items-center [&_svg]:size-5.5 [&_svg]:stroke-[1.75]', !destructive && 'text-fg-2')}>
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-[17px]/[22px] font-medium tracking-[-0.01em]">{children}</span>
      {value !== undefined ? <span className="shrink-0 text-[15px]/5 text-fg-3">{value}</span> : null}
      {chevron || value !== undefined ? <ChevronRight aria-hidden className="size-4 shrink-0 stroke-2 text-fg-4" /> : null}
    </button>
  );
}

export interface ActionSheetItemProps extends Omit<ComponentProps<'button'>, 'type' | 'value'> {
  icon?: ReactNode;
  /** Current value after the label: «Переговоры»; adds a chevron — the item leads further. */
  value?: ReactNode;
  /** Danger text; keep it behind a confirmation. */
  destructive?: boolean;
  /** Keep the sheet open after the action (a toggle, a picker of its own). */
  keepOpen?: boolean;
}

export function ActionSheetItem({ keepOpen, ...props }: ActionSheetItemProps) {
  const item = <ItemButton {...props} />;
  return keepOpen ? item : <BaseDialog.Close render={item} />;
}

export interface ActionSheetSubProps {
  /** Item label and the title of the nested level: «Ещё». */
  label: string;
  icon?: ReactNode;
  /** What is inside, after the label: «В архив, удалить». */
  value?: ReactNode;
  disabled?: boolean;
  /** Groups and items of the second level. */
  children: ReactNode;
}

/**
 * An item that opens a second level in the same sheet: back chevron 44, its label as the title and the subject under
 * it. Focus moves to the title; «Назад» or Esc returns to the first level and to this item.
 */
export function ActionSheetSub({ label, icon, value, disabled, children }: ActionSheetSubProps) {
  const levels = use(LevelContext);
  const id = useId();
  return (
    <>
      <ItemButton icon={icon} value={value} chevron disabled={disabled} onClick={(event) => levels?.open(id, event.currentTarget)}>
        {label}
      </ItemButton>
      {levels && levels.level === id && levels.host
        ? createPortal(
            <SubLevel label={label} subject={levels.title} onBack={levels.back}>
              {children}
            </SubLevel>,
            levels.host,
          )
        : null}
    </>
  );
}

function SubLevel({ label, subject, onBack, children }: { label: string; subject: string; onBack: () => void; children: ReactNode }) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <div
      data-slot="action-sheet-level"
      role="group"
      aria-labelledby={headingId}
      className="flex min-h-0 flex-col transition-[opacity,translate] duration-(--duration-base) ease-out starting:translate-x-(--shift-xl) starting:opacity-0"
    >
      <div data-slot="action-sheet-header" className="flex shrink-0 touch-none items-center gap-1 border-b border-separator py-2 pr-3 pl-1">
        <button
          type="button"
          data-slot="action-sheet-back"
          aria-label="Назад"
          onClick={onBack}
          className={cn('grid size-11 shrink-0 place-items-center rounded-full text-accent active:bg-fill-2', focusRing)}
        >
          <ChevronLeft aria-hidden className="size-5 stroke-2" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 id={headingId} ref={headingRef} tabIndex={-1} className="truncate text-[15px]/5 font-semibold text-fg-1 outline-none">
            {label}
          </h3>
          <p className="truncate text-body-xs text-fg-3">{subject}</p>
        </div>
      </div>
      <div data-slot="action-sheet-list" className={listClass}>
        {children}
      </div>
    </div>
  );
}
