import { Check, Copy } from 'lucide-react';
import { createContext, use, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useCopy } from '../lib/use-copy';

export type DataListOrientation = 'horizontal' | 'vertical';
const OrientationContext = createContext<DataListOrientation>('horizontal');

export interface DataListProps extends ComponentProps<'dl'> {
  /** horizontal: label left (180), rows ≥44 with separators · vertical: label above, three columns. */
  orientation?: DataListOrientation;
}

/** «Key — value» pairs of one record: deal header, side sheet, requisites. */
export function DataList({ orientation = 'horizontal', className, ...props }: DataListProps) {
  return (
    <OrientationContext value={orientation}>
      <dl
        data-slot="data-list"
        data-orientation={orientation}
        className={cn(
          orientation === 'horizontal'
            ? 'flex flex-col [&>*:not(:last-child)]:border-b [&>*]:border-separator'
            : 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3',
          className,
        )}
        {...props}
      />
    </OrientationContext>
  );
}

export interface DataListItemProps extends Omit<ComponentProps<'div'>, 'children'> {
  label: ReactNode;
  children: ReactNode;
  /** Adds a copy button that shows on row hover (horizontal) — INN, account numbers, links. */
  copyValue?: string;
  /** Vertical layout: the item spans all columns under a separator (comments, addresses). */
  wide?: boolean;
}

export function DataListItem({ label, children, copyValue, wide, className, ...props }: DataListItemProps) {
  const orientation = use(OrientationContext);
  const [copied, copy] = useCopy();
  const labelText = typeof label === 'string' ? label : 'значение';

  return (
    <div
      data-slot="data-list-item"
      className={cn(
        'group/item',
        orientation === 'horizontal'
          ? 'flex min-h-11 flex-col justify-center gap-0.5 py-3 sm:flex-row sm:items-center sm:gap-4 sm:py-2'
          : 'flex flex-col gap-1',
        orientation === 'vertical' && wide && 'col-span-full border-t border-separator pt-5',
        className,
      )}
      {...props}
    >
      <dt
        className={cn(
          'shrink-0 text-fg-3',
          orientation === 'horizontal' ? 'text-body-sm sm:w-45' : 'text-caption font-medium',
        )}
      >
        {label}
      </dt>
      <dd className="flex min-w-0 flex-1 items-center gap-2 text-body-sm font-medium text-fg-1 tabular-nums">
        <span className={cn('min-w-0 flex-1', orientation === 'vertical' && wide && 'max-w-prose font-regular')}>{children}</span>
        {copyValue !== undefined ? (
          <>
            <button
              type="button"
              aria-label={`Скопировать: ${labelText}`}
              onClick={() => copy(copyValue)}
              className={cn(
                'kv-pressable -my-1 grid size-7 shrink-0 place-items-center rounded-full text-fg-3 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-2 hover:text-fg-1 active:bg-fill-3',
                // shown on row hover and focus; always visible on touch and after copying
                'opacity-0 pointer-coarse:opacity-100 group-hover/item:opacity-100 focus-visible:opacity-100',
                copied && 'opacity-100',
                '[&_svg]:size-4 [&_svg]:stroke-[1.75]',
              )}
            >
              {copied ? (
                <Check aria-hidden className="text-success-soft-fg transition-[scale,opacity] duration-(--duration-quick) ease-out starting:scale-80 starting:opacity-0" />
              ) : (
                <Copy aria-hidden />
              )}
            </button>
            <span role="status" className="sr-only">
              {copied ? 'Скопировано' : ''}
            </span>
          </>
        ) : null}
      </dd>
    </div>
  );
}
