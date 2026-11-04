import { Card, CardHeader, ClevelandDotChart } from '@/kvant';

const thousands = (value: number) => (value / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
const delta = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${thousands(Math.abs(value))}`;

export default function ChartComparisonAverageCheck() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader title="Средний чек: 2025 и 2026" description="Октябрь, тыс ₽ · точечный график Кливленда" />
      <ClevelandDotChart
        aria-label="Средний чек по городам, октябрь 2025 и 2026"
        labels={['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Екатеринбург', 'Самара', 'Краснодар']}
        formatValue={(value) => `${thousands(value)} тыс ₽`}
        formatDelta={delta}
        series={[
          { name: '2025', values: [4800, 4100, 3200, 2900, 3400, 2600, 3000] },
          { name: '2026', values: [5600, 4600, 3900, 3500, 3300, 3100, 2700] },
        ]}
      />
    </Card>
  );
}
