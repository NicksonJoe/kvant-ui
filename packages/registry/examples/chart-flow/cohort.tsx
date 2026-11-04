import { Card, CardHeader, CohortChart } from '@/kvant';

export const retention = [
  { label: 'Май', values: [1_240, 508, 397, 335, 298, 273] },
  { label: 'Июнь', values: [1_380, 607, 469, 400, 359] },
  { label: 'Июль', values: [1_510, 695, 544, 468] },
  { label: 'Август', values: [1_460, 701, 555] },
  { label: 'Сентябрь', values: [1_620, 826] },
  { label: 'Октябрь', values: [1_700] },
];

export default function ChartFlowCohort() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Удержание по когортам" description="Покупатели 2026 · доля вернувшихся по месяцам после первой покупки" />
      <CohortChart aria-label="Удержание покупателей по когортам, 2026" data={retention} />
    </Card>
  );
}
