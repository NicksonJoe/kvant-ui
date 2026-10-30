import { Button as BaseButton } from '@base-ui/react/button';
import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { Tooltip } from './popover';

/** How long the check stays before the copy icon returns. */
const CONFIRM_MS = 2000;

// Icons cross-fade from .8: five times the enter shrink, so reduced motion (enter scale 1) drops the scale too.
const swap =
  'transition-[opacity,scale] duration-(--duration-quick) ease-out starting:opacity-0 starting:scale-[calc(1_-_(1_-_var(--scale-enter))_*_5)]';

export interface CopyButtonProps extends Omit<BaseButton.Props, 'className' | 'children' | 'value' | 'onClick'> {
  /** Text that goes to the clipboard. */
  value: string;
  /** Visible label, e.g. «Копировать». Without it the button is a 28 px icon with a tooltip. */
  label?: string;
  /** Name of the icon button and its tooltip. */
  'aria-label'?: string;
  /** Called after a successful copy. */
  onCopied?: (value: string) => void;
  className?: string;
}

/** Copies a value and confirms with a check for two seconds; the result is announced politely. */
export function CopyButton({
  value,
  label,
  'aria-label': ariaLabel = 'Копировать',
  onCopied,
  className,
  ...props
}: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
      onCopied?.(value);
    } catch {
      // No clipboard (insecure page, denied permission): say so instead of pretending.
      setState('failed');
    }
    timer.current = setTimeout(() => setState('idle'), CONFIRM_MS);
  };

  const copied = state === 'copied';
  const icon = copied ? (
    <Check key="done" aria-hidden className={cn(swap, 'stroke-2! text-success')} />
  ) : (
    <Copy key="copy" aria-hidden className={swap} />
  );
  const status = (
    <span role="status" className="sr-only">
      {copied ? 'Скопировано' : state === 'failed' ? 'Не удалось скопировать — выделите текст вручную' : ''}
    </span>
  );

  if (label) {
    return (
      <>
        <Button
          variant="secondary"
          size="sm"
          data-copied={copied || undefined}
          leadingIcon={icon}
          onClick={copy}
          className={cn('min-w-35', className)}
          {...props}
        >
          {copied ? 'Скопировано' : label}
        </Button>
        {status}
      </>
    );
  }
  return (
    <>
      <Tooltip content={copied ? 'Скопировано' : ariaLabel}>
        <BaseButton
          data-slot="copy-button"
          data-copied={copied || undefined}
          aria-label={ariaLabel}
          onClick={copy}
          className={cn(
            'kv-pressable relative grid size-7 shrink-0 place-items-center rounded-full text-fg-2 [--kv-press-scale:var(--scale-press-icon)]',
            'hover:bg-fill-2 hover:text-fg-1 active:bg-fill-3 data-copied:bg-fill-2 data-disabled:pointer-events-none data-disabled:opacity-50',
            'pointer-coarse:after:absolute pointer-coarse:after:-inset-2 [&_svg]:size-4 [&_svg]:stroke-[1.75]',
            className,
          )}
          {...props}
        >
          {icon}
        </BaseButton>
      </Tooltip>
      {status}
    </>
  );
}
