import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'breadcrumb',
  status: 'stable',
  title: 'Хлебные крошки',
  description: 'Путь от корня до текущей страницы. Больше четырёх уровней — средние сворачиваются в «…» с меню. На телефоне остаётся один шаг назад.',
  category: 'navigation',
  paperBoard: '9XO-0',
  anatomy: ['Навигация «Путь»', 'Звено h24 px4, 13/16 fg-3', 'Разделитель chevron-right 12 fg-4', 'Кнопка «…» 28 × 24 с меню', 'Текущая страница fg-1 500', 'Телефон: chevron-left и родитель'],
  related: ['topbar', 'menu', 'tabs'],
  source: { file: 'components/breadcrumb.tsx', exports: ['Breadcrumb'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['menu'] },
  props: [
    {
      name: 'items',
      type: 'object',
      required: true,
      signature: 'readonly { label: string; href?: string; icon?: ReactNode; render?: ReactElement }[]',
      description: 'Путь от корня; последний пункт — текущая страница. Для роутера — render={<Link to="…" />}.',
      control: false,
    },
    { name: 'max', type: 'number', options: [3, 4, 5], default: 4, description: 'Сколько мест видно: корень, «…» и последние max − 2 пункта.' },
  ],
  slots: [{ name: 'breadcrumb', description: 'Навигация (nav aria-label «Путь»).' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Звено fg-3.' },
    { id: 'hover', label: 'наведение', description: 'fg-1 и подчёркивание.' },
    { id: 'pressed', label: 'нажатие', description: 'Фон fill-2.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring, отступ 2.' },
    { id: 'selected', label: 'текущая', description: 'fg-1 500, не ссылка, aria-current="page".' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Идёт по звеньям и кнопке «…»' },
    { keys: ['Enter'], action: 'Открывает звено или меню скрытых разделов' },
    { keys: ['↑', '↓'], action: 'В меню: соседний раздел' },
  ],
  a11y: [
    'Навигация с названием «Путь», звенья — упорядоченный список.',
    'Текущая страница — текст с aria-current="page", не ссылка.',
    'На телефоне — одна ссылка «Назад: родитель» с зоной касания 44.',
  ],
  motion: [
    { label: 'Звено', value: 'цвет и подчёркивание 75 мс ease-hover' },
    { label: 'Меню «…»', value: 'opacity + scale .96 + 4 px от кнопки, 150 мс ease-out; закрытие opacity 100 мс' },
  ],
  examples: [
    { id: 'collapsed', title: 'Свёрнутые уровни', description: 'Пять уровней: середина уходит в меню «…».' },
    { id: 'topbar', title: 'В верхней строке', description: 'Путь вместо заголовка в шапке админки.' },
  ],
};

export default meta;
