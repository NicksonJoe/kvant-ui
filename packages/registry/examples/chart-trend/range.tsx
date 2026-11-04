import { Card, CardHeader, RangeAreaChart } from '@/kvant';

// 26 weeks from 4 May 2026: min, max and mean of orders per day within the week
const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const weeks = Array.from({ length: 26 }, (_, i) => new Date(2026, 4, 4 + i * 7));
const labels = weeks.map((day, i) => (i === 0 || day.getMonth() !== weeks[i - 1]?.getMonth() ? (MONTHS[day.getMonth()] ?? '') : ''));
const titles = weeks.map((day) => `Неделя с ${day.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`);
const data = weeks.map((_, i) => {
  const value = Math.round(180 + 55 * Math.sin((i + 2) / 4) + i * 1.2);
  const spread = 38 + ((i * 37) % 23);
  return { low: value - spread - ((i * 11) % 17), high: value + spread, value };
});

export default function ChartTrendRange() {
  return (
    <Card className="w-full">
      <CardHeader title="Заказы в день: разброс по неделям" description="Май — октябрь 2026 · от минимума до максимума недели" />
      <RangeAreaChart aria-label="Заказы в день по неделям: минимум, максимум и среднее" labels={labels} tooltipLabels={titles} data={data} />
    </Card>
  );
}
