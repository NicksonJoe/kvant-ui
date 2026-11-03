import { Slider as BaseSlider } from '@base-ui/react/slider';
import { CircleAlert, Image as ImageIcon, RotateCcw, TriangleAlert, Upload } from 'lucide-react';
import {
  createContext,
  use,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import { IconButton } from './button';
import { formatFileSize } from './file-upload';
import { Tooltip } from './popover';
import { SegmentedControl } from './segmented-control';
import { Spinner } from './spinner';
import { Announce } from './visually-hidden';

export interface CropSize {
  width: number;
  height: number;
}
export interface CropPoint {
  x: number;
  y: number;
}
export interface CropRect extends CropPoint, CropSize {}

/** Corners and sides of the frame, by compass. */
export type CropHandle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w';
export type CropRotation = 0 | 90 | 180 | 270;

/** What to cut: the frame in natural pixels of the picture turned by `rotation` (clockwise), then mirrored if `flip`. */
export interface ImageCrop extends CropRect {
  src: string;
  rotation: CropRotation;
  flip: boolean;
}

export interface CropAspectOption {
  label: string;
  /** Width ÷ height; null — free. */
  value: number | null;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
/** Smallest frame side in stage pixels. */
const MIN_FRAME = 48;
/** Share of a pull past the edge the picture follows. */
const RUBBER = 1 / 3;
const SETTLE_MS = 200;
const DEFAULT_MAX_SIZE = 20 * 1024 * 1024;
const ASPECTS: readonly CropAspectOption[] = [
  { label: 'Свободно', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
];
const CORNERS = ['nw', 'ne', 'se', 'sw'] as const;
const SIDES = ['n', 'e', 's', 'w'] as const;
const isHandle = (value: string | undefined): value is CropHandle => [...CORNERS, ...SIDES].some((handle) => handle === value);
const HANDLE_NAMES: Record<CropHandle, string> = {
  nw: 'Левый верхний угол',
  ne: 'Правый верхний угол',
  se: 'Правый нижний угол',
  sw: 'Левый нижний угол',
  n: 'Верхняя сторона',
  e: 'Правая сторона',
  s: 'Нижняя сторона',
  w: 'Левая сторона',
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Largest rect of `aspect` inside the stage minus `inset` on every side, centred. */
export function fitCropFrame(stage: CropSize, aspect: number, inset: number): CropRect {
  const room = { width: Math.max(stage.width - inset * 2, 1), height: Math.max(stage.height - inset * 2, 1) };
  const width = Math.min(room.width, room.height * aspect);
  const height = width / aspect;
  return { x: (stage.width - width) / 2, y: (stage.height - height) / 2, width, height };
}

/** Scale at which the whole picture fits the stage: zoom 100 %. */
export function containScale(image: CropSize, stage: CropSize): number {
  return Math.min(stage.width / image.width, stage.height / image.height);
}

/** Smallest scale at which the picture still fills the frame. */
export function coverScale(image: CropSize, frame: CropSize): number {
  return Math.max(frame.width / image.width, frame.height / image.height);
}

/** Top-left of the shown picture, moved so that it covers the frame. */
export function clampImagePosition(position: CropPoint, image: CropSize, frame: CropRect): CropPoint {
  return {
    x: clamp(position.x, frame.x + frame.width - image.width, frame.x),
    y: clamp(position.y, frame.y + frame.height - image.height, frame.y),
  };
}

/** Past [min, max] the value follows a third of the pull: the edge feels like a spring. */
export function rubberBand(value: number, min: number, max: number): number {
  if (value < min) return min - (min - value) * RUBBER;
  if (value > max) return max + (value - max) * RUBBER;
  return value;
}

/** Position after scaling `from` → `to` with the stage point `focus` staying put. */
export function zoomAround(position: CropPoint, from: number, to: number, focus: CropPoint): CropPoint {
  const k = to / from;
  return { x: focus.x - (focus.x - position.x) * k, y: focus.y - (focus.y - position.y) * k };
}

/** The frame in natural pixels of the turned picture, whole pixels inside it. */
export function cropArea(frame: CropRect, position: CropPoint, scale: number, image: CropSize): CropRect {
  const x = clamp(Math.round((frame.x - position.x) / scale), 0, image.width - 1);
  const y = clamp(Math.round((frame.y - position.y) / scale), 0, image.height - 1);
  return {
    x,
    y,
    width: clamp(Math.round(frame.width / scale), 1, image.width - x),
    height: clamp(Math.round(frame.height / scale), 1, image.height - y),
  };
}

export interface ResizeCropOptions {
  /** Width ÷ height kept by corners; with it sides do nothing. null — free. */
  aspect: number | null;
  /** Where the frame may go: the stage and the shown picture. */
  bounds: CropRect;
  min: number;
}

/** Frame after dragging `handle` by (dx, dy); `limited` when a side reached the minimum. */
export function resizeCropFrame(frame: CropRect, handle: CropHandle, dx: number, dy: number, { aspect, bounds, min }: ResizeCropOptions): { frame: CropRect; limited: boolean } {
  const right = frame.x + frame.width;
  const bottom = frame.y + frame.height;
  const boundsRight = bounds.x + bounds.width;
  const boundsBottom = bounds.y + bounds.height;
  const west = handle.includes('w');
  const north = handle.includes('n');

  if (aspect !== null) {
    if (handle.length === 1) return { frame, limited: false };
    const anchor = { x: west ? right : frame.x, y: north ? bottom : frame.y };
    const byX = frame.width + (west ? -dx : dx);
    const byY = (frame.height + (north ? -dy : dy)) * aspect;
    const wanted = Math.abs(byX - frame.width) >= Math.abs(byY - frame.width) ? byX : byY;
    const roomX = west ? anchor.x - bounds.x : boundsRight - anchor.x;
    const roomY = (north ? anchor.y - bounds.y : boundsBottom - anchor.y) * aspect;
    const least = aspect >= 1 ? min * aspect : min;
    const width = clamp(wanted, least, Math.max(Math.min(roomX, roomY), least));
    const height = width / aspect;
    return {
      frame: { x: west ? anchor.x - width : anchor.x, y: north ? anchor.y - height : anchor.y, width, height },
      limited: width <= least,
    };
  }

  let left = frame.x;
  let top = frame.y;
  let newRight = right;
  let newBottom = bottom;
  if (west) left = clamp(frame.x + dx, bounds.x, right - min);
  if (handle.includes('e')) newRight = clamp(right + dx, frame.x + min, boundsRight);
  if (north) top = clamp(frame.y + dy, bounds.y, bottom - min);
  if (handle.includes('s')) newBottom = clamp(bottom + dy, frame.y + min, boundsBottom);
  const next = { x: left, y: top, width: newRight - left, height: newBottom - top };
  return { frame: next, limited: next.width <= min || next.height <= min };
}

/** A point of the picture after a visual turn by ±90° (clockwise positive) or a mirror. */
export function rotateCropCenter(point: CropPoint, image: CropSize, turn: 0 | 90 | -90, flip: boolean): CropPoint {
  const turned = turn === 90 ? { x: image.height - point.y, y: point.x } : turn === -90 ? { x: point.y, y: image.width - point.x } : point;
  const width = turn === 0 ? image.width : image.height;
  return flip ? { x: width - turned.x, y: turned.y } : turned;
}

/** CSS transform that puts the natural-size picture, turned and mirrored, as a box at `position` scaled by `scale`. */
export function imageTransform(natural: CropSize, position: CropPoint, scale: number, rotation: number, flip: boolean): string {
  const sideways = rotation % 180 !== 0;
  const box = sideways ? { width: natural.height, height: natural.width } : natural;
  const x = position.x + (box.width * scale) / 2 - natural.width / 2;
  const y = position.y + (box.height * scale) / 2 - natural.height / 2;
  return `translate(${x}px, ${y}px) scale(${scale})${flip ? ' scaleX(-1)' : ''} rotate(${rotation}deg)`;
}

const turnedSize = (natural: CropSize, rotation: number): CropSize =>
  rotation % 180 === 0 ? natural : { width: natural.height, height: natural.width };

/** Inset of the fitted frame: the mockup's 56 at a 420 stage (30 for the round mask at 340), less on small stages. */
const frameInset = (stage: CropSize, circle: boolean) => {
  const side = Math.min(stage.width, stage.height);
  return circle ? Math.min(30, Math.round(side * 0.09)) : Math.min(56, Math.round(side * 0.134));
};

interface Layout {
  frame: CropRect;
  position: CropPoint;
  zoom: number;
}

interface Scene {
  stage: CropSize;
  natural: CropSize;
  rotation: number;
}

const sceneScale = (scene: Scene, zoom: number) => containScale(turnedSize(scene.natural, scene.rotation), scene.stage) * zoom;

const imageBox = (scene: Scene, layout: Layout): CropSize => {
  const turned = turnedSize(scene.natural, scene.rotation);
  const scale = sceneScale(scene, layout.zoom);
  return { width: turned.width * scale, height: turned.height * scale };
};

/** Lowest zoom that still fills the frame (above 100 % when the frame is wider than the fitted picture). */
const minZoomFor = (scene: Scene, frame: CropSize) => {
  const turned = turnedSize(scene.natural, scene.rotation);
  return Math.max(MIN_ZOOM, coverScale(turned, frame) / containScale(turned, scene.stage));
};

/** Picture placed so that its natural point `center` sits in the middle of the frame. */
function placeImage(scene: Scene, frame: CropRect, zoom: number, center: CropPoint): Layout {
  const z = clamp(zoom, minZoomFor(scene, frame), MAX_ZOOM);
  const scale = sceneScale(scene, z);
  const turned = turnedSize(scene.natural, scene.rotation);
  const position = clampImagePosition(
    { x: frame.x + frame.width / 2 - center.x * scale, y: frame.y + frame.height / 2 - center.y * scale },
    { width: turned.width * scale, height: turned.height * scale },
    frame,
  );
  return { frame, position, zoom: z };
}

function fitLayout(scene: Scene, aspect: number | null, circle: boolean, zoom: number, center?: CropPoint): Layout {
  const turned = turnedSize(scene.natural, scene.rotation);
  const frame = fitCropFrame(scene.stage, circle ? 1 : (aspect ?? turned.width / turned.height), frameInset(scene.stage, circle));
  return placeImage(scene, frame, zoom, center ?? { x: turned.width / 2, y: turned.height / 2 });
}

const centerOf = (scene: Scene, layout: Layout): CropPoint => {
  const scale = sceneScale(scene, layout.zoom);
  return {
    x: (layout.frame.x + layout.frame.width / 2 - layout.position.x) / scale,
    y: (layout.frame.y + layout.frame.height / 2 - layout.position.y) / scale,
  };
};

const sizeText = (size: CropSize) => `${size.width} × ${size.height}`;
const wrap = (deg: number) => (((deg % 360) + 360) % 360) as CropRotation;

type Status = 'empty' | 'opening' | 'error' | 'ready';

interface CropperContextValue {
  id: string;
  status: Status;
  dragOver: boolean;
  error: string | null;
  source: string | null;
  natural: CropSize | null;
  scene: Scene | null;
  layout: Layout | null;
  crop: ImageCrop | null;
  aspect: number | null;
  circle: boolean;
  rotation: CropRotation;
  flip: boolean;
  busy: boolean;
  low: boolean;
  maxSize: number;
  setStage: (stage: CropSize) => void;
  setLayout: (layout: Layout) => void;
  setAspect: (aspect: number | null) => void;
  setZoom: (zoom: number, focus?: CropPoint) => void;
  rotate: () => void;
  toggleFlip: () => void;
  reset: () => void;
  pick: () => void;
  take: (file: File | undefined) => void;
  setDragOver: (over: boolean) => void;
  onLoad: (image: HTMLImageElement) => void;
  onError: () => void;
  apply: () => void;
}

const CropperContext = createContext<CropperContextValue | null>(null);

function useCropper(part: string): CropperContextValue {
  const context = use(CropperContext);
  if (!context) throw new Error(`${part} must be inside <ImageCropper>`);
  return context;
}

export interface UseImageCropper {
  /** The current crop; null until the picture opens. */
  crop: ImageCrop | null;
  status: Status;
  busy: boolean;
  /** Opens the file picker: «Другое фото». */
  pick: () => void;
  /** Back to the whole picture: no turn, no mirror, zoom 100 %, frame fitted. */
  reset: () => void;
}

/** Crop state and actions for buttons placed inside <ImageCropper>: «Сбросить», «Другое фото», «Применить». */
export function useImageCropper(): UseImageCropper {
  const { crop, status, busy, pick, reset } = useCropper('useImageCropper');
  return { crop, status, busy, pick, reset };
}

export interface ImageCropperProps {
  /** Picture to crop; without it the stage is a drop zone. A picked or dropped file replaces it. */
  src?: string;
  /** Width ÷ height of the frame; null — free. */
  aspect?: number | null;
  defaultAspect?: number | null;
  onAspectChange?: (aspect: number | null) => void;
  /** circle — a round mask of a fixed size for avatars: no handles, no grid, no size badge. */
  shape?: 'rect' | 'circle';
  /** Result smaller than this turns the size badge into «— будет мыльно». */
  minResult?: CropSize;
  /** Largest file accepted, bytes (20 МБ). */
  maxSize?: number;
  /** Saving: the stage dims, a spinner shows, nothing reacts. */
  busy?: boolean;
  /** Every settled change of the crop. */
  onCropChange?: (crop: ImageCrop | null) => void;
  /** Enter on the frame. */
  onApply?: (crop: ImageCrop) => void;
  children: ReactNode;
  className?: string;
}

/**
 * The frame stands still and the picture moves under it, so the crop never slips from under the finger.
 * Parts: ImageCropperStage, ImageCropperAspect, ImageCropperZoom, ImageCropperRotate, ImageCropperFlip, ImageCropperPreview;
 * cut the result with `cropImage(crop)`.
 */
export function ImageCropper({
  src,
  aspect: aspectProp,
  defaultAspect = null,
  onAspectChange,
  shape = 'rect',
  minResult,
  maxSize = DEFAULT_MAX_SIZE,
  busy = false,
  onCropChange,
  onApply,
  children,
  className,
}: ImageCropperProps) {
  const id = useId();
  const circle = shape === 'circle';
  const [aspect, setAspectValue] = useControllable(aspectProp, defaultAspect, onAspectChange);
  const [propSrc, setPropSrc] = useState(src);
  const [source, setSource] = useState<string | null>(src ?? null);
  const [status, setStatus] = useState<Status>(src ? 'opening' : 'empty');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [natural, setNatural] = useState<CropSize | null>(null);
  const [stage, setStageSize] = useState<CropSize | null>(null);
  const [rotation, setRotation] = useState<CropRotation>(0);
  const [flip, setFlip] = useState(false);
  const [ownLayout, setLayout] = useState<Layout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrl = useRef<string | null>(null);

  if (src !== propSrc) {
    setPropSrc(src);
    setSource(src ?? null);
    setStatus(src ? 'opening' : 'empty');
    setNatural(null);
    setLayout(null);
  }

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  const scene: Scene | null = stage && natural && stage.width > 0 && stage.height > 0 ? { stage, natural, rotation } : null;

  // Until the first gesture the frame is fitted from the stage and the picture, so a resize before it just refits.
  const layout = ownLayout ?? (scene && status === 'ready' ? fitLayout(scene, aspect, circle, MIN_ZOOM) : null);

  const turned = natural ? turnedSize(natural, rotation) : null;
  const crop: ImageCrop | null =
    scene && layout && turned && source && status === 'ready'
      ? { src: source, ...cropArea(layout.frame, layout.position, sceneScale(scene, layout.zoom), turned), rotation, flip }
      : null;
  const cropKey = crop ? `${crop.src} ${crop.x} ${crop.y} ${crop.width} ${crop.height} ${crop.rotation} ${crop.flip}` : '';
  const report = useEffectEvent(() => onCropChange?.(crop));
  useEffect(() => report(), [cropKey]);

  const setStage = (next: CropSize) => {
    setStageSize((previous) => (previous && previous.width === next.width && previous.height === next.height ? previous : next));
    // A resized stage refits the frame around the same part of the picture.
    if (natural && ownLayout && layout && stage && (stage.width !== next.width || stage.height !== next.height) && next.width > 0 && next.height > 0) {
      const old = { stage, natural, rotation };
      setLayout(fitLayout({ stage: next, natural, rotation }, aspect, circle, layout.zoom, centerOf(old, layout)));
    }
  };

  const setAspect = (next: number | null) => {
    setAspectValue(next);
    if (scene && layout) setLayout(fitLayout(scene, next, circle, layout.zoom, centerOf(scene, layout)));
  };

  const setZoom = (zoom: number, focus?: CropPoint) => {
    if (!scene || !layout) return;
    const z = clamp(zoom, minZoomFor(scene, layout.frame), MAX_ZOOM);
    const point = focus ?? { x: layout.frame.x + layout.frame.width / 2, y: layout.frame.y + layout.frame.height / 2 };
    const moved = zoomAround(layout.position, sceneScale(scene, layout.zoom), sceneScale(scene, z), point);
    const next = { ...layout, zoom: z };
    setLayout({ ...next, position: clampImagePosition(moved, imageBox(scene, next), layout.frame) });
  };

  // The rotate button turns counter-clockwise, as its icon shows; with a mirror the angle runs the other way.
  const rotate = () => {
    if (!scene || !layout || !natural) return;
    const center = rotateCropCenter(centerOf(scene, layout), turnedSize(natural, rotation), -90, false);
    const next = wrap(rotation + (flip ? 90 : -90));
    setRotation(next);
    setLayout(fitLayout({ ...scene, rotation: next }, aspect, circle, layout.zoom, center));
  };

  const toggleFlip = () => {
    if (!scene || !layout || !natural) return;
    const center = rotateCropCenter(centerOf(scene, layout), turnedSize(natural, rotation), 0, true);
    setFlip(!flip);
    setLayout(placeImage(scene, layout.frame, layout.zoom, center));
  };

  const reset = () => {
    if (!scene) return;
    setRotation(0);
    setFlip(false);
    setLayout(fitLayout({ ...scene, rotation: 0 }, aspect, circle, MIN_ZOOM));
  };

  const take = (file: File | undefined) => {
    setDragOver(false);
    if (!file) return;
    const extension = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toUpperCase();
    if (!file.type.startsWith('image/') && !/^(HEIC|HEIF)$/.test(extension ?? '')) {
      setError(extension ? `Это ${extension}, а нужно фото` : 'Это не фото');
      setStatus('error');
      return;
    }
    if (file.size > maxSize) {
      setError(`Фото больше ${formatFileSize(maxSize)}`);
      setStatus('error');
      return;
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    setSource(objectUrl.current);
    setError(null);
    setStatus('opening');
    setNatural(null);
    setLayout(null);
    setRotation(0);
    setFlip(false);
  };

  const onLoad = (image: HTMLImageElement) => {
    if (image.naturalWidth === 0 || image.naturalHeight === 0) return;
    setNatural({ width: image.naturalWidth, height: image.naturalHeight });
    setStatus('ready');
  };

  const onError = () => {
    setError('Не удалось открыть фото');
    setStatus('error');
  };

  const value: CropperContextValue = {
    id,
    status,
    dragOver,
    error,
    source,
    natural,
    scene,
    layout,
    crop,
    aspect: circle ? 1 : aspect,
    circle,
    rotation,
    flip,
    busy,
    low: Boolean(crop && minResult && (crop.width < minResult.width || crop.height < minResult.height)),
    maxSize,
    setStage,
    setLayout,
    setAspect,
    setZoom,
    rotate,
    toggleFlip,
    reset,
    pick: () => inputRef.current?.click(),
    take,
    setDragOver,
    onLoad,
    onError,
    apply: () => {
      if (crop) onApply?.(crop);
    },
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (busy || status !== 'ready' || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target instanceof HTMLInputElement && event.target.type !== 'range') return;
    const key = event.key.toLowerCase();
    if (key === 'r' || key === 'к') {
      event.preventDefault();
      rotate();
    } else if (key === 'h' || key === 'р') {
      event.preventDefault();
      toggleFlip();
    }
  };

  return (
    <CropperContext value={value}>
      <div data-slot="image-cropper" onKeyDown={onKeyDown} className={cn('flex flex-col', className)}>
        <input
          ref={inputRef}
          type="file"
          hidden
          tabIndex={-1}
          accept="image/*,.heic,.heif"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            take(event.target.files?.[0]);
            // Lets the same file be picked again after a refusal.
            event.target.value = '';
          }}
        />
        {children}
      </div>
    </CropperContext>
  );
}

interface Gesture {
  kind: 'pan' | 'pinch' | 'handle';
  handle?: CropHandle;
  start: Layout;
  pointer: CropPoint;
  distance: number;
}

const handleSteps: Record<string, CropPoint> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };

const reducedMotion = () =>
  document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface ImageCropperStageProps {
  /** The stage keeps the mockup's 760 : 420 unless a height is given here: `h-[340px]`. */
  className?: string;
}

/** The dark stage: drop zone, opening, error, or the picture under the frame with handles and the size badge. */
export function ImageCropperStage({ className }: ImageCropperStageProps) {
  const cropper = useCropper('ImageCropperStage');
  const { status, scene, layout, crop, circle, busy, aspect, setLayout, setStage, setZoom } = cropper;
  const ref = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, CropPoint>());
  const gesture = useRef<Gesture | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [dragging, setDragging] = useState<'pan' | 'pinch' | CropHandle | null>(null);
  const [settling, setSettling] = useState(false);
  const [limit, setLimit] = useState(false);
  const [minimum, setMinimum] = useState<CropHandle | null>(null);
  const [said, setSaid] = useState('');
  const ready = status === 'ready' && scene !== null && layout !== null;

  const measure = useEffectEvent((node: HTMLElement) => setStage({ width: node.clientWidth, height: node.clientHeight }));
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => measure(node));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  // React's wheel listener is passive: preventDefault (no page scroll) needs a native one.
  const onWheel = useEffectEvent((event: WheelEvent) => {
    const node = ref.current;
    if (!ready || busy || !node) return;
    event.preventDefault();
    const rect = node.getBoundingClientRect();
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    setZoom(layout.zoom * Math.exp(-delta * 0.002), { x: event.clientX - rect.left, y: event.clientY - rect.top });
  });
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const listener = (event: WheelEvent) => onWheel(event);
    node.addEventListener('wheel', listener, { passive: false });
    return () => node.removeEventListener('wheel', listener);
  }, []);

  const local = (event: PointerEvent<HTMLElement>): CropPoint => {
    const rect = ref.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  const bounds = (next: Layout): CropRect => {
    if (!scene) return next.frame;
    const box = imageBox(scene, next);
    const left = Math.max(0, next.position.x);
    const top = Math.max(0, next.position.y);
    return {
      x: left,
      y: top,
      width: Math.min(scene.stage.width, next.position.x + box.width) - left,
      height: Math.min(scene.stage.height, next.position.y + box.height) - top,
    };
  };

  const settle = (next: Layout) => {
    if (!scene) return;
    const clamped = clampImagePosition(next.position, imageBox(scene, next), next.frame);
    if (clamped.x !== next.position.x || clamped.y !== next.position.y) {
      setSettling(!reducedMotion());
      clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => setSettling(false), SETTLE_MS);
    }
    setLayout({ ...next, position: clamped });
    setLimit(false);
  };

  const startPan = (point: CropPoint) => {
    if (!layout) return;
    gesture.current = { kind: 'pan', start: layout, pointer: point, distance: 0 };
    setDragging('pan');
  };

  const pinchInfo = () => {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return null;
    return { mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, distance: Math.hypot(a.x - b.x, a.y - b.y) };
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!ready || busy || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const handle = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-slot=image-cropper-handle]')?.dataset.handle : undefined;
    if (isHandle(handle)) {
      onHandleDown(handle, event);
      return;
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = local(event);
    pointers.current.set(event.pointerId, point);
    setSettling(false);
    if (pointers.current.size === 2) {
      const pinch = pinchInfo();
      if (!pinch) return;
      gesture.current = { kind: 'pinch', start: layout, pointer: pinch.mid, distance: pinch.distance };
      setDragging('pinch');
    } else if (pointers.current.size === 1) {
      startPan(point);
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current || !scene || !pointers.current.has(event.pointerId)) return;
    const point = local(event);
    pointers.current.set(event.pointerId, point);
    const { start } = current;
    if (current.kind === 'pan') {
      const raw = { x: start.position.x + point.x - current.pointer.x, y: start.position.y + point.y - current.pointer.y };
      const box = imageBox(scene, start);
      const minX = start.frame.x + start.frame.width - box.width;
      const minY = start.frame.y + start.frame.height - box.height;
      const position = { x: rubberBand(raw.x, minX, start.frame.x), y: rubberBand(raw.y, minY, start.frame.y) };
      setLimit(raw.x < minX || raw.x > start.frame.x || raw.y < minY || raw.y > start.frame.y);
      setLayout({ ...start, position });
    } else if (current.kind === 'pinch') {
      const pinch = pinchInfo();
      if (!pinch || current.distance === 0) return;
      const zoom = clamp((start.zoom * pinch.distance) / current.distance, minZoomFor(scene, start.frame), MAX_ZOOM);
      const zoomed = zoomAround(start.position, sceneScale(scene, start.zoom), sceneScale(scene, zoom), current.pointer);
      const next = { ...start, zoom };
      const position = { x: zoomed.x + pinch.mid.x - current.pointer.x, y: zoomed.y + pinch.mid.y - current.pointer.y };
      setLayout({ ...next, position: clampImagePosition(position, imageBox(scene, next), start.frame) });
    } else if (current.handle) {
      const { frame, limited } = resizeCropFrame(start.frame, current.handle, point.x - current.pointer.x, point.y - current.pointer.y, {
        aspect,
        bounds: bounds(start),
        min: MIN_FRAME,
      });
      setMinimum(limited ? current.handle : null);
      setLayout({ ...start, frame });
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    const current = gesture.current;
    if (current?.kind === 'handle' && crop) setSaid(sizeText(crop));
    if (pointers.current.size === 1 && current?.kind === 'pinch') {
      const [rest] = [...pointers.current.values()];
      if (rest && layout) {
        gesture.current = { kind: 'pan', start: layout, pointer: rest, distance: 0 };
        setDragging('pan');
      }
      return;
    }
    if (pointers.current.size > 0) return;
    gesture.current = null;
    setDragging(null);
    setMinimum(null);
    if (layout) settle(layout);
  };

  const onHandleDown = (handle: CropHandle, event: PointerEvent<HTMLDivElement>) => {
    if (!ready || busy || (aspect !== null && handle.length === 1) || pointers.current.size > 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = local(event);
    pointers.current.set(event.pointerId, point);
    gesture.current = { kind: 'handle', handle, start: layout, pointer: point, distance: 0 };
    setDragging(handle);
  };

  const onFrameKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!ready || busy) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      cropper.apply();
      return;
    }
    const step = handleSteps[event.key];
    if (!step) return;
    event.preventDefault();
    const by = event.shiftKey ? 10 : 1;
    const wanted = { x: layout.position.x - step.x * by, y: layout.position.y - step.y * by };
    const position = clampImagePosition(wanted, imageBox(scene, layout), layout.frame);
    setLimit(position.x !== wanted.x || position.y !== wanted.y);
    setLayout({ ...layout, position });
  };

  const onHandleKey = (handle: CropHandle, event: KeyboardEvent<HTMLDivElement>) => {
    if (!ready || busy) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      cropper.apply();
      return;
    }
    const step = handleSteps[event.key];
    if (!step) return;
    const moves = handle.length === 2 || (step.x !== 0 ? handle === 'e' || handle === 'w' : handle === 'n' || handle === 's');
    if (!moves) return;
    event.preventDefault();
    const by = event.shiftKey ? 10 : 1;
    const { frame, limited } = resizeCropFrame(layout.frame, handle, step.x * by, step.y * by, { aspect, bounds: bounds(layout), min: MIN_FRAME });
    setMinimum(limited ? handle : null);
    setLayout({ ...layout, frame });
  };

  const zone = status === 'empty' || status === 'error';
  const zoneEvents = zone
    ? {
        onDragEnter: (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          cropper.setDragOver(true);
        },
        onDragOver: (event: DragEvent<HTMLDivElement>) => event.preventDefault(),
        onDragLeave: (event: DragEvent<HTMLDivElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) cropper.setDragOver(false);
        },
        onDrop: (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          cropper.take(event.dataTransfer?.files?.[0]);
        },
      }
    : {};
  const state = cropper.dragOver && zone ? 'drag' : status;
  const showGrid = dragging !== null && !circle;
  const frame = layout?.frame;
  const label = crop ? sizeText(crop) : '';
  const corner: CropHandle = dragging && dragging !== 'pan' && dragging !== 'pinch' && dragging.length === 2 ? dragging : 'se';

  return (
    <div
      ref={ref}
      data-slot="image-cropper-stage"
      data-state={state}
      data-shape={circle ? 'circle' : 'rect'}
      data-dragging={dragging ? '' : undefined}
      data-settling={settling ? '' : undefined}
      aria-busy={status === 'opening' || busy || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        'relative aspect-[760/420] w-full shrink-0 touch-none overflow-hidden select-none',
        zone ? 'p-4' : 'bg-media-bg',
        ready && !busy && 'cursor-move',
        className,
      )}
      {...zoneEvents}
    >
      {cropper.source && status !== 'error' ? (
        <img
          data-slot="image-cropper-image"
          src={cropper.source}
          alt=""
          draggable={false}
          ref={(node) => {
            if (node?.complete && node.naturalWidth > 0 && status === 'opening') cropper.onLoad(node);
          }}
          onLoad={(event) => cropper.onLoad(event.currentTarget)}
          onError={cropper.onError}
          className={cn(
            'pointer-events-none absolute top-0 left-0 max-w-none origin-center transition-opacity duration-(--duration-base) ease-out',
            ready ? (busy ? 'opacity-50' : 'opacity-100') : 'opacity-0',
          )}
          style={
            ready && cropper.natural
              ? {
                  width: cropper.natural.width,
                  height: cropper.natural.height,
                  transform: imageTransform(cropper.natural, layout.position, sceneScale(scene, layout.zoom), cropper.rotation, cropper.flip),
                  transition: settling ? 'transform var(--spring-micro), opacity var(--duration-base) var(--ease-out)' : undefined,
                }
              : undefined
          }
        />
      ) : null}

      {ready && frame ? (
        <>
          <svg aria-hidden data-slot="image-cropper-mask" className="pointer-events-none absolute inset-0 size-full fill-media-scrim">
            <path
              fillRule="evenodd"
              d={`M0 0H${scene.stage.width}V${scene.stage.height}H0Z ${
                circle
                  ? `M${frame.x} ${frame.y + frame.height / 2}a${frame.width / 2} ${frame.height / 2} 0 1 0 ${frame.width} 0a${frame.width / 2} ${frame.height / 2} 0 1 0 ${-frame.width} 0Z`
                  : `M${frame.x} ${frame.y}V${frame.y + frame.height}H${frame.x + frame.width}V${frame.y}Z`
              }`}
            />
          </svg>
          {showGrid ? (
            <div
              aria-hidden
              data-slot="image-cropper-grid"
              className="pointer-events-none absolute grid grid-cols-3 grid-rows-3 [&>span]:border-[oklch(1_0_0/0.65)]"
              style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }}
            >
              {Array.from({ length: 9 }, (_, index) => (
                <span key={index} className={cn(index % 3 !== 2 && 'border-r', index < 6 && 'border-b')} />
              ))}
            </div>
          ) : null}
          <div
            role="group"
            aria-roledescription="рамка"
            aria-label={`Рамка, ${label}`}
            aria-describedby={`${cropper.id}-frame-hint`}
            tabIndex={0}
            data-slot="image-cropper-frame"
            data-limit={limit ? '' : undefined}
            onKeyDown={onFrameKey}
            onBlur={() => setLimit(false)}
            className={cn(
              'absolute border-[oklch(1_0_0)] transition-[opacity,border-color] duration-(--duration-fast) ease-out focus-visible:outline-media-ring',
              circle ? 'rounded-full border-[1.5px]' : 'border',
              limit && 'border-warning',
              busy && 'opacity-40',
            )}
            style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }}
          />
          <span id={`${cropper.id}-frame-hint`} hidden>
            Стрелки двигают кадр, с Shift — на 10. Enter — применить.
          </span>
          {circle
            ? null
            : [...CORNERS, ...SIDES].map((handle) => {
                const off = aspect !== null && handle.length === 1;
                return (
                  <CropHandleView
                    key={handle}
                    handle={handle}
                    frame={frame}
                    label={`${HANDLE_NAMES[handle]}, ${label}`}
                    disabled={off || busy}
                    active={dragging === handle}
                    minimum={minimum === handle}
                    onKeyDown={(event) => onHandleKey(handle, event)}
                    onKeyUp={(event) => {
                      if (crop && event.key in handleSteps) setSaid(sizeText(crop));
                    }}
                  />
                );
              })}
          {circle || !crop ? null : <SizeBadge stage={scene.stage} frame={frame} corner={corner} label={label} low={cropper.low} />}
        </>
      ) : null}

      {status === 'opening' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
          <Spinner size={24} className="text-media-fg-1" />
          <span className="text-caption font-medium text-media-fg-2">Открываем фото…</span>
        </div>
      ) : null}

      {busy && ready ? (
        <div data-slot="image-cropper-busy" className="absolute inset-0 flex items-center justify-center">
          <Spinner size={24} className="text-media-fg-1" />
        </div>
      ) : null}

      {zone ? <CropDropzone drag={state === 'drag'} /> : null}
      <Announce>{said}</Announce>
    </div>
  );
}

