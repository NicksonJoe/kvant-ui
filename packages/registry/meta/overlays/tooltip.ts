import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'tooltip',
  status: 'stable',
  title: 'Подсказка',
  description: 'Короткое пояснение при наведении или фокусе: название кнопки-иконки, горячая клавиша.',
  category: 'overlays',
  paperBoard: '1GY-0',
  anatomy: ['Триггер', 'Капсула fg-1 в 6 px от триггера', 'Текст 12/16', 'Клавиша'],
  related: ['popover', 'hover-card', 'kbd'],
  source: { file: 'components/popover.tsx', exports: ['Tooltip', 'TooltipProvider'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'content', type: 'string', signature: 'ReactNode', required: true, description: 'Текст подсказки; несколько строк — через <br />.' },
    { name: 'shortcut', type: 'string', signature: 'ReactNode', description: 'Горячая клавиша после текста, моноширинно.' },
    { name: 'side', type: 'enum', options: ['top', 'bottom', 'left', 'right'], default: 'top', description: 'Сторона от триггера.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Не показывать.' },
    { name: 'children', type: 'node', required: true, signature: 'ReactElement', description: 'Триггер; должен принимать фокус.', control: false },
  ],
  parts: [
    { name: 'TooltipProvider', description: 'Общие задержки: 600 мс до показа, соседние подсказки — сразу в течение 400 мс.', props: [] },
  ],
  slots: [{ name: 'tooltip', description: 'Капсула подсказки.' }],
  states: [{ id: 'open', label: 'открыто', description: 'Через 600 мс наведения или сразу при фокусе с клавиатуры.' }],
  keyboard: [
    { keys: ['Tab'], action: 'Фокус на триггере показывает подсказку' },
    { keys: ['Esc'], action: 'Скрывает' },
  ],
  a11y: [
    'Текст подсказки связан с триггером через aria-describedby.',
    'Не прячьте в подсказку важное: на касании её не увидят.',
    'Кнопке-иконке всё равно нужен aria-label — подсказка его не заменяет.',
  ],
  motion: [
    { label: 'Показ', value: 'прозрачность и scale .97 · 150 мс · ease-out' },
    { label: 'Задержка', value: '600 мс, при фокусе — 0; соседние — сразу в течение 400 мс' },
    { label: 'В окне пропуска', value: 'без анимации: меняются только текст и место' },
  ],
  examples: [
    { id: 'shortcuts', title: 'С клавишами', description: 'Кнопки панели с названием и горячей клавишей.' },
    { id: 'sides', title: 'Стороны', description: 'Подсказка переворачивается у края экрана.' },
  ],
};

export default meta;
