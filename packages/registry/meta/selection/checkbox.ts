import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'checkbox',
  status: 'stable',
  title: 'Флажок',
  description: 'Да или нет, плюс промежуточное состояние для «выбрано частично». Группа флажков — множественный выбор.',
  category: 'selection',
  paperBoard: '1J0-0',
  anatomy: ['Подпись-обёртка', 'Квадрат 18 px', 'Галочка или минус', 'Текст'],
  related: ['switch', 'radio-group', 'choice-card', 'table'],
  source: { file: 'components/checkbox.tsx', exports: ['Checkbox'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['spinner'] },
  props: [
    { name: 'children', type: 'string', signature: 'ReactNode', description: 'Подпись; оборачивает флажок в label, нажатие на текст тоже переключает.' },
    { name: 'defaultChecked', type: 'boolean', default: false, description: 'Начальное состояние неуправляемого флажка.' },
    { name: 'indeterminate', type: 'boolean', default: false, description: 'Частичный выбор: минус вместо галочки.' },
    { name: 'size', type: 'enum', options: ['md', 'lg'], default: 'md', description: '18 px для указателя, 22 px для касания.' },
    { name: 'invalid', type: 'boolean', default: false, description: 'Рамка danger, пока флажок не отмечен.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступен.' },
    { name: 'checked', type: 'boolean', description: 'Управляемое состояние.', control: false },
    { name: 'onCheckedChange', type: 'function', signature: '(checked: boolean) => void', description: 'Новое состояние.', control: false },
  ],
  slots: [{ name: 'checkbox', description: 'Квадрат флажка (role="checkbox").' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Рамка 1,5 px цвета input.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring с отступом 2 px.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 % вместе с подписью.', props: { disabled: true } },
    { id: 'invalid', label: 'ошибка', description: 'Рамка danger у неотмеченного.', props: { invalid: true } },
  ],
  matrix: {
    rows: [
      { label: 'выключен', props: {} },
      { label: 'включён', props: { defaultChecked: true } },
      { label: 'частично', props: { indeterminate: true } },
    ],
  },
  keyboard: [{ keys: ['Space'], action: 'Переключает флажок' }],
  a11y: [
    'Роль checkbox, состояние aria-checked: true, false или mixed для частичного выбора.',
    'Подпись — часть цели нажатия: щёлкнуть можно по тексту.',
    'Для группы задайте общий заголовок (fieldset и legend) — экранный диктор прочитает его перед вариантами.',
  ],
  motion: [
    { label: 'Галочка', value: 'рисуется за 150 мс · ease-out' },
    { label: 'Снятие', value: 'исчезает за 100 мс' },
    { label: 'Фон', value: '150 мс · ease-hover' },
  ],
  examples: [
    { id: 'labels', title: 'С подписью', description: 'Подпись — часть цели нажатия.' },
    { id: 'select-all', title: 'Выбрать все', description: 'Родительский флажок в промежуточном состоянии, когда выбрана часть.' },
  ],
};

export default meta;
