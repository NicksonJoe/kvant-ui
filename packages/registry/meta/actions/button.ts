import type { ReadyComponentMeta } from '../types';

const variants = ['primary', 'secondary', 'soft', 'outline', 'ghost', 'danger', 'danger-soft', 'link'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta: ReadyComponentMeta = {
  id: 'button',
  status: 'stable',
  title: 'Кнопка',
  description: 'Запускает действие. Капсула пяти высот и восьми вариантов; одна основная кнопка на экран.',
  category: 'actions',
  paperBoard: '1WB-0',
  anatomy: ['Корень — button', 'Ведущая иконка или спиннер', 'Подпись', 'Замыкающая иконка'],
  related: ['button-group', 'toggle-button', 'link', 'copy-button', 'spinner'],
  source: {
    file: 'components/button.tsx',
    exports: ['Button', 'IconButton', 'CloseButton', 'buttonClasses', 'BUTTON_VARIANTS', 'BUTTON_SIZES'],
  },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['spinner'] },
  props: [
    {
      name: 'variant',
      type: 'enum',
      options: variants,
      default: 'primary',
      description: 'Вид. primary — главное действие экрана, danger — необратимое, link — переход.',
    },
    {
      name: 'size',
      type: 'enum',
      options: sizes,
      default: 'md',
      description: 'Высота 24 / 32 / 36 / 44 / 52 px: md — для указателя, lg — для касания, xl — главная кнопка на телефоне.',
    },
    { name: 'children', type: 'string', signature: 'ReactNode', description: 'Подпись: глагол в инфинитиве, «Сохранить».' },
    { name: 'loading', type: 'boolean', default: false, description: 'Спиннер вместо ведущей иконки, без неё — вместо замыкающей; ширина не меняется, нажатия блокируются.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступна: прозрачность 50 %, без отклика.' },
    { name: 'leadingIcon', type: 'node', description: 'Иконка перед подписью: 16 px, у lg и xl — 20 px.', control: false },
    { name: 'trailingIcon', type: 'node', description: 'Иконка после подписи: шеврон меню, стрелка перехода.', control: false },
    { name: 'render', type: 'node', signature: 'ReactElement', description: 'Другой элемент с видом кнопки, например ссылка роутера.', control: false },
  ],
  parts: [
    {
      name: 'IconButton',
      description: 'Круглая кнопка без подписи. Маленькие размеры получают зону касания 44 px.',
      props: [
        { name: 'icon', type: 'node', required: true, description: 'Иконка.' },
        { name: 'aria-label', type: 'string', required: true, description: 'Название действия для экранного диктора; продублируйте его подсказкой.' },
        { name: 'variant', type: 'enum', options: variants, default: 'ghost', description: 'Вид, как у Button.' },
        { name: 'size', type: 'enum', options: sizes, default: 'md', description: 'Диаметр 24–52 px.' },
        { name: 'loading', type: 'boolean', default: false, description: 'Спиннер вместо иконки.' },
      ],
    },
    {
      name: 'CloseButton',
      description: 'Круг 32 px с крестиком 16 px для диалогов, шитов и уведомлений.',
      props: [
        { name: 'appearance', type: 'enum', options: ['ghost', 'filled'], default: 'ghost', description: 'filled — на подложке fill-2, для шитов и медиа.' },
        { name: 'aria-label', type: 'string', default: 'Закрыть', description: 'Название для экранного диктора.' },
      ],
    },
  ],
  slots: [
    { name: 'button', description: 'Корень кнопки; несёт data-variant и data-size.' },
    { name: 'button-label', description: 'Подпись; во время загрузки кнопки без иконок становится невидимой, но держит ширину.' },
    { name: 'icon-button', description: 'Корень кнопки-иконки.' },
    { name: 'close-button', description: 'Кнопка закрытия.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Цвет варианта, у основной — внутренний блик и микротень.' },
    { id: 'hover', label: 'наведение', description: 'Фон на шаг темнее (accent-hover, fill-1). Только для мыши и трекпада.' },
    { id: 'pressed', label: 'нажатие', description: 'Фон accent-pressed, вдавленная тень, масштаб 0,97.', selector: ':active · scale .97' },
    { id: 'focus', label: 'фокус', description: 'Кольцо 2 px цвета ring с отступом 2 px; только при навигации с клавиатуры.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, без наведения и нажатия.', props: { disabled: true } },
    { id: 'loading', label: 'загрузка', description: 'Спиннер, aria-busy, ширина и фокус сохраняются.', props: { loading: true }, selector: 'aria-busy' },
  ],
  // rows and notes follow the Paper board «Кнопки»; token names are the ones in the code
  matrix: {
    rowsLabel: 'вариант',
    rows: [
      {
        label: 'Основная',
        props: { variant: 'primary', children: 'Сохранить', icon: 'check' },
        tokens: ['bg accent → hover → pressed', 'тень accent-control → pressed-accent'],
      },
      {
        label: 'Вторичная',
        props: { variant: 'secondary', children: 'Сохранить', icon: 'check' },
        tokens: ['bg control → hover → pressed', 'тень control → кольцо 1px'],
      },
      {
        label: 'Мягкая',
        props: { variant: 'soft', children: 'Сохранить', icon: 'check' },
        tokens: ['bg accent-soft → soft-hover', 'текст accent-soft-fg · без тени'],
      },
      {
        label: 'Контурная',
        props: { variant: 'outline', children: 'Сохранить', icon: 'check' },
        tokens: ['bg прозрачный → fill-1 → 2', 'кольцо inset 1px border'],
      },
      {
        label: 'Прозрачная',
        props: { variant: 'ghost', children: 'Сохранить', icon: 'check' },
        tokens: ['bg прозрачный → fill-1 → 2', 'иконка fg-2 → fg-1'],
      },
      {
        label: 'Опасная',
        props: { variant: 'danger', children: 'Удалить', icon: 'trash' },
        tokens: ['bg danger → danger-hover', 'тень accent-control → pressed-accent'],
      },
      {
        label: 'Опасная мягкая',
        props: { variant: 'danger-soft', children: 'Удалить', icon: 'trash' },
        tokens: ['bg danger-soft + fill-1 → 2', 'текст danger-soft-fg · без тени'],
      },
      {
        label: 'Ссылка',
        props: { variant: 'link', children: 'Все сделки', trailing: true },
        tokens: ['текст accent-soft-fg · без масштаба', 'подчёркивание 1px · offset 3'],
      },
    ],
    notes: [
      'h36 · px16 · gap 6 · r full · иконка 16, штрих 1.75 · 14/20 500 −0.007em · фокус outline 2 ring, offset 2 · отключено opacity .5, тень без изменений',
      'движение: наведение — фон 75ms ease-hover · нажатие — scale .97, 75ms ease-out · отпускание — spring micro 0.20/0 · спиннер 800ms/оборот linear',
    ],
  },
  anatomyMap: {
    values: { children: 'Сохранить', icon: 'check', trailing: true },
    parts: [
      {
        name: 'Корень',
        selector: '[data-slot=button]',
        description: 'Нативный button: капсула, фон варианта, тень и кольцо фокуса. Несёт data-variant и data-size.',
      },
      {
        name: 'Ведущая иконка',
        selector: '[data-slot=button] > svg:first-child',
        description: '16 px, штрих 1,75; у lg и xl — 20 px и 1,5. При загрузке её место занимает спиннер.',
      },
      {
        name: 'Подпись',
        selector: '[data-slot=button-label]',
        description: 'Глагол в инфинитиве. При загрузке без иконки становится невидимой, но держит ширину.',
      },
      { name: 'Замыкающая иконка', selector: '[data-slot=button] > svg:last-child', description: 'Шеврон меню или стрелка перехода после подписи.' },
    ],
  },
  keyboard: [
    { keys: ['Enter'], action: 'Нажимает кнопку' },
    { keys: ['Space'], action: 'Нажимает кнопку при отпускании; Esc во время нажатия отменяет' },
  ],
  a11y: [
    'Корень — нативный button: роль, фокус и нажатие с клавиатуры есть без лишнего кода.',
    'В загрузке кнопка получает aria-busy и остаётся в фокусе, чтобы экранный диктор не потерял место.',
    'У кнопки-иконки обязателен aria-label; дублируйте его подсказкой (Tooltip).',
    'Маленьким кнопкам-иконкам на сенсорных экранах зона нажатия расширяется до 44 px.',
    'Наведение работает только для мыши и трекпада; на касании остаётся отклик нажатия.',
  ],
  motion: [
    {
      label: 'Наведение',
      note: 'Меняется только фон',
      value: 'background-color · 75ms · ease-hover',
      detail: 'cubic-bezier(.25, .1, .25, 1) · только мышь и трекпад',
      easing: 'ease-hover',
      reduced: 'без изменений',
      tokens: ['duration-micro', 'ease-hover'],
    },
    {
      label: 'Нажатие',
      note: 'Капсула сжимается сразу',
      value: 'scale(.97) · 75ms · ease-out cubic-bezier(.23, 1, .32, 1)',
      detail: 'иконка ≤32 — .94 · xl — .98 · origin center',
      easing: 'ease-out',
      reduced: 'scale 1 — остаётся смена фона',
      tokens: ['scale-press', 'scale-press-wide', 'scale-press-icon', 'ease-out'],
    },
    {
      label: 'Отпускание',
      note: 'Возврат пружиной, без отскока',
      value: 'spring micro · 0.20 s · bounce 0 · k 987 · c 62.8 · m 1',
      detail: 'стартует с текущего scale — повторное нажатие не ждёт конца',
      easing: 'spring-micro',
      reduced: 'ease-out вместо пружины',
      tokens: ['spring-micro'],
    },
    {
      label: 'Фокус с клавиатуры',
      note: 'Кольцо появляется мгновенно',
      value: 'outline 2px ring · offset 2 · 0ms',
      detail: 'только :focus-visible — клик мышью кольцо не показывает',
      easing: 'instant',
      reduced: 'без изменений',
      tokens: ['duration-instant'],
    },
    {
      label: 'Загрузка',
      note: 'Спиннер на месте иконки',
      value: 'rotate 360° · 800ms на оборот · linear · бесконечно',
      detail: 'aria-busy · подпись и ширина не меняются · повторный клик игнорируется',
      easing: 'linear',
      reduced: '1600ms на оборот',
      tokens: ['duration-spinner', 'animate-spinner'],
    },
  ],
  examples: [
    { id: 'variants', title: 'Варианты', description: 'Одна основная кнопка на экран; рядом — второстепенные, мягкие и прозрачные.' },
    { id: 'sizes', title: 'Размеры', description: 'md — для указателя, lg — для касания, xl — главная кнопка мобильного экрана.' },
    { id: 'icons-and-loading', title: 'Иконки и загрузка', description: 'Спиннер встаёт на место ведущей иконки, ширина кнопки не прыгает.' },
    { id: 'icon-buttons', title: 'Кнопки-иконки', description: 'Без подписи, поэтому с aria-label и подсказкой.' },
  ],
};

export default meta;
