import { BubbleChart, CorrelationMatrixChart, HeatMatrixChart, HexbinChart, QuadrantChart, ScatterChart } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const kinds = ['scatter', 'trend', 'bubble', 'heat', 'correlation', 'hexbin', 'quadrant'] as const;
const trends = ['linear', 'exponential'] as const;

const deals = [
  { label: 'Анна', x: 198, y: 20 },
  { label: 'Олег', x: 127, y: 12 },
  { label: 'Ирина', x: 301, y: 32 },
  { label: 'Мария', x: 309, y: 32 },
  { label: 'Светлана', x: 237, y: 24 },
  { label: 'Игорь', x: 123, y: 9 },
  { label: 'Ольга', x: 260, y: 36 },
  { label: 'Сергей', x: 96, y: 3 },
  { label: 'Юлия', x: 278, y: 28 },
];
const segments = [
  { name: 'Малый бизнес', points: [{ label: 'Розница', x: 860, y: 13_600, size: 11_700_000 }, { label: 'Салоны', x: 230, y: 16_100, size: 3_700_000 }] },
  { name: 'Средний', points: [{ label: 'Аптеки', x: 150, y: 66_000, size: 9_900_000 }, { label: 'Склады', x: 95, y: 99_000, size: 9_400_000 }] },
  { name: 'Крупный', points: [{ label: 'Сети', x: 40, y: 210_000, size: 8_400_000 }, { label: 'Логистика', x: 14, y: 230_000, size: 3_200_000 }] },
];
const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
const hours = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
const orders = [
  [18, 35, 71, 83, 68, 38],
  [21, 39, 61, 69, 57, 39],
  [23, 50, 76, 80, 80, 48],
  [24, 44, 74, 87, 81, 44],
  [19, 38, 69, 71, 72, 37],
];
const visits = Array.from({ length: 900 }, (_, i) => ({ x: (i * 7.3) % 30, y: 2000 + ((i * 7.3) % 30) * 380 + ((i * 2654435761) % 4000) }));

const playground: Playground = {
  controls: [
    { name: 'kind', type: 'enum', options: kinds, default: 'scatter', description: 'Тип: точки, точки с трендом, пузырьки, тепловая матрица, корреляции, hexbin, квадрант.' },
  ],
  render: (p) => {
    const kind = p.pick('kind', kinds);
    if (kind === 'scatter' || kind === 'trend') {
      return (
        <ScatterChart
          aria-label="Звонки и закрытые сделки"
          className="w-full"
          xName="Звонков"
          yName="Сделок"
          trend={kind === 'trend' ? p.pick('trend', trends) : undefined}
          band={kind === 'trend' && p.bool('band')}
          series={[{ name: 'Менеджер', points: deals }]}
        />
      );
    }
    if (kind === 'bubble') return <BubbleChart aria-label="Сегменты клиентов" className="w-full" xScale="log" yScale="log" sizeName="Выручка" series={segments} />;
    if (kind === 'heat') return <HeatMatrixChart aria-label="Заказы по дням и часам" className="w-full" rows={days} columns={hours} values={orders} legendTitle="Заказов в час" />;
    if (kind === 'correlation') {
      return (
        <CorrelationMatrixChart
          aria-label="Связь показателей продаж"
          className="w-full"
          variables={[
            { name: 'Звонки', values: [410, 452, 388, 475, 501, 430] },
            { name: 'Сделки', values: [12, 14, 11, 13, 16, 13] },
            { name: 'Отказы', values: [31, 28, 34, 27, 24, 30] },
          ]}
        />
      );
    }
    if (kind === 'hexbin') return <HexbinChart aria-label="Чек и время на сайте" className="w-full" points={visits} countName="Заказов" xUnit="мин" />;
    return (
      <QuadrantChart
        aria-label="Рост и маржа продуктов"
        className="w-full"
        focus="topRight"
        quadrants={{ topLeft: 'Удержать маржу', topRight: 'Звёзды', bottomLeft: 'Пересмотреть', bottomRight: 'Растут в убыток' }}
        points={[
          { label: 'Склад Pro', x: 24, y: 38 },
          { label: 'Касса Онлайн', x: 31, y: 22 },
          { label: 'Маркетплейс', x: 8, y: 41 },
          { label: 'Курьеры', x: -15, y: 12 },
          { label: 'Учёт ЭДО', x: 12, y: 14 },
        ]}
      />
    );
  },
  code: (p) => {
    const kind = p.pick('kind', kinds);
    if (kind === 'scatter' || kind === 'trend') {
      const trend = kind === 'trend' ? `\n  trend="${p.pick('trend', trends)}"${p.bool('band') ? '\n  band' : ''}` : '';
      return `<ScatterChart
  aria-label="Звонки и закрытые сделки"
  xName="Звонков"
  yName="Сделок"${trend}
  series={[{ name: 'Менеджер', points: [{ label: 'Анна', x: 198, y: 20 }, …] }]}
/>`;
    }
    if (kind === 'bubble') {
      return `<BubbleChart
  aria-label="Сегменты клиентов"
  xScale="log"
  yScale="log"
  sizeName="Выручка"
  series={[{ name: 'Малый бизнес', points: [{ label: 'Розница', x: 860, y: 13_600, size: 11_700_000 }, …] }, …]}
/>`;
    }
    if (kind === 'heat') {
      return `<HeatMatrixChart
  aria-label="Заказы по дням и часам"
  rows={['Пн', 'Вт', 'Ср', 'Чт', 'Пт']}
  columns={['10:00', '11:00', '12:00', '13:00', '14:00', '15:00']}
  values={[[18, 35, 71, 83, 68, 38], …]}
  legendTitle="Заказов в час"
/>`;
    }
    if (kind === 'correlation') {
      return `<CorrelationMatrixChart
  aria-label="Связь показателей продаж"
  variables={[
    { name: 'Звонки', values: [410, 452, 388, 475, 501, 430] },
    { name: 'Сделки', values: [12, 14, 11, 13, 16, 13] },
    { name: 'Отказы', values: [31, 28, 34, 27, 24, 30] },
  ]}
/>`;
    }
    if (kind === 'hexbin') return `<HexbinChart aria-label="Чек и время на сайте" points={visits} countName="Заказов" xUnit="мин" />`;
    return `<QuadrantChart
  aria-label="Рост и маржа продуктов"
  focus="topRight"
  quadrants={{ topLeft: 'Удержать маржу', topRight: 'Звёзды', bottomLeft: 'Пересмотреть', bottomRight: 'Растут в убыток' }}
  points={[{ label: 'Склад Pro', x: 24, y: 38 }, …]}
/>`;
  },
};

export default playground;
