import type { PropMeta, ReadyComponentMeta } from '../types';

const ariaLabel: PropMeta = { name: 'aria-label', type: 'string', required: true, description: 'Что показывает график; данные дублируются скрытой таблицей для экранного диктора.', control: false };
const formatValue: PropMeta = { name: 'formatValue', type: 'function', signature: '(value: number) => string', description: 'Формат значения в подсказке, таблице и объявлении: рубли, «тыс ₽».', control: false };
const legend: PropMeta = { name: 'legend', type: 'boolean', control: false, description: 'Легенда-кнопки над графиком; по умолчанию — когда групп или серий больше одной. Нажатие скрывает группу, остальное пересчитывается до 100 %.' };
const groupedData: PropMeta = {
  name: 'data',
  type: 'object',
  required: true,
  signature: 'readonly { label: string; value: number; group?: string }[]',
  description: 'Части целого; group задаёт цвет (линейка, а не ранг) и пункт легенды.',
  control: false,
};
const partData: PropMeta = { name: 'data', type: 'object', required: true, signature: 'readonly { label: string; value: number; color?: string }[]', description: 'Части целого.', control: false };
const nodeData: PropMeta = {
  name: 'data',
  type: 'object',
  required: true,
  signature: 'readonly { label: string; value?: number; color?: string; children?: readonly { label: string; value: number }[] }[]',
  description: 'Два уровня: линейки и их продукты. Значение линейки — сумма детей.',
  control: false,
};
const seriesData = (what: string): PropMeta => ({
  name: 'series',
  type: 'object',
  required: true,
  signature: 'readonly { name: string; values: readonly number[]; color?: string }[]',
  description: `Серии, по значению на ${what}; цвета chart-1, chart-2 и далее.`,
  control: false,
});

