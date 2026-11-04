import { Card, CardHeader, CyclePlotChart } from '@/kvant';

const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const season = [72, 76, 90, 96, 104, 94, 82, 80, 96, 108, 128, 146];

export default function ChartTrendSeasonality() {
  return (
    <Card className="w-full">
      <CardHeader title="Сезонность выручки" description="2023–2026, млн ₽ · в месяце — четыре года слева направо" />
      <CyclePlotChart
        aria-label="Выручка по месяцам за 2023–2026 годы"
        periods={['2023', '2024', '2025', '2026']}
        formatValue={(value) => `${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₽`}
        data={months.map((label, i) => ({
          label,
          values: [0.66, 0.8, 0.92, 1.06].map((growth, year) => (year === 3 && i === 11 ? null : Math.round((season[i] ?? 0) * growth))),
        }))}
      />
    </Card>
  );
}
