import { Card, CardHeader, HeatTable } from '@/kvant';

export default function ChartStatusPlan() {
  return (
    <Card className="w-full">
      <CardHeader title="Выполнение плана менеджерами" description="Май — октябрь 2026, % от плана месяца" />
      <HeatTable
        aria-label="Выполнение плана менеджерами, % от плана, май — октябрь 2026"
        rowHeader="Менеджер"
        columns={['Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт']}
        rows={[
          { label: 'Анна Северова', values: [107, 115, 118, 127, 114, 125] },
          { label: 'Михаил Орлов', values: [72, 98, 127, 109, 124, 77] },
          { label: 'Дарья Ким', values: [98, 85, 103, 104, 71, 83] },
          { label: 'Олег Панов', values: [87, 125, 116, 80, 118, 78] },
          { label: 'Ирина Лис', values: [107, 78, 70, 122, 83, 83] },
        ]}
        thresholds={[85, 95, 105, 115]}
        legend="Выполнение плана, %"
        summary="mean"
        formatSummary={(value) => `${Math.round(value)} %`}
      />
    </Card>
  );
}
