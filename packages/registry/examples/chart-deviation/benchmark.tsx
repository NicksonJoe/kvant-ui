import { Card, CardHeader, SpineChart } from '@/kvant';

const rub = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;
const percent = (value: number) => `${value.toLocaleString('ru-RU')} %`;
const hours = (value: number) => `${value.toLocaleString('ru-RU')} ч`;

export default function ChartDeviationBenchmark() {
  return (
    <Card className="w-full">
      <CardHeader title="Наш магазин против сети" description="Октябрь 2026 · 48 магазинов · центр — среднее по сети, чем правее, тем лучше" />
      <SpineChart
        aria-label="Показатели магазина против среднего по сети"
        worseLabel="хуже сети"
        betterLabel="лучше сети"
        valuesLabel="мы · сеть"
        data={[
          { label: 'Средний чек', value: 2840, mean: 2700, min: 1900, max: 3400, q1: 2450, q3: 2950, format: rub },
          { label: 'Конверсия', value: 2.9, mean: 3.4, min: 1.8, max: 5.1, q1: 2.9, q3: 4.4, format: percent },
          { label: 'Возвраты', value: 5.8, mean: 4.1, min: 1.2, max: 7.5, q1: 2.6, q3: 5.2, lowerIsBetter: true, format: percent },
          { label: 'Доставка в срок', value: 96, mean: 93, min: 81, max: 99, q1: 88, q3: 96, format: percent },
          { label: 'Время ответа', value: 1.8, mean: 2.6, min: 0.9, max: 6.4, q1: 1.7, q3: 3.8, lowerIsBetter: true, format: hours },
          { label: 'NPS', value: 62, mean: 48, min: 12, max: 71, q1: 36, q3: 60 },
        ]}
      />
    </Card>
  );
}
