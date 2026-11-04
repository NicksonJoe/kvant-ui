import { Card, CardHeader, ScatterChart } from '@/kvant';

const goods: readonly (readonly [number, number])[] = [
  [320, 921], [330, 862], [390, 665], [420, 707], [470, 855], [580, 738], [650, 848], [1330, 641], [1680, 443], [2020, 549], [2170, 491],
  [2250, 508], [2290, 388], [2960, 401], [3050, 395], [3160, 340], [3300, 311], [3510, 273], [3570, 272], [3730, 240], [3780, 276], [4760, 178],
  [5280, 183], [5420, 169], [5470, 160], [6170, 108], [6220, 134], [6860, 117], [6990, 81], [7330, 99], [7420, 94], [7570, 70], [7850, 85],
  [7870, 63], [7870, 82], [8080, 67], [8790, 50], [8860, 45], [9130, 56], [9260, 49], [9560, 35], [9630, 47],
];
const rub = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;
const pcs = (value: number) => `${value.toLocaleString('ru-RU')} шт`;

export default function ChartCorrelationPriceSales() {
  return (
    <Card className="w-full">
      <CardHeader title="Цена и продажи" description="44 товара · X — цена, ₽ · Y — продано, шт" />
      <ScatterChart
        aria-label="Цена и продажи 44 товаров"
        xName="Цена"
        yName="Продано"
        formatX={rub}
        formatY={pcs}
        formatYTick={String}
        trend="exponential"
        series={[
          { name: 'Товар', points: goods.map(([x, y]) => ({ x, y })) },
          {
            name: 'Вне тренда',
            trend: false,
            points: [
              { x: 7900, y: 640, label: 'Склад Pro: дорого и много', callout: true },
              { x: 1000, y: 30, label: 'Касса Мини: дёшево и мало', callout: true },
            ],
          },
        ]}
      />
    </Card>
  );
}
