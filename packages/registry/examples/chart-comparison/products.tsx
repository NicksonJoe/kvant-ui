import { Card, CardHeader, HorizontalBarChart } from '@/kvant';

export default function ChartComparisonProducts() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Выручка по товарам" description="Октябрь 2026 · топ-8, по убыванию" />
      <HorizontalBarChart
        aria-label="Выручка по товарам за октябрь 2026"
        name="Выручка"
        formatValue={(value) => `${value} тыс ₽`}
        data={[
          { label: 'Склад Pro, лицензия', value: 412 },
          { label: 'Касса Онлайн', value: 356 },
          { label: 'Маркетплейс-коннектор', value: 298 },
          { label: 'Склад Lite', value: 241 },
          { label: 'Учёт ЭДО', value: 187 },
          { label: 'Курьерский модуль', value: 142 },
          { label: 'Аналитика', value: 96 },
          { label: 'Прочее', value: 64 },
        ]}
      />
    </Card>
  );
}
