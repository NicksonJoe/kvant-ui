import { Card, CardHeader, PercentBarChart } from '@/kvant';

const rub = (value: number) => `${value.toLocaleString('ru-RU')} тыс ₽`;

export default function ChartPartsPercentBars() {
  return (
    <Card className="w-full">
      <CardHeader title="Доля каналов по городам" description="Октябрь 2026 · строка = 100 % выручки города" />
      <PercentBarChart
        aria-label="Доля каналов в выручке по городам, октябрь 2026"
        formatValue={rub}
        labels={['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск']}
        series={[
          { name: 'Сайт', values: [3_640, 1_892, 1_064, 744, 520] },
          { name: 'Партнёры', values: [2_100, 1_462, 756, 984, 660] },
          { name: 'Прямые', values: [1_260, 946, 980, 672, 820] },
        ]}
      />
    </Card>
  );
}