interface CropHandleViewProps {
  handle: CropHandle;
  frame: CropRect;
  label: string;
  disabled: boolean;
  active: boolean;
  minimum: boolean;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onKeyUp: (event: KeyboardEvent<HTMLDivElement>) => void;
}

// Each handle is drawn as the top-left one (or the top / left side) and mirrored into place.
const mirror: Record<CropHandle, string> = {
  nw: '',
  ne: '-scale-x-100',
  se: '-scale-100',
  sw: '-scale-y-100',
  n: '',
  s: '-scale-y-100',
  w: '',
  e: '-scale-x-100',
};

const cursors: Record<CropHandle, string> = {
  nw: 'cursor-nwse-resize',
  se: 'cursor-nwse-resize',
  ne: 'cursor-nesw-resize',
  sw: 'cursor-nesw-resize',
  n: 'cursor-ns-resize',
  s: 'cursor-ns-resize',
  e: 'cursor-ew-resize',
  w: 'cursor-ew-resize',
};

/** 44 px grab zone; a white 18×3 corner or 24×3 side bar, 22×4 / 28×4 with a halo under the pointer. */
function CropHandleView({ handle, frame, label, disabled, active, minimum, onKeyDown, onKeyUp }: CropHandleViewProps) {
  const x = handle.includes('w') ? frame.x : handle.includes('e') ? frame.x + frame.width : frame.x + frame.width / 2;
  const y = handle.includes('n') ? frame.y : handle.includes('s') ? frame.y + frame.height : frame.y + frame.height / 2;
  const side = handle.length === 1;
  const vertical = handle === 'w' || handle === 'e';
  const bar = cn('absolute transition-[width,height,left,top,background-color] duration-(--duration-fast) ease-out', minimum ? 'bg-warning' : 'bg-[oklch(1_0_0)]');
  return (
    <div
      role="group"
      aria-roledescription="ручка"
      aria-label={label}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      data-slot="image-cropper-handle"
      data-handle={handle}
      data-active={active ? '' : undefined}
      data-minimum={minimum ? '' : undefined}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      className={cn(
        'group/handle absolute size-11 -translate-x-1/2 -translate-y-1/2 outline-none',
        '[--kv-t:3px] [--kv-arm:22px] [--kv-bar:24px] hover:[--kv-t:4px] hover:[--kv-arm:26px] hover:[--kv-bar:28px] data-active:[--kv-t:4px] data-active:[--kv-arm:26px] data-active:[--kv-bar:28px]',
        disabled ? 'pointer-events-none opacity-40' : cursors[handle],
      )}
      style={{ left: x, top: y }}
    >
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 size-7 -translate-1/2 rounded-full bg-[oklch(1_0_0/0.12)] opacity-0 transition-[opacity,width,height] duration-(--duration-fast) ease-out group-hover/handle:opacity-100 group-data-active/handle:size-8 group-data-active/handle:bg-[oklch(1_0_0/0.18)] group-data-active/handle:opacity-100"
      />
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 hidden size-8 -translate-1/2 rounded-full border-2 border-media-ring group-focus-visible/handle:block"
      />
      <span aria-hidden className={cn('absolute top-1/2 left-1/2 size-0', mirror[handle])}>
        {side ? (
          <span
            className={cn(bar, 'rounded-full')}
            style={
              vertical
                ? { left: 'calc(0.5px - var(--kv-t))', top: 'calc(var(--kv-bar) / -2)', width: 'var(--kv-t)', height: 'var(--kv-bar)' }
                : { top: 'calc(0.5px - var(--kv-t))', left: 'calc(var(--kv-bar) / -2)', height: 'var(--kv-t)', width: 'var(--kv-bar)' }
            }
          />
        ) : (
          <>
            <span className={bar} style={{ left: 'calc(0.5px - var(--kv-t))', top: 'calc(0.5px - var(--kv-t))', width: 'var(--kv-arm)', height: 'var(--kv-t)' }} />
            <span className={bar} style={{ left: 'calc(0.5px - var(--kv-t))', top: 'calc(0.5px - var(--kv-t))', width: 'var(--kv-t)', height: 'var(--kv-arm)' }} />
          </>
        )}
      </span>
    </div>
  );
}

