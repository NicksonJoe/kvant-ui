import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'otp-input',
  status: 'stable',
  title: 'Код подтверждения',
  description: 'Шесть ячеек тройками — так код легче сверить с СМС. Это одно поле: вставка и автозаполнение кладут код целиком, последняя цифра сразу отправляет проверку.',
  category: 'forms',
  paperBoard: 'A8B-0',
  anatomy: ['Ряд ячеек', 'Ячейка 44 × 52, r12', 'Тире 10 × 2 между тройками', 'Цифра 22/28 600'],
  related: ['field', 'input', 'form'],
  source: { file: 'components/otp-input.tsx', exports: ['OtpInput'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'length', type: 'number', options: [4, 6, 8], default: 6, description: 'Сколько ячеек.' },
    { name: 'groupSize', type: 'number', options: [0, 2, 3, 4], default: 3, description: 'Тире после каждых N ячеек; 0 — без тире.' },
    { name: 'validationType', type: 'enum', options: ['numeric', 'alphanumeric', 'alpha'], default: 'numeric', description: 'Цифры или буквы с цифрами (коды восстановления).' },
    { name: 'invalid', type: 'boolean', default: false, description: 'Неверный код: рамки danger и одна встряска ряда. Потом очистите значение.' },
    { name: 'success', type: 'boolean', default: false, description: 'Код принят: ячейки success-soft.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Попытки кончились: фон surface-2, прозрачность 50 %.' },
    { name: 'defaultValue', type: 'string', description: 'Начальный код.' },
    { name: 'onValueComplete', type: 'function', signature: '(value: string) => void', description: 'Все ячейки заполнены — отправляйте проверку.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: string) => void', description: 'Каждое изменение.', control: false },
  ],
  slots: [
    { name: 'otp-input', description: 'Ряд ячеек; несёт data-complete и data-filled.' },
    { name: 'otp-input-separator', description: 'Тире между группами.' },
  ],
  states: [
    { id: 'empty', label: 'пусто', description: 'Ячейки с рамкой input.' },
    { id: 'focus', label: 'активная ячейка', description: 'Рамка ring и кольцо 1 px, каретка accent.' },
    { id: 'filled', label: 'заполнено', description: 'Цифры fg-1, табличные.', props: { defaultValue: '482913' } },
    { id: 'invalid', label: 'ошибка', description: 'Рамки danger, встряска ±4 px ×3.', props: { defaultValue: '487913', invalid: true } },
    { id: 'selected', label: 'успех', description: 'Фон success-soft, рамка success.', props: { defaultValue: '482913', success: true } },
    { id: 'disabled', label: 'отключено', description: 'Фон surface-2, весь ряд 50 %.', props: { disabled: true } },
  ],
  keyboard: [
    { keys: ['0–9'], action: 'Вводит цифру и переходит дальше' },
    { keys: ['Backspace'], action: 'Стирает и возвращается назад' },
    { keys: ['←', '→', 'Home', 'End'], action: 'Переходят по ячейкам' },
  ],
  a11y: [
    'Первая ячейка подписана полем (Field) или aria-label, остальные — «Цифра 2 из 6».',
    'inputmode="numeric" и autocomplete="one-time-code": iOS и Android подставят код из СМС.',
    'Ошибку пишите под полем: «Код не подошёл, осталось 2 попытки», рядом — «Прислать новый».',
  ],
  motion: [
    { label: 'Ошибка', value: 'встряска ряда ±4 px ×3 за 300 мс; после неё очистите ячейки' },
    { label: 'Рамка активной ячейки', value: '100 мс · ease-hover' },
    { label: 'Сниженное движение', value: 'без встряски, только цвет рамок' },
  ],
  examples: [
    { id: 'verify', title: 'Проверка кода', description: 'Введите 482913 — успех; любой другой код — ошибка и очистка.' },
    { id: 'states', title: 'Ошибка и блокировка', description: 'Неверный код и ряд, отключённый после трёх попыток.' },
  ],
};

export default meta;
