import { BarChart, Card, CardHeader } from '@/kvant';

export default function ChartDeals() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Новые и закрытые сделки" description="Май — октябрь 2026, по месяцам" />
      <BarChart
        aria-label="Новые и закрытые сделки по месяцам"
        labels={['Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь']}
        series={[
          { name: 'Новые', values: [28, 31, 26, 34, 35, 38] },
          { name: 'Закрытые', values: [19, 22, 24, 21, 27, 30] },
        ]}
      />
    </Card>
  );
}
