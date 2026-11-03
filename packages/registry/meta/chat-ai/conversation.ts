import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'conversation',
  status: 'beta',
  title: 'Разговор',
  description:
    'Лента переписки с клиентом или с агентом. Открывается на последнем сообщении и прилипает к низу, пока приходят новые и пока пишется ответ агента. Если человек прокрутил вверх, лента его не дёргает: внизу появляется «2 новых сообщения». Своё сообщение всегда возвращает к низу. История догружается сверху страницами, и то, что на экране, остаётся на месте. Ответ агента идёт без пузыря: лицо 28 и текст, слова проявляются пачками на своих местах, за последним мигает курсор-блок.',
  category: 'chat-ai',
  paperBoard: '70H-0',
  anatomy: [
    'Лента role="log": чат — группы через 16, поля 20 / 16; агент — ходы через 20, поля 24, сверху 16, снизу 20',
    'Сообщения и группы — Message, MessageGroup',
    'Отметка даты и «N новых сообщений» — ChatDivider, их собирает groupMessages',
    'Ход агента: лицо 28, ответ на всю ширину, отступ сверху 4',
    'Потоковый ответ: текст 14/20 fg-1, абзацы через 10, курсор-блок 7×16 r2 accent',
    '«Остановить» sm secondary и «Норда пишет · 64 слова»',
    'Думает: спиннер accent 16 и три линии скелета 100 / 82 / 56 %',
    'Действия готового ответа: иконки 28 ghost, разделитель, «Вставить в письмо» soft',
    'История сверху: «Загружаем историю» или «История не загрузилась · Повторить»',
    'Кнопка «вниз»: круг 36 overlay или капсула h32 «2 новых сообщения», 12 от низа',
  ],
  related: ['message', 'prompt-input', 'trace', 'questionnaire', 'typography', 'infinite-scroll'],
  source: {
    file: 'components/conversation.tsx',
    exports: ['Conversation', 'ConversationTurn', 'AgentAvatar', 'Stream', 'StreamAction', 'groupMessages', 'formatDay', 'newMessagesLabel', 'parseStream', 'countWords'],
  },
  dependencies: { npm: ['lucide-react'], registry: ['alert', 'button', 'message', 'tooltip', 'skeleton', 'scroll-area', 'spinner'] },
  props: [
    { name: 'aria-label', type: 'string', required: true, control: false, description: 'Название ленты для диктора: «Переписка с Анной Северовой», «Агент Норды».' },
    {
      name: 'children',
      type: 'node',
      required: true,
      control: false,
      description:
        'Содержимое ленты: MessageGroup и Message, ChatDivider, ConversationTurn со Stream, Trace или Questionnaire, TypingIndicator. Новые сообщения считаются по data-slot="message" и "conversation-turn"; исходящее (data-direction="outgoing") возвращает ленту вниз.',
    },
    { name: 'variant', type: 'enum', options: ['chat', 'agent'], default: 'chat', description: 'chat — переписка с клиентом: группы через 16, поля 20 по бокам; agent — панель агента: ходы через 20, поля 24.' },
    { name: 'busy', type: 'boolean', default: false, description: 'Агент работает или пишет: aria-busy на ленте, диктор дождётся ответа целиком, а не будет читать по слову.' },
    { name: 'hasOlder', type: 'boolean', default: false, description: 'Над первым сообщением есть ещё история.' },
    {
      name: 'olderStatus',
      type: 'enum',
      options: ['idle', 'loading', 'error'],
      default: 'idle',
      description: 'Страница истории: loading — «Загружаем историю» над первым сообщением и aria-busy; error — «История не загрузилась · Повторить».',
    },
    {
      name: 'onLoadOlder',
      type: 'function',
      signature: '() => void',
      control: false,
      description: 'Запрос старой страницы, когда до верха меньше экрана. Повторно не вызывается, пока не изменятся сообщения или olderStatus; «Повторить» вызывает его сразу.',
    },
    { name: 'className', type: 'string', control: false, description: 'Корень: задайте ленте высоту или растяните её во flex-колонке.' },
  ],
  parts: [
    {
      name: 'ConversationTurn',
      description: 'Ход агента без пузыря: лицо 28 слева, ответ на всю ширину, части ответа через 10. Появляется как новое сообщение: y 8 + opacity, 200 мс.',
      props: [
        { name: 'author', type: 'string', default: 'Агент Норды', description: 'Имя на лице для диктора (role="img").' },
        { name: 'avatar', type: 'node', description: 'Вместо лица агента — например Avatar сотрудника.' },
        { name: 'children', type: 'node', required: true, description: 'Stream, Trace variant="inline", Questionnaire, карточка файла.' },
      ],
    },
    {
      name: 'Stream',
      description:
        'Ответ агента, пока он пишется. Слова приходят пачками и проявляются opacity 150 мс на своих местах — уже показанные слова не перерисовываются, строки не сдвигаются. Абзацы разделяет пустая строка, строки с «- » собираются в список с точками 5.',
      props: [
        {
          name: 'state',
          type: 'enum',
          options: ['thinking', 'streaming', 'done', 'stopped', 'error'],
          required: true,
          description: 'thinking — до первого слова; streaming — пишет; done — готов; stopped — остановлен человеком; error — ответ не пришёл.',
        },
        { name: 'text', type: 'string', description: 'Ответ на сей момент; дописывайте в конец.' },
        { name: 'thinking', type: 'node', default: 'Думаю…', description: 'Что агент делает до первого слова: «Смотрю историю переписки с клиентом…».' },
        { name: 'author', type: 'string', default: 'Норда', description: 'Имя в строке «Норда пишет · 64 слова».' },
        { name: 'onStop', type: 'function', signature: '() => void', description: '«Остановить» sm secondary, пока ответ пишется.' },
        { name: 'onContinue', type: 'function', signature: '() => void', description: '«Продолжить» после «Ответ остановлен на 64 словах».' },
        { name: 'onRetry', type: 'function', signature: '() => void', description: '«Повторить» в плашке ошибки.' },
        { name: 'errorTitle', type: 'node', default: 'Ответ не пришёл', description: 'Заголовок плашки ошибки.' },
        { name: 'error', type: 'node', description: 'Что случилось и что сохранено: «Сервис перегружен. Черновик сохранён — повторите через минуту.»' },
        { name: 'actions', type: 'node', description: 'StreamAction и кнопка soft sm; показываются только у готового ответа, чтобы не прыгать под рукой.' },
        { name: 'children', type: 'node', description: 'Под текстом: файл, который сделал агент, таблица.' },
      ],
    },
    {
      name: 'StreamAction',
      description: 'Иконка 28 ghost под готовым ответом с подсказкой того же названия: скопировать, ещё раз, нравится.',
      props: [
        { name: 'icon', type: 'node', required: true, description: 'Иконка Lucide 16: <Copy />, <RefreshCw />, <ThumbsUp />.' },
        { name: 'label', type: 'string', required: true, description: 'Название и подсказка: «Скопировать».' },
        { name: 'pressed', type: 'boolean', description: 'Для действий с двумя состояниями: aria-pressed и подложка fill-1.' },
      ],
    },
    {
      name: 'AgentAvatar',
      description: 'Лицо агента: две точки accent на фарфоре в светлой теме, на графите с точками media-ring — в тёмной; блик сверху и кольцо тени.',
      props: [
        { name: 'size', type: 'number', options: [28, 32, 56], default: 32, description: '28 у ответов, 32 в шапках карточек, 56 на кнопке агента.' },
        { name: 'label', type: 'string', description: 'Имя для диктора; без него лицо — декор (aria-hidden).' },
      ],
    },
    {
      name: 'groupMessages',
      description:
        'Чистая функция: из сообщений по времени — записи ленты. Перед каждым днём отметка даты («Сегодня, 29 октября», «Вчера», «3 октября», «30 декабря 2025»), перед первым непрочитанным — «2 новых сообщения», подряд идущие сообщения одного автора не дальше 5 минут друг от друга — одна группа.',
      props: [
        { name: 'messages', type: 'object', required: true, signature: 'readonly ConversationMessage[]', description: 'id, author, direction, date (Date или ISO-строка), по времени.' },
        { name: 'options', type: 'object', signature: '{ now?: Date; unreadFrom?: string }', description: 'now — от него считаются «Сегодня» и «Вчера»; unreadFrom — id первого непрочитанного.' },
      ],
    },
    {
      name: 'parseStream · countWords · formatDay · newMessagesLabel',
      description: 'Чистые функции: блоки ответа из текста, число слов, подпись дня, «N новых сообщений» с согласованием: «1 новое сообщение», «2 новых сообщения», «5 новых сообщений».',
      props: [],
    },
  ],
  slots: [
    { name: 'conversation', description: 'Корень; data-variant.' },
    { name: 'scroll-area-viewport', description: 'Область прокрутки: Tab доходит до неё, PageUp, PageDown, Home, End прокручивают ленту.' },
    { name: 'conversation-history', description: 'Строка истории над первым сообщением: загрузка или ошибка (data-status="error").' },
    { name: 'conversation-down', description: '«Вниз» или «N новых сообщений»: видна, только когда лента прокручена вверх.' },
    { name: 'conversation-turn', description: 'Ход агента.' },
    { name: 'agent-avatar', description: 'Лицо агента.' },
    { name: 'stream', description: 'Ответ агента; data-state.' },
    { name: 'stream-thinking', description: 'Спиннер, что делает агент, и три линии скелета.' },
    { name: 'stream-text', description: 'Текст ответа: абзацы и списки.' },
    { name: 'stream-word', description: 'Слово ответа: проявляется один раз, когда приходит.' },
    { name: 'stream-caret', description: 'Курсор-блок 7×16 после последнего слова, только пока ответ пишется.' },
    { name: 'stream-footer', description: '«Остановить» и счётчик слов или строка «Ответ остановлен…».' },
    { name: 'stream-actions', description: 'Действия готового ответа.' },
    { name: 'stream-action', description: 'Иконка 28 действия.' },
  ],
  states: [
    { id: 'rest', label: 'у последнего сообщения', description: 'Лента внизу и следует за новыми сообщениями и за ответом, пока он пишется.' },
    { id: 'loading', label: 'агент пишет', description: 'aria-busy на ленте, курсор после последнего слова, «Остановить».', props: { variant: 'agent', busy: true } },
    { id: 'expanded', label: 'история грузится', description: '«Загружаем историю» над первым сообщением, aria-busy.', props: { hasOlder: true, olderStatus: 'loading' } },
    { id: 'invalid', label: 'история не загрузилась', description: '«История не загрузилась · Повторить» над первым сообщением; сообщения остаются.', props: { hasOlder: true, olderStatus: 'error' } },
    {
      id: 'highlighted',
      label: 'прокручено вверх',
      description: 'Лента стоит на месте; внизу круг 36 «К последнему сообщению», а когда пришли новые — капсула «2 новых сообщения».',
      selector: 'data-slot=conversation-down',
    },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Шапка → лента (область прокрутки) → кнопки в сообщениях → «вниз» → поле → «Отправить»' },
    { keys: ['PageUp', 'PageDown'], action: 'Прокрутка ленты на экран, когда фокус на ленте' },
    { keys: ['Home', 'End'], action: 'К началу загруженной истории и к последнему сообщению' },
    { keys: ['Enter', 'Space'], action: '«Остановить», «Продолжить», «Повторить», действия ответа и «вниз» — обычные кнопки' },
  ],
  a11y: [
    'Лента — role="log" aria-live="polite" с aria-label: новые сообщения читаются, не перебивая.',
    'Пока агент работает или пишет, у ленты aria-busy (busy): диктор прочитает ответ целиком, а не каждое слово. Пока грузится история — тоже.',
    'Область прокрутки принимает фокус, когда ленту есть куда прокручивать: по ней ходят PageUp, PageDown, Home, End.',
    'Курсор, точки списка, линии скелета и иконки — aria-hidden; лицо агента у ответа названо (role="img", «Агент Норды»).',
    'После «вниз» кнопка исчезает, а фокус переходит на ленту, а не на <body>.',
    'Ошибка ответа — role="alert": что случилось и что сохранено; ошибка истории — текстом и иконкой, не только цветом.',
    'На телефоне панель с лентой открывается на весь экран как role="dialog" aria-modal с запертым фокусом (FocusTrap); Esc закрывает и возвращает фокус на кнопку — пример «Панель на телефоне».',
  ],
  motion: [
    { label: 'Новое сообщение и ход', value: 'y 8 + opacity · 200 мс · ease-out', easing: 'ease-out', reduced: 'только opacity', tokens: ['duration-base', 'shift-md'] },
    { label: 'Слова ответа', value: 'opacity · 150 мс · ease-out, пачками', note: 'Слово сразу стоит на своём месте: строки не сдвигаются.', easing: 'ease-out', tokens: ['duration-quick'] },
    { label: 'Курсор', value: 'мигает 1000 мс steps', note: 'Гаснет вместе с последним словом.', easing: 'instant', reduced: 'стоит, не мигает' },
    { label: 'Скелет «думает»', value: 'shimmer 2000 мс linear', easing: 'linear', reduced: 'без волны', tokens: ['duration-shimmer'] },
    { label: 'Прилипание к низу', value: 'без анимации', note: 'Лента догоняет ответ в том же кадре, что и новая строка.' },
    { label: '«Вниз»', value: 'плавная прокрутка; кнопка — opacity + scale .96 · 150 мс', easing: 'ease-out', reduced: 'прыжок без плавности', tokens: ['duration-quick', 'scale-enter'] },
    { label: 'Действия ответа', value: 'opacity · 200 мс после последнего слова', easing: 'ease-out', tokens: ['duration-base'] },
  ],
  examples: [
    { id: 'client-chat', title: 'Переписка с клиентом', description: 'Дни, группы и «новые сообщения» из groupMessages; история догружается вверх, ответ Анны приходит после «печатает…», одно сообщение не отправилось.' },
    { id: 'agent', title: 'Разговор с агентом', description: 'Отправьте запрос: агент думает, пишет ответ потоком, его можно остановить и продолжить. Прокрутите вверх во время ответа — лента не дёрнется.' },
    { id: 'phone', title: 'Панель на телефоне', description: 'На весь экран как модальный диалог: фокус заперт, Esc и «Закрыть» возвращают его на кнопку.' },
  ],
};

export default meta;
