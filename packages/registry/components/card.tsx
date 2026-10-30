import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { Separator as BaseSeparator } from '@base-ui/react/separator';
import { Children, createContext, use, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/* ---------- Card ---------- */

const cardVariants = {
  raised: 'bg-surface-1 shadow-raised',
  flat: 'bg-surface-2',
  outline: 'shadow-[0_0_0_1px_var(--color-hairline)]',
  interactive:
    'kv-pressable bg-surface-1 shadow-raised hover:shadow-overlay [--kv-press-scale:var(--scale-press-wide)] [transition-property:box-shadow,scale] [transition-duration:var(--duration-quick)]',
} as const;
const cardPaddings = { compact: 'p-4', default: 'p-5', spacious: 'p-6' } as const;

export interface CardProps extends ComponentProps<'div'> {
  variant?: keyof typeof cardVariants;
  padding?: keyof typeof cardPaddings;
}

/** Elevation declared once: hairline ring + micro shadow. Never nest cards. */
export function Card({ variant = 'raised', padding = 'default', className, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn('flex flex-col gap-4 rounded-xl text-fg-1', cardVariants[variant], cardPaddings[padding], className)}
      {...props}
    />
  );
}

export interface CardHeaderProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** Trailing slot, usually a ghost IconButton size="sm". */
  action?: ReactNode;
}

export function CardHeader({ title, description, action, className, ...props }: CardHeaderProps) {
  return (
    <div data-slot="card-header" className={cn('flex items-start gap-3', className)} {...props}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="text-heading-xs font-semibold">{title}</h3>
        {description ? <p className="text-body-xs text-fg-3">{description}</p> : null}
      </div>
      {action ? <div className="-mt-1 -mr-1.5 shrink-0">{action}</div> : null}
    </div>
  );
}

/* ---------- Separator ---------- */

export interface SeparatorProps extends Omit<BaseSeparator.Props, 'className'> {
  className?: string;
}

export function Separator({ orientation = 'horizontal', className, ...props }: SeparatorProps) {
  return (
    <BaseSeparator
      data-slot="separator"
      orientation={orientation}
      className={cn('shrink-0 bg-separator', orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch', className)}
      {...props}
    />
  );
}

/* ---------- Avatar ---------- */

export const AVATAR_SIZES = [20, 24, 28, 32, 40, 48, 64] as const;
export type AvatarSize = (typeof AVATAR_SIZES)[number];

export interface AvatarProps extends Omit<BaseAvatar.Root.Props, 'className' | 'children'> {
  name: string;
  src?: string;
  size?: AvatarSize;
  /** Presence dot (25% of the size) with a surface ring. */
  status?: 'online' | 'away' | 'busy' | 'offline';
  className?: string;
}

/** «Анна Северова» → «АС». */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('ru') ?? '')
    .join('');
}

const statusColors = { online: 'bg-success', away: 'bg-warning', busy: 'bg-danger', offline: 'bg-fg-4' } as const;
/** Inside a group avatars overlap, so they carry a single letter. */
const InGroupContext = createContext(false);

export function Avatar({ name, src, size = 32, status, className, style, ...props }: AvatarProps) {
  const inGroup = use(InGroupContext);
  return (
    <BaseAvatar.Root
      data-slot="avatar"
      role="img"
      aria-label={name}
      className={cn('relative inline-grid shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent-soft-fg select-none', className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), ...(typeof style === 'object' ? style : {}) }}
      {...props}
    >
      {src ? <BaseAvatar.Image src={src} alt="" className="size-full rounded-full object-cover" /> : null}
      <BaseAvatar.Fallback className="leading-none" aria-hidden>
        {inGroup ? initials(name).slice(0, 1) : initials(name)}
      </BaseAvatar.Fallback>
      {status ? (
        <span
          aria-hidden
          className={cn('absolute right-0 bottom-0 rounded-full shadow-[0_0_0_2px_var(--color-surface-1)]', statusColors[status])}
          style={{ width: Math.max(6, size / 4), height: Math.max(6, size / 4) }}
        />
      ) : null}
    </BaseAvatar.Root>
  );
}

export interface AvatarGroupProps extends ComponentProps<'div'> {
  /** Show at most this many, then «+N». */
  max?: number;
  size?: AvatarSize;
}

/** Overlap −8px, each with a 2px surface ring. */
export function AvatarGroup({ max = 3, size = 32, className, children, ...props }: AvatarGroupProps) {
  const items = Children.toArray(children);
  const hidden = items.length - max;
  return (
    <div data-slot="avatar-group" className={cn('flex items-center -space-x-2 *:shadow-[0_0_0_2px_var(--color-surface-1)]', className)} {...props}>
      <InGroupContext value>{items.slice(0, max)}</InGroupContext>
      {hidden > 0 ? (
        <span
          className="relative inline-grid shrink-0 place-items-center rounded-full bg-surface-3 font-semibold text-fg-2 tabular-nums"
          style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
        >
          +{hidden}
        </span>
      ) : null}
    </div>
  );
}
