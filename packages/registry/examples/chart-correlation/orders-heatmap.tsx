import { Card, CardHeader, HeatMatrixChart } from '@/kvant';

const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const hours = Array.from({ length: 15 }, (_, i) => `${i + 8}:00`);
const orders = [
  [11, 14, 18, 35, 71, 83, 68, 38, 21, 14, 22, 42, 62, 45, 22],
  [11, 14, 21, 39, 61, 69, 57, 39, 20, 13, 24, 46, 64, 43, 18],
  [11, 12, 23, 50, 76, 80, 80, 48, 24, 17, 26, 55, 68, 58, 26],
  [10, 15, 24, 44, 74, 87, 81, 44, 25, 15, 26, 57, 70, 52, 26],
  [11, 12, 19, 38, 69, 71, 72, 37, 23, 13, 24, 49, 63, 46, 22],
  [7, 8, 13, 28, 51, 56, 41, 30, 15, 11, 14, 34, 39, 33, 14],
  [7, 9, 13, 28, 50, 51, 42, 30, 14, 10, 13, 31, 41, 34, 13],
];

export default function ChartCorrelationOrdersHeatmap() {
  return (
    <Card className="w-full">
      <CardHeader title="Заказы по дням и часам" description="Средние за октябрь 2026 · ищем пики нагрузки" />
      <HeatMatrixChart aria-label="Заказы по дням недели и часам" rows={days} columns={hours} values={orders} legendTitle="Заказов в час" />
    </Card>
  );
}
