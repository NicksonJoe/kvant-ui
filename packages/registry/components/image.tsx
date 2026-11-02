import { ImageOff, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

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
  src: string;
  alt: string;
  /** File name for the viewer's top bar. */
  name?: string;
}

export interface GalleryProps extends Omit<ComponentProps<'div'>, 'children'> {
  items: readonly GalleryItem[];
  /** Tiles shown; the last one folds the rest into «+N». */
  max?: number;
  /** Tapped photo; open the Lightbox on it. */
  onOpen?: (index: number) => void;
}

/** Preview grid: the first photo takes 2×2, the rest are squares; hover dims a tile by 20%. */
export function Gallery({ items, max = 5, onOpen, className, ...props }: GalleryProps) {
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;

  return (
    <div data-slot="gallery" className={cn('grid grid-cols-4 gap-2', className)} {...props}>
      {shown.map((item, index) => {
        const folded = rest > 0 && index === shown.length - 1;
        return (
          <button
            key={`${item.src}-${index}`}
            type="button"
            aria-label={folded ? `Ещё ${rest + 1} фото` : `Открыть: ${item.alt}`}
            onClick={() => onOpen?.(index)}
            className={cn('group relative rounded-md', index === 0 && 'col-span-2 row-span-2')}
          >
            <Image src={item.src} alt="" ratio="1:1" radius="md" className="h-full [&>[data-slot=image-frame]]:h-full" />
            <span
              aria-hidden
              className={cn(
                'absolute inset-0 grid place-items-center rounded-md transition-colors duration-(--duration-quick) ease-out',
                folded ? 'bg-media-scrim text-heading-md font-semibold text-media-fg-1' : 'bg-media-bg/0 group-hover:bg-media-bg/20',
              )}
            >
              {folded ? `+${rest + 1}` : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
