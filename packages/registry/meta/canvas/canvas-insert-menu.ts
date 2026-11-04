import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'canvas-insert-menu',
  status: 'beta',
  title: 'Вставка, поиск и история графа',
  description:
    'Меню работы с графом без движка, только интерфейс и колбэки. Вставка по Enter на канвасе: поле поиска, наверху то, что Норда советует поставить следующим, затем шаги и шаблоны; ↵ вставляет, ⇧↵ вставляет и открывает. Контекстные меню пустого места и шага на базе ContextMenu. Поиск по графу ⌘F со счётчиком «2 из 5», фильтрами и переходом к находке. История изменений: кто, что, когда, и откат к любой точке.',
  category: 'canvas',
  paperBoard: '1LX9-0',
  anatomy: [
    'Вставка 400 r12 overlay: поле h48 с чипом места «после «Создать сделку»»',
    'Подсказка Норды h44 первой с причиной, шаги h36 с группой справа, шаблоны',
    'Подвал h36: ↑↓ выбор · ↵ вставить · ⇧↵ вставить и открыть · Esc',
    'Контекстные меню: пункт с клавишей справа; «Удалить…» последним после разделителя, danger',
    'Поиск ⌘F: поле h44 со счётчиком и ↑↓, фильтры-чипы h24, находки с подсветкой',
    'История: заголовок h44, строки h44 — точка, что и кто · когда, «Вернуть сюда» по наведению',
  ],
  related: ['canvas-editor', 'step-palette', 'canvas-node', 'context-menu', 'command-palette', 'combobox'],
  source: {
    file: 'components/canvas-insert-menu.tsx',
    exports: ['CanvasInsertMenu', 'CanvasPaneMenuContent', 'CanvasNodeMenuContent', 'CanvasGraphSearch', 'CanvasHistoryPanel'],
  },
  dependencies: { npm: ['lucide-react'], registry: ['menu', 'button', 'canvas-node', 'step-palette'] },
  props: [
    { name: 'groups', type: 'object', signature: 'readonly CanvasStepGroup[]', required: true, control: false, description: 'Шаги палитры; в строке справа — название группы.' },
    {
      name: 'suggestions',
      type: 'object',
      signature: 'readonly { template: CanvasStepTemplate; reason: string }[]',
      control: false,
      description: '«Норда предлагает»: что обычно ставят здесь следующим и почему.',
    },
    { name: 'templates', type: 'object', signature: 'readonly CanvasStepTemplate[]', control: false, description: 'Готовые цепочки шагов: «Уведомить и ждать ответа · 3 шага».' },
    { name: 'context', type: 'string', description: 'Куда встанет шаг: «после «Создать сделку»».' },
    { name: 'onInsert', type: 'function', signature: '(template: CanvasStepTemplate, options: { open: boolean }) => void', required: true, description: '↵ или клик — open: false; ⇧↵ — open: true, открыть шаг в инспекторе.' },
    { name: 'onClose', type: 'function', signature: '() => void', required: true, description: 'Esc из любой точки меню или уход фокуса наружу (клик или Tab мимо меню). После закрытия фокус возвращается туда, где был до открытия.' },
    { name: 'label', type: 'string', default: 'Вставить шаг', description: 'Имя поля и списка.' },
  ],
  parts: [
    {
      name: 'CanvasPaneMenuContent',
      description: 'Меню пустого места внутри <ContextMenu>: Вставить шаг, Стикер, Вставить | Выделить всё, Разложить граф, Вписать. Пункт без обработчика не показывается.',
      props: [
        { name: 'onInsertStep', type: 'function', signature: '() => void', description: 'Tab.' },
        { name: 'onAddNote', type: 'function', signature: '() => void', description: 'S.' },
        { name: 'onPaste', type: 'function', signature: '() => void', description: '⌘V.' },
        { name: 'onSelectAll', type: 'function', signature: '() => void', description: '⌘A.' },
        { name: 'onLayout', type: 'function', signature: '() => void', description: '⇧L.' },
        { name: 'onFit', type: 'function', signature: '() => void', description: '⇧1.' },
      ],
    },
    {
      name: 'CanvasNodeMenuContent',
      description: 'Меню шага внутри <ContextMenu>: Запустить отсюда, Закрепить данные, Дублировать, Сгруппировать, Отключить | Удалить….',
      props: [
        { name: 'disabled', type: 'boolean', default: false, description: 'Шаг выключен: пункт «Включить».' },
        { name: 'pinned', type: 'boolean', default: false, description: 'Данные закреплены: пункт «Открепить данные».' },
        { name: 'onDelete', type: 'function', signature: '() => void', description: '«Удалить…»: подтверждение, затем плашка «Отменить» 7 с.' },
      ],
    },
    {
      name: 'CanvasGraphSearch',
      description: 'Поиск ⌘F сверху по центру. Находки ищет хост, панель считает, фильтрует по виду и водит по ним.',
      props: [
        { name: 'query', type: 'string', required: true, description: 'Запрос (управляемо, onQueryChange).' },
        { name: 'results', type: 'object', signature: 'readonly { id; kind: "step" | "setting" | "note"; title; detail? }[]', required: true, description: 'Находки.' },
        { name: 'onNavigate', type: 'function', signature: '(result: CanvasSearchResult) => void', required: true, description: 'Вести камеру к находке: первая — сразу, дальше на каждый шаг.' },
        { name: 'onClose', type: 'function', signature: '() => void', required: true, description: 'Esc из любой точки меню или уход фокуса наружу (клик или Tab мимо меню). После закрытия фокус возвращается туда, где был до открытия.' },
      ],
    },
    {
      name: 'CanvasHistoryPanel',
      description: 'История изменений: текущая точка accent-soft, у остальных «Вернуть сюда».',
      props: [
        { name: 'entries', type: 'object', signature: 'readonly { id; title; author; time }[]', required: true, description: 'Сначала новые.' },
        { name: 'currentId', type: 'string', description: 'Где граф сейчас.' },
        { name: 'period', type: 'string', description: '«сегодня».' },
        { name: 'onRestore', type: 'function', signature: '(entry: CanvasHistoryEntry) => void', required: true, description: 'Откат к точке; сам откат тоже попадает в историю.' },
      ],
    },
  ],
  slots: [
    { name: 'canvas-insert-menu', description: 'Вставка по Enter на канвасе.' },
    { name: 'canvas-graph-search', description: 'Панель поиска ⌘F.' },
    { name: 'canvas-history', description: 'Панель истории.' },
  ],
  states: [
    { id: 'open', label: 'открыто', description: 'Поле в фокусе, первая строка подсвечена.' },
    { id: 'filled', label: 'поиск', description: 'Совпадение жирным во всех разделах.' },
    { id: 'highlighted', label: 'выбор', description: 'Строка fill-2, aria-activedescendant на ней.' },
    { id: 'empty', label: 'ничего не нашлось', description: '«Ничего не нашлось», в поиске ⌘F — «Нет совпадений» и неактивные ↑↓.' },
  ],
  keyboard: [
    { keys: ['↑', '↓'], action: 'Вставка: выбор строки; фокус остаётся в поле' },
    { keys: ['Enter'], action: 'Вставка: вставить; поиск ⌘F: следующая находка' },
    { keys: ['⇧', 'Enter'], action: 'Вставка: вставить и открыть; поиск ⌘F: предыдущая находка' },
    { keys: ['Esc'], action: 'Закрыть вставку (где бы ни был фокус внутри меню) или поиск; фокус вернётся туда, откуда открыли вставку' },
    { keys: ['←', '→'], action: 'Поиск ⌘F: фильтры-чипы' },
    { keys: ['Shift', 'F10'], action: 'Контекстное меню с клавиатуры' },
  ],
  a11y: [
    'Вставка — combobox со списком listbox: группы подписаны, выбранная строка — aria-selected и aria-activedescendant у поля.',
    'Вставка запоминает фокус при открытии и возвращает его после Esc, вставки или клика снаружи, если фокус не ушёл на другой элемент; уход фокуса из меню закрывает его, переключение окна — нет.',
    'Счётчик «2 из 5» — role="status": переход к находке слышен без переноса фокуса.',
    'Фильтры — radiogroup «Где искать» с одним Tab-стопом.',
    '«Вернуть сюда» есть у каждой прошлой точки и видна при фокусе, не только при наведении; имя кнопки называет точку.',
    'Контекстные меню — ContextMenu Base UI: стрелки, typeahead, Esc и возврат фокуса.',
  ],
  motion: [
    { label: 'Меню', value: 'как ContextMenu: opacity + scale .96 от точки клика', reduced: 'только прозрачность' },
    { label: 'Строки и «Вернуть сюда»', value: 'background-color, opacity · 100 мс · ease-hover', tokens: ['duration-micro'] },
  ],
  examples: [
    { id: 'tab-insert', title: 'Вставка шага', description: 'Заглушка «Добавить шаг» открывает вставку, ↵ добавляет шаг.' },
    { id: 'context-menus', title: 'Контекстные меню', description: 'Пустое место и шаг: включить, закрепить, удалить.' },
    { id: 'graph-search', title: 'Поиск по графу', description: '⌘F, фильтры и переход камеры.' },
    { id: 'history', title: 'История', description: 'Откат к точке, откат сам становится шагом.' },
  ],
};

export default meta;