interface SizeBadgeProps {
  stage: CropSize;
  frame: CropRect;
  corner: CropHandle;
  label: string;
  low: boolean;
}

/** Result size in pixels next to the corner being pulled (bottom-right at rest), kept inside the stage. */
function SizeBadge({ stage, frame, corner, label, low }: SizeBadgeProps) {
  const east = corner.includes('e');
  const south = corner.includes('s');
  const x = east ? frame.x + frame.width + 24 : frame.x - 24;
  const top = clamp(south ? frame.y + frame.height + 12 : frame.y - 36, 8, stage.height - 32);
  return (
    <div
      data-slot="image-cropper-size"
      data-low={low ? '' : undefined}
      aria-hidden
      className={cn(
        'pointer-events-none absolute flex h-6 items-center gap-1.5 rounded-xs px-2 text-caption font-semibold whitespace-nowrap tabular-nums',
        low ? 'bg-warning text-warning-fg' : 'bg-media-glass text-media-fg-1 shadow-[0_0_0_1px_var(--color-media-hairline)] backdrop-blur-md',
      )}
      style={{ left: clamp(x, 8, stage.width - 8), top, translate: east ? '-100% 0' : undefined }}
    >
      {low ? <TriangleAlert aria-hidden className="size-3.5 stroke-2" /> : null}
      {low ? `${label} — будет мыльно` : label}
    </div>
  );
}

