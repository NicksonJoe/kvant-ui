import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'date-picker',
  status: 'stable',
  title: 'Выбор даты',
  description:
    'Поле с датой «29.10.2026» открывает календарь в поповере. DateRangePicker — диапазон: два месяца рядом и пресеты слева; фильтр меняется только по «Применить», так можно спокойно поправить край.',
  category: 'pickers',
  paperBoard: 'DLG-0',
  anatomy: ['Поле-триггер', 'Дата или «дд.мм.гггг»', 'Иконка календаря', 'Поповер с календарём', 'Пресеты 168', 'Подвал с итогом и кнопками'],
  related: ['calendar', 'date-field', 'time-picker', 'popover'],
  source: { file: 'components/calendar.tsx', exports: ['DatePicker', 'DateRangePicker', 'DATE_RANGE_PRESETS'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['button', 'input', 'popover'] },
  props: [
    { name: 'placeholder', type: 'string', default: 'дд.мм.гггг', description: 'Формат, пока дата не выбрана.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Высота поля.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно.' },
    { name: 'value', type: 'object', signature: 'Date | null', description: 'Управляемая дата.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(date: Date | null) => void', description: 'Выбранная дата.', control: false },
    { name: 'min', type: 'object', signature: 'Date', description: 'Раньше нельзя.', control: false },
    { name: 'max', type: 'object', signature: 'Date', description: 'Позже нельзя.', control: false },
  ],
  parts: [
    {
      name: 'DateRangePicker',
      description: 'Диапазон с пресетами: «Сегодня», «7 дней», «30 дней», «Этот месяц».',
      props: [
        { name: 'value', type: 'object', signature: '{ start: Date; end: Date } | null', description: 'Управляемый диапазон.' },
        { name: 'onValueChange', type: 'function', signature: '(range: DateRange) => void', description: 'Срабатывает по «Применить».' },
        { name: 'presets', type: 'object', signature: 'readonly { label: string; range: (today: Date) => DateRange }[]', description: 'Свои пресеты; [] скрывает колонку.' },
        { name: 'placeholder', type: 'node', default: 'дд.мм.гггг — дд.мм.гггг', description: 'Текст, пока диапазон не выбран.' },
        { name: 'max', type: 'object', signature: 'Date', description: 'В отчётах — сегодня: будущие дни недоступны.' },
        { name: 'today', type: 'object', signature: 'Date', description: 'Точка отсчёта пресетов; подмена для демо и тестов.' },
      ],
    },
  ],
  slots: [
    { name: 'popover-trigger', description: 'Триггер с видом поля.' },
    { name: 'popover', description: 'Поповер с календарём.' },
    { name: 'date-range-picker', description: 'Поповер диапазона: пресеты, месяцы, подвал.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Поле с датой табличными цифрами.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо ring.' },
    { id: 'open', label: 'открыто', description: 'Календарь в поповере под полем; у диапазона выбранный пресет — accent-soft и галочка.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: { columns: ['rest', 'hover', 'focus', 'disabled'] },
  keyboard: [
    { keys: ['Enter', 'Space'], action: 'Открывают календарь' },
    { keys: ['Esc'], action: 'Закрывает без изменений, фокус возвращается в поле' },
    { keys: ['←', '→', '↑', '↓'], action: 'Двигаются по дням внутри календаря' },
  ],
  a11y: [
    'Выбор дня закрывает поповер и возвращает фокус на поле; диапазон применяется кнопкой.',
    'Пресеты — кнопки с aria-pressed: подсвечен тот, что совпадает с диапазоном; ручная правка края снимает выделение.',
    'Подпись поля передайте через aria-label или видимый заголовок.',
  ],
  motion: [
    { label: 'Поповер', value: 'прозрачность и scale .96 + 4 px · 150 мс · ease-out' },
    { label: 'Пресет', value: 'полоса диапазона перерисовывается 150 мс · ease-out' },
    { label: 'Листание', value: 'оба месяца сдвигаются на 12 px с прозрачностью · 200 мс' },
    { label: '«Применить»', value: 'закрывает поповер, прозрачность 100 мс' },
  ],
  examples: [
    { id: 'field', title: 'В форме', description: 'Подпись, подсказка и дата по умолчанию.' },
    { id: 'range-limit', title: 'Ограничения', description: 'Только будущие даты в пределах двух месяцев.' },
    { id: 'report', title: 'Период отчёта', description: 'DateRangePicker с пресетами; будущие дни недоступны.' },
  ],
};

export default meta;
