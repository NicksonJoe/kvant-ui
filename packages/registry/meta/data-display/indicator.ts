import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'indicator',
  status: 'stable',
  title: 'Счётчик',
  description: 'Число непрочитанного на иконке или пункте меню: красная капсула 18 px с кольцом цвета поверхности.',
  category: 'data-display',
  paperBoard: '9O3-0',
  anatomy: ['Капсула danger 18 px', 'Число 11/16 табличное', 'Кольцо 2 px surface-1'],
  related: ['badge', 'avatar', 'tab-bar'],
  source: { file: 'components/badge.tsx', exports: ['CountBadge'] },
  dependencies: { npm: [], registry: [] },
  propsOf: 'CountBadge',
  props: [
    { name: 'count', type: 'number', options: [1, 3, 24, 120], default: 3, description: 'Число.' },
    { name: 'max', type: 'number', options: [9, 99], default: 99, description: 'Больше — показывается «99+».' },
  ],
  slots: [{ name: 'count-badge', description: 'Счётчик.' }],
  states: [{ id: 'rest', label: 'покой', description: 'Danger с белыми цифрами.' }],
  keyboard: [],
  a11y: [
    'Число для экранного диктора включайте в название кнопки: «Уведомления, 3 новых».',
    'Сам счётчик не нажимается и не получает фокус.',
  ],
  motion: [{ label: 'Появление', value: 'spring-bouncy (400 мс, отскок 0,3) — редкий случай, когда отскок уместен' }],
  examples: [
    { id: 'on-icon', title: 'На иконке', description: 'В правом верхнем углу кнопки-иконки.' },
    { id: 'overflow', title: 'Переполнение', description: 'Больше max — «99+».' },
  ],
};

export default meta;
