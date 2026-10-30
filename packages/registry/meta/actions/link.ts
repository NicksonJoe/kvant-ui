import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'link',
  status: 'stable',
  title: 'Ссылка',
  description: 'Переход в тексте или отдельной строкой. Без фона и отступов, кегль берёт у соседнего текста; внешняя ссылка — со стрелкой.',
  category: 'actions',
  paperBoard: '5HU-0',
  anatomy: ['Ссылка <a>', 'Текст', 'Стрелка внешней ссылки'],
  related: ['button', 'breadcrumb', 'navigation-menu'],
  source: { file: 'components/link.tsx', exports: ['Link'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: [] },
  props: [
    { name: 'children', type: 'string', signature: 'ReactNode', description: 'Текст ссылки: куда она ведёт, а не «здесь».' },
    { name: 'href', type: 'string', description: 'Адрес.' },
    { name: 'variant', type: 'enum', options: ['standalone', 'inline'], default: 'standalone', description: 'standalone — подчёркивание при наведении; inline — подчёркнута всегда, для ссылок в абзаце.' },
    { name: 'external', type: 'boolean', default: false, description: 'Открывает в новой вкладке: стрелка, rel="noopener noreferrer" и скрытое «откроется в новой вкладке».' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Ожидание, например таймер повторной отправки: текст fg-3 без href и вне порядка Tab.' },
    { name: 'render', type: 'node', signature: 'ReactElement', description: 'Ссылка роутера: render={<RouterLink to="/projects" />}.', control: false },
  ],
  slots: [{ name: 'link', description: 'Ссылка; aria-disabled в ожидании.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'accent-soft-fg 500, без подчёркивания (в абзаце — с ним).' },
    { id: 'hover', label: 'наведение', description: 'Подчёркивание 1 px с отступом 3 px.' },
    { id: 'pressed', label: 'нажатие', description: 'Цвет accent-pressed.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо 2 px ring капсулой вокруг текста.' },
    { id: 'disabled', label: 'ожидание', description: 'Текст fg-3, табличные цифры таймера, не нажимается.', props: { disabled: true } },
  ],
  matrix: { rowProp: 'variant' },
  keyboard: [{ keys: ['Enter'], action: 'Переходит по ссылке' }],
  a11y: [
    'Нативный <a href>: роль, фокус и переход с клавиатуры есть без лишнего кода.',
    'В абзаце ссылка подчёркнута всегда — цвет не единственный признак.',
    'Внешняя ссылка говорит, что откроется новая вкладка; стрелка скрыта от экранного диктора.',
    'Действие на месте (отправить, удалить) — кнопка, а не ссылка; если нужен вид ссылки, Button variant="link".',
  ],
  motion: [
    { label: 'Цвет', value: '75 мс · ease-hover' },
    { label: 'Подчёркивание', value: 'без анимации' },
  ],
  examples: [
    { id: 'in-text', title: 'В тексте', description: 'В абзаце подчёркнута всегда; повтор отправки ждёт таймер.' },
    { id: 'standalone', title: 'Отдельной строкой', description: 'Переходы и внешние ссылки рядом с заголовком или в подвале карточки.' },
  ],
};

export default meta;
