import { ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type TableDensity = 'compact' | 'comfortable' | 'touch';
const rowHeights: Record<TableDensity, string> = {
  compact: '[--kv-row-h:40px]',
  comfortable: '[--kv-row-h:var(--spacing-row)]',
  touch: '[--kv-row-h:56px]',
};

/** Classes of the <table> element: full width, collapsed borders, row height of the density. */
export function tableClasses(density: TableDensity = 'comfortable'): string {
  return cn('w-full border-collapse text-body-sm text-fg-1', rowHeights[density]);
}

export interface TableProps extends ComponentProps<'table'> {
  density?: TableDensity;
  /** Class for the rounded container (surface-1, r20, hairline ring). */
  containerClassName?: string;
}

/** Native table semantics; the container scrolls horizontally on narrow screens. */
export function Table({ density = 'comfortable', className, containerClassName, ...props }: TableProps) {
  return (
    <div
      data-slot="table-container"
      className={cn('overflow-x-auto rounded-xl bg-surface-1 shadow-[0_0_0_1px_var(--color-hairline)]', containerClassName)}
    >
      <table
        data-slot="table"
        data-density={density}
        className={cn(tableClasses(density), className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('bg-surface-2', className)} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn('[&>tr:not(:last-child)]:border-b [&>tr]:border-separator', className)} {...props} />;
}

export interface TableRowProps extends ComponentProps<'tr'> {
  selected?: boolean;
}

/** Hover fill-1 (instant in dense lists); selected rows get accent-soft. */
export function TableRow({ selected, className, ...props }: TableRowProps) {
  return (
    <tr
      data-slot="table-row"
      data-selected={selected || undefined}
      aria-selected={selected}
      className={cn('hover:bg-fill-1 data-selected:bg-accent-soft', className)}
      {...props}
    />
  );
}

export type SortDirection = 'ascending' | 'descending' | 'none';

export interface TableHeadProps extends ComponentProps<'th'> {
  /** Numbers align right. */
  numeric?: boolean;
  /** Makes the header a sort button; `aria-sort` reflects the direction. */
  sort?: SortDirection;
  onSort?: () => void;
}

export function TableHead({ numeric, sort, onSort, className, children, ...props }: TableHeadProps) {
  const sorted = sort === 'ascending' || sort === 'descending';
  return (
    <th
      data-slot="table-head"
      scope="col"
      aria-sort={onSort ? sort ?? 'none' : undefined}
      className={cn('h-10 px-4 text-caption font-medium whitespace-nowrap text-fg-3', numeric ? 'text-right' : 'text-left', className)}
      {...props}
    >
      {onSort ? (
        // capsule 28 that sits 8px outside the column edge, so the label lines up with the cells
        <button
          type="button"
          onClick={onSort}
          className={cn(
            'kv-pressable -mx-2 inline-flex h-7 items-center gap-1 rounded-full px-2 hover:bg-fill-2 hover:text-fg-1 [&_svg]:size-3.5 [&_svg]:stroke-[1.75]',
            numeric && 'flex-row-reverse',
            sorted && 'text-fg-1',
          )}
        >
          {children}
          {sorted ? (
            <ArrowUp
              aria-hidden
              className={cn('text-fg-1 transition-[rotate] duration-(--duration-quick) ease-out', sort === 'descending' && 'rotate-180')}
            />
          ) : (
            <ChevronsUpDown aria-hidden className="text-fg-4" />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export interface TableCellProps extends ComponentProps<'td'> {
  numeric?: boolean;
}

export function TableCell({ numeric, className, ...props }: TableCellProps) {
  return (
    <td
      data-slot="table-cell"
      className={cn('h-(--kv-row-h) px-4', numeric && 'text-right tabular-nums', className)}
      {...props}
    />
  );
}
