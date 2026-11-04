import { Card, CardHeader, ForecastChart } from '@/kvant';

const labels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар'];
const titles = labels.map((month, i) => `${month} ${i < 12 ? 2026 : 2027}`);
const fact = [2.4, 2.8, 3.3, 3.5, 3.9, 4.1, 3.8, 4.4, 4.7, 5.2].map((value) => ({ value }));
const forecast = [
  { value: 5.4, inner: [5.0, 5.8], outer: [4.7, 6.2] },
  { value: 5.7, inner: [5.1, 6.2], outer: [4.6, 6.7] },
  { value: 5.5, inner: [4.8, 6.2], outer: [4.3, 6.9] },
  { value: 5.9, inner: [5.0, 6.8], outer: [4.4, 7.4] },
  { value: 6.2, inner: [5.2, 7.2], outer: [4.3, 8.1] },
] as const;
const million = (value: number) => value.toLocaleString('ru-RU', { maximumFractionDigits: 1 });

export default function ChartTrendForecast() {
  return (
    <Card className="w-full">
      <CardHeader title="Прогноз выручки" description="2026 — март 2027, млн ₽ · коридор 50 и 80 %" />
      <ForecastChart
        aria-label="Выручка за 2026 год и прогноз до марта 2027"
        labels={labels}
        tooltipLabels={titles}
        data={[...fact, ...forecast]}
        today={9}
        endLabel="6,2 в марте"
        formatValue={million}
        formatTick={(value) => (value === 0 ? '0' : `${million(value)} млн`)}
      />
    </Card>
  );
}
