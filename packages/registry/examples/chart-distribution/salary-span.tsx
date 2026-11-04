import { Card, CardHeader, SpanChart } from '@/kvant';

export default function ChartDistributionSalarySpan() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Вилки зарплат по грейдам" description="2026, тыс ₽ в месяц · полоса — вилка, штрих — медиана рынка" />
      <SpanChart
        aria-label="Вилки зарплат по грейдам, тыс ₽ в месяц"
        unit="тыс"
        rangeLabel="Вилка"
        markLabel="Медиана"
        data={[
          { label: 'Стажёр', start: 60, end: 80, mark: 70 },
          { label: 'Младший', start: 85, end: 130, mark: 105 },
          { label: 'Средний', start: 140, end: 210, mark: 172 },
          { label: 'Старший', start: 220, end: 320, mark: 262 },
          { label: 'Ведущий', start: 300, end: 420, mark: 345 },
          { label: 'Руководитель', start: 380, end: 560, mark: 450 },
        ]}
      />
    </Card>
  );
}
