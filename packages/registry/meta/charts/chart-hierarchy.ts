import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'chart-hierarchy',
  status: 'beta',
  title: 'Иерархия и структура',
  description:
    'Как устроено? Оргструктура — дерево карточек сверху вниз с ломаными связями; глубже трёх уровней ветки свёрнуты, на узком экране листья встают столбиком, а ещё уже — список с отступами. Дендрограмма — иерархическая кластеризация: высота слияния показывает, насколько группы непохожи, пунктир среза красит группы. Mind map — центр и ветки направлений, поровну влево и вправо. Раскладка дерева своя, по контурам, без пересечений. Доли иерархии (treemap, sunburst) — в «Частях целого».',
  category: 'charts',
  paperBoard: '1RJ3-0',
  anatomy: [
    'Оргструктура: карточка 118×52 r8, surface-2 с рамкой border, корень 180 в accent-soft',
    'Узко: листья столбиком под родителем с отступом 12, ещё уже — список с отступом 24',
    'Связи — ломаные border 1,5 без диагоналей, уровни через 110',
    'Свёрнутая ветка: капсула «+N» на нижней кромке карточки',
    'Дендрограмма: листья с шагом 22, сетка separator, ветки 2 цветом группы ниже среза и fg-4 выше',
    'Срез: пунктир fg-1 1,5 4/3 с подписью «срез: N групп»',
    'Mind map: центр — плашка fg-1, ветки chart-1…5 толщиной 3 → 1,5 к листьям, подписи над линией',
    'Подсказка overlay r12',
  ],
  related: ['tree-view', 'chart', 'card'],
  source: { file: 'components/chart-hierarchy.tsx', exports: ['OrgChart', 'Dendrogram', 'MindMap', 'layoutTree'] },
  dependencies: { npm: [], registry: [] },
  propsOf: 'OrgChart',
  props: [
    { name: 'aria-label', type: 'string', required: true, description: 'Название дерева; рядом скрытая таблица всех узлов.', control: false },
    {
      name: 'data',
      type: 'object',
      required: true,
      signature: '{ title: string; subtitle?: string; value?: number; children?: readonly OrgChartNode[] }',
      description: 'Корень дерева: подразделение или человек, вторая строка и число в углу.',
      control: false,
    },
    { name: 'expandDepth', type: 'number', options: [2, 3, 4], default: 3, description: 'Сколько уровней раскрыто сразу; ветки глубже свёрнуты с «+N».' },
    {
      name: 'layout',
      type: 'enum',
      options: ['auto', 'tree', 'stack', 'indent'],
      default: 'auto',
      description: 'tree — сверху вниз; stack — листья столбиком под родителем; indent — список с отступом 24. auto берёт первый, что помещается по ширине.',
    },
    { name: 'valueLabel', type: 'string', default: 'Сотрудников', description: 'Что считает value: в подсказке и таблице.' },
    { name: 'formatValue', type: 'function', signature: '(value: number) => string', description: 'Формат числа в углу.', control: false },
  ],
  parts: [
    {
      name: 'Dendrogram',
      description: 'Листья слева в порядке слияний, ломаные связи вправо. Наведение и ↑ ↓ показывают группу, ближайших соседей и расстояние слияния.',
      props: [
        { name: 'aria-label', type: 'string', required: true, description: 'Что кластеризовано.' },
        { name: 'data', type: 'object', required: true, signature: '{ label?: string; height?: number; children?: readonly DendrogramNode[] }', description: 'Дерево слияний: у листа label, у слияния height и children; label слияния — имя группы в легенде.' },
        { name: 'cut', type: 'number', description: 'Уровень среза: ветки ниже него — цветом группы, легенда групп над графиком.' },
        { name: 'axisLabel', type: 'string', default: 'расстояние', description: 'Подпись оси.' },
        { name: 'formatValue', type: 'function', signature: '(value: number) => string', description: 'Формат расстояния.' },
      ],
    },
    {
      name: 'MindMap',
      description: 'Центр и ветки; ветки делятся влево и вправо поровну по высоте. Сворачивается по веткам, как дерево.',
      props: [
        { name: 'aria-label', type: 'string', required: true, description: 'Название карты.' },
        { name: 'data', type: 'object', required: true, signature: '{ label: string; children?: readonly MindMapNode[] }', description: 'Центр; его дети — ветки, их дети — листья.' },
        { name: 'side', type: 'enum', options: ['auto', 'both', 'right'], default: 'auto', description: 'both — две стороны, right — все ветки справа; auto — две, пока помещаются.' },
      ],
    },
    {
      name: 'layoutTree',
      description: 'Раскладка аккуратного дерева по контурам (Рейнгольд — Тилфорд): центры узлов в прямом порядке обхода, левый край — 0. Детерминирована.',
      props: [
        { name: 'root', type: 'object', required: true, signature: '{ width: number; children?: readonly TidyNode[] }', description: 'Дерево с шириной каждого узла.' },
        { name: 'gap', type: 'number', default: 10, description: 'Минимальный зазор между соседями на уровне.' },
      ],
    },
  ],
  slots: [
    { name: 'org-chart', description: 'Оргструктура.' },
    { name: 'org-chart-node', description: 'Карточка узла, treeitem; data-x, data-y, data-width — геометрия.' },
    { name: 'org-chart-link', description: 'Связь родителя и ребёнка.' },
    { name: 'dendrogram', description: 'Дендрограмма с легендой групп.' },
    { name: 'dendrogram-leaf', description: 'Подпись листа.' },
    { name: 'dendrogram-link', description: 'Слияние; data-group — группа ниже среза.' },
    { name: 'dendrogram-cut', description: 'Пунктир среза с подписью.' },
    { name: 'mind-map', description: 'Mind map.' },
    { name: 'mind-map-link', description: 'Линия к узлу; data-depth — уровень.' },
    { name: 'chart-tooltip', description: 'Подсказка.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Без подсказки.' },
    { id: 'expanded', label: 'раскрыто', description: 'Ветка показывает детей; aria-expanded.' },
    { id: 'collapsed', label: 'свёрнуто', description: 'Дети скрыты, у карточки капсула «+N», у ветки mind map — «+N» после подписи.' },
    { id: 'highlighted', label: 'выбрано', description: 'Наведение или клавиши: подсказка, у дендрограммы и mind map остальные группы приглушены.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'В дерево: на последний выбранный узел или корень' },
    { keys: ['↑', '↓'], action: 'Оргструктура и mind map: предыдущий или следующий видимый узел; дендрограмма: соседний лист' },
    { keys: ['→'], action: 'Раскрыть ветку или перейти к первому ребёнку' },
    { keys: ['←'], action: 'Свернуть ветку или перейти к родителю' },
    { keys: ['Home', 'End'], action: 'Первый или последний видимый узел (лист)' },
    { keys: ['Enter', 'Space'], action: 'Свернуть или раскрыть ветку' },
  ],
  a11y: [
    'Оргструктура и mind map — role tree: treeitem с aria-level, aria-posinset, aria-setsize и aria-expanded, фокус переходит по узлам.',
    'Дендрограмма — group с названием; выбранный лист объявляется через aria-live: группа, ближайшие соседи, расстояние.',
    'У каждого графика скрытая таблица всех узлов, включая свёрнутые.',
    'Группы дендрограммы подписаны в легенде словом, не только цветом.',
  ],
  motion: [
    { label: 'Узлы оргструктуры', value: 'появляются opacity и scale .95 → 1 за 200 мс, в том числе после раскрытия', tokens: ['duration-base'] },
    { label: 'Ветки дендрограммы', value: 'проявляются слева направо clip-path 700 мс ease-out один раз', tokens: ['duration-deliberate'], reduced: '150 мс' },
    { label: 'Mind map', value: 'узлы проявляются от центра: opacity 300 мс, задержка 80 мс на уровень', tokens: ['duration-slow'], reduced: '150 мс' },
    { label: 'Приглушение', value: 'остальные группы до 30 % за 150 мс', tokens: ['duration-quick'] },
  ],
  examples: [
    { id: 'org', title: 'Оргструктура', description: 'Компания на 120 человек: три уровня, число в углу — людей в подразделении.' },
    { id: 'sales', title: 'Отдел продаж', description: 'Четыре уровня: глубже третьего ветки свёрнуты с «+N».' },
    { id: 'baskets', title: 'Какие товары покупают вместе', description: 'Дендрограмма 12 категорий со срезом на 3 группы.' },
    { id: 'launch', title: 'План запуска', description: 'Mind map: пять направлений и задачи.' },
  ],
};

export default meta;
