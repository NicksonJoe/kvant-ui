import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'combobox',
  status: 'stable',
  title: 'Комбобокс',
  description: 'Поле, которое фильтрует список при наборе. Совпадение выделено полужирным; можно создать новый вариант.',
  category: 'pickers',
  paperBoard: '9SZ-0',
  anatomy: ['Капсула поля', 'Поле ввода', 'Кнопка списка', 'Список', 'Пункт «Создать «…»»', 'Пустое состояние'],
  related: ['select', 'command-palette', 'tags-input', 'input'],
  source: { file: 'components/combobox.tsx', exports: ['Combobox', 'Autocomplete', 'HighlightMatch'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input'] },
  props: [
    { name: 'placeholder', type: 'string', description: 'Подсказка в поле.' },
    { name: 'emptyText', type: 'string', default: 'Ничего не найдено', description: 'Текст, когда совпадений нет.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Высота поля.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступен.' },
    { name: 'options', type: 'object', required: true, signature: 'readonly { value: V; label: string; icon?: ReactNode }[]', description: 'Варианты.', control: false },
    { name: 'onCreate', type: 'function', signature: '(label: string) => void', description: 'Показывает «Создать «…»», когда точного совпадения нет.', control: false },
    { name: 'value', type: 'string', signature: 'V | null', description: 'Управляемое значение.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: V | null) => void', description: 'Новый выбор.', control: false },
  ],
  parts: [
    {
      name: 'Autocomplete',
      description: 'Свободный текст с подсказками: значение — то, что набрано.',
      props: [
        { name: 'suggestions', type: 'object', required: true, signature: 'readonly string[]', description: 'Подсказки.' },
        { name: 'prefix', type: 'node', description: 'Иконка в начале поля.' },
        { name: 'onValueChange', type: 'function', signature: '(value: string) => void', description: 'Текст поля.' },
      ],
    },
  ],
  slots: [
    { name: 'combobox', description: 'Капсула поля.' },
    { name: 'combobox-popup', description: 'Список вариантов.' },
    { name: 'autocomplete', description: 'Капсула поля автодополнения.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Как текстовое поле.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо ring.' },
    { id: 'open', label: 'открыто', description: 'Список под полем; совпадение полужирное.' },
    { id: 'empty', label: 'пусто', description: '«Ничего не найдено» вместо списка.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: { columns: ['rest', 'hover', 'focus', 'disabled'] },
  keyboard: [
    { keys: ['↓'], action: 'Открывает список' },
    { keys: ['↑', '↓'], action: 'Двигают подсветку' },
    { keys: ['Enter'], action: 'Выбирает пункт' },
    { keys: ['Esc'], action: 'Закрывает список' },
  ],
  a11y: [
    'Поле — combobox с aria-expanded и aria-activedescendant: фокус остаётся в поле, пока вы двигаетесь по списку.',
    'Пустой результат объявляется текстом, а не только исчезновением списка.',
  ],
  motion: [
    { label: 'Открытие', value: 'прозрачность и scale .96 + 4 px · 150 мс · ease-out' },
    { label: 'Фильтрация', value: 'без анимации — список меняется мгновенно' },
  ],
  examples: [
    { id: 'client', title: 'Выбор клиента', description: 'Набор фильтрует список, совпадение выделено.' },
    { id: 'creatable', title: 'С созданием', description: 'Нет точного совпадения — можно создать новый вариант.' },
    { id: 'autocomplete', title: 'Автодополнение', description: 'Свободный текст с подсказками городов.' },
  ],
};

export default meta;
