import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'tag',
  status: 'stable',
  title: 'Тег',
  description: 'Нажимаемая метка: фильтр с галочкой, выбор или удаляемое значение с крестиком.',
  category: 'data-display',
  paperBoard: '9O3-0',
  anatomy: ['Капсула 28, 32 или 36 px', 'Галочка при выборе', 'Текст', 'Счётчик', 'Крестик удаления'],
  related: ['badge', 'tags-input', 'toggle-group', 'segmented-control'],
  source: { file: 'components/badge.tsx', exports: ['Tag'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: [] },
  props: [
    { name: 'children', type: 'string', signature: 'ReactNode', required: true, description: 'Текст тега.' },
    { name: 'selected', type: 'boolean', default: false, description: 'Выбран: accent-soft и галочка.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'sm', description: 'Высота 28, 32 или 36 px; lg — чип-фильтр телефона: текст 15, выбор заливкой и кольцом без галочки.' },
    { name: 'count', type: 'number', description: 'Число после текста: «Все 6»; диктор читает «Все, 6».' },
    { name: 'countTone', type: 'enum', options: ['danger'], description: 'Счётчик-предупреждение красным: «Просроченные 2».' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступен.' },
    { name: 'onSelectedChange', type: 'function', signature: '(selected: boolean) => void', description: 'Делает тег переключателем-фильтром.', control: false },
    { name: 'onRemove', type: 'function', signature: '() => void', description: 'Добавляет крестик «Удалить «…»».', control: false },
    { name: 'removeLabel', type: 'string', description: 'Название крестика для экранного диктора.', control: false },
  ],
  slots: [{ name: 'tag', description: 'Тег; data-selected у выбранного.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Поверхность control с тенью.' },
    { id: 'hover', label: 'наведение', description: 'Фон control-hover.' },
    { id: 'pressed', label: 'нажатие', description: 'Масштаб 0,97.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {
    rows: [
      { label: 'обычный', props: {} },
      { label: 'выбран', props: { selected: true } },
    ],
  },
  keyboard: [
    { keys: ['Space', 'Enter'], action: 'Переключают фильтр' },
    { keys: ['Tab'], action: 'Доходит до крестика удаления' },
  ],
  a11y: [
    'Тег-фильтр — кнопка с aria-pressed.',
    'Крестик — отдельная кнопка с названием «Удалить «Брендинг»».',
  ],
  motion: [
    { label: 'Нажатие', value: 'scale .97 · 75 мс' },
    { label: 'Выбор', value: 'цвет 75 мс · ease-hover' },
  ],
  examples: [
    { id: 'filters', title: 'Фильтры', description: 'Теги-переключатели над списком.' },
    { id: 'removable', title: 'Удаляемые', description: 'Выбранные значения с крестиком.' },
    { id: 'phone', title: 'Фильтры на телефоне', description: 'Чипы 36 со счётчиками; ряд прокручивается вбок.' },
  ],
};

export default meta;
