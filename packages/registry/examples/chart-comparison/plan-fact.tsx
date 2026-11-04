import { Card, CardHeader, GroupedBarChart } from '@/kvant';

const millions = (value: number) => `${(value / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₽`;

export default function ChartComparisonPlanFact() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="План и факт по кварталам" description="2026 · выручка, млн ₽" />
      <GroupedBarChart
        aria-label="План и факт выручки по кварталам 2026 года"
        labels={['I кв', 'II кв', 'III кв', 'IV кв']}
        tooltipLabels={['I квартал', 'II квартал', 'III квартал', 'IV квартал, идёт']}
        notes={[undefined, undefined, undefined, 'идёт']}
        formatValue={millions}
        series={[
          { name: 'План', values: [28e6, 32e6, 34e6, 38e6] },
          { name: 'Факт', values: [26e6, 33e6, 37e6, 21e6] },
        ]}
      />
    </Card>
  );
}
