import { BubbleChart, Card, CardHeader } from '@/kvant';

const rub = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;
const revenue = (value: number) => `${(value / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₽`;

export default function ChartCorrelationSegments() {
  return (
    <Card className="w-full">
      <CardHeader title="Сегменты клиентов" description="Октябрь 2026 · X — клиентов · Y — средний чек, ₽ · обе оси логарифмические · площадь — выручка" />
      <BubbleChart
        aria-label="Сегменты клиентов: число клиентов, средний чек и выручка"
        xScale="log"
        yScale="log"
        xName="Клиентов"
        yName="Средний чек"
        sizeName="Выручка"
        xUnit="клиентов"
        formatXTick={String}
        formatY={rub}
        formatSize={revenue}
        series={[
          {
            name: 'Малый бизнес',
            points: [
              { label: 'Розница', x: 860, y: 13_600, size: 11_700_000 },
              { label: 'Кафе', x: 480, y: 15_000, size: 7_200_000 },
              { label: 'Салоны', x: 230, y: 16_100, size: 3_700_000 },
            ],
          },
          {
            name: 'Средний',
            points: [
              { label: 'Аптеки', x: 150, y: 66_000, size: 9_900_000 },
              { label: 'Склады', x: 95, y: 99_000, size: 9_400_000 },
              { label: 'Производство', x: 60, y: 122_000, size: 7_300_000 },
            ],
          },
          {
            name: 'Крупный',
            points: [
              { label: 'Сети', x: 40, y: 210_000, size: 8_400_000 },
              { label: 'Дистрибуция', x: 24, y: 320_000, size: 7_700_000 },
              { label: 'Логистика', x: 14, y: 230_000, size: 3_200_000 },
            ],
          },
        ]}
      />
    </Card>
  );
}
