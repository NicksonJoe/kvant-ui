import { ButterflyChart, DivergingBarChart, LikertChart, PlanFactChart, SpineChart, SurplusDeficitChart, TornadoChart } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const kinds = ['diverging', 'likert', 'spine', 'surplus-deficit', 'tornado', 'butterfly', 'plan-fact'] as const;
type Kind = (typeof kinds)[number];

const percent = (value: number) => `${value} %`;
const cities = [
  { label: 'Казань', value: 32 },
  { label: 'Москва', value: 8 },
  { label: 'Санкт-Петербург', value: 3 },
  { label: 'Самара', value: -6 },
  { label: 'Пермь', value: -18 },
];

const render = (kind: Kind, legend: boolean) => {
  switch (kind) {
    case 'diverging':
      return <DivergingBarChart aria-label="Выручка к прошлому году по городам" legend={legend} formatValue={percent} data={cities} />;
    case 'likert':
      return (
        <LikertChart
          aria-label="Мнение о сервисе"
          legend={legend}
          categories={['Нет', 'Скорее нет', 'Нейтрально', 'Скорее да', 'Да']}
          data={[
            { label: 'Легко найти товар', values: [4, 8, 14, 38, 36] },
            { label: 'Понятные цены', values: [9, 15, 18, 33, 25] },
            { label: 'Поддержка помогает', values: [12, 16, 20, 30, 22] },
          ]}
        />
      );
    case 'spine':
      return (
        <SpineChart
          aria-label="Наш магазин против сети"
          legend={legend}
          data={[
            { label: 'Средний чек', value: 2840, mean: 2700, min: 1900, max: 3400, q1: 2450, q3: 2950 },
            { label: 'Возвраты', value: 5.8, mean: 4.1, min: 1.2, max: 7.5, lowerIsBetter: true },
            { label: 'NPS', value: 62, mean: 48, min: 12, max: 71, q1: 36, q3: 60 },
          ]}
        />
      );
    case 'surplus-deficit':
      return (
        <SurplusDeficitChart
          aria-label="Поступления и платежи"
          legend={legend}
          unit="млн"
          labels={['нед. 1', '2', '3', '4', '5', '6', '7', '8']}
          series={{ name: 'Поступления', values: [5.4, 6.3, 7, 7.4, 6.5, 5.5, 4.9, 4.6] }}
          reference={{ name: 'Платежи', values: [6.6, 6.5, 5.7, 5.9, 5.2, 5.3, 5.8, 6.5] }}
        />
      );
    case 'tornado':
      return (
        <TornadoChart
          aria-label="Что двигает прибыль"
          legend={legend}
          lowLabel="показатель −10 %"
          highLabel="показатель +10 %"
          data={[
            { label: 'Цена товара', low: -1.9, high: 1.9 },
            { label: 'Закупочная цена', low: 1.4, high: -1.4 },
            { label: 'Зарплаты', low: 0.6, high: -0.6 },
          ]}
        />
      );
    case 'butterfly':
      return (
        <ButterflyChart
          aria-label="Клиенты по возрасту"
          legend={legend}
          labels={['18–24', '25–34', '35–44', '45+']}
          left={{ name: 'Новые', values: [184, 412, 356, 285] }}
          right={{ name: 'Повторные', values: [96, 538, 611, 617] }}
        />
      );
    case 'plan-fact':
      return (
        <PlanFactChart
          aria-label="План и факт по направлениям"
          data={[
            { label: 'Опт', plan: 5, fact: 4.2 },
            { label: 'Розница', plan: 1.6, fact: 1.9 },
            { label: 'Онлайн', plan: 3.6, fact: 3.1 },
          ]}
        />
      );
  }
};

const code: Record<Kind, (legend: string) => string> = {
  diverging: (legend) => `<DivergingBarChart
  aria-label="Выручка к прошлому году по городам"${legend}
  formatValue={(value) => \`\${value} %\`}
  data={[
    { label: 'Казань', value: 32 },
    { label: 'Самара', value: -6 },
  ]}
/>`,
  likert: (legend) => `<LikertChart
  aria-label="Мнение о сервисе"${legend}
  categories={['Нет', 'Скорее нет', 'Нейтрально', 'Скорее да', 'Да']}
  data={[{ label: 'Легко найти товар', values: [4, 8, 14, 38, 36] }]}
/>`,
  spine: (legend) => `<SpineChart
  aria-label="Наш магазин против сети"${legend}
  data={[{ label: 'Средний чек', value: 2840, mean: 2700, min: 1900, max: 3400, q1: 2450, q3: 2950 }]}
/>`,
  'surplus-deficit': (legend) => `<SurplusDeficitChart
  aria-label="Поступления и платежи"${legend}
  unit="млн"
  labels={['нед. 1', '2', '3']}
  series={{ name: 'Поступления', values: [5.4, 6.3, 7] }}
  reference={{ name: 'Платежи', values: [6.6, 6.5, 5.7] }}
/>`,
  tornado: (legend) => `<TornadoChart
  aria-label="Что двигает прибыль"${legend}
  lowLabel="показатель −10 %"
  highLabel="показатель +10 %"
  data={[{ label: 'Цена товара', low: -1.9, high: 1.9 }]}
/>`,
  butterfly: (legend) => `<ButterflyChart
  aria-label="Клиенты по возрасту"${legend}
  labels={['18–24', '25–34']}
  left={{ name: 'Новые', values: [184, 412] }}
  right={{ name: 'Повторные', values: [96, 538] }}
/>`,
  'plan-fact': () => `<PlanFactChart
  aria-label="План и факт по направлениям"
  data={[{ label: 'Опт', plan: 5, fact: 4.2 }]}
/>`,
};

const playground: Playground = {
  controls: [{ name: 'kind', type: 'enum', options: kinds, default: 'diverging', description: 'Тип графика отклонения.' }],
  render: (p) => <div className="w-full">{render(p.pick('kind', kinds), p.bool('legend'))}</div>,
  code: (p) => code[p.pick('kind', kinds)](p.attrs(['legend']).replace(/^ /, '\n  ')),
};

export default playground;
