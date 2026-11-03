import { Popover as BasePopover } from '@base-ui/react/popover';
import { CircleAlert } from 'lucide-react';
import { useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useControllable } from '../lib/use-controllable';
import { cn } from '../lib/cn';
import { positioner } from '../lib/recipes';
import { Button, buttonShape } from './button';
import { Spinner } from './spinner';

export const POPCONFIRM_TONES = ['neutral', 'danger'] as const;
export type PopconfirmTone = (typeof POPCONFIRM_TONES)[number];
export const POPCONFIRM_SIZES = ['md', 'sm'] as const;
export type PopconfirmSize = (typeof POPCONFIRM_SIZES)[number];

const FAILED = 'Не получилось. Попробуйте ещё раз.';

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';

type Anchor = NonNullable<BasePopover.Positioner.Props['anchor']>;

/** Without a trigger, focus goes back to the anchor (the «Ещё» button), not to the closed menu item. */
function focusTarget(anchor: Anchor): HTMLElement | true {
  const element = typeof anchor === 'function' ? anchor() : 'current' in anchor ? anchor.current : anchor;
  return element instanceof HTMLElement ? element : true;
}

export interface PopconfirmProps {
  /** The button it confirms; it gets aria-expanded and aria-controls. Leave it out and pass `anchor` when the action lives in a menu. */
  children?: ReactElement;
  /** Element to stand next to when there is no trigger: the «Ещё» button of the row. */
  anchor?: BasePopover.Positioner.Props['anchor'];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Verb + object + «?», at most two lines: «Удалить комментарий?». */
  title: ReactNode;
  /** The consequence, not the question again; md only. */
  description?: ReactNode;
  /** 20 icon before the text: warning for irreversible sends, in warning-soft-fg (danger tone: danger-soft-fg). */
  icon?: ReactNode;
  /** danger — the confirm button is red and the focus waits on «Отмена». */
  tone?: PopconfirmTone;
  /** sm — one line in a table row: question and two xs buttons. */
  size?: PopconfirmSize;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Label of the confirm button after a failure. */
  retryLabel?: string;
  /** Return a promise to keep it open with a spinner; a rejection shows the error and offers to retry. */
  onConfirm: () => unknown;
  /** «Отмена», Esc or a click outside. */
  onCancel?: () => void;
  /** Busy from outside: spinner on the confirm button, «Отмена» disabled, Esc and clicks outside do nothing. */
  loading?: boolean;
  /** Error under the text, danger-soft; the confirm button becomes «Повторить». */
  error?: ReactNode;
  side?: BasePopover.Positioner.Props['side'];
  align?: BasePopover.Positioner.Props['align'];
  className?: string;
}

/**
 * Small «точно?» right at the button, for actions easy to hit by accident that need no reading. No arrow, 8 from
 * the trigger, aligned to its edge. Archive and delete always add the «Отменить» toast for 7 s after it.
 */
