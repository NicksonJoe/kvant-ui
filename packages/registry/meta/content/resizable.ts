import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'resizable',
  status: 'stable',
  title: 'Изменяемые панели',
  description: 'Список слева, подробности справа — ширину делит пользователь. Ручка видна всегда, но тихо: капсула на линии раздела. Двойной щелчок возвращает ширину по умолчанию.',
  category: 'content',
  paperBoard: '1GJ-0',
  anatomy: ['Группа', 'Панель (ширина в %)', 'Линия 1 separator, зона захвата 9', 'Капсула 5 × 24 fg-4', 'Подсказка «38 %» при перетаскивании'],
  related: ['separator', 'sidebar', 'scroll-area'],
  source: { file: 'components/resizable.tsx', exports: ['Resizable'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'label', type: 'string', required: true, description: 'Название ручки: «Ширина списка сделок».' },
    { name: 'defaultValue', type: 'number', options: [30, 40, 50], default: 50, description: 'Размер первой панели, % группы; к нему возвращает двойной щелчок.' },
    { name: 'min', type: 'number', options: [10, 20, 30], default: 10, description: 'Минимум первой панели, %.' },
    { name: 'max', type: 'number', options: [70, 80, 90], default: 90, description: 'Максимум первой панели, %.' },
    { name: 'orientation', type: 'enum', options: ['horizontal', 'vertical'], default: 'horizontal', description: 'horizontal — панели рядом, ручка вертикальная.' },
    { name: 'value', type: 'number', description: 'Управляемый размер.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: number) => void', description: 'Новый размер, %.', control: false },
    { name: 'children', type: 'node', required: true, signature: '[ReactNode, ReactNode]', description: 'Две панели.', control: false },
  ],
  slots: [
    { name: 'resizable', description: 'Группа; несёт data-orientation.' },
    { name: 'resizable-panel', description: 'Панель.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Линия separator, капсула 5 × 24 fg-4.' },
    { id: 'hover', label: 'наведение', description: 'Линия accent, капсула 5 × 32 fg-3.' },
    { id: 'pressed', label: 'перетаскивание', description: 'Линия 3 accent, капсула 7 × 40 accent, подсказка с процентом.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring вокруг капсулы.' },
  ],
  keyboard: [
    { keys: ['←', '→'], action: 'Сдвиг на 10 px (в вертикальной группе — ↑ ↓)' },
    { keys: ['Home', 'End'], action: 'К минимуму или максимуму' },
  ],
  a11y: [
    'Ручка — separator с aria-valuenow, aria-valuemin и aria-valuemax в процентах и названием.',
    'Ручка в порядке Tab, двигается клавишами; у предела останавливается без отскока.',
  ],
  motion: [
    { label: 'Ручка', value: 'цвет и размер капсулы 100 мс ease-hover' },
    { label: 'Перетаскивание', value: 'панели 1:1 за указателем, без сглаживания' },
    { label: 'Двойной щелчок и клавиши', value: 'ширина 250 мс ease-standard' },
  ],
  examples: [
    { id: 'master-detail', title: 'Список и карточка', description: 'Сделки слева, подробности справа.' },
    { id: 'vertical', title: 'Вертикальная', description: 'Письмо сверху, ответ снизу.' },
  ],
};

export default meta;
