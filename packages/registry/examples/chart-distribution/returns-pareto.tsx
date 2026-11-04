import { Card, CardHeader, ParetoChart } from '@/kvant';

export default function ChartDistributionReturnsPareto() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Причины возвратов" description="Октябрь 2026 · доля и накопленный итог, одна шкала в %" />
      <ParetoChart
        aria-label="Причины возвратов за октябрь"
        barLabel="Доля причины"
        valueLabel="Возвратов"
        data={[
          { label: 'Передумал', value: 32 },
          { label: 'Брак', value: 124 },
          { label: 'Не подошёл размер', value: 88 },
          { label: 'Долгая доставка', value: 56 },
          { label: 'Не как на фото', value: 44 },
          { label: 'Повреждён в пути', value: 24 },
          { label: 'Ошибка заказа', value: 20 },
          { label: 'Прочее', value: 12 },
        ]}
      />
    </Card>
  );
}
