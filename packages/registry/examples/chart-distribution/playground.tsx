import {
  BeeswarmChart,
  BoxPlotChart,
  ErrorBarChart,
  HistogramChart,
  JitterChart,
  LorenzChart,
  ParetoChart,
  PopulationPyramidChart,
  RidgelineChart,
  SpanChart,
  StemLeafChart,
  ViolinChart,
} from '@/kvant';
import type { Playground } from '@/kvant/meta';
import type { ReactNode } from 'react';

const kinds = ['histogram', 'box', 'violin', 'ridgeline', 'beeswarm', 'jitter', 'pyramid', 'pareto', 'lorenz', 'error-bars', 'span', 'stem-leaf'] as const;
type Kind = (typeof kinds)[number];

// Дни закрытия сделок по трём менеджерам: одни данные на все виды распределения
const anna = [9, 12, 14, 15, 17, 18, 19, 21, 22, 24, 25, 27, 29, 33, 38, 52];
const oleg = [14, 18, 21, 24, 26, 28, 29, 31, 33, 35, 36, 39, 42, 47, 55];
const vera = [6, 8, 10, 11, 12, 13, 13, 15, 16, 18, 20, 23, 31];
const groupsCode = `[
    { name: 'Анна', values: [9, 12, 14, 15, 17, 18, 19, 21, 22, 24, 25, 27, 29, 33, 38, 52] },
    { name: 'Олег', values: [14, 18, 21, 24, 26, 28, 29, 31, 33, 35, 36, 39, 42, 47, 55] },
    { name: 'Вера', values: [6, 8, 10, 11, 12, 13, 13, 15, 16, 18, 20, 23, 31] },
  ]`;
const groups = [
  { name: 'Анна', values: anna },
  { name: 'Олег', values: oleg },
  { name: 'Вера', values: vera },
];
const all = [...anna, ...oleg, ...vera];
const allCode = '[9, 12, 14, 15, 17, 18, 19, 21, 22, 24, 25, 27, 29, 33, 38, 52, 14, 18, 21, /* … */ 23, 31]';

const render: Record<Kind, () => ReactNode> = {
  histogram: () => <HistogramChart aria-label="Сроки закрытия сделок" values={all} step={5} unit="дн" countLabel="Сделок" />,
  box: () => <BoxPlotChart aria-label="Сроки закрытия по менеджерам" groups={groups} unit="дн" />,
  violin: () => <ViolinChart aria-label="Сроки закрытия по менеджерам" groups={groups} />,
  ridgeline: () => <RidgelineChart aria-label="Сроки закрытия по менеджерам" groups={groups} unit="дн" />,
  beeswarm: () => <BeeswarmChart aria-label="Сроки закрытия по менеджерам" groups={groups} unit="дн" rowHeight={72} />,
  jitter: () => <JitterChart aria-label="Сроки закрытия по менеджерам" groups={groups} unit="дн" />,
  pyramid: () => (
    <PopulationPyramidChart
      aria-label="Клиенты по возрасту и полу"
      series={['Мужчины', 'Женщины']}
      unit="%"
      rows={[
        { label: '45+', left: 9.4, right: 11.2 },
        { label: '35–44', left: 12.1, right: 13.6 },
        { label: '25–34', left: 14.8, right: 17.2 },
        { label: '18–24', left: 6.2, right: 7.9 },
      ]}
    />
  ),
  pareto: () => (
    <ParetoChart
      aria-label="Причины проигранных сделок"
      data={[
        { label: 'Дорого', value: 42 },
        { label: 'Ушли к конкуренту', value: 27 },
        { label: 'Нет бюджета', value: 15 },
        { label: 'Не дозвонились', value: 9 },
        { label: 'Прочее', value: 7 },
      ]}
    />
  ),
  lorenz: () => <LorenzChart aria-label="Концентрация выручки по клиентам" values={all} populationLabel="клиентов" valueLabel="Доля выручки" />,
  'error-bars': () => (
    <ErrorBarChart
      aria-label="Прирост конверсии в A/B-тестах"
      unit="п. п."
      data={[
        { label: 'Новый онбординг', value: 2.4, low: 0.9, high: 3.9 },
        { label: 'Чат-бот', value: -0.6, low: -2.3, high: 1.1 },
        { label: 'Скидка 10 %', value: 3.2, low: 1.5, high: 4.9 },
      ]}
    />
  ),
  span: () => (
    <SpanChart
      aria-label="Вилки зарплат по грейдам"
      unit="тыс"
      markLabel="Медиана"
      data={[
        { label: 'Младший', start: 85, end: 130, mark: 105 },
        { label: 'Средний', start: 140, end: 210, mark: 172 },
        { label: 'Старший', start: 220, end: 320, mark: 262 },
      ]}
    />
  ),
  'stem-leaf': () => <StemLeafChart aria-label="Сроки закрытия сделок, дни" values={all} />,
};

