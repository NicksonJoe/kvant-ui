import { Card, CardHeader, DivergingBarChart } from '@/kvant';

export default function ChartDeviationRevenueGrowth() {
  return (
    <Card className="w-full">
      <CardHeader title="Выручка к прошлому году" description="Октябрь 2026 к октябрю 2025, по городам" />
      <DivergingBarChart
        aria-label="Изменение выручки к прошлому году по городам"
        formatValue={(value) => `${value} %`}
        data={[
          { label: 'Казань', value: 32 },
          { label: 'Новосибирск', value: 21 },
          { label: 'Екатеринбург', value: 14 },
          { label: 'Москва', value: 8 },
          { label: 'Санкт-Петербург', value: 3 },
          { label: 'Самара', value: -6 },
          { label: 'Краснодар', value: -11 },
          { label: 'Пермь', value: -18 },
        ]}
      />
    </Card>
  );
}
