import { Card, CardHeader, TimeColumnChart } from '@/kvant';

const labels = ['Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт'];
const months = ['Ноябрь 2025', 'Декабрь 2025', 'Январь 2026', 'Февраль 2026', 'Март 2026', 'Апрель 2026', 'Май 2026', 'Июнь 2026', 'Июль 2026', 'Август 2026', 'Сентябрь 2026', 'Октябрь 2026'];
const revenue = [3.1, 3.6, 2.4, 2.8, 3.3, 3.5, 3.9, 4.1, 3.8, 4.4, 4.7, 5.2].map((value) => value * 1e6);

export default function ChartTrendMonthly() {
  return (
    <Card className="w-full">
      <CardHeader title="Выручка по месяцам" description="Ноябрь 2025 — октябрь 2026, млн ₽" />
      <TimeColumnChart
        aria-label="Выручка по месяцам, ноябрь 2025 — октябрь 2026"
        name="Выручка"
        labels={labels}
        tooltipLabels={months}
        values={revenue}
        formatValue={(value) => `${value.toLocaleString('ru-RU')} ₽`}
        formatLabel={(value) => (value / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}
      />
    </Card>
  );
}
