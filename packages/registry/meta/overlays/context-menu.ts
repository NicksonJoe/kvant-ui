import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'context-menu',
  status: 'stable',
  title: 'Контекстное меню',
  description: 'Действия с объектом по правому клику, долгому нажатию или Shift+F10. Тот же попап и пункты, что у меню, но от точки курсора.',
  category: 'overlays',
  paperBoard: '7O7-0',
  anatomy: ['Область-цель с кольцом', 'Попап r16 p4 от точки курсора', 'Пункты меню', 'Разделители', 'Подменю'],
  related: ['menu', 'menubar', 'command-palette'],
  source: { file: 'components/menu.tsx', exports: ['ContextMenu', 'ContextMenuTrigger', 'ContextMenuContent'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: [] },
  props: [
    { name: 'open', type: 'boolean', description: 'Управляемое открытие.', control: false },
    { name: 'onOpenChange', type: 'function', signature: '(open: boolean) => void', description: 'Открытие и закрытие.' },
  ],
  parts: [
    {
      name: 'ContextMenuTrigger',
      description: 'Область, которая открывает меню; пока меню открыто, на ней кольцо 2 px ring. Сделайте её фокусируемой (tabIndex={0}).',
      props: [{ name: 'render', type: 'node', signature: 'ReactElement', description: 'Отрисовать карточку или строку как область.' }],
    },
    { name: 'ContextMenuContent', description: 'Попап у точки курсора; внутри MenuItem, MenuSeparator, MenuSub — как в меню.', props: [] },
  ],
  slots: [
    { name: 'context-menu-trigger', description: 'Область-цель; data-popup-open, пока меню открыто.' },
    { name: 'context-menu', description: 'Попап меню.' },
  ],
  states: [
    { id: 'open', label: 'открыто', description: 'Угол попапа в точке курсора, у края экрана отражается влево или вверх.' },
    { id: 'highlighted', label: 'подсветка', description: 'Как у пунктов меню: fill-2 мгновенно.' },
  ],
  keyboard: [
    { keys: ['Shift+F10', 'Menu'], action: 'Открывают меню на области в фокусе' },
    { keys: ['↑', '↓'], action: 'Двигают подсветку' },
    { keys: ['→', '←'], action: 'Открывают и закрывают подменю' },
    { keys: ['Enter'], action: 'Выполняет пункт' },
    { keys: ['Esc'], action: 'Закрывает' },
  ],
  a11y: [
    'Каждое действие из контекстного меню должно быть доступно и в другом месте: о правом клике знают не все.',
    'Роли menu и menuitem, как у обычного меню; набор букв переходит к пункту.',
    'Долгое нажатие на касании открывает то же меню.',
  ],
  motion: [
    { label: 'Открытие', value: 'прозрачность и scale .96 от точки клика · 150 мс · ease-out, без сдвига' },
    { label: 'Закрытие', value: 'прозрачность · 100 мс' },
    { label: 'Кольцо цели', value: 'появляется вместе с меню' },
  ],
  examples: [
    { id: 'kanban', title: 'Карточки сделок', description: 'Подменю, клавиши и опасное действие последним.' },
    { id: 'files', title: 'Файлы', description: 'Строки списка как области меню.' },
  ],
};

export default meta;
