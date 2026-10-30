import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'navigation-menu',
  status: 'stable',
  title: 'Меню навигации',
  description:
    'Навигация сайта с панелями: раскрывается по наведению с задержкой 100 мс и по клику. Колонки разделов и карточка с новостью; панель сохраняет место и плавно меняет размер при переходе между пунктами шапки.',
  category: 'navigation',
  paperBoard: '9XO-0',
  anatomy: ['Пункты шапки h32 px12', 'Шеврон 180° у открытого', 'Панель overlay r24 p12, в 8 под пунктом', 'Колонка 280 с подписью', 'Ссылка: круг 36, заголовок 14/20, описание 13/18'],
  related: ['topbar', 'menu', 'popover'],
  source: { file: 'components/navigation-menu.tsx', exports: ['NavigationMenu', 'NavigationMenuItem', 'NavigationMenuGroup', 'NavigationMenuLink'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: [] },
  props: [
    { name: 'delay', type: 'number', options: [0, 100, 300], default: 100, description: 'Задержка открытия по наведению, мс.' },
    { name: 'aria-label', type: 'string', description: 'Название навигации.', control: false },
  ],
  parts: [
    {
      name: 'NavigationMenuItem',
      description: 'Пункт шапки: с содержимым — кнопка с панелью, без него — ссылка.',
      props: [
        { name: 'label', type: 'node', required: true, description: 'Подпись 14/20 500.' },
        { name: 'href', type: 'string', description: 'Пункт-ссылка.' },
        { name: 'active', type: 'boolean', description: 'Текущий раздел: fg-1 и точка 4 accent.' },
        { name: 'children', type: 'node', description: 'Панель: колонки NavigationMenuGroup и карточка.' },
      ],
    },
    { name: 'NavigationMenuGroup', description: 'Колонка 280 с подписью 12/16 500 fg-3.', props: [{ name: 'label', type: 'node', description: 'Подпись колонки.' }] },
    {
      name: 'NavigationMenuLink',
      description: 'Ссылка панели r12.',
      props: [
        { name: 'title', type: 'node', required: true, description: 'Заголовок 14/20 500.' },
        { name: 'description', type: 'node', description: 'Описание 13/18 fg-3 в две строки.' },
        { name: 'icon', type: 'node', description: 'Иконка 18 в круге 36 (surface-2, при наведении — surface-1).' },
      ],
    },
  ],
  slots: [
    { name: 'navigation-menu', description: 'Корень nav.' },
    { name: 'navigation-menu-group', description: 'Колонка панели.' },
    { name: 'navigation-menu-link', description: 'Ссылка панели.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Пункт fg-2; ссылка панели — круг surface-2.' },
    { id: 'hover', label: 'наведение', description: 'fill-1 fg-1; ссылка панели — fill-2 и круг surface-1.' },
    { id: 'pressed', label: 'нажатие', description: 'fill-2, масштаб 0,97 (ссылка панели — fill-3, 0,98).' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring, отступ 2.' },
    { id: 'open', label: 'открыто', description: 'fill-2, шеврон повёрнут.' },
    { id: 'selected', label: 'текущая', description: 'fg-1 и точка 4 accent под подписью.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Идёт по пунктам шапки и ссылкам открытой панели' },
    { keys: ['Enter', 'Space'], action: 'Открывает панель пункта' },
    { keys: ['↓'], action: 'Из пункта в панель' },
    { keys: ['Esc'], action: 'Закрывает панель, фокус возвращается на пункт' },
  ],
  a11y: [
    'Корень — nav; пункт с панелью — кнопка с aria-expanded, текущая ссылка — aria-current="page".',
    'Панель не перехватывает фокус: Tab идёт по ссылкам и выходит дальше по странице.',
  ],
  motion: [
    { label: 'Открытие', value: 'opacity + scale .96 + 4 px от пункта, 150 мс ease-out; намерение 100 мс' },
    { label: 'Смена раздела', value: 'высота и ширина 200 мс ease-standard' },
    { label: 'Закрытие', value: 'opacity 100 мс' },
  ],
  examples: [
    { id: 'site', title: 'Шапка сайта', description: 'Две колонки разделов и карточка с новостью.' },
    { id: 'links', title: 'Простые ссылки', description: 'Пункты без панелей и текущий раздел.' },
  ],
};

export default meta;
