import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'toolbar',
  status: 'stable',
  title: 'Панель инструментов',
  description: 'Плавает над документом, поэтому стеклянная. Кнопки — круги 36 внутри капсулы 44, группы разделены штрихом. Панель выделения появляется над выделенным текстом и исчезает вместе с ним.',
  category: 'navigation',
  paperBoard: '9XO-0',
  anatomy: ['Стеклянная капсула h44, p4, gap 4', 'Кнопка-круг 36, иконка 16', 'Переключатель: accent-soft во включённом', 'Штрих 1 × 20 separator', 'Панель выделения h36: кнопки 28, glass-strong'],
  related: ['button-group', 'toggle-button', 'tooltip', 'menu'],
  source: { file: 'components/toolbar.tsx', exports: ['Toolbar', 'ToolbarButton', 'ToolbarToggle', 'ToolbarSeparator', 'ToolbarGroup'] },
  dependencies: { npm: ['@base-ui/react'], registry: ['tooltip'] },
  props: [
    { name: 'variant', type: 'enum', options: ['floating', 'selection'], default: 'floating', description: 'floating — капсула 44 над документом; selection — компактная панель 36 над выделенным текстом.' },
    { name: 'aria-label', type: 'string', description: 'Название панели: «Форматирование».', control: false },
    { name: 'orientation', type: 'enum', options: ['horizontal', 'vertical'], default: 'horizontal', description: 'Ось стрелок клавиатуры.', control: false },
  ],
  parts: [
    {
      name: 'ToolbarButton',
      description: 'Кнопка: только иконка (подпись уходит в подсказку) или иконка с текстом.',
      props: [
        { name: 'label', type: 'string', required: true, description: 'Название и подсказка.' },
        { name: 'icon', type: 'node', description: 'Иконка 16.' },
        { name: 'shortcut', type: 'string', description: 'Сочетание в подсказке: «⌘B».' },
        { name: 'disabled', type: 'boolean', description: 'Нечего повторить: 50 %.' },
      ],
    },
    {
      name: 'ToolbarToggle',
      description: 'Переключатель форматирования с aria-pressed.',
      props: [
        { name: 'label', type: 'string', required: true, description: 'Название и подсказка.' },
        { name: 'icon', type: 'node', required: true, description: 'Иконка 16.' },
        { name: 'pressed', type: 'boolean', description: 'Управляемое состояние (или defaultPressed).' },
        { name: 'onPressedChange', type: 'function', signature: '(pressed: boolean) => void', description: 'Новое состояние.' },
      ],
    },
    { name: 'ToolbarSeparator', description: 'Штрих 1 × 20 между группами.', props: [] },
    { name: 'ToolbarGroup', description: 'Группа кнопок.', props: [] },
  ],
  slots: [
    { name: 'toolbar', description: 'Панель (role="toolbar"); несёт data-variant.' },
    { name: 'toolbar-button', description: 'Кнопка.' },
    { name: 'toolbar-toggle', description: 'Переключатель; data-pressed во включённом.' },
    { name: 'toolbar-separator', description: 'Разделитель групп.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Иконка fg-2.' },
    { id: 'hover', label: 'наведение', description: 'fill-2, иконка fg-1.' },
    { id: 'pressed', label: 'нажатие', description: 'fill-3, масштаб 0,94.' },
    { id: 'checked', label: 'включено', description: 'accent-soft, иконка accent-soft-fg.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring, отступ 2.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.' },
  ],
  matrix: { rowProp: 'variant', columns: ['rest', 'hover', 'pressed', 'focus'] },
  keyboard: [
    { keys: ['Tab'], action: 'Одна остановка на всю панель' },
    { keys: ['←', '→'], action: 'Соседняя кнопка' },
    { keys: ['Home', 'End'], action: 'Первая или последняя кнопка' },
    { keys: ['Enter', 'Space'], action: 'Нажимает кнопку или переключает' },
  ],
  a11y: [
    'role="toolbar" с названием; внутри — roving tabindex.',
    'Кнопки-иконки названы и показывают подсказку с сочетанием клавиш.',
    'Переключатели — aria-pressed, состояние не только цветом: подсказка называет действие.',
  ],
  motion: [
    { label: 'Панель выделения', value: 'opacity + scale .96 + 4 px, 150 мс ease-out, через 120 мс после отпускания мыши' },
    { label: 'Переключатель', value: 'фон 100 мс' },
    { label: 'Нажатие', value: 'scale .94, 75 мс ease-out' },
  ],
  examples: [
    { id: 'editor', title: 'Редактор заметки', description: 'Плавающая панель снизу по центру документа.' },
    { id: 'selection', title: 'Панель выделения', description: 'Форматирование и действия над выделенным текстом.' },
  ],
};

export default meta;
