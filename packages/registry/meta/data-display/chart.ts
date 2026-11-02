import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'chart',
  status: 'stable',
  title: 'График',
  description:
    'Данные — главный слой, всё остальное отступает: сетка цвета separator, ось нуля — border, подписи 12/16 fg-3 с сокращением «тыс». Наведение и ← → показывают вертикаль, точку и подсказку. Плюс кольцо, спарклайн и карточка KPI.',
  category: 'data-display',
  paperBoard: 'DHS-0',
  anatomy: ['Легенда-кнопки h28', 'Ось Y 48 с подписями', 'Сетка separator, ноль border', 'Серии chart-1…8', 'Вертикаль 1 fg-4 штрих 3/3 и точка 9', 'Подсказка overlay r12'],
  related: ['card', 'segmented-control', 'table', 'skeleton', 'empty-state'],
  source: {
    file: 'components/chart.tsx',
    exports: ['AreaChart', 'LineChart', 'BarChart', 'DonutChart', 'BarList', 'StackedBar', 'Sparkline', 'KpiCard', 'CHART_COLORS', 'niceTicks', 'formatAxisValue'],
  },
  dependencies: { npm: ['lucide-react'], registry: [] },
  propsOf: 'AreaChart',
  props: [
    { name: 'aria-label', type: 'string', required: true, description: 'Что показывает график; данные дублируются скрытой таблицей для экранного диктора.', control: false },
    { name: 'labels', type: 'object', required: true, signature: 'readonly string[]', description: 'Подписи оси X; на длинных рядах показывается каждая n-я.', control: false },
    { name: 'series', type: 'object', required: true, signature: 'readonly { name: string; values: readonly number[]; color?: string }[]', description: 'Серии; цвета по умолчанию — chart-1, chart-2 и далее.', control: false },
    { name: 'tooltipLabels', type: 'object', signature: 'readonly string[]', description: 'Заголовки подсказки по точкам: «16 октября, пятница».', control: false },
    { name: 'formatValue', type: 'function', signature: '(value: number) => string', description: 'Формат значений в подсказке, например рубли.', control: false },
    { name: 'height', type: 'number', options: [160, 200, 240], default: 200, description: 'Высота области графика без подписей оси, px.' },
    { name: 'legend', type: 'boolean', description: 'Легенда над графиком; по умолчанию — когда серий больше одной. Нажатие скрывает серию.' },
  ],
  parts: [
    { name: 'LineChart', description: 'Линии 2 с круглыми концами, последняя точка 7. Те же свойства, что у AreaChart.', props: [] },
    { name: 'BarChart', description: 'Сгруппированные столбцы 16, зазор 4, скругление 4 сверху. Те же свойства.', props: [] },
    {
      name: 'DonutChart',
      description: 'Кольцо 16 с разрывами 2 px, итог в центре и легенда с долями.',
      props: [
        { name: 'data', type: 'object', required: true, signature: 'readonly { label: string; value: number; color?: string }[]', description: 'Сегменты.' },
        { name: 'totalLabel', type: 'string', description: 'Подпись под итогом: «сделок».' },
        { name: 'size', type: 'number', default: 136, description: 'Диаметр кольца, px.' },
      ],
    },
    {
      name: 'KpiCard',
      description: 'Сколько, лучше или хуже, за какой период: значение 28/36, бейдж изменения и спарклайн.',
      props: [
        { name: 'label', type: 'node', required: true, description: 'Показатель: «Выручка».' },
        { name: 'period', type: 'node', description: '«Октябрь».' },
        { name: 'value', type: 'node', required: true, description: 'Отформатированное значение: «1 284 900 ₽».' },
        { name: 'change', type: 'string', description: '«+12,4 %», «−1,2 п. п.» для долей.' },
        { name: 'trend', type: 'enum', options: ['up', 'down'], default: 'up', description: 'Направление; рост — зелёный.' },
        { name: 'invert', type: 'boolean', description: 'Рост — плохо (расходы, отток): цвета меняются местами.' },
        { name: 'comparison', type: 'node', description: '«к сентябрю».' },
        { name: 'data', type: 'object', signature: 'readonly number[]', description: 'Спарклайн за 12 недель.' },
      ],
    },
    {
      name: 'BarList',
      description: 'Рейтинг: подпись и значение в строку, полоса 6 под ними, длины от наибольшего; один цвет на все полосы.',
      props: [
        { name: 'data', type: 'object', required: true, signature: 'readonly { label: string; value: number }[]', description: 'Строки в порядке показа, обычно по убыванию.' },
        { name: 'formatValue', type: 'function', signature: '(value: number) => string', description: 'Формат значения.' },
      ],
    },
    {
      name: 'StackedBar',
      description: 'Доли одного целого в полосе 12 с разрывами 2 px и легендой со значениями и процентами.',
      props: [{ name: 'data', type: 'object', required: true, signature: 'readonly { label: string; value: number; color?: string }[]', description: 'Части целого.' }],
    },
    { name: 'Sparkline', description: 'Форма тренда без осей: линия 1,5, заливка 18 % → 0, конечная точка.', props: [{ name: 'data', type: 'object', required: true, signature: 'readonly number[]', description: 'Значения.' }] },
  ],
  slots: [
    { name: 'chart', description: 'Линейный, площадной или столбчатый график; несёт data-kind.' },
    { name: 'donut-chart', description: 'Кольцо с легендой.' },
    { name: 'bar-list', description: 'Рейтинг полосами.' },
    { name: 'stacked-bar', description: 'Доли в одной полосе.' },
    { name: 'sparkline', description: 'Спарклайн.' },
    { name: 'kpi-card', description: 'Карточка показателя.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Без подсказки.' },
    { id: 'highlighted', label: 'точка', description: 'Наведение или ← →: вертикаль, точка 9 с обводкой 2 и подсказка.' },
    { id: 'unchecked', label: 'серия скрыта', description: 'Легенда: контур fg-4 и зачёркивание.' },
    { id: 'empty', label: 'пусто', description: 'Пустой период — EmptyState внутри карточки графика.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Легенда, затем область графика' },
    { keys: ['←', '→'], action: 'Соседняя точка: вертикаль, подсказка и объявление значения' },
    { keys: ['Home', 'End'], action: 'Первая или последняя точка' },
    { keys: ['Enter', 'Space'], action: 'В легенде: скрыть или показать серию' },
  ],
  a11y: [
    'Область графика — group с названием; рядом скрытая таблица со всеми значениями.',
    'Значения выбранной клавишами точки объявляются через aria-live.',
    'Легенда — кнопки с aria-pressed; цвет серии всегда подписан словом.',
  ],
  motion: [
    { label: 'Подсказка и вертикаль', value: 'следуют за курсором за 0 мс; подсказка появляется opacity 150 мс' },
    { label: 'Столбцы', value: 'растут от нуля 300 мс ease-standard, шаг 35 мс по группам' },
    { label: 'Линии и спарклайн', value: 'clip-path слева направо 700 мс ease-out один раз' },
    { label: 'Наведение на легенду', value: 'остальные серии приглушаются до 30 %, 150 мс; без отскоков' },
  ],
  examples: [
    { id: 'kpi', title: 'Показатели', description: 'Четыре карточки KPI со спарклайнами; доля — в процентных пунктах.' },
    { id: 'revenue', title: 'Выручка по дням', description: 'Площадной график в карточке с переключателем периода.' },
    { id: 'pipeline', title: 'Сделки по этапам', description: 'Кольцо с итогом и долями этапов.' },
    { id: 'deals', title: 'Новые и закрытые сделки', description: 'Столбцы по месяцам с легендой.' },
    { id: 'sources', title: 'Заявки по источникам', description: 'Три линии за 12 недель.' },
    { id: 'ranking', title: 'Рейтинг менеджеров', description: 'Горизонтальные полосы одного цвета.' },
    { id: 'shares', title: 'Доли источников', description: 'Одна полоса из частей с легендой.' },
  ],
};

export default meta;
