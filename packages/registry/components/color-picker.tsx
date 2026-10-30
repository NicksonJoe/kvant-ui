import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import { Check, ChevronDown, Pipette, Plus } from 'lucide-react';
import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '../lib/cn';
import { fieldShell } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { sliderTooltip } from './slider';

/** h 0–360, s and v 0–100, a 0–1. Hue survives grey colours, which a hex value forgets. */
interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

const FORMATS = ['HEX', 'RGB', 'HSL'] as const;
type Format = (typeof FORMATS)[number];

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const round = Math.round;

function parseHex(input: string): [number, number, number, number] | null {
  const hex = input.trim().replace(/^#/, '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) return null;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const byte = (i: number) => parseInt(full.slice(i, i + 2), 16);
  return [byte(0), byte(2), byte(4), full.length === 8 ? byte(6) / 255 : 1];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const d = max - Math.min(rr, gg, bb);
  const h = !d ? 0 : max === rr ? ((gg - bb) / d) % 6 : max === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4;
  return [(h * 60 + 360) % 360, max ? (d / max) * 100 : 0, max * 100];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const channel = (n: number) => {
    const k = (n + h / 60) % 6;
    return round((v / 100) * (1 - (s / 100) * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
  };
  return [channel(5), channel(3), channel(1)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return [rgbToHsv(r, g, b)[0], s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return round((l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return [channel(0), channel(8), channel(4)];
}

function fromRgba([r, g, b, a]: [number, number, number, number]): Hsva {
  const [h, s, v] = rgbToHsv(r, g, b);
  return { h, s, v, a };
}

const fromHex = (hex: string | null | undefined) => {
  const rgba = hex ? parseHex(hex) : null;
  return rgba ? fromRgba(rgba) : null;
};

/** «#3986E4», or «#3986E480» once the colour is not opaque. */
function toHex({ h, s, v, a }: Hsva): string {
  const bytes = [...hsvToRgb(h, s, v), ...(a < 1 ? [round(a * 255)] : [])];
  return `#${bytes.map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** The value field text for a format: «3986E4», «57, 134, 228», «213, 76 %, 56 %». */
function formatColor(color: Hsva, format: Format): string {
  const rgb = hsvToRgb(color.h, color.s, color.v);
  if (format === 'HEX') return toHex({ ...color, a: 1 }).slice(1);
  if (format === 'RGB') return rgb.join(', ');
  const [h, s, l] = rgbToHsl(...rgb);
  return `${round(h)}, ${round(s)} %, ${round(l)} %`;
}

function parseColor(text: string, format: Format, alpha: number): Hsva | null {
  if (format === 'HEX') {
    const rgba = parseHex(text);
    return rgba ? fromRgba(rgba[3] === 1 ? [rgba[0], rgba[1], rgba[2], alpha] : rgba) : null;
  }
  const [x, y, z] = (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(',', '.')));
  if (x === undefined || y === undefined || z === undefined) return null;
  const rgb: [number, number, number] =
    format === 'RGB' ? [clamp(round(x), 0, 255), clamp(round(y), 0, 255), clamp(round(z), 0, 255)] : hslToRgb(x % 360, clamp(y, 0, 100), clamp(z, 0, 100));
  return fromRgba([...rgb, alpha]);
}

const CHECKER = 'repeating-conic-gradient(#DADDE3 0% 25%, #FFFFFF 0% 50%) 0 0 / 8px 8px';
const HUE = 'linear-gradient(to right, #F00 0%, #FF0 16.67%, #0F0 33.33%, #0FF 50%, #00F 66.67%, #F0F 83.33%, #F00 100%)';
const ring = 'shadow-[inset_0_0_0_1px_oklch(0_0_0/0.08)]';
const knob =
  'group/thumb relative size-4 rounded-full bg-[oklch(1_0_0)] shadow-thumb outline-none transition-[scale] duration-(--duration-fast) ease-out active:scale-110 [&.is-dragging]:scale-110 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring';

/** Text field that commits on Enter or blur; an unreadable value snaps back. */
function CommitInput({ value, onCommit, className, label }: { value: string; onCommit: (text: string) => void; className?: string; label: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null) onCommit(draft);
    setDraft(null);
  };
  return (
    <input
      aria-label={label}
      value={draft ?? value}
      spellCheck={false}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit();
        if (event.key === 'Escape' && draft !== null) {
          event.stopPropagation();
          setDraft(null);
        }
      }}
      className={cn('min-w-0 bg-transparent outline-none', className)}
    />
  );
}

/** Saturation × brightness square: drag or arrows (Shift ×10). */
function ColorArea({ color, onChange }: { color: Hsva; onChange: (next: Hsva) => void }) {
  const [dragging, setDragging] = useState(false);
  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    onChange({
      ...color,
      s: clamp((event.clientX - rect.left) / rect.width, 0, 1) * 100,
      v: (1 - clamp((event.clientY - rect.top) / rect.height, 0, 1)) * 100,
    });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 1;
    const moves: Record<string, Partial<Hsva>> = {
      ArrowRight: { s: color.s + step },
      ArrowLeft: { s: color.s - step },
      ArrowUp: { v: color.v + step },
      ArrowDown: { v: color.v - step },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange({ ...color, s: clamp(move.s ?? color.s, 0, 100), v: clamp(move.v ?? color.v, 0, 100) });
  };
  return (
    <div
      className={cn('relative h-40 shrink-0 touch-none rounded-xs', ring)}
      style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #FFF, hsl(${color.h} 100% 50%))` }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setDragging(true);
        fromPointer(event);
        event.currentTarget.querySelector<HTMLElement>('[role="slider"]')?.focus({ preventScroll: true });
        event.preventDefault();
      }}
      onPointerMove={(event) => {
        if (dragging) fromPointer(event);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <div
        role="slider"
        tabIndex={0}
        aria-label="Насыщенность и яркость"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={round(color.s)}
        aria-valuetext={`Насыщенность ${round(color.s)} %, яркость ${round(color.v)} %`}
        onKeyDown={onKeyDown}
        className={cn(
          'absolute size-3.5 -translate-1/2 rounded-full shadow-[0_0_0_2px_#FFF,0_0_0_2.5px_oklch(0_0_0/0.1),0_2px_6px_oklch(0_0_0/0.28)] outline-none transition-[scale] duration-(--duration-fast) ease-out focus-visible:outline-2 focus-visible:outline-offset-3',
          dragging && 'scale-110',
        )}
        style={{ left: `${color.s}%`, top: `${100 - color.v}%`, background: toHex({ ...color, a: 1 }) }}
      />
    </div>
  );
}

function ChannelSlider({ label, value, max, valueText, track, onChange }: { label: string; value: number; max: number; valueText: (v: number) => string; track: string; onChange: (v: number) => void }) {
  return (
    <BaseSlider.Root value={value} min={0} max={max} thumbAlignment="edge" onValueChange={(next) => onChange(next)} className="w-full">
      <BaseSlider.Control className="flex h-4 touch-none items-center select-none">
        <BaseSlider.Track className={cn('relative h-3 w-full rounded-full', ring)} style={{ background: track }}>
          <BaseSlider.Thumb
            aria-label={label}
            getAriaValueText={(_formatted, v) => valueText(v)}
            className={(state) => cn(knob, state.dragging && 'is-dragging')}
          >
            <BaseSlider.Value aria-hidden className={sliderTooltip}>
              {(_formatted, values) => valueText(values[0] ?? 0)}
            </BaseSlider.Value>
          </BaseSlider.Thumb>
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}

export interface ColorSwatchesProps {
  /** Hex colours in display order. */
  colors: readonly string[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (color: string) => void;
  /** Shows a dashed «+» after the swatches, e.g. to save the current colour. */
  onAdd?: () => void;
  'aria-label'?: string;
  className?: string;
}

/** Palette of 24 px circles, a radio group: the selected one gets a 2 px ring 2 px away and a check. */
export function ColorSwatches({ colors, value, defaultValue, onValueChange, onAdd, className, 'aria-label': ariaLabel = 'Палитра' }: ColorSwatchesProps) {
  const upper = (color: string | null | undefined) => (color ? color.toUpperCase() : color);
  return (
    <div data-slot="color-swatches" className={cn('flex flex-wrap items-center gap-2.5', className)}>
      <RadioGroup<string | null>
        aria-label={ariaLabel}
        value={upper(value)}
        defaultValue={upper(defaultValue)}
        onValueChange={(color) => {
          if (color) onValueChange?.(color);
        }}
        className="contents"
      >
        {colors.map((color) => {
          const rgba = parseHex(color);
          const light = rgba ? (0.299 * rgba[0] + 0.587 * rgba[1] + 0.114 * rgba[2]) / 255 > 0.62 : false;
          return (
            <Radio.Root
              key={color}
              value={color.toUpperCase()}
              aria-label={color.toUpperCase()}
              style={{ background: color }}
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full transition-[scale,box-shadow] duration-(--duration-quick) ease-out hover:scale-110 data-checked:hover:scale-100',
                ring,
                'data-checked:shadow-[0_0_0_2px_var(--color-overlay),0_0_0_4px_var(--color-ring)]',
              )}
            >
              <Radio.Indicator
                className={cn(
                  'flex transition-[scale,opacity] duration-(--duration-quick) ease-out data-starting-style:scale-50 data-starting-style:opacity-0 [&_svg]:size-3 [&_svg]:stroke-3',
                  light ? 'text-[oklch(0.215_0.012_258)]' : 'text-[oklch(1_0_0)]',
                )}
              >
                <Check aria-hidden />
              </Radio.Indicator>
            </Radio.Root>
          );
        })}
      </RadioGroup>
      {onAdd ? (
        <button
          type="button"
          aria-label="Добавить цвет в палитру"
          onClick={onAdd}
          className="grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] border-dashed border-input text-fg-2 hover:border-fg-3 hover:text-fg-1 [&_svg]:size-3 [&_svg]:stroke-[2.25]"
        >
          <Plus aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

interface EyeDropperLike {
  open: () => Promise<{ sRGBHex: string }>;
}

export interface ColorPickerProps {
  /** «#RRGGBB», or «#RRGGBBAA» with transparency. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (color: string) => void;
  /** Project palette under the editor. */
  swatches?: readonly string[];
  /** Saves the current colour into the palette («+» after the swatches). */
  onAddSwatch?: (color: string) => void;
  /** Hides the transparency slider and field. */
  opaque?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

/**
 * Field with a swatch and HEX that opens a 320 popover: saturation square, hue and transparency sliders,
 * the value in HEX, RGB or HSL, the eyedropper (where the browser has one) and the project palette.
 */
export function ColorPicker({
  value,
  defaultValue = '#3986E4',
  onValueChange,
  swatches,
  onAddSwatch,
  opaque = false,
  disabled,
  className,
  'aria-label': ariaLabel,
}: ColorPickerProps) {
  const [color, setColor] = useState<Hsva>(() => fromHex(value ?? defaultValue) ?? { h: 213, s: 75, v: 89, a: 1 });
  // A new `value` from the parent wins, unless it is the colour already shown (keeps the hue of greys).
  const [synced, setSynced] = useState(value);
  if (value !== undefined && value !== synced) {
    setSynced(value);
    const next = fromHex(value);
    if (next && toHex(next) !== toHex(color)) setColor(next);
  }
  const [format, setFormat] = useState<Format>('HEX');
  const hex = toHex(color);
  const solid = toHex({ ...color, a: 1 });
  const EyeDropper = (globalThis as { EyeDropper?: new () => EyeDropperLike }).EyeDropper;

  const change = (next: Hsva) => {
    setColor(next);
    onValueChange?.(toHex(next));
  };

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          fieldShell,
          'h-control-md gap-2 rounded-control-md pr-3 pl-2 text-left data-popup-open:border-ring data-popup-open:shadow-[0_0_0_1px_var(--color-ring)] focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-[0_0_0_1px_var(--color-ring)] disabled:opacity-50 disabled:bg-surface-2',
          className,
        )}
      >
        <span aria-hidden className={cn('size-5 shrink-0 rounded-full', ring)} style={{ background: `linear-gradient(${hex}, ${hex}), ${CHECKER}` }} />
        <span className="min-w-0 flex-1 truncate font-mono text-body-xs font-medium text-fg-1">{hex}</span>
        <ChevronDown aria-hidden className="transition-transform duration-(--duration-quick) ease-out group-data-popup-open/field:rotate-180" />
      </PopoverTrigger>
      <PopoverContent align="start" data-slot="color-picker">
        <ColorArea color={color} onChange={change} />
        <div className="flex items-center gap-3">
          <span aria-hidden className={cn('size-8 shrink-0 rounded-full', ring)} style={{ background: `linear-gradient(${hex}, ${hex}), ${CHECKER}` }} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <ChannelSlider label="Оттенок" value={color.h} max={360} valueText={(h) => `${round(h)}°`} track={HUE} onChange={(h) => change({ ...color, h })} />
            {opaque ? null : (
              <ChannelSlider
                label="Непрозрачность"
                value={round(color.a * 100)}
                max={100}
                valueText={(a) => `${round(a)} %`}
                track={`linear-gradient(to right, transparent, ${solid}), ${CHECKER}`}
                onChange={(a) => change({ ...color, a: a / 100 })}
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 min-w-0 flex-1 items-center rounded-control-sm border border-input bg-field pr-0.5 pl-3 text-label-sm focus-within:border-ring focus-within:shadow-[0_0_0_1px_var(--color-ring)]">
            <span className="relative flex shrink-0 items-center pr-2.5">
              <select
                aria-label="Формат цвета"
                value={format}
                onChange={(event) => setFormat(FORMATS.find((item) => item === event.target.value) ?? 'HEX')}
                className="appearance-none bg-transparent pr-4 font-medium text-fg-2 outline-none"
              >
                {FORMATS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 size-3 stroke-2 text-fg-3" />
            </span>
            <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
            <span className="flex min-w-0 flex-1 items-center gap-0.5 px-2.5">
              {format === 'HEX' ? <span className="font-mono text-body-xs text-fg-3">#</span> : null}
              <CommitInput
                key={format}
                label={`Значение ${format}`}
                value={formatColor(color, format)}
                onCommit={(text) => {
                  const next = parseColor(text, format, color.a);
                  if (next) change(next);
                }}
                className={cn('w-full text-fg-1', format === 'HEX' ? 'font-mono text-body-xs font-medium uppercase' : 'tabular-nums')}
              />
            </span>
            {opaque ? null : (
              <>
                <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
                <span className="flex shrink-0 items-center px-2.5 tabular-nums">
                  <CommitInput
                    label="Непрозрачность"
                    value={String(round(color.a * 100))}
                    onCommit={(text) => {
                      const percent = Number(text.replace(/[^\d.,]/g, '').replace(',', '.'));
                      if (text.trim() !== '' && Number.isFinite(percent)) change({ ...color, a: clamp(percent, 0, 100) / 100 });
                    }}
                    className="w-7 text-right text-fg-1"
                  />
                  <span className="text-fg-1">{' %'}</span>
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label="Взять цвет с экрана"
            title={EyeDropper ? undefined : 'Браузер не умеет брать цвет с экрана'}
            disabled={!EyeDropper}
            onClick={() => {
              if (!EyeDropper) return;
              new EyeDropper()
                .open()
                .then(({ sRGBHex }) => {
                  const next = fromHex(sRGBHex);
                  if (next) change({ ...next, a: color.a });
                })
                // Esc closes the eyedropper with a rejection: nothing was picked, nothing to do.
                .catch(() => undefined);
            }}
            className="kv-pressable grid size-8 shrink-0 place-items-center rounded-control-sm text-fg-2 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-1 active:bg-accent-soft active:text-accent-soft-fg disabled:opacity-50 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
          >
            <Pipette aria-hidden />
          </button>
        </div>
        {swatches && swatches.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-caption font-medium text-fg-3">Палитра проекта</span>
            <ColorSwatches
              aria-label="Палитра проекта"
              colors={swatches}
              value={solid}
              onAdd={onAddSwatch ? () => onAddSwatch(solid) : undefined}
              onValueChange={(next) => {
                const parsed = fromHex(next);
                if (parsed) change({ ...parsed, a: color.a });
              }}
            />
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
