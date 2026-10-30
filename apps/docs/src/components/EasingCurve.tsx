import { cn } from '@/kvant';
import { easingCurve } from '../lib/easing';

/** Curve glyph as on the Paper boards: axes in the border colour, the curve in accent; overshoot goes past the frame. */
export function EasingCurve({ easing, className }: { easing: string; className?: string }) {
  const points = easingCurve(easing);
  const path = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${(4 + x * 48).toFixed(2)} ${(36 - y * 32).toFixed(2)}`).join('');
  return (
    <svg viewBox="0 0 56 40" aria-hidden className={cn('h-10 w-14 shrink-0 overflow-visible', className)}>
      <path d="M4 4V36H52" fill="none" stroke="var(--color-border)" vectorEffect="non-scaling-stroke" />
      {points.length > 0 ? (
        <path
          d={path}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}
