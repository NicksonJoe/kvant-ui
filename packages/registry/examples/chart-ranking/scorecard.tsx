import { BarTableChart, Card, CardHeader, type BarTableColumn } from '@/kvant';

interface Manager {
  name: string;
  deals: number;
  revenue: number;
  conversion: number;
  change: number;
}

const managers: Manager[] = [
  { name: 'Анна Северова', deals: 31, revenue: 1.84, conversion: 28.4, change: 12 },
  { name: 'Михаил Орлов', deals: 27, revenue: 1.52, conversion: 24.1, change: 4 },
  { name: 'Дарья Ким', deals: 24, revenue: 1.31, conversion: 26.7, change: -3 },
  { name: 'Олег Панов', deals: 22, revenue: 1.12, conversion: 19.8, change: 9 },
  { name: 'Ирина Лис', deals: 18, revenue: 0.94, conversion: 22.5, change: -11 },
];

const columns: BarTableColumn<Manager>[] = [
  { id: 'name', header: 'Менеджер', kind: 'label', value: (row) => row.name, avatar: true },
  { id: 'deals', header: 'Сделки', kind: 'bar', value: (row) => row.deals },
  {
    id: 'revenue',
    header: 'Выручка, млн ₽',
    kind: 'bar',
    value: (row) => row.revenue,
    format: (value) => value.toLocaleString('ru-RU', { minimumFractionDigits: 2 }),
  },
  { id: 'conversion', header: 'Конверсия', kind: 'threshold', value: (row) => row.conversion, threshold: 25 },
  { id: 'change', header: 'К сентябрю', kind: 'delta', value: (row) => row.change },
];

export default function ChartRankingScorecard() {
  return (
    <Card className="w-full">
      <CardHeader title="Менеджеры: сделки, выручка, конверсия" description="Октябрь 2026 · полосы в ячейках, заливка конверсии от 25 %, дельта к сентябрю" />
      <BarTableChart aria-label="Менеджеры: сделки, выручка и конверсия за октябрь 2026" rows={managers} columns={columns} getRowId={(row) => row.name} />
    </Card>
  );
}
