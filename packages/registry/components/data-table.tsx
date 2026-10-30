import { X } from 'lucide-react';
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import { IconButton } from './button';
import { Checkbox } from './checkbox';
import { Pagination } from './pagination';
import { Skeleton } from './progress';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, tableClasses, type TableDensity } from './table';

export interface DataTableColumn<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  /** Value to sort by; makes the header a sort button (none → ↑ → ↓ → none). */
  sortValue?: (row: Row) => string | number;
  /** Numbers: right-aligned, tabular, sort arrow left of the label. */
  numeric?: boolean;
  /** Header and cell class, e.g. a width. */
  className?: string;
}

export interface DataTableSort {
  column: string;
  direction: 'ascending' | 'descending';
}

export interface DataTableProps<Row> {
  'aria-label': string;
  rows: readonly Row[];
  columns: readonly DataTableColumn<Row>[];
  getRowId: (row: Row) => string;
  /** Name of a row for its checkbox: «Выбрать: Айдентика и сайт». */
  rowLabel?: (row: Row) => string;
  /** Checkbox column; Space selects the focused row, Esc clears. */
  selectable?: boolean;
  selected?: readonly string[];
  defaultSelected?: readonly string[];
  onSelectedChange?: (ids: readonly string[]) => void;
  /** Archived rows: dimmed, cannot be selected. */
  isRowDisabled?: (row: Row) => boolean;
  sort?: DataTableSort | null;
  defaultSort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  /** Floating glass bar while something is selected; gets the ids and a way to clear them. */
  bulkActions?: (selected: readonly string[], clear: () => void) => ReactNode;
  /** Trailing «…» of a row; shows on hover and focus (always on touch). */
  rowActions?: (row: Row) => ReactNode;
  /** Above the table: search, filter chips, view switch, primary action. */
  toolbar?: ReactNode;
  /** Splits rows into pages; the footer shows «Показано 1–10 из 248» and pagination. */
  pageSize?: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Server data: `rows` is the current page only, `total` the full count. */
  total?: number;
  /** Skeleton rows under the real header, so columns do not jump when data arrives. */
  loading?: boolean;
  /** Shown instead of rows when there are none, usually an EmptyState. */
  empty?: ReactNode;
  density?: TableDensity;
  className?: string;
}

function compare(a: string | number, b: string | number): number {
  return typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'ru');
}

const count = (value: number) => value.toLocaleString('ru-RU');

