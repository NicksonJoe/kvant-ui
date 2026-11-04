import { Card, CardHeader, LikertChart } from '@/kvant';

export default function ChartDeviationNps() {
  return (
    <Card className="w-full">
      <CardHeader title="NPS по каналам продаж" description="III квартал 2026 · оценки 0–6, 7–8 и 9–10" />
      <LikertChart
        aria-label="NPS по каналам продаж, III квартал 2026"
        total="net"
        totalLabel="NPS"
        categories={['Критики', 'Нейтральные', 'Промоутеры']}
        data={[
          { label: 'Интернет-магазин', values: [86, 142, 312] },
          { label: 'Розница', values: [64, 158, 221] },
          { label: 'Опт', values: [41, 77, 96] },
          { label: 'Маркетплейсы', values: [128, 190, 204] },
        ]}
      />
    </Card>
  );
}
