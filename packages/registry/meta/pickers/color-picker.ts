import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'color-picker',
  status: 'stable',
  title: 'Выбор цвета',
  description:
    'Поповер открывается от поля с образцом. Цвет из палитры проекта — один клик, точное значение — в HEX, RGB или HSL, прозрачность — отдельным ползунком.',
  category: 'pickers',
  paperBoard: '1YB-0',
  anatomy: ['Поле с образцом', 'Поле насыщенности 288 × 160', 'Ползунок тона', 'Ползунок непрозрачности', 'Значение HEX / RGB / HSL', 'Пипетка', 'Палитра 24 px'],
  related: ['popover', 'slider', 'input'],
  source: { file: 'components/color-picker.tsx', exports: ['ColorPicker', 'ColorSwatches'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input', 'popover', 'slider'] },
  props: [
    { name: 'opaque', type: 'boolean', default: false, description: 'Без ползунка и поля непрозрачности.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступен.' },
    { name: 'swatches', type: 'object', signature: 'readonly string[]', description: 'Палитра проекта под редактором.', control: false },
    { name: 'onAddSwatch', type: 'function', signature: '(color: string) => void', description: 'Показывает «+» после палитры — сохранить текущий цвет.', control: false },
    { name: 'defaultValue', type: 'string', default: '#3986E4', description: 'Цвет по умолчанию.', control: false },
    { name: 'value', type: 'string', description: '«#RRGGBB» или «#RRGGBBAA» с прозрачностью.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(color: string) => void', description: 'Новый цвет в HEX.', control: false },
    { name: 'aria-label', type: 'string', description: 'Имя поля без видимой подписи.', control: false },
  ],
  parts: [
    {
      name: 'ColorSwatches',
      description: 'Палитра без редактора — радиогруппа образцов 24 px.',
      props: [
        { name: 'colors', type: 'object', required: true, signature: 'readonly string[]', description: 'Цвета в HEX по порядку.' },
        { name: 'value', type: 'string', description: 'Управляемый цвет.' },
        { name: 'onValueChange', type: 'function', signature: '(color: string) => void', description: 'Выбранный цвет.' },
        { name: 'onAdd', type: 'function', signature: '() => void', description: 'Пунктирный «+» после образцов.' },
        { name: 'aria-label', type: 'string', default: 'Палитра', description: 'Имя группы.' },
      ],
    },
  ],
  slots: [
    { name: 'popover-trigger', description: 'Поле с образцом и HEX.' },
    { name: 'color-picker', description: 'Поповер 320 с редактором.' },
    { name: 'color-swatches', description: 'Палитра.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Образец 20 и HEX моноширинным 13 px.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо ring.' },
    { id: 'open', label: 'открыто', description: 'Поповер 320 · p 16 · r 20 в 8 px от поля.' },
    { id: 'selected', label: 'образец выбран', description: 'Кольцо 2 px ring через 2 px и галочка.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %; пипетка отключена и без EyeDropper API.', props: { disabled: true } },
  ],
  matrix: { columns: ['rest', 'hover', 'focus', 'disabled'] },
  keyboard: [
    { keys: ['←', '→', '↑', '↓'], action: 'Поле насыщенности: по 1 %, с Shift — по 10 %' },
    { keys: ['←', '→'], action: 'Ползунки: тон по 1°, непрозрачность по 1 %' },
    { keys: ['Enter'], action: 'Применяет значение из поля HEX / RGB / HSL' },
    { keys: ['Esc'], action: 'Закрывает поповер' },
  ],
  a11y: [
    'Поле насыщенности — slider с aria-valuetext «Насыщенность 76 %, яркость 89 %».',
    'Палитра — radiogroup, имя образца — его HEX.',
    'Неразборчивое значение в поле не применяется и откатывается.',
    'Пипетка отключена, если в браузере нет EyeDropper API.',
  ],
  motion: [
    { label: 'Поповер', value: 'opacity и scale .96 от поля · 150 мс · ease-out' },
    { label: 'Бегунок', value: 'scale 1.1 за 100 мс, над ним значение «213°»' },
    { label: 'Образец', value: 'наведение scale 1.1, галочка появляется за 150 мс' },
  ],
  examples: [
    { id: 'label', title: 'Цвет метки', description: 'Поле с палитрой проекта и кнопкой «+».' },
    { id: 'swatches', title: 'Только палитра', description: 'ColorSwatches без редактора.' },
  ],
};

export default meta;
