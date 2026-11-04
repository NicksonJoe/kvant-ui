import { Card, CardHeader, ParliamentChart } from '@/kvant';

export default function ChartPartsParliament() {
  return (
    <Card className="w-full">
      <CardHeader title="Команда по отделам" description="Октябрь 2026 · одна точка — один человек" />
      <ParliamentChart
        aria-label="Сотрудники по отделам, октябрь 2026"
        totalLabel="сотрудников"
        data={[
          { label: 'Продажи', value: 38 },
          { label: 'Разработка', value: 34 },
          { label: 'Поддержка', value: 22 },
          { label: 'Маркетинг', value: 14 },
          { label: 'Офис', value: 12, other: true },
        ]}
      />
    </Card>
  );
}
