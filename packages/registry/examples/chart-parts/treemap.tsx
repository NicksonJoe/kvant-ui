import { Card, CardHeader, TreemapChart } from '@/kvant';

const rub = (value: number) => `${value.toLocaleString('ru-RU')} тыс ₽`;

export default function ChartPartsTreemap() {
  return (
    <Card className="w-full">
      <CardHeader title="Структура выручки" description="Октябрь 2026 · площадь = доля, цвет = линейка" />
      <TreemapChart
        aria-label="Структура выручки по продуктам, октябрь 2026"
        formatValue={rub}
        data={[
          { label: 'Склад Pro', value: 4_048, group: 'Склад' },
          { label: 'Касса Онлайн', value: 3_496, group: 'Касса' },
          { label: 'Маркетплейс', value: 2_944, group: 'Склад' },
          { label: 'Склад Lite', value: 2_392, group: 'Склад' },
          { label: 'Учёт ЭДО', value: 1_840, group: 'Сервисы' },
          { label: 'Курьеры', value: 1_288, group: 'Сервисы' },
          { label: 'Касса Мини', value: 1_104, group: 'Касса' },
          { label: 'Аналитика', value: 920, group: 'Сервисы' },
          { label: 'Обучение', value: 368, group: 'Сервисы' },
        ]}
      />
    </Card>
  );
}
