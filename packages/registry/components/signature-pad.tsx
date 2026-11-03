import { Button as BaseButton } from '@base-ui/react/button';
import { Check, CircleX, PenLine, Undo2 } from 'lucide-react';
import { useEffect, useEffectEvent, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button, buttonShape, IconButton } from './button';
import { Announce } from './visually-hidden';

export interface SignaturePoint {
  x: number;
  y: number;
  /** Line width at this point, px. */
  width: number;
}
export type SignatureStroke = readonly SignaturePoint[];

/** What was signed: strokes in pad pixels, or a name set in a font; ink is the resolved colour of the pad. */
export interface SignatureData {
  strokes: readonly SignatureStroke[];
  typed: string | null;
  width: number;
  height: number;
  color: string;
  /** CSS font of the typed name: `italic 500 32px Inter`. */
  font?: string;
}

export interface SignatureSegment {
  from: { x: number; y: number };
  /** Quadratic control point; a straight piece has none. */
  control?: { x: number; y: number };
  to: { x: number; y: number };
  width: number;
}

const MIN_WIDTH = 2;
const MAX_WIDTH = 3.5;
/** px per ms at which a finger or mouse line is thinnest. */
const FAST = 3;
const TYPED_SIZE = 32;
/** The line sits 40 px above the bottom; the typed name stands on it. */
const LINE_FROM_BOTTOM = 40;
// Padding 32 + the cross and its gap: the name starts where the line does.
const TYPED_LEFT = 52;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const mid = (a: SignaturePoint, b: SignaturePoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const at = (point: SignaturePoint) => ({ x: point.x, y: point.y });

/** Pen: by pressure, 2–3.5. Finger and mouse have none: slow is thick, fast is thin. */
export function signatureStrokeWidth({ pointerType, pressure, speed }: { pointerType: string; pressure: number; speed: number }): number {
  if (pointerType === 'pen') return MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * clamp(pressure, 0, 1);
  return MAX_WIDTH - (MAX_WIDTH - MIN_WIDTH) * Math.min(speed / FAST, 1);
}

/** Pieces of a stroke: quadratic curves through the midpoints, straight ends; one point is a dot. */
export function smoothStroke(points: SignatureStroke): SignatureSegment[] {
  const first = points[0];
  if (!first) return [];
  const second = points[1];
  if (!second) return [{ from: at(first), to: at(first), width: first.width }];
  if (points.length === 2) return [{ from: at(first), to: at(second), width: (first.width + second.width) / 2 }];
  const segments: SignatureSegment[] = [{ from: at(first), to: mid(first, second), width: (first.width + second.width) / 2 }];
  for (let i = 1; i < points.length - 1; i++) {
    const [previous, point, next] = [points[i - 1], points[i], points[i + 1]];
    if (!previous || !point || !next) continue;
    segments.push({ from: mid(previous, point), control: at(point), to: mid(point, next), width: point.width });
  }
  const [beforeLast, last] = [points[points.length - 2], points[points.length - 1]];
  if (beforeLast && last) segments.push({ from: mid(beforeLast, last), to: at(last), width: (beforeLast.width + last.width) / 2 });
  return segments;
}

/** Total ink length, px. */
export function signatureLength(strokes: readonly SignatureStroke[]): number {
  let length = 0;
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.length; i++) {
      const [a, b] = [stroke[i - 1], stroke[i]];
      if (a && b) length += Math.hypot(b.x - a.x, b.y - a.y);
    }
  }
  return length;
}

/** A stray mark rather than a signature: shorter than `minLength` in all or fewer than `minStrokes` strokes. */
export function isSignatureTooShort(strokes: readonly SignatureStroke[], { minLength, minStrokes }: { minLength: number; minStrokes: number }): boolean {
  return signatureLength(strokes) < minLength || strokes.length < minStrokes;
}

const round = (value: number) => Math.round(value * 100) / 100;
const escapeXml = (text: string) => text.replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char] ?? char);

export interface SignatureExportOptions {
  /** Cut to the ink with an 8 px margin instead of the whole pad. */
  trim?: boolean;
}

