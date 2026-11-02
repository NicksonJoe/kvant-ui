import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import type { GalleryItem } from './image';

/** Zoom steps; the zoom resets on paging. */
export const LIGHTBOX_ZOOM = [1, 1.5, 2, 3] as const;

/** Dark glass of the chrome: 72 % + blur 20, hairline ring, deep shadow. Same in both themes. */
const glass =
  'bg-media-glass backdrop-blur-[20px] backdrop-saturate-[1.8] shadow-[inset_0_1px_0_oklch(1_0_0/0.08),0_0_0_1px_var(--color-media-hairline),0_12px_32px_-8px_oklch(0_0_0/0.6)]';

const chromeButton =
  'kv-pressable inline-grid shrink-0 place-items-center rounded-full text-media-fg-1 outline-none [--kv-press-scale:var(--scale-press-icon)] hover:bg-media-fill-1 active:bg-media-fill-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:stroke-[1.5]';

function ChromeButton({ className, ...props }: ComponentProps<'button'>) {
  return <button type="button" className={cn(chromeButton, 'size-8 [&_svg]:size-4', className)} {...props} />;
}

export interface LightboxProps {
  items: readonly GalleryItem[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Shown item; pair with `onIndexChange` or start from `defaultIndex`. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Extra buttons in the top bar after «Скачать». */
  actions?: ReactNode;
}

/**
 * Full-screen viewer for photos, always dark. Counter and file name on the left, zoom and download on the right,
 * arrows at the sides, thumbnails at the bottom. ← → page, Esc, a click on the background or a swipe down closes.
 */
export function Lightbox({
  items,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  actions,
}: LightboxProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const [indexState, setIndexState] = useState(defaultIndex);
  const [zoom, setZoom] = useState(0);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);

  const open = openProp ?? openState;
  const index = Math.min(Math.max(0, indexProp ?? indexState), Math.max(0, items.length - 1));
  const item = items[index];
  const scale = LIGHTBOX_ZOOM[zoom] ?? 1;

  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };

  const go = (next: number) => {
    if (next < 0 || next >= items.length) return;
    setIndexState(next);
    setZoom(0);
    onIndexChange?.(next);
  };

  const releaseDrag = (clientY: number, height: number) => {
    if (dragStart.current === null) return;
    const distance = clientY - dragStart.current;
    dragStart.current = null;
    setDragY(0);
    // Swipe down past 30 % of the screen closes
    if (distance > height * 0.3) setOpen(false);
  };

  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => setOpen(next)}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="kv-backdrop fixed inset-0 z-50 bg-media-bg" />
        <BaseDialog.Popup
          data-slot="lightbox"
          // the chrome is dark in any theme, so it takes the dark-theme focus ring
          className="kv-backdrop fixed inset-0 z-50 text-media-fg-1 outline-none [--color-ring:var(--color-media-ring)]"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') go(index - 1);
            if (event.key === 'ArrowRight') go(index + 1);
          }}
        >
          <BaseDialog.Title className="sr-only">{item?.name ?? item?.alt}</BaseDialog.Title>

          <div
            data-slot="lightbox-stage"
            className="absolute inset-0 grid touch-none grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center overflow-hidden px-20 pt-20 pb-28"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
            onPointerDown={(event) => {
              if (scale === 1 && event.pointerType !== 'mouse') dragStart.current = event.clientY;
            }}
            onPointerMove={(event) => {
              if (dragStart.current !== null) setDragY(Math.max(0, event.clientY - dragStart.current));
            }}
            onPointerUp={(event) => releaseDrag(event.clientY, event.currentTarget.clientHeight)}
            onPointerCancel={() => {
              dragStart.current = null;
              setDragY(0);
            }}
          >
            {item ? (
              <img
                key={item.src}
                src={item.src}
                alt={item.alt}
                draggable={false}
                style={{ scale, translate: `0 ${dragY}px` }}
                className={cn(
                  'max-h-full max-w-full rounded-sm object-contain select-none',
                  dragY === 0 && 'transition-[scale,translate] duration-(--duration-slow) ease-fluid',
                )}
              />
            ) : null}
          </div>

          <div data-slot="lightbox-top-bar" className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between gap-4">
            <div className={cn(glass, 'pointer-events-auto flex h-10 min-w-0 items-center gap-3 rounded-full px-4 text-body-sm')}>
              <span className="text-media-fg-2 tabular-nums">
                {index + 1} из {items.length}
              </span>
              {item?.name ? (
                <>
                  <span aria-hidden className="h-4 w-px bg-media-hairline" />
                  <span className="truncate text-media-fg-1">{item.name}</span>
                </>
              ) : null}
            </div>
            <div className="pointer-events-auto flex items-center gap-2">
              <div className={cn(glass, 'flex h-10 items-center gap-0.5 rounded-full px-1')}>
                <ChromeButton aria-label="Уменьшить" disabled={zoom === 0} onClick={() => setZoom(zoom - 1)}>
                  <ZoomOut aria-hidden />
                </ChromeButton>
                <span className="w-12 text-center text-label-sm text-media-fg-1 tabular-nums">{Math.round(scale * 100)}&nbsp;%</span>
                <ChromeButton aria-label="Увеличить" disabled={zoom === LIGHTBOX_ZOOM.length - 1} onClick={() => setZoom(zoom + 1)}>
                  <ZoomIn aria-hidden />
                </ChromeButton>
                <span aria-hidden className="mx-1 h-4 w-px bg-media-hairline" />
                {item ? (
                  <a href={item.src} download={item.name ?? true} aria-label="Скачать" className={cn(chromeButton, 'size-8 [&_svg]:size-4')}>
                    <Download aria-hidden />
                  </a>
                ) : null}
                {actions}
              </div>
              <BaseDialog.Close aria-label="Закрыть" className={cn(glass, chromeButton, 'size-10 [&_svg]:size-4.5')}>
                <X aria-hidden />
              </BaseDialog.Close>
            </div>
          </div>

          {index > 0 ? (
            <button
              type="button"
              aria-label="Предыдущее фото"
              onClick={() => go(index - 1)}
              className={cn(glass, chromeButton, 'absolute top-1/2 left-6 size-11 -translate-y-1/2 [&_svg]:size-5')}
            >
              <ChevronLeft aria-hidden />
            </button>
          ) : null}
          {index < items.length - 1 ? (
            <button
              type="button"
              aria-label="Следующее фото"
              onClick={() => go(index + 1)}
              className={cn(glass, chromeButton, 'absolute top-1/2 right-6 size-11 -translate-y-1/2 [&_svg]:size-5')}
            >
              <ChevronRight aria-hidden />
            </button>
          ) : null}

          {items.length > 1 ? (
            <div
              data-slot="lightbox-thumbnails"
              className={cn(glass, 'absolute bottom-5 left-1/2 flex max-w-[calc(100%-32px)] -translate-x-1/2 gap-1.5 overflow-x-auto rounded-xl p-1.5 [scrollbar-width:none]')}
            >
              {items.map((thumb, thumbIndex) => (
                <button
                  key={`${thumb.src}-${thumbIndex}`}
                  type="button"
                  aria-label={`Фото ${thumbIndex + 1}: ${thumb.alt}`}
                  aria-current={thumbIndex === index ? 'true' : undefined}
                  onClick={() => go(thumbIndex)}
                  className={cn(
                    'h-10 w-14 shrink-0 overflow-hidden rounded-sm transition-opacity duration-(--duration-fast)',
                    thumbIndex === index ? 'outline-2 outline-offset-2 outline-media-fg-1' : 'opacity-55 hover:opacity-100',
                  )}
                >
                  <img src={thumb.src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
