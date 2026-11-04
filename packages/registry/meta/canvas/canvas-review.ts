import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'canvas-review',
  status: 'beta',
  title: 'Проверка и версии',
  description:
    '«Проверить» находит то, что сломает запуск, ещё до него: циклы без выхода, пустые обязательные входы, шаги, до которых не доходит триггер, оборванные ветки, связи в никуда и несовпадение типов. Ошибки блокируют публикацию, предупреждения — нет; «Показать» ведёт камеру к шагу. Каждая публикация — версия с автором; любую можно сравнить с черновиком прямо на канвасе или восстановить.',
  category: 'canvas',
  paperBoard: '1M7O-0',
  anatomy: [
    'Шапка h52: «Нашлось 4», чипы «2 ошибки» danger и «2 предупреждения» warning, «сначала ошибки» и «Опубликовать»',
    'Строка проблемы: значок 20, заголовок 14/20 500, объяснение 13/18 fg-2 с тем, как починить, «Показать» или «Исправить»',
    'Сравнение: плашка «v7 · 28 октября → Черновик · Восстановить v7», легенда +2 ~1 −1',
    'Шаги в сравнении: добавлен — кольцо success, изменён — кольцо warning + «было / стало», удалён — призрак danger-soft пунктиром',
    'Версии: название, автор и дата, «работает», «Сравнить», «Восстановить»',
  ],
  related: ['canvas-editor', 'canvas-node', 'canvas-inspector', 'canvas-run', 'json-viewer'],
  source: {
    file: 'components/canvas-review.tsx',
    exports: ['CanvasProblems', 'CanvasVersionBar', 'CanvasVersionList', 'CanvasChangeNote', 'CANVAS_DIFF_CLASSES', 'checkGraph', 'diffGraphs', 'portTypeName', 'pluralRu'],
  },
  dependencies: { npm: ['lucide-react'], registry: ['badge', 'button'] },
  props: [
    { name: 'problems', type: 'object', signature: 'readonly CanvasProblem[]', required: true, control: false, description: 'Результат checkGraph(graph, { label }): ошибки первыми.' },
    { name: 'onShow', type: 'function', signature: '(problem: CanvasProblem) => void', description: '«Показать»: камера к problem.nodeIds[0], выделить шаг.' },
    { name: 'canFix', type: 'function', signature: '(problem: CanvasProblem) => boolean', description: 'Можно ли починить в один клик — тогда «Исправить».' },
    { name: 'onFix', type: 'function', signature: '(problem: CanvasProblem) => void', description: 'Правка сразу: например, вставить конвертер «текст → число».' },
    { name: 'onPublish', type: 'function', signature: '() => void', description: '«Опубликовать» в шапке; недоступна, пока есть ошибки.' },
    { name: 'publishing', type: 'boolean', default: false, description: 'Публикация идёт: спиннер в кнопке.' },
  ],
  parts: [
    {
      name: 'CanvasVersionBar',
      description: 'Плашка над канвасом, пока сравниваются версии.',
      props: [
        { name: 'from', type: 'string', required: true, description: '«v7 · 28 октября».' },
        { name: 'to', type: 'string', required: true, description: '«Черновик».' },
        { name: 'diff', type: 'object', signature: 'CanvasGraphDiff', description: 'Из diffGraphs(before, after): легенда считает шаги.' },
        { name: 'restoreLabel', type: 'string', description: '«Восстановить v7».' },
        { name: 'onRestore', type: 'function', signature: '() => void', description: 'Восстановление тоже идёт в историю.' },
      ],
    },
    {
      name: 'CanvasVersionList',
      description: 'Список версий.',
      props: [
        { name: 'versions', type: 'object', signature: 'readonly CanvasVersion[]', required: true, description: 'id, label, date, byline («Опубликовала Ирина»), note, current, draft.' },
        { name: 'comparingId', type: 'string', description: 'Версия, которая сейчас сравнивается.' },
        { name: 'onCompare', type: 'function', signature: '(id: string) => void', description: '«Сравнить».' },
        { name: 'onRestore', type: 'function', signature: '(id: string) => void', description: '«Восстановить».' },
      ],
    },
    {
      name: 'CanvasChangeNote',
      description: '«Было / стало» у изменённого шага; движок ставит её в координаты графа.',
      props: [
        { name: 'title', type: 'node', required: true, description: '«Инструкция агента».' },
        { name: 'before', type: 'node', description: 'Было: зачёркнуто, danger-soft-fg.' },
        { name: 'after', type: 'node', description: 'Стало: success-soft-fg.' },
        { name: 'meta', type: 'node', description: '«Вы · 4 мин назад».' },
      ],
    },
  ],
  slots: [
    { name: 'canvas-problems', description: 'Результаты проверки.' },
    { name: 'canvas-version-bar', description: 'Плашка сравнения.' },
    { name: 'canvas-versions', description: 'Список версий.' },
    { name: 'canvas-change', description: '«Было / стало».' },
  ],
  states: [
    { id: 'invalid', label: 'есть ошибки', description: '«Опубликовать» недоступна, рядом «сначала ошибки».' },
    { id: 'rest', label: 'только предупреждения', description: 'Публиковать можно.' },
    { id: 'empty', label: 'чисто', description: '«Проблем нет», граф можно запускать.', props: {} },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'По «Показать» и «Исправить» в порядке строк' },
    { keys: ['Enter'], action: 'Перейти к шагу или починить' },
  ],
  a11y: [
    'Счёт проблем — role="status": диктор слышит «Нашлось 4 · 2 ошибки · 2 предупреждения» после проверки.',
    'Каждая строка начинается со скрытого «Ошибка:» или «Предупреждение:»: цвет значка не единственный признак.',
    'Кнопки строки названы вместе с проблемой: «Показать: Цикл без выхода».',
    '«Было / стало» — role="note", del и ins со скрытыми «было:» и «стало:».',
  ],
  motion: [{ label: 'Переход к шагу', value: 'камера движка · 300 мс · ease-fluid', easing: 'ease-fluid', reduced: 'сразу', tokens: ['duration-slow'] }],
  examples: [
    { id: 'check', title: 'Проверка графа', description: 'checkGraph на настоящем графе: ошибки, предупреждения, публикация.' },
    { id: 'versions', title: 'Версии и сравнение', description: 'Список версий, плашка сравнения, легенда и «было / стало».' },
  ],
};

export default meta;
