import { Card, CardHeader, PopulationPyramidChart } from '@/kvant';

export default function ChartDistributionClientsPyramid() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Клиенты по возрасту и полу" description="База на 31.10.2026 · доля от всех клиентов" />
      <PopulationPyramidChart
        aria-label="Клиенты по возрасту и полу, доля от всех клиентов"
        series={['Мужчины', 'Женщины']}
        rowHeader="Возраст"
        unit="%"
        formatValue={(value) => value.toLocaleString('ru-RU', { minimumFractionDigits: 1 })}
        rows={[
          { label: '65+', left: 1.6, right: 2.3 },
          { label: '55–64', left: 4, right: 4.6 },
          { label: '45–54', left: 7.4, right: 8.3 },
          { label: '35–44', left: 12.1, right: 13.6 },
          { label: '25–34', left: 14.8, right: 17.2 },
          { label: '18–24', left: 6.2, right: 7.9 },
        ]}
      />
    </Card>
  );
}
