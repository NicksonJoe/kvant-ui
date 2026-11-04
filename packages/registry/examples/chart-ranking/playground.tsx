import { BarTableChart, BumpChart, OrderedBarChart, RankStripChart, SlopeChart, type BarTableColumn } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const kinds = ['ordered', 'slope', 'bump', 'rank-strip', 'bar-table'] as const;
type Kind = (typeof kinds)[number];
const names: Record<Kind, string> = {
  ordered: 'OrderedBarChart',
  slope: 'SlopeChart',
  bump: 'BumpChart',
  'rank-strip': 'RankStripChart',
  'bar-table': 'BarTableChart',
};

const percent = (value: number) => `${value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const managers = [
  { label: 'Анна Северова', value: 1_840_000 },
  { label: 'Михаил Орлов', value: 1_520_000 },
  { label: 'Дарья Ким', value: 1_310_000 },
  { label: 'Олег Панов', value: 1_120_000 },
  { label: 'Ирина Лис', value: 940_000 },
];
const channels = [
  { label: 'Рекомендации', from: 5.2, to: 5.5 },
  { label: 'Партнёры', from: 4.4, to: 3.0 },
  { label: 'Реклама', from: 3.8, to: 2.1 },
  { label: 'Сайт', from: 2.4, to: 3.6 },
  { label: 'Соцсети', from: 1.3, to: 1.2 },
];
const products = [
  { name: 'Склад Pro', ranks: [1, 1, 1, 2, 2, 2] },
  { name: 'Маркетплейс', ranks: [2, 3, 2, 1, 3, 3] },
  { name: 'Склад Lite', ranks: [3, 2, 4, 4, 5, 5] },
  { name: 'Касса Онлайн', ranks: [5, 4, 3, 3, 1, 1] },
  { name: 'Курьеры', ranks: [4, 5, 5, 5, 4, 4] },
];
const factors = [
  { label: 'Цена', rank: 4, previous: 3 },
  { label: 'Скорость доставки', rank: 2, previous: 2 },
  { label: 'Поддержка', rank: 1, previous: 3 },
  { label: 'Возвраты', rank: 6, previous: 4 },
];
interface Manager {
  name: string;
  deals: number;
  conversion: number;
  change: number;
}
const table: Manager[] = [
  { name: 'Анна Северова', deals: 31, conversion: 28.4, change: 12 },
  { name: 'Михаил Орлов', deals: 27, conversion: 24.1, change: 4 },
  { name: 'Дарья Ким', deals: 24, conversion: 26.7, change: -3 },
];
const columns: BarTableColumn<Manager>[] = [
  { id: 'name', header: 'Менеджер', kind: 'label', value: (row) => row.name, avatar: true },
  { id: 'deals', header: 'Сделки', kind: 'bar', value: (row) => row.deals },
  { id: 'conversion', header: 'Конверсия', kind: 'threshold', value: (row) => row.conversion, threshold: 25 },
  { id: 'change', header: 'К сентябрю', kind: 'delta', value: (row) => row.change },
];

const rub = (value: number) => `${(value / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млн ₽`;

const playground: Playground = {
  controls: [
    { name: 'kind', type: 'enum', options: kinds, default: 'ordered', description: 'Тип рейтинга: полосы, slope, bump, полоса рангов или таблица.' },
    { name: 'emphasis', type: 'boolean', default: true, description: 'Выделить одну строку или серию цветом.' },
  ],
  render: (p) => {
    const focus = p.bool('emphasis');
    switch (p.pick('kind', kinds)) {
      case 'ordered':
        return <OrderedBarChart aria-label="Рейтинг менеджеров" data={managers} formatValue={rub} focus={focus ? 'Дарья Ким' : undefined} />;
      case 'slope':
        return <SlopeChart aria-label="Конверсия по каналам" periods={['Сентябрь', 'Октябрь']} data={channels} formatValue={percent} focus={focus ? 'Сайт' : undefined} />;
      case 'bump':
        return (
          <BumpChart
            aria-label="Места продуктов"
            labels={['Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт']}
            series={products}
            highlight={focus ? ['Касса Онлайн', 'Склад Lite'] : []}
          />
        );
      case 'rank-strip':
        return <RankStripChart aria-label="Наше место среди конкурентов" places={8} previousLabel="Квартал назад" data={factors} />;
      case 'bar-table':
        return <BarTableChart aria-label="Менеджеры" rows={table} columns={columns} getRowId={(row) => row.name} />;
    }
  },
  code: (p) => {
    const kind = p.pick('kind', kinds);
    const focus = p.bool('emphasis');
    switch (kind) {
      case 'ordered':
        return `<${names[kind]}
  aria-label="Рейтинг менеджеров"${focus ? '\n  focus="Дарья Ким"' : ''}
  data={[
    { label: 'Анна Северова', value: 1840000 },
    { label: 'Дарья Ким', value: 1310000 },
  ]}
/>`;
      case 'slope':
        return `<${names[kind]}
  aria-label="Конверсия по каналам"
  periods={['Сентябрь', 'Октябрь']}${focus ? '\n  focus="Сайт"' : ''}
  data={[
    { label: 'Рекомендации', from: 5.2, to: 5.5 },
    { label: 'Сайт', from: 2.4, to: 3.6 },
  ]}
/>`;
      case 'bump':
        return `<${names[kind]}
  aria-label="Места продуктов"
  labels={['Май', 'Июн', 'Июл']}${focus ? "\n  highlight={['Касса Онлайн']}" : ''}
  series={[
    { name: 'Склад Pro', ranks: [1, 1, 2] },
    { name: 'Касса Онлайн', ranks: [2, 2, 1] },
  ]}
/>`;
      case 'rank-strip':
        return `<${names[kind]}
  aria-label="Наше место среди конкурентов"
  places={8}
  previousLabel="Квартал назад"
  data={[{ label: 'Цена', rank: 4, previous: 3 }]}
/>`;
      case 'bar-table':
        return `<${names[kind]}
  aria-label="Менеджеры"
  rows={managers}
  getRowId={(row) => row.name}
  columns={[
    { id: 'name', header: 'Менеджер', kind: 'label', value: (row) => row.name, avatar: true },
    { id: 'deals', header: 'Сделки', kind: 'bar', value: (row) => row.deals },
    { id: 'conversion', header: 'Конверсия', kind: 'threshold', value: (row) => row.conversion, threshold: 25 },
    { id: 'change', header: 'К сентябрю', kind: 'delta', value: (row) => row.change },
  ]}
/>`;
    }
  },
};

export default playground;
