import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface SegmentedOption<V extends string> {
  value: V;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<V extends string> {
  options: readonly SegmentedOption<V>[];
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** sm: 32 track (pointer), md: 36. */
  size?: 'sm' | 'md';
  disabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

/**
 * Single choice among 2–5 options. A radio group (arrows move and select) with a thumb that slides
 * on the snappy spring to the checked segment.
 */
export function SegmentedControl<V extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  size = 'sm',
  disabled,
  className,
  ...aria
}: SegmentedControlProps<V>) {
  const [own, setOwn] = useState<V | undefined>(defaultValue ?? options[0]?.value);
  const current = value ?? own;
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const placedRef = useRef(false);

  // Position the thumb from the checked segment's box; the very first placement skips the slide.
  useLayoutEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;
    const place = () => {
      const checked = track.querySelector<HTMLElement>('[data-slot="segment"][data-checked]');
      thumb.style.setProperty('--kv-x', `${checked?.offsetLeft ?? 0}px`);
      thumb.style.setProperty('--kv-w', `${checked?.offsetWidth ?? 0}px`);
      thumb.hidden = !checked;
    };
    if (placedRef.current) {
      place();
    } else {
      thumb.style.transition = 'none';
      place();
      thumb.getBoundingClientRect();
      thumb.style.transition = '';
      placedRef.current = true;
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
    observer?.observe(track);
    return () => observer?.disconnect();
  }, [current]);

  return (
    <RadioGroup
      ref={trackRef}
      data-slot="segmented-control"
      value={current}
      onValueChange={(next: V) => {
        setOwn(next);
        onValueChange?.(next);
      }}
      disabled={disabled}
      className={cn(
        'relative inline-flex shrink-0 items-stretch bg-surface-2 p-0.5 data-disabled:opacity-50',
        size === 'sm' ? 'h-control-sm rounded-control-sm' : 'h-control-md rounded-control-md',
        className,
      )}
      {...aria}
    >
      <span
        ref={thumbRef}
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 left-0 w-(--kv-w) translate-x-(--kv-x) kv-slide rounded-control-inner bg-thumb shadow-segment"
      />
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          data-slot="segment"
          className={cn(
            'relative z-1 inline-flex select-none items-center justify-center gap-1.5 rounded-control-inner px-3 font-medium text-fg-2 transition-colors duration-(--duration-micro) ease-hover',
            'hover:not-data-checked:not-data-disabled:text-fg-1 data-checked:text-fg-1 data-disabled:opacity-50 focus-visible:-outline-offset-2',
            size === 'sm' ? 'text-label-sm' : 'text-label-md',
          )}
        >
          {option.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
