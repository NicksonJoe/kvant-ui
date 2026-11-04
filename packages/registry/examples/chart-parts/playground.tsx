import type { ReactNode } from 'react';
import {
  CirclePackingChart,
  IcicleChart,
  MarimekkoChart,
  NightingaleChart,
  ParliamentChart,
  PercentBarChart,
  PieChart,
  SunburstChart,
  TreemapChart,
  VennChart,
  VoronoiTreemapChart,
  WaffleChart,
} from '@/kvant';
import type { Playground } from '@/kvant/meta';

const kinds = ['pie', 'percent-bar', 'treemap', 'sunburst', 'icicle', 'waffle', 'marimekko', 'nightingale', 'parliament', 'venn', 'voronoi', 'packing'] as const;
type Kind = (typeof kinds)[number];

const channels = [
  { label: 'Сайт', value: 46 },
  { label: 'Маркетплейсы', value: 31 },
  { label: 'Партнёры', value: 15 },
  { label: 'Офлайн', value: 8 },
];
const products = [
  { label: 'Склад Pro', value: 4_048, group: 'Склад' },
  { label: 'Касса Онлайн', value: 3_496, group: 'Касса' },
  { label: 'Маркетплейс', value: 2_944, group: 'Склад' },
  { label: 'Склад Lite', value: 2_392, group: 'Склад' },
  { label: 'Учёт ЭДО', value: 1_840, group: 'Сервисы' },
  { label: 'Курьеры', value: 1_288, group: 'Сервисы' },
  { label: 'Касса Мини', value: 1_104, group: 'Касса' },
  { label: 'Аналитика', value: 920, group: 'Сервисы' },
];
const lines = [
  { label: 'Склад', children: [{ label: 'Pro', value: 4_048 }, { label: 'Маркетплейс', value: 2_944 }, { label: 'Lite', value: 2_392 }] },
  { label: 'Касса', children: [{ label: 'Онлайн', value: 3_496 }, { label: 'Мини', value: 1_104 }] },
  { label: 'Сервисы', children: [{ label: 'ЭДО', value: 1_840 }, { label: 'Курьеры', value: 1_288 }, { label: 'Аналитика', value: 1_288 }] },
];
const cities = ['Москва', 'Санкт-Петербург', 'Казань'];
const mix = [
  { name: 'Сайт', values: [52, 44, 38] },
  { name: 'Партнёры', values: [30, 34, 27] },
  { name: 'Прямые', values: [18, 22, 35] },
];
const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const revenue = [62, 58, 74, 88, 100, 94, 80, 77, 99, 116, 136, 158];

const charts: Record<Kind, (height: number) => ReactNode> = {
  pie: () => <PieChart aria-label="Выручка по каналам" data={channels} />,
  'percent-bar': () => <PercentBarChart aria-label="Доля каналов по городам" labels={cities} series={mix} />,
  treemap: (height) => <TreemapChart aria-label="Структура выручки" data={products} height={height} />,
  sunburst: () => <SunburstChart aria-label="Структура выручки по линейкам" data={lines} formatTotal={(total) => (total / 1000).toLocaleString('ru-RU')} totalLabel="млн ₽" />,
  icicle: () => <IcicleChart aria-label="Иерархия выручки" rootLabel="Выручка" data={lines} />,
  waffle: () => <WaffleChart aria-label="Каналы: 100 клеток" data={channels} />,
  marimekko: () => <MarimekkoChart aria-label="Рынок по городам и каналам" labels={cities} series={mix.map((item) => ({ ...item, values: item.values.map((value, i) => value * ([38, 22, 18][i] ?? 0)) }))} />,
  nightingale: () => (
    <NightingaleChart
      aria-label="Выручка по месяцам"
      data={months.map((label, i) => ({ label, value: revenue[i] ?? 0 }))}
      highlight={['Окт', 'Ноя', 'Дек']}
      legendLabels={{ base: 'Месяц', highlight: 'Последний квартал' }}
    />
  ),
  parliament: () => (
    <ParliamentChart
      aria-label="Команда по отделам"
      totalLabel="сотрудников"
      data={[
        { label: 'Продажи', value: 38 },
        { label: 'Разработка', value: 34 },
        { label: 'Поддержка', value: 22 },
        { label: 'Маркетинг', value: 14 },
        { label: 'Офис', value: 12, other: true },
      ]}
    />
  ),
  venn: () => (
    <VennChart
      aria-label="Пересечение продуктов"
      sets={[{ label: 'Касса' }, { label: 'Склад' }, { label: 'ЭДО' }]}
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
  ),
  voronoi: () => <VoronoiTreemapChart aria-label="Продукты в форме круга" data={products} />,
  packing: () => <CirclePackingChart aria-label="Продукты кругами" data={products} />,
};

