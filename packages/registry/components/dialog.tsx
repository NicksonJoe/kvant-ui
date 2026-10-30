import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { CloseButton } from './button';

const backdrop = 'kv-backdrop fixed inset-0 z-50 bg-scrim';

/* ---------- Dialog ---------- */

/** Focus is trapped inside, Esc and a backdrop click close it, focus returns to the trigger. */
export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

const dialogWidths = { sm: 'w-[400px]', md: 'w-[560px]', lg: 'w-[720px]' } as const;

export interface DialogContentProps extends Omit<BaseDialog.Popup.Props, 'className'> {
  size?: keyof typeof dialogWidths;
  /** Ghost × in the top-right corner. */
  showClose?: boolean;
  className?: string;
}

export function DialogContent({ size = 'sm', showClose = true, className, children, ...props }: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={backdrop} />
      <BaseDialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
        <BaseDialog.Popup
          data-slot="dialog"
          className={cn(
            'kv-dialog relative flex max-w-full flex-col gap-4 rounded-3xl bg-overlay p-6 text-fg-1 shadow-modal outline-none',
            dialogWidths[size],
            className,
          )}
          {...props}
        >
          {children}
          {showClose ? (
            <div className="absolute top-5 right-5">
              <BaseDialog.Close render={<CloseButton />} />
            </div>
          ) : null}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

export function DialogTitle({ className, ...props }: Omit<BaseDialog.Title.Props, 'className'> & { className?: string }) {
  return <BaseDialog.Title className={cn('pr-10 text-heading-md font-semibold', className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: Omit<BaseDialog.Description.Props, 'className'> & { className?: string }) {
  return <BaseDialog.Description className={cn('text-body-sm text-fg-2', className)} {...props} />;
}

/** Right-aligned actions: secondary then primary. */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="dialog-footer" className={cn('flex justify-end gap-2 pt-2', className)} {...props} />;
}

/* ---------- AlertDialog ---------- */

/** Requires an explicit choice: no backdrop dismissal. */
export const AlertDialog = BaseAlertDialog.Root;
export const AlertDialogTrigger = BaseAlertDialog.Trigger;
export const AlertDialogClose = BaseAlertDialog.Close;

export interface AlertDialogContentProps extends Omit<BaseAlertDialog.Popup.Props, 'className'> {
  /** 40px circle above the title (danger tone by default). */
  icon?: ReactNode;
  tone?: 'danger' | 'accent';
  className?: string;
}

export function AlertDialogContent({ icon, tone = 'danger', className, children, ...props }: AlertDialogContentProps) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop className={backdrop} />
      <BaseAlertDialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
        <BaseAlertDialog.Popup
          data-slot="alert-dialog"
          className={cn(
            'kv-dialog flex w-[400px] max-w-full flex-col gap-4 rounded-3xl bg-overlay p-6 text-fg-1 shadow-modal outline-none',
            className,
          )}
          {...props}
        >
          {icon ? (
            <span
              aria-hidden
              className={cn(
                'grid size-10 place-items-center rounded-full [&_svg]:size-5 [&_svg]:stroke-[1.5]',
                tone === 'danger' ? 'bg-danger-soft text-danger-soft-fg' : 'bg-accent-soft text-accent-soft-fg',
              )}
            >
              {icon}
            </span>
          ) : null}
          {children}
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Viewport>
    </BaseAlertDialog.Portal>
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: Omit<BaseAlertDialog.Title.Props, 'className'> & { className?: string }) {
  return <BaseAlertDialog.Title className={cn('text-heading-md font-semibold', className)} {...props} />;
}

export function AlertDialogDescription({
  className,
  ...props
}: Omit<BaseAlertDialog.Description.Props, 'className'> & { className?: string }) {
  // The panel stacks with 16px; title and consequences sit 6px apart (Paper «Подтверждение»).
  return <BaseAlertDialog.Description className={cn('-mt-2.5 text-body-sm text-fg-2', className)} {...props} />;
}
