import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'tabs',
  status: 'stable',
  title: 'Вкладки',
  description: 'Переключают панели внутри одного контекста. Подчёркивание для разделов страницы, капсулы — для фильтров.',
  category: 'navigation',
  paperBoard: 'CM8-0',
  anatomy: ['Корень', 'Список вкладок', 'Вкладка', 'Индикатор', 'Панель'],
  related: ['segmented-control', 'navigation-menu', 'table-of-contents'],
  source: { file: 'components/tabs.tsx', exports: ['Tabs', 'TabsList', 'TabsTab', 'TabsPanel'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  propsOf: 'TabsList',
  props: [
    { name: 'variant', type: 'enum', options: ['underline', 'pills'], default: 'underline', description: 'underline — полоса 2 px accent, pills — капсула fill-2.' },
    { name: 'activateOnFocus', type: 'boolean', default: true, description: 'Стрелки сразу открывают вкладку. Выключите, если панель тяжёлая.' },
  ],
  parts: [
    {
      name: 'Tabs',
      description: 'Корень: хранит выбранную вкладку.',
      props: [
        { name: 'defaultValue', type: 'string', description: 'Вкладка по умолчанию.' },
        { name: 'value', type: 'string', description: 'Управляемая вкладка.' },
        { name: 'onValueChange', type: 'function', signature: '(value: string) => void', description: 'Новая вкладка.' },
      ],
    },
    { name: 'TabsTab', description: 'Вкладка.', props: [{ name: 'value', type: 'string', required: true, description: 'Значение вкладки.' }, { name: 'disabled', type: 'boolean', description: 'Недоступна.' }] },
    { name: 'TabsPanel', description: 'Панель вкладки.', props: [{ name: 'value', type: 'string', required: true, description: 'Значение вкладки, которой принадлежит панель.' }] },
  ],
  slots: [
    { name: 'tabs', description: 'Корень.' },
    { name: 'tabs-list', description: 'Список (role="tablist"), несёт data-variant.' },
    { name: 'tabs-tab', description: 'Вкладка (role="tab").' },
    { name: 'tabs-indicator', description: 'Скользящий индикатор.' },
    { name: 'tabs-panel', description: 'Панель (role="tabpanel").' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Подпись fg-2.' },
    { id: 'hover', label: 'наведение', description: 'Подпись fg-1.' },
    { id: 'selected', label: 'выбрано', description: 'Подпись fg-1 и индикатор.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring вокруг вкладки.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.' },
  ],
  keyboard: [
    { keys: ['←', '→'], action: 'Соседняя вкладка' },
    { keys: ['Home', 'End'], action: 'Первая или последняя вкладка' },
    { keys: ['Tab'], action: 'Из списка вкладок в панель' },
  ],
  a11y: [
    'Роли tablist, tab и tabpanel; вкладка связана со своей панелью.',
    'Список вкладок — одна остановка Tab, дальше стрелки.',
    'Если вкладки меняют адрес страницы, это навигация — используйте ссылки, а не Tabs.',
  ],
  motion: [
    { label: 'Индикатор', value: 'spring-snappy: 300 мс, отскок 0,1' },
    { label: 'Подпись', value: 'цвет 75 мс · ease-hover' },
  ],
  examples: [
    { id: 'underline', title: 'Разделы записи', description: 'Подчёркивание — для разделов внутри страницы.' },
    { id: 'pills', title: 'Фильтр списка', description: 'Капсулы — для лёгкого переключения видов.' },
  ],
};

export default meta;
