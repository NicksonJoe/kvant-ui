import {
  CalendarHeatmapChart,
  CandlestickChart,
  ComboChart,
  ConnectedScatterChart,
  CyclePlotChart,
  EventMarkerChart,
  ForecastChart,
  KagiChart,
  OhlcChart,
  PercentAreaChart,
  PointFigureChart,
  RangeAreaChart,
  RenkoChart,
  StackedAreaChart,
  StepLineChart,
  StreamChart,
  TimeColumnChart,
} from '@/kvant';
import type { Playground } from '@/kvant/meta';
import type { ReactNode } from 'react';
import { closes, october } from './prices';

const kinds = [
  'stacked',
  'percent',
  'stream',
  'step',
  'columns',
  'combo',
  'forecast',
  'range',
  'calendar',
  'cycle',
  'scatter',
  'events',
  'candles',
  'ohlc',
  'renko',
  'point-figure',
  'kagi',
] as const;
type Kind = (typeof kinds)[number];

const labels = ['Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт'];
const site = [415_000, 468_000, 518_000, 562_000, 607_000, 652_000];
const partners = [262_000, 241_000, 302_000, 330_000, 314_000, 381_000];
const series = [
  { name: 'Сайт', values: site },
  { name: 'Партнёры', values: partners },
];
const calendar = Array.from({ length: 91 }, (_, i) => ({
  date: new Date(Date.UTC(2026, 7, 3) + i * 864e5).toISOString().slice(0, 10),
  value: i % 7 > 4 ? (i * 7) % 9 : 12 + ((i * 37) % 90),
}));

