import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'table',
  status: 'stable',
  title: 'Таблица',
  description: 'Данные в ровных колонках на нативной таблице: сортировка, выбор строк, три плотности. Числа справа и табличными цифрами.',
  category: 'data-display',
  paperBoard: '5L9-0',
  anatomy: ['Контейнер r20', 'Шапка surface-2', 'Заголовок с сортировкой', 'Строка', 'Ячейка'],
  related: ['data-table', 'list', 'checkbox', 'pagination'],
  source: { file: 'components/table.tsx', exports: ['Table', 'TableHeader', 'TableBody', 'TableRow', 'TableHead', 'TableCell'] },
  dependencies: { npm: ['lucide-react'], registry: [] },
  props: [
    { name: 'density', type: 'enum', options: ['compact', 'comfortable', 'touch'], default: 'comfortable', description: 'Высота строки 40 / 48 / 56 px; comfortable следует плотности темы.' },
    { name: 'containerClassName', type: 'string', description: 'Класс контейнера: surface-1, r20, кольцо hairline.', control: false },
  ],
  parts: [
    {
      name: 'TableHead',
      description: 'Заголовок колонки.',
      props: [
        { name: 'numeric', type: 'boolean', description: 'Числа: выравнивание вправо.' },
        { name: 'sort', type: 'enum', options: ['ascending', 'descending', 'none'], description: 'Направление сортировки; ставит aria-sort.' },
        { name: 'onSort', type: 'function', signature: '() => void', description: 'Делает заголовок кнопкой сортировки.' },
      ],
    },
    { name: 'TableRow', description: 'Строка.', props: [{ name: 'selected', type: 'boolean', description: 'Выбрана: фон accent-soft, aria-selected.' }] },
    { name: 'TableCell', description: 'Ячейка.', props: [{ name: 'numeric', type: 'boolean', description: 'Вправо и табличные цифры.' }] },
  ],
  slots: [
    { name: 'table-container', description: 'Контейнер с горизонтальной прокруткой.' },
    { name: 'table', description: 'Таблица; несёт data-density.' },
    { name: 'table-row', description: 'Строка; data-selected у выбранной.' },
    { name: 'table-head', description: 'Заголовок колонки.' },
    { name: 'table-cell', description: 'Ячейка.' },
  ],
  states: [
    { id: 'rest', label: 'строка', description: 'Разделители separator между строками.' },
    { id: 'hover', label: 'наведение', description: 'Фон fill-1 мгновенно.' },
    { id: 'selected', label: 'выбрано', description: 'Фон accent-soft.' },
  ],
  keyboard: [{ keys: ['Tab'], action: 'Идёт по кнопкам сортировки и контролам в ячейках' }],
  a11y: [
    'Нативные table, th scope="col" и td — экранный диктор называет колонку для каждой ячейки.',
    'Сортируемый заголовок — кнопка внутри th, направление — в aria-sort.',
    'На узком экране таблица прокручивается внутри контейнера, страница не едет вбок.',
  ],
  motion: [{ label: 'Наведение строки', value: 'мгновенно — плотный список' }],
  examples: [
    { id: 'sorting', title: 'Сортировка', description: 'Нажатие на заголовок меняет порядок.' },
    { id: 'selection', title: 'Выбор строк', description: 'Флажки в первой колонке и выделение строк.' },
  ],
};

export default meta;
