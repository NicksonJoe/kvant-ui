import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Phone list of actions about one thing; Esc, the scrim and «Отмена» close it. */
export const ActionSheet = BaseDialog.Root;
export const ActionSheetTrigger = BaseDialog.Trigger;

export interface ActionSheetContentProps extends Omit<BaseDialog.Popup.Props, 'className' | 'title'> {
  /** What the actions are about: «Айдентика для пекарни». Read as «Действия: …». */
  title: string;
  description?: ReactNode;
  /** Text of the separate cancel plaque. */
  cancelLabel?: string;
  className?: string;
}

/** Overlay r28, 8 from the edges and above the safe area; groups split by an 8px band; cancel is its own plaque. */
export function ActionSheetContent({ title, description, cancelLabel = 'Отмена', className, children, ...props }: ActionSheetContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="kv-backdrop fixed inset-0 z-50 bg-scrim" />
      <BaseDialog.Popup
        data-slot="action-sheet"
        data-side="bottom"
        className={cn(
          'kv-sheet fixed inset-x-2 bottom-[max(8px,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md flex-col gap-2 outline-none',
          className,
        )}
        {...props}
      >
        <div className="flex max-h-[calc(100dvh-72px)] flex-col overflow-y-auto rounded-4xl bg-overlay text-fg-1 shadow-modal">
          <div className="flex flex-col items-center gap-0.5 px-6 pt-4 pb-3 text-center">
            <BaseDialog.Title className="text-label-sm font-medium text-fg-3">
              <span className="sr-only">{`Действия: ${title}`}</span>
              <span aria-hidden>{title}</span>
            </BaseDialog.Title>
            {description ? <BaseDialog.Description className="text-caption text-fg-3">{description}</BaseDialog.Description> : null}
          </div>
          {children}
        </div>
        <BaseDialog.Close className="h-14 rounded-4xl bg-overlay text-label-lg font-semibold text-accent-soft-fg shadow-modal active:bg-surface-2">
          {cancelLabel}
        </BaseDialog.Close>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

/** A run of related actions; the next group starts after an 8px fill-1 band. */
export function ActionSheetGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="action-sheet-group" role="group" className={cn('flex flex-col [[data-slot=action-sheet-group]+&]:border-t-8 [[data-slot=action-sheet-group]+&]:border-fill-1', className)} {...props} />;
}

export interface ActionSheetItemProps extends Omit<ComponentProps<'button'>, 'type'> {
  icon?: ReactNode;
  /** Danger text; keep it behind a confirmation. */
  destructive?: boolean;
  /** Keep the sheet open after the action (a second level, a toggle). */
  keepOpen?: boolean;
}

export function ActionSheetItem({ icon, destructive, keepOpen, className, children, ...props }: ActionSheetItemProps) {
  const item = (
    <button
      type="button"
      data-slot="action-sheet-item"
      className={cn(
        'flex h-14 w-full items-center gap-3 border-t border-separator px-5 text-left text-body-md first:border-t-0 active:bg-fill-2 [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:stroke-[1.5]',
        destructive ? 'text-danger-soft-fg' : 'text-fg-1 [&_svg]:text-fg-2',
        className,
      )}
      {...props}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
  return keepOpen ? item : <BaseDialog.Close render={item} />;
}
