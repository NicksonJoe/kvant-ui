import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'table-of-contents',
  status: 'beta',
  title: 'Оглавление',
  description:
    'Навигация по длинной странице, которая следит за прокруткой: текущий раздел отмечен точкой на линии, прочитанные — fg-2, впереди — fg-3. От 1024 — колонка 240 справа от статьи, приклеенная на 88 от верха; на узком экране сворачивается в капсулу «Раздел 3 из 5» с полоской прогресса, которая открывает тот же список.',
  category: 'navigation',
  paperBoard: '9XO-0',
  anatomy: [
    'Подпись «На этой странице» 12/16 500 fg-3, отступ 16 от линии',
    'Линия 1 separator на всю высоту списка',
    'Пункт 13/18, py 4, отступ 16 от линии; вложенный — 28',
    'Точка 7 accent с кольцом 2 цвета страницы — на линии против текущего пункта',
    '«Наверх» 13/16 500 fg-3 со стрелкой 14, на 12 ниже списка',
    'Узкий экран: капсула h40 surface-1 и полоска h2 — сегмент на раздел',
  ],
  related: ['back-to-top', 'typography', 'tabs', 'breadcrumb', 'popover', 'layout'],
  source: { file: 'components/table-of-contents.tsx', exports: ['TableOfContents'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['back-to-top'] },
  props: [
    {
      name: 'items',
      type: 'object',
      signature: 'readonly { id: string; label: string; level?: 2 | 3 }[]',
      required: true,
      control: false,
      description: 'Разделы по порядку страницы: id заголовка, подпись, уровень. 2 — раздел, 3 — его подраздел с отступом 28. «Раздел N из M» считает только уровень 2.',
    },
    { name: 'title', type: 'string', default: 'На этой странице', description: 'Подпись над списком; она же имя ориентира navigation.' },
    {
      name: 'offset',
      type: 'number',
      default: 88,
      description: 'Где на экране раздел становится текущим и куда его приводит клик: высота липкой шапки плюс зазор. Тот же отступ — у липкой колонки.',
    },
    { name: 'backToTop', type: 'boolean', default: true, description: '«Наверх» под списком: прокрутка в начало и фокус на h1.' },
    {
      name: 'root',
      type: 'object',
      signature: 'RefObject<HTMLElement | null>',
      control: false,
      description: 'Контейнер с прокруткой; по умолчанию — окно.',
    },
    { name: 'className', type: 'string', control: false, description: 'Место в раскладке: порядок в сетке, отступы. Остальные атрибуты nav тоже передаются.' },
  ],
  slots: [
    { name: 'table-of-contents', description: 'Корень <nav>: от 1024 липкий, ширина 240.' },
    { name: 'table-of-contents-dot', description: 'Точка на линии: едет к текущему пункту.' },
    { name: 'table-of-contents-capsule', description: 'Капсула узкого экрана: открывает поповер со списком.' },
    { name: 'table-of-contents-popup', description: 'Поповер со списком, по ширине капсулы.' },
    { name: 'table-of-contents-progress', description: 'Полоска под капсулой: сегменты read / active / ahead.' },
  ],
  states: [
    { id: 'rest', label: 'впереди', description: 'fg-3 — разделы ниже текущего.', selector: 'data-state="ahead"' },
    { id: 'hover', label: 'наведение', description: 'fg-1, 150 мс ease-hover.', selector: ':hover · fg-1' },
    { id: 'filled', label: 'прочитано', description: 'fg-2 — разделы выше текущего.', selector: 'data-state="read"' },
    { id: 'selected', label: 'активна', description: 'fg-1 500, точка 7 accent на линии, aria-current="true".', selector: 'data-state="active"' },
    { id: 'focus', label: 'фокус', description: 'Кольцо 2 ring с зазором 1 вокруг подписи, радиус xs.', selector: ':focus-visible · outline 2 ring' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'По пунктам сверху вниз, затем «Наверх»' },
    { keys: ['Enter'], action: 'Прокручивает к разделу и ставит фокус на его заголовок' },
    { keys: ['Enter', 'Space'], action: 'На капсуле: открывает список' },
    { keys: ['Esc'], action: 'Закрывает список и возвращает фокус на капсулу' },
  ],
  a11y: [
    '<nav> с именем из подписи «На этой странице» — отдельный ориентир, его находят по списку ориентиров.',
    'Текущий пункт — aria-current="true"; прочитанные и впереди различаются только цветом и диктору не нужны.',
    'Клик прокручивает к разделу и переводит фокус на его заголовок (tabindex="-1", без кольца): следующий Tab идёт уже по разделу, а не по оглавлению.',
    'Капсула — кнопка с aria-expanded: открывает тот же список в поповере, выбор пункта закрывает его.',
    'Точка, линия и полоска прогресса — aria-hidden.',
    'При сниженном движении прокрутка мгновенная, точка переезжает без пружины.',
  ],
  motion: [
    { label: 'Точка', value: 'перетекает по линии · spring smooth 0,35 / 0', easing: 'spring-smooth', reduced: 'ease-out без отскока', tokens: ['spring-smooth'] },
    { label: 'Цвет пунктов', value: '150 мс · ease-hover', easing: 'ease-hover', tokens: ['duration-quick'] },
    { label: 'Клик по пункту', value: 'плавная прокрутка браузера к разделу', reduced: 'мгновенно' },
    { label: 'Капсула', value: 'список — поповер 150 мс · ease-out, шеврон поворот 180° · 200 мс', easing: 'ease-out', tokens: ['duration-quick', 'duration-base'] },
  ],
  examples: [
    {
      id: 'article',
      title: 'Рядом со статьёй · scroll-spy',
      description: 'Липкая колонка 240 под шапкой 64, offset 88. Прокрутите статью: точка едет по линии. Окно уже 1024 — вместо колонки капсула «Раздел 3 из 5» сверху.',
    },
    { id: 'short', title: 'Короткий документ', description: 'Своя подпись «Содержание», без «Наверх», offset 24 — шапки нет.' },
  ],
};

export default meta;
