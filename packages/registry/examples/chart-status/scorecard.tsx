import { Card, CardHeader, Scorecard } from '@/kvant';

export default function ChartStatusScorecard() {
  return (
    <Card className="w-full">
      <CardHeader title="Показатели месяца" description="Октябрь 2026 · факт против плана, тренд за полгода и статус" />
      <Scorecard
        aria-label="Показатели за октябрь 2026"
        trendLabels={['Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь']}
        rows={[
          { label: 'Выручка', unit: 'млн ₽', value: 5.1, target: 5, decimals: 1, trend: [4.2, 4.5, 4.3, 4.7, 4.9, 5.1], status: 'green' },
          { label: 'Новые клиенты', unit: 'шт', value: 38, target: 30, trend: [24, 27, 30, 31, 34, 38], status: 'green' },
          { label: 'Конверсия сайта', unit: '%', value: 2.6, target: 3, decimals: 1, trend: [3.1, 2.9, 3.1, 2.7, 2.7, 2.6], status: 'amber' },
          { label: 'Средний чек', unit: 'тыс ₽', value: 84, target: 90, trend: [88, 92, 86, 82, 86, 84], status: 'amber' },
          { label: 'Отток', unit: '% · чем ниже, тем лучше', value: 6.8, target: 5, decimals: 1, lowerIsBetter: true, trend: [5.4, 5.6, 5.9, 6.2, 6.5, 6.8], status: 'red' },
          { label: 'NPS', unit: 'баллы', value: 52, target: 60, trend: [64, 60, 56, 52, 52, 52], status: 'amber' },
        ]}
      />
    </Card>
  );
}
