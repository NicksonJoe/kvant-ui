import { Card, CardHeader, TornadoChart } from '@/kvant';

export default function ChartDeviationProfitDrivers() {
  return (
    <Card className="w-full">
      <CardHeader title="Что сильнее всего двигает прибыль" description="План 2027 · изменение прибыли, млн ₽, если показатель сдвинуть на 10 %" />
      <TornadoChart
        aria-label="Чувствительность прибыли к показателям, млн ₽"
        lowLabel="показатель −10 %"
        highLabel="показатель +10 %"
        baseLabel="база 4,2 млн"
        positiveLabel="Прибыль растёт"
        negativeLabel="Прибыль падает"
        data={[
          { label: 'Зарплаты ±10 %', low: 0.6, high: -0.6 },
          { label: 'Цена товара ±10 %', low: -1.9, high: 1.9 },
          { label: 'Средний чек ±10 %', low: -0.9, high: 0.9 },
          { label: 'Закупочная цена ±10 %', low: 1.4, high: -1.4 },
          { label: 'Аренда склада ±10 %', low: 0.3, high: -0.3 },
          { label: 'Конверсия сайта ±10 %', low: -1.2, high: 1.2 },
          { label: 'Стоимость доставки ±10 %', low: 0.5, high: -0.5 },
        ]}
      />
    </Card>
  );
}
