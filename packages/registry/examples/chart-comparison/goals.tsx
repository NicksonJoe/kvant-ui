import { BulletChart, Card, CardHeader } from '@/kvant';

const oneDecimal = (value: number) => value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function ChartComparisonGoals() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Цели месяца" description="Октябрь 2026 · факт, цель и зоны «плохо — норма — хорошо»" />
      <BulletChart
        aria-label="Цели октября: факт против цели"
        data={[
          { label: 'Выручка', unit: 'млн ₽', value: 4.2, target: 5, ranges: [3, 4.2, 6], format: oneDecimal },
          { label: 'Новые клиенты', unit: 'шт', value: 38, target: 30, ranges: [20, 30, 45] },
          { label: 'Конверсия', unit: '%', value: 24.6, target: 28, ranges: [15, 25, 35], format: oneDecimal },
          { label: 'NPS', unit: 'баллы', value: 52, target: 60, ranges: [30, 50, 80] },
        ]}
      />
    </Card>
  );
}
