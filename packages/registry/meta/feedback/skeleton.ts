import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'skeleton',
  status: 'stable',
  title: 'Скелетон',
  description: 'Держит место будущего содержимого его же формой, чтобы страница не прыгала после загрузки.',
  category: 'feedback',
  paperBoard: 'APS-0',
  anatomy: ['Строка 10 px', 'Круг под аватар', 'Прямоугольник под превью'],
  related: ['spinner', 'progress', 'empty-state'],
  source: { file: 'components/progress.tsx', exports: ['Skeleton'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'shape', type: 'enum', options: ['text', 'circle', 'rect'], default: 'text', description: 'Строка-капсула, круг или прямоугольник r8; размер — классами.' },
  ],
  slots: [{ name: 'skeleton', description: 'Заглушка; скрыта от экранного диктора.' }],
  states: [{ id: 'loading', label: 'мерцание', description: 'Показ через 300 мс; одна волна блика на всю группу за 2000 мс.' }],
  keyboard: [],
  a11y: ['Заглушки скрыты от экранного диктора; на контейнер списка ставьте aria-busy, пока идёт загрузка.'],
  motion: [
    { label: 'Показ', value: 'через 300 мс — быстрая загрузка не мигает' },
    { label: 'Блик', value: '2000 мс · linear, одной волной по всей группе' },
    { label: 'Сниженное движение', value: 'без блика, ровная заливка fill-2' },
  ],
  examples: [
    { id: 'list', title: 'Строки списка', description: 'Аватар и две строки текста.' },
    { id: 'card', title: 'Карточка', description: 'Превью, заголовок и подпись.' },
  ],
};

export default meta;
