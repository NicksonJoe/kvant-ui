import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'animated-number',
  status: 'beta',
  title: 'Анимированное число',
  description:
    'Показывает, что значение изменилось: прокатываются только изменившиеся разряды, цифры моноширинные, ширина не прыгает. При первом показе число сразу стоит на месте.',
  category: 'data-display',
  paperBoard: 'DHS-0',
  anatomy: ['Разряд: окно высотой строки', 'Лента цифр 0–9', 'Разделители без анимации', 'Единица fg-3'],
  related: ['chart', 'badge', 'timer'],
  source: { file: 'components/animated-number.tsx', exports: ['AnimatedNumber'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'value', type: 'number', options: [12, 1248500, 1312400], default: 1312400, required: true, description: 'Значение.' },
    { name: 'format', type: 'function', signature: '(value: number) => string', description: 'Формат локали; по умолчанию ru-RU с узкими пробелами.' },
    { name: 'suffix', type: 'string', description: 'Единица после числа fg-3: « ₽», « %».' },
  ],
  slots: [
    { name: 'animated-number', description: 'Число целиком.' },
    { name: 'animated-number-digit', description: 'Разряд; data-value — текущая цифра.' },
  ],
  states: [{ id: 'rest', label: 'покой', description: 'Число на месте; при смене значения разряды прокатываются.' }],
  keyboard: [],
  a11y: [
    'Диктору — только итоговое значение скрытым текстом; ленты цифр aria-hidden.',
    'aria-live="polite" ставьте только у важного KPI, не у каждого числа.',
    'Цвет числа не меняется: рост и падение показывает дельта со стрелкой и словом.',
  ],
  motion: [
    { label: 'Разряд', value: 'translateY · 700 мс · ease-fluid', reduced: 'мгновенная смена', tokens: ['duration-deliberate'] },
    { label: 'Первый показ', value: 'без анимации' },
  ],
  examples: [
    { id: 'kpi', title: 'KPI после оплаты', description: 'Сумма прокатывается на новое значение.' },
    { id: 'counter', title: 'Счётчик', description: 'Капсула с числом заявок.' },
  ],
};

export default meta;
