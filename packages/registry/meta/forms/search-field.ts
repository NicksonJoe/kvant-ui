import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'search-field',
  status: 'stable',
  title: 'Поле поиска',
  description: 'Запрос для фильтра или глобального поиска: лупа, очистка, спиннер ожидания и клавиша «/» или ⌘K. Ищем через 200 мс после паузы.',
  category: 'forms',
  paperBoard: 'A8B-0',
  anatomy: ['Капсула h36', 'Лупа 16 fg-3', 'Поле type="search"', 'Правый слот: очистка → спиннер → клавиша'],
  related: ['input', 'input-group', 'command-palette', 'combobox'],
  source: { file: 'components/search-field.tsx', exports: ['SearchField'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input', 'spinner'] },
  props: [
    { name: 'placeholder', type: 'string', description: 'Что ищем: «Поиск по проектам».' },
    { name: 'defaultValue', type: 'string', description: 'Начальный запрос.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Высота 32 / 36 / 44 px.' },
    { name: 'loading', type: 'boolean', default: false, description: 'Спиннер вместо очистки; появляется через 150 мс.' },
    { name: 'shortcut', type: 'string', description: 'Клавиша в покое — «/» или «⌘K»; нажатие в любом месте страницы ставит фокус в поле.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно.' },
    { name: 'value', type: 'string', description: 'Управляемый запрос.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: string) => void', description: 'Каждое изменение.', control: false },
    { name: 'onSearch', type: 'function', signature: '(query: string) => void', description: 'Запрос через 200 мс после паузы; при очистке — сразу.', control: false },
  ],
  slots: [{ name: 'input', description: 'Капсула поля (это Input с type="search").' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Рамка input, плейсхолдер fg-3, клавиша-подсказка справа.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо ring; клавиша-подсказка уходит.' },
    { id: 'filled', label: 'заполнено', description: 'Справа — очистка, круг 20.', props: { defaultValue: 'север' } },
    { id: 'loading', label: 'загрузка', description: 'Спиннер 16 вместо очистки, aria-busy.', props: { defaultValue: 'север', loading: true } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {},
  keyboard: [
    { keys: ['/', '⌘K'], action: 'Ставят фокус в поле (если заданы в shortcut)' },
    { keys: ['Esc'], action: 'Первое нажатие очищает, второе выводит из поля' },
    { keys: ['Enter'], action: 'Отправляет форму поиска, если она есть' },
  ],
  a11y: [
    'type="search" — роль searchbox; дайте полю подпись или aria-label.',
    'Пока идёт запрос, поле получает aria-busy; число найденного объявляйте в aria-live рядом со списком.',
    'Клавиша-подсказка исчезает на фокусе и не показывается на касании.',
  ],
  motion: [
    { label: 'Запрос', value: 'через 200 мс после паузы' },
    { label: 'Спиннер', value: 'появляется через 150 мс, чтобы не мигать' },
    { label: 'Очистка', value: 'прозрачность и scale .8 → 1, 150 мс · ease-out' },
    { label: '⌘K', value: 'открывает палитру мгновенно (0 мс)' },
  ],
  examples: [
    { id: 'filter', title: 'Фильтр списка', description: 'Ищем по мере ввода: через 200 мс после паузы, пока ждём — спиннер.' },
    { id: 'shortcut', title: 'С подсказкой клавиши', description: 'Нажмите «/» — фокус в поле; Esc очищает и выводит.' },
  ],
};

export default meta;
