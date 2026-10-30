import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { Button, IconButton } from './button';

/** Page numbers to show: the first, the last and the current ±1 (three pages at the edges); `gap` = «…». */
export function pageRange(page: number, pageCount: number): (number | 'gap')[] {
  const count = Math.max(1, pageCount);
  const current = Math.min(Math.max(1, page), count);
  let start = Math.max(1, current - 1);
  let end = Math.min(count, current + 1);
  if (current === 1) end = Math.min(count, 3);
  if (current === count) start = Math.max(1, count - 2);

  const pages: (number | 'gap')[] = [1];
  // a gap that would hide a single page shows that page instead
  if (start > 3) pages.push('gap');
  else for (let n = 2; n < start; n += 1) pages.push(n);
  for (let n = Math.max(2, start); n <= end; n += 1) pages.push(n);
  if (end < count - 2) pages.push('gap');
  else for (let n = end + 1; n < count; n += 1) pages.push(n);
  if (count > 1 && end < count) pages.push(count);
  return pages;
}

export type PaginationVariant = 'full' | 'compact' | 'mobile';

export interface PaginationProps extends Omit<ComponentProps<'nav'>, 'onChange'> {
  /** 1-based. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** full: numbers · compact: «5 / 25» for table footers · mobile: two large buttons and «5 из 25». */
  variant?: PaginationVariant;
  /** Full variant: «Назад» / «Вперёд» next to the arrows. */
  labels?: boolean;
}

const pageItem =
  'kv-pressable inline-grid h-8 min-w-8 place-items-center rounded-full px-2 text-label-sm font-medium text-fg-2 tabular-nums [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-1 hover:text-fg-1 active:bg-fill-2 aria-[current=page]:bg-fill-2 aria-[current=page]:font-semibold aria-[current=page]:text-fg-1';

/** Pages of a long list. First and last pages are always reachable; disabled arrows leave the tab order. */
export function Pagination({ page, pageCount, onPageChange, variant = 'full', labels = true, className, ...props }: PaginationProps) {
  const go = (target: number) => onPageChange(Math.min(Math.max(1, target), pageCount));
  const isFirst = page <= 1;
  const isLast = page >= pageCount;

  return (
    <nav data-slot="pagination" data-variant={variant} aria-label="Страницы" className={cn('flex items-center gap-0.5', className)} {...props}>
      {variant === 'mobile' ? (
        <>
          <Button variant="secondary" size="lg" leadingIcon={<ChevronLeft />} disabled={isFirst} onClick={() => go(page - 1)}>
            Назад
          </Button>
          <span className="flex-1 px-4 text-center text-body-sm text-fg-2 tabular-nums">
            {page} из {pageCount}
          </span>
          <Button variant="secondary" size="lg" trailingIcon={<ChevronRight />} disabled={isLast} onClick={() => go(page + 1)}>
            Вперёд
          </Button>
        </>
      ) : variant === 'compact' ? (
        <>
          <IconButton size="sm" icon={<ChevronLeft />} aria-label="Предыдущая страница" disabled={isFirst} onClick={() => go(page - 1)} />
          <span className="min-w-14 text-center text-label-sm font-medium text-fg-2 tabular-nums">
            {page} / {pageCount}
          </span>
          <IconButton size="sm" icon={<ChevronRight />} aria-label="Следующая страница" disabled={isLast} onClick={() => go(page + 1)} />
        </>
      ) : (
        <>
          {labels ? (
            <Button variant="ghost" size="sm" leadingIcon={<ChevronLeft />} disabled={isFirst} onClick={() => go(page - 1)}>
              Назад
            </Button>
          ) : (
            <IconButton size="sm" icon={<ChevronLeft />} aria-label="Предыдущая страница" disabled={isFirst} onClick={() => go(page - 1)} />
          )}
          {pageRange(page, pageCount).map((item, index) =>
            item === 'gap' ? (
              <span key={`gap-${index}`} aria-hidden className="inline-grid h-8 min-w-8 place-items-center text-label-sm text-fg-3">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`Страница ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => go(item)}
                className={pageItem}
              >
                {item}
              </button>
            ),
          )}
          {labels ? (
            <Button variant="ghost" size="sm" trailingIcon={<ChevronRight />} disabled={isLast} onClick={() => go(page + 1)}>
              Вперёд
            </Button>
          ) : (
            <IconButton size="sm" icon={<ChevronRight />} aria-label="Следующая страница" disabled={isLast} onClick={() => go(page + 1)} />
          )}
        </>
      )}
    </nav>
  );
}
