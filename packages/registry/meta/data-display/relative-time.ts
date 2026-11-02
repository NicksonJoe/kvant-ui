import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'relative-time',
  status: 'beta',
  title: 'Относительное время',
  description: 'Время, как его говорят: «5 мин назад», «вчера, 18:52», «22 октября, 14:05». Точная дата — в подсказке, текст обновляется сам раз в 30 секунд.',
  category: 'data-display',
  paperBoard: '1DQ9-0',
  anatomy: ['time с dateTime', 'Подсказка с точной датой'],
  related: ['timeline', 'notification-center', 'message'],
  source: { file: 'components/relative-time.tsx', exports: ['RelativeTime', 'formatRelativeTime', 'formatExactTime'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'date', type: 'string', options: ['2026-11-03T14:59:40', '2026-11-03T14:55:00', '2026-11-02T18:52:00', '2026-10-22T14:05:00'], default: '2026-11-03T14:55:00', required: true, description: 'Дата: Date или ISO-строка.' },
    { name: 'now', type: 'object', signature: 'Date', control: false, description: 'Фиксированное «сейчас» для превью и тестов; без него текст обновляется сам.' },
  ],
  slots: [{ name: 'relative-time', description: 'Элемент time.' }],
  states: [{ id: 'rest', label: 'покой', description: 'Меньше минуты — «только что», меньше часа — минуты, до 6 часов — часы, дальше — день и время.' }],
  keyboard: [],
  a11y: ['Элемент time с машинной датой в dateTime.', 'Точная дата в title: «3 ноября 2026, 14:55».', 'В таблицах и журналах лучше точная дата — относительная плывёт.'],
  motion: [{ label: 'Обновление', value: 'раз в 30 с, без анимации' }],
  examples: [
    { id: 'feed', title: 'Лента событий', description: 'Минуты, часы, вчера и дата.' },
    { id: 'live', title: 'Живое время', description: 'Без now: «только что», потом минуты.' },
  ],
};

export default meta;
