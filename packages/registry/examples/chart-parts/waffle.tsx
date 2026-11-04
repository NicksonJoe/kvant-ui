import { Card, CardHeader, WaffleChart } from '@/kvant';

const rub = (value: number) => `${(value / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млн ₽`;

export default function ChartPartsWaffle() {
  return (
    <Card className="w-full">
      <CardHeader title="Каналы: 100 клеток" description="Октябрь 2026 · одна клетка — 1 % выручки" />
      <WaffleChart
        aria-label="Выручка по каналам в клетках, октябрь 2026"
        formatValue={rub}
        data={[
          { label: 'Сайт', value: 8_464_000 },
          { label: 'Маркетплейсы', value: 5_704_000 },
          { label: 'Партнёры', value: 2_760_000 },
          { label: 'Офлайн', value: 1_472_000 },
        ]}
      />
    </Card>
  );
}
