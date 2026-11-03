import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'layout',
  status: 'beta',
  title: 'Раскладка',
  description:
    'Стек, сетка, контейнер и секция — классы Tailwind на токенах, без своего CSS. Три сетки на всё: 4 колонки на телефоне, 8 на планшете, 12 на десктопе. Колонки резиновые, поля и промежутки растут ступенями 16 → 24 → 32. Шире 1200 контент не растягиваем — дальше растут только поля.',
  category: 'content',
  paperBoard: 'R3B-0',
  anatomy: [
    'Брейкпоинты по min-width: sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536',
    'Сетка: 4 колонки, промежуток 16 · от 768 — 8 и 24 · от 1024 — 12 и 24',
    'Поля контейнера: 16 · от 640 — 24 · от 1024 — 32, не меньше safe-area слева и справа',
    'Контейнеры: prose 680 · md 960 · lg 1200 · xl 1440 — ширина содержимого, поля снаружи',
    'Секция: фон во всю ширину, содержимое по контейнеру; сверху и снизу 48 / 80 / 96',
    'Стек: отступы из шкалы — внутри группы 8–16, между группами 24, между секциями 32–48',
  ],
  related: ['typography', 'card', 'site-footer', 'table-of-contents', 'separator'],
  source: { file: 'components/layout.tsx', exports: ['Stack', 'Grid', 'GridItem', 'Container', 'Section', 'STACK_GAPS'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  propsOf: 'Stack',
  props: [
    { name: 'direction', type: 'enum', options: ['column', 'row'], default: 'column', description: 'column — одно под другим · row — в строку.' },
    {
      name: 'gap',
      type: 'enum',
      options: [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
      default: 4,
      description: 'Шаг шкалы отступов × 4 px: 2 = 8 и 4 = 16 внутри группы, 6 = 24 между группами, 8–12 = 32–48 между секциями.',
    },
    { name: 'align', type: 'enum', options: ['start', 'center', 'end', 'stretch', 'baseline'], description: 'Выравнивание поперёк оси; не задано — stretch.' },
    { name: 'justify', type: 'enum', options: ['start', 'center', 'end', 'between'], description: 'Распределение вдоль оси.' },
    { name: 'wrap', type: 'boolean', default: false, description: 'В строке: переносить на следующую строку, а не сжимать.' },
    { name: 'render', type: 'node', signature: 'ReactElement', control: false, description: 'Другой тег: render={<ul />}, render={<form />}.' },
    { name: 'className', type: 'string', control: false, description: 'Классы поверх; остальные атрибуты div тоже передаются.' },
  ],
  parts: [
    {
      name: 'Grid',
      description: 'Колонки 1fr: 4 на телефоне, 8 от 768, 12 от 1024; промежуток 16, от 768 — 24. Поля сетке не нужны — их даёт Container. Принимает render и атрибуты div.',
      props: [{ name: 'children', type: 'node', description: 'GridItem.' }],
    },
    {
      name: 'GridItem',
      description: 'Ячейка сетки. Ширину задаём числом колонок — span, а не пикселями. Ступень, которую не задали, берёт значение ступени ниже.',
      props: [
        {
          name: 'span',
          type: 'object',
          signature: "number | 'full' | Partial<Record<'base' | 'sm' | 'md' | 'lg' | 'xl', number | 'full'>>",
          default: 'full',
          description: 'Число колонок на всех экранах или по ступеням: { base: 2, md: 4, lg: 7 }. full — вся строка при любом числе колонок.',
        },
      ],
    },
    {
      name: 'Container',
      description: 'Ограничивает ширину содержимого, а не страницы: по центру, поля снаружи этой ширины и не меньше безопасной зоны. На 1440 у lg поля по 120, ужаться могут до 32.',
      props: [
        {
          name: 'size',
          type: 'enum',
          options: ['prose', 'md', 'lg', 'xl'],
          default: 'lg',
          description: 'prose 680 — статьи, длинные формы, письма · md 960 — настройки, мастер, карточка записи · lg 1200 — лендинг, отчёты · xl 1440 — контент админки, широкие таблицы.',
        },
      ],
    },
    {
      name: 'Section',
      description: '<section>: фон тянется во всю ширину, содержимое — в контейнере. Поставьте фон классом: className="bg-surface-1".',
      props: [
        { name: 'spacing', type: 'enum', options: ['page', 'landing', 'hero'], default: 'page', description: 'Сверху и снизу: page 48 — секции страницы · landing 80 — секции лендинга · hero 96 — первый экран.' },
        { name: 'container', type: 'enum', signature: "'prose' | 'md' | 'lg' | 'xl' | false", options: ['prose', 'md', 'lg', 'xl'], default: 'lg', description: 'Размер контейнера для содержимого; false — содержимое во всю ширину.' },
      ],
    },
    {
      name: 'STACK_GAPS',
      description: 'Шаги шкалы, которые принимает gap: 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24.',
      props: [],
    },
  ],
  slots: [
    { name: 'stack', description: 'Stack: flex, направление, gap.' },
    { name: 'grid', description: 'Grid: grid-cols 4 / 8 / 12.' },
    { name: 'grid-item', description: 'GridItem: grid-column из --kv-col, --kv-col-sm … --kv-col-xl.' },
    { name: 'container', description: 'Container: data-size, max-width по токену --container-*, поля.' },
    { name: 'section', description: 'Section: <section> с вертикальными отступами.' },
  ],
  states: [{ id: 'rest', label: 'покой', description: 'Раскладка не интерактивна: состояний нет, меняется только ступень брейкпоинта.' }],
  keyboard: [],
  a11y: [
    'Раскладка не меняет порядок чтения: диктор и Tab идут по DOM. Не переставляйте блоки только визуально (order, row-reverse), если порядок важен по смыслу.',
    'Section — ориентир region, только если у неё есть имя: aria-label или aria-labelledby на заголовок.',
    'Нажимаемое никогда не попадает в безопасную зону: поля контейнера не меньше safe-area-inset слева и справа. Фото, карты и горизонтальные ленты могут выходить в поля до края экрана.',
    'Stack с render={<ul />} остаётся списком — диктор читает число пунктов.',
  ],
  motion: [
    { label: 'Смена ступени брейкпоинта', value: 'не анимируется', easing: 'instant' },
    {
      label: 'Сайдбар 256 ↔ 64',
      value: 'ширина 200 мс · ease-standard, колонки контента перетекают вместе с ней',
      easing: 'ease-standard',
      note: 'Сетка не перестраивается: колонки просто становятся шире.',
      tokens: ['duration-base'],
    },
  ],
  examples: [
    { id: 'landing', title: 'Лендинг · 1440', description: 'Секции во всю ширину, содержимое в контейнере 1200: span 7 + 5, три по 4. На телефоне всё в столбик.' },
    { id: 'dashboard', title: 'Сводка · 4 → 8 → 12', description: 'Показатели span 2 на телефоне, 2 на планшете, 3 на десктопе; воронка 8 + задачи 4; таблица на всю строку.' },
  ],
};

export default meta;
