import type { PropMeta, ReadyComponentMeta } from '../types';

const label: PropMeta = { name: 'aria-label', type: 'string', required: true, description: 'Что показывает график; данные дублируются скрытой таблицей.', control: false };
const legend: PropMeta = { name: 'legend', type: 'boolean', default: true, description: 'Легенда над графиком.' };
const formatSigned: PropMeta = {
  name: 'formatValue',
  type: 'function',
  signature: '(magnitude: number) => string',
  description: 'Формат величины без знака; «+» или «−» ставит график.',
  control: false,
};

const meta: ReadyComponentMeta = {
  id: 'chart-deviation',
  status: 'beta',
  title: 'Отклонение',
  description:
    'Насколько выше или ниже нормы? Ось нуля или нормы видна всегда, знак подписан «+» или «−», смысл «хорошо/плохо» задаёт метрика, а не цвет. Расходящиеся полосы, Лайкерт и NPS, spine chart, профицит и дефицит между линиями, торнадо и бабочка, план-факт с отклонением в %.',
  category: 'charts',
  paperBoard: '1QNZ-0',
  anatomy: [
    'Легенда h28 над графиком',
    'Подписи строк 13 справа налево',
    'Ось нуля: border у полос, fg-1 1,5 у Лайкерта, spine и торнадо',
    'Полосы и сегменты: chart-1/chart-2 или div-neg-2/-1, div-mid, div-pos-1/-2',
    'Подпись значения со знаком у конца полосы',
    'Подсветка строки fill-1 r8 и подсказка overlay r12',
  ],
  related: ['chart', 'card', 'badge', 'table'],
  source: {
    file: 'components/chart-deviation.tsx',
    exports: ['DivergingBarChart', 'LikertChart', 'SpineChart', 'SurplusDeficitChart', 'TornadoChart', 'ButterflyChart', 'PlanFactChart'],
  },
  dependencies: { npm: [], registry: [] },
  propsOf: 'DivergingBarChart',
  props: [
    label,
    {
      name: 'data',
      type: 'object',
      required: true,
      signature: 'readonly { label: string; value: number }[]',
      description: 'Строки сверху вниз; больше нуля — полоса вправо chart-1, меньше — влево chart-2.',
      control: false,
    },
    formatSigned,
    { name: 'positiveLabel', type: 'string', default: 'Рост', description: 'Слово легенды и подсказки для отклонения вверх.' },
    { name: 'negativeLabel', type: 'string', default: 'Падение', description: 'Слово для отклонения вниз.' },
    legend,
  ],
  parts: [
    {
      name: 'LikertChart',
      description:
        'Расходящиеся накопительные полосы 26 для шкалы Лайкерта и NPS: «нет» влево, «да» вправо, нейтральный ответ делится пополам по нулю. Два тона на сторону, середина div-mid, справа сумма «да» или индекс.',
      props: [
        label,
        { name: 'categories', type: 'object', required: true, signature: 'readonly string[]', description: 'Шкала от самого плохого ответа к лучшему; при нечётном числе средний — нейтральный.' },
        { name: 'data', type: 'object', required: true, signature: 'readonly { label: string; values: readonly number[] }[]', description: 'Ответы по вопросам: количества или проценты, доли считает график.' },
        { name: 'total', type: 'enum', options: ['positive', 'net'], default: 'positive', description: 'Правая колонка: доля положительных или положительные минус отрицательные (NPS).' },
        { name: 'totalLabel', type: 'string', description: 'Заголовок правой колонки; по умолчанию «да, всего» или «индекс».' },
        { name: 'legend', type: 'boolean', default: true, description: 'Легенда-кнопки: скрывают ответ, сумма пересчитывается.' },
      ],
    },
    {
      name: 'SpineChart',
      description:
        'Каждая строка — своя шкала: центр — среднее по группе, края — худший и лучший, светлая полоса fill-1 — весь разброс, тёмная fill-3 — средняя половина. Точка 12 с обводкой surface: div-pos-2 — заметно лучше, div-neg-2 — заметно хуже, fg-4 — как все.',
      props: [
        label,
        {
          name: 'data',
          type: 'object',
          required: true,
          signature:
            'readonly { label: string; value: number; mean: number; min: number; max: number; q1?: number; q3?: number; lowerIsBetter?: boolean; format?: (value: number) => string }[]',
          description: 'Показатели: наше значение, среднее, разброс и квартили; lowerIsBetter разворачивает строку.',
        },
        { name: 'threshold', type: 'number', default: 0.05, description: 'Отклонение от среднего, после которого точка окрашивается.' },
        { name: 'worseLabel', type: 'string', default: 'хуже среднего', description: 'Подпись левого края.' },
        { name: 'betterLabel', type: 'string', default: 'лучше среднего', description: 'Подпись правого края.' },
        { name: 'valuesLabel', type: 'string', default: 'мы · среднее', description: 'Заголовок колонки значений; уже 480 px колонка уходит в подсказку.' },
        legend,
      ],
    },
    {
      name: 'SurplusDeficitChart',
      description:
        'Две линии 2 (или линия и постоянная норма штрихом 4/4) и заливка разрыва: div-pos-1, где линия выше, div-neg-1, где ниже. Цвет переключается ровно в точках пересечения отрезков. Итог разрыва — подписью в углу, а не второй осью.',
      props: [
        label,
        { name: 'labels', type: 'object', required: true, signature: 'readonly string[]', description: 'Подписи оси X.' },
        { name: 'series', type: 'object', required: true, signature: '{ name: string; values: readonly number[] }', description: 'Измеряемая линия: поступления, выручка.' },
        {
          name: 'reference',
          type: 'object',
          required: true,
          signature: '{ name: string; values: readonly number[] } | { name: string; value: number }',
          description: 'С чем сравнивать: вторая линия или постоянная норма.',
        },
        { name: 'surplusLabel', type: 'string', default: 'Профицит', description: 'Название разрыва вверх.' },
        { name: 'deficitLabel', type: 'string', default: 'Дефицит', description: 'Название разрыва вниз.' },
        { name: 'period', type: 'string', description: 'Период в итоге: «за полгода».' },
        { name: 'unit', type: 'string', description: 'Единица после значений и у верхней подписи оси: «млн».' },
        { name: 'summary', type: 'boolean', default: true, description: 'Итоги профицита и дефицита в левом верхнем углу.' },
        { name: 'tooltipLabels', type: 'object', signature: 'readonly string[]', description: 'Заголовки подсказки по точкам.' },
        { name: 'formatValue', type: 'function', signature: '(value: number) => string', description: 'Формат значений.' },
        { name: 'height', type: 'number', default: 220, description: 'Высота области графика без подписей оси, px.' },
        { name: 'legend', type: 'boolean', default: true, description: 'Легенда: линии — кнопки, заливки — подписи.' },
      ],
    },
    {
      name: 'TornadoChart',
      description:
        'Чувствительность: показатель ниже — влево, выше — вправо от базы, строки по размаху, самый сильный рычаг сверху. Цвет — знак влияния (div-pos-2 / div-neg-2), а не сторона.',
      props: [
        label,
        { name: 'data', type: 'object', required: true, signature: 'readonly { label: string; low: number; high: number }[]', description: 'Влияние на результат при снижении и росте показателя.' },
        { name: 'lowLabel', type: 'string', default: 'Показатель ниже', description: 'Заголовок левой стороны: «показатель −10 %».' },
        { name: 'highLabel', type: 'string', default: 'Показатель выше', description: 'Заголовок правой стороны.' },
        { name: 'baseLabel', type: 'string', description: 'Над осью: «база 4,2 млн»; на узком экране скрывается.' },
        { name: 'positiveLabel', type: 'string', default: 'Рост', description: 'Легенда для положительного влияния.' },
        { name: 'negativeLabel', type: 'string', default: 'Снижение', description: 'Легенда для отрицательного влияния.' },
        { name: 'sort', type: 'boolean', default: true, description: 'Сортировать по размаху.' },
        formatSigned,
        legend,
      ],
    },
    {
      name: 'ButterflyChart',
      description: 'Бабочка: две группы зеркально от центральной оси по строкам, цвета chart-1 и chart-2, легенда-кнопки скрывают сторону.',
      props: [
        label,
        { name: 'labels', type: 'object', required: true, signature: 'readonly string[]', description: 'Подписи строк.' },
        { name: 'left', type: 'object', required: true, signature: '{ name: string; values: readonly number[]; color?: string }', description: 'Группа слева.' },
        { name: 'right', type: 'object', required: true, signature: '{ name: string; values: readonly number[]; color?: string }', description: 'Группа справа.' },
        { name: 'formatValue', type: 'function', signature: '(value: number) => string', description: 'Формат значений.' },
        legend,
      ],
    },
    {
      name: 'PlanFactChart',
      description:
        'Факт — полоса 12 chart-1, план — подложка fill-2 высотой 20 и штрих 2×28 fg-1. Отклонение в % — soft-статус 64×24 со стрелкой; «хорошо/плохо» задаёт метрика через invert.',
      props: [
        label,
        {
          name: 'data',
          type: 'object',
          required: true,
          signature: 'readonly { label: string; plan: number; fact: number; invert?: boolean }[]',
          description: 'Направления; invert у строки — перевыполнение плохо (расходы).',
        },
        { name: 'formatValue', type: 'function', signature: '(value: number) => string', description: 'Формат плана и факта: «4,2».' },
        { name: 'invert', type: 'boolean', default: false, description: 'Для всех строк без своего invert.' },
        { name: 'planLabel', type: 'string', default: 'План', description: 'Слово для плана в подсказке и таблице.' },
        { name: 'factLabel', type: 'string', default: 'Факт', description: 'Слово для факта.' },
      ],
    },
  ],
  slots: [
    { name: 'diverging-bar-chart', description: 'Расходящиеся полосы.' },
    { name: 'diverging-bar', description: 'Полоса строки; data-sign positive или negative.' },
    { name: 'likert-chart', description: 'Шкала Лайкерта или NPS.' },
    { name: 'likert-segment', description: 'Сегмент ответа; data-category.' },
    { name: 'likert-zero', description: 'Ось нуля fg-1 1,5.' },
    { name: 'likert-total', description: 'Сумма «да» или индекс справа.' },
    { name: 'spine-chart', description: 'Spine chart.' },
    { name: 'spine-dot', description: 'Наше значение; data-tone better, same или worse.' },
    { name: 'spine-quartiles', description: 'Средняя половина группы fill-3.' },
    { name: 'surplus-deficit-chart', description: 'Профицит и дефицит между линиями.' },
    { name: 'surplus-area', description: 'Заливка разрыва; data-kind surplus или deficit.' },
    { name: 'surplus-summary', description: 'Итоги разрыва в углу.' },
    { name: 'tornado-chart', description: 'Торнадо.' },
    { name: 'tornado-bar', description: 'Полоса влияния; data-side low или high, data-sign.' },
    { name: 'butterfly-chart', description: 'Бабочка.' },
    { name: 'butterfly-bar', description: 'Полоса группы; data-side low (слева) или high.' },
    { name: 'plan-fact-chart', description: 'План-факт.' },
    { name: 'plan-fact-bar', description: 'Факт.' },
    { name: 'plan-fact-target', description: 'Штрих плана.' },
    { name: 'plan-fact-badge', description: 'Отклонение в %; data-tone good, bad или neutral.' },
    { name: 'chart-tooltip', description: 'Подсказка строки или точки.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Без подсказки.' },
    { id: 'highlighted', label: 'строка', description: 'Наведение или клавиши: подсветка строки fill-1 r8 и подсказка; у линий — вертикаль и точки 9.' },
    { id: 'unchecked', label: 'серия скрыта', description: 'Лайкерт, бабочка, профицит: кнопка легенды с контуром fg-4 и зачёркиванием.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Легенда-кнопки, затем область графика' },
    { keys: ['↑', '↓'], action: 'Соседняя строка: подсветка, подсказка и объявление значений' },
    { keys: ['←', '→'], action: 'То же; у профицита и дефицита — соседняя точка по времени' },
    { keys: ['Home', 'End'], action: 'Первая или последняя строка' },
    { keys: ['Enter', 'Space'], action: 'В легенде: скрыть или показать ответ, сторону или линию' },
  ],
  a11y: [
    'Область графика — group с названием и скрытой таблицей всех значений; знак в таблице записан «+» или «−».',
    'Строка, выбранная клавишами, объявляется через aria-live: значение со знаком, вердикт spine («заметно лучше»), отклонение от плана.',
    'Цвет никогда не единственный носитель смысла: сторона от оси, знак и слово в подписи.',
    'Легенда, которая скрывает серии, — кнопки с aria-pressed; легенда направлений — простой список.',
  ],
  motion: [
    { label: 'Полосы и сегменты', value: 'растут от оси нуля 300 мс ease-standard, шаг 35 мс по строкам', tokens: ['duration-slow'], reduced: '150 мс' },
    { label: 'Точки spine', value: 'выезжают из центра к своему месту 300 мс', tokens: ['duration-slow'], reduced: '150 мс' },
    { label: 'Линии и заливка', value: 'clip-path слева направо 700 мс ease-out один раз', tokens: ['duration-deliberate'], reduced: '150 мс' },
    { label: 'Подписи и бейджи', value: 'появляются opacity 300 мс', tokens: ['duration-slow'] },
    { label: 'Наведение на легенду Лайкерта', value: 'остальные ответы приглушаются до 30 %, 150 мс', tokens: ['duration-quick'] },
  ],
  examples: [
    { id: 'revenue-growth', title: 'Выручка к прошлому году', description: 'Расходящиеся полосы по городам.' },
    { id: 'plan-fact', title: 'План и факт', description: 'Выручка по направлениям с отклонением в %.' },
    { id: 'survey', title: 'Мнение о сервисе', description: 'Пятибалльная шкала Лайкерта с суммой «да».' },
    { id: 'nps', title: 'NPS по каналам', description: 'Критики, нейтральные и промоутеры с индексом справа.' },
    { id: 'benchmark', title: 'Магазин против сети', description: 'Spine chart: шесть показателей на своих шкалах.' },
    { id: 'cash-gap', title: 'Поступления и платежи', description: 'Профицит и дефицит между двумя линиями за 26 недель.' },
    { id: 'sales-plan', title: 'Продажи против плана', description: 'Линия против постоянной нормы.' },
    { id: 'profit-drivers', title: 'Что двигает прибыль', description: 'Торнадо чувствительности прибыли.' },
    { id: 'clients-age', title: 'Клиенты по возрасту', description: 'Бабочка: новые и повторные клиенты.' },
  ],
};

export default meta;
