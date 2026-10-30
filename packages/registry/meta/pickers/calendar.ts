import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'calendar',
  status: 'stable',
  title: 'Календарь',
  description:
    'Месяц целиком, без прокрутки, неделя с понедельника. Calendar выбирает одну дату, RangeCalendar — диапазон на двух месяцах: первое нажатие ставит начало, второе — конец.',
  category: 'pickers',
  paperBoard: 'DLG-0',
  anatomy: ['Заголовок месяца', 'Кнопки «назад» и «вперёд»', 'Дни недели', 'Сетка дней 36 px', 'Отметка «сегодня»', 'Полоса диапазона'],
  related: ['date-picker', 'date-field', 'scheduler'],
  source: { file: 'components/calendar.tsx', exports: ['Calendar', 'RangeCalendar', 'addMonths', 'monthWeeks', 'formatDate', 'formatMonth'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['button', 'input', 'popover'] },
  props: [
    { name: 'value', type: 'object', signature: 'Date | null', description: 'Управляемая дата.', control: false },
    { name: 'defaultValue', type: 'object', signature: 'Date | null', description: 'Дата по умолчанию.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(date: Date) => void', description: 'Выбранная дата.', control: false },
    { name: 'min', type: 'object', signature: 'Date', description: 'Раньше нельзя.', control: false },
    { name: 'max', type: 'object', signature: 'Date', description: 'Позже нельзя.', control: false },
    { name: 'isDateDisabled', type: 'function', signature: '(date: Date) => boolean', description: 'Отключает отдельные дни: выходные, занятые слоты.', control: false },
    { name: 'defaultMonth', type: 'object', signature: 'Date', description: 'Какой месяц показать первым.', control: false },
    { name: 'today', type: 'object', signature: 'Date', description: 'Подмена «сегодня» для демо и тестов.', control: false },
  ],
  parts: [
    {
      name: 'RangeCalendar',
      description: 'Диапазон: полоса accent-soft по неделям, края — круги accent; дни других месяцев скрыты.',
      props: [
        { name: 'value', type: 'object', signature: '{ start: Date; end: Date } | null', description: 'Управляемый диапазон.' },
        { name: 'onValueChange', type: 'function', signature: '(range: DateRange) => void', description: 'Срабатывает после второго нажатия; края упорядочены.' },
        { name: 'months', type: 'enum', options: [1, 2], default: 2, description: 'Сколько месяцев рядом.' },
        { name: 'defaultMonth', type: 'object', signature: 'Date', description: 'Первый показанный месяц; по умолчанию — месяц перед концом диапазона.' },
        { name: 'min', type: 'object', signature: 'Date', description: 'Раньше нельзя.' },
        { name: 'max', type: 'object', signature: 'Date', description: 'Позже нельзя: в отчётах — сегодня.' },
      ],
    },
  ],
  slots: [
    { name: 'calendar', description: 'Корень календаря, 288 px.' },
    { name: 'range-calendar', description: 'Корень календаря диапазона: месяцы по 288 с шагом 32.' },
  ],
  states: [
    { id: 'rest', label: 'день', description: 'Круг 36 px, цифры табличные.' },
    { id: 'hover', label: 'наведение', description: 'Фон fill-2.' },
    { id: 'selected', label: 'выбрано', description: 'Заливка accent, цифра accent-fg 600; середина диапазона — полоса accent-soft.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring на дне в фокусе.' },
    { id: 'disabled', label: 'недоступно', description: 'Прозрачность 40 %, не нажимается.' },
  ],
  keyboard: [
    { keys: ['←', '→'], action: 'День назад или вперёд' },
    { keys: ['↑', '↓'], action: 'Неделя назад или вперёд' },
    { keys: ['Home', 'End'], action: 'Начало или конец недели' },
    { keys: ['PageUp', 'PageDown'], action: 'Месяц назад или вперёд; с Shift — год' },
    { keys: ['Enter', 'Space'], action: 'Выбирают день (в диапазоне — начало, затем конец)' },
  ],
  a11y: [
    'Каждый месяц — сетка с ролью grid: в порядке Tab одна остановка, дальше — стрелки, в том числе через границу месяцев.',
    'У каждого дня полное название: «четверг, 29 октября 2026 г.».',
    'Сегодняшний день помечен aria-current="date", заголовок месяца объявляется при смене.',
  ],
  motion: [
    { label: 'Смена месяца', value: 'сдвиг 12 px и прозрачность в сторону перехода · 200 мс · ease-out' },
    { label: 'Полоса диапазона', value: 'перерисовывается 150 мс · ease-out' },
    { label: 'Сниженное движение', value: 'только прозрачность' },
  ],
  examples: [
    { id: 'meeting', title: 'Дата встречи', description: 'Управляемый календарь с подписью выбранной даты.' },
    { id: 'workdays', title: 'Только рабочие дни', description: 'Ближайшие 30 дней без выходных.' },
    { id: 'range', title: 'Диапазон', description: 'Два месяца рядом, будущие дни недоступны.' },
  ],
};

export default meta;
