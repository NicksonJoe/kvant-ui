import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'angle-slider',
  status: 'beta',
  title: 'Угол',
  description:
    'Круговой слайдер для направления: угол градиента, поворот фото, наклон подписи. Бегунок ходит по кругу, 0° сверху, по часовой. Круг даёт быстрый жест, а точность — клавиши и поле: в компактном варианте ручка 32 стоит рядом с полем в градусах.',
  category: 'selection',
  paperBoard: '5TU-0',
  anatomy: [
    'Круг 96 (крупный 160): дорожка 4 fill-3',
    'Дуга от 0° до значения accent, концы скруглены',
    'Бегунок 20 белый с тенью thumb, как у Slider — виден и в тёмной теме',
    'Число 16/20 600 tabular в центре (24/32 у крупного)',
    'Деления каждые 15° — только во время жеста',
    'Компакт: ручка 32 с риской 2 accent и поле 72 × 32, «°» fg-3',
  ],
  related: ['slider', 'number-field', 'color-picker'],
  source: { file: 'components/angle-slider.tsx', exports: ['AngleSlider'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'variant', type: 'enum', options: ['dial', 'compact'], default: 'dial', description: 'dial — круг с числом в центре; compact — ручка 32 и поле в градусах, для панелей.' },
    { name: 'size', type: 'enum', options: ['md', 'lg'], default: 'md', description: 'Диаметр круга: md 96, lg 160. Компакту не нужен.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно: прозрачность 50 %, жесты и клавиши не действуют.' },
    { name: 'defaultValue', type: 'number', options: [0, 45, 135, 270], default: 0, description: 'Угол по умолчанию; приводится к 0–359.' },
    { name: 'value', type: 'number', control: false, description: 'Управляемый угол: 360 → 0, −90 → 270.' },
    { name: 'onValueChange', type: 'function', signature: '(degrees: number) => void', control: false, description: 'Каждое изменение во время поворота, целые 0–359.' },
    { name: 'onValueCommitted', type: 'function', signature: '(degrees: number) => void', control: false, description: 'Жест отпущен, нажата клавиша или подтверждено поле — для сохранения и истории.' },
    { name: 'aria-label', type: 'string', default: 'Угол', description: 'Имя слайдера; поле компакта называется «<имя>, градусы».' },
    { name: 'className', type: 'string', control: false, description: 'Класс корня.' },
  ],
  slots: [
    { name: 'angle-slider', description: 'Корень; data-variant — dial или compact.' },
    { name: 'angle-slider-dial', description: 'Круг или ручка: нажатие в любой точке ставит угол; data-dragging во время жеста.' },
    { name: 'angle-slider-ticks', description: 'Деления через 15°, крупные каждые 45° fg-4; есть только во время жеста.' },
    { name: 'angle-slider-thumb', description: 'Бегунок 20, role="slider", на нём фокус.' },
    { name: 'angle-slider-value', description: 'Число в центре круга, «135°».' },
    { name: 'angle-slider-input', description: 'Поле компакта: целые градусы, Enter или уход из поля подтверждают.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Дуга accent, бегунок с тенью thumb.' },
    { id: 'hover', label: 'наведение', description: 'Дуга accent-hover, тень бегунка глубже; у ручки фон surface-2.' },
    { id: 'pressed', label: 'перетаскивание', description: 'Бегунок 22 (scale 1.1), дуга accent-hover; у ручки surface-3. С Shift видны деления.', selector: 'data-dragging · scale 1.1' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring 2 offset 2 на бегунке (круг) или ручке (компакт).' },
    { id: 'disabled', label: 'недоступно', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {
    rowProp: 'variant',
    columns: ['rest', 'hover', 'focus', 'disabled'],
    rowsLabel: 'вариант',
    notes: ['круг 96 · дорожка 4 fill-3 · бегунок 20 · число 16/20 600', 'ручка 32 · риска 2 accent · поле 72 × 32'],
  },
  keyboard: [
    { keys: ['→', '↑'], action: '+1°, по кругу: 359 → 0' },
    { keys: ['←', '↓'], action: '−1°, 0 → 359' },
    { keys: ['Shift', '←', '→'], action: '±15°' },
    { keys: ['PageUp', 'PageDown'], action: '±45°' },
    { keys: ['Home'], action: '0°' },
    { keys: ['End'], action: '359°' },
    { keys: ['Enter'], action: 'В поле компакта — подтвердить введённое число' },
  ],
  a11y: [
    'role="slider", aria-valuemin 0, aria-valuemax 359, aria-valuetext «135 градусов» со склонением.',
    'Фокус — на бегунке круга или на ручке компакта; жест мышью тоже переводит фокус туда, чтобы дальше работали стрелки.',
    'Поле компакта всегда редактируется с клавиатуры: число вне 0–359 приводится по кругу, нечисло при уходе из поля откатывается.',
    'Двойное нажатие сбрасывает к 0° — дублируйте сброс кнопкой или быстрыми значениями, если он важен.',
  ],
  motion: [
    { label: 'Жест', value: 'бегунок идёт за пальцем 1:1', note: 'Тянуть можно за любую точку круга, не только за бегунок.', easing: 'instant' },
    { label: 'Нажатие', value: 'бегунок scale 1.1 · 100 мс · ease-out', easing: 'ease-out', tokens: ['duration-fast'] },
    { label: 'Клик по кругу', value: 'бегунок едет по дуге · 150 мс · ease-out, кратчайшим путём', easing: 'ease-out', reduced: 'сразу на место', tokens: ['duration-quick'] },
    { label: 'Shift', value: 'прилипает к делению · 300 мс, отскок 10 %', detail: 'приближение spring-snappy 0.30 / 0.10', easing: 'spring-snappy', reduced: 'без прилипания: сразу на деление', tokens: ['spring-snappy'] },
  ],
  examples: [
    { id: 'gradient', title: 'Угол градиента', description: 'Компакт в выборе цвета и быстрые значения 0 / 45 / 90 / 135 / 180.' },
    { id: 'rotate', title: 'Поворот', description: 'Крупный круг 160: деления через 15° видны во время жеста, с Shift — шаг 15°.' },
  ],
};

export default meta;
