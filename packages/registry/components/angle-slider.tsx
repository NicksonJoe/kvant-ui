import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';

const plural = new Intl.PluralRules('ru');
/** «1 градус», «2 градуса», «135 градусов». */
const degrees = (n: number) => {
  const rule = plural.select(n);
  return `${n} ${rule === 'one' ? 'градус' : rule === 'few' ? 'градуса' : 'градусов'}`;
};
/** Whole degrees 0–359: 360 → 0, −90 → 270. */
const wrap = (deg: number) => ((Math.round(deg) % 360) + 360) % 360;
const SNAP = 15;

const reducedMotion = () =>
  document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** instant — follows the finger; glide — along the arc the short way, 150 ms; snap — to a tick on the snappy spring. */
type Motion = 'instant' | 'glide' | 'snap';
const easeOut = (t: number) => 1 - (1 - t) ** 3;
// Back-out with a small overshoot stands in for spring-snappy (300 ms, 10 % bounce).
const springOut = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

const SIZES = {
  md: { box: 96, radius: 40, value: 'text-label-lg' },
  lg: { box: 160, radius: 68, value: 'text-heading-lg' },
} as const;

export interface AngleSliderProps {
  value?: number;
  defaultValue?: number;
  /** Every change while turning, 0–359. */
  onValueChange?: (degrees: number) => void;
  /** Once a gesture, a key or the field settles. */
  onValueCommitted?: (degrees: number) => void;
  /** dial — a circle with the number inside; compact — a 32 knob with a field, for panels. */
  variant?: 'dial' | 'compact';
  /** Dial diameter: md 96, lg 160. */
  size?: 'md' | 'lg';
  disabled?: boolean;
  /** Default «Угол». The compact field is named «<label>, градусы». */
  'aria-label'?: string;
  className?: string;
}

/**
 * Circular slider for a direction: 0° at the top, clockwise. Press or drag anywhere on the circle; Shift snaps
 * to 15° and shows the ticks, a double press resets to 0°. Keys: ←→ ±1, Shift ±15, PageUp / PageDown ±45, Home 0, End 359.
 */
