import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'rating',
  status: 'stable',
  title: 'Оценка',
  description:
    'Пять звёзд: при вводе шаг — целая звезда, при показе среднего — половина. Подпись словами объясняет оценку и читается экранным диктором вместо звёзд.',
  category: 'selection',
  paperBoard: '5TU-0',
  anatomy: ['Ряд звёзд', 'Звезда 20 px', 'Подпись словом'],
  related: ['slider', 'radio-group'],
  source: { file: 'components/rating.tsx', exports: ['Rating', 'RATING_LABELS'] },
  dependencies: { npm: ['lucide-react'], registry: [] },
  props: [
    { name: 'defaultValue', type: 'number', options: [0, 1, 2, 3, 4, 5], default: 0, description: 'Начальная оценка; 0 — без оценки.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: '14 в списках, 20, 28 для касания с зоной 44.' },
    { name: 'showLabel', type: 'boolean', default: false, description: 'Слово рядом со звёздами: «Хорошо».' },
    { name: 'readOnly', type: 'boolean', default: false, description: 'Только показ: округление до половины звезды, role="img".' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступна.' },
    { name: 'max', type: 'number', default: 5, description: 'Число звёзд.', control: false },
    { name: 'labels', type: 'object', signature: 'readonly string[]', description: 'Слова для 1…max; по умолчанию «Плохо» … «Отлично».', control: false },
    { name: 'value', type: 'number', description: 'Управляемая оценка (в режиме только чтения — дробная).', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: number) => void', description: 'Новая оценка.', control: false },
    { name: 'aria-label', type: 'string', default: 'Оценка', description: 'Имя ряда.', control: false },
  ],
  slots: [{ name: 'rating', description: 'Корень; у ввода внутри role="slider".' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Заполненные — warning, пустые — контур 1,5 fg-4.' },
    { id: 'hover', label: 'наведение', description: 'Превью: заливка до звезды под курсором, без задержки.' },
    { id: 'pressed', label: 'нажатие', description: 'Звезда scale .85.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring вокруг ряда; ←→ меняют оценку.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
    { id: 'read-only', label: 'только чтение', description: 'Половинки звёзд, имя «Оценка 3,5 из 5».', props: { readOnly: true } },
  ],
  matrix: { rowProp: 'size', columns: ['rest', 'focus', 'disabled', 'read-only'] },
  keyboard: [
    { keys: ['←', '→', '↑', '↓'], action: '−1 и +1 звезда' },
    { keys: ['Home', 'End'], action: 'Одна и пять звёзд' },
  ],
  a11y: [
    'Ввод — одна остановка Tab с ролью slider: aria-valuenow и aria-valuetext «4 из 5 — Хорошо».',
    'Только чтение — role="img" с aria-label «Оценка 3,5 из 5»; сами звёзды скрыты от диктора.',
    'На касании звезда 28 px с зоной 44 × 44; оценку можно поставить, проведя пальцем по ряду.',
  ],
  motion: [
    { label: 'Превью', value: 'мгновенно при наведении, сброс 100 мс · ease-hover' },
    { label: 'Нажатие', value: 'scale .85 за 75 мс · ease-out, отпускание spring-micro' },
    { label: 'Только чтение', value: 'не анимируется' },
  ],
  examples: [
    { id: 'feedback', title: 'Ввод оценки', description: 'Оценка проекта с подписью словом.' },
    { id: 'average', title: 'Средняя оценка', description: 'Только чтение: половинки звёзд и число отзывов.' },
  ],
};

export default meta;
