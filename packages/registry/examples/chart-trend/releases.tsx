import { Card, CardHeader, EventMarkerChart } from '@/kvant';

// Daily active users, 1 May — 31 October 2026
const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const days = Array.from({ length: 184 }, (_, i) => new Date(2026, 4, 1 + i));
const indexOf = (month: number, day: number) => days.findIndex((date) => date.getMonth() === month && date.getDate() === day);
const labels = days.map((date) => (date.getDate() === 1 ? (MONTHS[date.getMonth()] ?? '') : ''));
const titles = days.map((date) => date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' }));
const checkout = indexOf(6, 1);
const outage = indexOf(7, 11);
const app = indexOf(8, 15);
const values = days.map((_, i) => {
  const base = 12_600 + i * 28 + (i >= checkout ? 1_100 : 0) + (i >= app ? 1_400 : 0) + 260 * Math.sin(i / 3);
  return Math.round(i >= outage && i < outage + 3 ? base * 0.72 : base);
});

export default function ChartTrendReleases() {
  return (
    <Card className="w-full">
      <CardHeader title="Активные пользователи и релизы" description="Май — октябрь 2026 · DAU · вертикали — релизы, ромб — инцидент" />
      <EventMarkerChart
        aria-label="Активные пользователи по дням с релизами и инцидентом"
        labels={labels}
        tooltipLabels={titles}
        series={{ name: 'DAU', values }}
        events={[
          { index: checkout, code: 'v2.4', label: 'Новый checkout' },
          { index: outage, kind: 'incident', label: 'Сбой оплаты 11.08, 3 дня' },
          { index: app, code: 'v2.6', label: 'Мобильное приложение' },
          { index: indexOf(9, 7), code: 'v2.7', label: 'Подписки' },
        ]}
      />
    </Card>
  );
}