const charts: Record<Kind, { render: (height: number) => ReactNode; code: string }> = {
  stacked: {
    render: (height) => <StackedAreaChart aria-label="Выручка по каналам" labels={labels} series={series} height={height} />,
    code: `<StackedAreaChart aria-label="Выручка по каналам" labels={labels} series={[{ name: 'Сайт', values: site }, { name: 'Партнёры', values: partners }]} />`,
  },
  percent: {
    render: (height) => <PercentAreaChart aria-label="Доля каналов" labels={labels} series={series} height={height} />,
    code: `<PercentAreaChart aria-label="Доля каналов" labels={labels} series={series} />`,
  },
  stream: {
    render: (height) => <StreamChart aria-label="Спрос по каналам" labels={labels} series={series} height={height} />,
    code: `<StreamChart aria-label="Спрос по каналам" labels={labels} series={series} />`,
  },
  step: {
    render: (height) => <StepLineChart aria-label="Цена тарифа" labels={labels} values={[990, 990, 1190, 1190, 1290, 1490]} height={height} />,
    code: `<StepLineChart aria-label="Цена тарифа" labels={labels} values={[990, 990, 1190, 1190, 1290, 1490]} />`,
  },
  columns: {
    render: (height) => <TimeColumnChart aria-label="Выручка с сайта" labels={labels} values={site} height={height} />,
    code: `<TimeColumnChart aria-label="Выручка с сайта" labels={labels} values={site} />`,
  },
  combo: {
    render: (height) => (
      <ComboChart
        aria-label="Выручка и тренд"
        labels={labels}
        bars={{ name: 'Месяц', values: site }}
        line={{ name: 'Среднее, 3 мес', values: [null, null, 467_000, 516_000, 562_000, 607_000] }}
        height={height}
      />
    ),
    code: `<ComboChart aria-label="Выручка и тренд" labels={labels} bars={{ name: 'Месяц', values: site }} line={{ name: 'Среднее, 3 мес', values: average }} />`,
  },
  forecast: {
    render: (height) => (
      <ForecastChart
        aria-label="Прогноз выручки"
        labels={labels}
        today={3}
        data={[{ value: 4.1 }, { value: 3.8 }, { value: 4.4 }, { value: 4.7 }, { value: 5.1, inner: [4.7, 5.5], outer: [4.4, 5.9] }, { value: 5.4, inner: [4.8, 6], outer: [4.3, 6.6] }]}
        height={height}
      />
    ),
    code: `<ForecastChart aria-label="Прогноз выручки" labels={labels} today={3} data={[{ value: 4.1 }, …, { value: 5.4, inner: [4.8, 6], outer: [4.3, 6.6] }]} />`,
  },
  range: {
    render: (height) => (
      <RangeAreaChart
        aria-label="Заказы в день"
        labels={labels}
        data={[180, 205, 220, 196, 214, 234].map((value, i) => ({ value, low: value - 52 - i * 3, high: value + 48 + i * 2 }))}
        height={height}
      />
    ),
    code: `<RangeAreaChart aria-label="Заказы в день" labels={labels} data={[{ low: 128, high: 228, value: 180 }, …]} />`,
  },
  calendar: {
    render: () => <CalendarHeatmapChart aria-label="Заказы по дням" name="Заказы" legendTitle="Заказов в день" data={calendar} />,
    code: `<CalendarHeatmapChart aria-label="Заказы по дням" name="Заказы" legendTitle="Заказов в день" data={[{ date: '2026-08-03', value: 12 }, …]} />`,
  },
  cycle: {
    render: (height) => (
      <CyclePlotChart
        aria-label="Сезонность выручки"
        periods={['2024', '2025', '2026']}
        data={labels.map((label, i) => ({ label, values: [80 + i * 4, 92 + i * 5, i === 5 ? null : 104 + i * 6] }))}
        height={height}
      />
    ),
    code: `<CyclePlotChart aria-label="Сезонность выручки" periods={['2024', '2025', '2026']} data={[{ label: 'Май', values: [80, 92, 104] }, …]} />`,
  },
  scatter: {
    render: (height) => (
      <ConnectedScatterChart
        aria-label="Реклама и выручка"
        xName="Реклама"
        yName="Выручка"
        data={labels.map((label, i) => ({ label, x: 1_200_000 + i * 220_000 - (i === 2 ? 400_000 : 0), y: site[i] ?? 0 }))}
        height={height}
      />
    ),
    code: `<ConnectedScatterChart aria-label="Реклама и выручка" xName="Реклама" yName="Выручка" data={[{ label: 'Май', x: 1_200_000, y: 415_000 }, …]} />`,
  },
  events: {
    render: (height) => (
      <EventMarkerChart
        aria-label="Активные пользователи"
        labels={labels}
        series={{ name: 'DAU', values: [12_800, 13_100, 14_600, 12_100, 15_900, 16_400] }}
        events={[
          { index: 2, code: 'v2.4', label: 'Новый checkout' },
          { index: 3, kind: 'incident', label: 'Сбой оплаты' },
        ]}
        height={height}
      />
    ),
    code: `<EventMarkerChart aria-label="Активные пользователи" labels={labels} series={{ name: 'DAU', values }} events={[{ index: 2, code: 'v2.4', label: 'Новый checkout' }, { index: 3, kind: 'incident', label: 'Сбой оплаты' }]} />`,
  },
  candles: {
    render: (height) => <CandlestickChart aria-label="Курс акции" data={october} height={height} />,
    code: `<CandlestickChart aria-label="Курс акции" data={[{ label: '01.10', open: 100, high: 101, low: 95.4, close: 96.2 }, …]} />`,
  },
  ohlc: {
    render: (height) => <OhlcChart aria-label="Курс акции" data={october} height={height} />,
    code: `<OhlcChart aria-label="Курс акции" data={prices} />`,
  },
  renko: {
    render: (height) => <RenkoChart aria-label="Ренко" values={closes} brickSize={2} height={height} />,
    code: `<RenkoChart aria-label="Ренко" values={closes} brickSize={2} />`,
  },
  'point-figure': {
    render: (height) => <PointFigureChart aria-label="Крестики-нолики" values={closes} boxSize={1} reversal={3} height={height} />,
    code: `<PointFigureChart aria-label="Крестики-нолики" values={closes} boxSize={1} reversal={3} />`,
  },
  kagi: {
    render: (height) => <KagiChart aria-label="Каги" values={closes} reversal={3} height={height} />,
    code: `<KagiChart aria-label="Каги" values={closes} reversal={3} />`,
  },
};

const playground: Playground = {
  controls: [{ name: 'kind', type: 'enum', options: kinds, default: 'stacked', description: 'Тип графика динамики.' }],
  render: (p) => <div className="w-full">{charts[p.pick('kind', kinds)].render(p.pick('height', [160, 196, 240] as const))}</div>,
  code: (p) => charts[p.pick('kind', kinds)].code.replace(' />', `${p.attrs(['height'])} />`),
};

export default playground;
