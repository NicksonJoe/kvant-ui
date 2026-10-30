import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'slider',
  status: 'stable',
  title: 'Слайдер',
  description:
    'Значение или диапазон на шкале — когда пропорция важнее точной цифры. Если цифра важна, рядом ставят поле ввода. При перетаскивании над бегунком видно значение.',
  category: 'selection',
  paperBoard: '5TU-0',
  anatomy: ['Подпись и значение', 'Дорожка 4 px', 'Заполнение', 'Бегунок 20 px', 'Подсказка со значением', 'Деления или пределы'],
  related: ['number-field', 'progress', 'angle-slider', 'rating'],
  source: { file: 'components/slider.tsx', exports: ['Slider'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'label', type: 'string', signature: 'ReactNode', description: 'Подпись 13/16 500 fg-2; значение напротив, табличными цифрами.' },
    { name: 'defaultValue', type: 'number', signature: 'number | number[]', description: 'Начальное значение; массив из двух — диапазон.', control: false },
    { name: 'min', type: 'number', default: 0, description: 'Минимум.' },
    { name: 'max', type: 'number', default: 100, description: 'Максимум.' },
    { name: 'step', type: 'number', options: [1, 5, 10, 25], default: 1, description: 'Шаг; с делениями бегунок прилипает к ним.' },
    { name: 'largeStep', type: 'number', default: 10, description: 'Шаг для Shift + стрелки и PageUp/PageDown.', control: false },
    { name: 'showLimits', type: 'boolean', default: false, description: 'Подписи минимума и максимума под дорожкой.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступен; значение остаётся читаемым.' },
    { name: 'formatValue', type: 'function', signature: '(value: number) => string', description: 'Один формат для подписи, подсказки, делений и aria-valuetext: «15 %», «через 12 дней».', control: false },
    { name: 'marks', type: 'object', signature: 'readonly number[]', description: 'Деления под дорожкой; текущее — accent и 600.', control: false },
    { name: 'minStepsBetweenValues', type: 'number', default: 0, description: 'Минимальный зазор между бегунками диапазона в шагах.', control: false },
    { name: 'value', type: 'number', signature: 'number | number[]', description: 'Управляемое значение.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: number | number[]) => void', description: 'Каждое движение.', control: false },
    { name: 'onValueCommitted', type: 'function', signature: '(value: number | number[]) => void', description: 'Значение после отпускания — для запросов.', control: false },
    { name: 'aria-label', type: 'string', description: 'Имя без видимой подписи; уходит на каждый бегунок.', control: false },
  ],
  slots: [
    { name: 'slider', description: 'Корень (role="group"); несёт data-dragging.' },
    { name: 'slider-tooltip', description: 'Подсказка со значением над бегунком.' },
    { name: 'slider-mark', description: 'Деление; у текущего data-current.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Дорожка fill-3, заполнение accent, бегунок с тенью thumb.' },
    { id: 'hover', label: 'наведение', description: 'Заполнение accent-hover, тень бегунка глубже.' },
    { id: 'pressed', label: 'перетаскивание', description: 'Бегунок 20 → 22, над ним подсказка fg-1 12/16 600.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring 2 px на бегунке; ←→ ±шаг, Shift — крупный шаг.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, значение читается.', props: { disabled: true } },
  ],
  matrix: {
    rows: [
      { label: 'одно значение', props: { range: false } },
      { label: 'диапазон', props: { range: true } },
    ],
  },
  keyboard: [
    { keys: ['←', '→', '↑', '↓'], action: '±шаг' },
    { keys: ['Shift + стрелка', 'PageUp', 'PageDown'], action: '±крупный шаг (10 по умолчанию)' },
    { keys: ['Home', 'End'], action: 'Минимум и максимум' },
    { keys: ['Tab'], action: 'Переходит между бегунками диапазона' },
  ],
  a11y: [
    'Каждый бегунок — role="slider" на настоящем input range; значение читается через aria-valuetext из formatValue.',
    'У диапазона бегунки читаются как «от 25 %» и «до 75 %» и не пересекаются.',
    'Без видимой подписи передайте aria-label — он уйдёт на каждый бегунок.',
    'Зона нажатия дорожки — 44 px по высоте.',
  ],
  motion: [
    { label: 'Нажатие', value: 'бегунок scale 1.1 за 100 мс · ease-out' },
    { label: 'Подсказка', value: 'opacity и scale .97 → 1 за 150 мс, гаснет через 100 мс после отпускания' },
    { label: 'Клик по дорожке', value: 'бегунок едет 150 мс · ease-out; перетаскивание — 1:1' },
    { label: 'Шаги', value: 'бегунок прилипает к делению на spring-snappy' },
  ],
  examples: [
    { id: 'discount', title: 'Одно значение', description: 'Подпись, значение и пределы под дорожкой.' },
    { id: 'budget', title: 'Диапазон', description: 'Два бегунка с зазором в один шаг.' },
    { id: 'probability', title: 'Шаги и деления', description: 'Шаг 25 с подписанными делениями.' },
  ],
};

export default meta;
