import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'separator',
  status: 'stable',
  title: 'Разделитель',
  description: 'Волосяная линия между группами: горизонтальная в списках, вертикальная в панелях.',
  category: 'content',
  paperBoard: '1GJ-0',
  anatomy: ['Линия 1 px цвета separator'],
  related: ['card', 'list', 'toolbar'],
  source: { file: 'components/card.tsx', exports: ['Separator'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [{ name: 'orientation', type: 'enum', options: ['horizontal', 'vertical'], default: 'horizontal', description: 'Горизонтальная — на всю ширину, вертикальная — на высоту ряда.' }],
  slots: [{ name: 'separator', description: 'Линия (role="separator").' }],
  states: [{ id: 'rest', label: 'покой', description: 'Цвет separator, 7 % чернил.' }],
  keyboard: [],
  a11y: ['role="separator" с aria-orientation; чисто декоративную линию можно сделать бордером контейнера.'],
  motion: [{ label: '—', value: 'статичен' }],
  examples: [
    { id: 'list', title: 'В списке', description: 'Между строками настроек.' },
    { id: 'vertical', title: 'Вертикальный', description: 'Между группами в строке.' },
  ],
};

export default meta;
