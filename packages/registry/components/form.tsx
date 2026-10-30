import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import { Form as BaseForm } from '@base-ui/react/form';
import { CircleX } from 'lucide-react';
import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface FieldsetProps extends Omit<BaseFieldset.Root.Props, 'className'> {
  legend: ReactNode;
  description?: ReactNode;
  /** card — a standalone group on the page; section — a group inside one card, split from the next by a separator. */
  variant?: 'card' | 'section';
  className?: string;
}

/** Related fields under one legend; `disabled` switches off every control inside. */
export function Fieldset({ legend, description, variant = 'card', className, children, ...props }: FieldsetProps) {
  const descriptionId = useId();
  return (
    <BaseFieldset.Root
      data-slot="fieldset"
      data-variant={variant}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        'flex min-w-0 flex-col',
        variant === 'card' ? 'gap-5 rounded-xl bg-surface-1 p-6 shadow-raised' : 'gap-4 border-b border-separator py-6 last:border-b-0',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-0.5">
        <BaseFieldset.Legend
          className={cn('font-semibold text-fg-1', variant === 'card' ? 'text-heading-xs' : 'text-label-md')}
        >
          {legend}
        </BaseFieldset.Legend>
        {description ? (
          <p id={descriptionId} className="text-body-xs text-fg-3">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </BaseFieldset.Root>
  );
}

export interface FormProps extends Omit<BaseForm.Props, 'className'> {
  className?: string;
}

/**
 * Native form with Base UI validation: a field is checked when it is left, then on every change
 * while it is wrong, and everything is checked on submit. `errors` puts server messages under their fields.
 */
export function Form({ validationMode = 'onBlur', className, ...props }: FormProps) {
  return <BaseForm data-slot="form" validationMode={validationMode} className={cn('flex flex-col gap-5', className)} {...props} />;
}

export interface FormError {
  /** `name` of the control the line leads to. */
  name: string;
  /** Field name as the user sees it. */
  label: string;
  /** What to do: «выберите из списка или создайте нового». */
  message: string;
}

export interface FormErrorSummaryProps extends Omit<ComponentProps<'div'>, 'title' | 'children'> {
  errors: readonly FormError[];
  /** Defaults to «Проверьте N поля». */
  title?: ReactNode;
}

const plural = new Intl.PluralRules('ru');
const fieldWords: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'поле', few: 'поля' };

const focusable = 'input:not([type=hidden]):not([tabindex="-1"]), textarea, select, button:not([tabindex="-1"]), [tabindex="0"]';

function focusControl(from: HTMLElement | null, name: string) {
  const form = from?.closest('form');
  const named = form ? form.elements.namedItem(name) : (document.getElementsByName(name)[0] ?? null);
  const control = named instanceof RadioNodeList ? named[0] : named;
  // Select, masked and tag fields submit through a hidden input: focus the visible control of the same field.
  const target =
    control instanceof HTMLInputElement && control.type === 'hidden'
      ? (control.closest('[data-slot="field"]') ?? control.parentElement)?.querySelector<HTMLElement>(focusable)
      : control;
  if (target instanceof HTMLElement) target.focus();
}

/**
 * List of what blocks the submit, above the fields. It takes focus when it appears (render it after
 * a failed submit; change its `key` to take focus again on the next attempt); each line leads to its field.
 */
export function FormErrorSummary({ errors, title, className, ...props }: FormErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = errors.length > 0;
  useEffect(() => {
    if (visible) ref.current?.focus();
  }, [visible]);
  if (!visible) return null;
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      data-slot="form-error-summary"
      className={cn('flex gap-3 rounded-lg bg-danger-soft px-4 pt-3 pb-3.5 outline-none', className)}
      {...props}
    >
      <CircleX aria-hidden className="size-5 shrink-0 stroke-[1.5] text-danger-soft-fg" />
      <div className="flex flex-col gap-1 text-body-sm text-fg-2">
        <p className="font-semibold text-fg-1">
          {title ?? `Проверьте ${errors.length} ${fieldWords[plural.select(errors.length)] ?? 'полей'}`}
        </p>
        {errors.map((error) => (
          <p key={error.name}>
            <button
              type="button"
              onClick={() => focusControl(ref.current, error.name)}
              className="rounded-xs text-danger-soft-fg underline decoration-1 underline-offset-3"
            >
              {error.label}
            </button>
            {` — ${error.message}`}
          </p>
        ))}
      </div>
    </div>
  );
}

export interface FormActionsProps extends ComponentProps<'div'> {
  /** Leading status, e.g. a dot and «Не сохранено · 2 ошибки». */
  status?: ReactNode;
  /** Glass capsule that sticks to the bottom while the form scrolls. */
  sticky?: boolean;
}

/** Form buttons, primary last. Never disable submit — on a failed attempt show the summary instead. */
export function FormActions({ status, sticky = false, className, children, ...props }: FormActionsProps) {
  return (
    <div
      data-slot="form-actions"
      className={cn(
        'flex items-center gap-2',
        status ? 'justify-between' : 'justify-end',
        sticky && 'sticky bottom-4 z-10 h-14 rounded-full bg-glass pr-2.5 pl-5.5 shadow-glass backdrop-blur-[20px] backdrop-saturate-[1.8]',
        className,
      )}
      {...props}
    >
      {status ? <div className="flex min-w-0 items-center gap-2 text-label-md text-fg-1">{status}</div> : null}
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}
