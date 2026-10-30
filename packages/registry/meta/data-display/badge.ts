import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'badge',
  status: 'stable',
  title: 'Бейдж',
  description: 'Короткая метка статуса или свойства. Не нажимается — для фильтров есть тег.',
  category: 'data-display',
  paperBoard: '9O3-0',
  anatomy: ['Капсула 20 px', 'Точка или иконка 12 px', 'Текст 12/16'],
  related: ['tag', 'indicator', 'kbd'],
  source: { file: 'components/badge.tsx', exports: ['Badge', 'BADGE_TONES', 'BADGE_VARIANTS'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'tone', type: 'enum', options: ['neutral', 'accent', 'success', 'warning', 'danger', 'info'], default: 'neutral', description: 'Смысл: статус сделки, предупреждение, ошибка.' },
    { name: 'variant', type: 'enum', options: ['soft', 'solid', 'outline', 'dot'], default: 'soft', description: 'soft — по умолчанию, solid — громко, outline — тихо, dot — точка цвета статуса.' },
    { name: 'children', type: 'string', signature: 'ReactNode', description: 'Текст: одно-два слова.' },
    { name: 'icon', type: 'node', description: 'Иконка 12 px перед текстом.', control: false },
  ],
  slots: [{ name: 'badge', description: 'Бейдж; несёт data-tone.' }],
  states: [{ id: 'rest', label: 'покой', description: 'Не интерактивен — без наведения и фокуса.' }],
  matrix: { rowProp: 'variant', columnProp: 'tone' },
  keyboard: [],
  a11y: [
    'Цвет — не единственный признак: в бейдже всегда есть текст.',
    'Тон dot подходит для статусов в таблицах: цвет точки плюс слово.',
  ],
  motion: [{ label: 'Появление', value: 'без анимации; новый счётчик — spring-bouncy' }],
  examples: [
    { id: 'tones', title: 'Тона', description: 'Шесть смыслов в мягком варианте.' },
    { id: 'statuses', title: 'Статусы сделок', description: 'Точки и иконки в контексте.' },
  ],
};

export default meta;
