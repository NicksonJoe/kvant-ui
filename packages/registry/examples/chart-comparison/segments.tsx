import { Card, CardHeader, IsotypeChart } from '@/kvant';

export default function ChartComparisonSegments() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Клиенты по сегментам" description="Октябрь 2026 · активные клиенты" />
      <IsotypeChart
        aria-label="Активные клиенты по сегментам бизнеса, октябрь 2026"
        name="Клиенты"
        unit={100}
        unitLabel="Один значок — 100 клиентов"
        data={[
          { label: 'Малый бизнес', value: 1240 },
          { label: 'Средний', value: 680 },
          { label: 'Крупный', value: 230 },
          { label: 'Госсектор', value: 90 },
        ]}
      />
    </Card>
  );
}
