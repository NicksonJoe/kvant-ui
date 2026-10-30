import { useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';

export interface ResizableProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  /** Name of the handle: «Ширина списка сделок». */
  label: string;
  /** Size of the first panel, % of the group. Double click on the handle returns to `defaultValue`. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** horizontal: panels side by side, the handle is a vertical line. */
  orientation?: 'horizontal' | 'vertical';
  children: [ReactNode, ReactNode];
}

/**
 * Two panels split by a handle that is always visible but quiet. The panels follow the pointer 1:1, stop at the
 * limits without a bounce; ← → (↑ ↓) move by 10px, Home / End jump to the limits.
 */
export function Resizable({
  label,
  value: valueProp,
  defaultValue = 50,
  onValueChange,
  min = 10,
  max = 90,
  orientation = 'horizontal',
  className,
  children,
  ...props
}: ResizableProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange);
  const [dragging, setDragging] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  const vertical = orientation === 'vertical';
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const update = (next: number) => {
    const clamped = clamp(next);
    if (clamped !== value) setValue(clamped);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = group.current?.getBoundingClientRect();
    if (!dragging || !box) return;
    const size = vertical ? box.height : box.width;
    if (size > 0) update((((vertical ? event.clientY - box.top : event.clientX - box.left) / size) * 100));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const box = group.current?.getBoundingClientRect();
    const size = (vertical ? box?.height : box?.width) ?? 0;
    const step = size > 0 ? (10 / size) * 100 : 1;
    const keys: Record<string, number> = vertical
      ? { ArrowUp: value - step, ArrowDown: value + step, Home: min, End: max }
      : { ArrowLeft: value - step, ArrowRight: value + step, Home: min, End: max };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    update(next);
  };

  const [first, second] = children;
  return (
    <div
      ref={group}
      data-slot="resizable"
      data-orientation={orientation}
      className={cn('flex min-h-0 min-w-0', vertical ? 'flex-col' : 'flex-row', className)}
      {...props}
    >
      <div
        data-slot="resizable-panel"
        style={{ flexBasis: `${value}%` }}
        className={cn('min-h-0 min-w-0 shrink-0 overflow-auto', !dragging && 'transition-[flex-basis] duration-(--duration-moderate) ease-standard')}
      >
        {first}
      </div>
      <div
        role="separator"
        aria-label={label}
        aria-orientation={vertical ? 'horizontal' : 'vertical'}
        aria-valuenow={Math.round(value)}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
        data-dragging={dragging || undefined}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={onKeyDown}
        onDoubleClick={() => update(defaultValue)}
        className={cn(
          'group/handle relative z-10 flex shrink-0 touch-none select-none items-center justify-center bg-separator transition-colors duration-(--duration-fast) ease-hover focus-visible:outline-none',
          'hover:bg-accent data-dragging:bg-accent before:absolute',
          vertical
            ? 'h-px cursor-row-resize flex-col before:inset-x-0 before:-inset-y-1 data-dragging:h-[3px]'
            : 'w-px cursor-col-resize before:inset-y-0 before:-inset-x-1 data-dragging:w-[3px]',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'shrink-0 rounded-full bg-fg-4 transition-[width,height,background-color] duration-(--duration-fast) ease-hover group-hover/handle:bg-fg-3 group-data-dragging/handle:bg-accent',
            'group-focus-visible/handle:outline-2 group-focus-visible/handle:outline-offset-2 group-focus-visible/handle:outline-ring',
            vertical
              ? 'h-[5px] w-6 group-hover/handle:w-8 group-data-dragging/handle:h-[7px] group-data-dragging/handle:w-10'
              : 'h-6 w-[5px] group-hover/handle:h-8 group-data-dragging/handle:h-10 group-data-dragging/handle:w-[7px]',
          )}
        />
        {dragging ? (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute rounded-full bg-fg-1 px-2 py-1 text-caption font-semibold whitespace-nowrap text-surface-1 tabular-nums shadow-tooltip',
              vertical ? 'left-[calc(50%+28px)]' : 'bottom-[calc(50%+28px)]',
            )}
          >
            {Math.round(value)}&nbsp;%
          </span>
        ) : null}
      </div>
      <div data-slot="resizable-panel" className="min-h-0 min-w-0 flex-1 overflow-auto">
        {second}
      </div>
    </div>
  );
}
