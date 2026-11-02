import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'notification-center',
  status: 'beta',
  title: 'Центр уведомлений',
  description:
    'Колокольчик со счётчиком непрочитанного и панель под ним: вкладки, уведомления по дням, цитата и положительные действия прямо в строке.',
  category: 'overlays',
  paperBoard: '1DQ9-0',
  anatomy: ['Колокольчик 36 со счётчиком', 'Шапка: заголовок и «Прочитать всё»', 'Вкладки', 'Группа по дню', 'Уведомление', 'Подвал «Все уведомления»'],
  related: ['popover', 'toast', 'badge'],
  source: { file: 'components/notification-center.tsx', exports: ['NotificationCenter', 'NotificationCenterLink'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['popover', 'badge', 'button'] },
  props: [
    { name: 'items', type: 'object', signature: 'readonly NotificationItem[]', required: true, control: false, description: 'Уведомления: группа дня, текст, цитата, время, аватар, флаги unread и mention, действия.' },
    { name: 'open', type: 'boolean', control: false, description: 'Управляемое открытие панели.' },
    { name: 'onOpenChange', type: 'function', signature: '(open: boolean) => void', description: 'Открытие и закрытие.' },
    { name: 'onMarkAllRead', type: 'function', signature: '() => void', description: 'Кнопка «Прочитать всё»; без обработчика кнопки нет.' },
    { name: 'onItemClick', type: 'function', signature: '(id: string) => void', description: 'Нажатие на текст уведомления.' },
    { name: 'footer', type: 'node', control: false, description: 'Подвал, обычно NotificationCenterLink на полный список.' },
  ],
  parts: [{ name: 'NotificationCenterLink', description: 'Ссылка «Все уведомления →» для подвала.', props: [] }],
  slots: [
    { name: 'notification-bell', description: 'Колокольчик-триггер.' },
    { name: 'notification-header', description: 'Шапка с вкладками.' },
    { name: 'notification-list', description: 'Прокручиваемый список.' },
    { name: 'notification', description: 'Строка; data-unread у непрочитанной.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Колокольчик со счётчиком danger, 99+ при переполнении.' },
    { id: 'open', label: 'открыто', description: 'Панель 400 × до 560 под колокольчиком, по правому краю.' },
    { id: 'empty', label: 'пусто', description: 'Во вкладке без уведомлений — «Всё прочитано» или «Упоминаний нет».' },
  ],
  keyboard: [
    { keys: ['Enter', 'Space'], action: 'На колокольчике: открывает панель' },
    { keys: ['Tab'], action: 'Шапка, вкладки, уведомления и их действия' },
    { keys: ['Esc'], action: 'Закрывает, фокус на колокольчик' },
  ],
  a11y: [
    'Колокольчик называет число: «Уведомления, 3 непрочитанных».',
    'Непрочитанное помечено точкой и скрытым текстом «не прочитано».',
    'В строке только положительные действия; архив и удаление — в полном списке.',
  ],
  motion: [
    { label: 'Панель', value: 'прозрачность и scale .96 → 1 · 150 мс · ease-out', tokens: ['duration-quick'] },
    { label: 'Новый счётчик', value: 'scale .6 → 1 · 200 мс · ease-out', tokens: ['duration-base'] },
  ],
  examples: [
    { id: 'topbar', title: 'В шапке', description: 'Упоминание, оплата, задача с «Принять» и срок.' },
    { id: 'read', title: 'Всё прочитано', description: 'Без счётчика и без «Прочитать всё».' },
  ],
};

export default meta;
