import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'listbox',
  status: 'stable',
  title: 'Список выбора',
  description:
    'Список прямо в форме — когда вариантов мало и каждому нужно описание. Один или несколько вариантов, разделы с заголовками, галочка у выбранного.',
  category: 'pickers',
  paperBoard: '9SZ-0',
  anatomy: ['Список r 16', 'Заголовок раздела', 'Пункт', 'Иконка 16', 'Подпись и описание', 'Галочка'],
  related: ['select', 'radio-group', 'choice-card', 'combobox'],
  source: { file: 'components/listbox.tsx', exports: ['Listbox'] },
  dependencies: { npm: ['lucide-react'], registry: [] },
  props: [
    {
      name: 'options',
      type: 'object',
      required: true,
      signature: 'readonly { value: V; label: string; description?: string; icon?: ReactNode; group?: string; disabled?: boolean }[]',
      description: 'Варианты; подряд идущие с одним group получают общий заголовок.',
      control: false,
    },
    { name: 'multiple', type: 'boolean', default: false, description: 'Несколько вариантов: нажатие переключает пункт.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Отключает список.' },
    { name: 'emptyText', type: 'string', default: 'Нет вариантов', description: 'Текст пустого списка.' },
    { name: 'defaultValue', type: 'string', signature: 'V | null | readonly V[]', description: 'Выбор по умолчанию; в multiple — массив.', control: false },
    { name: 'value', type: 'string', signature: 'V | null | readonly V[]', description: 'Управляемый выбор.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: V) => void | (value: V[]) => void', description: 'Новый выбор.', control: false },
    { name: 'aria-label', type: 'string', description: 'Имя списка; или aria-labelledby на видимую подпись.', control: false },
  ],
  slots: [{ name: 'listbox', description: 'Список (role="listbox").' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Список surface-1 с волосяным кольцом, пункты без фона.' },
    { id: 'hover', label: 'наведение', description: 'Фон пункта fill-1.' },
    { id: 'highlighted', label: 'клавиатура', description: 'Подсвеченный стрелками пункт — fill-2.' },
    { id: 'selected', label: 'выбрано', description: 'Галочка 16 accent справа.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring вокруг списка.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
    { id: 'empty', label: 'пусто', description: 'Строка «Нет вариантов» fg-3.' },
  ],
  keyboard: [
    { keys: ['↑', '↓'], action: 'Двигают подсветку' },
    { keys: ['Home', 'End'], action: 'Первый и последний пункт' },
    { keys: ['А–Я'], action: 'Набор с клавиатуры прыгает к пункту' },
    { keys: ['Enter', 'Space'], action: 'Выбирают пункт; в multiple — переключают' },
  ],
  a11y: [
    'Фокус остаётся на списке, подсвеченный пункт объявляется через aria-activedescendant.',
    'Разделы — role="group" с заголовком; описание пункта — aria-describedby, а не часть имени.',
    'В режиме multiple у списка aria-multiselectable, у пунктов aria-selected.',
  ],
  motion: [
    { label: 'Подсветка', value: 'мгновенно, без перехода' },
    { label: 'Галочка', value: 'появляется сразу' },
  ],
  examples: [
    { id: 'roles', title: 'С разделами и описаниями', description: 'Роль в пространстве: два раздела, недоступный пункт.' },
    { id: 'channels', title: 'Несколько вариантов', description: 'Каналы уведомлений, multiple.' },
  ],
};

export default meta;
