import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'prompt-input',
  status: 'stable',
  title: 'Поле сообщения',
  description:
    'Поле для чата с клиентом и агентом. В одну строку — капсула высотой 52; растёт до 6 строк, радиус 28 сохраняется, кнопки прижаты к нижнему краю. Вложения встают над текстом внутри того же поля.',
  category: 'chat-ai',
  paperBoard: '70H-0',
  anatomy: ['Капсула min-h 52, p7, r28, рамка input', 'Скрепка 36 (замок, если чат закрыт)', 'Текст 14/20', 'Отправить 36: fill-2 → accent', 'Вложения: файл h56 r12 или превью 56'],
  related: ['message', 'attachment', 'textarea', 'file-upload'],
  source: { file: 'components/prompt-input.tsx', exports: ['PromptInput', 'PromptAttachment'] },
  dependencies: { npm: ['lucide-react'], registry: ['spinner'] },
  props: [
    { name: 'onSubmit', type: 'function', required: true, signature: '(value: string) => void', description: 'Enter отправляет (Shift+Enter — новая строка); поле очищается само.', control: false },
    { name: 'value', type: 'string', description: 'Управляемый текст (или defaultValue).', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: string) => void', description: 'Новый текст.', control: false },
    { name: 'placeholder', type: 'string', default: 'Напишите сообщение…', description: 'Подсказка; у закрытого чата — причина: «Чат закрыт: сделка перенесена в архив».' },
    { name: 'attachments', type: 'node', description: 'Вложения PromptAttachment над текстом.', control: false },
    { name: 'onAttach', type: 'function', signature: '() => void', description: 'Показывает кнопку-скрепку.', control: false },
    { name: 'sending', type: 'boolean', default: false, description: 'Сообщение в пути: текст заблокирован, спиннер вместо стрелки.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Чат закрыт: 50 %, surface-2, замок вместо скрепки.' },
    { name: 'label', type: 'string', default: 'Сообщение', description: 'Название поля для экранного диктора.', control: false },
  ],
  parts: [
    {
      name: 'PromptAttachment',
      description: 'Файл h56 r12 с плиткой 40 или превью 56; крестик — кружок 20 в углу с кольцом surface-1.',
      props: [
        { name: 'name', type: 'string', required: true, description: 'Имя файла.' },
        { name: 'meta', type: 'node', description: '«184 КБ · PDF».' },
        { name: 'preview', type: 'string', description: 'Ссылка на картинку: превью вместо плашки.' },
        { name: 'progress', type: 'number', description: '0–100, пока файл грузится.' },
        { name: 'error', type: 'node', description: 'Что пошло не так: «Больше 20 МБ» — danger-soft.' },
        { name: 'action', type: 'node', description: 'Выход из ошибки: «Сжать и отправить».' },
        { name: 'onRemove', type: 'function', signature: '() => void', description: 'Крестик «Убрать «…»».' },
      ],
    },
  ],
  slots: [
    { name: 'prompt-input', description: 'Форма; aria-busy во время отправки.' },
    { name: 'prompt-attachment', description: 'Вложение; data-invalid при ошибке.' },
  ],
  states: [
    { id: 'empty', label: 'пусто', description: 'Отправка неактивна: fill-2 и стрелка fg-4.' },
    { id: 'focus', label: 'набор текста', description: 'Рамка ring + 1 px ring; отправка accent.' },
    { id: 'loading', label: 'отправка', description: 'Текст fg-3 и не редактируется, спиннер 16 на accent.', props: { sending: true } },
    { id: 'disabled', label: 'отключено', description: '50 %, surface-2, замок; подсказка объясняет причину.', props: { disabled: true } },
  ],
  keyboard: [
    { keys: ['Enter'], action: 'Отправляет' },
    { keys: ['Shift+Enter'], action: 'Новая строка' },
    { keys: ['Tab'], action: 'Скрепка → поле → отправить → крестики вложений' },
  ],
  a11y: [
    'Поле названо «Сообщение»; у кнопок — «Прикрепить файл», «Отправить», во время отправки — «Отправляется» с aria-busy.',
    'Набор иероглифов и диакритики через IME не отправляется по Enter.',
    'Крестик вложения называется «Убрать «Смета.pdf»»; ошибка вложения написана словами и предлагает выход.',
  ],
  motion: [
    { label: 'Рост высоты', value: '150 мс ease-standard, до 6 строк, дальше прокрутка' },
    { label: 'Стрелка → спиннер', value: 'смена за 150 мс' },
    { label: 'Вложение', value: 'появление scale .96 + opacity 150 мс ease-out' },
  ],
  examples: [
    { id: 'attachments', title: 'С вложениями', description: 'Файл, картинка, загрузка и ошибка над текстом.' },
    { id: 'states', title: 'Отправка и закрытый чат', description: 'Поле заблокировано, пока сообщение в пути, и объясняет, почему чат закрыт.' },
  ],
};

export default meta;
