import { Card, CardHeader, LollipopChart } from '@/kvant';

const percent = (value: number) => `${value} %`;

export default function ChartComparisonRepeatPurchases() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Повторные покупки по категориям" description="Октябрь 2026 · доля клиентов, купивших снова за 90 дней" />
      <LollipopChart
        aria-label="Доля повторных покупок по категориям за 90 дней"
        name="Повторные покупки"
        formatValue={percent}
        formatAxis={percent}
        data={[
          { label: 'Корма', value: 64 },
          { label: 'Бытовая химия', value: 58 },
          { label: 'Косметика', value: 51 },
          { label: 'Канцелярия', value: 44 },
          { label: 'Игрушки', value: 37 },
          { label: 'Электроника', value: 29 },
          { label: 'Одежда', value: 22 },
          { label: 'Мебель', value: 18 },
        ]}
      />
    </Card>
  );
}
