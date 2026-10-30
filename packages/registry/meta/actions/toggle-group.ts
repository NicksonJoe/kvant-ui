import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'toggle-group',
  status: 'stable',
  title: 'Группа переключателей',
  description: 'Переключатели в одной капсуле: начертание, выравнивание, вид списка. В режиме «одно» повторное нажатие снимает выбор — этим группа отличается от сегментов.',
  category: 'actions',
  paperBoard: 'CM8-0',
  anatomy: ['Капсула h36 p2', 'Пункт — круг 32', 'Иконка 16'],
  related: ['toggle-button', 'segmented-control', 'button-group', 'toolbar'],
  source: { file: 'components/toggle.tsx', exports: ['ToggleGroup', 'ToggleGroupItem'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'multiple', type: 'boolean', default: false, description: 'Несколько значений сразу (жирный и курсив). Без него нажатие гасит соседа.' },
    { name: 'orientation', type: 'enum', options: ['horizontal', 'vertical'], default: 'horizontal', description: 'Направление; стрелки следуют ему.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Отключает всю группу.' },
    { name: 'defaultValue', type: 'object', signature: 'string[]', description: 'Нажатые пункты при первом показе.', control: false },
    { name: 'value', type: 'object', signature: 'string[]', description: 'Управляемое значение.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: string[]) => void', description: 'Новые нажатые пункты.', control: false },
    { name: 'aria-label', type: 'string', description: 'Название группы для экранного диктора.', control: false },
  ],
  parts: [
    {
      name: 'ToggleGroupItem',
      description: 'Пункт: круг 32 с иконкой или капсула с коротким словом.',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Значение пункта в value группы.' },
        { name: 'aria-label', type: 'string', description: 'Обязателен для пункта-иконки.' },
        { name: 'disabled', type: 'boolean', default: false, description: 'Недоступный пункт пропускается стрелками.' },
      ],
    },
  ],
  slots: [
    { name: 'toggle-group', description: 'Капсула (role="group"); несёт data-orientation и data-multiple.' },
    { name: 'toggle-group-item', description: 'Пункт; несёт data-pressed.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Капсула surface-1 с рамкой control; иконки выключенных пунктов fg-2.' },
    { id: 'hover', label: 'наведение', description: 'Пункт fill-1, иконка fg-1.' },
    { id: 'pressed', label: 'нажатие', description: 'Пункт fill-2.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо 2 px внутри пункта, чтобы не наезжать на соседей.' },
    { id: 'selected', label: 'включён', description: 'Фон accent-soft, иконка accent-soft-fg со штрихом 2.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {
    rows: [
      { label: 'несколько', props: { multiple: true } },
      { label: 'одно', props: {} },
    ],
    columns: ['rest', 'hover', 'pressed', 'focus', 'disabled'],
  },
  keyboard: [
    { keys: ['Tab'], action: 'Входит в группу на нажатый пункт и выходит из неё' },
    { keys: ['←', '→'], action: 'Переходят между пунктами (в вертикальной — ↑ ↓)' },
    { keys: ['Home', 'End'], action: 'Первый и последний пункт' },
    { keys: ['Space', 'Enter'], action: 'Нажимают пункт или снимают нажатие' },
  ],
  a11y: [
    'Группа — role="group" с названием через aria-label; в порядке Tab она занимает одну остановку.',
    'Каждый пункт — кнопка с aria-pressed; пункту-иконке нужен aria-label.',
    'Если выбрать «ничего» нельзя по смыслу (вид списка), берите SegmentedControl.',
  ],
  motion: [
    { label: 'Включение', value: 'фон accent-soft 150 мс · ease-out, без перемещения — у группы нет бегунка' },
    { label: 'Наведение', value: 'фон 150 мс · ease-out' },
  ],
  examples: [
    { id: 'formatting', title: 'Начертание', description: 'Несколько значений: жирный, курсив, подчёркнутый, зачёркнутый.' },
    { id: 'alignment', title: 'Выравнивание', description: 'Одно значение: повторное нажатие снимает выбор.' },
  ],
};

export default meta;