function CropDropzone({ drag }: { drag: boolean }) {
  const { error, pick, maxSize, id } = useCropper('ImageCropperStage');
  const failed = error !== null && !drag;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-labelledby={`${id}-zone-title`}
      aria-describedby={`${id}-zone-hint`}
      data-slot="image-cropper-dropzone"
      onClick={pick}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        pick();
      }}
      className={cn(
        'group/zone flex size-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed p-3 text-center transition-[border-color,background-color] duration-(--duration-fast) ease-hover',
        drag ? 'border-accent bg-accent-soft' : failed ? 'border-danger bg-danger-soft' : 'border-input bg-surface-2 hover:border-fg-3',
      )}
    >
      {drag ? (
        <>
          <Upload aria-hidden className="size-6 stroke-[1.75] text-accent" />
          <span id={`${id}-zone-title`} className="text-label-sm font-semibold text-accent-soft-fg">
            Отпустите, чтобы открыть
          </span>
        </>
      ) : failed ? (
        <>
          <CircleAlert aria-hidden className="size-5.5 stroke-[1.75] text-danger" />
          <span className="flex flex-col items-center gap-0.5">
            <span id={`${id}-zone-title`} role="alert" className="text-label-sm font-semibold text-danger-soft-fg">
              {error}
            </span>
            <span id={`${id}-zone-hint`} className="text-caption font-medium text-fg-2">
              Выбрать другой файл
            </span>
          </span>
        </>
      ) : (
        <>
          <ImageIcon aria-hidden className="size-6 stroke-[1.6] text-fg-3" />
          <span id={`${id}-zone-title`} className="flex flex-col items-center gap-0.5">
            <span className="text-label-sm font-medium text-fg-1">Перетащите фото</span>{' '}
            <span className="text-caption font-medium text-accent-soft-fg decoration-1 underline-offset-3 group-hover/zone:underline">
              или выберите файл
            </span>
          </span>
          <span id={`${id}-zone-hint`} className="text-overline text-fg-3">
            JPG, PNG, HEIC · до {formatFileSize(maxSize)}
          </span>
        </>
      )}
    </div>
  );
}

