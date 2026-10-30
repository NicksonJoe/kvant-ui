import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'menu',
  status: 'stable',
  title: 'Меню',
  description: 'Список действий у кнопки: иконки, горячие клавиши, флажки, радиопункты и подменю.',
  category: 'overlays',
  paperBoard: '7O7-0',
  anatomy: ['Триггер', 'Панель r16 p4', 'Группа с подписью', 'Пункт: иконка, текст, клавиша', 'Разделитель', 'Подменю'],
  related: ['context-menu', 'select', 'command-palette', 'button-group'],
  source: {
    file: 'components/menu.tsx',
    exports: [
      'Menu',
      'MenuTrigger',
      'MenuContent',
      'MenuItem',
      'MenuCheckboxItem',
      'MenuRadioGroup',
      'MenuRadioItem',
      'MenuGroup',
      'MenuGroupLabel',
      'MenuSeparator',
      'MenuSub',
      'MenuSubTrigger',
      'MenuSubContent',
    ],
  },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: [] },
  propsOf: 'MenuContent',
  props: [
    { name: 'side', type: 'enum', options: ['top', 'bottom', 'left', 'right'], default: 'bottom', description: 'Сторона от триггера.' },
    { name: 'align', type: 'enum', options: ['start', 'center', 'end'], default: 'start', description: 'Выравнивание вдоль триггера.' },
  ],
  parts: [
    {
      name: 'MenuItem',
      description: 'Пункт-действие.',
      props: [
        { name: 'icon', type: 'node', description: 'Иконка 16 px.' },
        { name: 'shortcut', type: 'node', description: 'Клавиша справа, моноширинно.' },
        { name: 'destructive', type: 'boolean', default: false, description: 'Опасное действие: текст и подсветка danger.' },
        { name: 'disabled', type: 'boolean', default: false, description: 'Недоступен.' },
        { name: 'onClick', type: 'function', signature: '() => void', description: 'Действие; меню закроется само.' },
      ],
    },
    { name: 'MenuCheckboxItem', description: 'Пункт-флажок с галочкой справа.', props: [{ name: 'checked', type: 'boolean', description: 'Отмечен.' }] },
    { name: 'MenuRadioItem', description: 'Пункт радиогруппы MenuRadioGroup.', props: [{ name: 'value', type: 'string', required: true, description: 'Значение.' }] },
    { name: 'MenuSubTrigger', description: 'Пункт со стрелкой, открывает MenuSubContent сбоку.', props: [{ name: 'icon', type: 'node', description: 'Иконка.' }] },
  ],
  slots: [
    { name: 'menu-trigger', description: 'Триггер.' },
    { name: 'menu', description: 'Панель меню.' },
    { name: 'menu-item', description: 'Пункт.' },
  ],
  states: [
    { id: 'open', label: 'открыто', description: 'Панель у триггера; триггер держит нажатый фон.' },
    { id: 'highlighted', label: 'подсветка', description: 'Фон fill-2 мгновенно; у опасного — danger-soft.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, пропускается стрелками.' },
  ],
  keyboard: [
    { keys: ['Enter', 'Space', '↓'], action: 'Открывают с триггера' },
    { keys: ['↑', '↓'], action: 'Двигают подсветку' },
    { keys: ['→', '←'], action: 'Открывают и закрывают подменю' },
    { keys: ['Home', 'End'], action: 'Первый и последний пункт' },
    { keys: ['Esc'], action: 'Закрывает, фокус на триггер' },
  ],
  a11y: [
    'Роли menu, menuitem, menuitemcheckbox и menuitemradio; триггер с aria-haspopup и aria-expanded.',
    'Набор букв переходит к пункту с этим началом.',
    'Опасное действие отличается не только цветом — подписью «Удалить» и иконкой.',
  ],
  motion: [
    { label: 'Открытие', value: 'прозрачность и scale .96 + 4 px от триггера · 150 мс · ease-out' },
    { label: 'Закрытие', value: 'прозрачность · 100 мс' },
    { label: 'Подсветка', value: 'мгновенно (0 мс)' },
    { label: 'Подменю', value: 'намерение 100 мс перед открытием' },
  ],
  examples: [
    { id: 'actions', title: 'Действия со сделкой', description: 'Иконки, клавиши, подменю и опасное действие.' },
    { id: 'view', title: 'Вид и сортировка', description: 'Флажки и радиопункты с подписями групп.' },
  ],
};

export default meta;
