import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'tree-view',
  status: 'stable',
  title: 'Дерево',
  description: 'Файлы и папки, иерархическая навигация или выбор. Шаг вложенности 24, линии уровней проходят через центр шеврона родителя. ← → сворачивают и раскрывают ветку, ↑ ↓ ходят по строкам.',
  category: 'navigation',
  paperBoard: '9XO-0',
  anatomy: ['Строка h32 r full, p 0 12 0 8', 'Шеврон 14 в слоте 16 (спиннер при загрузке)', 'Иконка 16 fg-2', 'Подпись 14/20, папка 500', 'Мета 12/16 fg-3', 'Линия уровня 1 separator'],
  related: ['sidebar', 'list', 'file-upload'],
  source: { file: 'components/tree-view.tsx', exports: ['TreeView'] },
  dependencies: { npm: ['lucide-react'], registry: ['spinner'] },
  props: [
    { name: 'aria-label', type: 'string', required: true, description: 'Название дерева.', control: false },
    {
      name: 'nodes',
      type: 'object',
      required: true,
      signature: 'readonly { id; label; icon?; meta?; children?; loading? }[]',
      description: 'Узлы; ветка — узел с children, loading показывает спиннер вместо шеврона.',
      control: false,
    },
    { name: 'defaultExpanded', type: 'object', signature: 'readonly string[]', description: 'Раскрытые ветки по умолчанию (или expanded + onExpandedChange).', control: false },
    { name: 'selected', type: 'string', description: 'Выбранный узел (или defaultSelected).', control: false },
    { name: 'onSelectedChange', type: 'function', signature: '(id: string) => void', description: 'Узел выбран щелчком или Enter.', control: false },
  ],
  slots: [{ name: 'tree-view', description: 'Дерево (role="tree"); строки — treeitem с aria-level.' }],
  states: [
    { id: 'rest', label: 'покой', description: '14/20 fg-1, мета fg-3.' },
    { id: 'hover', label: 'наведение', description: 'Фон fill-1.' },
    { id: 'pressed', label: 'нажатие', description: 'Фон fill-2, без масштаба в списке.' },
    { id: 'selected', label: 'выбрано', description: 'accent-soft, текст accent-soft-fg 500.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring, отступ 2.' },
    { id: 'loading', label: 'загрузка', description: 'Спиннер вместо шеврона, 800 мс на оборот.' },
  ],
  keyboard: [
    { keys: ['↑', '↓'], action: 'Предыдущая или следующая видимая строка' },
    { keys: ['→'], action: 'Раскрывает ветку; у раскрытой — переходит к первому ребёнку' },
    { keys: ['←'], action: 'Сворачивает ветку; у свёрнутой или файла — переходит к родителю' },
    { keys: ['Home', 'End'], action: 'Первая или последняя видимая строка' },
    { keys: ['Enter', 'Space'], action: 'Выбирает строку' },
  ],
  a11y: [
    'role="tree" и treeitem с aria-level, aria-setsize, aria-posinset — вложенность слышна без групп.',
    'Одна остановка Tab: фокус живёт на текущей строке (roving tabindex).',
    'Мета («184 КБ», «Загрузка…») связана со строкой через aria-describedby; ветка в загрузке — aria-busy.',
  ],
  motion: [
    { label: 'Шеврон', value: 'поворот на 90°, 150 мс ease-out' },
    { label: 'Ветка', value: 'строки раскрытой ветки проявляются, 200 мс ease-standard' },
    { label: 'Загрузка', value: 'спиннер вместо шеврона, 800 мс на оборот' },
  ],
  examples: [
    { id: 'documents', title: 'Документы клиента', description: 'Папки с количеством файлов, размеры и ветка в загрузке.' },
    { id: 'picker', title: 'Выбор папки', description: 'Выбранный узел показан под деревом.' },
  ],
};

export default meta;
