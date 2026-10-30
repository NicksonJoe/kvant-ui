import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'select',
  status: 'stable',
  title: 'Выпадающий список',
  description: 'Выбор одного варианта из списка. Триггер выглядит как поле, список — как меню с галочкой.',
  category: 'pickers',
  paperBoard: '9SZ-0',
  anatomy: ['Триггер-поле', 'Значение или плейсхолдер', 'Шеврон', 'Всплывающий список', 'Пункт с галочкой'],
  related: ['combobox', 'native-select', 'radio-group', 'menu'],
  source: { file: 'components/select.tsx', exports: ['Select'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input'] },
  props: [
    { name: 'placeholder', type: 'string', default: 'Выберите', description: 'Текст, пока ничего не выбрано.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Высота триггера, как у поля.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступен.' },
    { name: 'required', type: 'boolean', default: false, description: 'Обязателен в форме.' },
    { name: 'options', type: 'object', required: true, signature: 'readonly { value: V; label: string; icon?: ReactNode; disabled?: boolean }[]', description: 'Варианты.', control: false },
    { name: 'value', type: 'string', signature: 'V | null', description: 'Управляемое значение.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: V | null) => void', description: 'Новый выбор.', control: false },
  ],
  slots: [
    { name: 'select-trigger', description: 'Триггер с видом поля.' },
    { name: 'select-popup', description: 'Список; ширина не меньше триггера.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Как текстовое поле, шеврон fg-3.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо ring.' },
    { id: 'open', label: 'открыто', description: 'Кольцо остаётся, список под триггером с отступом 4 px.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, фон surface-2.', props: { disabled: true } },
  ],
  matrix: { columns: ['rest', 'hover', 'focus', 'disabled'] },
  keyboard: [
    { keys: ['Space', 'Enter', '↓'], action: 'Открывают список' },
    { keys: ['↑', '↓'], action: 'Двигают подсветку' },
    { keys: ['Enter'], action: 'Выбирает пункт' },
    { keys: ['Esc'], action: 'Закрывает список, фокус возвращается на триггер' },
    { keys: ['А–Я'], action: 'Набор с клавиатуры прыгает к пункту' },
  ],
  a11y: [
    'Триггер — combobox с aria-expanded, список — listbox, пункты — option с aria-selected.',
    'Без видимой подписи передайте aria-label или оберните в Field.',
    'Больше 15 вариантов — берите комбобокс с поиском.',
  ],
  motion: [
    { label: 'Открытие', value: 'прозрачность и scale .96 + 4 px от триггера · 150 мс · ease-out' },
    { label: 'Закрытие', value: 'прозрачность · 100 мс' },
    { label: 'Подсветка пункта', value: 'мгновенно' },
  ],
  examples: [
    { id: 'stage', title: 'Этап сделки', description: 'Обычный список в поле формы.' },
    { id: 'icons', title: 'С иконками', description: 'Иконка помогает узнать вариант быстрее текста.' },
  ],
};

export default meta;
