import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'typography',
  status: 'beta',
  title: 'Типографика',
  description:
    'Длинный текст: статьи справки, договоры, описания тарифов. Prose берёт обычный HTML или то, что отрисовал Markdown, и ставит его в колонку 680 — около 70 знаков в строке — с интерлиньяжем 28 вместо интерфейсных 24: глазу легче вернуться к началу строки. Заголовки, лид, списки, цитата, код в строке, ссылки и сноски получают ритм без классов на каждом теге. Шкала интерфейса — 19 стилей на токенах — это утилиты text-heading-*, text-body-*, text-label-*, text-caption и text-overline: отдельных компонентов для заголовков нет.',
  category: 'content',
  paperBoard: '1GJ-0',
  anatomy: [
    'Колонка 680 · container-prose',
    'Заголовок 1: 28/36 600 −0.002em · сверху 0 · снизу 12',
    'Лид: 18/28 400 −0.006em · fg-2 · первый абзац после h1',
    'Заголовок 2: 20/28 600 −0.007em · сверху 40 · снизу 12',
    'Заголовок 3: 16/24 600 −0.009em · сверху 32 · снизу 8',
    'Абзац: 16/28 400 −0.007em · fg-1 · между абзацами 16',
    'Списки: маркер 5 fg-3 · номер 500 tabular · отступ 24 · шаг 8',
    'Цитата: 18/28 fg-1 · линия 1 fg-4 · отступ 20 · подпись 13/18 fg-3',
    'Код в строке: JetBrains Mono 14/20 · fill-2 · r 6 · px 5 · h 22',
    'Ссылка: accent-soft-fg · линия 1, отступ 3 · наведение accent-hover',
    'Сноска: номер accent-soft-fg 500 · текст 13/18 fg-3 · линия 48 border',
  ],
  related: ['link', 'code-block', 'kbd', 'separator', 'layout'],
  source: { file: 'components/typography.tsx', exports: ['Prose'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    {
      name: 'children',
      type: 'node',
      required: true,
      control: false,
      description:
        'Блоки статьи прямыми детьми: h1–h3, p, ul, ol, blockquote (подпись — <footer>), section data-footnotes. Внутри — a, code, strong, sup со ссылкой data-footnote-ref. Так отдаёт HTML Markdown с GFM-сносками.',
    },
    { name: 'render', type: 'node', signature: 'ReactElement', control: false, description: 'Другой тег вместо div: статья справки — render={<article />}.' },
    { name: 'className', type: 'string', control: false, description: 'Отступы колонки на странице. Ширину 680 не расширяйте: длиннее 75 знаков строку трудно дочитать.' },
  ],
  slots: [{ name: 'prose', description: 'Колонка длинного текста: max-w-prose, 16/28, переносы в тексте.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Ссылки accent-soft-fg с линией 1.' },
    { id: 'hover', label: 'наведение', description: 'Ссылка становится accent-hover за 75 мс.', selector: ':hover · accent-hover' },
    { id: 'highlighted', label: 'переход к сноске', description: 'Цель ссылки внутри статьи получает фокус и подсветку fill-2, которая гаснет за 1500 мс.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'По ссылкам статьи' },
    { keys: ['Enter'], action: 'Ссылка на сноску — к сноске, фокус на ней; ссылка «назад» — к месту в тексте' },
  ],
  a11y: [
    'Заголовки — настоящие h1–h3 по порядку: по ним диктор строит оглавление статьи. Уровень не выбирают по размеру.',
    'Ссылка в тексте всегда подчёркнута: цвет не единственный признак (WCAG 1.4.1).',
    'Сноска — ссылка с номером к элементу с id внутри статьи. Переход ставит на цель фокус (tabindex="-1", без кольца), так что следующий Tab идёт от сноски, а не от верха страницы.',
    'Переносы — только в тексте: hyphens: auto и lang на странице (lang="ru"). Заголовки не переносятся.',
  ],
  motion: [
    { label: 'Ссылка', value: 'цвет · 75 мс · ease-hover', easing: 'ease-hover', tokens: ['duration-micro'] },
    {
      label: 'Переход к сноске',
      value: 'прокрутка браузера, smooth · подсветка fill-2 гаснет за 1500 мс',
      note: 'Макет просит 250 мс ease-standard: браузер прокручивает плавно, но со своей длительностью.',
      easing: 'ease-out',
      reduced: 'прыжок без прокрутки, подсветка остаётся',
    },
  ],
  examples: [
    { id: 'article', title: 'Длинный текст', description: 'Статья справки: заголовки, лид, списки, код в строке, цитата и сноска.' },
    { id: 'scale', title: 'Шкала интерфейса', description: '19 стилей на токенах: дисплей для лендинга, заголовки, текст, метки, данные и код.' },
  ],
};

export default meta;
