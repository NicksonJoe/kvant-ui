import { Card, CardHeader, QuadrantChart } from '@/kvant';

const percent = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('ru-RU')} %`;
const share = (value: number) => `${value.toLocaleString('ru-RU')} %`;

export default function ChartCorrelationGrowthMargin() {
  return (
    <Card className="w-full">
      <CardHeader title="Рост и маржа продуктов" description="Октябрь 2026 · X — рост выручки к прошлому году, Y — маржа" />
      <QuadrantChart
        aria-label="Рост выручки и маржа по продуктам"
        xName="Рост"
        yName="Маржа"
        formatX={percent}
        formatXTick={percent}
        formatY={share}
        formatYTick={share}
        xSplit={10}
        ySplit={25}
        focus="topRight"
        quadrants={{ topLeft: 'Удержать маржу', topRight: 'Звёзды', bottomLeft: 'Пересмотреть', bottomRight: 'Растут в убыток' }}
        points={[
          { label: 'Склад Pro', x: 24, y: 38 },
          { label: 'Касса Онлайн', x: 31, y: 22, labelSide: 'left' },
          { label: 'Маркетплейс', x: 8, y: 41, labelSide: 'left' },
          { label: 'Аналитика', x: 1, y: 33, labelSide: 'left' },
          { label: 'Склад Lite', x: -4, y: 29 },
          { label: 'Учёт ЭДО', x: 12, y: 14 },
          { label: 'Курьеры', x: -15, y: 12 },
          { label: 'Касса Мини', x: 18, y: 9 },
        ]}
      />
    </Card>
  );
}