export interface ImageCropperAspectProps {
  /** Default: Свободно · 1:1 · 4:3 · 16:9. */
  options?: readonly CropAspectOption[];
  className?: string;
}

/** Segmented control of proportions; a change refits the frame in the centre. */
export function ImageCropperAspect({ options = ASPECTS, className }: ImageCropperAspectProps) {
  const { aspect, setAspect, status, busy } = useCropper('ImageCropperAspect');
  const current = options.find((option) => option.value === aspect) ?? options[0];
  return (
    <SegmentedControl
      aria-label="Пропорции"
      options={options.map((option) => ({ value: option.label, label: <span className="tabular-nums">{option.label}</span> }))}
      value={current?.label}
      onValueChange={(label) => setAspect(options.find((option) => option.label === label)?.value ?? null)}
      disabled={status !== 'ready' || busy}
      className={className}
    />
  );
}

export interface ImageCropperZoomProps {
  className?: string;
}

/** 100–400 %: the slider, the wheel and a pinch on the stage drive the same value. */
export function ImageCropperZoom({ className }: ImageCropperZoomProps) {
  const { layout, setZoom, status, busy } = useCropper('ImageCropperZoom');
  const percent = Math.round((layout?.zoom ?? 1) * 100);
  return (
    <div data-slot="image-cropper-zoom" className={cn('flex min-w-0 grow items-center gap-2.5', className)}>
      <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 fill-none stroke-fg-3 stroke-[1.75]">
        <rect x="5" y="7" width="14" height="10" rx="2" />
      </svg>
      <BaseSlider.Root
        value={percent}
        min={MIN_ZOOM * 100}
        max={MAX_ZOOM * 100}
        step={1}
        largeStep={10}
        disabled={status !== 'ready' || busy}
        onValueChange={(value) => setZoom(value / 100)}
        className="grow data-disabled:opacity-50"
      >
        <BaseSlider.Control className="relative flex h-4 w-full touch-none items-center select-none after:absolute after:inset-x-0 after:-inset-y-3.5">
          <BaseSlider.Track className="relative h-1 w-full rounded-full bg-fill-3">
            <BaseSlider.Indicator className="rounded-full bg-accent" />
            <BaseSlider.Thumb
              aria-label="Масштаб"
              getAriaValueText={(_formatted, value) => `${value} %`}
              className="size-4 rounded-full bg-surface-1 shadow-[0_1px_3px_oklch(var(--ink)/0.2),0_0_0_1.5px_var(--color-fg-3)] outline-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            />
          </BaseSlider.Track>
        </BaseSlider.Control>
      </BaseSlider.Root>
      <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0 fill-none stroke-fg-3 stroke-[1.75]">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
      </svg>
      <span data-slot="image-cropper-zoom-value" className="shrink-0 text-right text-label-sm font-medium whitespace-nowrap text-fg-2 tabular-nums">
        {percent} %
      </span>
    </div>
  );
}

