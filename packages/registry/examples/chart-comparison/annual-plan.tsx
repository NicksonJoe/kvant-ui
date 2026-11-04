import { Card, CardHeader, RadialBarChart } from '@/kvant';

export default function ChartComparisonAnnualPlan() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Выполнение годового плана" description="2026 по 31 октября · доля от плана года" />
      <RadialBarChart
        aria-label="Выполнение годового плана по городам на 31 октября"
        name="Выполнено"
        formatValue={(value) => `${value} %`}
        data={[
          { label: 'Москва', value: 86 },
          { label: 'Санкт-Петербург', value: 74 },
          { label: 'Казань', value: 68 },
          { label: 'Екатеринбург', value: 61 },
          { label: 'Новосибирск', value: 52 },
        ]}
      />
    </Card>
  );
}
