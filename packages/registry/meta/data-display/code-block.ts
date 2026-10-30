import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'code-block',
  status: 'stable',
  title: 'Блок кода',
  description:
    'Код для документации API и интеграций: вкладки файлов, номера строк, подсвеченные строки и копирование в один клик. Подсветка синтаксиса — тремя оттенками палитры статусов, остальное в цвете текста.',
  category: 'data-display',
  paperBoard: '1GJ-0',
  anatomy: ['Карточка surface-1 r20', 'Шапка 44: вкладки h28, язык, копировать 28', 'Номера строк fg-4 по правому краю', 'Код JetBrains Mono 13/22', 'Подсвеченные строки accent-soft'],
  related: ['kbd', 'copy-button', 'tabs'],
  source: { file: 'components/code-block.tsx', exports: ['CodeBlock', 'CodeBlockCommand', 'tokenizeCode'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: [] },
  props: [
    { name: 'files', type: 'object', required: true, signature: 'readonly { name?: string; code: string; language?: "ts" | "js" | "json" | "bash" | "text" }[]', description: 'Файлы; больше одного — вкладки. Язык берётся из расширения имени.', control: false },
    { name: 'highlight', type: 'object', signature: 'readonly number[]', description: 'Номера строк для подсветки, с единицы: [6, 7, 8, 9].', control: false },
    { name: 'lineNumbers', type: 'boolean', default: true, description: 'Номера строк слева.' },
  ],
  parts: [{ name: 'CodeBlockCommand', description: 'Одна команда в капсуле 44: «$ npm i …» и копирование.', props: [{ name: 'command', type: 'string', required: true, description: 'Команда без «$».' }] }],
  slots: [
    { name: 'code-block', description: 'Карточка кода.' },
    { name: 'code-block-command', description: 'Капсула команды.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Кнопка копирования fg-2.' },
    { id: 'hover', label: 'наведение', description: 'Кнопка: фон fill-2.' },
    { id: 'pressed', label: 'нажатие', description: 'Кнопка: fill-3, масштаб 0,94.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring на кнопке и вкладках.' },
    { id: 'checked', label: 'скопировано', description: 'Галочка success и подсказка «Скопировано» на 2 с.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Вкладки файлов, затем кнопка копирования' },
    { keys: ['←', '→'], action: 'Соседняя вкладка файла' },
    { keys: ['Enter', 'Space'], action: 'Копирует код' },
  ],
  a11y: [
    'Вкладки файлов — tablist «Файлы»; код — pre и code.',
    'Номера строк не выделяются и не читаются экранным диктором.',
    'Результат копирования объявляется через role="status".',
  ],
  motion: [
    { label: 'Копирование', value: 'иконка → галочка, crossfade + scale .8 → 1, 150 мс ease-out; обратно через 2000 мс' },
    { label: 'Подсказка «Скопировано»', value: '150 мс, opacity + scale .97' },
    { label: 'Вкладки', value: 'без анимации, смена кода мгновенная' },
  ],
  examples: [
    { id: 'files', title: 'Файлы SDK', description: 'Две вкладки и подсвеченные строки 6–9.' },
    { id: 'command', title: 'Установка', description: 'Команда в одну строку.' },
  ],
};

export default meta;
