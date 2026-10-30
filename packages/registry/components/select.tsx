import { Select as BaseSelect } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { listItem, listItemTone, popupSurface, positioner } from '../lib/recipes';
import { fieldShell, fieldSizes, type FieldSize } from './input';

export interface SelectOption<V extends string> {
  value: V;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps<V extends string> {
  options: readonly SelectOption<V>[];
  value?: V | null;
  defaultValue?: V | null;
  onValueChange?: (value: V | null) => void;
  placeholder?: string;
  size?: FieldSize;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  'aria-label'?: string;
  className?: string;
}

/**
 * Text-field trigger + menu-style list with a check on the selected row.
 * Keyboard (Base UI): Space/Enter/↓ open, arrows move, Enter selects, Esc closes, typeahead jumps.
 */
export function Select<V extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Выберите',
  size = 'md',
  disabled,
  required,
  name,
  id,
  className,
  'aria-label': ariaLabel,
}: SelectProps<V>) {
  return (
    <BaseSelect.Root<V>
      items={options.map((option) => ({ value: option.value, label: option.label }))}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next)}
      disabled={disabled}
      required={required}
      name={name}
      id={id}
    >
      <BaseSelect.Trigger
        data-slot="select-trigger"
        aria-label={ariaLabel}
        className={cn(
          fieldShell,
          fieldSizes[size],
          'justify-between text-left data-popup-open:border-ring data-popup-open:shadow-[0_0_0_1px_var(--color-ring)] focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-[0_0_0_1px_var(--color-ring)] data-disabled:opacity-50 data-disabled:bg-surface-2',
          className,
        )}
      >
        <BaseSelect.Value placeholder={placeholder} className="min-w-0 flex-1 truncate data-placeholder:text-fg-3" />
        <BaseSelect.Icon className="flex text-fg-3 [&_svg]:size-4 [&_svg]:stroke-[1.75]">
          <ChevronDown aria-hidden />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4} alignItemWithTrigger={false} className={positioner}>
          <BaseSelect.Popup data-slot="select-popup" className={cn(popupSurface, 'min-w-(--anchor-width)')}>
            <BaseSelect.List className="max-h-(--available-height) overflow-y-auto">
              {options.map((option) => (
                <BaseSelect.Item key={option.value} value={option.value} disabled={option.disabled} className={cn(listItem, listItemTone)}>
                  {option.icon}
                  <BaseSelect.ItemText className="min-w-0 flex-1 truncate">{option.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="ml-auto flex [&_svg]:text-accent">
                    <Check aria-hidden />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
