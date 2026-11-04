import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'canvas-run',
  status: 'beta',
  title: 'Панель запуска',
  description:
    'Тестовый прогон графа на глазах: снизу канваса выезжает панель, шаги загораются по очереди на дорожке времени, а справа видны вход, выход и лог выбранного шага — таблицей или JSON. Выход можно закрепить как тестовые данные шага, чтобы следующие прогоны не ходили в сервис.',
  category: 'canvas',
  paperBoard: '1M7O-0',
  anatomy: [
    'Шапка h52: точка состояния, «Запуск № 24» 14/20 600, «идёт · 1,6 с · шаг 2 из 5», чип тестовых данных, «Остановить», свернуть',
    'Шкала времени mono 10 fg-3, примерно шесть делений',
    'Строка шага h36: значок 16, название 13/18, полоса 12 r3 — готово success, идёт accent → 45 %, ждёт пусто, пропущен — причина текстом',
    'Выбранный шаг — accent-soft r8',
    'Данные: Вход / Выход / Лог, Таблица ↔ JSON, «Закрепить как тестовые данные шага»',
  ],
  related: ['canvas-editor', 'canvas-node', 'canvas-inspector', 'json-viewer', 'trace', 'segmented-control'],
  source: { file: 'components/canvas-run.tsx', exports: ['CanvasRunPanel', 'formatRunTime', 'runScale'] },
  dependencies: { npm: ['lucide-react'], registry: ['button', 'json-viewer', 'segmented-control', 'spinner'] },
  props: [
    { name: 'title', type: 'string', required: true, description: '«Запуск № 24»; имя области.' },
    { name: 'status', type: 'enum', options: ['running', 'done', 'error', 'stopped'], required: true, default: 'running', description: 'Состояние прогона: точка в шапке и строка «идёт · 1,6 с · шаг 2 из 5».' },
    { name: 'elapsed', type: 'number', description: 'Миллисекунд с начала (идёт) или всего (закончен).' },
    { name: 'testLabel', type: 'string', description: 'Чип тестовых данных: «тест: «Заявка Ивана, сайт, 120 000 ₽»».' },
    { name: 'steps', type: 'object', signature: 'readonly CanvasRunStep[]', required: true, control: false, description: 'id, title, status (CanvasRunStatus), start и duration в мс, detail («840 токенов»), reason для пропуска и ошибки.' },
    { name: 'selectedStepId', type: 'string', control: false, description: 'Выбранный шаг; его данные справа.' },
    { name: 'onSelectStep', type: 'function', signature: '(id: string) => void', description: 'Выбор строки — выделите и узел на канвасе.' },
    { name: 'input', type: 'object', signature: 'JsonValue', control: false, description: 'Вход выбранного шага.' },
    { name: 'output', type: 'object', signature: 'JsonValue', control: false, description: 'Выход выбранного шага.' },
    { name: 'log', type: 'object', signature: 'readonly string[]', control: false, description: 'Строки лога выбранного шага.' },
    { name: 'onStop', type: 'function', signature: '() => void', description: '«Остановить», пока прогон идёт.' },
    { name: 'onPin', type: 'function', signature: '() => void', description: '«Закрепить как тестовые данные шага».' },
    { name: 'collapsed', type: 'boolean', default: false, description: 'Свёрнута в полосу 52; onCollapsedChange показывает кнопку.' },
  ],
  slots: [{ name: 'canvas-run', description: 'Корень section с именем запуска; data-status.' }],
  states: [
    { id: 'loading', label: 'идёт', description: 'Шаг выполняется, полоса растёт, «Остановить».', props: { status: 'running' } },
    { id: 'rest', label: 'готово', description: 'Все шаги готовы, «готово за 2,3 с».', props: { status: 'done' } },
    { id: 'invalid', label: 'ошибка', description: 'Шаг упал: полоса danger и причина.', props: { status: 'error' } },
    { id: 'collapsed', label: 'свёрнута', description: 'Только шапка h52.', props: { collapsed: true } },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Шапка → строки шагов → данные' },
    { keys: ['Enter', 'Space'], action: 'Выбрать шаг' },
    { keys: ['←', '→'], action: 'Вход / Выход / Лог и Таблица / JSON' },
  ],
  a11y: [
    'Панель — section с именем запуска; строка состояния — role="status", диктор слышит смену шага.',
    'Строка шага — кнопка с именем «Разобрать заявку, выполняется, 1,5 с · 840 токенов», выбранная — aria-current.',
    'Шкала времени скрыта от диктора: время названо в строке.',
  ],
  motion: [
    { label: 'Полоса шага', value: 'ширина · 300 мс · ease-standard', easing: 'ease-standard', tokens: ['duration-slow'] },
    { label: 'Свернуть', value: 'шеврон · 150 мс', easing: 'ease-out', tokens: ['duration-quick'] },
  ],
  examples: [
    { id: 'live', title: 'Живой прогон', description: 'Шаги идут по таймеру, можно остановить и перезапустить.' },
    { id: 'finished', title: 'Готово и ошибка', description: 'Закончившийся прогон и прогон с упавшим шагом.' },
  ],
};

export default meta;
