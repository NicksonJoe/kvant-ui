import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { CircleX } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './spinner';

const choiceLabel = 'inline-flex select-none items-center gap-2.5 text-body-sm text-fg-1 has-[[data-disabled]]:opacity-50';

export interface CheckboxProps extends Omit<BaseCheckbox.Root.Props, 'className' | 'children'> {
  /** Visible label; wraps the box in a <label>. */
  children?: ReactNode;
  /** 22px box for touch layouts. */
  size?: 'md' | 'lg';
  invalid?: boolean;
  className?: string;
}

export function Checkbox({ children, size = 'md', invalid, className, ...props }: CheckboxProps) {
  const box = (
    <BaseCheckbox.Root
      data-slot="checkbox"
      aria-invalid={invalid || undefined}
      className={cn(
        'relative inline-grid shrink-0 place-items-center bg-field text-accent-fg shadow-[inset_0_0_0_1.5px_var(--color-input)] transition-[background-color,box-shadow] duration-(--duration-quick) ease-hover',
        'hover:not-data-disabled:not-data-checked:not-data-indeterminate:shadow-[inset_0_0_0_1.5px_var(--color-fg-3)]',
        'data-checked:bg-accent data-checked:shadow-none data-indeterminate:bg-accent data-indeterminate:shadow-none',
        'aria-invalid:not-data-checked:shadow-[inset_0_0_0_1.5px_var(--color-danger)]',
        size === 'md' ? 'size-[18px] rounded-xs' : 'size-[22px] rounded-[7px]',
        !children && className,
      )}
      {...props}
    >
      <BaseCheckbox.Indicator className="kv-check-draw grid place-items-center">
        {props.indeterminate ? (
          <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
            <path d="M2.5 6h7" pathLength={1} />
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2.25 6.25 4.75 8.75 9.75 3.5" pathLength={1} />
          </svg>
        )}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
  if (!children) return box;
  return (
    <label className={cn(choiceLabel, className)}>
      {box}
      {children}
    </label>
  );
}

export interface RadioGroupProps extends Omit<BaseRadioGroup.Props<string>, 'className'> {
  orientation?: 'vertical' | 'horizontal';
  /** Visible group name (13/16 500 fg-2) that also names the radiogroup; without it pass aria-label. */
  label?: ReactNode;
  /** Error under the options: danger rings on every radio and an aria-describedby link. */
  error?: ReactNode;
  /** md 18 for a pointer, lg 22 (dot 8, text 16/24) for touch. */
  size?: 'md' | 'lg';
  className?: string;
}

export function RadioGroup({ orientation = 'vertical', label, error, size = 'md', className, ...props }: RadioGroupProps) {
  const id = useId();
  const hasError = error !== undefined && error !== null && error !== false;
  const group = (
    <BaseRadioGroup
      data-slot="radio-group"
      data-size={size}
      aria-labelledby={label ? `${id}-label` : undefined}
      aria-describedby={hasError ? `${id}-error` : undefined}
      aria-invalid={hasError || undefined}
      className={cn(
        'group/radio-group flex',
        orientation === 'vertical' ? 'flex-col gap-3 has-[[data-slot=radio-description]]:gap-4' : 'flex-row flex-wrap gap-x-6 gap-y-3',
        !label && !hasError && className,
      )}
      {...props}
    />
  );
  if (!label && !hasError) return group;
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {label ? (
        <span id={`${id}-label`} className="text-label-sm font-medium text-fg-2">
          {label}
        </span>
      ) : null}
      {group}
      {hasError ? (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1.5 text-caption text-danger-soft-fg transition-opacity duration-(--duration-quick) ease-out starting:opacity-0 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]"
        >
          <CircleX aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface RadioProps extends Omit<Radio.Root.Props<string>, 'className' | 'children'> {
  children?: ReactNode;
  /** Second line, 13/18 fg-3; read as the radio's description, not its name. */
  description?: ReactNode;
  className?: string;
}

const radioCircle = cn(
  'kv-pressable relative inline-grid size-[18px] shrink-0 place-items-center rounded-full bg-field shadow-[inset_0_0_0_1.5px_var(--color-input)] [--kv-press-scale:var(--scale-press-icon)]',
  'hover:not-data-disabled:not-data-checked:shadow-[inset_0_0_0_1.5px_var(--color-fg-3)] active:not-data-checked:bg-surface-3',
  'data-checked:bg-accent data-checked:shadow-none hover:data-checked:bg-accent-hover active:data-checked:bg-accent-pressed',
  'data-invalid:not-data-checked:shadow-[inset_0_0_0_1.5px_var(--color-danger)] data-invalid:data-checked:bg-danger',
  'group-aria-invalid/radio-group:not-data-checked:shadow-[inset_0_0_0_1.5px_var(--color-danger)] group-aria-invalid/radio-group:data-checked:bg-danger',
  'group-data-[size=lg]/radio-group:size-[22px]',
);

export function RadioItem({ children, description, className, ...props }: RadioProps) {
  const id = useId();
  return (
    <label
      className={cn(
        choiceLabel,
        'group-data-[size=lg]/radio-group:gap-3 group-data-[size=lg]/radio-group:text-body-md',
        description ? 'items-start' : undefined,
        className,
      )}
    >
      <span className="flex h-5 shrink-0 items-center group-data-[size=lg]/radio-group:h-6">
        <Radio.Root
          data-slot="radio"
          aria-labelledby={description ? `${id}-label` : undefined}
          aria-describedby={description ? `${id}-description` : undefined}
          className={radioCircle}
          {...props}
        >
          <Radio.Indicator className="kv-radio-dot size-1.5 rounded-full bg-accent-fg group-data-[size=lg]/radio-group:size-2" />
        </Radio.Root>
      </span>
      {description ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span id={`${id}-label`} className="font-medium">
            {children}
          </span>
          <span id={`${id}-description`} data-slot="radio-description" className="text-body-xs text-fg-3">
            {description}
          </span>
        </span>
      ) : (
        children
      )}
    </label>
  );
}

export interface SwitchProps extends Omit<BaseSwitch.Root.Props, 'className' | 'children'> {
  /** md 36×20 (pointer), lg 52×32 (touch). */
  size?: 'md' | 'lg';
  children?: ReactNode;
  /** Second line under the label (13/18 fg-3), e.g. «Сохраняем…» while loading. */
  description?: ReactNode;
  /** Waiting for the server: spinner in the thumb, clicks ignored. Flip `checked` after the response. */
  loading?: boolean;
  className?: string;
}

/** Applies immediately — no «Сохранить» button next to a switch. */
export function Switch({ size = 'md', children, description, loading = false, readOnly, className, ...props }: SwitchProps) {
  const id = useId();
  const described = Boolean(children) && description !== undefined && description !== null;
  const control = (
    <BaseSwitch.Root
      data-slot="switch"
      data-size={size}
      aria-busy={loading || undefined}
      aria-labelledby={described ? `${id}-label` : undefined}
      aria-describedby={described ? `${id}-description` : undefined}
      readOnly={loading || readOnly}
      className={cn(
        'kv-switch relative inline-flex shrink-0 items-center rounded-full bg-surface-2 p-0.5 shadow-[inset_0_0_0_1px_var(--color-input)]',
        // With a label the whole row fades instead (choiceLabel).
        !children && 'data-disabled:opacity-50',
        'hover:not-data-checked:not-data-disabled:shadow-[inset_0_0_0_1px_var(--color-fg-3)]',
        'data-checked:bg-accent data-checked:shadow-none hover:data-checked:not-data-disabled:bg-accent-hover active:data-checked:not-data-disabled:bg-accent-pressed',
        size === 'md' ? 'h-5 w-9' : 'h-8 w-[52px]',
        !children && className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb className="kv-switch-thumb grid place-items-center rounded-full bg-[oklch(1_0_0)] shadow-thumb">
        {loading ? <Spinner size={16} className={size === 'md' ? 'size-3' : undefined} /> : null}
      </BaseSwitch.Thumb>
    </BaseSwitch.Root>
  );
  if (!children) return control;
  return (
    <label className={cn(choiceLabel, 'justify-between gap-4', described && 'items-start', className)}>
      {described ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span id={`${id}-label`} className="font-medium">
            {children}
          </span>
          <span id={`${id}-description`} className="text-body-xs text-fg-3">
            {description}
          </span>
        </span>
      ) : (
        children
      )}
      {control}
    </label>
  );
}
