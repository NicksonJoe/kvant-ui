import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button, DataTable, EmptyState, SegmentedControl, type DataTableColumn } from '@/kvant';

interface Deal {
  id: string;
  title: string;
  stage: string;
  amount: number;
}

const columns: readonly DataTableColumn<Deal>[] = [
  { id: 'title', header: 'Сделка', cell: (deal) => deal.title },
  { id: 'stage', header: 'Этап', cell: (deal) => deal.stage },
  { id: 'amount', header: 'Сумма', numeric: true, cell: (deal) => `${deal.amount.toLocaleString('ru-RU')} ₽` },
];

export default function DataTableStates() {
  const [state, setState] = useState<'loading' | 'empty'>('loading');

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <SegmentedControl
        aria-label="Состояние таблицы"
        value={state}
        onValueChange={setState}
        options={[
          { value: 'loading', label: 'Загрузка' },
          { value: 'empty', label: 'Пусто' },
        ]}
        className="self-start"
      />
      <DataTable
        aria-label="Сделки"
        rows={[]}
        columns={columns}
        getRowId={(deal) => deal.id}
        selectable
        loading={state === 'loading'}
        empty={
          <EmptyState
            icon={<Search />}
            title="Сделок не найдено"
            description="По запросу «кафе» среди сделок в работе ничего нет. Сбросьте фильтры или создайте сделку."
            actions={
              <>
                <Button variant="ghost" size="sm">
                  Сбросить фильтры
                </Button>
                <Button size="sm" leadingIcon={<Plus />}>
                  Новая сделка
                </Button>
              </>
            }
          />
        }
      />
    </div>
  );
}
