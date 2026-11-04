import { Card, CardHeader, SunburstChart } from '@/kvant';

const rub = (value: number) => `${value.toLocaleString('ru-RU')} тыс ₽`;

export default function ChartPartsSunburst() {
  return (
    <Card className="w-full">
      <CardHeader title="Структура выручки по линейкам" description="Октябрь 2026 · внутреннее кольцо — линейка, внешнее — продукт" />
      <SunburstChart
        aria-label="Выручка по линейкам и продуктам, октябрь 2026"
        formatValue={rub}
        formatTotal={(total) => (total / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}
        totalLabel="млн ₽"
        data={[
          {
            label: 'Склад',
            children: [
              { label: 'Pro', value: 4_048 },
              { label: 'Маркетплейс', value: 2_944 },
              { label: 'Lite', value: 2_392 },
            ],
          },
          {
            label: 'Касса',
            children: [
              { label: 'Онлайн', value: 3_496 },
              { label: 'Мини', value: 1_104 },
            ],
          },
          {
            label: 'Сервисы',
            children: [
              { label: 'ЭДО', value: 1_840 },
              { label: 'Курьеры', value: 1_288 },
              { label: 'Аналитика', value: 1_288 },
            ],
          },
        ]}
      />
    </Card>
  );
}