/** Box to export: the pad, or the ink with a margin. */
function exportBox(data: SignatureData, trim: boolean): { x: number; y: number; width: number; height: number } {
  if (!trim) return { x: 0, y: 0, width: data.width, height: data.height };
  if (data.typed) {
    const width = data.typed.length * TYPED_SIZE * 0.6;
    return { x: TYPED_LEFT - 8, y: data.height - LINE_FROM_BOTTOM - TYPED_SIZE - 8, width: width + 16, height: TYPED_SIZE * 1.3 + 16 };
  }
  const points = data.strokes.flat();
  if (points.length === 0) return { x: 0, y: 0, width: data.width, height: data.height };
  const margin = 8 + MAX_WIDTH;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.max(Math.min(...xs) - margin, 0);
  const y = Math.max(Math.min(...ys) - margin, 0);
  return { x, y, width: Math.min(Math.max(...xs) + margin, data.width) - x, height: Math.min(Math.max(...ys) + margin, data.height) - y };
}

/** Vector copy for a PDF: one path per piece, ink colour, transparent background. */
export function signatureToSvg(data: SignatureData, { trim = false }: SignatureExportOptions = {}): string {
  const box = exportBox(data, trim);
  const size = `width="${round(box.width)}" height="${round(box.height)}" viewBox="${round(box.x)} ${round(box.y)} ${round(box.width)} ${round(box.height)}"`;
  const head = `<svg xmlns="http://www.w3.org/2000/svg" ${size} fill="none" stroke="${data.color}" stroke-linecap="round" stroke-linejoin="round">`;
  if (data.typed) {
    return `${head}<text x="${TYPED_LEFT}" y="${data.height - LINE_FROM_BOTTOM - 6}" stroke="none" fill="${data.color}" font-size="${TYPED_SIZE}" font-style="italic" font-weight="500" font-family="${escapeXml(data.font?.split(/\d+px\s*/)[1] ?? 'sans-serif')}">${escapeXml(data.typed)}</text></svg>`;
  }
  const paths = data.strokes
    .flatMap(smoothStroke)
    .map(({ from, control, to, width }) => {
      const d = control
        ? `M${round(from.x)} ${round(from.y)} Q${round(control.x)} ${round(control.y)} ${round(to.x)} ${round(to.y)}`
        : `M${round(from.x)} ${round(from.y)} L${round(to.x)} ${round(to.y)}`;
      return `<path d="${d}" stroke-width="${round(width)}"/>`;
    })
    .join('');
  return `${head}${paths}</svg>`;
}

function paint(context: CanvasRenderingContext2D, data: SignatureData, extra: SignatureStroke | null) {
  context.strokeStyle = data.color;
  context.fillStyle = data.color;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  if (data.typed) {
    context.font = data.font ?? `italic 500 ${TYPED_SIZE}px sans-serif`;
    context.fillText(data.typed, TYPED_LEFT, data.height - LINE_FROM_BOTTOM - 6);
  }
  for (const stroke of extra ? [...data.strokes, extra] : data.strokes) {
    for (const { from, control, to, width } of smoothStroke(stroke)) {
      context.lineWidth = width;
      context.beginPath();
      context.moveTo(from.x, from.y);
      if (control) context.quadraticCurveTo(control.x, control.y, to.x, to.y);
      else context.lineTo(to.x, to.y);
      context.stroke();
    }
  }
}

export interface SignaturePngOptions extends SignatureExportOptions {
  /** Pixel density of the picture (2 — sharp on a retina screen and in print). */
  scale?: number;
}

/** PNG with a transparent background, for the accepted card and the «Скачать PNG» item. */
export function signatureToDataUrl(data: SignatureData, { scale = 2, trim = false }: SignaturePngOptions = {}): string {
  const box = exportBox(data, trim);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(Math.round(box.width * scale), 1);
  canvas.height = Math.max(Math.round(box.height * scale), 1);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is not available');
  context.scale(scale, scale);
  context.translate(-box.x, -box.y);
  paint(context, data, null);
  return canvas.toDataURL('image/png');
}

// Pen nib cursor, tip at the bottom-left: reads as «write here» better than a crosshair.
const PEN_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" stroke="#161a1f" stroke-width="1.5"/></svg>',
)}") 3 21, crosshair`;

