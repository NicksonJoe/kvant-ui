import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'switch',
  status: 'stable',
  title: 'Переключатель',
  description:
    'Включает настройку сразу, без кнопки «Сохранить». При нажатии бегунок растягивается на 4 px в сторону хода — контрол отвечает раньше, чем меняет положение. Для выбора в форме — флажок.',
  category: 'selection',
  paperBoard: '1J0-0',
  anatomy: ['Подпись-обёртка', 'Текст и описание', 'Дорожка', 'Бегунок', 'Спиннер в бегунке'],
  related: ['checkbox', 'toggle-button', 'segmented-control'],
  source: { file: 'components/checkbox.tsx', exports: ['Switch'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['spinner'] },
  props: [
    { name: 'children', type: 'string', signature: 'ReactNode', description: 'Подпись слева; переключатель прижат вправо.' },
    { name: 'description', type: 'string', signature: 'ReactNode', description: 'Вторая строка 13/18 fg-3, например «Сохраняем…» во время загрузки.' },
    { name: 'defaultChecked', type: 'boolean', default: false, description: 'Начальное состояние.' },
    { name: 'size', type: 'enum', options: ['md', 'lg'], default: 'md', description: '36 × 20 для указателя, 52 × 32 для касания.' },
    { name: 'loading', type: 'boolean', default: false, description: 'Ждём ответа сервера: спиннер в бегунке, нажатия игнорируются.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступен.' },
    { name: 'checked', type: 'boolean', description: 'Управляемое состояние.', control: false },
    { name: 'onCheckedChange', type: 'function', signature: '(checked: boolean) => void', description: 'Новое состояние — применяйте сразу.', control: false },
  ],
  slots: [{ name: 'switch', description: 'Дорожка (role="switch"); несёт data-size.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Выключен: дорожка surface-2 с кольцом input, бегунок слева.' },
    { id: 'hover', label: 'наведение', description: 'Кольцо fg-3; включённый — фон accent-hover · 75 мс.' },
    { id: 'pressed', label: 'нажатие', description: 'Бегунок шире на 4 px в сторону хода; включённый — accent-pressed.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring 2 px с отступом 2 вокруг дорожки.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
    { id: 'loading', label: 'загрузка', description: 'Спиннер 12 (lg — 16) в бегунке, aria-busy; положение — после ответа.', props: { loading: true } },
  ],
  matrix: {
    rows: [
      { label: 'md · выключен', props: {} },
      { label: 'md · включён', props: { defaultChecked: true } },
      { label: 'lg · выключен', props: { size: 'lg' } },
      { label: 'lg · включён', props: { size: 'lg', defaultChecked: true } },
    ],
  },
  keyboard: [{ keys: ['Space'], action: 'Переключает' }],
  a11y: [
    'Роль switch и aria-checked; подпись связана с переключателем, описание — через aria-describedby.',
    'Изменение применяется сразу — не ставьте рядом кнопку «Сохранить».',
    'Во время загрузки aria-busy="true", повторные нажатия игнорируются; ошибку покажите текстом под строкой.',
  ],
  motion: [
    { label: 'Бегунок', value: 'spring-snappy: 300 мс, отскок 0,1' },
    { label: 'Дорожка', value: 'цвет 150 мс · ease-hover' },
    { label: 'Нажатие', value: 'бегунок шире на 4 px за 100 мс · ease-out' },
    { label: 'Спиннер', value: '800 мс на оборот · linear' },
  ],
  examples: [
    { id: 'settings', title: 'В карточке настроек', description: 'Подпись с описанием, строка в загрузке и недоступная строка.' },
    { id: 'large', title: 'Для касания', description: 'Размер lg — 52 × 32, как в iOS.' },
  ],
};

export default meta;
