import {
  BulletChart,
  ClevelandDotChart,
  GroupedBarChart,
  HorizontalBarChart,
  IsotypeChart,
  LollipopChart,
  ParallelCoordinatesChart,
  ProportionalAreaChart,
  RadarChart,
  RadialBarChart,
  StackedBarChart,
} from '@/kvant';
import type { Playground, PropReader } from '@/kvant/meta';
import type { ReactNode } from 'react';

const kinds = ['bar', 'grouped', 'stacked', 'bullet', 'lollipop', 'dot', 'radar', 'parallel', 'isotype', 'area', 'radial'] as const;
type Kind = (typeof kinds)[number];

const managers = [
  { label: 'Анна Северова', value: 48 },
  { label: 'Вера Лебедева', value: 31 },
  { label: 'Илья Громов', value: 22 },
  { label: 'Пётр Ильин', value: 12 },
];
const managersCode = `data={[
    { label: 'Анна Северова', value: 48 },
    { label: 'Вера Лебедева', value: 31 },
    { label: 'Илья Громов', value: 22 },
    { label: 'Пётр Ильин', value: 12 },
  ]}`;
const months = ['Июль', 'Август', 'Сентябрь', 'Октябрь'];
const deals = [
  { name: 'Новые', values: [26, 34, 35, 38] },
  { name: 'Закрытые', values: [24, 21, 27, 30] },
];
const dealsCode = `labels={['Июль', 'Август', 'Сентябрь', 'Октябрь']}
  series={[
    { name: 'Новые', values: [26, 34, 35, 38] },
    { name: 'Закрытые', values: [24, 21, 27, 30] },
  ]}`;

