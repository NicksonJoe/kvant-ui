import { useState } from 'react';
import { Pagination, Select } from '@/kvant';

const sizes = [
  { value: '10', label: '10 на странице' },
  { value: '25', label: '25 на странице' },
  { value: '50', label: '50 на странице' },
] as const;

export default function PaginationTableFooter() {
  const [page, setPage] = useState(5);
  const [size, setSize] = useState<(typeof sizes)[number]['value']>('10');
  const total = 248;
  const perPage = Number(size);
  const pageCount = Math.ceil(total / perPage);
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-1 px-4 py-2.5 shadow-raised">
      <p className="text-label-sm text-fg-3 tabular-nums">
        Показано {from}–{to} из {total}
      </p>
      <div className="flex items-center gap-3">
        <Select
          aria-label="Строк на странице"
          size="sm"
          options={sizes}
          value={size}
          onValueChange={(value) => {
            if (!value) return;
            setSize(value);
            setPage(1);
          }}
        />
        <Pagination variant="compact" page={Math.min(page, pageCount)} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}
