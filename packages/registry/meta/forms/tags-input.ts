import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'tags-input',
  status: 'stable',
  title: 'Поле тегов',
  description: 'Несколько свободных значений тегами внутри капсулы. Enter или запятая создают тег, Backspace сначала выделяет последний, а удаляет только вторым нажатием.',
  category: 'forms',
  paperBoard: 'A8B-0',
  anatomy: ['Капсула: слева 6, справа 14', 'Тег h24 fill-2 с крестиком 12', 'Поле ввода', 'Подсказки', '«+N» вне фокуса'],
  related: ['tag', 'combobox', 'input', 'field'],
  source: { file: 'components/tags-input.tsx', exports: ['TagsInput'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input', 'badge', 'combobox'] },
  props: [
    { name: 'placeholder', type: 'string', default: 'Добавить тег', description: 'Подсказка в поле ввода.' },
    { name: 'visibleTags', type: 'number', options: [2, 3, 5], description: 'Вне фокуса видно столько тегов, остальные — «+N».' },
    { name: 'max', type: 'number', options: [3, 5, 10], description: 'Больше тегов не добавить.' },
    { name: 'invalid', type: 'boolean', default: false, description: 'Ошибка без Field.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно.' },
    { name: 'suggestions', type: 'object', signature: 'readonly string[]', description: 'Подсказки при вводе (до шести); набранное всегда можно создать новым тегом.', control: false },
    { name: 'defaultValue', type: 'object', signature: 'readonly string[]', description: 'Начальные теги.', control: false },
    { name: 'value', type: 'object', signature: 'readonly string[]', description: 'Управляемые теги.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: string[]) => void', description: 'Новый список тегов.', control: false },
    { name: 'name', type: 'string', description: 'Каждый тег уходит с формой отдельным скрытым полем.', control: false },
  ],
  slots: [
    { name: 'tags-input', description: 'Колонка: капсула, подсказки и строка «Ещё раз ⌫».' },
    { name: 'tags-input-tag', description: 'Тег; несёт data-selected после первого Backspace.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Теги fill-2 в одну строку и плейсхолдер.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'ввод', description: 'Рамка ring; теги переносятся, скругление 20.' },
    { id: 'selected', label: 'выделен', description: 'Последний тег accent-soft: следующий Backspace его удалит.' },
    { id: 'collapsed', label: 'вне фокуса', description: 'Лишние теги свёрнуты в «+N» с рамкой border.', props: { visibleTags: 2 } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {},
  keyboard: [
    { keys: ['Enter', ','], action: 'Создают тег из набранного или выбранной подсказки' },
    { keys: ['Backspace'], action: 'В пустом поле выделяет последний тег, второе нажатие удаляет' },
    { keys: ['←', '→'], action: 'Выделяют теги по очереди' },
    { keys: ['↑', '↓'], action: 'Ходят по подсказкам' },
    { keys: ['Esc'], action: 'Закрывает подсказки или снимает выделение' },
  ],
  a11y: [
    'С подсказками поле — combobox со списком (listbox) и aria-activedescendant.',
    'Добавление и удаление тегов объявляются вежливо; строка «Ещё раз ⌫ — и «сайт» удалится» тоже читается.',
    'Крестики у тегов — для указателя и касания (зона 44 px); с клавиатуры удаляют Backspace.',
    'Регистр не важен: «Сайт» и «сайт» — один тег, пробелы по краям срезаются.',
  ],
  motion: [
    { label: 'Новый тег', value: 'scale .8 → 1 и прозрачность, 150 мс · ease-out' },
    { label: 'Подсказки', value: '150 мс · ease-out со сдвигом 4 px' },
    { label: 'Сниженное движение', value: 'без масштаба и сдвига' },
  ],
  examples: [
    { id: 'suggestions', title: 'С подсказками', description: 'Наберите «диз»: два совпадения и «Создать тег «диз»».' },
    { id: 'overflow', title: 'Переполнение', description: 'Вне фокуса видно три тега и «+3», в фокусе — все.' },
  ],
};

export default meta;