/** Toolbar, table and footer as one system; the bulk bar is the only glass layer and never pushes rows. */
export function DataTable<Row>({
  rows,
  columns,
  getRowId,
  rowLabel,
  selectable = false,
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  isRowDisabled,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  bulkActions,
  rowActions,
  toolbar,
  pageSize,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  total,
  loading = false,
  empty,
  density = 'comfortable',
  className,
  'aria-label': label,
}: DataTableProps<Row>) {
  const [selected, setSelected] = useControllable(selectedProp, defaultSelected, onSelectedChange);
  const [sort, setSort] = useControllable(sortProp, defaultSort, onSortChange);
  const [rawPage, setPage] = useControllable(pageProp, defaultPage, onPageChange);
  const [focusIndex, setFocusIndex] = useState(0);

  const sortColumn = sort ? columns.find((column) => column.id === sort.column) : undefined;
  const getValue = sortColumn?.sortValue;
  const sorted =
    sort && getValue
      ? [...rows].sort((a, b) => (sort.direction === 'ascending' ? 1 : -1) * compare(getValue(a), getValue(b)))
      : rows;

  const totalCount = total ?? rows.length;
  const pageCount = pageSize ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  const page = Math.min(Math.max(1, rawPage), pageCount);
  const visible = pageSize && total === undefined ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  const chosen = new Set(selected);
  const pageIds = visible.filter((row) => !isRowDisabled?.(row)).map(getRowId);
  const pageChosen = pageIds.filter((id) => chosen.has(id)).length;
  const clear = () => setSelected([]);
  const toggle = (id: string) => setSelected(chosen.has(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  const barOpen = selectable && bulkActions !== undefined && selected.length > 0;
  const columnCount = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  const cycleSort = (column: string) => {
    if (sort?.column !== column) setSort({ column, direction: 'ascending' });
    else setSort(sort.direction === 'ascending' ? { column, direction: 'descending' } : null);
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: Row) => {
    if (event.target !== event.currentTarget) return;
    const sibling = (key: string) =>
      key === 'ArrowDown'
        ? event.currentTarget.nextElementSibling
        : key === 'ArrowUp'
          ? event.currentTarget.previousElementSibling
          : key === 'Home'
            ? event.currentTarget.parentElement?.firstElementChild
            : key === 'End'
              ? event.currentTarget.parentElement?.lastElementChild
              : null;
    const target = sibling(event.key);
    if (target instanceof HTMLElement) {
      event.preventDefault();
      target.focus();
    } else if (event.key === ' ' && selectable && !isRowDisabled?.(row)) {
      event.preventDefault();
      toggle(getRowId(row));
    }
  };

  const from = totalCount === 0 ? 0 : pageSize ? (page - 1) * pageSize + 1 : 1;
  const to = pageSize ? Math.min(page * pageSize, totalCount) : totalCount;

  return (
    <div
      data-slot="data-table"
      className={cn('flex flex-col gap-4', className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && selected.length > 0) {
          event.preventDefault();
          clear();
        }
      }}
    >
      {toolbar ? (
        <div data-slot="data-table-toolbar" className="flex flex-wrap items-center gap-2">
          {toolbar}
        </div>
      ) : null}
      <div className="relative rounded-xl bg-surface-1 shadow-raised">
        <div className={cn('overflow-x-auto', pageSize ? 'rounded-t-xl' : 'rounded-xl')}>
          {/* cells never wrap: a narrow screen scrolls the table sideways instead of making rows uneven */}
          <table
            data-slot="table"
            data-density={density}
            aria-label={label}
            aria-busy={loading || undefined}
            className={cn(tableClasses(density), '[&_td:not([colspan])]:whitespace-nowrap')}
          >
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {selectable ? (
                  <TableHead className="w-13 pr-0">
                    <Checkbox
                      aria-label="Выбрать все строки"
                      checked={pageIds.length > 0 && pageChosen === pageIds.length}
                      indeterminate={pageChosen > 0 && pageChosen < pageIds.length}
                      disabled={loading || pageIds.length === 0}
                      onCheckedChange={(on) =>
                        setSelected(on ? [...selected, ...pageIds.filter((id) => !chosen.has(id))] : selected.filter((id) => !pageIds.includes(id)))
                      }
                    />
                  </TableHead>
                ) : null}
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    numeric={column.numeric}
                    className={column.className}
                    sort={column.sortValue ? (sort?.column === column.id ? sort.direction : 'none') : undefined}
                    onSort={column.sortValue ? () => cycleSort(column.id) : undefined}
                  >
                    {column.header}
                  </TableHead>
                ))}
                {rowActions ? (
                  <TableHead className="w-12">
                    <span className="sr-only">Действия</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={index} className="hover:bg-transparent">
                      {selectable ? (
                        <TableCell className="pr-0">
                          <Skeleton shape="rect" className="size-4.5 rounded-xs" />
                        </TableCell>
                      ) : null}
                      {columns.map((column, at) => (
                        <TableCell key={column.id} numeric={column.numeric}>
                          <Skeleton className={cn(column.numeric && 'ml-auto', at === 0 ? 'w-48 max-w-full' : 'w-20')} />
                        </TableCell>
                      ))}
                      {rowActions ? <TableCell /> : null}
                    </TableRow>
                  ))
                : visible.map((row, index) => {
                    const id = getRowId(row);
                    const disabled = isRowDisabled?.(row) ?? false;
                    return (
                      <TableRow
                        key={id}
                        selected={selectable ? chosen.has(id) : undefined}
                        aria-disabled={disabled || undefined}
                        tabIndex={index === Math.min(focusIndex, visible.length - 1) ? 0 : -1}
                        onFocus={() => setFocusIndex(index)}
                        onKeyDown={(event) => onRowKeyDown(event, row)}
                        className={cn('group/row focus-visible:-outline-offset-2', disabled && 'opacity-50 hover:bg-transparent')}
                      >
                        {selectable ? (
                          <TableCell className="pr-0">
                            <Checkbox
                              aria-label={`Выбрать: ${rowLabel?.(row) ?? `строка ${(page - 1) * (pageSize ?? 0) + index + 1}`}`}
                              checked={chosen.has(id)}
                              disabled={disabled}
                              onCheckedChange={() => toggle(id)}
                            />
                          </TableCell>
                        ) : null}
                        {columns.map((column) => (
                          <TableCell key={column.id} numeric={column.numeric} className={column.className}>
                            {column.cell(row)}
                          </TableCell>
                        ))}
                        {rowActions ? (
                          <TableCell className="pr-2 text-right">
                            <div className="inline-flex opacity-0 transition-opacity duration-(--duration-micro) group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100">
                              {rowActions(row)}
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
              {!loading && visible.length === 0 && empty ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columnCount} className="py-6">
                    {empty}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </table>
        </div>

        {selectable && bulkActions ? (
          // zero-height sticky dock: the bar follows the viewport bottom while the table is long
          <div className="pointer-events-none sticky bottom-[calc(16px+env(safe-area-inset-bottom,0px))] z-10 flex h-0 justify-center">
            <div
              role="group"
              aria-label="Действия с выбранными"
              aria-hidden={!barOpen}
              inert={!barOpen}
              data-open={barOpen || undefined}
              className={cn(
                'absolute bottom-5 flex h-12 max-w-[calc(100%-16px)] items-center gap-1 rounded-full bg-glass py-1.5 pr-1.5 pl-4 whitespace-nowrap shadow-glass backdrop-blur-[20px] backdrop-saturate-180',
                'invisible translate-y-(--shift-lg) opacity-0 transition-[opacity,translate,visibility] duration-(--duration-quick) ease-exit',
                'data-open:pointer-events-auto data-open:visible data-open:translate-y-0 data-open:opacity-100 data-open:duration-(--duration-moderate) data-open:ease-fluid',
              )}
            >
              <span className="pr-2 text-label-md font-medium tabular-nums">Выбрано: {count(selected.length)}</span>
              <span aria-hidden className="mr-1 h-5 w-px bg-separator" />
              {bulkActions(selected, clear)}
              <IconButton size="md" icon={<X />} aria-label="Снять выделение" onClick={clear} />
            </div>
          </div>
        ) : null}

        {pageSize ? (
          <div data-slot="data-table-footer" className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-separator px-4 py-2">
            <p className="text-label-sm text-fg-3 tabular-nums">
              {totalCount > 0 ? `Показано ${count(from)}–${count(to)} из ${count(totalCount)}` : 'Нет записей'}
            </p>
            {pageCount > 1 ? (
              <Pagination
                page={page}
                pageCount={pageCount}
                labels={false}
                onPageChange={(next) => {
                  setPage(next);
                  setFocusIndex(0);
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
