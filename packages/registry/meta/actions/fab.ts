import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'fab',
  status: 'stable',
  title: 'Плавающая кнопка',
  description: 'Главное действие экрана поверх контента на телефоне: круг 56, с подписью в начале списка, раскрывается в набор действий.',
  category: 'actions',
  paperBoard: '5HU-0',
  anatomy: ['Круг 56 или капсула с подписью', 'Иконка 24', 'Набор действий: подпись-капсула и круг 44', 'Подложка scrim'],
  related: ['button', 'menu', 'tab-bar'],
  source: { file: 'components/fab.tsx', exports: ['Fab', 'FabMenu'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'label', type: 'string', required: true, description: 'Название действия: видно в расширенной кнопке, в круге уходит в aria-label.' },
    { name: 'extended', type: 'boolean', default: false, description: 'Капсула с подписью. Сворачивайте при прокрутке вниз — ширина закрывается за 250 мс.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступна.' },
    { name: 'icon', type: 'node', required: true, description: 'Иконка 24 px со штрихом 1,5.', control: false },
  ],
  parts: [
    {
      name: 'FabMenu',
      description: 'Кнопка с набором действий: открывает меню над собой поверх подложки, плюс поворачивается в крестик.',
      props: [
        { name: 'label', type: 'string', required: true, description: 'Название главной кнопки, например «Создать».' },
        { name: 'icon', type: 'node', required: true, description: 'Иконка; при открытии поворачивается на 45°.' },
        { name: 'actions', type: 'object', signature: 'readonly { label: string; icon: ReactNode; onClick?: () => void }[]', required: true, description: 'Сверху вниз; последнее действие — ближе всех к кнопке.' },
      ],
    },
  ],
  slots: [
    { name: 'fab', description: 'Кнопка; несёт data-extended.' },
    { name: 'fab-menu', description: 'Столбец действий над кнопкой.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'accent, блики accent-control и падающая тень overlay.' },
    { id: 'pressed', label: 'нажатие', description: 'accent-pressed, тень прижимается, масштаб 0,97.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо 2 px ring с отступом 2 px.' },
    { id: 'expanded', label: 'с подписью', description: 'Капсула h56: отступы 16 и 20, подпись 16/20 600.', props: { extended: true } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: { columns: ['rest', 'pressed', 'focus', 'expanded'] },
  keyboard: [
    { keys: ['Enter', 'Space'], action: 'Нажимает кнопку или открывает набор действий' },
    { keys: ['↑', '↓'], action: 'Переходят между действиями' },
    { keys: ['Esc'], action: 'Закрывает набор и возвращает фокус на кнопку' },
  ],
  a11y: [
    'Название всегда в aria-label: подпись в свёрнутой кнопке исчезает, имя остаётся.',
    'Набор действий — меню (role="menu"): у кнопки aria-haspopup и aria-expanded, пункты подписаны текстом.',
    'Одна плавающая кнопка на экран. Поставьте её на 16 px от края и над home indicator, а списку дайте нижний отступ 88 px.',
    'На iOS вместо неё чаще уместно заметное действие в панели навигации.',
  ],
  motion: [
    { label: 'Нажатие', value: 'scale .97, тень прижимается, 75 мс · ease-out' },
    { label: 'Сворачивание по прокрутке', value: 'ширина 250 мс · ease-standard, подпись — прозрачность 100 мс' },
    { label: 'Набор действий', value: 'снизу вверх через 35 мс: сдвиг 8 px и прозрачность, 200 мс · ease-out; подложка 200 мс' },
    { label: 'Плюс → крестик', value: 'поворот 45°, spring-snappy; закрытие — затухание 150 мс' },
    { label: 'Сниженное движение', value: 'без сдвига и масштаба' },
  ],
  examples: [
    { id: 'extended', title: 'С подписью и сворачиванием', description: 'В начале списка — капсула, при прокрутке вниз сворачивается в круг.' },
    { id: 'speed-dial', title: 'Набор действий', description: 'Плюс открывает четыре действия поверх подложки.' },
  ],
};

export default meta;
