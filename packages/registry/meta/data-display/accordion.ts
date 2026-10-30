import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'accordion',
  status: 'stable',
  title: 'Аккордеон',
  description:
    'Прячет и показывает разделы. Обычный — на фоне страницы, пункты разделены линиями; вставной — каждый пункт отдельной карточкой. Сворачиваемый блок — одна редкая секция внутри карточки.',
  category: 'data-display',
  paperBoard: 'G16-0',
  anatomy: ['Группа', 'Заголовок-кнопка h52, 15/20 500', 'Круг иконки 36 (вставной)', 'Шеврон 16', 'Текст 14/22 fg-2 до 72 знаков'],
  related: ['tabs', 'card', 'list'],
  source: { file: 'components/accordion.tsx', exports: ['Accordion', 'AccordionItem', 'Collapsible'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['button'] },
  props: [
    { name: 'variant', type: 'enum', options: ['plain', 'inset'], default: 'plain', description: 'plain — пункты на фоне страницы под линиями; inset — каждый пункт карточкой r16, зазор 8.' },
    { name: 'multiple', type: 'boolean', default: false, description: 'Несколько пунктов могут быть открыты одновременно.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Весь аккордеон недоступен.' },
    { name: 'defaultValue', type: 'object', signature: 'string[]', description: 'Открытые пункты по умолчанию; по умолчанию открыт один.', control: false },
    { name: 'value', type: 'object', signature: 'string[]', description: 'Управляемые открытые пункты.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: string[]) => void', description: 'Новые открытые пункты.', control: false },
  ],
  parts: [
    {
      name: 'AccordionItem',
      description: 'Пункт: заголовок-кнопка и панель.',
      props: [
        { name: 'value', type: 'string', description: 'Значение пункта для value / defaultValue.' },
        { name: 'title', type: 'node', required: true, description: 'Заголовок; сюда же можно поставить бейдж «в декабре».' },
        { name: 'icon', type: 'node', description: 'Вставной вариант: иконка 18 в круге 36 (открыт — accent-soft).' },
        { name: 'disabled', type: 'boolean', description: 'Пункт недоступен.' },
      ],
    },
    {
      name: 'Collapsible',
      description: 'Одна секция в карточке r20: заголовок 16/24 600, подсказка о содержимом и кнопка «Показать / Скрыть».',
      props: [
        { name: 'title', type: 'node', required: true, description: 'Заголовок карточки.' },
        { name: 'summary', type: 'node', description: 'Подсказка в свёрнутом виде, чтобы не раскрывать блок ради одной строки.' },
        { name: 'openSummary', type: 'node', description: 'Подсказка в раскрытом виде.' },
        { name: 'defaultOpen', type: 'boolean', description: 'Раскрыт по умолчанию.' },
      ],
    },
  ],
  slots: [
    { name: 'accordion', description: 'Корень; несёт data-variant.' },
    { name: 'accordion-item', description: 'Пункт; data-open у открытого.' },
    { name: 'accordion-trigger', description: 'Заголовок-кнопка (aria-expanded).' },
    { name: 'accordion-panel', description: 'Панель содержимого.' },
    { name: 'collapsible', description: 'Сворачиваемый блок.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Шеврон fg-3.' },
    { id: 'hover', label: 'наведение', description: 'Фон fill-1 r12, шеврон fg-1.' },
    { id: 'pressed', label: 'нажатие', description: 'Фон fill-2, без масштаба.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring, отступ 2.' },
    { id: 'expanded', label: 'открыто', description: 'Шеврон повёрнут на 180°, fg-2.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Переходит между заголовками' },
    { keys: ['Enter', 'Space'], action: 'Открывает и закрывает пункт' },
  ],
  a11y: [
    'Заголовок — кнопка внутри h3 с aria-expanded и aria-controls.',
    'Закрытая панель убрана из дерева доступности; поиск по странице её не находит.',
    'Сворачиваемый блок открывается только кнопкой, чтобы шапка карточки не превращалась в одну большую кнопку.',
  ],
  motion: [
    { label: 'Высота', value: '0 → auto, 200 мс ease-standard; закрытие 150 мс' },
    { label: 'Шеврон', value: 'поворот 180°, 200 мс ease-standard' },
    { label: 'Текст', value: 'opacity 150 мс с задержкой 50 мс' },
  ],
  examples: [
    { id: 'faq', title: 'Вопросы о тарифах', description: 'Обычный: открыт один пункт.' },
    { id: 'inset', title: 'Настройки и справка', description: 'Вставной: иконки в кругах и недоступный пункт с бейджем.' },
    { id: 'collapsible', title: 'Реквизиты для счёта', description: 'Сворачиваемый блок внутри карточки.' },
  ],
};

export default meta;
