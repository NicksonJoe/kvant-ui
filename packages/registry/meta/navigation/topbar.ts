import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'topbar',
  status: 'stable',
  title: 'Верхняя панель',
  description:
    'Каркас экрана: строка админки 56 (путь или заголовок, поиск ⌘K, действия), панель навигации iOS (крупный заголовок, стекло при прокрутке) и шапка сайта, которая после прокрутки становится стеклянной капсулой.',
  category: 'navigation',
  paperBoard: '1M9-0',
  anatomy: [
    'Админка: строка 56, фон страницы и нижний разделитель',
    'iOS: строка 44, крупный заголовок 34/41 700, назад — chevron 24 и подпись 17/22 accent',
    'iOS: стеклянная капсула действий 44 с кнопками 40 × 44',
    'Сайт: шапка 64 → стеклянная капсула 56 с отступом 12',
  ],
  related: ['sidebar', 'breadcrumb', 'command-palette', 'tab-bar', 'navigation-menu'],
  source: {
    file: 'components/navigation.tsx',
    exports: ['Topbar', 'TopbarTitle', 'AppBar', 'AppBarBack', 'AppBarActions', 'AppBarButton', 'SiteHeader'],
  },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['popover'] },
  propsOf: 'AppBar',
  props: [
    { name: 'title', type: 'node', required: true, description: 'Заголовок экрана.' },
    { name: 'titleSize', type: 'enum', options: ['inline', 'large'], default: 'inline', description: 'inline — 17/22 по центру строки; large — 34/41 под строкой, при прокрутке уходит в строку.' },
    { name: 'scrolled', type: 'boolean', default: false, description: 'Контент ушёл под панель: стекло и нижняя hairline; капсула действий теряет свою подложку.' },
    { name: 'leading', type: 'node', description: 'Слева: AppBarBack или круглая кнопка закрытия.', control: false },
    { name: 'trailing', type: 'node', description: 'Справа: AppBarActions, текстовая кнопка или подтверждение.', control: false },
    { name: 'children', type: 'node', description: 'Под крупным заголовком, например поиск h36.', control: false },
  ],
  parts: [
    { name: 'Topbar', description: 'Строка админки 56: фон страницы и разделитель; разрыв — пустой div с flex-1.', props: [{ name: 'children', type: 'node', description: 'Содержимое слева направо.' }] },
    { name: 'TopbarTitle', description: 'Заголовок раздела админки, h1 14/20 500.', props: [{ name: 'children', type: 'node', description: 'Текст.' }] },
    { name: 'AppBarBack', description: 'Назад: chevron 24 и заголовок предыдущего экрана в accent. Ссылка по умолчанию.', props: [{ name: 'label', type: 'string', required: true, description: 'Заголовок предыдущего экрана.' }] },
    { name: 'AppBarActions', description: 'Стеклянная капсула 44 для кнопок; на стеклянной панели теряет подложку.', props: [] },
    {
      name: 'AppBarButton',
      description: 'Кнопка панели iOS: иконка 20, штрих 1,5.',
      props: [
        { name: 'icon', type: 'node', required: true, description: 'Иконка.' },
        { name: 'variant', type: 'enum', options: ['plain', 'glass', 'accent'], default: 'plain', description: 'plain — 40 × 44 в капсуле; glass — круг 44 (закрыть); accent — круг 44 (подтвердить).' },
      ],
    },
    {
      name: 'SiteHeader',
      description: 'Шапка сайта: прозрачная в сетке контента, после 8 px прокрутки — стеклянная капсула 56 с отступом 12.',
      props: [
        { name: 'logo', type: 'node', required: true, description: 'Логотип-ссылка слева.' },
        { name: 'actions', type: 'node', description: '«Войти» и маленькая главная кнопка.' },
        { name: 'scrolled', type: 'boolean', description: 'Страница прокручена больше чем на 8 px.' },
      ],
    },
  ],
  slots: [
    { name: 'topbar', description: 'Строка админки (header).' },
    { name: 'app-bar', description: 'Панель iOS (header); data-scrolled при прокрутке.' },
    { name: 'app-bar-actions', description: 'Капсула действий.' },
    { name: 'site-header', description: 'Шапка сайта; data-scrolled при прокрутке.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Прозрачна и сливается с фоном.' },
    { id: 'collapsed', label: 'прокрутка', description: 'Стекло (blur 20, saturate 180 %) и нижняя hairline; крупный заголовок уходит в строку.', props: { scrolled: true } },
  ],
  keyboard: [{ keys: ['Tab'], action: 'Идёт по элементам панели слева направо' }],
  a11y: [
    'Панель — header, заголовок экрана — h1 (у крупного заголовка дубль в строке скрыт).',
    'У кнопок-иконок обязательны aria-label; у «назад» видна подпись предыдущего экрана.',
    'Стекло только у плавающей панели — никогда стекло на стекле.',
  ],
  motion: [
    { label: 'Крупный заголовок', value: '34 → 17 при прокрутке, кроссфейд 150 мс ease-out' },
    { label: 'Стекло и край', value: 'opacity за первые 8 px прокрутки' },
    { label: 'Шапка сайта', value: 'отступ, ширина и радиус 250 мс ease-standard; фон и тень 150 мс ease-hover' },
  ],
  examples: [
    { id: 'section', title: 'Раздел админки', description: 'Заголовок, поиск с ⌘K, уведомления и профиль.' },
    { id: 'record', title: 'Запись', description: 'Кнопка «назад», статус и действия с записью.' },
    { id: 'ios', title: 'Панель iOS', description: 'Крупный заголовок уходит в строку, панель становится стеклянной.' },
    { id: 'site', title: 'Шапка сайта', description: 'Прокрутите — шапка отрывается от края и становится капсулой.' },
  ],
};

export default meta;
