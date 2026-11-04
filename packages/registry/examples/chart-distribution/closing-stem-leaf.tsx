import { Card, CardHeader, StemLeafChart } from '@/kvant';

// Дни от создания до закрытия 46 сделок октября
const days = [
  13, 14, 17, 18, 20, 22, 23, 27, 27, 28, 29, 30, 30, 31, 31, 35, 35, 35, 37, 38, 38, 39, 40, 41, 41, 42, 43, 45, 46, 46, 48, 48, 48, 49, 50, 53, 53, 53, 55,
  56, 56, 58, 59, 64, 64, 69,
];

export default function ChartDistributionClosingStemLeaf() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Сроки закрытия сделок" description="Октябрь 2026 · 46 сделок, дни · 3 | 4 = 34 дня" />
      <StemLeafChart aria-label="Сроки закрытия сделок октября, дни" values={days} />
    </Card>
  );
}
