import { Card, CardHeader, ComboChart } from '@/kvant';

const labels = ['Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт'];
const months = ['Ноябрь 2025', 'Декабрь 2025', 'Январь 2026', 'Февраль 2026', 'Март 2026', 'Апрель 2026', 'Май 2026', 'Июнь 2026', 'Июль 2026', 'Август 2026', 'Сентябрь 2026', 'Октябрь 2026'];
const revenue = [3.1, 3.6, 2.4, 2.8, 3.3, 3.5, 3.9, 4.1, 3.8, 4.4, 4.7, 5.2].map((value) => value * 1e6);
// rolling mean of three months; the first two have no full window yet
const average = revenue.map((_, i) => (i < 2 ? null : Math.round(((revenue[i - 2] ?? 0) + (revenue[i - 1] ?? 0) + (revenue[i] ?? 0)) / 3)));

export default function ChartTrendCombo() {
  return (
    <Card className="w-full">
      <CardHeader title="Выручка и тренд" description="Млн ₽ · столбцы — месяц, линия — среднее за 3 месяца" />
      <ComboChart
        aria-label="Выручка по месяцам и среднее за три месяца"
        labels={labels}
        tooltipLabels={months}
        bars={{ name: 'Месяц', values: revenue }}
        line={{ name: 'Среднее, 3 мес', values: average }}
        formatValue={(value) => `${value.toLocaleString('ru-RU')} ₽`}
        formatLabel={(value) => (value / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}
      />
    </Card>
  );
}
