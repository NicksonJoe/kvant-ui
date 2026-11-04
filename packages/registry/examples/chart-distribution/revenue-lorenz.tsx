import { Card, CardHeader, LorenzChart } from '@/kvant';

// Выручка 40 клиентов за 2026 год, тыс ₽
const revenue = [
  12, 15, 18, 20, 22, 25, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 52, 55, 60, 64, 70, 75, 80, 88, 95, 105, 115, 128, 140, 160, 180, 210, 240, 280,
  330, 400, 480, 620, 850, 1200,
];

export default function ChartDistributionRevenueLorenz() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Концентрация выручки" description="2026 год · 40 клиентов от меньшей выручки к большей" />
      <LorenzChart aria-label="Кривая Лоренца выручки по клиентам" values={revenue} populationLabel="клиентов" valueLabel="Доля выручки" />
    </Card>
  );
}
