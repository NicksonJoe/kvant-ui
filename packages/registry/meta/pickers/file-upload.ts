import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'file-upload',
  status: 'stable',
  title: 'Загрузка файлов',
  description:
    'Зона принимает перетаскивание и клик; подсказка заранее называет форматы и лимит, а отказ — конкретный файл и причину. Строка списка проходит путь от очереди до готовности, ошибка остаётся и предлагает повтор.',
  category: 'pickers',
  paperBoard: '1YB-0',
  anatomy: ['Зона r 20 с пунктиром 1,5 px', 'Иконка 48', 'Заголовок и подсказка', 'Строка файла', 'Превью 40', 'Прогресс 4 px', 'Действия ghost 28'],
  related: ['progress', 'attachment', 'button'],
  source: { file: 'components/file-upload.tsx', exports: ['Dropzone', 'UploadList', 'UploadItem', 'formatFileSize'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['button', 'progress'] },
  props: [
    { name: 'accept', type: 'string', description: 'Как у input accept: «.pdf,.png» или «image/*».' },
    { name: 'maxSize', type: 'number', description: 'Предел размера в байтах.', control: false },
    { name: 'maxFiles', type: 'number', description: 'Сколько файлов за раз; без него — сколько угодно.' },
    { name: 'multiple', type: 'boolean', default: true, description: 'Несколько файлов.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступна.' },
    { name: 'hint', type: 'string', signature: 'ReactNode', description: 'Своя подсказка вместо собранной из accept, maxSize и maxFiles.' },
    {
      name: 'onFiles',
      type: 'function',
      required: true,
      signature: '(accepted: File[], rejected: { file: File; reason: string }[]) => void',
      description: 'Принятые файлы и отказы с причиной — после броска или выбора.',
      control: false,
    },
  ],
  parts: [
    {
      name: 'UploadItem',
      description: 'Строка списка загрузок.',
      props: [
        { name: 'name', type: 'string', required: true, description: 'Имя файла.' },
        { name: 'size', type: 'number', required: true, description: 'Размер в байтах.' },
        { name: 'status', type: 'enum', options: ['queued', 'uploading', 'done', 'error'], required: true, description: 'Очередь, загрузка, готово или ошибка.' },
        { name: 'progress', type: 'number', description: '0–100 во время загрузки.' },
        { name: 'meta', type: 'node', description: 'Дополнение строки: «осталось 12 с», «загружен в 14:32».' },
        { name: 'error', type: 'node', description: 'Причина ошибки.' },
        { name: 'preview', type: 'string', description: 'Ссылка на превью картинки; иначе иконка по типу файла.' },
        { name: 'onRetry', type: 'function', signature: '() => void', description: 'Кнопка «Повторить» у ошибки.' },
        { name: 'onRemove', type: 'function', signature: '() => void', description: '× в очереди и при загрузке, корзина у готового.' },
      ],
    },
    { name: 'UploadList', description: 'Список строк (ul).', props: [] },
  ],
  slots: [
    { name: 'dropzone', description: 'Зона (role="button"); data-drag="accept" или "reject" при перетаскивании.' },
    { name: 'upload-list', description: 'Список загрузок.' },
    { name: 'upload-item', description: 'Строка; несёт data-status.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Пунктир 1,5 px input, круг 48 accent-soft со стрелкой.' },
    { id: 'hover', label: 'наведение', description: 'Пунктир fg-3, ссылка подчёркнута.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring; подсказка «Enter или пробел откроют выбор файлов».' },
    { id: 'highlighted', label: 'над зоной', description: 'Рамка 2 px accent, фон accent-soft, круг accent, иконка выше на 4 px.' },
    { id: 'invalid', label: 'отказ', description: 'Рамка 2 px danger, фон danger-soft и причина с именем файла.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: { columns: ['rest', 'hover', 'focus', 'disabled'] },
  keyboard: [
    { keys: ['Enter', 'Space'], action: 'Открывают выбор файлов' },
    { keys: ['Tab'], action: 'Действия строки — обычные кнопки' },
  ],
  a11y: [
    'Зона — кнопка: имя — заголовок, подсказка с лимитами — aria-describedby.',
    'Формат, размер и количество проверяются до загрузки; отказ называет файл и причину.',
    'У строки свой progressbar с именем файла; действия подписаны: «Отменить загрузку «…»», «Удалить «…»».',
  ],
  motion: [
    { label: 'Файл над зоной', value: 'рамка и фон 100 мс · ease-hover, иконка −4 px на spring-snappy' },
    { label: 'Отказ', value: 'встряхивание ±4 px ×3 за 300 мс' },
    { label: 'Прогресс', value: 'ширина 300 мс · ease-standard' },
    { label: 'Новая строка', value: 'y 8 + opacity 200 мс · ease-out' },
  ],
  examples: [
    { id: 'brief', title: 'Зона с лимитами', description: 'Форматы, размер и число файлов в подсказке.' },
    { id: 'deal-files', title: 'Файлы сделки', description: 'Список со всеми статусами: очередь, загрузка, готово, ошибка.' },
  ],
};

export default meta;
