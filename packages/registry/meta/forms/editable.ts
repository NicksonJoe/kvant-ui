import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'editable',
  status: 'stable',
  title: 'Правка на месте',
  description: 'Текст лежит в невидимой капсуле с теми же отступами, что и поле, поэтому при переходе в правку ничего не сдвигается. Enter или уход из поля сохраняют, Esc возвращает как было.',
  category: 'forms',
  paperBoard: 'A8B-0',
  anatomy: ['Капсула h36 px12 с прозрачной рамкой', 'Текст', 'Карандаш 14 при наведении', 'Поле правки', 'Подсказки Enter и Esc', 'Строка «Сохранено»'],
  related: ['input', 'field'],
  source: { file: 'components/editable.tsx', exports: ['Editable'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['badge'] },
  props: [
    { name: 'defaultValue', type: 'string', description: 'Начальный текст.' },
    { name: 'aria-label', type: 'string', required: true, description: 'Что правим: «Название проекта».' },
    { name: 'placeholder', type: 'string', default: 'Без названия', description: 'Виден fg-3, пока текст пуст.' },
    { name: 'savedMessage', type: 'string', signature: 'ReactNode', description: 'Строка на две секунды после сохранения.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Только просмотр.' },
    { name: 'value', type: 'string', description: 'Управляемый текст.', control: false },
    { name: 'onValueCommit', type: 'function', signature: '(value: string) => void', description: 'Сохранение: обрезанный текст. Пустой и неизменённый не сохраняются.', control: false },
  ],
  slots: [{ name: 'editable', description: 'Колонка: текст или поле и строка статуса.' }],
  states: [
    { id: 'rest', label: 'просмотр', description: 'Текст в прозрачной капсуле.' },
    { id: 'hover', label: 'наведение', description: 'Фон fill-1 и карандаш 14 fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring и карандаш.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {},
  keyboard: [
    { keys: ['Enter', 'Space'], action: 'На тексте — переходят в правку, текст выделен' },
    { keys: ['Enter'], action: 'В поле — сохраняет' },
    { keys: ['Esc'], action: 'Отменяет правку' },
  ],
  a11y: [
    'Текст — кнопка «Название проекта: Ребрендинг…»; поле правки подписано так же.',
    'После Enter и Esc фокус возвращается на текст — место не теряется.',
    'На касании карандаш виден всегда: двойного нажатия на телефоне нет.',
    '«Сохранено» объявляется вежливо (role="status").',
  ],
  motion: [
    { label: 'Наведение', value: 'фон 75 мс · ease-hover' },
    { label: 'Вход в правку', value: 'рамка без сдвига текста' },
    { label: '«Сохранено»', value: 'прозрачность 150 мс, исчезает через 2000 мс' },
  ],
  examples: [
    { id: 'title', title: 'Название проекта', description: 'Заголовок карточки: шрифт берётся у окружения.' },
    { id: 'details', title: 'Поля карточки', description: 'Короткие значения в списке свойств правятся там же, где читаются.' },
  ],
};

export default meta;
