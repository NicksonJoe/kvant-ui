import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'kanban',
  status: 'beta',
  title: 'Канбан',
  description:
    'Этапы слева направо с карточками. Карточку переносят мышью, пальцем или с клавиатуры, каждое перемещение объявляется; шапка колонки показывает число, сумму и лимит WIP. Редкий этап вроде «Оплачено» сворачивается в узкую полосу 48 с вертикальным названием — на неё тоже можно бросить карточку.',
  category: 'data-display',
  paperBoard: '1DPV-0',
  anatomy: [
    'Доска surface-2 r20 p12',
    'Шапка колонки h40: точка, название, счётчик, сумма, «Свернуть» 24',
    'Карточка surface-1 r12 p12',
    'Место вставки',
    'Пустая колонка',
    '«Добавить»',
    'Свёрнутая колонка 48 fill-1 r16: точка, счётчик, «название · сумма» вертикально',
  ],
  related: ['filter-bar', 'card', 'data-table'],
  source: { file: 'components/kanban.tsx', exports: ['Kanban', 'KanbanCard', 'moveKanbanItem'] },
  dependencies: { npm: ['lucide-react'], registry: [] },
  props: [
    { name: 'aria-label', type: 'string', required: true, description: 'Название доски: «Воронка сделок».' },
    { name: 'columns', type: 'object', signature: 'readonly KanbanColumn[]', required: true, control: false, description: 'Колонки: id, название, цвет точки, лимит WIP, сумма.' },
    { name: 'items', type: 'object', signature: 'KanbanItems<T>', required: true, control: false, description: 'Карточки по id колонки в порядке показа.' },
    { name: 'onItemsChange', type: 'function', signature: '(items: KanbanItems<T>) => void', required: true, description: 'Новый порядок после переноса.' },
    { name: 'renderCard', type: 'function', signature: '(item: T) => ReactNode', required: true, description: 'Содержимое карточки, обычно KanbanCard.' },
    { name: 'getLabel', type: 'function', signature: '(item: T) => string', required: true, description: 'Название карточки для диктора и объявлений.' },
    { name: 'onCardClick', type: 'function', signature: '(item: T) => void', description: 'Нажатие или Enter на карточке.' },
    { name: 'onAdd', type: 'function', signature: '(columnId: string) => void', description: '«Добавить» внизу каждой колонки.' },
    { name: 'collapsible', type: 'boolean', default: false, description: 'Кнопка «Свернуть» в шапке каждой колонки. Свёрнутая колонка разворачивается и без неё.' },
    { name: 'collapsed', type: 'object', signature: 'readonly string[]', control: false, description: 'Id свёрнутых колонок — управляемое состояние.' },
    { name: 'defaultCollapsed', type: 'object', signature: 'readonly string[]', control: false, description: 'Свёрнутые колонки при первом показе, дальше доска помнит сама.' },
    { name: 'onCollapsedChange', type: 'function', signature: '(collapsed: readonly string[]) => void', description: 'Новый список свёрнутых колонок после «Свернуть» или «Развернуть».' },
  ],
  parts: [{ name: 'KanbanCard', description: 'Поверхность карточки: surface-1, r12, p12, gap 8.', props: [] }],
  slots: [
    { name: 'kanban', description: 'Доска с горизонтальной прокруткой.' },
    { name: 'kanban-column', description: 'Колонка 298, минимум 264; свёрнутая — 48 с data-collapsed, во время переноса над ней — data-drop-target.' },
    { name: 'kanban-card', description: 'Карточка.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Карточки с тенью raised.' },
    { id: 'pressed', label: 'перетаскивание', description: 'Карточка 40 %, в колонке — пунктирное место вставки accent.', selector: 'data-dragging' },
    { id: 'invalid', label: 'лимит превышен', description: 'Счётчик «5 / 4» warning-soft.' },
    { id: 'empty', label: 'пустая колонка', description: '«Здесь пока пусто» с подсказкой перетащить.' },
    { id: 'collapsed', label: 'свёрнутая колонка', description: 'Полоса 48 fill-1 r16 во всю высоту доски: точка, счётчик 13 fg-3, «Оплачено · 4,8 млн ₽» вертикально 14/20 600.', selector: 'data-collapsed' },
    { id: 'highlighted', label: 'цель переноса', description: 'Свёрнутая колонка под карточкой: accent 6 % и рамка accent 35 %; карточка встаёт в конец.', selector: 'data-drop-target' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'По карточкам' },
    { keys: ['Alt+←', 'Alt+→'], action: 'В соседнюю колонку, в конец' },
    { keys: ['Alt+↑', 'Alt+↓'], action: 'Выше или ниже в колонке' },
    { keys: ['Enter', 'Space'], action: 'Открывает карточку; на «Свернуть» или свёрнутой колонке — сворачивает и разворачивает' },
  ],
  a11y: [
    'Колонка — group «Переговоры, 3»; карточка — кнопка с описанием «карточка».',
    'Каждый перенос объявляется: «„Айдентика“ — в „Договор“, позиция 2 из 3».',
    'Клавиатура повторяет перетаскивание, фокус остаётся на перенесённой карточке; Alt+→ в свёрнутую колонку оставляет фокус на её полосе.',
    '«Свернуть колонку „Договор“» — кнопка с aria-expanded="true"; свёрнутая колонка — кнопка «Развернуть колонку „Оплачено“» с aria-expanded="false" внутри group «Оплачено, 23».',
    'После сворачивания и разворачивания фокус переходит на парную кнопку, а не теряется.',
  ],
  motion: [
    { label: 'Перетаскивание', value: 'карточка 40 %, место вставки появляется сразу' },
    { label: 'Касание', value: 'долгое нажатие 350 мс, затем карточка идёт за пальцем', note: 'Сдвиг больше 8 px до этого — обычная прокрутка доски.' },
    { label: 'Наведение', value: 'тень raised → overlay · 150 мс', tokens: ['duration-quick'] },
    {
      label: '«Свернуть»',
      value: 'появляется при наведении на шапку и фокусе · прозрачность 150 мс',
      note: 'В покое кнопка нулевой ширины, сумма стоит у правого края; на сенсорном экране кнопка видна всегда.',
      tokens: ['duration-quick'],
    },
    { label: 'Сворачивание', value: 'мгновенно', note: 'Колонка сразу становится полосой 48, соседние сдвигаются без анимации.', easing: 'instant' },
  ],
  examples: [
    { id: 'deals', title: 'Воронка сделок', description: 'Суммы в шапках, лимит WIP, просроченный срок, свёрнутая колонка «Оплачено».' },
    { id: 'tasks', title: 'Задачи', description: 'Простые карточки и «Добавить».' },
  ],
};

export default meta;
