import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { ChevronLeft, ChevronRight, Download, Share, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { PlayGlyph, prefersReducedMotion } from '../lib/media';
import type { GalleryItem } from './image';
import { toast } from './toast';
import { VideoPlayer } from './video-player';

/** Zoom steps; the zoom resets on paging. */
export const LIGHTBOX_ZOOM = [1, 1.5, 2, 3] as const;

/** Idle time before the chrome leaves. */
const HIDE_AFTER = 3000;
/** The parts that hide; focus or an open menu inside one keeps them all. */
const CHROME = '[data-slot=lightbox-top-bar], [data-slot=lightbox-arrow], [data-slot=lightbox-thumbnails]';

/** Dark glass of the chrome: 72 % + blur 20, hairline ring, deep shadow. Same in both themes. */
const glass =
  'bg-media-glass backdrop-blur-[20px] backdrop-saturate-[1.8] shadow-[inset_0_1px_0_oklch(1_0_0/0.08),0_0_0_1px_var(--color-media-hairline),0_12px_32px_-8px_oklch(0_0_0/0.6)]';

const chromeButton =
  'kv-pressable inline-grid shrink-0 place-items-center rounded-full text-media-fg-1 outline-none [--kv-press-scale:var(--scale-press-icon)] hover:bg-media-fill-1 active:bg-media-fill-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:stroke-[1.5]';

function ChromeButton({ className, ...props }: ComponentProps<'button'>) {
  return <button type="button" className={cn(chromeButton, 'size-8 [&_svg]:size-4', className)} {...props} />;
}

/* ---------- opening and closing motion ---------- */

type Frame = Record<string, string | number>;

function cssValue(element: Element, name: string, fallback: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

const radiusOf = (element: Element) => Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;

/** Centre and size of the media's own box, without the zoom and the swipe on top. */
function layoutBox(element: HTMLElement, scale: number, dragY: number) {
  const box = element.getBoundingClientRect();
  return { cx: box.left + box.width / 2, cy: box.top + box.height / 2 - dragY, width: box.width / scale, height: box.height / scale };
}

/** The media laid over its thumbnail with the same cover crop: translate + uniform scale + clip-path. */
function thumbFrame(media: ReturnType<typeof layoutBox>, thumb: Element): Frame | null {
  const box = thumb.getBoundingClientRect();
  if (!box.width || !box.height || !media.width || !media.height) return null;
  const scale = Math.max(box.width / media.width, box.height / media.height);
  const insetX = Math.max(0, (media.width - box.width / scale) / 2);
  const insetY = Math.max(0, (media.height - box.height / scale) / 2);
  return {
    translate: `${box.left + box.width / 2 - media.cx}px ${box.top + box.height / 2 - media.cy}px`,
    scale: `${scale}`,
    clipPath: `inset(${insetY}px ${insetX}px round ${radiusOf(thumb) / scale}px)`,
  };
}

/** Shared-element spring from the tokens: «500ms linear(…)». */
function gentleSpring(element: Element) {
  const [duration = '500ms', ...curve] = cssValue(element, '--spring-gentle', '500ms ease-out').split(' ');
  return { duration: Number.parseFloat(duration), easing: curve.join(' ') || 'ease-out' };
}

const fade = (element: Element) => ({
  duration: Number.parseFloat(cssValue(element, '--duration-base', '200')) || 200,
  easing: cssValue(element, '--ease-out', 'ease-out'),
});

/* ---------- share ---------- */

/** A file read ahead for the share sheet: Safari drops the user gesture if share() waits for a download. */
interface SharedFile {
  src: string;
  file: File;
}

/** Called right in the click: the system sheet with the ready file (or the link); without one the link goes to the clipboard. */
function share(item: GalleryItem, ready: SharedFile | null) {
  const src = item.video ?? item.src;
  const url = new URL(src, location.href).href;
  const title = item.name ?? item.alt;
  if (typeof navigator.share === 'function') {
    const file = ready?.src === src ? ready.file : null;
    const data = file && navigator.canShare?.({ files: [file] }) ? { title, files: [file] } : { title, url };
    navigator.share(data).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.add({ type: 'danger', title: 'Не удалось поделиться' });
    });
    return;
  }
  navigator.clipboard.writeText(url).then(
    () => toast.add({ type: 'success', title: 'Ссылка скопирована' }),
    () => toast.add({ type: 'danger', title: 'Не удалось скопировать ссылку' }),
  );
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
  /** Thumbnail of an item: the media grows out of it on open and shrinks back into it on close. Without one it fades and scales. */
  origin?: (index: number) => Element | null | undefined;
  /** Extra buttons in the top bar after «Поделиться». */
  actions?: ReactNode;
}

