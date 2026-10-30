import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'number-field',
  status: 'stable',
  title: 'Числовое поле',
  description: 'Небольшие числа: кнопки «−» и «+» внутри капсулы, ввод с клавиатуры и стрелки работают всегда. В строке списка на телефоне — отдельный степпер, как в iOS.',
  category: 'forms',
  paperBoard: 'A8B-0',
  anatomy: ['Капсула h36', 'Кнопка «−» 28', 'Значение 14/20 500 по центру', 'Кнопка «+» 28', 'Степпер 95 × 32'],
  related: ['input', 'field', 'slider'],
  source: { file: 'components/number-field.tsx', exports: ['NumberField', 'Stepper'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input'] },
  props: [
    { name: 'defaultValue', type: 'number', description: 'Начальное значение.' },
    { name: 'min', type: 'number', description: 'Нижняя граница; на ней «−» отключается.' },
    { name: 'max', type: 'number', description: 'Верхняя граница; на ней «+» отключается.' },
    { name: 'step', type: 'number', options: [1, 5, 10, 0.5], default: 1, description: 'Шаг кнопок и стрелок; Shift — ×10.' },
    { name: 'format', type: 'object', signature: 'Intl.NumberFormatOptions', description: 'Формат: валюта, проценты, единицы; локаль ru-RU — «1 234,5».', control: false },
    { name: 'invalid', type: 'boolean', default: false, description: 'Ошибка без Field.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно.' },
    { name: 'readOnly', type: 'boolean', default: false, description: 'Только чтение: кнопки отключены.' },
    { name: 'value', type: 'number', description: 'Управляемое значение.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: number | null) => void', description: 'Новое значение.', control: false },
  ],
  parts: [
    {
      name: 'Stepper',
      description: 'Степпер iOS для строки списка на касании: две половины капсулы 95 × 32, значение показывайте в строке.',
      props: [
        { name: 'value', type: 'number', description: 'Значение.' },
        { name: 'onValueChange', type: 'function', signature: '(value: number) => void', description: 'Новое значение после нажатия.' },
        { name: 'min', type: 'number', description: 'На границе половина отключается.' },
        { name: 'max', type: 'number', description: 'На границе половина отключается.' },
        { name: 'aria-label', type: 'string', required: true, description: 'Что считаем: «Гостей на встрече».' },
      ],
    },
  ],
  slots: [
    { name: 'number-field', description: 'Корень; ширина 168 px по умолчанию.' },
    { name: 'stepper', description: 'Степпер (role="group").' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Рамка input, значение fg-1 по центру.', props: { defaultValue: 4, min: 1, max: 20 } },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3, кнопка под указателем fill-1.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо ring; ↑ ↓ меняют на шаг.' },
    { id: 'empty', label: 'минимум', description: '«−» отключена и полупрозрачна.', props: { defaultValue: 1, min: 1, max: 20 } },
    { id: 'invalid', label: 'ошибка', description: 'Рамка danger.', props: { defaultValue: 25, invalid: true } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, фон surface-2.', props: { disabled: true } },
  ],
  matrix: { columns: ['rest', 'hover', 'focus', 'empty', 'invalid', 'disabled'] },
  keyboard: [
    { keys: ['↑', '↓'], action: 'Шаг вверх и вниз; с Shift — ×10' },
    { keys: ['Home', 'End'], action: 'Минимум и максимум, если заданы' },
    { keys: ['Enter'], action: 'Применяет введённое и форматирует' },
  ],
  a11y: [
    'Кнопки «Уменьшить» и «Увеличить» не в порядке Tab: стрелки в поле делают то же.',
    'На границе кнопка отключена, значение за границей приводится к ней при уходе из поля.',
    'inputmode="decimal": телефон покажет цифровую клавиатуру; принимаются и запятая, и точка.',
    'Степпер объявляет новое значение вежливо — на экране оно стоит в строке, а не в кнопках.',
  ],
  motion: [
    { label: 'Нажатие кнопки', value: 'scale .94 · 75 мс · ease-out' },
    { label: 'Удержание', value: 'автоповтор через 400 мс, затем каждые 60 мс' },
    { label: 'Смена цифры', value: 'без анимации — число должно читаться сразу' },
  ],
  examples: [
    { id: 'participants', title: 'Участников', description: 'От 1 до 20: на границе кнопка отключается, лишнее показывает ошибку.' },
    { id: 'stepper', title: 'Степпер в строке списка', description: 'Касание: значение в строке, степпер справа.' },
  ],
};

export default meta;
