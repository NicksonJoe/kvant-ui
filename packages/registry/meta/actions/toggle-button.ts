import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'toggle-button',
  status: 'stable',
  title: 'Кнопка-переключатель',
  description: 'Кнопка с двумя состояниями: избранное, закрепить, подписаться. Подпись не меняется — состояние видно по мягкой заливке и закрашенной иконке.',
  category: 'actions',
  paperBoard: 'CM8-0',
  anatomy: ['Кнопка с aria-pressed', 'Иконка: контур или заливка', 'Подпись'],
  related: ['button', 'toggle-group', 'switch', 'tag'],
  source: { file: 'components/toggle.tsx', exports: ['ToggleButton'] },
  dependencies: { npm: ['@base-ui/react'], registry: ['button'] },
  props: [
    { name: 'children', type: 'string', signature: 'ReactNode', description: 'Подпись. Не меняйте её при переключении — состояние передаёт aria-pressed.' },
    { name: 'defaultPressed', type: 'boolean', default: false, description: 'Начальное состояние.' },
    { name: 'size', type: 'enum', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md', description: 'Высота, как у Button: 24 / 32 / 36 / 44 / 52 px.' },
    { name: 'iconOnly', type: 'boolean', default: false, description: 'Круг только с иконкой, без фона в выключенном состоянии. Нужен aria-label.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступна: прозрачность 50 %.' },
    { name: 'icon', type: 'node', description: 'Иконка перед подписью; во включённом состоянии заливается цветом текста.', control: false },
    { name: 'pressed', type: 'boolean', description: 'Управляемое состояние.', control: false },
    { name: 'onPressedChange', type: 'function', signature: '(pressed: boolean) => void', description: 'Новое состояние.', control: false },
  ],
  slots: [{ name: 'toggle-button', description: 'Кнопка; несёт data-pressed и data-size.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Выключена — как secondary, иконка контуром fg-2; у кнопки-иконки фона нет.' },
    { id: 'hover', label: 'наведение', description: 'Фон на шаг темнее: surface-2, fill-1 или accent-soft-hover.' },
    { id: 'pressed', label: 'нажатие', description: 'Масштаб 0,97; у включённой — вдавленная тень.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо 2 px цвета ring с отступом 2 px.' },
    { id: 'checked', label: 'включена', description: 'Фон accent-soft, текст и залитая иконка accent-soft-fg.', props: { defaultPressed: true } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {
    rows: [
      { label: 'выключена', props: {} },
      { label: 'включена', props: { defaultPressed: true } },
      { label: 'иконка · выкл.', props: { iconOnly: true } },
      { label: 'иконка · вкл.', props: { iconOnly: true, defaultPressed: true } },
    ],
    columns: ['rest', 'hover', 'pressed', 'focus', 'disabled'],
  },
  keyboard: [{ keys: ['Space', 'Enter'], action: 'Переключает' }],
  a11y: [
    'Нативная кнопка с aria-pressed: экранный диктор читает «нажата» или «не нажата».',
    'Подпись постоянна. Если хочется писать «Подписаться» и «Отписаться», это обычная кнопка, а не переключатель.',
    'У кнопки-иконки обязателен aria-label; продублируйте его подсказкой (Tooltip).',
    'Для настроек, которые применяются сразу, берите Switch.',
  ],
  motion: [
    { label: 'Наведение', value: 'фон 75 мс · ease-hover' },
    { label: 'Включение', value: 'фон и заливка иконки, 150 мс · ease-out' },
    { label: 'Нажатие', value: 'scale .97 · 75 мс · ease-out, отпускание spring-micro' },
    { label: 'Сниженное движение', value: 'без масштаба, цвет остаётся' },
  ],
  examples: [
    { id: 'favorite', title: 'С подписью', description: 'Избранное и закреплённое: подпись не меняется, меняется заливка.' },
    { id: 'icons', title: 'Кнопки-иконки', description: 'Без подписи — с aria-label и подсказкой.' },
  ],
};

export default meta;
