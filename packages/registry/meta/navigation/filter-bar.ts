import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'filter-bar',
  status: 'beta',
  title: 'Панель фильтров',
  description:
    'Строка над списком: поиск, применённые фильтры чипами «поле: значение» и «+ Фильтр». Изменения применяются сразу, счётчик результатов обновляется вместе с ними. Строка не переносится: чипы, которые не помещаются по ширине, уходят в «Ещё N», и в его меню их можно изменить или снять.',
  category: 'navigation',
  paperBoard: '1DPV-0',
  anatomy: ['Поиск 240', 'Чип фильтра h32 accent-soft', 'Крестик чипа 24', '«Ещё N» h32 accent-soft со счётчиком accent', '«+ Фильтр» ghost', 'Счётчик и «Сбросить»'],
  related: ['search-field', 'menu', 'data-table', 'kanban'],
  source: { file: 'components/filter-bar.tsx', exports: ['FilterBar'] },
  dependencies: { npm: ['lucide-react', '@base-ui/react'], registry: ['menu', 'sheet', 'checkbox', 'button'] },
  props: [
    { name: 'fields', type: 'object', signature: 'readonly FilterField[]', required: true, control: false, description: 'Поля фильтра: id, подпись, иконка и значения со счётчиками.' },
    { name: 'value', type: 'object', signature: 'FilterValue', required: true, control: false, description: 'Выбранные значения по id поля; поля без значений в объекте нет.' },
    { name: 'onValueChange', type: 'function', signature: '(value: FilterValue) => void', required: true, description: 'Любое изменение: отметка, снятие, сброс.' },
    { name: 'search', type: 'node', control: false, description: 'Слот слева, обычно SearchField.' },
    { name: 'count', type: 'node', description: 'Счётчик справа: «48 из 312».' },
    { name: 'showLabel', type: 'string', default: 'Показать', description: 'Основная кнопка шита на узком экране: «Показать 48 сделок».' },
  ],
  slots: [
    { name: 'filter-bar', description: 'Панель, контейнер для запросов по ширине.' },
    { name: 'filter-bar-row', description: 'Ряд с зазором 8; от 720 px не переносится, его ширина — основа расчёта.' },
    { name: 'filter-bar-search', description: 'Обёртка слота поиска, не сжимается; без поиска скрыта.' },
    { name: 'filter-chip', description: 'Применённый фильтр: подпись открывает значения, крестик снимает.' },
    { name: 'filter-bar-more', description: '«Ещё N»: N — сколько применённых фильтров не поместилось.' },
    { name: 'filter-bar-tail', description: 'Счётчик результатов и «Сбросить», прижаты вправо.' },
    { name: 'filter-bar-measure', description: 'Скрытая копия чипов, «Ещё» и «+ Фильтр» для замеров: aria-hidden, inert.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Чипы accent-soft, «+ Фильтр» ghost.' },
    { id: 'open', label: 'открыто', description: 'Чип accent-soft-hover; значения галочками со счётчиками.' },
    { id: 'empty', label: 'без фильтров', description: 'Только «+ Фильтр», «Сбросить» скрыт.' },
    {
      id: 'filled',
      label: 'не помещается',
      description: 'Хвостовые чипы уходят в «Ещё N» accent-soft, число — кружок accent. В меню — поля «Этап: Переговоры» с подменю значений и «Снять фильтр».',
      selector: 'data-slot=filter-bar-more',
    },
    { id: 'collapsed', label: 'узко', description: 'Уже 720 px: кнопка «Фильтры · N» и нижний шит с галочками, «Сбросить» и «Показать».' },
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], action: 'На чипе, «Ещё N» или «+ Фильтр»: открывает список' },
    { keys: ['↑', '↓'], action: 'По полям и значениям' },
    { keys: ['→'], action: 'Из поля — в его значения' },
    { keys: ['Esc'], action: 'Закрывает список' },
  ],
  a11y: [
    'Чип — кнопка «Фильтр Этап: Переговоры, изменить», крестик — «Снять фильтр Этап».',
    'Значения — menuitemcheckbox: отметка читается без цвета.',
    'Счётчик результатов лучше обернуть в aria-live, чтобы изменение было слышно.',
    '«Ещё N» — кнопка «Ещё фильтры, применено: 2»; свёрнутые фильтры в её меню читаются как «Ответственный: Анна», «Снять фильтр Ответственный» — пункт подменю.',
    'Копия для замеров скрыта от диктора и клавиатуры: aria-hidden и inert, кнопок в ней нет.',
  ],
  motion: [
    { label: 'Список значений', value: 'прозрачность и scale .96 → 1 · 150 мс · ease-out', tokens: ['duration-quick'] },
    {
      label: 'Сворачивание в «Ещё»',
      value: 'пересчёт по ResizeObserver до отрисовки',
      note: 'Ширины берутся из скрытой копии, а не из видимых чипов, поэтому ряд не мигает и не раздувает сам себя.',
      easing: 'instant',
    },
  ],
  examples: [
    { id: 'deals', title: 'Сделки', description: 'Поиск, два фильтра и счётчик.' },
    { id: 'empty', title: 'Без фильтров', description: 'Поля с иконками в «+ Фильтр».' },
    { id: 'overflow', title: 'Много фильтров', description: 'Пять применённых фильтров в узкой строке: хвост уходит в «Ещё N». Потяните правый край, чтобы изменить ширину.' },
  ],
};

export default meta;
