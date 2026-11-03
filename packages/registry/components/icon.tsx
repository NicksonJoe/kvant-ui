import type { LucideIcon, LucideProps } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const ICON_SIZES = [12, 14, 16, 20, 24, 32] as const;
export type IconSize = (typeof ICON_SIZES)[number];

export interface IconProps extends Omit<LucideProps, 'size' | 'strokeWidth' | 'absoluteStrokeWidth' | 'ref'> {
  /** Any Lucide icon: `Calendar`, `Search`. */
  icon: LucideIcon;
  /** 16 for buttons, fields, menus and rows; 12–14 in breadcrumbs, tags and xs buttons; 20–32 in touch rows, tab bars and empty states. */
  size?: IconSize;
  /** An icon that means something on its own («Оплачено»): role="img" with this name. Without it the icon is hidden from screen readers. */
  label?: string;
  /** «On» state — favourite, bookmark, pinned: the fill takes the text colour. Pair it with aria-pressed on the button. */
  filled?: boolean;
}

/**
 * One Lucide icon on the Kvant scale: the stroke is 1.75 up to 16 px and 1.5 from 20 px, so small and large icons weigh
 * the same on screen. Colour is currentColor — it follows the label and its states.
 */
export function Icon({ icon: Glyph, size = 16, label, filled = false, className, ...props }: IconProps) {
  return (
    <Glyph
      // A new key re-inserts the svg when it fills, so the starting style plays the pop; .8 as in CopyButton, 1 under reduced motion.
      // The ! keeps scale in the transition inside containers that set their own on svg (ToggleButton).
      key={filled ? 'filled' : 'outline'}
      data-slot="icon"
      data-filled={filled || undefined}
      size={size}
      strokeWidth={size <= 16 ? 1.75 : 1.5}
      role={label === undefined ? undefined : 'img'}
      aria-label={label}
      aria-hidden={label === undefined ? true : undefined}
      className={cn(filled && 'fill-current transition-[scale,fill]! duration-(--duration-quick) ease-out starting:scale-[calc(1_-_(1_-_var(--scale-enter))_*_5)]', className)}
      {...props}
    />
  );
}

export const ICON_TILE_SIZES = [24, 32, 40] as const;
export type IconTileSize = (typeof ICON_TILE_SIZES)[number];
export const ICON_TILE_TONES = ['neutral', 'accent', 'success', 'warning', 'danger', 'solid'] as const;
export type IconTileTone = (typeof ICON_TILE_TONES)[number];

const tileSizes: Record<IconTileSize, string> = {
  24: 'size-6 [&_svg]:size-3.5 [&_svg]:stroke-[1.75]',
  32: 'size-8 [&_svg]:size-4 [&_svg]:stroke-[1.75]',
  40: 'size-10 [&_svg]:size-5 [&_svg]:stroke-[1.5]',
};

const tileTones: Record<IconTileTone, string> = {
  neutral: 'bg-fill-2 text-fg-2',
  accent: 'bg-accent-soft text-accent-soft-fg',
  success: 'bg-success-soft text-success-soft-fg',
  warning: 'bg-warning-soft text-warning-soft-fg',
  danger: 'bg-danger-soft text-danger-soft-fg',
  solid: 'bg-accent text-accent-fg',
};

export interface IconTileProps extends ComponentProps<'span'> {
  /** Circle diameter; the icon inside is about half of it: 24 → 14, 32 → 16, 40 → 20. */
  size?: IconTileSize;
  /** Background and icon from one pair. Colour carries meaning — success, warning, error — so the row text has to say it too. */
  tone?: IconTileTone;
}

/** Soft circle that sets an icon apart from the row text: payments, files, notifications. The icon decides what is read out. */
export function IconTile({ size = 32, tone = 'neutral', className, ...props }: IconTileProps) {
  return (
    <span
      data-slot="icon-tile"
      data-size={size}
      data-tone={tone}
      className={cn('inline-grid shrink-0 place-items-center rounded-full', tileSizes[size], tileTones[tone], className)}
      {...props}
    />
  );
}
