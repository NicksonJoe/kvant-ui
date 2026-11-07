import { Toggle } from '@base-ui/react/toggle';
import { Check, X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

export const BADGE_TONES = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const;
export type BadgeTone = (typeof BADGE_TONES)[number];
export const BADGE_VARIANTS = ['soft', 'solid', 'outline', 'dot'] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

const soft: Record<BadgeTone, string> = {
  neutral: 'bg-fill-2 text-fg-2',
  accent: 'bg-accent-soft text-accent-soft-fg',
  success: 'bg-success-soft text-success-soft-fg',
  warning: 'bg-warning-soft text-warning-soft-fg',
  danger: 'bg-danger-soft text-danger-soft-fg',
  info: 'bg-info-soft text-info-soft-fg',
};
const solid: Record<BadgeTone, string> = {
  neutral: 'bg-fg-2 text-surface-1',
  accent: 'bg-accent text-accent-fg',
  success: 'bg-success text-success-fg',
  warning: 'bg-warning text-warning-fg',
  danger: 'bg-danger text-danger-fg',
  info: 'bg-info text-info-fg',
};
const dot: Record<BadgeTone, string> = {
  neutral: 'bg-fg-4',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  /** 12px leading icon. */
  icon?: ReactNode;
}

/** Status label. Not interactive. */
export function Badge({ tone = 'neutral', variant = 'soft', icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-tone={tone}
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-badge px-2 text-caption font-medium tabular-nums [&_svg]:size-3 [&_svg]:stroke-[1.75]',
        variant === 'soft' && soft[tone],
        variant === 'solid' && solid[tone],
        variant === 'outline' && 'text-fg-2 shadow-[inset_0_0_0_1px_var(--color-border)]',
        variant === 'dot' && 'bg-fill-2 text-fg-2',
        className,
      )}
      {...props}
    >
      {variant === 'dot' ? <span aria-hidden className={cn('size-1.5 rounded-full', dot[tone])} /> : icon}
      {children}
    </span>
  );
}

export interface CountBadgeProps extends Omit<ComponentProps<'span'>, 'children'> {
  count: number;
  /** Above this the badge shows `max+`. */
  max?: number;
}

/** Unread counter: danger capsule with a surface ring, sits on icons. */
export function CountBadge({ count, max = 99, className, ...props }: CountBadgeProps) {
  return (
    <span
      data-slot="count-badge"
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-[5px] text-[11px]/4 font-semibold text-danger-fg tabular-nums shadow-[0_0_0_2px_var(--color-surface-1)]',
        className,
      )}
      {...props}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}

export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-xs bg-surface-1 px-1.5 font-mono text-[11px]/4 font-medium text-fg-2 shadow-[0_0_0_1px_var(--color-border),inset_0_-1px_0_var(--color-border)]',
        className,
      )}
      {...props}
    />
  );
}

const tagShell =
  'kv-pressable inline-flex shrink-0 select-none items-center gap-1.5 rounded-full font-medium whitespace-nowrap [&_svg]:size-3.5 [&_svg]:stroke-[1.75]';

export interface TagProps {
  children: ReactNode;
  /** Makes the tag a toggle (filter chip). */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Adds a trailing × that calls this. */
  onRemove?: () => void;
  /** Accessible name for the remove button; defaults to «Удалить …» with the tag text. */
  removeLabel?: string;
  /** sm 28 · md 32 · lg 36: phone filter chip, 15 text, selection shown by fill and accent ring without the check. */
  size?: 'sm' | 'md' | 'lg';
  /** Number after the text: «Все 6», «Просроченные 2». */
  count?: number;
  /** danger: the count is a warning, e.g. overdue items. */
  countTone?: 'danger';
  disabled?: boolean;
  className?: string;
}

/** Filter or choice chip: hover, selected (check), removable. */
export function Tag({
  children,
  selected,
  onSelectedChange,
  onRemove,
  removeLabel,
  size = 'sm',
  count,
  countTone,
  disabled,
  className,
}: TagProps) {
  const large = size === 'lg';
  const look = cn(
    tagShell,
    large ? 'h-9 px-3.5 text-[15px]/5 tracking-body' : cn('px-3 text-label-sm', size === 'md' ? 'h-8' : 'h-7'),
    selected
      ? // the ring is full accent: at 35 % (Paper) it reads 1.6:1 on the page and the state rests on the fill alone
        cn('bg-accent-soft text-accent-soft-fg', large && 'shadow-[0_0_0_1px_var(--color-accent)]')
      : 'bg-control text-fg-1 shadow-control hover:not-data-disabled:bg-control-hover',
    disabled && 'opacity-50',
    className,
  );
  const label = (
    <>
      {selected && !large ? <Check aria-hidden /> : null}
      {children}
      {count !== undefined ? (
        <>
          <span className="sr-only">,</span>{' '}
          <span className={cn('tabular-nums', countTone === 'danger' ? 'text-danger-soft-fg' : !selected && 'text-fg-3')}>{count}</span>
        </>
      ) : null}
    </>
  );
  const remove = onRemove ? (
    <button
      type="button"
      disabled={disabled}
      aria-label={removeLabel ?? `Удалить «${typeof children === 'string' ? children : 'тег'}»`}
      onClick={onRemove}
      className="-mr-1 grid size-5 place-items-center rounded-full text-fg-3 hover:bg-fill-2 hover:text-fg-1"
    >
      <X aria-hidden />
    </button>
  ) : null;

  if (onSelectedChange && !onRemove) {
    return (
      <Toggle
        data-slot="tag"
        pressed={selected ?? false}
        onPressedChange={onSelectedChange}
        disabled={disabled}
        className={look}
      >
        {label}
      </Toggle>
    );
  }
  return (
    <span data-slot="tag" data-selected={selected || undefined} className={cn(look, onRemove && 'pr-2')}>
      {onSelectedChange ? (
        <Toggle
          pressed={selected ?? false}
          onPressedChange={onSelectedChange}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full"
        >
          {label}
        </Toggle>
      ) : (
        label
      )}
      {remove}
    </span>
  );
}
