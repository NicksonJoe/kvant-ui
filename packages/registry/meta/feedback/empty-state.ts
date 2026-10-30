import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'empty-state',
  status: 'stable',
  title: 'Пустое состояние',
  description: 'Объясняет, почему здесь пусто, и предлагает следующий шаг.',
  category: 'feedback',
  paperBoard: 'APS-0',
  anatomy: ['Круг 48 px с иконкой', 'Заголовок 16/24', 'Пояснение до 360 px', 'Действия sm', 'Подробности'],
  related: ['skeleton', 'card', 'table'],
  source: { file: 'components/progress.tsx', exports: ['EmptyState'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'title', type: 'string', signature: 'ReactNode', required: true, description: 'Что здесь будет: «Сделок пока нет».' },
    { name: 'description', type: 'string', signature: 'ReactNode', description: 'Как это исправить.' },
    { name: 'icon', type: 'node', required: true, description: 'Иконка 24 px в круге surface-2.', control: false },
    { name: 'actions', type: 'node', description: 'Обычно маленькая основная кнопка и прозрачная.', control: false },
    {
      name: 'tone',
      type: 'enum',
      options: ['neutral', 'danger', 'accent'],
      default: 'neutral',
      description: 'Круг иконки: surface-2, danger-soft для ошибки загрузки, accent-soft для онбординга.',
    },
    { name: 'children', type: 'node', description: 'Последней строкой: код ошибки, подсказка мелким.', control: false },
  ],
  slots: [{ name: 'empty-state', description: 'Корень.' }],
  states: [{ id: 'empty', label: 'пусто', description: 'Центрированный блок с отступами 40 px.' }],
  keyboard: [],
  a11y: ['Заголовок — h3; не прячьте пустое состояние от экранного диктора, это содержимое страницы.'],
  motion: [
    { label: 'Появление', value: 'прозрачность и 8 px · 200 мс · ease-out, без задержки после скелетона' },
    { label: 'Повтор', value: 'кнопка уходит в загрузку, состояние стоит до ответа' },
  ],
  examples: [
    { id: 'first-run', title: 'Первый запуск', description: 'Ещё ничего нет — объясняем и зовём создать.' },
    { id: 'no-results', title: 'Ничего не найдено', description: 'Фильтр ничего не нашёл — предлагаем сбросить.' },
    { id: 'error', title: 'Ошибка загрузки', description: 'tone="danger", «Повторить» и код запроса.' },
  ],
};

export default meta;
