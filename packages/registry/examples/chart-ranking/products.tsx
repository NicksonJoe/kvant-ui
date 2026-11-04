import { BumpChart, Card, CardHeader } from '@/kvant';

const months = ['Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт'];
const titles = ['Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь'].map((month) => `${month} 2026`);

export default function ChartRankingProducts() {
  return (
    <Card className="w-full">
      <CardHeader title="Места продуктов по выручке" description="Март — октябрь 2026 · 1 — самый продаваемый за месяц" />
      <BumpChart
        aria-label="Места продуктов по выручке, март — октябрь 2026"
        labels={months}
        tooltipLabels={titles}
        highlight={['Касса Онлайн', 'Склад Lite']}
        series={[
          { name: 'Склад Pro', ranks: [1, 1, 1, 1, 2, 2, 2, 2] },
          { name: 'Маркетплейс', ranks: [2, 2, 3, 2, 1, 1, 3, 3] },
          { name: 'Склад Lite', ranks: [3, 3, 2, 4, 4, 5, 5, 6] },
          { name: 'Учёт ЭДО', ranks: [4, 5, 5, 5, 6, 6, 6, 5] },
          { name: 'Касса Онлайн', ranks: [5, 4, 4, 3, 3, 2, 1, 1] },
          { name: 'Курьеры', ranks: [6, 6, 6, 6, 5, 4, 4, 4] },
        ]}
      />
    </Card>
  );
}
