import { Card, CardHeader, HeatTable } from '@/kvant';

export default function ChartStatusCohorts() {
  return (
    <Card className="w-full">
      <CardHeader title="Удержание по когортам" description="Покупатели 2026 · доля вернувшихся по месяцам после первой покупки" />
      <HeatTable
        aria-label="Удержание покупателей по когортам, 2026"
        rowHeader="Когорта"
        columns={['Месяц 0', 'Месяц 1', 'Месяц 2', 'Месяц 3', 'Месяц 4', 'Месяц 5']}
        rows={[
          { label: 'Май', caption: '1 240 чел', values: [100, 41, 32, 27, 24, 22] },
          { label: 'Июнь', caption: '1 380 чел', values: [100, 44, 34, 29, 26, null] },
          { label: 'Июль', caption: '1 510 чел', values: [100, 46, 36, 31, null, null] },
          { label: 'Август', caption: '1 460 чел', values: [100, 48, 38, null, null, null] },
          { label: 'Сентябрь', caption: '1 620 чел', values: [100, 51, null, null, null, null] },
          { label: 'Октябрь', caption: '1 700 чел', values: [100, null, null, null, null, null] },
        ]}
        thresholds={[27, 35, 45, 75]}
        formatValue={(value) => `${value} %`}
      />
    </Card>
  );
}