export interface SignaturePadProps {
  /** Name of the field above it, and for the screen reader: «Подпись получателя». */
  label?: string;
  /** Right of the label in fg-3: «Акт № 1184 от 2 ноября». */
  meta?: ReactNode;
  /** Who signs, before the accept button once there is ink: «Ирина Котова, кладовщик». */
  signer?: ReactNode;
  /** Hint on the empty sheet. */
  hint?: string;
  /** Text of the accept button. */
  acceptLabel?: string;
  /** Under the field: the reason it is disabled, or a note. */
  description?: ReactNode;
  disabled?: boolean;
  /** Shorter ink than this is a stray mark (px). */
  minLength?: number;
  /** Fewer strokes than this is a stray mark. */
  minStrokes?: number;
  /** «Принять подпись» with a valid signature. */
  onAccept?: (data: SignatureData) => void;
  /** After «Очистить»: `restore` brings the signature back, for the «Подпись очищена · Отменить» toast. */
  onClear?: (restore: () => void) => void;
  className?: string;
}

/**
 * A white sheet with a dashed line and a cross: sign with a finger, a pen or a mouse. Ink width follows pressure
 * (pen) or speed, strokes are smoothed with curves. Nothing leaves until «Принять подпись»; Enter types the name instead.
 */
export function SignaturePad({
  label = 'Подпись',
  meta,
  signer,
  hint = 'Распишитесь пальцем или мышью',
  acceptLabel = 'Принять подпись',
  description,
  disabled = false,
  minLength = 40,
  minStrokes = 2,
  onAccept,
  onClear,
  className,
}: SignaturePadProps) {
  const id = useId();
  const padRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = useRef<{ id: number; points: SignaturePoint[]; time: number; rect: DOMRect } | null>(null);
  const frame = useRef(0);
  const [strokes, setStrokes] = useState<readonly SignatureStroke[]>([]);
  const [typed, setTyped] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const signed = strokes.length > 0 || typed !== null;

  const ink = (): Omit<SignatureData, 'strokes' | 'typed'> => {
    const pad = padRef.current;
    const style = pad ? getComputedStyle(pad) : null;
    return {
      width: pad?.clientWidth ?? 0,
      height: pad?.clientHeight ?? 0,
      color: style?.color ?? '',
      font: style ? `italic 500 ${TYPED_SIZE}px ${style.fontFamily}` : undefined,
    };
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const ratio = window.devicePixelRatio || 1;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    // The typed name is HTML on the sheet; the canvas holds only ink.
    paint(context, { ...ink(), strokes, typed: null }, current.current?.points ?? null);
  };
  const repaint = useEffectEvent(redraw);

  useEffect(() => {
    const pad = padRef.current;
    if (!pad || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => setSize({ width: pad.clientWidth, height: pad.clientHeight }));
    observer.observe(pad);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(size.width * ratio);
    const height = Math.round(size.height * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    repaint();
  }, [size, strokes]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const point = (event: { clientX: number; clientY: number; pressure: number; timeStamp: number }, pointerType: string, rect: DOMRect, previous: SignaturePoint | undefined, time: number): SignaturePoint => {
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const speed = previous ? Math.hypot(x - previous.x, y - previous.y) / Math.max(event.timeStamp - time, 1) : 0;
    const target = signatureStrokeWidth({ pointerType, pressure: event.pressure, speed });
    // A low-pass on the width keeps the line from jumping between thick and thin.
    return { x, y, width: previous ? round(previous.width * 0.7 + target * 0.3) : round(target) };
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || typing || current.current || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    current.current = { id: event.pointerId, points: [point(event, event.pointerType, rect, undefined, event.timeStamp)], time: event.timeStamp, rect };
    if (typed !== null) setTyped(null);
    setInvalid(false);
    setDrawing(true);
    redraw();
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const stroke = current.current;
    if (!stroke || stroke.id !== event.pointerId) return;
    const events = event.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const sample of events.length > 0 ? events : [event]) {
      stroke.points.push(point(sample, event.pointerType, stroke.rect, stroke.points.at(-1), stroke.time));
      stroke.time = sample.timeStamp;
    }
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(redraw);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const stroke = current.current;
    if (!stroke || stroke.id !== event.pointerId) return;
    current.current = null;
    setDrawing(false);
    setStrokes((previous) => [...previous, stroke.points]);
  };

  const undo = () => {
    setInvalid(false);
    if (typed !== null) setTyped(null);
    else setStrokes((previous) => previous.slice(0, -1));
  };

  const clear = () => {
    const snapshot = { strokes, typed };
    setStrokes([]);
    setTyped(null);
    setInvalid(false);
    onClear?.(() => {
      setStrokes(snapshot.strokes);
      setTyped(snapshot.typed);
    });
  };

  const accept = () => {
    const tooShort = typed !== null ? typed.trim().length < 2 : isSignatureTooShort(strokes, { minLength, minStrokes });
    if (tooShort) {
      setInvalid(true);
      return;
    }
    onAccept?.({ ...ink(), strokes, typed });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || event.target !== event.currentTarget) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      setTyping(true);
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && signed) {
      event.preventDefault();
      undo();
    }
  };

  const closeTyping = (name: string | null) => {
    setTyping(false);
    if (name !== null && name.trim() !== '') {
      setStrokes([]);
      setTyped(name.trim());
      setInvalid(false);
    }
    padRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (typing) inputRef.current?.focus();
  }, [typing]);

  const hintHidden = drawing || signed || typing || disabled;
  const described = [description ? `${id}-description` : null, invalid ? `${id}-error` : null, `${id}-keys`].filter(Boolean).join(' ');

  return (
    <div data-slot="signature-pad" className={cn('flex flex-col gap-1', className)}>
      {label || meta ? (
        <div className="flex items-baseline justify-between gap-3 pb-0.5">
          <span id={`${id}-label`} className="text-label-sm font-medium text-fg-2">
            {label}
          </span>
          {meta ? <span className="text-caption text-fg-3">{meta}</span> : null}
        </div>
      ) : null}
      <div
        ref={padRef}
        data-slot="signature-pad-surface"
        data-mode="light"
        data-state={signed ? 'signed' : 'empty'}
        data-drawing={drawing ? '' : undefined}
        role="group"
        aria-roledescription="поле подписи"
        aria-label={`${label}, ${signed ? 'есть подпись' : 'пусто'}`}
        aria-describedby={described}
        aria-invalid={invalid || undefined}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        style={disabled ? undefined : { cursor: PEN_CURSOR }}
        className={cn(
          'relative flex h-40 shrink-0 touch-none flex-col justify-end rounded-xl border px-5 pb-7 text-fg-1 select-none sm:h-50 sm:px-8 sm:pb-10',
          'transition-[border-color,box-shadow] duration-(--duration-fast) ease-hover',
          disabled
            ? 'border-input bg-surface-2 opacity-50'
            : invalid
              ? 'border-danger bg-surface-1'
              : drawing
                ? 'border-ring bg-surface-1 shadow-[0_0_0_1px_var(--color-ring)]'
                : 'border-input bg-surface-1 hover:border-fg-3',
        )}
      >
        <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 size-full" />
        <div aria-hidden className="flex items-end gap-2">
          <span className="text-body-md font-medium text-fg-4">×</span>
          <span className="h-0 grow border-t-[1.5px] border-dashed border-border" />
        </div>
        <div
          aria-hidden
          data-slot="signature-pad-hint"
          data-hidden={hintHidden ? '' : undefined}
          className="pointer-events-none absolute inset-x-0 top-12 flex flex-col items-center gap-1 transition-opacity duration-(--duration-fast) ease-out data-hidden:opacity-0 sm:top-16"
        >
          <PenLine className="size-5 stroke-[1.75] text-fg-4" />
          <span className="text-body-sm text-fg-3">{hint}</span>
        </div>
        {typed !== null && !typing ? (
          <span
            data-slot="signature-pad-typed"
            className="pointer-events-none absolute right-5 bottom-[calc(var(--kv-line)+6px)] left-10 truncate text-[32px]/[40px] font-medium italic [--kv-line:28px] sm:right-8 sm:left-13 sm:[--kv-line:40px]"
          >
            {typed}
          </span>
        ) : null}
        {typing ? (
          <input
            ref={inputRef}
            aria-label="Имя для подписи"
            placeholder="Введите имя"
            autoComplete="name"
            className="absolute right-5 bottom-[calc(var(--kv-line)+6px)] left-10 bg-transparent text-[32px]/[40px] font-medium italic outline-none placeholder:text-fg-4 [--kv-line:28px] sm:right-8 sm:left-13 sm:[--kv-line:40px]"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                closeTyping(event.currentTarget.value);
              } else if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                closeTyping(null);
              }
            }}
            onBlur={(event) => closeTyping(event.currentTarget.value)}
          />
        ) : null}
      </div>
      <span id={`${id}-keys`} hidden>
        Enter — ввести имя вместо росчерка. ⌘Z — отменить штрих.
      </span>
      {invalid ? (
        <span data-slot="signature-pad-error-line" id={`${id}-error`} className="flex items-center gap-1.5 pt-0.5 text-caption text-danger-soft-fg">
          <CircleX aria-hidden className="size-3.5 shrink-0 stroke-[1.75]" />
          <span data-slot="signature-pad-error">Похоже на случайный штрих</span>
        </span>
      ) : null}
      {description ? (
        <span id={`${id}-description`} className="pt-0.5 text-caption text-fg-3">
          {description}
        </span>
      ) : null}
      <Announce>{invalid ? 'Похоже на случайный штрих' : ''}</Announce>
      {disabled ? null : (
        <div data-slot="signature-pad-actions" className="flex flex-wrap items-center gap-2 pt-2">
          <IconButton aria-label="Отменить штрих" aria-keyshortcuts="Meta+Z" size="sm" variant="ghost" disabled={!signed} onClick={undo} icon={<Undo2 aria-hidden />} />
          <BaseButton
            disabled={!signed}
            onClick={clear}
            className={cn(buttonShape({ size: 'sm' }), 'bg-fill-2 text-fg-1 hover:bg-fill-3 active:bg-fill-3 data-disabled:bg-transparent')}
          >
            Очистить
          </BaseButton>
          {/* On a phone the signer drops under the buttons instead of being cut to «И.». */}
          <span className="min-w-0 truncate pr-1 text-caption text-fg-3 max-sm:order-last max-sm:w-full sm:grow sm:text-right">{signed ? signer : null}</span>
          <Button size="sm" disabled={!signed} onClick={accept} className="ml-auto">
            {acceptLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export interface SignatureCardProps {
  /** The accepted picture: `signatureToDataUrl(data, { trim: true })`. */
  src: string;
  /** Who signed. */
  name: string;
  /** When: «2 ноября 2026, 14:32». */
  time: ReactNode;
  /** The ⋯ menu: «Скачать PNG», «Подписать заново», «Ещё» → «В архив…», «Удалить…». */
  actions?: ReactNode;
  className?: string;
}

/** An accepted signature: the picture on a light sheet, a check, who and when; fades in over the pad in 200 ms. */
export function SignatureCard({ src, name, time, actions, className }: SignatureCardProps) {
  return (
    <figure
      data-slot="signature-card"
      className={cn(
        'flex flex-col overflow-hidden rounded-xl bg-surface-1 shadow-raised transition-opacity duration-(--duration-base) ease-out starting:opacity-0',
        className,
      )}
    >
      <div data-slot="signature-card-image" data-mode="light" className="flex h-22 shrink-0 items-center justify-center bg-surface-2 px-4 py-3">
        <img src={src} alt={`Подпись: ${name}`} className="max-h-full max-w-full object-contain" />
      </div>
      <figcaption className="flex items-center gap-2.5 py-2.5 pr-2 pl-3.5">
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success-soft-fg">
          <Check aria-hidden className="size-3 stroke-3" />
        </span>
        <span className="flex min-w-0 grow flex-col">
          <span className="truncate text-label-sm font-medium text-fg-1">{name}</span>
          <span className="text-caption text-fg-3 tabular-nums">{time}</span>
        </span>
        {actions}
      </figcaption>
    </figure>
  );
}
