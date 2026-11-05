import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'time-field',
  status: 'stable',
  title: 'Поле времени',
  description:
    'Время быстрее набрать, чем выбрать: «930» станет 09:30, двоеточие ставится само, 24 часа при любом языке браузера. Колонки часов и минут открываются кнопкой справа.',
  category: 'pickers',
  anatomy: ['Капсула поля', 'Иконка часов', 'Текст «чч:мм» табличными цифрами', 'Кнопка колонок 28', 'Колонки «Часы» и «Минуты»'],
  related: ['time-picker', 'date-field', 'masked-input'],
  source: { file: 'components/time-field.tsx', exports: ['TimeField', 'parseTime'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input', 'popover'] },
  props: [
    { name: 'step', type: 'number', options: [1, 5, 10, 15, 30], default: 5, description: 'Шаг минут в колонке.' },
    { name: 'placeholder', type: 'string', default: 'чч:мм', description: 'Подсказка в пустом поле.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Высота поля.' },
    { name: 'invalid', type: 'boolean', default: false, description: 'Рамка ошибки и aria-invalid.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно.' },
    { name: 'defaultValue', type: 'string', description: 'Время по умолчанию, «10:30» или пусто.', control: false },
    { name: 'value', type: 'string', description: 'Управляемое время «ЧЧ:ММ» или пусто.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: string) => void', description: 'Новое время «ЧЧ:ММ» или пусто, когда поле очищено.', control: false },
    { name: 'aria-label', type: 'string', description: 'Имя поля; или aria-labelledby на видимую подпись.', control: false },
    { name: 'className', type: 'string', description: 'Класс капсулы — здесь задают ширину.', control: false },
  ],
  slots: [{ name: 'time-field', description: 'Капсула поля.' }],
  states: [
    { id: 'rest', label: 'пусто', description: 'Подсказка «чч:мм» fg-3, кнопка-шеврон ghost 28 справа.' },
    { id: 'filled', label: 'заполнено', description: 'Цифры fg-1 табличные.' },
    { id: 'focus', label: 'фокус', description: 'Рамка ring; при открытых колонках рамка остаётся.' },
    { id: 'invalid', label: 'ошибка', description: 'Рамка danger.', props: { invalid: true } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, фон surface-2.', props: { disabled: true } },
  ],
  matrix: { columns: ['rest', 'focus', 'invalid', 'disabled'] },
  keyboard: [
    { keys: ['0–9'], action: 'Набирают время; третья цифра подряд ставит двоеточие' },
    { keys: ['↑', '↓'], action: '±15 минут по кругу суток' },
    { keys: ['Enter'], action: 'Применяет набранное: «9» → 09:00' },
    { keys: ['Tab'], action: 'Уходит из поля; не время — возвращается прежнее' },
  ],
  a11y: [
    'Поле — textbox с inputmode="numeric": на телефоне цифровая клавиатура.',
    'Кнопка колонок вне порядка Tab и названа «Выбрать время»; с клавиатуры время набирают.',
    'Колонки — group «Часы» и «Минуты»; пункты — кнопки «14 ч», «35 мин» с aria-pressed.',
  ],
  motion: [{ label: 'Колонки', value: 'как у поповера; выбранный пункт по центру при открытии' }],
  examples: [
    { id: 'typed', title: 'Набором', description: 'Видимая подпись через aria-labelledby, значение сразу после ввода.' },
    { id: 'visit', title: 'Начало и конец', description: 'Пара полей с шагом 15 минут и ошибкой, когда конец раньше начала.' },
  ],
};

export default meta;
