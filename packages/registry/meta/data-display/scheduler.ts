import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'scheduler',
  status: 'beta',
  title: 'Планировщик',
  description:
    'Календарь событий на одних данных в трёх видах: месяц показывает плотность, неделя и день — точное время и пересечения. Многодневное событие идёт одной полосой через дни, «+N ещё» открывает поповер со всеми событиями дня. Категория — цвет chart-N, одинаковый во всех видах.',
  category: 'data-display',
  paperBoard: '1DPV-0',
  anatomy: [
    'Панель: период, стрелки, «Сегодня», легенда, вид',
    'Месяц: ячейка 104, 3 строки — все события, если помещаются, иначе 2 и «+N ещё»',
    'Весь день и многодневное: полоса h20 r5, chart-N 16 %; многодневное — с точкой и датами',
    'Перенос на следующую неделю: срезанный край без скругления',
    'Поповер дня: 300, r16, p12, строка 28 — точка, время mono, название',
    'Неделя: час 48, строка «весь день» с теми же полосами',
    'Событие r6: chart-N 16 % и точка',
    'Линия «сейчас» danger с меткой',
  ],
  related: ['gantt', 'calendar', 'date-picker'],
  source: { file: 'components/scheduler.tsx', exports: ['Scheduler', 'SCHEDULER_VIEWS'] },
  dependencies: { npm: ['lucide-react'], registry: ['popover'] },
  props: [
    { name: 'aria-label', type: 'string', required: true, description: 'Название календаря.' },
    { name: 'events', type: 'object', signature: 'readonly SchedulerEvent[]', required: true, control: false, description: 'События: время ISO или дата для «весь день», end — последний день многодневного, категория.' },
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
    { name: 'scheduler-span', description: 'Полоса события на весь день: data-span — число дней, data-lane — дорожка, data-clipped — срезанный край.' },
    { name: 'scheduler-day', description: 'Поповер «+N ещё» со всеми событиями дня.' },
    { name: 'scheduler-time', description: 'Неделя или день по часам.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'События с точкой категории; «весь день» — мягкая заливка 16 %; многодневное — одна полоса через дни, пересечения по дорожкам, у переноса на соседнюю неделю край срезан без скругления.' },
    { id: 'selected', label: 'выбрано', description: 'Событие сплошным цветом категории, текст fg-1.' },
    { id: 'open', label: 'поповер дня', description: '«+N ещё» открывает список всех событий дня; вид не меняется.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Панель, затем события по дням; многодневное — один раз, в первом дне' },
    { keys: ['Enter', 'Space'], action: 'Выбирает событие или открывает поповер дня из «+N ещё»' },
    { keys: ['Esc'], action: 'Закрывает поповер, фокус возвращается на «+N ещё»' },
  ],
  a11y: [
    'Месяц — grid; ячейка называет день и число событий, сегодня — aria-current="date".',
    'Событие — кнопка «10:00–11:00, Бриф „Полка“», событие на весь день — «Весь день, …».',
    'Многодневное — одна кнопка «10–12 ноября, Командировка» в первой видимой ячейке; продолжение на следующей неделе скрыто от диктора и Tab, а дни под полосой считают событие в своей подписи.',
    'Поповер дня — dialog с названием «Чт, 5 ноября» и описанием «4 события»; фокус переходит на первое событие, выбор закрывает поповер.',
    'Категорию дублирует легенда с подписями, не только цвет.',
  ],
  motion: [
    { label: 'Смена периода и вида', value: 'без анимации: сетка меняется сразу' },
    { label: 'Поповер дня', value: 'как у Popover: прозрачность и scale .96 · 150 мс' },
  ],
  examples: [
    { id: 'month', title: 'Месяц студии', description: 'Ноябрь: встречи, звонки, демо, сроки, командировка через три дня и «+N ещё» с поповером дня.' },
    { id: 'multi-day', title: 'Многодневные события', description: 'Выставка и отпуск переносятся на следующую неделю, пересечения — по дорожкам.' },
    { id: 'week', title: 'Неделя', description: 'Пересечения делят колонку, линия «сейчас» 13:20.' },
  ],
};

export default meta;
