import { Card, CardHeader, PlanFactChart } from '@/kvant';

const millions = (value: number) => value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function ChartDeviationPlanFact() {
  return (
    <Card className="w-full">
      <CardHeader title="Выручка по направлениям: план и факт" description="Октябрь 2026, млн ₽" />
      <PlanFactChart
        aria-label="Выручка по направлениям, план и факт, млн ₽"
        formatValue={millions}
        data={[
          { label: 'Опт', plan: 5, fact: 4.2 },
          { label: 'Розница', plan: 1.6, fact: 1.9 },
          { label: 'Сервис', plan: 0.8, fact: 0.9 },
          { label: 'Онлайн', plan: 3.6, fact: 3.1 },
          { label: 'Аренда', plan: 0.5, fact: 0.4 },
        ]}
      />
    </Card>
  );
}
