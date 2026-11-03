import { ChevronUp, GripVertical, Minus, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import { Portal } from './portal';

export const FLOATING_PANEL_CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
export type FloatingPanelCorner = (typeof FLOATING_PANEL_CORNERS)[number];

/** Where the panel sits: the corner it is docked to and its distance from that corner's two edges, px. */
export interface FloatingPanelPosition {
  corner: FloatingPanelCorner;
  x: number;
  y: number;
}

/** Distance from the edges of the window, and how close a drop must be to snap onto it. */
const EDGE = 16;
const STEP = 16;
const LONG_STEP = 64;
const DEFAULT_POSITION: FloatingPanelPosition = { corner: 'bottom-right', x: EDGE, y: EDGE };

function isPosition(value: unknown): value is FloatingPanelPosition {
  if (typeof value !== 'object' || value === null) return false;
  const { corner, x, y } = value as Record<string, unknown>;
  return FLOATING_PANEL_CORNERS.some((item) => item === corner) && typeof x === 'number' && typeof y === 'number';
}

function readSaved(key: string | undefined): FloatingPanelPosition | null {
  if (!key || typeof window === 'undefined') return null;
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(key) ?? 'null');
    return isPosition(saved) ? saved : null;
  } catch {
    return null;
  }
}

const offsets = ({ corner, x, y }: FloatingPanelPosition): CSSProperties => ({
  [corner.endsWith('left') ? 'left' : 'right']: x,
  [corner.startsWith('top') ? 'top' : 'bottom']: y,
});

/** Keeps the panel 16 from the edges, snaps within 16 of that line and docks it to the corner nearest its centre. */
function dock(left: number, top: number, width: number, height: number, areaWidth: number, areaHeight: number): FloatingPanelPosition {
  const fit = (start: number, size: number, area: number) => {
    const max = Math.max(EDGE, area - size - EDGE);
    const clamped = Math.min(Math.max(start, EDGE), max);
    if (clamped - EDGE < EDGE) return EDGE;
    if (max - clamped < EDGE) return max;
    return clamped;
  };
  const x = fit(left, width, areaWidth);
  const y = fit(top, height, areaHeight);
  const right = x + width / 2 > areaWidth / 2;
  const bottom = y + height / 2 > areaHeight / 2;
  return {
    corner: `${bottom ? 'bottom' : 'top'}-${right ? 'right' : 'left'}`,
    x: Math.round(right ? areaWidth - x - width : x),
    y: Math.round(bottom ? areaHeight - y - height : y),
  };
}

interface Drag {
  pointer: number;
  startX: number;
  startY: number;
  rect: DOMRect;
  dx: number;
  dy: number;
}

export interface FloatingPanelProps {
  title: ReactNode;
  children: ReactNode;
  /** Strip under the body: status and one action, p 10 12. */
  footer?: ReactNode;
  /** Shown next to the title in the collapsed capsule: «2 из 3». */
  badge?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Starting place; a saved one under `storageKey` wins. */
  defaultPosition?: FloatingPanelPosition;
  onPositionChange?: (position: FloatingPanelPosition) => void;
  /** localStorage key to remember where the user left the panel. */
  storageKey?: string;
  /** fixed — over the window, portalled; absolute — inside the nearest positioned parent (a demo stage, a canvas). */
  strategy?: 'fixed' | 'absolute';
  className?: string;
}

/**
 * Window over the workspace: call notes, a timer, a mini chat. Dragged by the header, collapses into a capsule,
 * remembers where it was left. Non-modal: no scrim, no focus trap — the page under it stays usable.
 */
