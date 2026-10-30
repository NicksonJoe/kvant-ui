import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'sidebar',
  status: 'stable',
  title: 'Боковая панель',
  description: 'Постоянная навигация админки: 256 px с подписями или узкая полоса 64 px с подсказками.',
  category: 'navigation',
  paperBoard: '1M9-0',
  anatomy: ['Панель', 'Секция с подписью', 'Пункт-капсула', 'Иконка 18 px', 'Счётчик', 'Подвал'],
  related: ['topbar', 'tab-bar', 'tree-view', 'navigation-menu'],
  source: { file: 'components/navigation.tsx', exports: ['Sidebar', 'SidebarSection', 'SidebarItem', 'SidebarFooter'] },
  dependencies: { npm: ['@base-ui/react'], registry: ['popover'] },
  props: [
    { name: 'collapsed', type: 'boolean', default: false, description: 'Узкая полоса 64 px: подписи уходят в подсказки.' },
    { name: 'children', type: 'node', description: 'Секции и подвал.', control: false },
  ],
  parts: [
    {
      name: 'SidebarSection',
      description: 'Группа пунктов с подписью; в свёрнутом виде подпись становится короткой чертой.',
      props: [
        { name: 'label', type: 'string', description: 'Подпись секции.' },
        { name: 'action', type: 'node', description: 'Действие рядом с подписью, например «+».' },
      ],
    },
    {
      name: 'SidebarItem',
      description: 'Пункт навигации — ссылка по умолчанию; для роутера передайте render={<Link to="…" />}.',
      props: [
        { name: 'icon', type: 'node', required: true, description: 'Иконка 18 px.' },
        { name: 'label', type: 'string', required: true, description: 'Подпись.' },
        { name: 'count', type: 'node', description: 'Счётчик справа, табличные цифры.' },
        { name: 'active', type: 'boolean', description: 'Текущий раздел: aria-current="page", поднятая капсула.' },
        { name: 'shortcut', type: 'string', description: 'Клавиша в подсказке свёрнутой панели.' },
      ],
    },
  ],
  slots: [
    { name: 'sidebar', description: 'Панель; data-collapsed в узком виде.' },
    { name: 'sidebar-section', description: 'Секция (role="group").' },
    { name: 'sidebar-footer', description: 'Подвал, прижат к низу.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Подпись fg-2, иконка fg-2.' },
    { id: 'hover', label: 'наведение', description: 'Фон fill-1, подпись fg-1.' },
    { id: 'selected', label: 'текущий', description: 'Капсула surface-1 с тенью raised, иконка accent.' },
    { id: 'collapsed', label: 'свёрнуто', description: 'Только иконки, подписи в подсказках справа.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Идёт по пунктам сверху вниз' },
    { keys: ['Enter'], action: 'Открывает раздел' },
  ],
  a11y: [
    'Текущий пункт отмечен aria-current="page".',
    'В свёрнутом виде у пункта остаётся aria-label с подписью, подсказка показывается и при фокусе.',
  ],
  motion: [{ label: 'Сворачивание', value: 'ширина 256 ↔ 64 · 200 мс · ease-standard' }],
  examples: [
    { id: 'admin', title: 'Навигация админки', description: 'Секции, счётчики и кнопка сворачивания.' },
    { id: 'collapsed', title: 'Свёрнутая', description: 'Полоса 64 px; подписи — в подсказках.' },
  ],
};

export default meta;
