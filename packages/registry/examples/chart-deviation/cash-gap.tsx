import { Card, CardHeader, SurplusDeficitChart } from '@/kvant';

const income = [5.4, 5.7, 6.3, 6.4, 6.6, 7, 7.4, 7.3, 7.1, 6.5, 6.5, 6, 5.5, 5.2, 4.9, 5.2, 4.9, 4.7, 4.6, 4.2, 4.4, 4.8, 5.2, 5.6, 6, 5.8];
const payments = [6.6, 6.7, 6.5, 6.2, 6.2, 5.7, 5.9, 5.6, 5.2, 4.9, 5.2, 5, 5.3, 5.5, 5.5, 5.8, 6.2, 6.4, 6.5, 6.7, 7.1, 6.7, 6.6, 6.7, 6.3, 6.2];
const labels = income.map((_, i) => (i === 0 ? 'нед. 1' : String(i + 1)));
const titles = income.map((_, i) => `${i + 1}-я неделя`);

export default function ChartDeviationCashGap() {
  return (
    <Card className="w-full">
      <CardHeader title="Поступления и платежи" description="Апрель — сентябрь 2026, млн ₽ в неделю · заливка — разрыв между линиями" />
      <SurplusDeficitChart
        aria-label="Поступления и платежи по неделям, апрель — сентябрь 2026"
        labels={labels}
        tooltipLabels={titles}
        unit="млн"
        period="за полгода"
        series={{ name: 'Поступления', values: income }}
        reference={{ name: 'Платежи', values: payments }}
      />
    </Card>
  );
}