/** 18 px icons as in the mockup: inline size beats the 16 px of small icon buttons. */
const icon18 = { width: 18, height: 18 } as const;

export function ImageCropperRotate({ className }: { className?: string }) {
  const { rotate, status, busy } = useCropper('ImageCropperRotate');
  return (
    <Tooltip content="Повернуть на 90°" shortcut="R">
      <IconButton
        aria-label="Повернуть на 90°"
        aria-keyshortcuts="R"
        size="sm"
        variant="ghost"
        disabled={status !== 'ready' || busy}
        onClick={rotate}
        icon={<RotateCcw aria-hidden style={icon18} />}
        className={className}
      />
    </Tooltip>
  );
}

export function ImageCropperFlip({ className }: { className?: string }) {
  const { toggleFlip, flip, status, busy } = useCropper('ImageCropperFlip');
  return (
    <Tooltip content="Отразить" shortcut="H">
      <IconButton
        aria-label="Отразить"
        aria-keyshortcuts="H"
        aria-pressed={flip}
        size="sm"
        variant="ghost"
        disabled={status !== 'ready' || busy}
        onClick={toggleFlip}
        icon={
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={icon18}>
            <path d="M12 3v18" strokeLinecap="round" strokeDasharray="2 3" />
            <path d="M8 7 3 17h5V7ZM16 7l5 10h-5V7Z" strokeLinejoin="round" />
          </svg>
        }
        className={cn('aria-pressed:bg-fill-2', className)}
      />
    </Tooltip>
  );
}

