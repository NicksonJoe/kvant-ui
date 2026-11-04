import { Card, CardHeader, HexbinChart } from '@/kvant';

/** Seeded so the picture is the same on every render. */
function orders(): { x: number; y: number }[] {
  let seed = 11;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const gauss = () => Math.sqrt(-2 * Math.log(next() || 1e-9)) * Math.cos(2 * Math.PI * next());
  const clamp = (value: number, max: number) => Math.min(max, Math.max(0.1, value));
  return Array.from({ length: 6960 }, (_, i) => {
    const kind = i % 100;
    if (kind < 57) return { x: clamp(3.5 + gauss() * 1.9, 30), y: clamp(3400 + gauss() * 1000, 20_000) };
    if (kind < 93) {
      const minutes = 11 + next() * 13;
      return { x: clamp(minutes + gauss() * 1.2, 30), y: clamp(4500 + minutes * 420 + gauss() * 1500, 20_000) };
    }
    return { x: next() * 30, y: 1000 + next() * 18_000 };
  });
}

const visits = orders();
const rub = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₽`;
const minutes = (value: number) => `${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} мин`;

export default function ChartCorrelationSiteTime() {
  return (
    <Card className="w-full">
      <CardHeader title="Чек и время на сайте" description="Октябрь 2026 · 6 960 заказов · цвет ячейки — сколько заказов в неё попало" />
      <HexbinChart
        aria-label="Чек и время на сайте, 6 960 заказов"
        points={visits}
        xName="Время"
        yName="Чек"
        countName="Заказов"
        formatX={minutes}
        formatY={rub}
        xUnit="мин на сайте"
        annotations={[
          { x: 3.5, y: 6000, labelX: 4.5, labelY: 13_200, title: 'Быстрая покупка', note: 'визит до 8 мин, чек 2–5 тыс · 57 % заказов' },
          { x: 21, y: 12_500, labelX: 22, labelY: 5000, title: 'Обдуманный выбор', note: 'чек растёт с длиной визита · 36 % заказов' },
        ]}
      />
    </Card>
  );
}
