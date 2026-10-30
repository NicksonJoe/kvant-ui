import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'masked-input',
  status: 'stable',
  title: 'Поле с маской',
  description: 'Ввод по шаблону: человек вводит только цифры, скобки и дефисы маска ставит сама. Код страны стоит отдельно и не стирается.',
  category: 'forms',
  paperBoard: 'A8B-0',
  anatomy: ['Капсула h36', 'Код страны 14/20 500 и разделитель 1 × 16', 'Цифры fg-1', 'Остаток маски fg-3'],
  related: ['input', 'field', 'number-field'],
  source: { file: 'components/masked-input.tsx', exports: ['MaskedInput', 'formatMask'] },
  dependencies: { npm: ['@base-ui/react'], registry: ['input'] },
  props: [
    { name: 'mask', type: 'string', required: true, default: '(###) ###-##-##', options: ['(###) ###-##-##', '#### #### #### ####', '##.##.####'], description: '# — цифра, остальное маска ставит сама.' },
    { name: 'prefix', type: 'string', description: 'Неизменяемое начало, например «+7»; уходит и в отправляемое значение.' },
    { name: 'defaultValue', type: 'string', description: 'Начальные цифры.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Высота 32 / 36 / 44 px.' },
    { name: 'invalid', type: 'boolean', default: false, description: 'Ошибка без Field; показывайте только после ухода из поля.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно.' },
    { name: 'name', type: 'string', description: 'С формой уходит префикс и цифры: «+79123456789».', control: false },
    { name: 'onValueChange', type: 'function', signature: '(digits: string) => void', description: 'Только цифры, без маски и префикса.', control: false },
  ],
  slots: [{ name: 'masked-input', description: 'Капсула поля.' }],
  states: [
    { id: 'empty', label: 'пусто', description: 'Видна вся маска fg-3: «(___) ___-__-__».' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'ввод', description: 'Рамка ring; остаток маски идёт за курсором.' },
    { id: 'filled', label: 'готово', description: 'Все цифры fg-1, табличные — маска не прыгает.', props: { defaultValue: '9123456789' } },
    { id: 'invalid', label: 'ошибка', description: 'Рамка danger; текст под полем — «Не хватает трёх цифр».', props: { defaultValue: '9123456', invalid: true } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {},
  keyboard: [
    { keys: ['0–9'], action: 'Вводят цифру; литералы маски курсор перешагивает' },
    { keys: ['Backspace'], action: 'Сразу за скобкой или дефисом стирает цифру перед ними' },
  ],
  a11y: [
    'Маска нарисована за текстом и скрыта от диктора: он читает только введённое.',
    'Вставка «8 912…» или «+7 912…» приводится к одному виду — лишний код страны отбрасывается.',
    'Для телефона задайте inputMode="tel" и autoComplete="tel-national", для карты — autoComplete="cc-number".',
  ],
  motion: [
    { label: 'Символы', value: 'без анимации — маска меняется мгновенно' },
    { label: 'Ошибка', value: 'только после ухода из поля, встряска ±4 px ×3 за 300 мс' },
  ],
  examples: [
    { id: 'phone', title: 'Телефон', description: 'Код страны отдельно; ошибка — только после ухода из поля.' },
    { id: 'card', title: 'Карта и дата', description: 'Та же маска для номера карты и даты.' },
  ],
};

export default meta;