export function Popconfirm({
  children,
  anchor,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  title,
  description,
  icon,
  tone = 'neutral',
  size = 'md',
  confirmLabel = tone === 'danger' ? 'Удалить' : 'Подтвердить',
  cancelLabel = 'Отмена',
  retryLabel = 'Повторить',
  onConfirm,
  onCancel,
  loading = false,
  error,
  side = 'bottom',
  align = 'start',
  className,
}: PopconfirmProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const busy = loading || pending;
  const errorText = error ?? (failed ? FAILED : null);
  const danger = tone === 'danger';

  const change = (next: boolean) => {
    // a request in flight cannot be dismissed: the user would not know whether it went through
    if (!next && busy) return;
    if (next) setFailed(false);
    setOpen(next);
  };
  const cancel = () => {
    if (busy) return;
    onCancel?.();
    setOpen(false);
  };
  const confirm = () => {
    setFailed(false);
    const result = onConfirm();
    if (!isThenable(result)) return setOpen(false);
    setPending(true);
    result.then(
      () => {
        setPending(false);
        setOpen(false);
      },
      () => {
        setPending(false);
        setFailed(true);
      },
    );
  };

  const confirmButton = (
    <Button
      ref={confirmRef}
      size={size === 'sm' ? 'xs' : 'sm'}
      variant={danger ? 'danger' : 'primary'}
      loading={busy}
      leadingIcon={busy ? <Spinner inherit /> : undefined}
      onClick={confirm}
    >
      {errorText ? retryLabel : confirmLabel}
    </Button>
  );
  const cancelButton =
    size === 'sm' ? (
      // ghost xs in fg-2: quieter than the Button ghost, so the line reads as one sentence
      <button
        ref={cancelRef}
        type="button"
        disabled={busy}
        onClick={cancel}
        data-slot="button"
        data-size="xs"
        className={cn(buttonShape({ size: 'xs' }), 'text-fg-2 hover:bg-fill-1 hover:text-fg-1 active:bg-fill-2 disabled:pointer-events-none disabled:opacity-50')}
      >
        {cancelLabel}
      </button>
    ) : (
      <Button ref={cancelRef} size="sm" variant="secondary" disabled={busy} onClick={cancel}>
        {cancelLabel}
      </Button>
    );

  return (
    <BasePopover.Root
      open={open}
      onOpenChange={(next) => {
        // Base UI only reports dismissals (Esc, outside, trigger, focus out): each one is «Отмена»
        if (!next && !busy) onCancel?.();
        change(next);
      }}
    >
      {children ? <BasePopover.Trigger data-slot="popconfirm-trigger" render={children} /> : null}
      <BasePopover.Portal>
        <BasePopover.Positioner side={side} align={align} sideOffset={8} collisionPadding={8} anchor={anchor} className={positioner}>
          <BasePopover.Popup
            role="alertdialog"
            data-slot="popconfirm"
            data-size={size}
            data-tone={tone}
            initialFocus={danger ? cancelRef : confirmRef}
            finalFocus={anchor ? () => focusTarget(anchor) : true}
            className={cn(
              'kv-popup bg-overlay text-fg-1 shadow-overlay outline-none',
              size === 'sm'
                ? 'flex max-w-(--available-width) items-center gap-3 rounded-lg py-2 pr-2 pl-3.5'
                : 'flex w-72 max-w-(--available-width) flex-col gap-3 rounded-xl p-4',
              className,
            )}
          >
            {size === 'sm' ? (
              <>
                <BasePopover.Title data-slot="popconfirm-title" className="w-max text-body-xs font-semibold">
                  {title}
                </BasePopover.Title>
                <div className="flex items-center gap-1.5">
                  {cancelButton}
                  {confirmButton}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  {icon ? (
                    <span
                      data-slot="popconfirm-icon"
                      aria-hidden
                      className={cn(
                        'grid size-5 shrink-0 place-items-center [&_svg]:size-5 [&_svg]:stroke-[1.75]',
                        danger ? 'text-danger-soft-fg' : 'text-warning-soft-fg',
                      )}
                    >
                      {icon}
                    </span>
                  ) : null}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <BasePopover.Title data-slot="popconfirm-title" className="text-body-sm/(--leading-label-md) font-semibold">
                      {title}
                    </BasePopover.Title>
                    {description ? (
                      <BasePopover.Description data-slot="popconfirm-description" className="text-body-xs text-fg-2">
                        {description}
                      </BasePopover.Description>
                    ) : null}
                  </div>
                </div>
                {errorText ? (
                  <div
                    role="alert"
                    data-slot="popconfirm-error"
                    className="flex items-start gap-2 rounded-sm bg-danger-soft px-2.5 py-2 text-body-xs text-danger-soft-fg transition-opacity duration-(--duration-quick) ease-out starting:opacity-0 [&>svg]:mt-0.5 [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:stroke-2"
                  >
                    <CircleAlert aria-hidden />
                    <span>{errorText}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {cancelButton}
                  {confirmButton}
                </div>
              </>
            )}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
