import { Popover as BasePopover } from '@base-ui/react/popover';
import { PreviewCard as BasePreviewCard } from '@base-ui/react/preview-card';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { positioner } from '../lib/recipes';

export const Popover = BasePopover.Root;

export interface PopoverTriggerProps extends Omit<BasePopover.Trigger.Props, 'className'> {
  className?: string;
}

export function PopoverTrigger({ className, ...props }: PopoverTriggerProps) {
  return <BasePopover.Trigger data-slot="popover-trigger" className={className} {...props} />;
}

export interface PopoverContentProps extends Omit<BasePopover.Popup.Props, 'className'> {
  side?: BasePopover.Positioner.Props['side'];
  align?: BasePopover.Positioner.Props['align'];
  sideOffset?: number;
  className?: string;
}

/** 320 wide, r20, p16, overlay shadow. Pass a width class to change it. */
export function PopoverContent({ side = 'bottom', align = 'center', sideOffset = 8, className, ...props }: PopoverContentProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner side={side} align={align} sideOffset={sideOffset} className={positioner}>
        <BasePopover.Popup
          data-slot="popover"
          className={cn(
            'kv-popup flex w-80 max-w-(--available-width) flex-col gap-3 rounded-xl bg-overlay p-4 text-fg-1 shadow-overlay outline-none',
            className,
          )}
          {...props}
        />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export function PopoverTitle({ className, ...props }: Omit<BasePopover.Title.Props, 'className'> & { className?: string }) {
  return <BasePopover.Title className={cn('text-heading-xs font-semibold', className)} {...props} />;
}

export function PopoverDescription({
  className,
  ...props
}: Omit<BasePopover.Description.Props, 'className'> & { className?: string }) {
  return <BasePopover.Description className={cn('text-body-sm text-fg-2', className)} {...props} />;
}

export const PopoverClose = BasePopover.Close;

export interface TooltipProviderProps {
  children: ReactNode;
}

/** Shared timing: open after 600ms hover, close at once, neighbours open instantly within 400ms. */
export function TooltipProvider({ children }: TooltipProviderProps) {
  return (
    <BaseTooltip.Provider delay={600} closeDelay={0} timeout={400}>
      {children}
    </BaseTooltip.Provider>
  );
}

export interface TooltipProps {
  /** The trigger element; it receives the tooltip props (keep it focusable). */
  children: ReactElement;
  content: ReactNode;
  /** Shortcut shown after the text, e.g. «⇧⌘C». */
  shortcut?: ReactNode;
  side?: BaseTooltip.Positioner.Props['side'];
  sideOffset?: number;
  disabled?: boolean;
}

/** Hover 600ms (keyboard focus: instant), 6px from the trigger, opacity + scale .97 in 150ms. No arrow. */
export function Tooltip({ children, content, shortcut, side = 'top', sideOffset = 6, disabled }: TooltipProps) {
  return (
    <BaseTooltip.Root disabled={disabled}>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={sideOffset} className={cn(positioner, 'pointer-events-none')}>
          <BaseTooltip.Popup
            data-slot="tooltip"
            className="kv-popup flex max-w-60 items-center gap-2 rounded-full bg-fg-1 px-2.5 py-1.5 text-caption font-medium text-surface-1 shadow-tooltip [--kv-enter-scale:var(--scale-tooltip)] has-[br]:rounded-md"
          >
            {content}
            {shortcut ? <span className="font-mono text-[11px] opacity-70">{shortcut}</span> : null}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

/* ---------- Hover card ---------- */

/** Preview of a person or a record on hover or focus: opens after 600ms, closes 300ms after the pointer leaves. */
export const HoverCard = BasePreviewCard.Root;

export interface HoverCardTriggerProps extends Omit<BasePreviewCard.Trigger.Props, 'className'> {
  className?: string;
}

/** A link (mention, 14/20 500, underlined); the card only repeats what the link leads to, so touch skips it. */
export function HoverCardTrigger({ className, ...props }: HoverCardTriggerProps) {
  return (
    <BasePreviewCard.Trigger
      data-slot="hover-card-trigger"
      className={cn('inline-flex items-center gap-1.5 rounded-xs text-label-md font-medium text-fg-1 underline decoration-1 underline-offset-3', className)}
      {...props}
    />
  );
}

export interface HoverCardContentProps extends Omit<BasePreviewCard.Popup.Props, 'className'> {
  side?: BasePreviewCard.Positioner.Props['side'];
  align?: BasePreviewCard.Positioner.Props['align'];
  sideOffset?: number;
  className?: string;
}

/** 300 wide, p16, gap 12, r20, overlay shadow; while data loads, skeletons hold its height (aria-busy). */
export function HoverCardContent({ side = 'bottom', align = 'start', sideOffset = 8, className, ...props }: HoverCardContentProps) {
  return (
    <BasePreviewCard.Portal>
      <BasePreviewCard.Positioner side={side} align={align} sideOffset={sideOffset} className={positioner}>
        <BasePreviewCard.Popup
          data-slot="hover-card"
          className={cn(
            'kv-popup flex w-75 max-w-(--available-width) flex-col gap-3 rounded-xl bg-overlay p-4 text-fg-1 shadow-overlay outline-none',
            className,
          )}
          {...props}
        />
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}
