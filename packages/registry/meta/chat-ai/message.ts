import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'message',
  status: 'stable',
  title: 'Сообщение',
  description:
    'Реплика в переписке с клиентом или агентом. Подряд идущие сообщения одного автора собираются в группу: имя — над первым, аватар и время — у последнего; внутренние углы группы сжимаются до 6, внешние остаются 20.',
  category: 'chat-ai',
  paperBoard: '70H-0',
  anatomy: ['Имя автора над группой', 'Пузырь p 8/12, r20, 14/20, до 440', 'Время 11/16 и статус в конце текста', 'Аватар 28 у последнего', 'Реакции h24', 'Маркеры ленты: дата, «новые сообщения»', '«печатает…»'],
  related: ['prompt-input', 'conversation', 'avatar', 'timeline'],
  source: { file: 'components/message.tsx', exports: ['Message', 'MessageGroup', 'MessageReaction', 'ChatDivider', 'TypingIndicator'] },
  dependencies: { npm: ['lucide-react'], registry: [] },
  props: [
    { name: 'children', type: 'node', required: true, description: 'Текст; переносы строк сохраняются.' },
    { name: 'direction', type: 'enum', options: ['incoming', 'outgoing'], default: 'incoming', description: 'incoming — surface-2 слева; outgoing — accent справа. В группе решает группа.' },
    { name: 'time', type: 'string', description: 'Время в конце текста: «14:02».' },
    { name: 'status', type: 'enum', options: ['sending', 'sent', 'delivered', 'read', 'failed'], description: 'Статус исходящего: часы, галочка, две галочки; failed — пузырь бледнеет и предлагает повторить.' },
    { name: 'onRetry', type: 'function', signature: '() => void', description: 'Кнопка «Повторить» у неотправленного.', control: false },
    { name: 'footer', type: 'node', description: 'Под пузырём: «Прочитано в 14:08» или реакции.', control: false },
  ],
  parts: [
    {
      name: 'MessageGroup',
      description: 'Сообщения одного автора подряд: шаг 2, между группами 16.',
      props: [
        { name: 'direction', type: 'enum', options: ['incoming', 'outgoing'], default: 'incoming', description: 'Сторона группы.' },
        { name: 'author', type: 'node', description: 'Имя над первым входящим.' },
        { name: 'avatar', type: 'node', description: 'Аватар 28 у последнего входящего.' },
      ],
    },
    {
      name: 'MessageReaction',
      description: 'Реакция h24: иконка и число; моя — accent-soft с кольцом accent.',
      props: [
        { name: 'icon', type: 'node', required: true, description: 'Иконка, не эмодзи: <Heart />, <ThumbsUp />.' },
        { name: 'count', type: 'number', required: true, description: 'Сколько человек.' },
        { name: 'label', type: 'string', required: true, description: 'Название для экранного диктора.' },
        { name: 'selected', type: 'boolean', description: 'Моя реакция.' },
      ],
    },
    { name: 'ChatDivider', description: 'Маркер ленты: дата капсулой fill-2 или «2 новых сообщения» между линиями accent.', props: [{ name: 'variant', type: 'enum', options: ['day', 'unread'], default: 'day', description: 'Вид маркера.' }] },
    { name: 'TypingIndicator', description: 'Три точки волной и подпись «Анна печатает…».', props: [{ name: 'avatar', type: 'node', description: 'Аватар собеседника.' }] },
  ],
  slots: [
    { name: 'message-group', description: 'Группа; несёт data-direction.' },
    { name: 'message', description: 'Сообщение; data-direction и data-position (first, middle, last, single).' },
    { name: 'message-reaction', description: 'Реакция (aria-pressed).' },
    { name: 'chat-divider', description: 'Маркер ленты (role="separator").' },
    { name: 'typing-indicator', description: '«Печатает» (role="status").' },
  ],
  states: [
    { id: 'rest', label: 'отправлено', description: 'Галочка в конце пузыря.' },
    { id: 'loading', label: 'отправляется', description: 'Часы вместо галочки.', props: { status: 'sending' } },
    { id: 'checked', label: 'прочитано', description: 'Две галочки.', props: { status: 'read' } },
    { id: 'invalid', label: 'не отправлено', description: 'Пузырь 50 %, «Не отправлено · Повторить».', props: { status: 'failed' } },
  ],
  matrix: { rowProp: 'direction', columns: ['rest', 'loading', 'checked', 'invalid'] },
  keyboard: [{ keys: ['Tab'], action: 'Реакции и «Повторить» — обычные кнопки' }],
  a11y: [
    'Статус доставки читается словом: «Отправлено», «Прочитано»; ошибка видна текстом, не только цветом.',
    'Реакция называется «Сердце: 3», нажатая — aria-pressed.',
    'Маркеры ленты — separator; «печатает…» — role="status".',
  ],
  motion: [
    { label: 'Новое сообщение', value: 'y 8 + opacity, 200 мс ease-out' },
    { label: 'Реакция', value: 'pop на пружине с отскоком' },
    { label: '«Печатает»', value: 'волна opacity 1200 мс, фаза 150 мс; при reduced motion — неподвижно' },
    { label: 'Галочки', value: '✓ → ✓✓ сменяются за 150 мс' },
  ],
  examples: [
    { id: 'conversation', title: 'Переписка с клиентом', description: 'Группы, дата, реакции, новые сообщения и «печатает».' },
    { id: 'statuses', title: 'Статусы отправки', description: 'Отправляется, отправлено, доставлено, прочитано, не отправлено.' },
  ],
};

export default meta;
