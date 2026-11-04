import { Card, CardHeader, StreamChart } from '@/kvant';

const labels = ['Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт'];
const months = ['Ноябрь 2025', 'Декабрь 2025', 'Январь 2026', 'Февраль 2026', 'Март 2026', 'Апрель 2026', 'Май 2026', 'Июнь 2026', 'Июль 2026', 'Август 2026', 'Сентябрь 2026', 'Октябрь 2026'];
const orders = (value: number) => `${value.toLocaleString('ru-RU')} заказов`;

export default function ChartTrendDemand() {
  return (
    <Card className="w-full">
      <CardHeader title="Спрос по категориям" description="Ноябрь 2025 — октябрь 2026 · толщина = заказы" />
      <StreamChart
        aria-label="Заказы по категориям товаров по месяцам"
        labels={labels}
        tooltipLabels={months}
        formatValue={orders}
        series={[
          { name: 'Корма', values: [310, 340, 352, 360, 372, 380, 376, 362, 350, 348, 362, 380] },
          { name: 'Химия', values: [260, 270, 286, 300, 312, 318, 300, 284, 276, 262, 248, 250] },
          { name: 'Уход', values: [300, 298, 292, 280, 262, 246, 230, 218, 212, 220, 244, 262] },
          { name: 'Игры', values: [240, 250, 262, 236, 210, 190, 180, 176, 174, 180, 208, 236] },
          { name: 'Одежда', values: [118, 112, 104, 110, 120, 134, 160, 178, 196, 210, 196, 204] },
        ]}
      />
    </Card>
  );
}
