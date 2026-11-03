import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'portal',
  status: 'beta',
  title: 'Портал и слои',
  description:
    'Portal выносит свой слой в конец <body> — из-под overflow: hidden, transform и contain родителей — и ставит его на шкалу z-index. Шкала LAYERS — семь значений на всю библиотеку: тост выше диалога, чтобы подтверждение было видно поверх окна, подсказка выше всего. Меню, поповеры, диалоги, шиты и тосты Kvant уже выносятся через Base UI; Portal нужен для слоёв, которые вы собираете сами.',
  category: 'utilities',
  paperBoard: 'RHI-0',
  anatomy: [
    'Портал: обёртка в конце <body>',
    'Слой: relative + z-index из шкалы — один контекст наложения',
    'content 0 — лента, карточки, таблицы',
    'sticky 10 — липкие шапки, панели навигации',
    'dropdown 40 — меню, выпадающие списки, поповеры',
    'overlay 50 — затемнение под модальным окном',
    'modal 60 — диалоги, шиты, палитра команд',
    'toast 70 — тосты, видны и поверх диалога',
    'tooltip 80 — подсказки, всегда сверху',
  ],
  related: ['popover', 'dialog', 'toast', 'tooltip', 'focus-management', 'presence'],
  source: { file: 'components/portal.tsx', exports: ['Portal', 'LAYERS'] },
  dependencies: { npm: [], registry: [] },
  props: [
    {
      name: 'layer',
      type: 'enum',
      options: ['content', 'sticky', 'dropdown', 'overlay', 'modal', 'toast', 'tooltip'],
      required: true,
      description: 'Место на шкале LAYERS. Весь портал — один контекст наложения на этой высоте: всё внутри него, даже z-index 9999, остаётся на своём слое.',
    },
    {
      name: 'container',
      type: 'object',
      signature: 'Element | null',
      control: false,
      description: 'Куда выносить, по умолчанию <body>. Передайте элемент с data-accent и data-mode, если слой живёт внутри локальной темы: в <body> она не действует.',
    },
    { name: 'children', type: 'node', required: true, control: false, description: 'Содержимое слоя; обычно position: fixed или absolute.' },
  ],
  parts: [
    {
      name: 'LAYERS',
      description:
        'Шкала z-index: { content: 0, sticky: 10, dropdown: 40, overlay: 50, modal: 60, toast: 70, tooltip: 80 }. Значения 11–39 — запас для слоёв продукта (плавающие панели, закреплённые колонки): новый слой берёт значение из шкалы, а не «на единицу выше соседа». Произвольные 999 и 9999 запрещены.',
      props: [],
    },
  ],
  slots: [{ name: 'portal', description: 'Обёртка в конце <body>: data-layer, position: relative и z-index слоя.' }],
  states: [
    { id: 'rest', label: 'смонтирован', description: 'Обёртка стоит последней в <body>, содержимое рисуется поверх слоёв ниже по шкале. При серверной отрисовке и гидратации портал ничего не рендерит: <body> есть только в браузере.' },
  ],
  keyboard: [],
  a11y: [
    'Портал меняет место в DOM, но не порядок Tab относительно кнопки-триггера: фокус в слой переводите сами — FocusTrap делает это при появлении и возвращает фокус при исчезновении.',
    'Экранный диктор читает содержимое портала в конце документа: связывайте его с триггером через aria-controls, aria-describedby или подпись.',
    'Слой ниже по шкале не перекроет верхний: тост поверх диалога остаётся видимым и доступным.',
  ],
  motion: [{ label: 'Портал', value: 'без анимации', note: 'Появление и уход слоя задаёт Presence или рецепт компонента.' }],
  examples: [
    { id: 'escape', title: 'Из-под обрезки', description: 'Карточка с overflow: hidden и transform ловит fixed-заметку внутри себя; через Portal заметка встаёт у края окна.' },
    { id: 'layers', title: 'Порядок слоёв', description: 'Семь слоёв в разметке идут сверху вниз, а на экране порядок задаёт только шкала LAYERS.' },
  ],
};

export default meta;
