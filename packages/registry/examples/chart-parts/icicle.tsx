import { Card, CardHeader, IcicleChart } from '@/kvant';

const rub = (value: number) => `${(value / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₽`;

export default function ChartPartsIcicle() {
  return (
    <Card className="w-full">
      <CardHeader title="Иерархия выручки" description="Октябрь 2026 · ширина = доля от итога, уровни сверху вниз" />
      <IcicleChart
        aria-label="Иерархия выручки: линейки и продукты, октябрь 2026"
        rootLabel="Выручка"
        formatValue={rub}
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
