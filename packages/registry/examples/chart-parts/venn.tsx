import { Card, CardHeader, VennChart } from '@/kvant';

export default function ChartPartsVenn() {
  return (
    <Card className="w-full">
      <CardHeader title="Пересечение продуктов" description="Клиенты на 31.10.2026 · число в каждой области — клиенты ровно этой комбинации" />
      <VennChart
        aria-label="Клиенты по сочетанию продуктов на 31 октября 2026"
        sets={[
          { label: 'Касса', legend: 'Купили кассу' },
          { label: 'Склад', legend: 'Купили склад' },
          { label: 'ЭДО', legend: 'Подключили ЭДО' },
        ]}
        regions={[
          { sets: ['Касса'], value: 1_840 },
          { sets: ['Склад'], value: 1_210 },
          { sets: ['ЭДО'], value: 960 },
          { sets: ['Касса', 'Склад'], value: 640 },
          { sets: ['Касса', 'ЭДО'], value: 310 },
          { sets: ['Склад', 'ЭДО'], value: 270 },
          { sets: ['Касса', 'Склад', 'ЭДО'], value: 180 },
        ]}
      />
    </Card>
  );
}
