import { Card, CardHeader, OrderedBarChart } from '@/kvant';

const rub = (value: number) => `${(value / 1e6).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} млн ₽`;

export default function ChartRankingManagers() {
  return (
    <Card className="w-full">
      <CardHeader title="Рейтинг менеджеров" description="Октябрь 2026 · выручка по закрытым сделкам" />
      <OrderedBarChart
        aria-label="Рейтинг менеджеров по выручке за октябрь 2026"
        valueLabel="Выручка"
        formatValue={rub}
        focus="Вы · Дарья Ким"
        data={[
          { label: 'Анна Северова', value: 1_840_000 },
          { label: 'Михаил Орлов', value: 1_520_000 },
          { label: 'Вы · Дарья Ким', value: 1_310_000 },
          { label: 'Олег Панов', value: 1_120_000 },
          { label: 'Ирина Лис', value: 940_000 },
          { label: 'Сергей Ветров', value: 710_000 },
          { label: 'Пётр Гаев', value: 480_000 },
        ]}
      />
    </Card>
  );
}
