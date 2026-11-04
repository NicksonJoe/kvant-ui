import { CalendarHeatmapChart, Card, CardHeader } from '@/kvant';

// Orders per day, 1 November 2025 — 31 October 2026: busier on weekdays and before the holidays, a few days without orders
const start = Date.UTC(2025, 10, 1);
const data = Array.from({ length: 365 }, (_, i) => {
  const date = new Date(start + i * 864e5);
  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
  const wave = 45 + 35 * Math.sin(i / 29) + ((i * 7919) % 41);
  const value = (i * 31) % 47 === 0 ? 0 : Math.max(1, Math.round(weekend ? wave * 0.25 : wave));
  return { date: date.toISOString().slice(0, 10), value };
});

export default function ChartTrendCalendar() {
  return (
    <Card className="w-full">
      <CardHeader title="Заказы по дням" description="Ноябрь 2025 — октябрь 2026 · один квадрат — один день" />
      <CalendarHeatmapChart aria-label="Заказы по дням за год" name="Заказы" legendTitle="Заказов в день" data={data} />
    </Card>
  );
}
