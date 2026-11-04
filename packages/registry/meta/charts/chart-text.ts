import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'chart-text',
  status: 'beta',
  title: 'Текст',
  description:
    'О чём говорят? Облако слов — для обзора: размер 12–40 по корню частоты, крупные первыми по спирали от центра без пересечений, цвет только для тона. Точные числа — частотные полосы рядом: те же данные, но длину можно сравнить. Обе части читают тон из одного поля и прячут его легендой.',
  category: 'charts',
  paperBoard: '1RJ4-0',
  anatomy: [
    'Легенда тона: «Хвалят» div-pos-2, «Нейтрально», «Ругают» div-neg-2',
    'Облако: слова 12–40, от 22 — полужирные, нейтральные fg-3',
    'Полосы: подпись 12 fg-1 справа к оси, ось border',
    'Полосы 14, скругление 3 справа, нейтральные fg-4',
    'Число 12 fg-2 после полосы',
    'Подсказка overlay r12',
  ],
  related: ['chart', 'chart-ranking', 'card'],
  source: { file: 'components/chart-text.tsx', exports: ['WordCloudChart', 'WordBarChart'] },
  dependencies: { npm: [], registry: [] },
  propsOf: 'WordCloudChart',
  props: [
    { name: 'aria-label', type: 'string', required: true, description: 'Откуда слова; диктор получает их таблицей «слово — упоминаний — тон».', control: false },
    {
      name: 'words',
      type: 'object',
      required: true,
      signature: "readonly { text: string; value: number; tone?: 'positive' | 'neutral' | 'negative' }[]",
      description: 'Слова с частотой в любом порядке; без tone — нейтральные, и легенды нет.',
      control: false,
    },
    { name: 'height', type: 'number', options: [220, 282, 320], default: 282, description: 'Высота облака, px; ширина — по контейнеру.' },
    { name: 'formatValue', type: 'function', signature: '(value: number) => string', description: 'Формат частоты.', control: false },
    { name: 'valueLabel', type: 'string', default: 'Упоминаний', description: 'Название частоты в подсказке и таблице.' },
    { name: 'toneLabels', type: 'object', signature: "Partial<Record<'positive' | 'neutral' | 'negative', string>>", description: 'Названия тонов в легенде.', control: false },
  ],
  parts: [
    {
      name: 'WordBarChart',
      description: 'Частотные полосы: те же слова по убыванию, полосы 14 от общей оси, тон тем же цветом; скрытие тона не меняет масштаб.',
      props: [
        { name: 'words', type: 'object', required: true, signature: 'readonly WordDatum[]', description: 'Слова; обычно топ-14.' },
        { name: 'formatValue', type: 'function', signature: '(value: number) => string', description: 'Формат частоты.' },
        { name: 'valueLabel', type: 'string', default: 'Упоминаний', description: 'Название частоты.' },
        { name: 'toneLabels', type: 'object', signature: 'Partial<Record<WordTone, string>>', description: 'Названия тонов.' },
      ],
    },
  ],
  slots: [
    { name: 'word-cloud-chart', description: 'Облако слов.' },
    { name: 'word-cloud-word', description: 'Слово; data-tone и рамка data-x, data-y, data-w, data-h.' },
    { name: 'word-bar-chart', description: 'Частотные полосы.' },
    { name: 'word-bar-row', description: 'Строка слова; data-tone, data-active.' },
    { name: 'word-bar', description: 'Полоса слова.' },
    { name: 'chart-tooltip', description: 'Подсказка.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Все слова в цвете тона.' },
    { id: 'highlighted', label: 'слово', description: 'Наведение или клавиши: остальные слова 30 %, строка полос fill-1, подсказка с частотой и тоном.' },
    { id: 'unchecked', label: 'тон скрыт', description: 'Легенда: контур fg-4 и зачёркивание, слова тона убраны, раскладка не прыгает.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Легенда тона, затем область графика' },
    { keys: ['←', '→', '↑', '↓'], action: 'Соседнее слово по частоте: подсказка и объявление' },
    { keys: ['Home', 'End'], action: 'Самое частое или самое редкое слово' },
    { keys: ['Enter', 'Space'], action: 'В легенде: скрыть или показать тон' },
  ],
  a11y: [
    'Область — group с названием; скрытая таблица перечисляет все слова с частотой и тоном, в том числе не поместившиеся в облако.',
    'Слово, выбранное клавишами, объявляется через aria-live: «быстро: 118, Хвалят».',
    'Тон всегда назван словом в легенде и подсказке, не только цветом.',
  ],
  motion: [
    { label: 'Слова облака', value: 'проявляются scale .75 → 1 и opacity 300 мс ease-out, шаг 20 мс от частых к редким', tokens: ['duration-slow'], reduced: 'сразу на месте, без появления' },
    { label: 'Полосы', value: 'растут от оси 300 мс ease-standard, шаг 25 мс', tokens: ['duration-slow'], reduced: 'сразу на месте, без появления' },
    { label: 'Приглушение', value: 'остальные слова до 30 % за 150 мс', tokens: ['duration-quick'] },
  ],
  examples: [
    { id: 'reviews', title: 'О чём пишут в отзывах', description: 'Облако из 24 слов с тоном.' },
    { id: 'frequency', title: 'Частые слова в отзывах', description: 'Топ-14 частотными полосами с тоном.' },
    { id: 'requests', title: 'С чем пишут в чат', description: 'Облако без тона и без легенды, высота 220.' },
  ],
};

export default meta;
