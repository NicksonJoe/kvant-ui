import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'step-palette',
  status: 'beta',
  title: 'Палитра шагов',
  description:
    'Левая зона редактора: поиск с «/» и шаги по семействам — триггеры, действия, логика, AI и данные. Шаг перетаскивают на канвас (HTML5 DnD, тип application/x-kvant-step с kind и id шаблона) или вставляют кликом и Enter — после выделенного шага или в центр. На канвасе бросок читает readCanvasStepDrag: он пропускает только правильный JSON с известным типом шага.',
  category: 'canvas',
  paperBoard: '1KOM-0',
  anatomy: [
    'Поиск h36 r10 fill-1 с подсказкой «/»',
    'Заголовок группы: 11 uppercase fg-3',
    'Шаг h32 r8: плитка 24 r6 chart-N 14 % и название 13/18',
    'Наведение и фокус: fill-2 и ручка ⠿ справа',
  ],
  related: ['canvas-editor', 'canvas-node', 'canvas-insert-menu', 'search-field'],
  source: {
    file: 'components/step-palette.tsx',
    exports: ['StepPalette', 'CANVAS_STEP_MIME', 'readCanvasStepDrag', 'matchesCanvasStep'],
  },
  dependencies: { npm: ['lucide-react'], registry: ['search-field', 'canvas-node'] },
  props: [
    {
      name: 'groups',
      type: 'object',
      signature: 'readonly CanvasStepGroup[]',
      required: true,
      control: false,
      description: 'Группы { id, title, items }; шаг — { id, kind, title, icon?, logo?, keywords? }. Пустые после поиска группы прячутся.',
    },
    { name: 'onInsert', type: 'function', signature: '(template: CanvasStepTemplate) => void', required: true, description: 'Клик или Enter по шагу, Enter в поиске — первый найденный.' },
    { name: 'shortcut', type: 'string', default: '/', description: 'Клавиша, которая с любого места страницы ставит фокус в поиск; в чужом поле ввода не срабатывает.' },
  ],
  parts: [
    {
      name: 'CanvasStepTemplate',
      description: 'Шаг палитры и меню вставки.',
      props: [
        { name: 'id', type: 'string', required: true, description: 'Id шаблона — уходит в payload перетаскивания.' },
        { name: 'kind', type: 'enum', options: ['trigger', 'action', 'condition', 'loop', 'wait', 'agent', 'data', 'group', 'note'], required: true, description: 'Тип узла: цвет и иконка плитки.' },
        { name: 'title', type: 'string', required: true, description: '«Создать сделку».' },
        { name: 'keywords', type: 'object', signature: 'readonly string[]', description: 'Что ещё находит шаг: «telegram», «ии».' },
      ],
    },
    {
      name: 'readCanvasStepDrag',
      description: '(data: DataTransfer) => CanvasStepDragPayload | null — разбирает бросок на канвас; файлы, текст и чужой JSON дают null.',
      props: [],
    },
  ],
  slots: [
    { name: 'step-palette', description: 'Корень: поиск и список.' },
    { name: 'step-palette-item', description: 'Шаг: button draggable с data-kind.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Все группы, поиск пуст.' },
    { id: 'hover', label: 'наведение', description: 'Шаг fill-2, справа ручка ⠿, курсор grab.', selector: ':hover · fill-2' },
    { id: 'focus', label: 'фокус', description: 'fill-2 и кольцо ring внутри строки.' },
    { id: 'filled', label: 'поиск', description: 'Только подходящие шаги, пустые группы скрыты.' },
    { id: 'empty', label: 'ничего не нашлось', description: 'Строка «Ничего не нашлось».' },
  ],
  keyboard: [
    { keys: ['/'], action: 'Фокус в поиск с любого места страницы' },
    { keys: ['↓'], action: 'Из поиска — на первый шаг; по шагам — вниз' },
    { keys: ['↑'], action: 'По шагам вверх' },
    { keys: ['Enter'], action: 'На шаге — вставить его; в поиске — вставить первый найденный' },
    { keys: ['Esc'], action: 'В поиске: очистить, второй Esc — выйти из поля' },
  ],
  a11y: [
    'Каждая группа — role="group", подписанная своим заголовком.',
    'Шаг — кнопка: перетаскивание мышью дублируется кликом и Enter, так что палитра работает без мыши.',
    'Плитка и ручка aria-hidden: имя шага — его название.',
  ],
  motion: [{ label: 'Фон и ручка шага', value: 'background-color, opacity · 100 мс · ease-hover', reduced: 'так же: это не движение', tokens: ['duration-micro'] }],
  examples: [
    { id: 'drop-target', title: 'Перетаскивание на канвас', description: 'Бросок с application/x-kvant-step и readCanvasStepDrag; клик тоже вставляет.' },
    { id: 'search', title: 'Поиск по ключевым словам', description: '«/», ↓ и Enter без мыши.' },
  ],
};

export default meta;
