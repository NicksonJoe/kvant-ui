import { Card, CardHeader, MarimekkoChart } from '@/kvant';

const regions = ['Москва', 'Санкт-Петербург', 'Поволжье', 'Урал', 'Сибирь'];
const market = [45_600, 26_400, 21_600, 14_400, 12_000];
const mix = [
  [0.52, 0.3, 0.18],
  [0.44, 0.34, 0.22],
  [0.38, 0.27, 0.35],
  [0.31, 0.41, 0.28],
  [0.26, 0.33, 0.41],
];
const channel = (index: number) => market.map((total, region) => Math.round(total * (mix[region]?.[index] ?? 0)));
const rub = (value: number) => `${value.toLocaleString('ru-RU')} тыс ₽`;

export default function ChartPartsMarimekko() {
  return (
    <Card className="w-full">
      <CardHeader title="Рынок по регионам и каналам" description="2026 · ширина столбца — доля региона, высота сегмента — доля канала" />
      <MarimekkoChart
        aria-label="Рынок по регионам и каналам продаж, 2026"
        formatValue={rub}
        labels={regions}
        series={[
          { name: 'Сайт', values: channel(0) },
          { name: 'Партнёры', values: channel(1) },
          { name: 'Прямые', values: channel(2) },
        ]}
      />
    </Card>
  );
}
