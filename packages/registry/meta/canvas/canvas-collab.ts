import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'canvas-collab',
  status: 'beta',
  title: 'Команда и агент на канвасе',
  description:
    'Граф правят вместе: видно, кто здесь, где чужие курсоры и что выделено; к любому шагу можно оставить комментарий или стикер. Агент Норды собирает черновик по описанию словами — шаги появляются призраками и становятся настоящими только после «Принять». Всё это — обычные элементы с координатами графа: движок кладёт их в свой слой.',
  category: 'canvas',
  paperBoard: '1M7O-0',
  anatomy: [
    'Присутствие: капсула h32, лица 24 цветом участника 22 %, «Анна и Игорь здесь»',
    'Курсор: стрелка 18 цветом участника с обводкой surface-1, ярлык h20 с именем',
    'Чужое выделение: кольцо 2 цветом участника + ореол 6 / 16 %, ярлык «Игорь правит»; шаг не блокируется',
    'Стикер: 200, warning-soft, r 4/12, автор и время',
    'Комментарий: пин 30 с инициалами, ветка 290 r14 — реплики, «Ответить…», «Решено»',
    'Агент: запрос 400 с плиткой chart-7, «Готово · 6 шагов и 5 связей»; шаги-призраки accent 5 % пунктир 55 %',
    'Плашка предложения h48: «Норда предлагает…», «Отклонить», «По одному», «Принять всё»',
  ],
  related: ['canvas-editor', 'canvas-node', 'agent-panel', 'avatar'],
  source: {
    file: 'components/canvas-collab.tsx',
    exports: [
      'CanvasPresence',
      'CanvasCursor',
      'CanvasEditingLabel',
      'CanvasSticky',
      'CanvasCommentPin',
      'CanvasCommentThread',
      'CanvasAgentPrompt',
      'CanvasAgentProposal',
      'CANVAS_GHOST_CLASS',
      'presenceColor',
      'presenceRing',
      'presenceLabel',
    ],
  },
  dependencies: { npm: ['lucide-react'], registry: ['button', 'spinner'] },
  propsOf: 'CanvasCommentThread',
  props: [
    { name: 'aria-label', type: 'string', required: true, description: '«Комментарии к «Есть бюджет?»».' },
    { name: 'comments', type: 'object', signature: 'readonly CanvasComment[]', required: true, control: false, description: 'id, author, time («10 мин назад»), text.' },
    { name: 'onReply', type: 'function', signature: '(text: string) => void', description: 'Ответ по Enter; без него поля нет.' },
    { name: 'onResolve', type: 'function', signature: '() => void', description: '«Решено» прячет пин.' },
    { name: 'onClose', type: 'function', signature: '() => void', description: 'Esc закрывает ветку.' },
    { name: 'x', type: 'number', description: 'Координата графа; с y элемент позиционируется абсолютно.' },
    { name: 'y', type: 'number', description: 'Координата графа.' },
  ],
  parts: [
    { name: 'CanvasPresence', description: 'Кто сейчас в графе.', props: [{ name: 'people', type: 'object', signature: 'readonly CanvasCollaborator[]', required: true, description: 'id, name, presence 1–3.' }] },
    {
      name: 'CanvasCursor',
      description: 'Чужой курсор, скрыт от диктора.',
      props: [
        { name: 'name', type: 'string', required: true, description: 'Имя на ярлыке.' },
        { name: 'presence', type: 'number', options: [1, 2, 3], default: 1, description: 'Цвет участника.' },
        { name: 'x', type: 'number', description: 'Координата графа.' },
        { name: 'y', type: 'number', description: 'Координата графа.' },
      ],
    },
    { name: 'CanvasEditingLabel', description: '«Игорь правит» над чужим выделением; кольцо — presenceRing(slot) на карточке узла.', props: [{ name: 'name', type: 'string', required: true, description: 'Кто правит.' }] },
    { name: 'CanvasSticky', description: 'Стикер.', props: [{ name: 'author', type: 'string', description: 'Автор.' }, { name: 'time', type: 'string', description: '«2 мин назад».' }] },
    { name: 'CanvasCommentPin', description: 'Пин ветки у шага.', props: [{ name: 'author', type: 'string', required: true, description: 'Автор последней реплики.' }, { name: 'count', type: 'number', description: 'Реплик в ветке.' }] },
    {
      name: 'CanvasAgentPrompt',
      description: 'Запрос агенту и ход сборки.',
      props: [
        { name: 'text', type: 'node', required: true, description: 'Задача словами.' },
        { name: 'status', type: 'enum', options: ['building', 'done'], required: true, description: 'Собирает или готово.' },
      ],
    },
    {
      name: 'CanvasAgentProposal',
      description: 'Плашка под призраками.',
      props: [
        { name: 'onAccept', type: 'function', signature: '() => void', required: true, description: '«Принять всё» — одной записью в истории от Норды.' },
        { name: 'onStepwise', type: 'function', signature: '() => void', description: '«По одному».' },
        { name: 'onReject', type: 'function', signature: '() => void', required: true, description: '«Отклонить».' },
      ],
    },
  ],
  slots: [
    { name: 'canvas-presence', description: 'Капсула присутствия.' },
    { name: 'canvas-cursor', description: 'Курсор.' },
    { name: 'canvas-editing-label', description: 'Ярлык «правит».' },
    { name: 'canvas-sticky', description: 'Стикер.' },
    { name: 'canvas-comment-pin', description: 'Пин.' },
    { name: 'canvas-comment-thread', description: 'Ветка комментариев.' },
    { name: 'canvas-agent-prompt', description: 'Запрос агенту; data-status.' },
    { name: 'canvas-agent-proposal', description: 'Плашка предложения.' },
  ],
  states: [
    { id: 'rest', label: 'ветка', description: 'Реплики и поле ответа.' },
    { id: 'loading', label: 'агент собирает', description: 'Спиннер и «Собираю граф…», следующий призрак мерцает.' },
  ],
  keyboard: [
    { keys: ['Enter'], action: 'Отправить ответ в ветке' },
    { keys: ['Esc'], action: 'Закрыть ветку' },
    { keys: ['Tab'], action: 'Пин → ветка → «Решено»; плашка агента: «Отклонить» → «По одному» → «Принять всё»' },
  ],
  a11y: [
    'Курсоры aria-hidden: кто здесь, говорит CanvasPresence.',
    'Пин — кнопка «Комментарии: 2, последний от Анна»; ветка — section с именем шага, реплики — article.',
    'Стикер — role="note".',
    'Ход сборки — role="status"; плашка предложения — section с именем «Норда предлагает 6 шагов и 5 связей».',
    'Цвет участника не единственный признак: рядом всегда имя.',
  ],
  motion: [
    { label: 'Курсор', value: 'left/top · 100 мс · linear', easing: 'linear', reduced: 'прыгает', tokens: ['duration-fast'] },
    { label: 'Призрак', value: 'появляются по одному, следующий — шиммер', reduced: 'сразу все' },
  ],
  examples: [
    { id: 'together', title: 'Совместная работа', description: 'Присутствие, курсор, чужое выделение, стикер и ветка комментариев.' },
    { id: 'agent', title: 'Агент собирает граф', description: 'Запрос словами, ход сборки и плашка «Принять всё».' },
  ],
};

export default meta;
