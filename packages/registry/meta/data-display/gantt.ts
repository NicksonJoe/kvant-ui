import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'gantt',
  status: 'beta',
  title: 'Диаграмма Ганта',
  description:
    'План проекта: список задач слева, недели справа. Полоса показывает план и сделанное, веха — ромб, связи «финиш → старт» со стрелкой, красная линия — сегодня.',
  category: 'data-display',
  paperBoard: '1DPV-0',
  anatomy: ['Список 280: задача и кто', 'Шкала по неделям, выходные fill-1', 'Итог группы h6 fg-4', 'Полоса h22 r6', 'Веха — ромб', 'Связь 1,5 fg-4 со стрелкой', 'Линия «сегодня» danger'],
  related: ['scheduler', 'timeline', 'kanban'],
  source: { file: 'components/gantt.tsx', exports: ['Gantt'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'aria-label', type: 'string', required: true, description: 'Название плана.' },
    { name: 'tasks', type: 'object', signature: 'readonly GanttTask[]', required: true, control: false, description: 'Задачи: даты ISO, группа, прогресс 0…1, цвет, исполнитель, веха, зависимости, риск.' },
    { name: 'from', type: 'string', required: true, control: false, description: 'Первый день шкалы, лучше понедельник.' },
    { name: 'to', type: 'string', required: true, control: false, description: 'Последний день шкалы.' },
    { name: 'today', type: 'string', control: false, description: 'Линия «сегодня» и подсветка текущей недели.' },
    { name: 'dayWidth', type: 'number', options: [20, 30, 40], default: 30, description: 'Ширина дня, px.' },
    { name: 'selectedId', type: 'string', control: false, description: 'Выбранная задача: сплошная полоса, кольцо ring и ручки.' },
    { name: 'onSelect', type: 'function', signature: '(id: string) => void', description: 'Нажатие на строку списка.' },
  ],
  slots: [
    { name: 'gantt', description: 'Корень.' },
    { name: 'gantt-list', description: 'Список задач.' },
    { name: 'gantt-timeline', description: 'Шкала с горизонтальной прокруткой.' },
    { name: 'gantt-link', description: 'Связь между задачами.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'План 22 %, сделано 45 % цвета серии, «Готово» в завершённых.' },
    { id: 'selected', label: 'выбрано', description: 'Строка accent-soft, полоса сплошная с кольцом ring и ручками 4 × 14.' },
    { id: 'invalid', label: 'риск', description: 'Текст риска внутри полосы справа, danger-soft-fg; процент выполнения стоит там же.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'По задачам списка' },
    { keys: ['Enter', 'Space'], action: 'Выбирает задачу' },
  ],
  a11y: [
    'Задача — кнопка с датами и прогрессом: «Прототип, 2 ноя – 6 ноя, готово 70 %»; веха — «веха 18 ноя».',
    'Группа — group «Дизайн, 3 задачи»; шкала и полосы скрыты от диктора, их смысл уже в списке.',
    'Риск подписан словами, не только цветом.',
  ],
  motion: [{ label: 'Выбор', value: 'без анимации: строка и полоса меняются сразу' }],
  examples: [
    { id: 'project', title: 'Проект', description: 'Две группы, вехи, риск, сегодня — 3 ноября.' },
    { id: 'roadmap', title: 'Дорожная карта', description: 'Без групп, день 20 px.' },
  ],
};

export default meta;
