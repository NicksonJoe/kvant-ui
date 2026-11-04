import { Card, CardHeader, VoronoiTreemapChart } from '@/kvant';

const rub = (value: number) => `${value.toLocaleString('ru-RU')} тыс ₽`;

export default function ChartPartsVoronoi() {
  return (
    <Card className="w-full">
      <CardHeader title="Продукты в форме круга" description="Октябрь 2026 · Voronoi treemap: площадь ячейки = доля выручки" />
      <VoronoiTreemapChart
        aria-label="Доли продуктов в выручке, октябрь 2026"
        formatValue={rub}
        data={[
          { label: 'Склад Pro', value: 3_864, group: 'Склад' },
          { label: 'Касса Онлайн', value: 3_312, group: 'Касса' },
          { label: 'Маркетплейс', value: 2_760, group: 'Склад' },
          { label: 'Склад Lite', value: 2_208, group: 'Склад' },
          { label: 'Учёт ЭДО', value: 1_656, group: 'Сервисы' },
          { label: 'Курьеры', value: 1_288, group: 'Сервисы' },
          { label: 'Касса Мини', value: 1_104, group: 'Касса' },
          { label: 'Склад Старт', value: 920, group: 'Склад' },
          { label: 'Аналитика', value: 552, group: 'Сервисы' },
          { label: 'Касса Офлайн', value: 552, group: 'Касса' },
          { label: 'Обучение', value: 368, group: 'Сервисы' },
        ]}
      />
    </Card>
  );
}
