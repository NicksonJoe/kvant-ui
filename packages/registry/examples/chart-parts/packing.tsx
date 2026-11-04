import { Card, CardHeader, CirclePackingChart } from '@/kvant';

export default function ChartPartsPacking() {
  return (
    <Card className="w-full">
      <CardHeader title="Продукты кругами" description="Октябрь 2026, тыс ₽ · площадь круга = выручка, плотная упаковка" />
      <CirclePackingChart
        aria-label="Выручка по продуктам кругами, октябрь 2026, тыс ₽"
        formatValue={(value) => `${value} тыс`}
        data={[
          { label: 'Склад Pro', value: 412, group: 'Склад' },
          { label: 'Касса Онлайн', value: 356, group: 'Касса' },
          { label: 'Маркетплейс', value: 298, group: 'Склад' },
          { label: 'Склад Lite', value: 241, group: 'Склад' },
          { label: 'Учёт ЭДО', value: 187, group: 'Сервисы' },
          { label: 'Курьеры', value: 142, group: 'Сервисы' },
          { label: 'Касса Мини', value: 118, group: 'Касса' },
          { label: 'Аналитика', value: 96, group: 'Сервисы' },
          { label: 'Склад Старт', value: 64, group: 'Склад' },
          { label: 'Касса Офлайн', value: 52, group: 'Касса' },
          { label: 'Обучение', value: 38, group: 'Сервисы' },
        ]}
      />
    </Card>
  );
}
