import { Card, CardHeader, ErrorBarChart } from '@/kvant';

export default function ChartDistributionAbErrorBars() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="A/B-тесты: прирост конверсии" description="Q3 2026 · оценка и 95 % доверительный интервал, п. п." />
      <ErrorBarChart
        aria-label="Прирост конверсии в A/B-тестах с 95 % доверительным интервалом"
        unit="п. п."
        data={[
          { label: 'Новый онбординг', value: 2.4, low: 0.9, high: 3.9 },
          { label: 'Короче форма', value: 1.1, low: -0.4, high: 2.6 },
          { label: 'Скидка 10 %', value: 3.2, low: 1.5, high: 4.9 },
          { label: 'Чат-бот', value: -0.6, low: -2.3, high: 1.1 },
          { label: 'Пробный месяц', value: 0.4, low: -0.7, high: 1.5 },
        ]}
      />
    </Card>
  );
}
