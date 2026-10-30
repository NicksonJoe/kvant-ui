import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'attachment',
  status: 'stable',
  title: 'Вложение',
  description: 'Файл в поле сообщения: плашка h56 с плиткой 40 или превью картинки 56. Показывает загрузку с процентом и ошибку, которая предлагает выход.',
  category: 'chat-ai',
  paperBoard: '70H-0',
  anatomy: ['Плашка h56 r12 (ошибка — danger-soft)', 'Плитка 40 r8: тип файла, спиннер или «!»', 'Имя 13/16 500 и размер 12/16 fg-3', 'Крестик — кружок 20 fg-1 с кольцом 2 surface-1'],
  related: ['prompt-input', 'file-upload', 'message'],
  source: { file: 'components/prompt-input.tsx', exports: ['PromptAttachment'] },
  dependencies: { npm: ['lucide-react'], registry: ['spinner'] },
  props: [
    { name: 'name', type: 'string', required: true, description: 'Имя файла.' },
    { name: 'meta', type: 'node', description: '«184 КБ · PDF».' },
    { name: 'preview', type: 'string', description: 'Ссылка на картинку: превью 56 вместо плашки.', control: false },
    { name: 'progress', type: 'number', options: [0, 64, 100], default: 100, description: 'Процент загрузки; меньше 100 — спиннер и «Загрузка · 64 %».' },
    { name: 'error', type: 'node', description: 'Что пошло не так, словами: «Больше 20 МБ».' },
    { name: 'action', type: 'node', description: 'Выход из ошибки: «Сжать и отправить».', control: false },
    { name: 'onRemove', type: 'function', signature: '() => void', description: 'Крестик «Убрать «…»».', control: false },
  ],
  slots: [{ name: 'prompt-attachment', description: 'Вложение; data-invalid при ошибке.' }],
  states: [
    { id: 'rest', label: 'готово', description: 'Плашка surface-2, иконка типа файла.' },
    { id: 'loading', label: 'загрузка', description: 'Спиннер в плитке и процент.', props: { progress: 64 } },
    { id: 'invalid', label: 'ошибка', description: 'danger-soft, «!» и действие, которое помогает.', props: { error: 'Больше 20 МБ' } },
  ],
  keyboard: [{ keys: ['Tab'], action: 'Доходит до крестика и действия ошибки' }],
  a11y: [
    'Крестик называется «Убрать «Смета.pdf»».',
    'Загрузка картинки объявляется спиннером со статусом «Загрузка «…», 64 %».',
    'Ошибка написана словами и не держится только на цвете.',
  ],
  motion: [
    { label: 'Появление', value: 'scale .96 + opacity, 150 мс ease-out' },
    { label: 'Снятие', value: '100 мс' },
    { label: 'Прогресс', value: '300 мс ease-standard' },
  ],
  examples: [
    { id: 'files', title: 'Файлы', description: 'Готово, загрузка и ошибка.' },
    { id: 'image', title: 'Картинка', description: 'Превью 56 во время загрузки и после.' },
  ],
};

export default meta;
