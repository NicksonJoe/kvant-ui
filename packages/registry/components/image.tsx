import { Check, ImageOff, Maximize2, RotateCw, X } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { PlayGlyph, formatMediaTime } from '../lib/media';
import { IconButton } from './button';

export const IMAGE_RATIOS = ['1:1', '4:3', '16:9', '21:9'] as const;
export type ImageRatio = (typeof IMAGE_RATIOS)[number];

const ratios: Record<ImageRatio, string> = {
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '16:9': 'aspect-video',
  '21:9': 'aspect-[21/9]',
};

/** Radius follows the short side: ≤64 sm · ≤160 md · ≤320 lg · larger xl; avatars are full. */
const radii = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl', full: 'rounded-full' } as const;

type ImageState = 'loading' | 'loaded' | 'error';

export interface ImageProps extends Omit<ComponentProps<'img'>, 'className' | 'children' | 'src' | 'alt'> {
  src: string;
  /** Describe what the picture shows; empty only for decoration. */
  alt: string;
  /** Frame proportions, the picture is cropped with object-fit: cover; without it the picture keeps its own. */
  ratio?: ImageRatio;
  radius?: keyof typeof radii;
  /** Line under the picture, 10px below. */
  caption?: ReactNode;
  className?: string;
}

/**
 * Picture in a ratio frame. While loading the frame shimmers (fill-2), the picture fades in over 200ms without a shift;
 * a failed load leaves a surface-2 frame with «Повторить».
 */
export function Image({ src, alt, ratio, radius = 'lg', caption, className, onLoad, onError, ...props }: ImageProps) {
  const img = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<ImageState>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // A cached picture may finish before React attaches onLoad (SSR, back navigation).
    const el = img.current;
    setState(el?.complete && el.naturalWidth > 0 ? 'loaded' : 'loading');
  }, [src, attempt]);

  return (
    <figure data-slot="image" className={cn('flex flex-col gap-2.5', className)}>
      <div
        data-slot="image-frame"
        data-state={state}
        className={cn(
          'relative overflow-hidden',
          radii[radius],
          ratio && ratios[ratio],
          state === 'loading' && 'kv-shimmer',
          state === 'error' && !ratio && 'min-h-32',
        )}
      >
        {state === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-2 p-3 text-center shadow-[inset_0_0_0_1px_var(--color-hairline)]">
            <ImageOff aria-hidden className="size-6 stroke-[1.5] text-fg-3" />
            <p className="text-body-xs text-fg-2">Не удалось загрузить</p>
            <button
              type="button"
              onClick={() => setAttempt((count) => count + 1)}
              className="inline-flex items-center gap-1 rounded-full text-label-sm font-medium text-accent-soft-fg"
            >
              <RotateCw aria-hidden className="size-3.5 stroke-[1.75]" />
              Повторить
            </button>
          </div>
        ) : (
          <img
            key={attempt}
            ref={img}
            src={src}
            alt={alt}
            onLoad={(event) => {
              setState('loaded');
              onLoad?.(event);
            }}
            onError={(event) => {
              setState('error');
              onError?.(event);
            }}
            className={cn(
              'block size-full object-cover transition-opacity duration-(--duration-base) ease-out',
              state === 'loaded' ? 'opacity-100' : 'opacity-0',
            )}
            {...props}
          />
        )}
      </div>
      {caption ? <figcaption className="text-caption text-fg-3">{caption}</figcaption> : null}
    </figure>
  );
}


export interface GalleryItem {
  /** Picture; for a video, its poster frame. */
  src: string;
  alt: string;
  /** File name for the viewer's top bar. */
  name?: string;
  /** Video file: the tile shows ▶ and the length, the viewer plays it. */
  video?: string;
  /** Video length in seconds, for the chip in the corner of the tile. */
  duration?: number;
}

/** Hold that starts choosing, and how far the finger may wander before it counts as a scroll. */
const LONG_PRESS = 500;
const PRESS_SLOP = 8;

const tileLabel = (item: GalleryItem) =>
  item.video ? `Смотреть видео: ${item.alt}${item.duration ? `, ${formatMediaTime(item.duration)}` : ''}` : `Открыть: ${item.alt}`;

