import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'filter-bar',
  status: 'beta',
  title: 'Панель фильтров',
  description:
    'Строка над списком: поиск, применённые фильтры чипами «поле: значение» и «+ Фильтр». Изменения применяются сразу, счётчик результатов обновляется вместе с ними.',
  category: 'navigation',
  paperBoard: '1DPV-0',
  anatomy: ['Поиск 240', 'Чип фильтра h32 accent-soft', 'Крестик чипа 24', '«+ Фильтр» ghost', 'Счётчик и «Сбросить»'],
  related: ['search-field', 'menu', 'data-table', 'kanban'],
  source: { file: 'components/filter-bar.tsx', exports: ['FilterBar'] },
  dependencies: { npm: ['lucide-react', '@base-ui/react'], registry: ['menu'] },
  props: [
    { name: 'fields', type: 'object', signature: 'readonly FilterField[]', required: true, control: false, description: 'Поля фильтра: id, подпись, иконка и значения со счётчиками.' },
    { name: 'value', type: 'object', signature: 'FilterValue', required: true, control: false, description: 'Выбранные значения по id поля; поля без значений в объекте нет.' },
    { name: 'onValueChange', type: 'function', signature: '(value: FilterValue) => void', required: true, description: 'Любое изменение: отметка, снятие, сброс.' },
    { name: 'search', type: 'node', control: false, description: 'Слот слева, обычно SearchField.' },
    { name: 'count', type: 'node', description: 'Счётчик справа: «48 из 312».' },
  ],
  slots: [
    { name: 'filter-bar', description: 'Строка панели.' },
    { name: 'filter-chip', description: 'Применённый фильтр: подпись открывает значения, крестик снимает.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Чипы accent-soft, «+ Фильтр» ghost.' },
    { id: 'open', label: 'открыто', description: 'Чип accent-soft-hover; значения галочками со счётчиками.' },
    { id: 'empty', label: 'без фильтров', description: 'Только «+ Фильтр», «Сбросить» скрыт.' },
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], action: 'На чипе или «+ Фильтр»: открывает список' },
    { keys: ['↑', '↓'], action: 'По полям и значениям' },
    { keys: ['→'], action: 'Из поля — в его значения' },
    { keys: ['Esc'], action: 'Закрывает список' },
  ],
  a11y: [
    'Чип — кнопка «Фильтр Этап: Переговоры, изменить», крестик — «Снять фильтр Этап».',
    'Значения — menuitemcheckbox: отметка читается без цвета.',
    'Счётчик результатов лучше обернуть в aria-live, чтобы изменение было слышно.',
  ],
  motion: [{ label: 'Список значений', value: 'прозрачность и scale .96 → 1 · 150 мс · ease-out', tokens: ['duration-quick'] }],
  examples: [
    { id: 'deals', title: 'Сделки', description: 'Поиск, два фильтра и счётчик.' },
    { id: 'empty', title: 'Без фильтров', description: 'Поля с иконками в «+ Фильтр».' },
  ],
};

export default meta;
