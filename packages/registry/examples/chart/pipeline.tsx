import { Card, CardHeader, DonutChart } from '@/kvant';

export default function ChartPipeline() {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader title="Сделки по этапам" description="В работе на 29 октября" />
      <DonutChart
        aria-label="Сделки по этапам"
        totalLabel="сделок"
        data={[
          { label: 'Квалификация', value: 64 },
          { label: 'Бриф', value: 52 },
          { label: 'Переговоры', value: 71 },
          { label: 'Договор', value: 38 },
          { label: 'Счёт выставлен', value: 23 },
        ]}
      />
    </Card>
  );
}
