import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'input',
  status: 'stable',
  title: 'Текстовое поле',
  description: 'Однострочный ввод в капсуле: иконка, единица, клавиша-подсказка и кнопка очистки.',
  category: 'forms',
  paperBoard: '210-0',
  anatomy: ['Капсула поля', 'Начальная иконка', 'Поле ввода', 'Очистить', 'Единица или клавиша'],
  related: ['field', 'textarea', 'input-group', 'search-field', 'combobox'],
  source: { file: 'components/input.tsx', exports: ['Input', 'fieldShell', 'fieldSizes'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['badge'] },
  props: [
    { name: 'placeholder', type: 'string', description: 'Пример значения, fg-3. Не заменяет подпись.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Высота 32 / 36 / 44 px. lg с текстом 16 px — iOS не увеличивает страницу.' },
    { name: 'defaultValue', type: 'string', description: 'Начальное значение неуправляемого поля.' },
    { name: 'kbd', type: 'string', signature: 'ReactNode', description: 'Клавиша-подсказка в конце, например ⌘K. На касании не показывается.' },
    { name: 'invalid', type: 'boolean', default: false, description: 'Ошибка без Field. Внутри Field с error ставится само.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно: прозрачность 50 %, фон surface-2.' },
    { name: 'readOnly', type: 'boolean', default: false, description: 'Только чтение: фон surface-2, рамка border.' },
    { name: 'prefix', type: 'node', description: 'Иконка 16 px или текст перед значением.', control: false },
    { name: 'suffix', type: 'node', description: 'Единица, кнопка «показать», спиннер.', control: false },
    { name: 'onClear', type: 'function', signature: '() => void', description: 'Показывает кнопку очистки, пока управляемое значение не пустое.', control: false },
  ],
  slots: [{ name: 'input', description: 'Капсула поля; состояния читаются с вложенного input.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Рамка input с контрастом не ниже 3:1.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо 1 px цвета ring — сплошные 2 px без ореола.' },
    { id: 'filled', label: 'заполнено', description: 'Значение fg-1.', props: { defaultValue: 'Анна Северова' } },
    { id: 'invalid', label: 'ошибка', description: 'Рамка danger и одна встряска.', props: { invalid: true, defaultValue: 'anna.sever@' } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, фон surface-2.', props: { disabled: true } },
    { id: 'read-only', label: 'только чтение', description: 'Фон surface-2, рамка border, значение можно выделить.', props: { readOnly: true, defaultValue: 'КП-2026-114' } },
  ],
  matrix: {},
  keyboard: [
    { keys: ['Tab'], action: 'Переводит фокус в поле и дальше' },
    { keys: ['Esc'], action: 'Очищает поле поиска, если вы так решите в onKeyDown' },
  ],
  a11y: [
    'Ставьте поле внутрь Field: подпись, подсказка и ошибка свяжутся с ним сами.',
    'Без видимой подписи нужен aria-label; плейсхолдер не заменяет название.',
    'Кнопка очистки называется «Очистить» и доступна с клавиатуры.',
    'Указывайте type и autoComplete (email, tel, name) — телефон покажет нужную клавиатуру и подставит данные.',
  ],
  motion: [
    { label: 'Рамка и кольцо', value: '100 мс · ease-hover' },
    { label: 'Ошибка', value: 'встряска ±4 px ×3 за 300 мс, при сниженном движении без сдвига' },
    { label: 'Очистка', value: 'прозрачность и scale .8 → 1, 150 мс · ease-out' },
  ],
  examples: [
    { id: 'search', title: 'Поиск с очисткой', description: 'Иконка в начале, кнопка очистки появляется, когда есть текст.' },
    { id: 'sizes', title: 'Размеры', description: 'sm для плотных панелей, md по умолчанию, lg для касания.' },
    { id: 'addons', title: 'Единица и клавиша', description: 'Суффикс для единиц и клавиша-подсказка для глобального поиска.' },
  ],
};

export default meta;