const charts: Record<Kind, { render: (p: PropReader) => ReactNode; code: (p: PropReader) => string }> = {
  bar: {
    render: (p) => <HorizontalBarChart aria-label="Сделки по менеджерам" name={p.text('name')} sort={p.bool('sort')} data={managers} />,
    code: (p) => `<HorizontalBarChart\n  aria-label="Сделки по менеджерам"${p.attrs(['name', 'sort'])}\n  ${managersCode}\n/>`,
  },
  grouped: {
    render: (p) => <GroupedBarChart aria-label="Новые и закрытые сделки" orientation={p.bool('horizontal') ? 'horizontal' : 'vertical'} labels={months} series={deals} />,
    code: (p) => `<GroupedBarChart\n  aria-label="Новые и закрытые сделки"${p.bool('horizontal') ? '\n  orientation="horizontal"' : ''}\n  ${dealsCode}\n/>`,
  },
  stacked: {
    render: () => <StackedBarChart aria-label="Новые и закрытые сделки" labels={months} series={deals} />,
    code: () => `<StackedBarChart\n  aria-label="Новые и закрытые сделки"\n  ${dealsCode}\n/>`,
  },
  bullet: {
    render: () => (
      <BulletChart
        aria-label="Цели месяца"
        data={[
          { label: 'Новые клиенты', unit: 'шт', value: 38, target: 30, ranges: [20, 30, 45] },
          { label: 'NPS', unit: 'баллы', value: 52, target: 60, ranges: [30, 50, 80] },
        ]}
      />
    ),
    code: () => `<BulletChart
  aria-label="Цели месяца"
  data={[
    { label: 'Новые клиенты', unit: 'шт', value: 38, target: 30, ranges: [20, 30, 45] },
    { label: 'NPS', unit: 'баллы', value: 52, target: 60, ranges: [30, 50, 80] },
  ]}
/>`,
  },
  lollipop: {
    render: (p) => <LollipopChart aria-label="Сделки по менеджерам" name={p.text('name')} sort={p.bool('sort')} data={managers} />,
    code: (p) => `<LollipopChart\n  aria-label="Сделки по менеджерам"${p.attrs(['name', 'sort'])}\n  ${managersCode}\n/>`,
  },
  dot: {
    render: () => <ClevelandDotChart aria-label="Новые и закрытые сделки" labels={months} series={deals} />,
    code: () => `<ClevelandDotChart\n  aria-label="Новые и закрытые сделки"\n  ${dealsCode}\n/>`,
  },
  radar: {
    render: () => (
      <RadarChart
        aria-label="Оценка против конкурента"
        max={100}
        axes={['Цена', 'Качество', 'Сервис', 'Доставка', 'Бренд']}
        series={[
          { name: 'Мы', values: [80, 65, 90, 55, 60] },
          { name: 'Конкурент', values: [60, 85, 70, 75, 80] },
        ]}
      />
    ),
    code: () => `<RadarChart
  aria-label="Оценка против конкурента"
  max={100}
  axes={['Цена', 'Качество', 'Сервис', 'Доставка', 'Бренд']}
  series={[
    { name: 'Мы', values: [80, 65, 90, 55, 60] },
    { name: 'Конкурент', values: [60, 85, 70, 75, 80] },
  ]}
/>`,
  },
  parallel: {
    render: () => (
      <ParallelCoordinatesChart
        aria-label="Менеджеры по трём метрикам"
        highlight={['Анна Северова']}
        axes={[
          { label: 'Сделки, шт', min: 0, max: 50 },
          { label: 'Конверсия, %', min: 0, max: 40 },
          { label: 'Цикл, дн', min: 0, max: 30, invert: true },
        ]}
        rows={[
          { name: 'Анна Северова', values: [48, 32, 9] },
          { name: 'Вера Лебедева', values: [31, 24, 14] },
          { name: 'Илья Громов', values: [22, 28, 21] },
          { name: 'Пётр Ильин', values: [12, 15, 26] },
        ]}
      />
    ),
    code: () => `<ParallelCoordinatesChart
  aria-label="Менеджеры по трём метрикам"
  highlight={['Анна Северова']}
  axes={[
    { label: 'Сделки, шт', min: 0, max: 50 },
    { label: 'Конверсия, %', min: 0, max: 40 },
    { label: 'Цикл, дн', min: 0, max: 30, invert: true },
  ]}
  rows={[
    { name: 'Анна Северова', values: [48, 32, 9] },
    { name: 'Вера Лебедева', values: [31, 24, 14] },
    { name: 'Илья Громов', values: [22, 28, 21] },
    { name: 'Пётр Ильин', values: [12, 15, 26] },
  ]}
/>`,
  },
  isotype: {
    render: () => <IsotypeChart aria-label="Сделки по менеджерам" unit={5} unitLabel="Один значок — 5 сделок" data={managers} />,
    code: () => `<IsotypeChart\n  aria-label="Сделки по менеджерам"\n  unit={5}\n  unitLabel="Один значок — 5 сделок"\n  ${managersCode}\n/>`,
  },
  area: {
    render: () => (
      <ProportionalAreaChart
        aria-label="Воронка заявок"
        data={[
          { label: 'Заявки', value: 420, description: 'за октябрь' },
          { label: 'Встречи', value: 160, description: 'дошли до встречи' },
          { label: 'Сделки', value: 38, description: 'оплатили' },
        ]}
      />
    ),
    code: () => `<ProportionalAreaChart
  aria-label="Воронка заявок"
  data={[
    { label: 'Заявки', value: 420, description: 'за октябрь' },
    { label: 'Встречи', value: 160, description: 'дошли до встречи' },
    { label: 'Сделки', value: 38, description: 'оплатили' },
  ]}
/>`,
  },
  radial: {
    render: () => <RadialBarChart aria-label="Выполнение плана по менеджерам" max={50} data={managers} />,
    code: () => `<RadialBarChart\n  aria-label="Выполнение плана по менеджерам"\n  max={50}\n  ${managersCode}\n/>`,
  },
};

const names: Record<Kind, string> = {
  bar: 'горизонтальные полосы',
  grouped: 'сгруппированные',
  stacked: 'накопительные',
  bullet: 'bullet',
  lollipop: 'леденец',
  dot: 'точки Кливленда',
  radar: 'радар',
  parallel: 'параллельные координаты',
  isotype: 'пиктограммы',
  area: 'пропорциональные фигуры',
  radial: 'радиальные столбцы',
};

const playground: Playground = {
  initial: { name: 'Сделки' },
  controls: [
    { name: 'kind', type: 'enum', options: kinds, default: 'bar', description: `Тип графика: ${kinds.map((kind) => `${kind} — ${names[kind]}`).join(', ')}.` },
    { name: 'horizontal', type: 'boolean', default: false, description: 'Для сгруппированных: полосы вместо столбцов.' },
  ],
  render: (p) => <div className="w-full">{charts[p.pick('kind', kinds)].render(p)}</div>,
  code: (p) => charts[p.pick('kind', kinds)].code(p),
};

export default playground;