const meta: ReadyComponentMeta = {
  id: 'chart-parts',
  status: 'beta',
  title: 'Части целого',
  description:
    'Из чего состоит? Пирог, полосы 100 %, treemap, sunburst, icicle, вафля, маримекко, роза Найтингейл, парламентская дуга, Венн и Эйлер, Voronoi treemap, упаковка кругов. Все раскладки считаются здесь же и детерминированно: squarified, наибольший остаток, места по рядам, взвешенная диаграмма Вороного, жадная упаковка. Наведение и ← → подсвечивают часть и показывают подсказку; легенда скрывает группу, и остальное снова складывается в 100 %. Для отчётов и сравнения долей — полосы 100 % и treemap, остальное — для витрин и обзора.',
  category: 'charts',
  paperBoard: '1P3D-0',
  anatomy: [
    'Легенда-кнопки h28 над графиком (группы или серии)',
    'Части: секторы, плитки, клетки, точки или ячейки цветов chart-1…8',
    'Разделитель цвета поверхности 2 или зазор 2',
    'Подписи fg-1 внутри части, если влезают; иначе число или ничего',
    'Выноски fg-3 и подписи снаружи у пирога и sunburst',
    'Итог в центре: sunburst, парламентская дуга',
    'Подсказка overlay r12 у части',
    'Скрытая таблица и live-регион для диктора',
  ],
  related: ['chart', 'chart-hierarchy', 'chart-comparison', 'chart-trend', 'card'],
  source: {
    file: 'components/chart-parts.tsx',
    exports: [
      'TreemapChart',
      'PercentBarChart',
      'PieChart',
      'SunburstChart',
      'IcicleChart',
      'WaffleChart',
      'MarimekkoChart',
      'NightingaleChart',
      'ParliamentChart',
      'VennChart',
      'VoronoiTreemapChart',
      'CirclePackingChart',
    ],
  },
  dependencies: { npm: [], registry: [] },
  propsOf: 'TreemapChart',
  props: [
    ariaLabel,
    groupedData,
    { name: 'height', type: 'number', options: [200, 260, 320], default: 260, description: 'Высота области, px.' },
    formatValue,
    legend,
  ],
  parts: [
    {
      name: 'PercentBarChart',
      description: 'Каждая строка — 100 %: высота 24, шаг 36, сегменты через зазор 2, скругление 4 только у краёв строки, доля fg-1 внутри сегмента от 40 px. Подпись строки 13 fg-2 справа до колонки 128.',
      props: [
        ariaLabel,
        { name: 'labels', type: 'object', required: true, signature: 'readonly string[]', description: 'Строки: «Москва», «Казань».', control: false },
        seriesData('строку'),
        formatValue,
        legend,
      ],
    },
    {
      name: 'PieChart',
      description: 'Только для 2–4 долей одного момента: старт сверху по часовой, крупное первым, разделитель поверхности 2, подписи снаружи с выноской. Уже 460 px — список долей под пирогом.',
      props: [ariaLabel, partData, formatValue],
    },
    {
      name: 'SunburstChart',
      description: 'Два уровня, не больше: внутреннее кольцо 42–82 — линейка, внешнее 86–128 — продукт её цвета; зазор 4 между кольцами, 2 между секторами, итог в центре. Подписи продуктов снаружи от 520 px.',
      props: [
        ariaLabel,
        nodeData,
        { name: 'formatTotal', type: 'function', signature: '(total: number) => string', description: 'Число в центре, например «18,4».', control: false },
        { name: 'totalLabel', type: 'string', description: 'Подпись под итогом: «млн ₽».' },
        formatValue,
        legend,
      ],
    },
    {
      name: 'IcicleChart',
      description: 'Прямоугольный аналог sunburst: корень surface-3, линейки и продукты рядами 72 через зазор 2, ширина = доля итога; подпись, если сегмент шире 52.',
      props: [
        ariaLabel,
        nodeData,
        { name: 'rootLabel', type: 'string', default: 'Всего', description: 'Имя корня: «Выручка».' },
        { name: 'rowHeight', type: 'number', default: 72, description: 'Высота каждого из трёх рядов, px.' },
        formatValue,
        { ...legend, default: false, description: 'Легенда линеек над графиком; выключена — ряды подписаны.' },
      ],
    },
    {
      name: 'WaffleChart',
      description: 'Сетка 10 × 10, клетка 22, зазор 4, скругление 3; клетки раздаются наибольшим остатком, заполнение снизу вверх по столбцам. Легенда справа: «46 из 100 · 46 %». Честнее пирога для «сколько из ста».',
      props: [ariaLabel, partData, formatValue],
    },
    {
      name: 'MarimekkoChart',
      description: 'Ширина столбца — доля столбца в целом, высота сегмента — доля внутри столбца: площадь = доля всего рынка. Зазоры 2, первая серия снизу, доли внутри столбцов от 64 px. Не больше 6 столбцов и 4 сегментов.',
      props: [
        ariaLabel,
        { name: 'labels', type: 'object', required: true, signature: 'readonly string[]', description: 'Столбцы: регионы, сегменты рынка.', control: false },
        seriesData('столбец'),
        { name: 'height', type: 'number', default: 220, description: 'Высота области без подписей столбцов, px.' },
        { name: 'shareSuffix', type: 'string', default: 'рынка', description: 'Слово после доли столбца: «38 % рынка».' },
        formatValue,
        legend,
      ],
    },
    {
      name: 'NightingaleChart',
      description: 'Роза: равные углы от 12 часов по часовой, радиус ∝ √значения, иначе площадь врёт; кольца на половине и максимуме. Фокус — chart-1, остальное seq-3. Для цикличных данных и витрин.',
      props: [
        ariaLabel,
        partData,
        { name: 'highlight', type: 'object', signature: 'readonly string[]', description: 'Подписи частей в фокусе; без него все секторы цветные.', control: false },
        { name: 'legendLabels', type: 'object', signature: '{ base: string; highlight: string }', description: 'Статичная легенда двух цветов: «Месяц», «Последний квартал».', control: false },
        formatValue,
      ],
    },
    {
      name: 'ParliamentChart',
      description: 'Полукруг рядов, точка 14 на каждую единицу; места раздаются по длине ряда и сортируются по углу, отделы идут клиньями слева направо. Итог в центре, «прочее» — fg-4. Для состава, где важна каждая единица.',
      props: [
        ariaLabel,
        { name: 'data', type: 'object', required: true, signature: 'readonly { label: string; value: number; color?: string; other?: boolean }[]', description: 'Части в порядке слева направо; value — целые единицы.', control: false },
        { name: 'rows', type: 'number', description: 'Рядов мест; по умолчанию по числу мест, 5 для ~120.' },
        { name: 'totalLabel', type: 'string', description: 'Подпись под итогом: «сотрудников».' },
        formatValue,
      ],
    },
    {
      name: 'VennChart',
      description: 'Только контуры 2,5 цветов множеств — заливку без прозрачности не наложить; в каждой области число ровно этой комбинации. По умолчанию круги равные, числа главнее; proportional — Эйлер с площадями кругов и попарных пересечений по данным. Больше 3 множеств — UpSet-диаграмма.',
      props: [
        ariaLabel,
        { name: 'sets', type: 'object', required: true, signature: 'readonly { label: string; legend?: string; color?: string }[]', description: 'Два или три множества; legend — текст легенды: «Купили кассу».', control: false },
        { name: 'regions', type: 'object', required: true, signature: 'readonly { sets: readonly string[]; value: number }[]', description: 'Области: в каких множествах и больше ни в каких.', control: false },
        { name: 'proportional', type: 'boolean', default: false, description: 'Эйлер: площади кругов ∝ размерам множеств, попарные пересечения ∝ общим; тройное — приближённо.' },
        { name: 'height', type: 'number', default: 304, description: 'Высота области, px.' },
        formatValue,
      ],
    },
    {
      name: 'VoronoiTreemapChart',
      description: 'Взвешенная диаграмма Вороного в круге: ячейки подгоняются итерациями весов, суммарная ошибка площадей меньше 0,3 %. Граница поверхности 2, имя от 9 %, иначе число. Для витрин; в отчётах — treemap.',
      props: [ariaLabel, groupedData, formatValue, legend],
    },
    {
      name: 'CirclePackingChart',
      description: 'Площадь круга ∝ значению, зазор 1,5, плотная упаковка на подложке fill-1 — границе целого. Имя и значение внутри, если помещаются, иначе короткое число. Сравнивать размеры трудно — для обзора.',
      props: [ariaLabel, groupedData, formatValue, legend],
    },
  ],
  slots: [
    { name: 'parts-chart', description: 'Корень графика; несёт data-kind: pie, percent-bar, treemap и далее.' },
    { name: 'parts-chart-mark', description: 'Одна часть: сектор, сегмент, плитка, клетка, место или ячейка; геометрия в data-атрибутах.' },
    { name: 'parts-chart-leader', description: 'Выноска подписи пирога.' },
    { name: 'parts-chart-list', description: 'Список долей: под узким пирогом, легенда вафли и парламентской дуги.' },
    { name: 'parts-chart-total', description: 'Итог в центре sunburst и парламентской дуги.' },
    { name: 'parts-chart-set', description: 'Контур множества в диаграмме Венна.' },
    { name: 'parts-chart-bound', description: 'Граница целого: круг Voronoi treemap и подложка упаковки.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Все части в полную силу, без подсказки.' },
    { id: 'highlighted', label: 'часть', description: 'Наведение или ← →: часть и её родитель или группа в полную силу, остальные 30 %, подсказка overlay; в Венне область заливается fill-3.' },
    { id: 'unchecked', label: 'группа скрыта', description: 'Легенда: контур fg-4 и зачёркивание; оставшиеся части снова складываются в 100 %.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Легенда, затем область графика' },
    { keys: ['←', '→'], action: 'Соседняя часть: подсветка, подсказка и объявление значения и доли' },
    { keys: ['Home', 'End'], action: 'Первая или последняя часть' },
    { keys: ['Enter', 'Space'], action: 'В легенде: скрыть или показать группу' },
  ],
  a11y: [
    'Область графика — group «график» с названием; рядом скрытая таблица со всеми значениями и долями.',
    'Выбранная клавишами часть объявляется через aria-live: «Склад Pro: 4 048, 22,0 % · Склад».',
    'Легенда — кнопки с aria-pressed; цвет всегда подписан словом, мелкие части доступны через подсказку и таблицу.',
    'Подписи внутри частей fg-1: в светлой теме 4,7:1 на chart-*.',
  ],
  motion: [
    { label: 'Секторы, роза, Voronoi', value: 'вырастают из центра scale 0,75 → 1 и opacity, 300 мс ease-standard, один раз', tokens: ['duration-slow', 'ease-standard'], reduced: '150 мс' },
    { label: 'Полосы и icicle', value: 'растут слева направо 300 мс, шаг 35 мс по строкам, 90 мс по уровням', tokens: ['duration-slow'], reduced: '150 мс' },
    { label: 'Маримекко', value: 'сегменты растут от базы 300 мс, шаг 35 мс по столбцам', tokens: ['duration-slow'], reduced: '150 мс' },
    { label: 'Вафля, места, круги', value: 'появляются из точки 300 мс волной: шаг 4, 3 и 30 мс', tokens: ['duration-slow'], reduced: '150 мс' },
    { label: 'Подсветка части', value: 'остальные приглушаются до 30 %, 150 мс; без отскоков', tokens: ['duration-quick'] },
  ],
  examples: [
    { id: 'percent-bars', title: 'Доля каналов по городам', description: 'Полосы 100 %, легенда скрывает канал.' },
    { id: 'treemap', title: 'Структура выручки', description: 'Squarified treemap, цвет — линейка.' },
    { id: 'pie', title: 'Выручка по каналам', description: 'Пирог из четырёх долей с выносками.' },
    { id: 'sunburst', title: 'Структура выручки по линейкам', description: 'Два кольца и итог в центре.' },
    { id: 'icicle', title: 'Иерархия выручки', description: 'Корень, линейки и продукты рядами.' },
    { id: 'waffle', title: 'Каналы: 100 клеток', description: 'Одна клетка — 1 % выручки.' },
    { id: 'marimekko', title: 'Рынок по регионам и каналам', description: 'Ширина — доля региона, высота — доля канала.' },
    { id: 'rose', title: 'Выручка по месяцам: роза', description: 'Последний квартал в фокусе.' },
    { id: 'parliament', title: 'Команда по отделам', description: 'Одна точка — один человек.' },
    { id: 'venn', title: 'Пересечение продуктов', description: 'Три множества, числа по комбинациям.' },
    { id: 'voronoi', title: 'Продукты в форме круга', description: 'Voronoi treemap из 11 продуктов.' },
    { id: 'packing', title: 'Продукты кругами', description: 'Упаковка кругов по выручке.' },
  ],
};

export default meta;