/**
 * Full-screen viewer for photos and videos, always dark. Counter and file name on the left, zoom, download and share
 * on the right, arrows at the sides, thumbnails at the bottom; after 3 s without movement the chrome leaves.
 * ← → page, Esc, a click on the background or a swipe down closes.
 */
export function Lightbox({
  items,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  origin,
  actions,
}: LightboxProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const [indexState, setIndexState] = useState(defaultIndex);
  const [zoom, setZoom] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [awake, setAwake] = useState(true);
  const dragStart = useRef<number | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLElement | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const keyboard = useRef(false);
  const hovering = useRef(false);
  const hiddenAtPress = useRef(false);
  const sharedFile = useRef<SharedFile | null>(null);

  const open = openProp ?? openState;
  const index = Math.min(Math.max(0, indexProp ?? indexState), Math.max(0, items.length - 1));
  const item = items[index];
  const zoomable = item !== undefined && item.video === undefined;
  const shareSrc = open && item ? (item.video ?? item.src) : undefined;
  const shareName = item ? (item.name ?? item.alt) : '';
  const kind = (at: number) => (items[at]?.video ? 'видео' : 'фото');
  const scale = zoomable ? (LIGHTBOX_ZOOM[zoom] ?? 1) : 1;

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

  /* chrome: leaves after HIDE_AFTER idle, unless the keyboard is on it, a menu of it is open or the pointer rests on it */
  const held = () => {
    const popup = popupRef.current;
    if (!popup) return false;
    const parts = Array.from(popup.querySelectorAll(CHROME));
    const focused = document.activeElement;
    return (
      hovering.current ||
      parts.some((part) => part.querySelector('[data-popup-open]') !== null) ||
      (keyboard.current && focused !== null && parts.some((part) => part.contains(focused)))
    );
  };
  const rest = () => {
    if (held()) hideTimer.current = setTimeout(rest, HIDE_AFTER);
    else setAwake(false);
  };
  const wake = () => {
    setAwake(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(rest, HIDE_AFTER);
  };
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // The shown item is read into a File ahead of «Поделиться»; paging and closing abort the read, a read file is kept.
  useEffect(() => {
    if (!shareSrc || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return undefined;
    if (sharedFile.current?.src === shareSrc) return undefined;
    const controller = new AbortController();
    fetch(shareSrc, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.blob();
      })
      .then((blob) => {
        sharedFile.current = { src: shareSrc, file: new File([blob], shareName, { type: blob.type }) };
      })
      // unreadable or aborted: the link is shared instead
      .catch(() => {});
    return () => controller.abort();
  }, [shareSrc, shareName]);

  const chromePart = cn(
    'transition-opacity duration-(--duration-quick) ease-out group-data-starting-style:opacity-0 group-data-ending-style:opacity-0',
    !awake && 'pointer-events-none opacity-0',
  );
  const hoverProps = {
    onPointerEnter: (event: { pointerType: string }) => {
      if (event.pointerType === 'mouse') hovering.current = true;
    },
    onPointerLeave: () => {
      hovering.current = false;
    },
  };

  /* motion: the media grows out of its thumbnail; reduced motion only fades */
  const grow = (element: HTMLElement) => {
    if (typeof element.animate !== 'function') return;
    // an image without pixels has no box to fly yet
    if (element instanceof HTMLImageElement && !element.complete) element.addEventListener('load', () => fly(element), { once: true });
    else fly(element);
  };
  const fly = (element: HTMLElement) => {
    const reduced = prefersReducedMotion();
    const thumb = reduced ? null : origin?.(index);
    const frame = thumb ? thumbFrame(layoutBox(element, 1, 0), thumb) : null;
    if (frame) {
      element.animate([frame, { translate: '0px 0px', scale: '1', clipPath: `inset(0px 0px round ${radiusOf(element)}px)` }], gentleSpring(element));
    } else if (reduced) {
      element.animate([{ opacity: 0 }, { opacity: 1 }], fade(element));
    } else {
      element.animate([{ opacity: 0, scale: '0.96' }, { opacity: 1, scale: '1' }], fade(element));
    }
  };
  const shrink = () => {
    const element = mediaRef.current;
    const popup = popupRef.current;
    if (!element || !popup || typeof element.animate !== 'function') return;
    for (const running of element.getAnimations()) running.cancel();
    const reduced = prefersReducedMotion();
    const thumb = reduced ? null : origin?.(index);
    const frame = thumb ? thumbFrame(layoutBox(element, scale, dragY), thumb) : null;
    const now = { translate: `0px ${dragY}px`, scale: `${scale}` };
    const timing = frame ? gentleSpring(element) : fade(element);
    if (frame) element.animate([{ ...now, clipPath: `inset(0px 0px round ${radiusOf(element)}px)` }, frame], { ...timing, fill: 'forwards' });
    else if (reduced) element.animate([{ opacity: 1 }, { opacity: 0 }], { ...timing, fill: 'forwards' });
    else element.animate([{ ...now, opacity: 1 }, { ...now, scale: `${scale * 0.96}`, opacity: 0 }], { ...timing, fill: 'forwards' });
    // Base UI keeps the window while its popup animates: hold it until the media lands
    popup.animate([{ opacity: 1 }, { opacity: 1 }], timing);
  };

  // The portal may mount its content a commit after `open` flips, so the media starts its flight when it attaches.
  const growRef = useRef(grow);
  const opening = useRef(false);
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    growRef.current = grow;
    if (open === wasOpen.current) return;
    wasOpen.current = open;
    if (!open) shrink();
    else if (mediaRef.current) grow(mediaRef.current);
    else opening.current = true;
  });
  const attachMedia = useCallback((node: HTMLElement | null) => {
    mediaRef.current = node;
    if (node && opening.current) {
      opening.current = false;
      growRef.current(node);
    }
  }, []);

  const releaseDrag = (clientY: number, height: number) => {
    if (dragStart.current === null) return;
    const distance = clientY - dragStart.current;
    dragStart.current = null;
    // Swipe down past 30 % of the screen closes; the picture leaves from where the finger let it go
    if (distance > height * 0.3) setOpen(false);
    else setDragY(0);
  };

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next) => setOpen(next)}
      onOpenChangeComplete={(next) => {
        if (next) {
          wake();
          return;
        }
        clearTimeout(hideTimer.current);
        setAwake(true);
        setZoom(0);
        setDragY(0);
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="kv-backdrop fixed inset-0 z-50 bg-media-bg" />
        <BaseDialog.Popup
          ref={popupRef}
          data-slot="lightbox"
          data-chrome={awake ? 'visible' : 'hidden'}
          // the chrome is dark in any theme, so it takes the dark-theme focus ring
          className={cn('group fixed inset-0 z-50 text-media-fg-1 outline-none [--color-ring:var(--color-media-ring)]', !awake && 'cursor-none')}
          onPointerMove={wake}
          onPointerDown={(event) => {
            keyboard.current = false;
            hiddenAtPress.current = !awake;
            if (event.pointerType !== 'mouse') hovering.current = false;
            wake();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Tab') keyboard.current = true;
            wake();
            // a focused video player seeks with the arrows and marks the event as handled
            if (event.defaultPrevented) return;
            if (event.key === 'ArrowLeft') go(index - 1);
            if (event.key === 'ArrowRight') go(index + 1);
          }}
        >
          <BaseDialog.Title className="sr-only">{item?.name ?? item?.alt}</BaseDialog.Title>

          <div
            data-slot="lightbox-stage"
            className="absolute inset-0 grid touch-none grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center overflow-hidden px-20 pt-20 pb-28"
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              // a tap while the chrome is away only brings it back
              if (!awake || hiddenAtPress.current) {
                hiddenAtPress.current = false;
                wake();
                return;
              }
              setOpen(false);
            }}
            onPointerDown={(event) => {
              if ((event.target as Element).closest('[data-slot=video-player]')) return;
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
            {item?.video ? (
              <div
                key={item.video}
                ref={attachMedia}
                data-slot="lightbox-video"
                style={{ translate: `0 ${dragY}px` }}
                className="w-[min(100%,calc((100dvh-192px)*16/9))]"
              >
                <VideoPlayer src={item.video} poster={item.src} duration={item.duration} />
              </div>
            ) : item ? (
              <img
                key={item.src}
                ref={attachMedia}
                src={item.src}
                alt={item.alt}
                draggable={false}
                style={{ scale, translate: `0 ${dragY}px` }}
                className={cn(
                  'max-h-full max-w-full rounded-sm object-contain select-none',
                  dragY === 0 && 'transition-[scale,translate] duration-(--duration-moderate) ease-fluid',
                )}
              />
            ) : null}
          </div>

          <div
            data-slot="lightbox-top-bar"
            {...hoverProps}
            className={cn('pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between gap-4', chromePart, !awake && '*:pointer-events-none')}
          >
            <div className={cn(glass, 'pointer-events-auto flex h-10 min-w-0 items-center gap-3 rounded-full px-4 text-body-sm')}>
              <span className="shrink-0 whitespace-nowrap text-media-fg-2 tabular-nums">
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
                <ChromeButton aria-label="Уменьшить" disabled={!zoomable || zoom === 0} onClick={() => setZoom(zoom - 1)}>
                  <ZoomOut aria-hidden />
                </ChromeButton>
                <span className="w-12 text-center text-label-sm text-media-fg-1 tabular-nums">{Math.round(scale * 100)}&nbsp;%</span>
                <ChromeButton aria-label="Увеличить" disabled={!zoomable || zoom === LIGHTBOX_ZOOM.length - 1} onClick={() => setZoom(zoom + 1)}>
                  <ZoomIn aria-hidden />
                </ChromeButton>
                <span aria-hidden className="mx-1 h-4 w-px bg-media-hairline" />
                {item ? (
                  <>
                    <a href={item.video ?? item.src} download={item.name ?? true} aria-label="Скачать" className={cn(chromeButton, 'size-8 [&_svg]:size-4')}>
                      <Download aria-hidden />
                    </a>
                    <ChromeButton aria-label="Поделиться" onClick={() => share(item, sharedFile.current)}>
                      <Share aria-hidden />
                    </ChromeButton>
                  </>
                ) : null}
                {actions}
              </div>
              <BaseDialog.Close aria-label="Закрыть" className={cn(glass, chromeButton, 'size-10 [&_svg]:size-4.5')}>
                <X aria-hidden />
              </BaseDialog.Close>
            </div>
          </div>

          {index > 0 ? (
            <div data-slot="lightbox-arrow" {...hoverProps} className={cn(chromePart, 'absolute top-1/2 left-6 -translate-y-1/2')}>
              <button type="button" aria-label={`Предыдущее ${kind(index - 1)}`} onClick={() => go(index - 1)} className={cn(glass, chromeButton, 'size-11 [&_svg]:size-5')}>
                <ChevronLeft aria-hidden />
              </button>
            </div>
          ) : null}
          {index < items.length - 1 ? (
            <div data-slot="lightbox-arrow" {...hoverProps} className={cn(chromePart, 'absolute top-1/2 right-6 -translate-y-1/2')}>
              <button type="button" aria-label={`Следующее ${kind(index + 1)}`} onClick={() => go(index + 1)} className={cn(glass, chromeButton, 'size-11 [&_svg]:size-5')}>
                <ChevronRight aria-hidden />
              </button>
            </div>
          ) : null}

          {items.length > 1 ? (
            <div
              data-slot="lightbox-thumbnails"
              {...hoverProps}
              className={cn(
                glass,
                chromePart,
                'absolute bottom-5 left-1/2 flex max-w-[calc(100%-32px)] -translate-x-1/2 gap-1.5 overflow-x-auto rounded-xl p-1.5 [scrollbar-width:none]',
              )}
            >
              {items.map((thumb, thumbIndex) => (
                <button
                  key={`${thumb.src}-${thumbIndex}`}
                  type="button"
                  aria-label={`${thumb.video ? 'Видео' : 'Фото'} ${thumbIndex + 1}: ${thumb.alt}`}
                  aria-current={thumbIndex === index ? 'true' : undefined}
                  onClick={() => go(thumbIndex)}
                  className={cn(
                    'relative h-10 w-14 shrink-0 overflow-hidden rounded-sm transition-opacity duration-(--duration-fast)',
                    thumbIndex === index ? 'outline-2 outline-offset-2 outline-media-fg-1' : 'opacity-55 hover:opacity-100',
                  )}
                >
                  <img src={thumb.src} alt="" className="size-full object-cover" />
                  {thumb.video ? (
                    <span aria-hidden className="absolute inset-0 grid place-items-center bg-media-bg/30 text-media-fg-1">
                      <PlayGlyph size={14} />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
