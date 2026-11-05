import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'segmented-control',
  status: 'stable',
  title: 'Сегменты',
  description: 'Один из двух–пяти связанных вариантов или видов; бегунок скользит к выбранному.',
  category: 'selection',
  paperBoard: 'CM8-0',
  anatomy: ['Дорожка-капсула', 'Бегунок', 'Сегмент', 'Подпись или иконка'],
  related: ['tabs', 'radio-group', 'toggle-group'],
  source: { file: 'components/segmented-control.tsx', exports: ['SegmentedControl'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'sm', description: 'Дорожка 32 px для указателя, 36 px или 44 px — капсула телефона во всю ширину, текст 15 и иконки 18.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Отключает все сегменты.' },
    { name: 'options', type: 'object', required: true, signature: 'readonly { value: V; label: ReactNode; disabled?: boolean }[]', description: 'Варианты.', control: false },
    { name: 'value', type: 'string', signature: 'V', description: 'Управляемый выбор.', control: false },
    { name: 'defaultValue', type: 'string', signature: 'V', description: 'Выбор по умолчанию; без него — первый вариант.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: V) => void', description: 'Новый выбор.', control: false },
    { name: 'aria-label', type: 'string', description: 'Название группы.', control: false },
  ],
  slots: [
    { name: 'segmented-control', description: 'Дорожка (role="radiogroup").' },
    { name: 'segment', description: 'Сегмент (role="radio").' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Дорожка surface-2, бегунок thumb с тенью сегмента.' },
    { id: 'hover', label: 'наведение', description: 'Текст невыбранного сегмента fg-1.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо внутри сегмента.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {},
  keyboard: [
    { keys: ['←', '→'], action: 'Выбирают соседний сегмент' },
    { keys: ['Tab'], action: 'Одна остановка на всю группу' },
  ],
  a11y: [
    'Это радиогруппа: стрелки сразу меняют выбор, экранный диктор читает «1 из 3».',
    'Для смены панелей с содержимым используйте вкладки (Tabs), а не сегменты.',
  ],
  motion: [
    { label: 'Бегунок', value: 'spring-snappy: 300 мс, отскок 0,1' },
    { label: 'Сниженное движение', value: '250 мс · ease-out без отскока' },
    { label: 'Первая отрисовка', value: 'бегунок встаёт на место без анимации' },
  ],
  examples: [
    { id: 'period', title: 'Период отчёта', description: 'Короткие подписи одной длины.' },
    { id: 'view', title: 'Вид списка', description: 'Иконки с подписями; размер md.' },
    { id: 'phone', title: 'На телефоне', description: 'Капсула 44 во всю ширину для вида и 36 для периода.' },
  ],
};

export default meta;