export interface ImageCropperPreviewProps {
  /** Width in px: 64, 40, 24 for avatars. */
  size: number;
  /** Line under the preview (default: the size). */
  label?: ReactNode;
  className?: string;
}

/** The crop at a small size, live: how the photo will look in a chat or a list. */
export function ImageCropperPreview({ size, label, className }: ImageCropperPreviewProps) {
  const { scene, layout, natural, rotation, flip, source, circle, status } = useCropper('ImageCropperPreview');
  const frame = layout?.frame;
  const k = frame ? size / frame.width : 0;
  const height = frame ? Math.round(frame.height * k) : size;
  return (
    <div data-slot="image-cropper-preview" className={cn('flex flex-col items-center gap-1.5', className)} style={{ width: size }}>
      <div className={cn('relative shrink-0 overflow-hidden bg-surface-2', circle ? 'rounded-full' : 'rounded-xs')} style={{ width: size, height }}>
        {status === 'ready' && scene && layout && natural && frame && source ? (
          <img
            src={source}
            alt=""
            draggable={false}
            className="pointer-events-none absolute top-0 left-0 max-w-none origin-center"
            style={{
              width: natural.width,
              height: natural.height,
              transform: imageTransform(
                natural,
                { x: (layout.position.x - frame.x) * k, y: (layout.position.y - frame.y) * k },
                sceneScale(scene, layout.zoom) * k,
                rotation,
                flip,
              ),
            }}
          />
        ) : null}
      </div>
      <span className="text-caption font-medium text-fg-3 tabular-nums">{label ?? size}</span>
    </div>
  );
}

