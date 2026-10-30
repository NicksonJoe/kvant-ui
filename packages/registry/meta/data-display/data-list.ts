import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'data-list',
  status: 'stable',
  title: 'Список свойств',
  description: 'Пары «ключ — значение» одной записи. Горизонтальный — в панелях и боковых листах, вертикальный — в шапке сделки и на узких экранах.',
  category: 'data-display',
  paperBoard: '1GX-0',
  anatomy: ['Список dl', 'Строка ≥ 44 с разделителем', 'Ключ 180 fg-3', 'Значение 14/20 500', 'Кнопка «копировать» при наведении'],
  related: ['list', 'card', 'sheet', 'table'],
  source: { file: 'components/data-list.tsx', exports: ['DataList', 'DataListItem'] },
  dependencies: { npm: ['lucide-react'], registry: [] },
  props: [
    { name: 'orientation', type: 'enum', options: ['horizontal', 'vertical'], default: 'horizontal', description: 'horizontal — ключ слева шириной 180; vertical — ключ над значением, три колонки.' },
  ],
  parts: [
    {
      name: 'DataListItem',
      description: 'Пара dt + dd.',
      props: [
        { name: 'label', type: 'node', required: true, description: 'Ключ: «Клиент», «ИНН».' },
        { name: 'children', type: 'node', required: true, description: 'Значение; числа и даты — табличными цифрами.' },
        { name: 'copyValue', type: 'string', description: 'Текст для кнопки «копировать», которая появляется при наведении на строку.' },
        { name: 'wide', type: 'boolean', description: 'Вертикальный список: пункт на все колонки под разделителем (комментарий, адрес).' },
      ],
    },
  ],
  slots: [
    { name: 'data-list', description: 'Список dl; несёт data-orientation.' },
    { name: 'data-list-item', description: 'Пара ключ — значение.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Кнопка «копировать» скрыта; на касании видна всегда.' },
    { id: 'hover', label: 'наведение', description: 'Появляется кнопка «копировать», 75 мс.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Доходит до кнопки «копировать» — она проявляется при фокусе' },
    { keys: ['Enter', 'Space'], action: 'Копирует значение' },
  ],
  a11y: [
    'Нативные dl, dt и dd: экранный диктор читает ключ и значение парой.',
    'Кнопка копирования называется «Скопировать: ИНН», результат объявляется в role="status».',
  ],
  motion: [
    { label: 'Кнопка «копировать»', value: 'появляется при наведении на строку, opacity 75 мс' },
    { label: 'После копирования', value: 'иконка → галочка, scale .8 → 1, 150 мс; возврат через 2000 мс' },
  ],
  examples: [
    { id: 'deal', title: 'Карточка сделки', description: 'Горизонтальный: аватар, этап, сумма и ИНН с копированием.' },
    { id: 'vertical', title: 'Шапка сделки', description: 'Вертикальный: три колонки и комментарий на всю ширину.' },
  ],
};

export default meta;
