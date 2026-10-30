import { Archive } from 'lucide-react';
import { Button, DataTable, type DataTableColumn } from '@/kvant';
import type { Playground } from '@/kvant/meta';

interface Deal {
  id: string;
  title: string;
  client: string;
  amount: number;
}

const deals: Deal[] = [
  { id: 'd1', title: 'Айдентика и сайт', client: '«Студия Север»', amount: 1_284_900 },
  { id: 'd2', title: 'Иллюстрации к книге', client: '«Издательство Полка»', amount: 960_000 },
  { id: 'd3', title: 'Сайт и CRM-интеграция', client: '«Орбита Лаб»', amount: 640_000 },
  { id: 'd4', title: 'Презентация для инвесторов', client: '«Полярный свет»', amount: 412_000 },
  { id: 'd5', title: 'Анимация логотипа', client: '«Студия Север»', amount: 312_500 },
  { id: 'd6', title: 'Упаковка для линейки чая', client: '«Чайная лавка»', amount: 286_000 },
];

const columns: readonly DataTableColumn<Deal>[] = [
  { id: 'title', header: 'Сделка', cell: (deal) => <span className="font-medium">{deal.title}</span>, sortValue: (deal) => deal.title },
  { id: 'client', header: 'Клиент', cell: (deal) => <span className="text-fg-2">{deal.client}</span> },
  { id: 'amount', header: 'Сумма', numeric: true, cell: (deal) => `${deal.amount.toLocaleString('ru-RU')} ₽`, sortValue: (deal) => deal.amount },
];

const playground: Playground = {
  controls: [{ name: 'paged', type: 'boolean', default: true, description: 'Страницы по 4 строки и подвал с пагинацией.' }],
  render: (p) => (
    <DataTable
      aria-label="Сделки"
      className="w-full"
      rows={deals}
      columns={columns}
      getRowId={(deal) => deal.id}
      rowLabel={(deal) => deal.title}
      density={p.pick('density', ['compact', 'comfortable', 'touch'] as const)}
      selectable={p.bool('selectable')}
      loading={p.bool('loading')}
      pageSize={p.bool('paged') ? 4 : undefined}
      bulkActions={(_ids, clear) => (
        <Button variant="ghost" leadingIcon={<Archive />} onClick={clear}>
          Архив
        </Button>
      )}
    />
  ),
  code: (p) => `<DataTable
  aria-label="Сделки"
  rows={deals}
  columns={columns}
  getRowId={(deal) => deal.id}${p.attrs(['density', 'selectable', 'loading'])}${p.bool('paged') ? '\n  pageSize={4}' : ''}
  bulkActions={(ids, clear) => <Button variant="ghost" leadingIcon={<Archive />} onClick={clear}>Архив</Button>}
/>`,
};

export default playground;