export interface GalleryProps extends Omit<ComponentProps<'div'>, 'children'> {
  items: readonly GalleryItem[];
  /** Tiles shown; the last one folds the rest into «+N». */
  max?: number;
  /** Tapped photo; open the Lightbox on it. */
  onOpen?: (index: number) => void;
  /** Circles on the tiles: a click on one or a long press on a tile starts choosing. */
  selectable?: boolean;
  /** Chosen tiles, ascending indexes of `items`. */
  selected?: readonly number[];
  defaultSelected?: readonly number[];
  onSelectedChange?: (selected: readonly number[]) => void;
  /** Buttons of the bar over the chosen tiles: «Скачать», «Удалить». */
  bulkActions?: (selected: readonly number[], clear: () => void) => ReactNode;
}

/**
 * Preview grid: the first photo takes 2×2, the rest are squares; hover dims a tile by 20%. A video tile shows its poster,
 * ▶ and the length. With `selectable` every tile has a circle; while something is chosen a click on a tile toggles it,
 * Shift picks a range, Ctrl+A everything, Esc clears, and the bar on top counts the choice and holds `bulkActions`.
 */
export function Gallery({
  items,
  max = 5,
  onOpen,
  selectable = false,
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  bulkActions,
  className,
  onKeyDown,
  ...props
}: GalleryProps) {
  const [selectedState, setSelectedState] = useState<readonly number[]>(defaultSelected);
  const selected = selectedProp ?? selectedState;
  const choosing = selectable && selected.length > 0;
  const grid = useRef<HTMLDivElement>(null);
  const anchor = useRef<number | null>(null);
  const press = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  // the click that ends a long press must not open or toggle again
  const swallow = useRef(false);
  useEffect(() => () => clearTimeout(press.current?.timer), []);

  const shown = items.slice(0, max);
  const rest = items.length - shown.length;

  const commit = (next: readonly number[]) => {
    const sorted = [...new Set(next)].sort((a, b) => a - b);
    setSelectedState(sorted);
    onSelectedChange?.(sorted);
  };
  const clear = () => commit([]);
  const pick = (index: number, range: boolean) => {
    if (range && anchor.current !== null) {
      const from = Math.min(anchor.current, index);
      commit([...selected, ...Array.from({ length: Math.abs(anchor.current - index) + 1 }, (_, step) => from + step)]);
      return;
    }
    anchor.current = index;
    commit(selected.includes(index) ? selected.filter((chosen) => chosen !== index) : [...selected, index]);
  };
  const endPress = () => {
    clearTimeout(press.current?.timer);
    press.current = null;
  };

  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (selectable && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      commit(items.map((_, index) => index));
      return;
    }
    if (selectable && event.key === 'Escape' && selected.length > 0) {
      // clearing the choice should not also close a dialog around the gallery
      event.preventDefault();
      event.stopPropagation();
      clear();
      return;
    }
    const tile = (event.target as HTMLElement).closest<HTMLElement>('[data-slot=gallery-tile]');
    if (!tile) return;
    const index = Number(tile.dataset.index);
    const keyMap: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: shown.length - 1 };
    const next = keyMap[event.key];
    if (next === undefined || next < 0 || next >= shown.length) return;
    event.preventDefault();
    grid.current?.querySelector<HTMLElement>(`[data-index="${next}"] [data-slot=gallery-open]`)?.focus();
  };

  return (
    <div data-slot="gallery" className={cn('flex flex-col gap-3', className)} {...props} onKeyDown={keys}>
      {selectable && selected.length > 0 ? (
        <div
          role="group"
          aria-label="Действия с выбранными"
          data-slot="gallery-actions"
          className="flex min-h-12 flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-md bg-surface-1 py-1.5 pr-2 pl-1.5 shadow-raised"
        >
          <div className="flex items-center gap-1">
            <IconButton size="md" icon={<X />} aria-label="Снять выделение" onClick={clear} />
            <span className="text-label-md font-semibold text-fg-1 tabular-nums">Выбрано {selected.length}</span>
          </div>
          {bulkActions ? <div className="flex flex-wrap items-center gap-1">{bulkActions(selected, clear)}</div> : null}
        </div>
      ) : null}
      <div ref={grid} data-slot="gallery-grid" className="grid grid-cols-4 gap-2">
        {shown.map((item, index) => {
          const folded = rest > 0 && index === shown.length - 1;
          const checked = selectable && selected.includes(index);
          const video = item.video !== undefined && !folded;
          return (
            <div
              key={`${item.src}-${index}`}
              data-slot="gallery-tile"
              data-index={index}
              data-selected={checked ? '' : undefined}
              className={cn(
                'relative rounded-md transition-colors duration-(--duration-quick) ease-out',
                index === 0 && 'col-span-2 row-span-2',
                checked && 'bg-accent-soft',
              )}
            >
              <button
                type="button"
                data-slot="gallery-open"
                aria-label={folded ? `Ещё ${rest + 1} фото` : tileLabel(item)}
                onClick={(event) => {
                  if (swallow.current) {
                    swallow.current = false;
                    return;
                  }
                  // a pointer toggles while choosing; Enter and Space still open, the circle is the keyboard's toggle
                  if (choosing && event.detail > 0) pick(index, event.shiftKey);
                  else onOpen?.(index);
                }}
                onPointerDown={(event) => {
                  if (!selectable || event.button !== 0) return;
                  endPress();
                  swallow.current = false;
                  const timer = setTimeout(() => {
                    press.current = null;
                    swallow.current = true;
                    pick(index, false);
                  }, LONG_PRESS);
                  press.current = { timer, x: event.clientX, y: event.clientY };
                }}
                onPointerMove={(event) => {
                  const start = press.current;
                  if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > PRESS_SLOP) endPress();
                }}
                onPointerUp={endPress}
                onPointerLeave={endPress}
                onPointerCancel={endPress}
                onContextMenu={(event) => {
                  if (swallow.current) event.preventDefault();
                }}
                className={cn(
                  'group relative block size-full rounded-md transition-[padding,scale] duration-(--duration-quick) ease-out select-none [-webkit-touch-callout:none] active:scale-(--scale-press-wide)',
                  checked && 'p-2.5',
                )}
              >
                <span className={cn('relative block size-full overflow-hidden', checked ? 'rounded-sm' : 'rounded-md')}>
                  <Image
                    src={item.src}
                    alt=""
                    ratio="1:1"
                    radius={checked ? 'sm' : 'md'}
                    draggable={false}
                    className="h-full [&>[data-slot=image-frame]]:h-full"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-0 grid place-items-center transition-colors duration-(--duration-quick) ease-out',
                      folded ? 'bg-media-scrim text-heading-md font-semibold text-media-fg-1' : 'bg-media-bg/0 group-hover:bg-media-bg/20 group-active:bg-media-bg/30',
                    )}
                  >
                    {folded ? (
                      `+${rest + 1}`
                    ) : video ? (
                      <span data-slot="gallery-play" className="grid size-11 place-items-center rounded-full bg-media-bg/55 text-media-fg-1">
                        <PlayGlyph size={20} />
                      </span>
                    ) : choosing ? null : (
                      <span className="grid size-11 scale-90 place-items-center rounded-full bg-media-glass text-media-fg-1 opacity-0 shadow-[0_0_0_1px_var(--color-media-hairline)] transition-[opacity,scale] duration-(--duration-quick) ease-out group-hover:scale-100 group-hover:opacity-100">
                        <Maximize2 className="size-5 stroke-[1.75]" />
                      </span>
                    )}
                  </span>
                  {video && item.duration ? (
                    <span
                      data-slot="gallery-duration"
                      className="absolute right-2 bottom-2 flex h-5 items-center rounded-xs bg-media-scrim px-1.5 text-overline font-semibold text-media-fg-1 tabular-nums"
                    >
                      {formatMediaTime(item.duration)}
                    </span>
                  ) : null}
                </span>
              </button>
              {selectable ? (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  aria-label={`Выбрать: ${item.alt}`}
                  data-slot="gallery-select"
                  onClick={(event) => pick(index, event.shiftKey)}
                  className="group/select absolute -top-0.5 -left-0.5 grid size-11 place-items-center rounded-full outline-none"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-6 place-items-center rounded-full transition-[background-color,box-shadow,scale] duration-(--duration-quick) ease-out group-active/select:scale-90',
                      'group-focus-visible/select:outline-2 group-focus-visible/select:outline-offset-2 group-focus-visible/select:outline-ring',
                      checked
                        ? 'bg-accent text-accent-fg shadow-[0_0_0_2px_oklch(1_0_0)]'
                        : 'bg-media-bg/20 shadow-[inset_0_0_0_2px_oklch(1_0_0),0_0_0_1px_oklch(0.16_0.005_258/0.8)] group-hover/select:bg-media-bg/35 group-active/select:bg-media-bg/45',
                    )}
                  >
                    {checked ? <Check className="size-3.5 stroke-3" /> : null}
                  </span>
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
