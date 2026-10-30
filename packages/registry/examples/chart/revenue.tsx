import { useState } from 'react';
import { AreaChart, Card, CardHeader, SegmentedControl } from '@/kvant';

const revenue = [
  37_800, 46_200, 21_400, 18_900, 33_600, 40_100, 41_300, 52_700, 25_800, 18_400, 43_900, 40_600, 48_200, 47_500, 52_400, 31_700, 19_800, 54_100,
  38_200, 36_900, 47_300, 22_600, 30_400, 49_800, 52_900, 60_300, 55_700, 49_200, 64_600, 58_100, 32_400,
];
const days = revenue.map((_, index) => new Date(2026, 9, index + 1));
const labels = days.map((day) => `${day.getDate()} окт`);
const titles = days.map((day) => `${day.getDate()} октября, ${day.toLocaleDateString('ru-RU', { weekday: 'long' })}`);
const rub = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

export default function ChartRevenue() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  return (
    <Card className="w-full">
      <CardHeader
        title="Выручка по дням"
        description="Октябрь 2026 · 1 284 900 ₽ за месяц"
        action={
          <SegmentedControl
            aria-label="Период"
            value={period}
            onValueChange={setPeriod}
            options={[
              { value: 'week', label: 'Неделя' },
              { value: 'month', label: 'Месяц' },
              { value: 'quarter', label: 'Квартал' },
            ]}
          />
        }
      />
      <AreaChart aria-label="Выручка по дням, октябрь 2026" labels={labels} tooltipLabels={titles} series={[{ name: 'Выручка', values: revenue }]} formatValue={rub} />
    </Card>
  );
}
