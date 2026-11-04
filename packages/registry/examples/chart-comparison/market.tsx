import { Card, CardHeader, ProportionalAreaChart } from '@/kvant';

export default function ChartComparisonMarket() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Размер рынка" description="Сервисы учёта для малого бизнеса, 2026 · площадь круга = объём" />
      <ProportionalAreaChart
        aria-label="Объём рынка сервисов учёта: TAM, SAM и SOM"
        formatValue={(value) => `${value.toLocaleString('ru-RU')} млрд ₽`}
        data={[
          { label: 'TAM', value: 48, description: 'весь рынок' },
          { label: 'SAM', value: 12, description: 'доступный нам' },
          { label: 'SOM', value: 1.8, description: 'реально взять за 3 года' },
        ]}
      />
    </Card>
  );
}
