import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'sheet',
  status: 'stable',
  title: 'Шит',
  description:
    'Панель с края экрана, страница за ней остаётся видна. На компьютере — плавающая боковая для длинной формы, на телефоне — нижняя с двумя высотами и жестом.',
  category: 'overlays',
  paperBoard: 'GNR-0',
  anatomy: ['Подложка', 'Панель: сбоку с отступом 8 px или снизу с верхом r36', 'Хват 36×5 (нижний)', 'Шапка с крестиком', 'Прокручиваемое тело', 'Липкий подвал'],
  related: ['dialog', 'popover', 'floating-panel'],
  source: {
    file: 'components/sheet.tsx',
    exports: [
      'Sheet',
      'SheetTrigger',
      'SheetContent',
      'SheetHeader',
      'SheetBody',
      'SheetFooter',
      'SheetClose',
      'SHEET_DETENTS',
      'sheetReleaseTarget',
      'sheetReleaseVelocity',
    ],
  },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['button'] },
  propsOf: 'SheetContent',
  props: [
    { name: 'side', type: 'enum', options: ['right', 'left', 'bottom'], default: 'right', description: 'Боковой шит или нижний для телефона.' },
    { name: 'size', type: 'enum', options: ['md', 'lg'], default: 'md', description: 'Ширина бокового шита: 440 или 560 px.' },
    {
      name: 'defaultDetent',
      type: 'enum',
      options: ['medium', 'large'],
      default: 'medium',
      description: 'Нижний шит: высота при открытии — ≈ 50 % или ≈ 92 % экрана.',
    },
    {
      name: 'detents',
      type: 'object',
      signature: "readonly ('medium' | 'large')[]",
      description: 'Нижний шит: высоты, между которыми он переключается; одна — без переключения.',
      control: false,
    },
  ],
  parts: [
    {
      name: 'Sheet',
      description: 'Корень: хранит открытие.',
      props: [
        { name: 'open', type: 'boolean', description: 'Управляемое открытие.' },
        { name: 'onOpenChange', type: 'function', signature: '(open: boolean) => void', description: 'Открытие и закрытие, в том числе жестом.' },
      ],
    },
    {
      name: 'SheetHeader',
      description: 'Заголовок, описание и крестик; у нижнего шита за шапку тянут всю панель.',
      props: [
        { name: 'title', type: 'node', required: true, description: 'Заголовок.' },
        { name: 'description', type: 'node', description: 'Подзаголовок.' },
        { name: 'leading', type: 'node', description: 'Нижний шит: действие слева («Сбросить», «Назад»), заголовок встаёт по центру.' },
      ],
    },
    { name: 'SheetBody', description: 'Прокручиваемое тело с шагом 20 px; у нижнего шита сначала листается список, потом едет панель.', props: [] },
    { name: 'SheetFooter', description: 'Липкий подвал. Сбоку — действия справа, снизу — на всю ширину над home indicator.', props: [] },
  ],
  slots: [
    { name: 'sheet', description: 'Панель; несёт data-side, у нижней — data-detent и data-dragging во время жеста.' },
    { name: 'sheet-grabber', description: 'Хват нижнего шита: кнопка, меняет высоту.' },
    { name: 'sheet-header', description: 'Шапка.' },
    { name: 'sheet-body', description: 'Тело.' },
    { name: 'sheet-footer', description: 'Подвал.' },
  ],
  states: [
    { id: 'open', label: 'открыто', description: 'Панель у края, подложка scrim; фокус внутри.' },
    { id: 'expanded', label: 'большая высота', description: 'Нижний шит на ≈ 92 % экрана (data-detent="large").' },
  ],
  keyboard: [
    { keys: ['Esc'], action: 'Закрывает' },
    { keys: ['Tab', 'Shift+Tab'], action: 'Ходят внутри панели' },
    { keys: ['Enter', 'Space'], action: 'На хвате — меняют высоту нижнего шита' },
  ],
  a11y: [
    'Шит — модальный диалог: фокус внутри, после закрытия возвращается на триггер.',
    'Заголовок из шапки называет диалог для экранного диктора.',
    'Хват — кнопка «Развернуть шит» / «Свернуть шит»: высоту меняют и без жеста.',
    'Жест не начинается с полей, кнопок и ссылок; прокрученный список сначала листается.',
  ],
  motion: [
    { label: 'Боковой', value: 'выезд от края · 300 мс · ease-fluid, закрытие 250 мс' },
    { label: 'Нижний: появление и смена высоты', value: 'spring gentle 500 мс' },
    { label: 'Перетаскивание', value: 'за пальцем 1:1, выше большой высоты — сопротивление × 0,3' },
    { label: 'Отпускание', value: 'закрывает сдвиг ниже нижней высоты больше 30 % или смах ≥ 0,4 px/мс (скорость за 100 мс)' },
    { label: 'Закрытие жестом', value: '250 мс · ease-fluid с того места, где отпустили; подложка гаснет вместе со сдвигом' },
    { label: 'Сниженное движение', value: 'пружины становятся ease-out' },
  ],
  examples: [
    { id: 'client', title: 'Карточка клиента', description: 'Длинная форма справа с липким подвалом.' },
    { id: 'filters', title: 'Фильтры слева', description: 'side="left" для фильтров списка.' },
    { id: 'phone-filters', title: 'Фильтры на телефоне', description: 'Нижний шит на средней высоте, «Сбросить» слева от заголовка.' },
    { id: 'phone-deal', title: 'Сделка на телефоне', description: 'Большая высота, прокрутка списка и действия на всю ширину.' },
  ],
};

export default meta;
