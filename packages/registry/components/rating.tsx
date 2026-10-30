import { Star } from 'lucide-react';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '../lib/cn';

export const RATING_LABELS = ['Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'] as const;

const sizes = {
  sm: 'gap-0.5 [&_svg]:size-3.5',
  md: 'gap-1 [&_svg]:size-5',
  // Touch: 28 px stars in 44 px hit areas.
  lg: 'gap-2 [&_svg]:size-7 [&_[data-star]]:after:absolute [&_[data-star]]:after:-inset-2',
} as const;

const score = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

type Fill = 'full' | 'half' | 'empty';

function StarIcon({ fill }: { fill: Fill }) {
  return (
    <>
      <Star
        aria-hidden
        strokeWidth={1.5}
        className={cn(
          'transition-[color,fill] duration-(--duration-fast) ease-hover',
          fill === 'full' ? 'fill-warning text-warning' : 'fill-transparent text-fg-4',
        )}
      />
      {fill === 'half' ? (
        <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
          <Star aria-hidden strokeWidth={1.5} className="fill-warning text-warning" />
        </span>
      ) : null}
    </>
  );
}

export interface RatingProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Number of stars. */
  max?: number;
  /** sm 14 (lists), md 20, lg 28 for touch. */
  size?: keyof typeof sizes;
  /** Shows the score as a word next to the stars: «Хорошо». */
  showLabel?: boolean;
  /** Words for 1…max. */
  labels?: readonly string[];
  /** Display only: rounds to half a star and reads as «Оценка 3,5 из 5». */
  readOnly?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

/**
 * Five stars. Input: one Tab stop, arrows ±1, Home/End, hover previews the fill, a press or a
 * finger drawn across the row sets it. Read-only: an image with the score in its name.
 */
export function Rating({
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  size = 'md',
  showLabel = false,
  labels = RATING_LABELS,
  readOnly = false,
  disabled = false,
  'aria-label': ariaLabel = 'Оценка',
  className,
}: RatingProps) {
  const [own, setOwn] = useState(defaultValue);
  const [preview, setPreview] = useState<number | null>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const current = value ?? own;

  const stars = (shown: number, interactive: boolean) =>
    Array.from({ length: max }, (_, i) => {
      const fill: Fill = shown >= i + 1 ? 'full' : shown >= i + 0.5 ? 'half' : 'empty';
      return (
        <span
          key={i}
          data-star={fill}
          className={cn('relative grid', interactive && 'kv-pressable [--kv-press-scale:0.85]')}
          onClick={interactive ? () => commit(i + 1) : undefined}
          onPointerEnter={interactive ? () => setPreview(i + 1) : undefined}
        >
          <StarIcon fill={fill} />
        </span>
      );
    });

  if (readOnly) {
    const rounded = Math.round(current * 2) / 2;
    return (
      <div
        data-slot="rating"
        role="img"
        aria-label={`${ariaLabel} ${score.format(rounded)} из ${max}`}
        className={cn('inline-flex items-center', sizes[size], className)}
      >
        {stars(rounded, false)}
      </div>
    );
  }

  function commit(next: number) {
    const clamped = Math.min(Math.max(next, 1), max);
    setOwn(clamped);
    onValueChange?.(clamped);
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowUp: current + 1,
      ArrowLeft: current - 1,
      ArrowDown: current - 1,
      Home: 1,
      End: max,
    };
    const next = steps[event.key];
    if (next === undefined) return;
    event.preventDefault();
    commit(next);
  };

  // A finger drawn across the row: touch pointers stay captured by the first star, so read the position.
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || event.buttons === 0) return;
    const rects = [...(starsRef.current?.children ?? [])].map((star) => star.getBoundingClientRect());
    const index = rects.findIndex((rect) => event.clientX <= rect.right);
    commit(index === -1 ? max : index + 1);
  };

  const interactive = !disabled;
  const shown = preview ?? current;
  const word = (n: number) => labels[n - 1] ?? '';

  return (
    <div data-slot="rating" className={cn('inline-flex items-center gap-2.5', disabled && 'opacity-50', className)}>
      <div
        ref={starsRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={current > 0 ? `${current} из ${max} — ${word(current)}` : 'Без оценки'}
        aria-disabled={disabled || undefined}
        onKeyDown={interactive ? onKeyDown : undefined}
        onPointerLeave={() => setPreview(null)}
        onPointerMove={interactive ? onPointerMove : undefined}
        className={cn('inline-flex touch-none items-center rounded-sm', sizes[size])}
      >
        {stars(shown, interactive)}
      </div>
      {showLabel && shown > 0 ? <span className="text-label-sm font-medium text-fg-2">{word(shown)}</span> : null}
    </div>
  );
}
