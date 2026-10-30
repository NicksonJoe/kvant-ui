import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { createContext, use, useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';

const MultipleContext = createContext(false);

interface ChoiceCardGroupBase {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  disabled?: boolean;
  name?: string;
  /** Layout classes; the default is a one-column grid with a 12 px gap. */
  className?: string;
  children: ReactNode;
}

export type ChoiceCardGroupProps = ChoiceCardGroupBase &
  (
    | { multiple?: false; value?: string; defaultValue?: string; onValueChange?: (value: string) => void }
    | { multiple: true; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void }
  );

/** Radio cards (one choice) or, with `multiple`, checkbox cards. */
export function ChoiceCardGroup(props: ChoiceCardGroupProps) {
  const shared = {
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    disabled: props.disabled,
    className: cn('grid gap-3', props.className),
  };
  if (props.multiple) {
    return (
      <MultipleContext value>
        <CheckboxGroup
          data-slot="choice-card-group"
          {...shared}
          value={props.value}
          defaultValue={props.defaultValue}
          onValueChange={(value) => props.onValueChange?.(value)}
        >
          {props.children}
        </CheckboxGroup>
      </MultipleContext>
    );
  }
  return (
    <RadioGroup<string>
      data-slot="choice-card-group"
      {...shared}
      name={props.name}
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={(value) => props.onValueChange?.(value)}
    >
      {props.children}
    </RadioGroup>
  );
}

export interface ChoiceCardProps {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  /** 20 px icon in a 36 circle; switches the card to the compact layout (title 14/20). */
  icon?: ReactNode;
  disabled?: boolean;
  /** Content under the header: price, feature list. */
  children?: ReactNode;
  className?: string;
}

const card = cn(
  'kv-pressable group/card relative flex cursor-default select-none flex-col rounded-xl bg-surface-1 p-4 text-left text-fg-1 [--kv-press-scale:var(--scale-press-wide)]',
  'shadow-[0_0_0_1px_var(--color-hairline)] hover:not-data-disabled:not-data-checked:shadow-control',
  'data-checked:bg-accent-soft data-checked:shadow-[0_0_0_2px_var(--color-accent)] data-disabled:opacity-50',
);

const mark = cn(
  'grid size-[18px] shrink-0 place-items-center bg-field text-accent-fg shadow-[inset_0_0_0_1.5px_var(--color-input)] transition-[background-color,box-shadow] duration-(--duration-quick) ease-hover',
  'group-hover/card:shadow-[inset_0_0_0_1.5px_var(--color-fg-3)] group-data-checked/card:bg-accent group-data-checked/card:shadow-none',
);

/** The whole card is one hit target; the indicator repeats the choice by shape, not only by colour. */
export function ChoiceCard({ value, title, description, icon, disabled, children, className }: ChoiceCardProps) {
  const multiple = use(MultipleContext);
  const id = useId();
  const indicator = multiple ? (
    <span aria-hidden className={cn(mark, 'rounded-xs')}>
      <Checkbox.Indicator className="kv-check-draw grid place-items-center">
        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.25 6.25 4.75 8.75 9.75 3.5" pathLength={1} />
        </svg>
      </Checkbox.Indicator>
    </span>
  ) : (
    <span aria-hidden className={cn(mark, 'rounded-full')}>
      <Radio.Indicator className="kv-radio-dot size-1.5 rounded-full bg-accent-fg" />
    </span>
  );
  const text = (titleClass: string) => (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span id={`${id}-title`} className={titleClass}>
        {title}
      </span>
      {description ? (
        <span id={`${id}-description`} className="text-body-xs text-fg-3">
          {description}
        </span>
      ) : null}
    </span>
  );
  const content = icon ? (
    <>
      <span className="flex items-start justify-between">
        <span className="grid size-9 place-items-center rounded-full bg-surface-2 text-fg-2 group-data-checked/card:bg-surface-1 group-data-checked/card:text-accent-soft-fg [&_svg]:size-5 [&_svg]:stroke-[1.5]">
          {icon}
        </span>
        {indicator}
      </span>
      {text('text-label-md font-medium')}
      {children}
    </>
  ) : (
    <>
      <span className="flex items-start gap-3">
        {text('text-heading-xs font-semibold')}
        <span className="flex h-6 items-center">{indicator}</span>
      </span>
      {children}
    </>
  );
  const props = {
    disabled,
    render: <div />,
    'aria-labelledby': `${id}-title`,
    'aria-describedby': description ? `${id}-description` : undefined,
    className: cn(card, icon ? 'gap-3' : 'gap-4', className),
  };
  return multiple ? (
    <Checkbox.Root data-slot="choice-card" value={value} {...props}>
      {content}
    </Checkbox.Root>
  ) : (
    <Radio.Root data-slot="choice-card" value={value} {...props}>
      {content}
    </Radio.Root>
  );
}
