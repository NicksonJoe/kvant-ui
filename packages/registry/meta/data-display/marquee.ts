import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'marquee',
  status: 'beta',
  title: 'Бегущая строка',
  description:
    'Непрерывная лента логотипов клиентов или котировок. Логотипы в одном цвете fg-3 и одной высоте 24, края растворяются в фоне, лента идёт медленно и останавливается под курсором и при фокусе внутри. Ряд повторяется столько раз, сколько нужно, чтобы шов никогда не попал в кадр. При уменьшенном движении — неподвижный ряд по центру.',
  category: 'data-display',
  paperBoard: 'G16-0',
  anatomy: ['Подпись 14/20 fg-3 по центру, 24 над строкой', 'Окно h56 с растворением краёв 160', 'Лента: ряд и его копии', 'Элемент h24, шаг 64'],
  related: ['carousel', 'image', 'card'],
  source: { file: 'components/marquee.tsx', exports: ['Marquee'] },
  dependencies: { npm: [], registry: [] },
  props: [
    {
      name: 'children',
      type: 'node',
      required: true,
      control: false,
      description: 'Логотипы или котировки, каждый ребёнок — элемент списка. Рисуйте знаки в currentColor: лента красит их в fg-3. Цветные логотипы не используйте.',
    },
    { name: 'caption', type: 'string', description: 'Строка над лентой: «Норде доверяют 1 200 студий и агентств». Она же — имя списка для диктора.' },
    { name: 'aria-label', type: 'string', description: 'Имя списка, когда подписи нет: «Клиенты».' },
    { name: 'duration', type: 'number', options: [20, 40, 60], default: 40, description: 'Секунд на круг — один ряд уезжает за это время. Длинный ряд едет быстрее: подберите так, чтобы название успевали прочитать.' },
    { name: 'gap', type: 'number', options: [40, 64], default: 64, description: 'Шаг между элементами, px.' },
    { name: 'fade', type: 'number', options: [64, 160], default: 160, description: 'Ширина растворения у каждого края, px. Это маска, а не градиент цвета фона, поэтому лента растворяется и на карточке.' },
    { name: 'className', type: 'string', control: false, description: 'Корень: колонка подписи и окна.' },
  ],
  slots: [
    { name: 'marquee', description: 'Корень: колонка, gap 24, цвет fg-3.' },
    { name: 'marquee-caption', description: 'Подпись над лентой, 14/20 fg-3 по центру.' },
    { name: 'marquee-viewport', description: 'Окно h56 с overflow hidden и маской растворения краёв; под курсором и при фокусе внутри лента стоит.' },
    { name: 'marquee-track', description: 'Лента, которая едет: --kv-marquee-duration и --kv-marquee-copies.' },
    { name: 'marquee-list', description: 'Ряд элементов; копии — aria-hidden и inert, Tab и диктор их не видят.' },
    { name: 'marquee-item', description: 'Элемент h24.' },
  ],
  states: [
    { id: 'rest', label: 'идёт', description: 'Лента едет влево с постоянной скоростью, круг 40 с.' },
    { id: 'hover', label: 'под курсором', description: 'Лента стоит, пока курсор над ней.', selector: ':hover · animation-play-state paused' },
    { id: 'focus', label: 'фокус внутри', description: 'Лента стоит, пока фокус на ссылке в ней.', selector: ':focus-within · paused' },
  ],
  keyboard: [{ keys: ['Tab'], action: 'По ссылкам первого ряда; лента стоит, пока фокус внутри' }],
  a11y: [
    'Ряд — список ul с именем из caption или aria-label. Диктор читает его один раз: копии aria-hidden и inert, ссылки в них не попадают в Tab.',
    'Под курсором и при фокусе внутри лента останавливается: название можно дочитать и нажать.',
    'prefers-reduced-motion и data-reduce-motion выключают движение: остаётся один неподвижный ряд по центру, края так же растворяются.',
    'Лента — украшение рядом с главным: не прячьте в неё то, что нужно прочитать полностью.',
  ],
  motion: [
    {
      label: 'Лента',
      value: 'translateX на один ряд · 40 с на круг · linear · бесшовно',
      note: 'Скорость постоянная, без разгона и торможения: шов между рядами не виден.',
      easing: 'linear',
      reduced: 'неподвижный ряд по центру',
    },
    { label: 'Под курсором и при фокусе', value: 'пауза на месте', note: 'Продолжает с того же места, без рывка.', easing: 'instant' },
  ],
  examples: [
    { id: 'logos', title: 'Логотипы клиентов', description: 'Восемь знаков fg-3 с подписью, круг 40 с.' },
    { id: 'rates', title: 'Курсы валют на карточке', description: 'Котировки с изменением, шаг 40, растворение 64 — маска работает и на surface-1.' },
  ],
};

export default meta;
