import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'spinner',
  status: 'stable',
  title: 'Спиннер',
  description: 'Короткое ожидание неизвестной длины: дуга 16–24 px, оборот за 800 мс.',
  category: 'feedback',
  paperBoard: 'APS-0',
  anatomy: ['SVG-дуга', 'Подпись для экранного диктора'],
  related: ['progress', 'skeleton', 'button'],
  source: { file: 'components/spinner.tsx', exports: ['Spinner'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'size', type: 'number', options: [16, 20, 24], default: 20, description: 'Диаметр, px.' },
    { name: 'label', type: 'string', description: 'Делает спиннер статусом с названием. Не нужен, если родитель уже aria-busy.' },
    { name: 'inherit', type: 'boolean', default: false, description: 'Цвет текста родителя (в кнопках); иначе fg-3.' },
  ],
  slots: [{ name: 'spinner', description: 'SVG спиннера.' }],
  states: [{ id: 'loading', label: 'вращение', description: '800 мс на оборот, линейно.' }],
  keyboard: [],
  a11y: [
    'С label спиннер — role="status" с названием; без него скрыт от экранного диктора.',
    'Дольше пары секунд — показывайте скелетон или прогресс со значением.',
  ],
  motion: [
    { label: 'Вращение', value: '800 мс · linear' },
    { label: 'Сниженное движение', value: '1600 мс на оборот — медленнее, но не стоит' },
  ],
  examples: [
    { id: 'sizes', title: 'Размеры', description: '16, 20 и 24 px.' },
    { id: 'inline', title: 'В строке', description: 'Рядом с текстом статуса.' },
  ],
};

export default meta;
