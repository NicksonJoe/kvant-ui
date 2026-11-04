import { Card, CardHeader, StackedBarChart } from '@/kvant';

const millions = (value: number) => (value / 1e6).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ChartComparisonChannels() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Выручка по каналам" description="Май — октябрь 2026, млн ₽ · итог над столбцом" />
      <StackedBarChart
        aria-label="Выручка по каналам продаж, май — октябрь 2026"
        labels={['Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт']}
        tooltipLabels={['Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь']}
        formatValue={(value) => `${millions(value)} млн ₽`}
        formatTotal={millions}
        series={[
          { name: 'Сайт', values: [420_000, 460_000, 510_000, 540_000, 590_000, 640_000] },
          { name: 'Партнёры', values: [260_000, 240_000, 300_000, 330_000, 310_000, 380_000] },
          { name: 'Прямые', values: [180_000, 210_000, 190_000, 230_000, 260_000, 260_000] },
        ]}
      />
    </Card>
  );
}