const code: Record<Kind, string> = {
  histogram: `<HistogramChart\n  aria-label="Сроки закрытия сделок"\n  values={${allCode}}\n  step={5}\n  unit="дн"\n  countLabel="Сделок"\n/>`,
  box: `<BoxPlotChart\n  aria-label="Сроки закрытия по менеджерам"\n  unit="дн"\n  groups={${groupsCode}}\n/>`,
  violin: `<ViolinChart\n  aria-label="Сроки закрытия по менеджерам"\n  groups={${groupsCode}}\n/>`,
  ridgeline: `<RidgelineChart\n  aria-label="Сроки закрытия по менеджерам"\n  unit="дн"\n  groups={${groupsCode}}\n/>`,
  beeswarm: `<BeeswarmChart\n  aria-label="Сроки закрытия по менеджерам"\n  unit="дн"\n  rowHeight={72}\n  groups={${groupsCode}}\n/>`,
  jitter: `<JitterChart\n  aria-label="Сроки закрытия по менеджерам"\n  unit="дн"\n  groups={${groupsCode}}\n/>`,
  pyramid: `<PopulationPyramidChart
  aria-label="Клиенты по возрасту и полу"
  series={['Мужчины', 'Женщины']}
  unit="%"
  rows={[
    { label: '45+', left: 9.4, right: 11.2 },
    { label: '35–44', left: 12.1, right: 13.6 },
    { label: '25–34', left: 14.8, right: 17.2 },
    { label: '18–24', left: 6.2, right: 7.9 },
  ]}
/>`,
  pareto: `<ParetoChart
  aria-label="Причины проигранных сделок"
  data={[
    { label: 'Дорого', value: 42 },
    { label: 'Ушли к конкуренту', value: 27 },
    { label: 'Нет бюджета', value: 15 },
    { label: 'Не дозвонились', value: 9 },
    { label: 'Прочее', value: 7 },
  ]}
/>`,
  lorenz: `<LorenzChart\n  aria-label="Концентрация выручки по клиентам"\n  values={${allCode}}\n  populationLabel="клиентов"\n  valueLabel="Доля выручки"\n/>`,
  'error-bars': `<ErrorBarChart
  aria-label="Прирост конверсии в A/B-тестах"
  unit="п. п."
  data={[
    { label: 'Новый онбординг', value: 2.4, low: 0.9, high: 3.9 },
    { label: 'Чат-бот', value: -0.6, low: -2.3, high: 1.1 },
    { label: 'Скидка 10 %', value: 3.2, low: 1.5, high: 4.9 },
  ]}
/>`,
  span: `<SpanChart
  aria-label="Вилки зарплат по грейдам"
  unit="тыс"
  markLabel="Медиана"
  data={[
    { label: 'Младший', start: 85, end: 130, mark: 105 },
    { label: 'Средний', start: 140, end: 210, mark: 172 },
    { label: 'Старший', start: 220, end: 320, mark: 262 },
  ]}
/>`,
  'stem-leaf': `<StemLeafChart aria-label="Сроки закрытия сделок, дни" values={${allCode}} />`,
};

const playground: Playground = {
  controls: [{ name: 'kind', type: 'enum', options: kinds, default: 'histogram', description: 'Вид графика распределения.' }],
  render: (p) => <div className="w-full">{render[p.pick('kind', kinds)]()}</div>,
  code: (p) => code[p.pick('kind', kinds)],
};

export default playground;
