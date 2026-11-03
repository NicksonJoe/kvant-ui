import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'icon',
  status: 'beta',
  title: 'Иконка',
  description:
    'Lucide под лицензией ISC — один набор с одним рисунком: сетка 24, скруглённые концы и стыки. Icon ставит иконку на шкалу Kvant: шесть размеров и толщина линии от размера, чтобы иконка весила столько же, сколько соседний текст; цвет она берёт у подписи. IconTile — круг с мягким тоном, который отделяет иконку от текста строки и несёт смысл цвета. В кнопках, полях, меню и строках размер и толщину уже задаёт сам компонент: туда кладите иконку Lucide как есть.',
  category: 'content',
  paperBoard: 'TJL-0',
  anatomy: [
    'SVG из Lucide: сетка 24, поле 2, концы и стыки скруглены',
    'Обводка 1,75 до 16 px включительно, 1,5 от 20 px',
    'Цвет — currentColor, от подписи и её состояний',
    'Плитка: круг 24 / 32 / 40, иконка 14 / 16 / 20, тон фона и иконки из одной пары',
  ],
  related: ['button', 'list', 'badge', 'toggle-button', 'empty-state', 'avatar'],
  source: { file: 'components/icon.tsx', exports: ['Icon', 'IconTile', 'ICON_SIZES', 'ICON_TILE_SIZES', 'ICON_TILE_TONES'] },
  dependencies: { npm: ['lucide-react'], registry: [] },
  props: [
    { name: 'icon', type: 'function', signature: 'LucideIcon', required: true, control: false, description: 'Иконка Lucide по имени: Calendar, Search, Pencil. Набор библиотеки — 64 иконки ниже; остальное берите из Lucide тем же размером и толщиной.' },
    {
      name: 'size',
      type: 'number',
      options: [12, 14, 16, 20, 24, 32],
      default: 16,
      description: '12 — крошки, флажок, метки · 14 — кнопка xs, теги, ошибка поля · 16 — кнопки, поля, меню, строки · 20 — кнопка lg, тосты, строки касания · 24 — таббар, пустые состояния · 32 — онбординг, экраны без данных.',
    },
    { name: 'label', type: 'string', description: 'Иконка, которая значит что-то сама («Оплачено»): role="img" с этим именем. Без label иконка скрыта от диктора (aria-hidden) — её смысл несёт подпись рядом.' },
    { name: 'filled', type: 'boolean', default: false, description: 'Состояние «включено»: избранное, закладка, закреплённое — заливка цветом текста. Рядом с ней — aria-pressed на кнопке.' },
    { name: 'className', type: 'string', control: false, description: 'Цвет и отступы: text-fg-3. Остальные атрибуты svg тоже передаются.' },
  ],
  parts: [
    {
      name: 'IconTile',
      description: 'Круг с мягким тоном под иконку в начале строки: оплата, файл, уведомление. Размер и толщину иконки внутри задаёт плитка. Роли у плитки нет — что прочитать, решает иконка.',
      props: [
        { name: 'size', type: 'number', options: [24, 32, 40], default: 32, description: '24 — иконка 14 · 1,75; 32 — иконка 16 · 1,75; 40 — иконка 20 · 1,5.' },
        {
          name: 'tone',
          type: 'enum',
          options: ['neutral', 'accent', 'success', 'warning', 'danger', 'solid'],
          default: 'neutral',
          description: 'neutral — fill-2 и fg-2, accent / success / warning / danger — мягкий фон и его -soft-fg, solid — accent и accent-fg.',
        },
        { name: 'children', type: 'node', required: true, description: 'Одна иконка Lucide.' },
      ],
    },
  ],
  slots: [
    { name: 'icon', description: 'SVG иконки; data-filled в состоянии «включено».' },
    { name: 'icon-tile', description: 'Круг плитки; data-size и data-tone.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Контур, цвет от подписи.' },
    { id: 'checked', label: 'включено', description: 'Заливка цветом текста: избранное, закладка, закреплённое; рядом aria-pressed.', props: { filled: true }, selector: 'data-filled · fill currentColor' },
  ],
  keyboard: [],
  a11y: [
    'Иконка рядом с подписью скрыта от диктора (aria-hidden): смысл несёт текст, иначе диктор прочитает его дважды.',
    'Иконка без подписи — label («Оплачено»), тогда это role="img" с именем. Кнопке-иконке имя даёт сама кнопка: aria-label у IconButton.',
    'Цвет — currentColor: иконка наследует цвет подписи и её состояния — наведение, нажатие, отключено. Собственный цвет есть только у статусных иконок, и смысл цвета дублирует текст строки.',
    'Без эмодзи и юникод-знаков: они рисуются по-разному на каждой платформе, не наследуют цвет и не попадают в сетку. Галочка, звезда и стрелка — только из набора.',
    'Заливка — только состояние. В покое иконки контурные; залитая звезда без aria-pressed не скажет диктору, что избранное включено.',
  ],
  motion: [
    { label: 'Иконки', value: 'не анимируются сами по себе', note: 'Движение — только у состояния.' },
    { label: 'Заливка', value: 'scale .8 → 1 · 150 мс · ease-out', easing: 'ease-out', reduced: 'без масштаба: --scale-enter = 1', tokens: ['duration-quick'] },
    { label: 'Копировать → галочка', value: 'crossfade + scale .8 → 1 · 150 мс · ease-out', detail: 'возврат через 2000 мс — в CopyButton', easing: 'ease-out', tokens: ['duration-quick'] },
    { label: 'Шеврон аккордеона', value: 'поворот 200 мс · ease-standard', easing: 'ease-standard', tokens: ['duration-base'] },
    { label: 'Спиннер', value: '800 мс на оборот · linear', easing: 'linear', tokens: ['duration-spinner'] },
  ],
  examples: [
    { id: 'sizes', title: 'Размеры и толщина линии', description: 'Шесть размеров и два значения обводки: мелкая иконка получает линию потолще, крупная — потоньше.' },
    { id: 'tiles', title: 'Контейнеры', description: 'Плитки трёх размеров в шести тонах и те же плитки в строках списка.' },
    { id: 'filled', title: 'Заливка — только состояние', description: 'Избранное и закладка: контур в покое, заливка с aria-pressed.' },
    { id: 'set', title: 'Набор библиотеки', description: '64 иконки, на которых собраны компоненты и паттерны Kvant. Подпись — имя в пакете.' },
  ],
};

export default meta;
