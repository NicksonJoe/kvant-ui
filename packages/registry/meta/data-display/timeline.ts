import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'timeline',
  status: 'stable',
  title: 'Лента событий',
  description:
    'История сделки, сгруппированная по дням. Линия связывает события одного дня, последнее отмечено акцентом. Время — моноширинным, чтобы колонка не прыгала.',
  category: 'data-display',
  paperBoard: 'G16-0',
  anatomy: ['День 12/16 500 fg-3', 'Рельс 1 separator', 'Точка 10: последняя accent с кольцом', 'Событие 14/20, имена 500', 'Детали: бейджи, комментарий, файл', 'Время mono 12, колонка 44'],
  related: ['list', 'message', 'skeleton', 'empty-state'],
  source: { file: 'components/timeline.tsx', exports: ['Timeline', 'TimelineDay', 'TimelineItem'] },
  dependencies: { npm: [], registry: [] },
  propsOf: 'TimelineItem',
  props: [
    { name: 'time', type: 'string', required: true, description: 'Время события: «14:32».' },
    { name: 'dateTime', type: 'string', description: 'Машиночитаемое время для <time>: 2026-10-29T14:32.' },
    { name: 'latest', type: 'boolean', default: false, description: 'Самое новое событие: точка accent с кольцом accent-soft.' },
    { name: 'children', type: 'node', required: true, description: 'Текст события; имена — в <b>.' },
    { name: 'description', type: 'node', description: 'Вторая строка 13/18 fg-3: сумма, документ, источник.' },
    { name: 'details', type: 'node', description: 'Блок под событием: смена этапа, комментарий, файл.', control: false },
  ],
  parts: [
    { name: 'Timeline', description: 'Лента: дни разделены линией.', props: [] },
    { name: 'TimelineDay', description: 'День: заголовок и упорядоченный список событий.', props: [{ name: 'label', type: 'node', required: true, description: '«Сегодня», «Вчера», «27 октября».' }] },
  ],
  slots: [
    { name: 'timeline', description: 'Лента.' },
    { name: 'timeline-day', description: 'День (section, список назван заголовком дня).' },
    { name: 'timeline-item', description: 'Событие; data-latest у последнего.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Точка: кольцо 2 fg-4.' },
    { id: 'selected', label: 'последнее', description: 'Точка accent с кольцом 3 accent-soft.', props: { latest: true } },
  ],
  keyboard: [],
  a11y: [
    'День — section с заголовком; события — упорядоченный список, названный этим заголовком.',
    'Время — элемент <time> с dateTime, чтобы ассистивные технологии понимали дату.',
  ],
  motion: [
    { label: 'Новое событие', value: 'y 8 + opacity, 200 мс ease-out' },
    { label: 'Загрузка', value: 'скелетон той же сетки, shimmer 2000 мс' },
  ],
  examples: [
    { id: 'deal-history', title: 'История сделки', description: 'Три дня: смена этапа, оплата, комментарий и файл.' },
    { id: 'states', title: 'Загрузка и пусто', description: 'Скелетон той же сетки и пустая история новой сделки.' },
  ],
};

export default meta;
