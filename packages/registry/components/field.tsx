import { Field as BaseField } from '@base-ui/react/field';
import { CircleX } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface FieldProps extends Omit<BaseField.Root.Props, 'className' | 'children'> {
  label?: ReactNode;
  /** Adds «необязательно» after the label. */
  optional?: boolean;
  description?: ReactNode;
  /** Error text. Marks the control aria-invalid and links the message via aria-describedby. */
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + description + error, wired by Base UI Field: the label targets the control,
 * description and error ids land in the control's aria-describedby. Without `error`, messages from
 * `validate`, native constraints and `<Form errors>` show in the same place.
 */
export function Field({ label, optional, description, error, invalid, onChange, className, children, ...props }: FieldProps) {
  const hasError = error !== undefined && error !== null && error !== false;
  const actions = useRef<BaseField.Root.Actions>(null);
  return (
    <BaseField.Root
      data-slot="field"
      actionsRef={actions}
      invalid={hasError || invalid}
      onChange={(event) => {
        onChange?.(event);
        // Once a field is wrong it is re-checked on every change, so the error leaves the moment it is fixed.
        if (event.currentTarget.hasAttribute('data-invalid')) actions.current?.validate();
      }}
      className={cn('flex min-w-0 flex-col gap-1.5', className)}
      {...props}
    >
      {label ? (
        <BaseField.Label className="inline-flex items-baseline gap-1.5 text-label-sm font-medium text-fg-2">
          {label}
          {optional ? <span className="font-regular text-fg-3">необязательно</span> : null}
        </BaseField.Label>
      ) : null}
      {children}
      {description ? <BaseField.Description className="text-caption text-fg-3">{description}</BaseField.Description> : null}
      <BaseField.Error
        // No `children` key without an error: Base UI then renders its own validation message.
        {...(hasError ? { match: true, children: error } : {})}
        className="flex items-center gap-1 text-caption text-danger-soft-fg transition-opacity duration-(--duration-quick) ease-out data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--duration-fast) [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]"
        render={(errorProps) => (
          <div {...errorProps} hidden={!errorProps.children}>
            <CircleX aria-hidden />
            {errorProps.children}
          </div>
        )}
      />
    </BaseField.Root>
  );
}