export function FloatingPanel({
  title,
  children,
  footer,
  badge,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  defaultPosition = DEFAULT_POSITION,
  onPositionChange,
  storageKey,
  strategy = 'fixed',
  className,
}: FloatingPanelProps) {
  const titleId = useId();
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [collapsed, setCollapsed] = useControllable(collapsedProp, defaultCollapsed, onCollapsedChange);
  const [position, setPosition] = useState<FloatingPanelPosition>(() => readSaved(storageKey) ?? defaultPosition);
  const [drag, setDrag] = useState<Drag | null>(null);
  // after a drop: the offset from the docked place to where the pointer let go, removed on the next frame by a spring
  const [settle, setSettle] = useState<{ dx: number; dy: number } | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!settle) return;
    // read layout so the drop offset is the style the spring transitions from
    panel.current?.getBoundingClientRect();
    const frame = requestAnimationFrame(() => setSettle(null));
    return () => cancelAnimationFrame(frame);
  }, [settle]);

  const area = (): { width: number; height: number; left: number; top: number } => {
    const parent = strategy === 'absolute' ? panel.current?.offsetParent : null;
    if (parent instanceof HTMLElement) {
      const rect = parent.getBoundingClientRect();
      return { width: parent.clientWidth, height: parent.clientHeight, left: rect.left + parent.clientLeft, top: rect.top + parent.clientTop };
    }
    return { width: window.innerWidth, height: window.innerHeight, left: 0, top: 0 };
  };

  const place = (rect: DOMRect, dx: number, dy: number, animate: boolean) => {
    const bounds = area();
    const left = rect.left - bounds.left + dx;
    const top = rect.top - bounds.top + dy;
    const next = dock(left, top, rect.width, rect.height, bounds.width, bounds.height);
    setPosition(next);
    if (animate) {
      // the spring starts where the pointer let go, measured from the docked place
      const dockedLeft = next.corner.endsWith('left') ? next.x : bounds.width - next.x - rect.width;
      const dockedTop = next.corner.startsWith('top') ? next.y : bounds.height - next.y - rect.height;
      setSettle({ dx: left - dockedLeft, dy: top - dockedTop });
    }
    onPositionChange?.(next);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // private mode or a full quota: the panel still moves, it just will not be remembered
      }
    }
  };

  useEffect(() => {
    if (!drag) return;
    const move = (event: PointerEvent) => {
      if (event.pointerId !== drag.pointer) return;
      setDrag({ ...drag, dx: event.clientX - drag.startX, dy: event.clientY - drag.startY });
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId !== drag.pointer) return;
      setDrag(null);
      place(drag.rect, event.clientX - drag.startX, event.clientY - drag.startY, true);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  });

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target;
    // the header buttons keep their clicks; only the main button drags
    if (event.button !== 0 || (target instanceof Element && target.closest('button:not([data-grip])'))) return;
    const element = panel.current;
    if (!element) return;
    event.preventDefault();
    setSettle(null);
    setDrag({ pointer: event.pointerId, startX: event.clientX, startY: event.clientY, rect: element.getBoundingClientRect(), dx: 0, dy: 0 });
  };

  const nudge = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? LONG_STEP : STEP;
    const delta: Partial<Record<string, [number, number]>> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = delta[event.key];
    const element = panel.current;
    if (!move || !element) return;
    event.preventDefault();
    place(element.getBoundingClientRect(), move[0], move[1], false);
  };

  const toggleCollapsed = () => setCollapsed(!collapsed);

  if (!open) return null;

  const translate = drag ? `${drag.dx}px ${drag.dy}px` : settle ? `${settle.dx}px ${settle.dy}px` : undefined;
  const iconButton =
    'kv-pressable relative grid size-7 shrink-0 place-items-center rounded-full text-fg-2 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-2 hover:text-fg-1 active:bg-fill-3 pointer-coarse:after:absolute pointer-coarse:after:-inset-2 [&_svg]:size-4 [&_svg]:stroke-[1.75]';

  const content = (
    <div
      ref={panel}
      role="dialog"
      aria-modal={false}
      aria-labelledby={titleId}
      data-slot="floating-panel"
      data-collapsed={collapsed || undefined}
      data-dragging={drag ? '' : undefined}
      className={cn(
        strategy === 'fixed' ? 'fixed' : 'absolute',
        'group/panel flex max-h-[calc(100%-32px)] max-w-[calc(100%-32px)] flex-col overflow-hidden bg-overlay text-fg-1 shadow-overlay outline-none [interpolate-size:allow-keywords]',
        // lift 150ms ease-out, collapse 250ms ease-fluid, release on a spring; listed in the order the inline override relies on
        '[transition:scale_var(--duration-quick)_var(--ease-out),box-shadow_var(--duration-quick)_var(--ease-out),width_var(--duration-moderate)_var(--ease-fluid),border-radius_var(--duration-moderate)_var(--ease-fluid),translate_var(--spring-snappy)]',
        'data-dragging:scale-(--scale-lift) data-dragging:shadow-modal',
        collapsed ? 'w-fit rounded-[22px]' : 'w-90 rounded-2xl',
        className,
      )}
      style={{
        ...offsets(position),
        translate,
        // 1:1 under the pointer and at the drop frame; the spring runs once the offset is removed
        transitionProperty: drag || settle ? 'scale, box-shadow' : undefined,
      }}
    >
      <div
        data-slot="floating-panel-header"
        onPointerDown={startDrag}
        className={cn(
          'flex h-control-lg shrink-0 cursor-grab touch-none items-center gap-1 pr-2 pl-1.5 select-none',
          'transition-colors duration-(--duration-quick) ease-out group-data-dragging/panel:cursor-grabbing group-data-dragging/panel:bg-fill-1',
          !collapsed && 'border-b border-separator',
        )}
      >
        <button
          type="button"
          data-grip=""
          aria-label="Переместить панель"
          aria-describedby={`${titleId}-hint`}
          onKeyDown={nudge}
          className="grid h-7 w-6 shrink-0 cursor-grab place-items-center rounded-xs text-fg-4 group-data-dragging/panel:bg-fill-2 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
        >
          <GripVertical aria-hidden />
        </button>
        <span id={`${titleId}-hint`} hidden>
          Стрелки — на 16 пикселей, с Shift — на 64
        </span>
        <h2 id={titleId} data-slot="floating-panel-title" className={cn('min-w-0 truncate text-body-sm/(--leading-label-md) font-semibold', collapsed ? 'pr-1.5' : 'flex-1')}>
          {title}
        </h2>
        {collapsed && badge ? (
          <span data-slot="floating-panel-badge" className="flex h-5 shrink-0 items-center rounded-full bg-fill-2 px-2 text-caption font-medium text-fg-2 tabular-nums">
            {badge}
          </span>
        ) : null}
        <button type="button" aria-label={collapsed ? 'Развернуть' : 'Свернуть'} aria-expanded={!collapsed} onClick={toggleCollapsed} className={iconButton}>
          {collapsed ? <ChevronUp aria-hidden /> : <Minus aria-hidden />}
        </button>
        <button type="button" aria-label="Закрыть" onClick={() => setOpen(false)} className={iconButton}>
          <X aria-hidden />
        </button>
      </div>
      <div
        data-slot="floating-panel-content"
        inert={collapsed}
        className={cn(
          'grid min-h-0 transition-[grid-template-rows,opacity] duration-(--duration-moderate) ease-fluid',
          collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr]',
        )}
      >
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div data-slot="floating-panel-body" className="min-h-0 overflow-y-auto p-4">
            {children}
          </div>
          {footer ? (
            <div data-slot="floating-panel-footer" className="flex shrink-0 items-center gap-2 border-t border-separator py-2.5 pr-3 pl-4">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return strategy === 'fixed' ? <Portal layer="sticky">{content}</Portal> : content;
}
