import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'floating-panel',
  status: 'beta',
  title: 'Плавающая панель',
  description:
    'Окно поверх рабочей области: заметки к звонку, таймер, мини-чат. Перетаскивается за шапку, сворачивается в капсулу и помнит положение. Страница под ней остаётся доступной — фокус не запирается, затемнения нет. Отпущенная панель пружиной встаёт в 16 px от края окна и пристыковывается к ближнему углу: при свёртке и смене размера окна она остаётся в нём.',
  category: 'overlays',
  paperBoard: '1GY-0',
  anatomy: [
    'Панель w 360 · r 24 · overlay · тень overlay',
    'Шапка h44: ручка 24 × 28 grip fg-4, заголовок 14/20 600, ghost 28',
    'Тело p 16',
    'Подвал p 10 12',
    'Капсула свёрнутой панели h44 · r full с бейджем',
  ],
  related: ['popover', 'sheet', 'dialog', 'timer'],
  source: { file: 'components/floating-panel.tsx', exports: ['FloatingPanel', 'FLOATING_PANEL_CORNERS'] },
  dependencies: { npm: ['lucide-react'], registry: ['portal'] },
  props: [
    { name: 'title', type: 'string', required: true, description: 'Заголовок в шапке и имя диалога: «Заметки к звонку».' },
    { name: 'children', type: 'node', required: true, control: false, description: 'Тело, p 16; длинное прокручивается внутри, панель не выше окна минус 32.' },
    { name: 'footer', type: 'node', control: false, description: 'Подвал под линией: статус и одно действие — «Сохранено в 14:32» и «К сделке».' },
    { name: 'badge', type: 'string', description: 'Бейдж рядом с заголовком в свёрнутой капсуле: «2 из 3». В развёрнутой панели не показывается.' },
    { name: 'open', type: 'boolean', control: false, description: 'Управляемое открытие, вместе с onOpenChange; закрытая панель ничего не рисует.' },
    { name: 'defaultOpen', type: 'boolean', default: true, control: false, description: 'Открыта при первом показе.' },
    { name: 'onOpenChange', type: 'function', signature: '(open: boolean) => void', description: 'Нажали «Закрыть».' },
    { name: 'collapsed', type: 'boolean', control: false, description: 'Управляемая свёртка, вместе с onCollapsedChange.' },
    { name: 'defaultCollapsed', type: 'boolean', default: false, description: 'Свёрнута в капсулу при первом показе.' },
    { name: 'onCollapsedChange', type: 'function', signature: '(collapsed: boolean) => void', description: '«Свернуть» или «Развернуть».' },
    {
      name: 'defaultPosition',
      type: 'object',
      signature: 'FloatingPanelPosition',
      control: false,
      description: 'Где встать: { corner, x, y } — угол и отступы от двух его краёв. По умолчанию { corner: "bottom-right", x: 16, y: 16 }. Сохранённое под storageKey важнее.',
    },
    { name: 'onPositionChange', type: 'function', signature: '(position: FloatingPanelPosition) => void', description: 'Панель встала на новое место — после перетаскивания или стрелок.' },
    { name: 'storageKey', type: 'string', control: false, description: 'Ключ localStorage, чтобы помнить, где пользователь оставил панель. Без него положение живёт до перезагрузки.' },
    {
      name: 'strategy',
      type: 'enum',
      options: ['fixed', 'absolute'],
      default: 'fixed',
      control: false,
      description: 'fixed — поверх окна, через Portal на слое sticky; absolute — внутри ближайшего родителя с position: relative (холст, демо-сцена).',
    },
    { name: 'className', type: 'string', control: false, description: 'Панель.' },
  ],
  parts: [
    {
      name: 'FloatingPanelPosition',
      description: 'Тип положения для defaultPosition и onPositionChange.',
      props: [
        { name: 'corner', type: 'enum', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], required: true, description: 'Угол, к которому пристыкована панель: ближний к её центру.' },
        { name: 'x', type: 'number', required: true, description: 'Отступ от левого или правого края этого угла, px.' },
        { name: 'y', type: 'number', required: true, description: 'Отступ от верхнего или нижнего края, px.' },
      ],
    },
  ],
  slots: [
    { name: 'floating-panel', description: 'Панель role="dialog" aria-modal="false"; data-collapsed, data-dragging.' },
    { name: 'floating-panel-header', description: 'Шапка h44: за неё перетаскивают; при перетаскивании fill-1, ручка fill-2.' },
    { name: 'floating-panel-title', description: 'Заголовок 14/20 600, имя диалога.' },
    { name: 'floating-panel-badge', description: 'Бейдж fill-2 h20 в свёрнутой капсуле.' },
    { name: 'floating-panel-content', description: 'Тело и подвал; в свёрнутой панели высота 0 и inert.' },
    { name: 'floating-panel-body', description: 'Тело p 16, прокручивается.' },
    { name: 'floating-panel-footer', description: 'Подвал под линией separator, p 10 12.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'w 360 · r 24, 16 от края окна.' },
    { id: 'pressed', label: 'перетаскивание', description: 'Подъём 1.02 и тень modal, шапка fill-1; панель идёт за курсором 1:1.', selector: 'data-dragging' },
    { id: 'collapsed', label: 'свёрнуто', description: 'Капсула h44 · r full: ручка, заголовок, бейдж, «Развернуть», «Закрыть».', props: { defaultCollapsed: true } },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Ручка, «Свернуть», «Закрыть», затем содержимое; фокус свободно уходит на страницу' },
    { keys: ['←', '→', '↑', '↓'], action: 'На ручке «Переместить панель» — сдвиг на 16 px' },
    { keys: ['Shift', '←', '→', '↑', '↓'], action: 'Сдвиг на 64 px' },
    { keys: ['Enter', 'Space'], action: 'На «Свернуть» — свернуть в капсулу и развернуть; на «Закрыть» — закрыть' },
  ],
  a11y: [
    'role="dialog" с aria-modal="false": имя — заголовок. Затемнения и ловушки фокуса нет, страница под панелью доступна.',
    'Перетаскивание повторено с клавиатуры: ручка — кнопка «Переместить панель», стрелки сдвигают на 16 px, с Shift — на 64; подсказка привязана через aria-describedby.',
    '«Свернуть» и «Развернуть» — одна кнопка с aria-expanded; содержимое свёрнутой панели inert, Tab в него не попадает.',
    'Панель не выходит за окно: после перетаскивания и стрелок она встаёт в 16 px от края.',
    'Кнопки шапки 28 на касании получают зону 44.',
  ],
  motion: [
    { label: 'Захват', value: 'подъём 1.02 + тень modal · 150 мс · ease-out', easing: 'ease-out', reduced: 'без подъёма, тень меняется', tokens: ['duration-quick', 'scale-lift'] },
    { label: 'Перенос', value: '1:1 за курсором', note: 'Без задержки и сглаживания.', easing: 'instant' },
    {
      label: 'Отпускание',
      value: 'пружина snappy · 300 мс к месту в 16 px от края',
      detail: 'в 16 px от линии края притягивается к ней; стыкуется к ближнему углу',
      easing: 'spring-snappy',
      reduced: 'ease-out без отскока',
      tokens: ['spring-snappy'],
    },
    {
      label: 'Свернуть',
      value: 'высота, ширина и радиус · 250 мс · ease-fluid',
      easing: 'ease-fluid',
      reduced: '150 мс',
      tokens: ['duration-moderate'],
    },
  ],
  examples: [
    { id: 'call-notes', title: 'Заметки к звонку поверх страницы', description: 'Открывается кнопкой, перетаскивается по окну, помнит место в localStorage.' },
    { id: 'workspace', title: 'Внутри рабочей области', description: 'strategy="absolute": свёрнутый секундомер в капсуле внутри холста.' },
  ],
};

export default meta;
