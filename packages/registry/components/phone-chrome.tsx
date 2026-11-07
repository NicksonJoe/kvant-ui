import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export interface PhoneStatusBarProps extends ComponentProps<'div'> {
  /** Time on the left; «9:41» as on Apple screenshots. */
  time?: string;
}

/** iOS status bar 62 high for mockups and demo screens: the system draws the real one. Takes fg-1 of the mode. */
export function PhoneStatusBar({ time = '9:41', className, ...props }: PhoneStatusBarProps) {
  return (
    // gap 154 at 402 (Paper), narrower on small phones so each half still holds the 82 icons
    <div aria-hidden data-slot="phone-status-bar" className={cn('flex h-15.5 shrink-0 items-center gap-[clamp(0px,100%_-_180px,154px)] px-6 pt-[21px] pb-[19px] text-fg-1', className)} {...props}>
      <span className="flex-1 text-center font-[system-ui,sans-serif] text-[17px]/[22px] font-semibold">{time}</span>
      <span className="flex flex-1 justify-center">
        <svg width="82" height="22" viewBox="0 0 82 22" fill="currentColor" className="shrink-0">
          <path d="M3.7 13H2.5a1 1 0 0 0-1 1v2.5a1 1 0 0 0 1 1h1.2a1 1 0 0 0 1-1V14a1 1 0 0 0-1-1m5.2-2.5H7.7a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1.2a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1M14.1 8h-1.2a1 1 0 0 0-1 1v7.5a1 1 0 0 0 1 1h1.2a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1m5.2-2.5h-1.2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1.2a1 1 0 0 0 1-1v-10a1 1 0 0 0-1-1" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M36.57 7.8c2.49 0 4.880.92 6.68 2.58.14.13.36.12.49 0l1.3-1.270a.34.34 0 0 0 0-.5 12.55 12.55 0 0 0-16.93 0 .34.34 0 0 0 0 .5l1.3 1.26c.13.13.34.14.48 0a10 10 0 0 1 6.68-2.57m0 4.22a5.4 5.4 0 0 1 3.67 1.44c.14.13.35.13.48 0l1.3-1.33a.37.37 0 0 0-.01-.52 7.9 7.9 0 0 0-10.88 0 .37.37 0 0 0 0 .52l1.29 1.32c.13.14.34.14.48 0 1-.92 2.31-1.43 3.67-1.43m2.52 2.8q0 .15-.1.28l-2.18 2.45a.3.3 0 0 1-.24.11.3.3 0 0 1-.24-.1l-2.18-2.46a.43.43 0 0 1 .01-.56 3.44 3.44 0 0 1 4.82 0 .4.4 0 0 1 .11.28"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            opacity={0.35}
            d="M70.5 5c2.05 0 3.08 0 3.88.34a4.3 4.3 0 0 1 2.28 2.28c.34.8.34 1.83.34 3.88s0 3.08-.34 3.88a4.3 4.3 0 0 1-2.28 2.280c-.8.34-1.830.34-3.88.34h-12c-2.05 0-3.08 0-3.88-.34a4.3 4.3 0 0 1-2.28-2.28c-.34-.8-.34-1.83-.34-3.88s0-3.08.34-3.88a4.3 4.3 0 0 1 2.28-2.28C55.42 5 56.45 5 58.5 5zM58.28 6c-1.85 0-2.77 0-3.48.36a3.3 3.3 0 0 0-1.44 1.44C53 8.5 53 9.43 53 11.28v.44c0 1.85 0 2.77.36 3.48a3.3 3.3 0 0 0 1.44 1.44c.7.36 1.63.36 3.48.36h12.44c1.85 0 2.77 0 3.48-.36a3.3 3.3 0 0 0 1.44-1.44c.36-.7.36-1.63.36-3.48v-.44c0-1.85 0-2.77-.36-3.48a3.3 3.3 0 0 0-1.44-1.44C73.5 6 72.57 6 70.72 6z"
          />
          <path d="M54 11c0-1.4 0-2.1.27-2.63a2.5 2.5 0 0 1 1.1-1.1C55.9 7 56.6 7 58 7h13c1.4 0 2.1 0 2.64.27q.72.37 1.09 1.1C75 8.9 75 9.6 75 11v1c0 1.4 0 2.1-.27 2.64a2.5 2.5 0 0 1-1.1 1.09C73.1 16 72.4 16 71 16H58c-1.4 0-2.1 0-2.63-.27a2.5 2.5 0 0 1-1.1-1.1C54 14.1 54 13.4 54 12z" />
          <path opacity={0.35} d="M78 9.5v4.08a2.2 2.2 0 0 0 1.33-2.04A2.2 2.2 0 0 0 78 9.5" />
        </svg>
      </span>
    </div>
  );
}

/** iOS home indicator 139 × 5 at the bottom edge, for mockups; takes fg-1 of the mode. */
export function PhoneHomeIndicator({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div aria-hidden data-slot="phone-home-indicator" className={cn('flex h-[21px] shrink-0 items-end justify-center pb-2', className)} {...props}>
      <span className="h-[5px] w-[139px] rounded-full bg-fg-1" />
    </div>
  );
}