const code: Record<Kind, string> = {
  pie: `<PieChart
  aria-label="Выручка по каналам"
  data={[
    { label: 'Сайт', value: 46 },
    { label: 'Маркетплейсы', value: 31 },
    { label: 'Партнёры', value: 15 },
    { label: 'Офлайн', value: 8 },
  ]}
/>`,
  'percent-bar': `<PercentBarChart
  aria-label="Доля каналов по городам"
  labels={['Москва', 'Санкт-Петербург', 'Казань']}
  series={[
    { name: 'Сайт', values: [52, 44, 38] },
    { name: 'Партнёры', values: [30, 34, 27] },
    { name: 'Прямые', values: [18, 22, 35] },
  ]}
/>`,
  treemap: `<TreemapChart
  aria-label="Структура выручки"
  data={[
    { label: 'Склад Pro', value: 4048, group: 'Склад' },
    { label: 'Касса Онлайн', value: 3496, group: 'Касса' },
    { label: 'Учёт ЭДО', value: 1840, group: 'Сервисы' },
  ]}
/>`,
  sunburst: `<SunburstChart
  aria-label="Структура выручки по линейкам"
  totalLabel="млн ₽"
  formatTotal={(total) => (total / 1000).toLocaleString('ru-RU')}
  data={[
    { label: 'Склад', children: [{ label: 'Pro', value: 4048 }, { label: 'Lite', value: 2392 }] },
    { label: 'Касса', children: [{ label: 'Онлайн', value: 3496 }] },
  ]}
/>`,
  icicle: `<IcicleChart
  aria-label="Иерархия выручки"
  rootLabel="Выручка"
  data={[
    { label: 'Склад', children: [{ label: 'Pro', value: 4048 }, { label: 'Lite', value: 2392 }] },
    { label: 'Касса', children: [{ label: 'Онлайн', value: 3496 }] },
  ]}
/>`,
  waffle: `<WaffleChart
  aria-label="Каналы: 100 клеток"
  data={[
    { label: 'Сайт', value: 46 },
    { label: 'Маркетплейсы', value: 31 },
    { label: 'Партнёры', value: 23 },
  ]}
/>`,
  marimekko: `<MarimekkoChart
  aria-label="Рынок по городам и каналам"
  labels={['Москва', 'Санкт-Петербург', 'Казань']}
  series={[
    { name: 'Сайт', values: [1976, 968, 684] },
    { name: 'Партнёры', values: [1140, 748, 486] },
  ]}
/>`,
  nightingale: `<NightingaleChart
  aria-label="Выручка по месяцам"
  data={months.map((label, i) => ({ label, value: revenue[i] }))}
  highlight={['Окт', 'Ноя', 'Дек']}
  legendLabels={{ base: 'Месяц', highlight: 'Последний квартал' }}
/>`,
  parliament: `<ParliamentChart
  aria-label="Команда по отделам"
  totalLabel="сотрудников"
  data={[
    { label: 'Продажи', value: 38 },
    { label: 'Разработка', value: 34 },
    { label: 'Офис', value: 12, other: true },
  ]}
/>`,
  venn: `<VennChart
  aria-label="Пересечение продуктов"
  sets={[{ label: 'Касса' }, { label: 'Склад' }]}
  regions={[
    { sets: ['Касса'], value: 1840 },
    { sets: ['Склад'], value: 1210 },
    { sets: ['Касса', 'Склад'], value: 640 },
  ]}
/>`,
  voronoi: `<VoronoiTreemapChart
  aria-label="Продукты в форме круга"
  data={[
    { label: 'Склад Pro', value: 4048, group: 'Склад' },
    { label: 'Касса Онлайн', value: 3496, group: 'Касса' },
    { label: 'Учёт ЭДО', value: 1840, group: 'Сервисы' },
  ]}
/>`,
  packing: `<CirclePackingChart
  aria-label="Продукты кругами"
  data={[
    { label: 'Склад Pro', value: 412, group: 'Склад' },
    { label: 'Касса Онлайн', value: 356, group: 'Касса' },
    { label: 'Учёт ЭДО', value: 187, group: 'Сервисы' },
  ]}
/>`,
};

const playground: Playground = {
  controls: [
    {
      name: 'kind',
      type: 'enum',
      options: kinds,
      default: 'treemap',
      description: 'Тип: пирог, полосы 100 %, treemap, sunburst, icicle, вафля, маримекко, роза, парламент, Венн, Voronoi treemap, упаковка кругов.',
    },
  ],
  render: (p) => <div className="w-full">{charts[p.pick('kind', kinds)](p.pick('height', [200, 260, 320] as const))}</div>,
  code: (p) => {
    const kind = p.pick('kind', kinds);
    return kind === 'treemap' ? code.treemap.replace('<TreemapChart', `<TreemapChart${p.attrs(['height'])}`) : code[kind];
  },
};

export default playground;