export function AngleSlider({
  value,
  defaultValue = 0,
  onValueChange,
  onValueCommitted,
  variant = 'dial',
  size = 'md',
  disabled = false,
  'aria-label': label = 'Угол',
  className,
}: AngleSliderProps) {
  const [angle, setAngle] = useControllable(value === undefined ? undefined : wrap(value), wrap(defaultValue), onValueChange);
  const [motion, setMotion] = useState<Motion>('instant');
  const [shown, setShown] = useState(angle);
  const [dragging, setDragging] = useState<{ shift: boolean } | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const from = useRef(angle);
  const dialRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const display = motion === 'instant' ? angle : shown;

  useEffect(() => {
    if (motion === 'instant') {
      from.current = angle;
      return;
    }
    const start = from.current;
    const delta = ((((angle - start) % 360) + 540) % 360) - 180;
    const duration = motion === 'snap' ? 300 : 150;
    const ease = motion === 'snap' ? springOut : easeOut;
    const t0 = performance.now();
    let frame = requestAnimationFrame(function tick(t) {
      const p = Math.min(1, (t - t0) / duration);
      from.current = (start + delta * ease(p) + 360) % 360;
      setShown(from.current);
      if (p < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [angle, motion]);

  const set = (next: number, how: Motion, commit: boolean) => {
    const deg = wrap(next);
    const moving = how !== 'instant' && !reducedMotion();
    // The animation starts from what is on screen now.
    if (moving) setShown(display);
    setMotion(moving ? how : 'instant');
    if (deg !== angle) setAngle(deg);
    if (commit) onValueCommitted?.(deg);
  };

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = (dialRef.current ?? event.currentTarget).getBoundingClientRect();
    const raw = (Math.atan2(event.clientX - (box.left + box.width / 2), box.top + box.height / 2 - event.clientY) * 180) / Math.PI;
    return event.shiftKey ? Math.round(raw / SNAP) * SNAP : raw;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    // The ring is for keyboard users; a drag only moves focus so the arrows work next.
    thumbRef.current?.focus({ focusVisible: false });
    setDragging({ shift: event.shiftKey });
    set(fromPointer(event), event.shiftKey ? 'snap' : 'glide', false);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    if (dragging.shift !== event.shiftKey) setDragging({ shift: event.shiftKey });
    set(fromPointer(event), event.shiftKey ? 'snap' : 'instant', false);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(null);
    onValueCommitted?.(angle);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    const step = event.shiftKey ? SNAP : 1;
    const moves: Record<string, number> = {
      ArrowRight: angle + step,
      ArrowUp: angle + step,
      ArrowLeft: angle - step,
      ArrowDown: angle - step,
      PageUp: angle + 45,
      PageDown: angle - 45,
      Home: 0,
      End: 359,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setDraft(null);
    set(next, 'instant', true);
  };

  const commitDraft = () => {
    if (draft === null) return;
    const typed = Number.parseInt(draft.replace(/[°\s]/g, ''), 10);
    setDraft(null);
    if (!Number.isNaN(typed)) set(typed, 'instant', true);
  };

  const pointer = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onDoubleClick: () => (disabled ? undefined : set(0, 'glide', true)),
  };
  const thumb = {
    ref: thumbRef,
    role: 'slider',
    tabIndex: disabled ? -1 : 0,
    'aria-label': label,
    'aria-valuemin': 0,
    'aria-valuemax': 359,
    'aria-valuenow': angle,
    'aria-valuetext': degrees(angle),
    'aria-disabled': disabled || undefined,
    onKeyDown,
  } as const;
  const rad = (display * Math.PI) / 180;

  if (variant === 'compact') {
    return (
      <div data-slot="angle-slider" data-variant="compact" className={cn('inline-flex items-center gap-2', disabled && 'opacity-50', className)}>
        <div
          {...thumb}
          {...pointer}
          ref={(node) => {
            thumbRef.current = node;
            dialRef.current = node;
          }}
          data-slot="angle-slider-dial"
          data-dragging={dragging ? '' : undefined}
          className={cn(
            'relative size-8 shrink-0 touch-none rounded-full bg-surface-1 shadow-[inset_0_0_0_1px_var(--color-border),0_1px_2px_oklch(var(--ink)/0.06)] select-none',
            'transition-[background-color,box-shadow] duration-(--duration-fast) ease-hover',
            !disabled && 'hover:bg-surface-2 data-dragging:bg-surface-3 data-dragging:shadow-[inset_0_0_0_1px_var(--color-input)]',
          )}
        >
          <svg aria-hidden width={32} height={32} viewBox="0 0 32 32" className="absolute inset-0">
            <path d={`M16 16 L${16 + 11 * Math.sin(rad)} ${16 - 11 * Math.cos(rad)}`} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" />
            <circle cx={16} cy={16} r={2} fill="var(--color-accent)" />
          </svg>
        </div>
        <label className="flex h-8 w-18 shrink-0 items-center gap-1 rounded-full bg-surface-1 px-2.5 text-body-xs shadow-[inset_0_0_0_1px_var(--color-border)] transition-shadow duration-(--duration-fast) ease-hover focus-within:shadow-[inset_0_0_0_1px_var(--color-ring),0_0_0_1px_var(--color-ring)]">
          <input
            data-slot="angle-slider-input"
            aria-label={`${label}, градусы`}
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            value={draft ?? String(angle)}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitDraft();
              else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') onKeyDown(event);
            }}
            className="min-w-0 flex-1 bg-transparent text-fg-1 tabular-nums outline-none disabled:cursor-not-allowed"
          />
          <span aria-hidden className="text-fg-3">
            °
          </span>
        </label>
      </div>
    );
  }

  const { box, radius, value: valueText } = SIZES[size];
  const c = box / 2;
  const at = (deg: number, r: number) => [c + r * Math.sin((deg * Math.PI) / 180), c - r * Math.cos((deg * Math.PI) / 180)] as const;
  const [ex, ey] = at(display, radius);
  const arc = display < 0.5 ? null : `M${c} ${c - radius} A${radius} ${radius} 0 ${display > 180 ? 1 : 0} 1 ${ex} ${ey}`;
  // Ticks sit inside the track: every 45° longer and darker, scaled from the 160 dial.
  const k = radius / 68;
  const ticks = (major: boolean) =>
    Array.from({ length: 24 }, (_, i) => i * SNAP)
      .filter((deg) => (deg % 45 === 0) === major)
      .map((deg) => {
        const [x1, y1] = at(deg, radius - (major ? 13 : 10) * k);
        const [x2, y2] = at(deg, radius - 6 * k);
        return `M${x1} ${y1}L${x2} ${y2}`;
      })
      .join('');

  return (
    <div data-slot="angle-slider" data-variant="dial" className={cn('inline-flex', disabled && 'opacity-50', className)}>
      <div
        {...pointer}
        ref={dialRef}
        data-slot="angle-slider-dial"
        data-dragging={dragging ? '' : undefined}
        className="group/dial relative shrink-0 touch-none rounded-full select-none"
        style={{ width: box, height: box }}
      >
        <svg aria-hidden width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="absolute inset-0">
          <circle cx={c} cy={c} r={radius} fill="none" stroke="var(--color-fill-3)" strokeWidth={4} />
          {dragging ? (
            <g data-slot="angle-slider-ticks" fill="none" strokeWidth={1.5} strokeLinecap="round">
              <path d={ticks(false)} stroke="var(--color-fill-3)" />
              <path d={ticks(true)} stroke="var(--color-fg-4)" />
            </g>
          ) : null}
          {display > 359.5 ? (
            <circle cx={c} cy={c} r={radius} fill="none" strokeWidth={4} className={cn('stroke-accent', !disabled && 'group-hover/dial:stroke-accent-hover group-data-dragging/dial:stroke-accent-hover')} />
          ) : arc ? (
            <path
              d={arc}
              fill="none"
              strokeWidth={4}
              strokeLinecap="round"
              className={cn('stroke-accent transition-[stroke] duration-(--duration-fast) ease-hover', !disabled && 'group-hover/dial:stroke-accent-hover group-data-dragging/dial:stroke-accent-hover')}
            />
          ) : null}
        </svg>
        <span data-slot="angle-slider-value" aria-hidden className={cn('pointer-events-none absolute inset-0 grid place-items-center font-semibold text-fg-1 tabular-nums', valueText)}>
          {`${angle}°`}
        </span>
        <div
          {...thumb}
          data-slot="angle-slider-thumb"
          className={cn(
            'absolute size-5 -translate-1/2 rounded-full bg-[oklch(1_0_0)] shadow-thumb transition-[scale,box-shadow] duration-(--duration-fast) ease-out',
            !disabled && 'group-hover/dial:shadow-[0_2px_6px_oklch(0_0_0/0.22),0_0_0_0.5px_oklch(0_0_0/0.08)] group-data-dragging/dial:scale-110',
          )}
          style={{ left: ex, top: ey }}
        />
      </div>
    </div>
  );
}
