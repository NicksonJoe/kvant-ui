import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'dialog',
  status: 'stable',
  title: 'Диалог',
  description: 'Модальное окно для короткой задачи: форма, просмотр, настройка. Фокус внутри, Esc закрывает.',
  category: 'overlays',
  paperBoard: 'DHN-0',
  anatomy: ['Подложка scrim', 'Панель r28', 'Заголовок', 'Описание', 'Содержимое', 'Подвал с действиями', 'Крестик'],
  related: ['alert-dialog', 'sheet', 'popover'],
  source: {
    file: 'components/dialog.tsx',
    exports: ['Dialog', 'DialogTrigger', 'DialogContent', 'DialogTitle', 'DialogDescription', 'DialogFooter', 'DialogClose'],
  },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['button'] },
  propsOf: 'DialogContent',
  props: [
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'sm', description: 'Ширина 400 / 560 / 720 px.' },
    { name: 'showClose', type: 'boolean', default: true, description: 'Крестик в правом верхнем углу.' },
  ],
  parts: [
    {
      name: 'Dialog',
      description: 'Корень: хранит открытие.',
      props: [
        { name: 'open', type: 'boolean', description: 'Управляемое открытие.' },
        { name: 'onOpenChange', type: 'function', signature: '(open: boolean) => void', description: 'Открытие и закрытие.' },
        { name: 'modal', type: 'boolean', default: true, description: 'Блокирует страницу под диалогом.' },
      ],
    },
    { name: 'DialogTrigger', description: 'Кнопка, которая открывает диалог; обычно render={<Button />}.', props: [] },
    { name: 'DialogFooter', description: 'Действия справа: второстепенное, затем основное.', props: [] },
  ],
  slots: [
    { name: 'dialog', description: 'Панель диалога.' },
    { name: 'dialog-footer', description: 'Подвал с действиями.' },
  ],
  states: [{ id: 'open', label: 'открыто', description: 'Подложка scrim, панель по центру; после закрытия фокус возвращается на триггер.' }],
  keyboard: [
    { keys: ['Esc'], action: 'Закрывает' },
    { keys: ['Tab', 'Shift+Tab'], action: 'Ходят по кругу внутри диалога' },
  ],
  a11y: [
    'role="dialog" и aria-modal; заголовок и описание связаны с панелью.',
    'Фокус переходит внутрь при открытии и возвращается на триггер при закрытии.',
    'Подложка и Esc закрывают диалог — для решений без возврата берите Подтверждение.',
  ],
  motion: [
    { label: 'Подложка', value: 'прозрачность · 200 мс · ease-out' },
    { label: 'Панель', value: 'прозрачность, scale .96 и сдвиг 8 px · 200 мс · ease-out' },
    { label: 'Закрытие', value: '150 мс' },
  ],
  examples: [
    { id: 'form', title: 'Новая задача', description: 'Короткая форма с основным и второстепенным действием.' },
    { id: 'wide', title: 'Широкий', description: 'size="lg" для просмотра документа.' },
  ],
};

export default meta;
