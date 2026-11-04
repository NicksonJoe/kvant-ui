import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'canvas-inspector',
  status: 'beta',
  title: 'Инспектор шага',
  description:
    'Настройки выделенного шага в правой зоне редактора. Одна оболочка для всех видов: шапка с плиткой вида, вкладки «Параметры · Данные · Запуски», поля сверху вниз в том порядке, в котором о них думают. Переменные прошлых шагов — синие чипы {{…}}, внизу — что было в прошлом запуске, чтобы настройка опиралась на живые данные. Без выделения инспектор показывает граф целиком и версию.',
  category: 'canvas',
  paperBoard: '1UH4-0',
  anatomy: [
    'Шапка: плитка вида 28 r8 (14 % цвета вида или бренд), название 14/20 600, вид · сервис · шаг 12/16 fg-3, × 28',
    'Вкладки: 13/18, активная 600 fg-1 с линией 2 fg-1, между вкладками 16',
    'Баннер ошибок: danger-soft r10, «1 ошибка мешает публиковать»',
    'Поля: подпись 12/16 500 fg-2, поле h36 r10, между полями 16, отступы 16',
    'Группа со списком: подпись + «+ Поле» accent, рамка border r10, строки h36 с разделителями',
    'Выходы: метка порта 10 (числа круглые, структуры пустые), имя mono 12/16 500, тип fg-3 56, значение прошлого запуска 80',
    'Инструкция: текст 13/19, переменные accent-soft-fg на accent-soft, подсказка «набрать {{»',
    'Заметка внизу: surface-2 r10 p12 — «Прошлый запуск — 3 мин назад»',
  ],
  related: ['canvas-editor', 'canvas-node', 'canvas-run', 'tabs', 'field', 'select', 'segmented-control'],
  source: {
    file: 'components/canvas-inspector.tsx',
    exports: [
      'CanvasInspector',
      'InspectorIcon',
      'InspectorGroup',
      'InspectorList',
      'InspectorListItem',
      'InspectorOutputs',
      'InspectorNote',
      'InspectorEmpty',
      'InstructionField',
      'VariableChip',
      'PortMark',
      'splitVariables',
    ],
  },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['badge', 'canvas-check'] },
  props: [
    { name: 'title', type: 'string', required: true, description: 'Название шага; оно же имя области для диктора.' },
    { name: 'subtitle', type: 'node', description: 'Вид · сервис · номер шага: «Триггер · Telegram · шаг 1».' },
    { name: 'icon', type: 'node', control: false, description: 'InspectorIcon цвета вида: chart-5 триггер, chart-1 действие, chart-4 логика, chart-7 ИИ, chart-3 данные.' },
    { name: 'onClose', type: 'function', signature: '() => void', description: 'Показывает ×: снять выделение.' },
    { name: 'variant', type: 'enum', options: ['panel', 'card'], default: 'panel', description: 'panel — заполняет зону инспектора CanvasEditor; card — отдельная карточка 312 с тенью.' },
    { name: 'errors', type: 'number', default: 0, description: 'Ошибки шага, которые мешают публиковать: баннер над полями.' },
    { name: 'params', type: 'node', control: false, description: 'Поля шага. С ним у инспектора вкладки, без него — обычное тело из children.' },
    { name: 'data', type: 'node', control: false, description: 'Вход и выход прошлого запуска.' },
    { name: 'runs', type: 'node', control: false, description: 'Запуски шага.' },
    { name: 'runCount', type: 'number', description: 'В названии вкладки: «Запуски 128», 0 — «Запусков нет».' },
    { name: 'tab', type: 'enum', options: ['params', 'data', 'runs'], description: 'Открытая вкладка (управляемо); defaultTab — params, onTabChange.' },
  ],
  parts: [
    {
      name: 'InspectorGroup',
      description: 'Подписанный блок для списков: выходы, правила, ветки, поля. Одиночные поля — в Field.',
      props: [
        { name: 'label', type: 'node', required: true, description: '«Выходы», «Правила».' },
        { name: 'actionLabel', type: 'string', description: 'Действие справа после «+»: «Поле», «Правило».' },
        { name: 'onAction', type: 'function', signature: '() => void', description: 'Нажатие на действие.' },
      ],
    },
    {
      name: 'InspectorOutputs',
      description: 'Выходы шага списком.',
      props: [{ name: 'outputs', type: 'object', signature: 'readonly InspectorOutput[]', required: true, description: 'name, type (CanvasPortType), value прошлого запуска.' }],
    },
    {
      name: 'InstructionField',
      description: 'Инструкция для агента: переменные {{…}} подсвечиваются при наборе, чипы под текстом вставляют их у курсора.',
      props: [
        { name: 'value', type: 'string', description: 'Текст (управляемо); defaultValue, onValueChange.' },
        { name: 'variables', type: 'object', signature: 'readonly string[]', description: 'Переменные прошлых шагов: «сообщение.текст».' },
        { name: 'invalid', type: 'boolean', description: 'Рамка danger.' },
      ],
    },
    {
      name: 'InspectorEmpty',
      description: 'Ничего не выделено: подсказка, размер графа, версия детьми.',
      props: [
        { name: 'steps', type: 'number', required: true, description: 'Шагов в графе.' },
        { name: 'edges', type: 'number', required: true, description: 'Связей.' },
        { name: 'warnings', type: 'number', description: 'Предупреждений проверки.' },
      ],
    },
    { name: 'InspectorNote', description: 'Заметка surface-2 под полями.', props: [{ name: 'title', type: 'node', required: true, description: '«Прошлый запуск — 3 мин назад».' }] },
    { name: 'VariableChip', description: 'Переменная прошлого шага.', props: [{ name: 'path', type: 'string', required: true, description: '«заявка.task» → {{заявка.task}}.' }] },
  ],
  slots: [
    { name: 'canvas-inspector', description: 'Корень section с именем шага; data-variant.' },
    { name: 'inspector-icon', description: 'Плитка вида.' },
    { name: 'inspector-group', description: 'Подписанный блок.' },
    { name: 'inspector-list', description: 'Список в рамке.' },
    { name: 'port-mark', description: 'Метка типа порта; data-type.' },
    { name: 'variable-chip', description: 'Чип переменной.' },
    { name: 'instruction-field', description: 'Инструкция; data-invalid.' },
    { name: 'inspector-note', description: 'Заметка.' },
    { name: 'inspector-empty', description: 'Без выделения.' },
  ],
  states: [
    { id: 'rest', label: 'параметры', description: 'Поля шага на первой вкладке.' },
    { id: 'invalid', label: 'ошибка', description: 'Баннер «1 ошибка мешает публиковать», поле с рамкой danger и подсказкой.', props: { errors: 1 } },
    { id: 'empty', label: 'ничего не выделено', description: '«Выберите шаг», размер графа и версия.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Закрыть → вкладки → поля сверху вниз' },
    { keys: ['←', '→'], action: 'Между вкладками' },
    { keys: ['Esc'], action: 'В редакторе снимает выделение и закрывает инспектор' },
  ],
  a11y: [
    'Корень — section с именем шага (aria-labelledby на заголовок).',
    'Вкладки — Base UI Tabs: tablist, стрелки, панель связана с вкладкой.',
    'Баннер ошибок — role="alert"; поле с ошибкой — aria-invalid и текст под ним.',
    'Инструкция — обычный textarea: подсветка лежит под прозрачным текстом и скрыта от диктора, подсказка «набрать {{» — aria-describedby.',
    'Метки портов декоративны: тип назван словом рядом.',
  ],
  motion: [
    { label: 'Линия вкладки', value: 'сдвиг · пружина snappy', easing: 'spring-snappy', reduced: '250 мс ease-fluid' },
    { label: 'Рамка поля', value: 'фокус · 100 мс', easing: 'ease-hover', tokens: ['duration-fast'] },
  ],
  examples: [
    { id: 'steps', title: 'Инспекторы разных шагов', description: 'Триггер Telegram, условие, агент с инструкцией и выходами.' },
    { id: 'states', title: 'Ошибка и пустой инспектор', description: 'Шаг не настроен; ничего не выделено.' },
  ],
};

export default meta;
