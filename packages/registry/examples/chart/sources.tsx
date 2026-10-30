import { Card, CardHeader, LineChart } from '@/kvant';

const weeks = ['10 авг', '17 авг', '24 авг', '31 авг', '7 сен', '14 сен', '21 сен', '28 сен', '5 окт', '12 окт', '19 окт', '26 окт'];

export default function ChartSources() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Заявки по источникам" description="12 недель, по неделям" />
      <LineChart
        aria-label="Заявки по источникам за 12 недель"
        labels={weeks}
        tooltipLabels={weeks.map((week) => `Неделя с ${week}`)}
        series={[
          { name: 'Сайт', values: [18, 21, 19, 24, 22, 26, 25, 28, 27, 31, 29, 33] },
          { name: 'Рекомендации', values: [9, 11, 10, 12, 14, 13, 15, 16, 15, 18, 19, 21] },
          { name: 'Реклама', values: [14, 12, 15, 11, 13, 10, 12, 9, 11, 10, 8, 9] },
        ]}
      />
    </Card>
  );
}
