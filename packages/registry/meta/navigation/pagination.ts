import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'pagination',
  status: 'stable',
  title: 'Пагинация',
  description: 'Полная — под длинными списками и в поиске; компактная — в подвале таблицы; на телефоне две кнопки и номер страницы. Первая и последняя страницы видны всегда.',
  category: 'navigation',
  paperBoard: '9XO-0',
  anatomy: ['Назад', 'Страница ghost h32 min-w 32', '«…» 32 fg-3', 'Текущая fill-2 600', 'Вперёд'],
  related: ['data-table', 'table', 'select'],
  source: { file: 'components/pagination.tsx', exports: ['Pagination', 'pageRange'] },
  dependencies: { npm: ['lucide-react', '@base-ui/react'], registry: ['button'] },
  props: [
    { name: 'page', type: 'number', required: true, description: 'Текущая страница, с единицы.' },
    { name: 'pageCount', type: 'number', required: true, description: 'Всего страниц.' },
    { name: 'onPageChange', type: 'function', required: true, signature: '(page: number) => void', description: 'Новая страница.', control: false },
    { name: 'variant', type: 'enum', options: ['full', 'compact', 'mobile'], default: 'full', description: 'full — номера; compact — «5 / 25» в подвале таблицы; mobile — кнопки lg 44 и «5 из 25».' },
    { name: 'labels', type: 'boolean', default: true, description: 'Полный вариант: «Назад» и «Вперёд» у стрелок; без них — кнопки-иконки.' },
  ],
  slots: [{ name: 'pagination', description: 'Навигация «Страницы»; несёт data-variant.' }],
  states: [
    { id: 'rest', label: 'покой', description: '13/16 500 fg-2.' },
    { id: 'hover', label: 'наведение', description: 'Фон fill-1, fg-1.' },
    { id: 'pressed', label: 'нажатие', description: 'Фон fill-2, масштаб 0,94.' },
    { id: 'selected', label: 'текущая', description: 'Фон fill-2, 600 fg-1, aria-current="page".' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring, отступ 2.' },
    { id: 'disabled', label: 'отключено', description: 'Стрелка на первой или последней странице: 50 %, не в табе.' },
  ],
  matrix: { rows: [{ label: 'compact', props: { variant: 'compact' } }], columns: ['rest', 'hover', 'pressed', 'focus'] },
  keyboard: [
    { keys: ['Tab'], action: 'Назад → страницы → вперёд; недоступные стрелки пропускаются' },
    { keys: ['Enter', 'Space'], action: 'Открывает страницу' },
  ],
  a11y: [
    'Навигация «Страницы»; у номера название «Страница 5», у текущей — aria-current="page".',
    'Многоточие скрыто от экранного диктора — первая и последняя страницы доступны всегда.',
  ],
  motion: [
    { label: 'Наведение', value: '75 мс ease-hover' },
    { label: 'Нажатие', value: 'scale .94, 75 мс ease-out' },
    { label: 'Смена страницы', value: 'контент opacity 150 мс, прокрутка к началу списка без анимации' },
  ],
  examples: [
    { id: 'table-footer', title: 'Подвал таблицы', description: 'Строк на странице и компактный переход.' },
    { id: 'mobile', title: 'Телефон', description: 'Две большие кнопки и номер страницы.' },
  ],
};

export default meta;
