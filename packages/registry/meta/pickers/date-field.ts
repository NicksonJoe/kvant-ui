import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'date-field',
  status: 'stable',
  title: 'Поле даты',
  description:
    'Дату быстрее напечатать, чем найти в календаре: поле разбито на день, месяц и год, точки ставятся сами. Календарь открывается кнопкой справа.',
  category: 'pickers',
  paperBoard: 'DLG-0',
  anatomy: ['Капсула поля', 'Сегменты дня, месяца, года', 'Точки', 'Кнопка календаря 28', 'Текст ошибки'],
  related: ['date-picker', 'calendar', 'masked-input', 'time-picker'],
  source: { file: 'components/date-field.tsx', exports: ['DateField'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input', 'popover', 'calendar'] },
  props: [
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно.' },
    { name: 'defaultValue', type: 'object', signature: 'Date | null', description: 'Дата по умолчанию.', control: false },
    { name: 'value', type: 'object', signature: 'Date | null', description: 'Управляемая дата.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(date: Date | null) => void', description: 'Полная возможная дата или null, когда поле очищено.', control: false },
    { name: 'min', type: 'object', signature: 'Date', description: 'Раньше нельзя выбрать в календаре.', control: false },
    { name: 'max', type: 'object', signature: 'Date', description: 'Позже нельзя выбрать в календаре.', control: false },
    { name: 'aria-label', type: 'string', description: 'Имя поля; или aria-labelledby на видимую подпись.', control: false },
    { name: 'className', type: 'string', description: 'Класс обёртки — здесь задают ширину.', control: false },
  ],
  slots: [{ name: 'date-field', description: 'Обёртка поля и ошибки.' }],
  states: [
    { id: 'rest', label: 'пусто', description: 'Сегменты-подсказки «дд.мм.гггг» fg-3, кнопка ghost 28 справа.' },
    { id: 'filled', label: 'заполнено', description: 'Цифры fg-1 табличные, точки fg-3.' },
    { id: 'focus', label: 'фокус на сегменте', description: 'Сегмент: фон accent, r 6; рамка поля ring.' },
    { id: 'invalid', label: 'ошибка', description: 'Рамка danger и текст под полем; проверка при уходе из поля.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, фон surface-2.', props: { disabled: true } },
  ],
  matrix: { columns: ['rest', 'focus', 'disabled'] },
  keyboard: [
    { keys: ['0–9'], action: 'Заполняют сегмент и сразу переходят к следующему' },
    { keys: ['↑', '↓'], action: '±1 в сегменте; день и месяц идут по кругу' },
    { keys: ['←', '→'], action: 'Переходят между сегментами' },
    { keys: ['Backspace'], action: 'Стирает цифру, на пустом сегменте — шаг назад' },
    { keys: ['Tab'], action: 'Сегменты по очереди, затем кнопка календаря' },
  ],
  a11y: [
    'Поле — group с именем; сегменты — spinbutton «день», «месяц», «год» с aria-valuetext.',
    'Ошибка связана с полем через aria-describedby и ставит aria-invalid на сегменты.',
    'На телефоне ввод по сегментам неудобен — там лучше кнопка календаря или системный выбор даты.',
  ],
  motion: [
    { label: 'Подсветка сегмента', value: 'без перехода' },
    { label: 'Ошибка', value: 'встряхивание ±4 px ×3 за 300 мс, текст opacity 150 мс' },
  ],
  examples: [
    { id: 'contract', title: 'В форме', description: 'Видимая подпись через aria-labelledby и дата по умолчанию.' },
    { id: 'deadline', title: 'С ограничением', description: 'Календарь за кнопкой не даёт выбрать прошедшие дни.' },
  ],
};

export default meta;
