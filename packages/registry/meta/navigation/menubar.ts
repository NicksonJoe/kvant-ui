import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'menubar',
  status: 'stable',
  title: 'Строка меню',
  description: 'Меню настольного приложения для редакторов. Когда одно меню открыто, наведение на соседний пункт сразу переключает меню; стрелки ← → делают то же с клавиатуры.',
  category: 'navigation',
  paperBoard: '7O7-0',
  anatomy: ['Строка', 'Триггеры-капсулы h32', 'Меню от левого края триггера', 'Пункты без иконок с клавишами', 'Подменю'],
  related: ['menu', 'context-menu', 'toolbar'],
  source: { file: 'components/menu.tsx', exports: ['Menubar', 'MenubarTrigger'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: [] },
  props: [
    { name: 'modal', type: 'boolean', default: true, description: 'Пока меню открыто, страница под ним не нажимается.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Вся строка недоступна.' },
    { name: 'loopFocus', type: 'boolean', default: true, description: 'Стрелки с последнего триггера переходят на первый.' },
  ],
  parts: [
    { name: 'MenubarTrigger', description: 'Триггер меню в строке: капсула h32, 13/16 500, открытый — fill-2. Ставится внутрь Menu.', props: [] },
  ],
  slots: [
    { name: 'menubar', description: 'Строка (role="menubar").' },
    { name: 'menubar-trigger', description: 'Триггер; data-popup-open, пока его меню открыто.' },
  ],
  states: [
    { id: 'open', label: 'открыто', description: 'Триггер на fill-2, меню на 4 px ниже от его левого края.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, стрелки пропускают.' },
  ],
  keyboard: [
    { keys: ['F10'], action: 'Переводит фокус в строку меню' },
    { keys: ['←', '→'], action: 'Между меню; открытое меню переключается' },
    { keys: ['↓', 'Enter', 'Space'], action: 'Открывают меню' },
    { keys: ['↑', '↓'], action: 'Пункты в меню' },
    { keys: ['Esc'], action: 'Закрывает меню, фокус на триггер' },
  ],
  a11y: [
    'Роли menubar, menu и menuitem; в строку попадают Tab-ом один раз, дальше — стрелками.',
    'Набор букв переходит к пункту с этим началом.',
    'На телефоне строку меню заменяют панель инструментов и шиты действий.',
  ],
  motion: [
    { label: 'Первое меню', value: 'прозрачность и scale .96 + 4 px · 150 мс · ease-out' },
    { label: 'Переключение между меню', value: '0 мс' },
    { label: 'Закрытие', value: 'прозрачность · 100 мс' },
  ],
  examples: [
    { id: 'editor', title: 'Редактор документа', description: 'Файл, Правка, Вид и Окно с клавишами и подменю.' },
    { id: 'view', title: 'Флажки и масштаб', description: 'Пункты-флажки, радиогруппа и отключённое меню.' },
  ],
};

export default meta;
