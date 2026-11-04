import { Card, CardHeader, CorrelationMatrixChart } from '@/kvant';

// 12 недель по отделу продаж
const variables = [
  { name: 'Звонки', values: [410, 452, 388, 475, 501, 430, 520, 548, 497, 563, 590, 612] },
  { name: 'Встречи', values: [42, 49, 33, 41, 49, 49, 51, 47, 44, 53, 60, 58] },
  { name: 'Сделки', values: [12, 14, 10, 11, 15, 15, 19, 14, 15, 14, 20, 18] },
  { name: 'Скидка, %', values: [6.2, 6.4, 7.2, 6.2, 7.1, 7.5, 7.5, 7.4, 5.5, 6.5, 5.8, 6.9] },
  { name: 'Отказы', values: [26, 24, 28, 20, 21, 22, 27, 17, 21, 12, 12, 13] },
];

export default function ChartCorrelationCorrelations() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Связь показателей продаж" description="Август — октябрь 2026, по неделям · корреляция Пирсона" />
      <CorrelationMatrixChart aria-label="Корреляции показателей отдела продаж" variables={variables} />
    </Card>
  );
}