export interface CropImageOptions {
  /** Output width in px (default: the crop width); the height keeps the crop proportion. */
  width?: number;
  /** image/png (default), image/jpeg, image/webp. */
  type?: string;
  /** 0–1 for jpeg and webp. */
  quality?: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    if (/^https?:/.test(src)) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Не удалось открыть фото'));
    image.src = src;
  });
}

async function drawCrop(crop: ImageCrop, width: number | undefined): Promise<HTMLCanvasElement> {
  const image = await loadImage(crop.src);
  const natural = { width: image.naturalWidth, height: image.naturalHeight };
  const turned = turnedSize(natural, crop.rotation);
  const outWidth = Math.round(width ?? crop.width);
  const outHeight = Math.round((outWidth * crop.height) / crop.width);
  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is not available');
  context.imageSmoothingQuality = 'high';
  // Same order as the stage transform: turn first, then mirror, inside the turned picture's box.
  context.scale(outWidth / crop.width, outHeight / crop.height);
  context.translate(-crop.x, -crop.y);
  context.translate(turned.width / 2, turned.height / 2);
  if (crop.flip) context.scale(-1, 1);
  context.rotate((crop.rotation * Math.PI) / 180);
  context.drawImage(image, -natural.width / 2, -natural.height / 2);
  return canvas;
}

/** Cuts the crop out of its picture: a Blob for upload. */
export async function cropImage(crop: ImageCrop, { width, type = 'image/png', quality }: CropImageOptions = {}): Promise<Blob> {
  const canvas = await drawCrop(crop, width);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Не удалось сохранить фото'))), type, quality);
  });
}

/** The same as a data URL, for a preview or an <img>. */
export async function cropImageToDataUrl(crop: ImageCrop, { width, type = 'image/png', quality }: CropImageOptions = {}): Promise<string> {
  const canvas = await drawCrop(crop, width);
  return canvas.toDataURL(type, quality);
}
