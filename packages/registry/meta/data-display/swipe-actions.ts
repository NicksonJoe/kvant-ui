import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'swipe-actions',
  status: 'beta',
  title: 'Свайп по строке',
  description: 'Быстрые действия за строкой списка на телефоне: вправо — отметить, влево — задача и «Ещё». Полный свайп выполняет крайнее положительное действие.',
  category: 'data-display',
  paperBoard: '1DQN-0',
  anatomy: ['Строка', 'Слой действий', 'Действие 72: круг 44 и подпись 12'],
  related: ['list', 'action-sheet', 'pull-to-refresh'],
  source: { file: 'components/swipe-actions.tsx', exports: ['SwipeActions'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'leading', type: 'object', signature: 'readonly SwipeAction[]', control: false, description: 'Действия слева, открываются свайпом вправо; крайнее выполняется полным свайпом.' },
    { name: 'trailing', type: 'object', signature: 'readonly SwipeAction[]', control: false, description: 'Действия справа; «Ещё» — последним, с tone="neutral".' },
    { name: 'children', type: 'node', required: true, control: false, description: 'Содержимое строки.' },
  ],
  slots: [
    { name: 'swipe-actions', description: 'Корень; data-state="closed" | "leading" | "trailing".' },
    { name: 'swipe-actions-row', description: 'Сдвигаемая строка.' },
  ],
  states: [
    { id: 'rest', label: 'закрыто', description: 'Действия под строкой, вне Tab.' },
    { id: 'open', label: 'открыто', description: 'Строка сдвинута на ширину действий, кнопки в Tab.' },
  ],
  keyboard: [{ keys: ['Tab'], action: 'По действиям, когда они открыты' }],
  a11y: ['Кнопки действий всегда в DOM: диктор доходит до них без жеста.', 'Не больше трёх действий в сторону.', 'Отрицательные действия — только в «Ещё», через подтверждение.'],
  motion: [
    { label: 'Жест', value: 'строка идёт за пальцем 1:1; за действиями без полного свайпа — сопротивление 0,3' },
    { label: 'Пороги', value: 'открыть — 40 % ширины действий, полный свайп — 60 % строки' },
    { label: 'Доводка', value: '250 мс · ease-fluid', tokens: ['duration-moderate'] },
  ],
  examples: [
    { id: 'deals', title: 'Сделки', description: '«Готово» вправо, «Задача» и «Ещё» влево.' },
    { id: 'inbox', title: 'Входящие', description: 'Одно действие «Прочитано».' },
  ],
};

export default meta;
