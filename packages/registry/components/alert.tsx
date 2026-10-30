import { CircleAlert, CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/* ---------- Alert (callout) ---------- */

export const ALERT_TONES = ['accent', 'success', 'warning', 'danger', 'neutral'] as const;
export type AlertTone = (typeof ALERT_TONES)[number];
export const ALERT_VARIANTS = ['soft', 'outline'] as const;
export type AlertVariant = (typeof ALERT_VARIANTS)[number];

const alertIcons: Record<AlertTone, ReactNode> = {
  accent: <Info aria-hidden />,
  success: <CircleCheck aria-hidden />,
  warning: <TriangleAlert aria-hidden />,
  danger: <CircleX aria-hidden />,
  neutral: <Info aria-hidden />,
};

// soft: tinted fill, icon in the soft ink · outline: surface-1 + hairline, icon in the status colour.
const softTones: Record<AlertTone, string> = {
  accent: 'bg-accent-soft [&>svg]:text-accent-soft-fg',
  success: 'bg-success-soft [&>svg]:text-success-soft-fg',
  warning: 'bg-warning-soft [&>svg]:text-warning-soft-fg',
  danger: 'bg-danger-soft [&>svg]:text-danger-soft-fg',
  neutral: 'bg-fill-2 [&>svg]:text-fg-2',
};
const outlineTones: Record<AlertTone, string> = {
  accent: '[&>svg]:text-accent',
  success: '[&>svg]:text-success',
  warning: '[&>svg]:text-warning-soft-fg',
  danger: '[&>svg]:text-danger',
  neutral: '[&>svg]:text-fg-2',
};

export interface AlertProps extends Omit<ComponentProps<'div'>, 'title'> {
  tone?: AlertTone;
  variant?: AlertVariant;
  title?: ReactNode;
  /** Replaces the tone icon; a 20px Lucide icon. */
  icon?: ReactNode;
  /** Usually `<Button size="sm" variant="secondary">`. */
  action?: ReactNode;
}

/**
 * A message inside the content, next to what it is about; it stays until the cause is gone.
 * The tone colours the fill and the icon — never a stripe on the left.
 */
export function Alert({ tone = 'accent', variant = 'soft', title, icon, action, className, children, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      data-tone={tone}
      data-variant={variant}
      role={tone === 'danger' ? 'alert' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg py-3 pr-3 pl-4 text-body-sm [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:self-start [&>svg]:stroke-[1.5]',
        variant === 'soft' ? softTones[tone] : cn('bg-surface-1 shadow-[0_0_0_1px_var(--color-hairline)]', outlineTones[tone]),
        className,
      )}
      {...props}
    >
      {icon ?? alertIcons[tone]}
      <div className="flex min-w-0 flex-1 flex-col">
        {title ? <p className="text-label-md font-semibold text-fg-1">{title}</p> : null}
        {children ? <div className="text-fg-2">{children}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

/* ---------- Banner ---------- */

export const BANNER_TONES = ['accent', 'warning', 'danger', 'inverse'] as const;
export type BannerTone = (typeof BANNER_TONES)[number];

const bannerTones: Record<BannerTone, string> = {
  accent: 'bg-accent-soft text-fg-1 [&>svg]:text-accent-soft-fg [&_a]:text-accent-soft-fg',
  warning: 'bg-warning-soft text-fg-1 [&>svg]:text-warning-soft-fg',
  danger: 'bg-danger font-medium text-danger-fg',
  inverse: 'bg-fg-1 text-surface-1',
};
const bannerClose: Record<Exclude<BannerTone, 'danger'>, string> = {
  accent: 'text-accent-soft-fg',
  warning: 'text-warning-soft-fg',
  inverse: 'text-surface-1 opacity-70 hover:opacity-100',
};
const bannerIcons: Record<BannerTone, ReactNode> = {
  accent: <Info aria-hidden />,
  warning: <TriangleAlert aria-hidden />,
  danger: <CircleAlert aria-hidden />,
  inverse: <Info aria-hidden />,
};

export interface BannerProps extends ComponentProps<'div'> {
  tone?: BannerTone;
  /** Replaces the tone icon; a 16px Lucide icon. */
  icon?: ReactNode;
  /** Shows ×; called once the banner has collapsed. A danger banner cannot be closed — it lasts while the problem does. */
  onDismiss?: () => void;
}

/**
 * Message for the whole product on the top edge of the window: h44, full width, centred; links inside are underlined.
 * One at a time, the most important first.
 */
export function Banner({ tone = 'accent', icon, onDismiss, className, children, ...props }: BannerProps) {
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Collapse 44 → 0 first, then let the app remove the banner.
  useEffect(() => {
    const banner = ref.current;
    if (!closing || !banner) return undefined;
    let active = true;
    const animations = typeof banner.getAnimations === 'function' ? banner.getAnimations() : [];
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (active) onDismiss?.();
    });
    return () => {
      active = false;
    };
  }, [closing, onDismiss]);

  return (
    <div
      ref={ref}
      data-slot="banner"
      data-tone={tone}
      data-state={closing ? 'closing' : 'open'}
      role={tone === 'danger' ? 'alert' : undefined}
      className={cn(
        'grid grid-rows-[1fr] transition-[grid-template-rows] duration-(--duration-quick) ease-standard data-[state=closing]:grid-rows-[0fr]',
        className,
      )}
      {...props}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            'relative flex min-h-11 items-center justify-center gap-2 px-14 py-3 text-center text-body-sm',
            '[&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:stroke-[1.75] [&_a]:font-medium [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-3',
            bannerTones[tone],
          )}
        >
          {icon ?? bannerIcons[tone]}
          <p>{children}</p>
          {onDismiss && tone !== 'danger' ? (
            <button
              type="button"
              aria-label="Закрыть баннер"
              onClick={() => setClosing(true)}
              className={cn(
                'kv-pressable absolute top-2 right-2 grid size-7 place-items-center rounded-full hover:bg-current/10 [--kv-press-scale:var(--scale-press-icon)] [&_svg]:size-4 [&_svg]:stroke-[1.75]',
                bannerClose[tone],
              )}
            >
              <X aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
