import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface StepItem {
  title: ReactNode;
  description?: ReactNode;
  /** A problem on a finished step: it stays finished but asks to come back. Replaces the description. */
  error?: ReactNode;
  /** Vertical variant: what the current step asks for (choices, buttons). */
  content?: ReactNode;
  disabled?: boolean;
}

export type StepStatus = 'complete' | 'error' | 'current' | 'upcoming';
export type StepsVariant = 'horizontal' | 'vertical' | 'compact';

export interface StepsProps extends Omit<ComponentProps<'div'>, 'children'> {
  steps: readonly StepItem[];
  /** 0-based index of the current step. */
  current: number;
  /** horizontal: wizard header · vertical: the current step opens in place · compact: phone, title and segments. */
  variant?: StepsVariant;
  /** Finished steps become buttons that go back; upcoming steps never do. */
  onStepClick?: (index: number) => void;
}

function statusOf(step: StepItem, index: number, current: number): StepStatus {
  if (index < current) return step.error ? 'error' : 'complete';
  return index === current ? 'current' : 'upcoming';
}

const statusWords: Record<StepStatus, string> = { complete: 'готово', error: 'ошибка', current: 'текущий шаг', upcoming: 'впереди' };

const markerTone: Record<StepStatus, string> = {
  complete: 'bg-accent text-accent-fg',
  error: 'bg-danger-soft text-danger-soft-fg shadow-[inset_0_0_0_1.5px_var(--color-danger)]',
  current: 'bg-surface-1 text-accent-soft-fg shadow-[inset_0_0_0_2px_var(--color-accent)]',
  upcoming: 'bg-surface-2 text-fg-3',
};

function Marker({ status, index }: { status: StepStatus; index: number }) {
  return (
    <span
      aria-hidden
      className={cn('grid size-6 shrink-0 place-items-center rounded-full text-caption font-semibold tabular-nums', markerTone[status])}
    >
      {status === 'complete' ? (
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M20 6 9 17l-5-5"
            pathLength={1}
            className="[stroke-dasharray:1] [stroke-dashoffset:0] transition-[stroke-dashoffset] duration-(--duration-quick) ease-out starting:[stroke-dashoffset:1]"
          />
        </svg>
      ) : status === 'error' ? (
        '!'
      ) : (
        index + 1
      )}
    </span>
  );
}

/** Connector that fills from the left (or top) in 300ms ease-standard once the step before it is passed. */
function Connector({ done, vertical }: { done: boolean; vertical?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn('overflow-hidden rounded-full bg-fill-3', vertical ? 'absolute top-7 bottom-1 left-[11px] w-0.5' : 'mt-[11px] h-0.5 min-w-6 flex-1')}
    >
      <span
        className={cn(
          'block size-full bg-accent transition-[scale] duration-(--duration-slow) ease-standard',
          vertical ? 'origin-top' : 'origin-left',
          done ? 'scale-100' : vertical ? 'scale-y-0' : 'scale-x-0',
        )}
      />
    </span>
  );
}

/** Multi-step flow. Passed steps can be revisited, upcoming ones cannot; an error keeps progress and asks to return. */
export function Steps({ steps, current, variant = 'horizontal', onStepClick, className, ...props }: StepsProps) {
  if (variant === 'compact') {
    const step = steps[current];
    return (
      <div data-slot="steps" data-variant="compact" className={cn('flex flex-col gap-3', className)} {...props}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-heading-xs font-semibold text-fg-1">{step?.title}</p>
          <p className="shrink-0 text-caption text-fg-3 tabular-nums">
            Шаг {current + 1} из {steps.length}
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={current + 1}
          aria-valuetext={`Шаг ${current + 1} из ${steps.length}`}
          className="flex gap-1"
        >
          {steps.map((item, index) => {
            const status = statusOf(item, index, current);
            return (
              <span
                key={index}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-(--duration-slow)',
                  status === 'error' ? 'bg-danger' : status === 'upcoming' ? 'bg-fill-3' : 'bg-accent',
                )}
              />
            );
          })}
        </div>
      </div>
    );
  }

  const vertical = variant === 'vertical';
  return (
    <div data-slot="steps" data-variant={variant} className={className} {...props}>
      {/* relative: the scroller contains the sr-only status words, or they widen the page on phones */}
      <ol className={cn('flex', vertical ? 'flex-col' : 'relative -m-1.5 items-start gap-3 overflow-x-auto p-1.5')}>
        {steps.map((step, index) => {
          const status = statusOf(step, index, current);
          const clickable = onStepClick !== undefined && (status === 'complete' || status === 'error') && !step.disabled;
          const last = index === steps.length - 1;
          const text = (
            <span className={cn('flex flex-col gap-0.5 text-left', vertical ? 'min-w-0' : 'whitespace-nowrap')}>
              <span className={cn('text-label-md', status === 'current' ? 'font-semibold text-fg-1' : status === 'upcoming' ? 'font-medium text-fg-2' : 'font-medium text-fg-1')}>
                {step.title}
                <span className="sr-only"> ({statusWords[status]})</span>
              </span>
              {step.error && status === 'error' ? (
                <span className={cn('text-danger-soft-fg', vertical ? 'text-body-xs' : 'text-caption')}>{step.error}</span>
              ) : step.description ? (
                <span className={cn('text-fg-3', vertical ? 'text-body-xs' : 'text-caption')}>{step.description}</span>
              ) : null}
            </span>
          );
          const head = clickable ? (
            <button
              type="button"
              onClick={() => onStepClick(index)}
              className="kv-pressable -m-1 flex shrink-0 items-start gap-3 rounded-lg p-1 [--kv-press-scale:var(--scale-press-wide)] hover:bg-fill-1"
            >
              <Marker status={status} index={index} />
              {text}
            </button>
          ) : (
            <div className="flex shrink-0 items-start gap-3">
              <Marker status={status} index={index} />
              {text}
            </div>
          );

          return (
            <li
              key={index}
              aria-current={status === 'current' ? 'step' : undefined}
              className={cn(
                step.disabled && 'opacity-50',
                vertical ? 'relative flex flex-col gap-3 pb-6 last:pb-0' : cn('flex items-start gap-3', last ? 'shrink-0' : 'flex-1'),
              )}
            >
              {vertical ? (
                <>
                  {last ? null : <Connector vertical done={index < current} />}
                  {head}
                  {status === 'current' && step.content ? (
                    <div className="pl-9 transition-[opacity,translate] duration-(--duration-base) ease-standard starting:-translate-y-(--shift-sm) starting:opacity-0">
                      {step.content}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  {head}
                  {last ? null : <Connector done={index < current} />}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
