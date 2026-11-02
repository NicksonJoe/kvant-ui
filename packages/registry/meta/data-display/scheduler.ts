import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'scheduler',
  status: 'beta',
  title: 'Планировщик',
  description:
    'Календарь событий на одних данных в трёх видах: месяц показывает плотность, неделя и день — точное время и пересечения. Категория — цвет chart-N, одинаковый во всех видах.',
  category: 'data-display',
  paperBoard: '1DPV-0',
  anatomy: ['Панель: период, стрелки, «Сегодня», легенда, вид', 'Месяц: ячейка 104, до 3 событий и «+N ещё»', 'Неделя: час 48, строка «весь день»', 'Событие r6: chart-N 16 % и точка', 'Линия «сейчас» danger с меткой'],
  related: ['gantt', 'calendar', 'date-picker'],
  source: { file: 'components/scheduler.tsx', exports: ['Scheduler', 'SCHEDULER_VIEWS'] },
  dependencies: { npm: ['lucide-react'], registry: [] },
  props: [
    { name: 'aria-label', type: 'string', required: true, description: 'Название календаря.' },
    { name: 'events', type: 'object', signature: 'readonly SchedulerEvent[]', required: true, control: false, description: 'События: время ISO или дата для «весь день», категория.' },
    { name: 'categories', type: 'object', signature: 'readonly SchedulerCategory[]', control: false, description: 'Категории с цветом chart-N; показываются легендой.' },
    { name: 'defaultView', type: 'enum', options: ['month', 'week', 'day'], default: 'month', description: 'Вид при открытии; view и onViewChange — для управления.' },
    { name: 'defaultDate', type: 'string', control: false, description: 'День внутри показанного периода; date и onDateChange — для управления.' },
    { name: 'today', type: 'string', control: false, description: 'Подсвеченный день; по умолчанию сегодня.' },
    { name: 'now', type: 'string', control: false, description: 'Линия «сейчас»; по умолчанию текущее время.' },
    { name: 'startHour', type: 'number', default: 8, control: false, description: 'Первый час недели и дня.' },
    { name: 'endHour', type: 'number', default: 20, control: false, description: 'Последний час.' },
    { name: 'selectedId', type: 'string', control: false, description: 'Выбранное событие — сплошной цвет категории.' },
    { name: 'onSelect', type: 'function', signature: '(id: string) => void', description: 'Нажатие на событие.' },
  ],
  slots: [
    { name: 'scheduler', description: 'Корень.' },
    { name: 'scheduler-toolbar', description: 'Панель периода и вида.' },
    { name: 'scheduler-month', description: 'Сетка месяца, role="grid".' },
    { name: 'scheduler-time', description: 'Неделя или день по часам.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'События с точкой категории; «весь день» — мягкая заливка 16 %.' },
    { id: 'selected', label: 'выбрано', description: 'Событие сплошным цветом категории, текст fg-1.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Панель, затем события по дням' },
    { keys: ['Enter', 'Space'], action: 'Выбирает событие или открывает день из «+N ещё»' },
  ],
  a11y: [
    'Месяц — grid; ячейка называет день и число событий, сегодня — aria-current="date".',
    'Событие — кнопка «10:00–11:00, Бриф „Полка“», событие на весь день — «Весь день, …».',
    'Категорию дублирует легенда с подписями, не только цвет.',
  ],
  motion: [{ label: 'Смена периода и вида', value: 'без анимации: сетка меняется сразу' }],
  examples: [
    { id: 'month', title: 'Месяц студии', description: 'Ноябрь: встречи, звонки, демо, сроки и «+1 ещё».' },
    { id: 'week', title: 'Неделя', description: 'Пересечения делят колонку, линия «сейчас» 13:20.' },
  ],
};

export default meta;
