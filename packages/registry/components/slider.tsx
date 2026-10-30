import { Slider as BaseSlider } from '@base-ui/react/slider';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

const number = new Intl.NumberFormat('ru-RU');
const plain = (value: number) => number.format(value);

/** White 20 px knob: deeper shadow on hover, scale 1.1 while pressed, ring on keyboard focus. */
export const sliderThumb = cn(
  'group/thumb relative size-5 rounded-full bg-[oklch(1_0_0)] shadow-thumb outline-none',
  'hover:shadow-[0_1px_3px_oklch(0_0_0/0.24),0_0_0_0.5px_oklch(0_0_0/0.08)] active:scale-110 [&.is-dragging]:scale-110',
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
);

/** Value capsule 8 px above the knob, shown while it is dragged; fades in with scale .97 → 1. */
export const sliderTooltip = cn(
  'pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-full bg-fg-1 px-2 py-1 text-caption font-semibold whitespace-nowrap text-surface-1 tabular-nums shadow-tooltip',
  'scale-[var(--scale-tooltip)] opacity-0 transition-[opacity,scale] delay-100 duration-(--duration-fast) ease-out',
  'group-active/thumb:scale-100 group-active/thumb:opacity-100 group-active/thumb:delay-0 group-[.is-dragging]/thumb:scale-100 group-[.is-dragging]/thumb:opacity-100 group-[.is-dragging]/thumb:delay-0 group-[.is-dragging]/thumb:duration-(--duration-quick)',
);

export interface SliderProps<Value extends number | readonly number[]>
  extends Omit<BaseSlider.Root.Props<Value>, 'className' | 'children' | 'format' | 'locale' | 'thumbAlignment'> {
  /** Visible label; the current value is printed opposite it. */
  label?: ReactNode;
  /** One formatter for the value line, tooltip, marks, limits and aria-valuetext: `(v) => `${v} %``. */
  formatValue?: (value: number) => string;
  /** Tick values under the track (stepped slider); the current one is highlighted. */
  marks?: readonly number[];
  /** Prints min and max under the track. */
  showLimits?: boolean;
  /** Accessible name when there is no visible label. */
  'aria-label'?: string;
  className?: string;
}

/**
 * One value or a range (pass an array). Arrows ±step, Shift or PageUp/PageDown ±largeStep, Home/End.
 * The knob travels between the centres of the extreme marks; while dragged it shows the value above.
 */
export function Slider<Value extends number | readonly number[]>({
  label,
  formatValue = plain,
  marks,
  showLimits = false,
  min = 0,
  max = 100,
  'aria-label': ariaLabel,
  className,
  ...props
}: SliderProps<Value>) {
  const initial = props.value ?? props.defaultValue;
  const count = typeof initial === 'object' ? initial.length : 1;
  const ratio = (value: number) => (value - min) / (max - min);
  // Track clicks glide 150 ms; stepped knobs snap to marks on the spring; continuous ones follow the pointer 1:1.
  const glide = marks ? 'var(--spring-snappy)' : 'var(--duration-quick) var(--ease-out)';
  const knob = 'scale var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-hover)';

  return (
    <BaseSlider.Root<Value>
      data-slot="slider"
      thumbAlignment="edge"
      min={min}
      max={max}
      className={cn('group/slider flex flex-col gap-2 data-disabled:opacity-50', className)}
      {...props}
    >
      {label ? (
        <div className="flex items-center justify-between gap-3 text-label-sm font-medium">
          <BaseSlider.Label className="text-fg-2">{label}</BaseSlider.Label>
          <BaseSlider.Value className="text-fg-1 tabular-nums">
            {(_formatted, values) => values.map(formatValue).join(' — ')}
          </BaseSlider.Value>
        </div>
      ) : null}
      <BaseSlider.Control className="relative flex h-6 w-full touch-none items-center select-none after:absolute after:inset-x-0 after:-inset-y-2.5">
        <BaseSlider.Track className="relative h-1 w-full rounded-full bg-fill-3">
          <BaseSlider.Indicator
            className="rounded-full bg-accent group-hover/slider:bg-accent-hover"
            style={(state) => ({ transition: state.dragging && !marks ? 'none' : `width ${glide}, inset-inline-start ${glide}` })}
          />
          {Array.from({ length: count }, (_, index) => (
            <BaseSlider.Thumb
              key={index}
              index={index}
              aria-label={ariaLabel}
              getAriaValueText={(_formatted, value) =>
                count === 2 ? `${index === 0 ? 'от' : 'до'} ${formatValue(value)}` : formatValue(value)
              }
              className={(state) => cn(sliderThumb, state.dragging && state.activeThumbIndex === index && 'is-dragging')}
              style={(state) => ({
                transition: state.dragging && !marks ? knob : `${knob}, inset-inline-start ${glide}, left ${glide}`,
              })}
            >
              <BaseSlider.Value aria-hidden className={sliderTooltip}>
                {(_formatted, values) => formatValue(values[index] ?? min)}
              </BaseSlider.Value>
            </BaseSlider.Thumb>
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
      {marks ? (
        <BaseSlider.Value aria-hidden className="relative block h-[26px]">
          {(_formatted, values) =>
            marks.map((value) => {
              const current = values.includes(value);
              return (
                <span
                  key={value}
                  data-slot="slider-mark"
                  data-current={current || undefined}
                  className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1"
                  // Thumbs are inset by half their width (10 px), so marks share their centres.
                  style={{ left: `calc(10px + (100% - 20px) * ${ratio(value)})` }}
                >
                  <span className={cn('h-1.5 w-px', current ? 'bg-accent' : 'bg-fg-4')} />
                  <span className={cn('text-caption tabular-nums', current ? 'font-semibold text-fg-1' : 'text-fg-3')}>
                    {formatValue(value)}
                  </span>
                </span>
              );
            })
          }
        </BaseSlider.Value>
      ) : showLimits ? (
        <div aria-hidden className="flex justify-between gap-3 text-caption text-fg-3 tabular-nums">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      ) : null}
    </BaseSlider.Root>
  );
}
