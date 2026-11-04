import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'action-sheet',
  status: 'beta',
  title: 'Лист действий',
  description:
    'Нижний лист на телефоне со списком действий об одном объекте и отдельной плашкой «Отмена». Отрицательные действия — во втором уровне «Ещё» того же листа и через подтверждение. Закрывается свайпом вниз.',
  category: 'overlays',
  paperBoard: '1DQN-0',
  anatomy: [
    'Затемнение scrim',
    'Лист overlay r28, 8 от краёв',
    'Шапка: заголовок 15/600 и строка 13 fg-3',
    'Группа действий',
    'Действие 52: иконка 24, подпись 17/500, значение и шеврон',
    'Полоса 8 fill-1 между группами',
    'Второй уровень: «Назад» 44, заголовок и объект',
    'Плашка «Отмена» 56 r28',
  ],
  related: ['sheet', 'menu', 'swipe-actions', 'popconfirm'],
  source: {
    file: 'components/action-sheet.tsx',
    exports: ['ActionSheet', 'ActionSheetTrigger', 'ActionSheetContent', 'ActionSheetGroup', 'ActionSheetItem', 'ActionSheetSub'],
  },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['sheet'] },
  propsOf: 'ActionSheetContent',
  props: [
    { name: 'title', type: 'string', required: true, description: 'О чём действия: «Айдентика для пекарни»; диктор читает «Действия: …», на нём фокус при открытии.' },
    { name: 'description', type: 'node', description: 'Строка под заголовком: клиент, сумма, этап.' },
    { name: 'cancelLabel', type: 'string', default: 'Отмена', description: 'Текст плашки отмены.' },
  ],
  parts: [
    {
      name: 'ActionSheet',
      description: 'Корень: открытие, закрытие и Esc. Пока открыт второй уровень, Esc возвращает на первый.',
      props: [
        { name: 'open', type: 'boolean', control: false, description: 'Управляемое открытие.' },
        { name: 'onOpenChange', type: 'function', signature: '(open: boolean, details) => void', control: false, description: 'Открытие и закрытие, в том числе свайпом вниз.' },
      ],
    },
    { name: 'ActionSheetTrigger', description: 'Кнопка, которая открывает лист; принимает render.', props: [] },
    { name: 'ActionSheetGroup', description: 'Связанные действия; группы разделены полосой 8 fill-1.', props: [] },
    {
      name: 'ActionSheetItem',
      description: 'Действие 52: иконка 24 и подпись 17/500; после нажатия лист закрывается. Нажато — fill-2 на всю ширину, фокус — кольцо ring 2 внутри.',
      props: [
        { name: 'icon', type: 'node', description: 'Иконка 22 в слоте 24.' },
        { name: 'value', type: 'node', description: 'Значение справа 15 fg-3 и шеврон: «Переговоры».' },
        { name: 'destructive', type: 'boolean', description: 'Текст и иконка danger-soft-fg.' },
        { name: 'keepOpen', type: 'boolean', description: 'Не закрывать лист после нажатия.' },
        { name: 'disabled', type: 'boolean', description: 'Прозрачность 50 %, нажатие не проходит.' },
      ],
    },
    {
      name: 'ActionSheetSub',
      description: 'Пункт со вторым уровнем в том же листе: шапка «Назад» 44, подпись пункта и объект; высота листа плавно меняется.',
      props: [
        { name: 'label', type: 'string', required: true, description: 'Подпись пункта и заголовок уровня: «Ещё».' },
        { name: 'icon', type: 'node', description: 'Иконка пункта.' },
        { name: 'value', type: 'node', description: 'Что внутри: «В архив, удалить».' },
        { name: 'disabled', type: 'boolean', description: 'Пункт недоступен.' },
        { name: 'children', type: 'node', required: true, control: false, description: 'Группы и действия второго уровня.' },
      ],
    },
  ],
  slots: [
    { name: 'action-sheet', description: 'Лист с плашкой отмены; data-dragging во время жеста, data-level="root" | "nested".' },
    { name: 'action-sheet-panel', description: 'Карточка листа, её высота анимируется при смене уровня.' },
    { name: 'action-sheet-header', description: 'Шапка уровня; за неё лист тянут и пальцем.' },
    { name: 'action-sheet-list', description: 'Прокручиваемый список уровня.' },
    { name: 'action-sheet-group', description: 'Группа действий.' },
    { name: 'action-sheet-item', description: 'Действие.' },
    { name: 'action-sheet-level', description: 'Второй уровень, группа с названием пункта.' },
    { name: 'action-sheet-back', description: 'Кнопка «Назад» 44 с шевроном accent.' },
    { name: 'action-sheet-cancel', description: 'Плашка «Отмена».' },
  ],
  states: [
    { id: 'open', label: 'открыто', description: 'Лист выезжает снизу, затемнение scrim.' },
    { id: 'expanded', label: 'второй уровень', description: 'Вместо первого уровня — список «Ещё» с кнопкой «Назад».', selector: 'data-level="nested"' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'По действиям, «Назад» и «Отмене»' },
    { keys: ['Enter', 'Space'], action: 'Выполняет действие или открывает второй уровень' },
    { keys: ['Esc'], action: 'На втором уровне — назад на первый, на первом — закрывает' },
  ],
  a11y: [
    'role="dialog" с названием «Действия: …»; при открытии фокус на заголовке.',
    'Второй уровень — группа с названием пункта; фокус переходит на его заголовок, «Назад» и Esc возвращают фокус на пункт.',
    'Скрытый уровень убран из дерева доступности и из порядка Tab.',
    'Свайп вниз дублируют «Отмена», затемнение и Esc.',
    'Отрицательные действия — отдельной группой во втором уровне и через подтверждение.',
    'Фокус возвращается на триггер.',
  ],
  motion: [
    { label: 'Появление', value: 'снизу · 300 мс · ease-fluid', easing: 'ease-fluid', tokens: ['duration-slow'] },
    { label: 'Закрытие', value: '250 мс · ease-fluid', easing: 'ease-fluid', tokens: ['duration-moderate'] },
    {
      label: 'Свайп вниз',
      value: 'лист идёт за пальцем 1:1, затемнение гаснет пропорционально',
      detail: 'закрывается при 35 % высоты или скорости ≥ 800 pt/s; вверх — сопротивление 0,3; список, прокрученный не до верха, сначала прокручивается',
      reduced: 'жест тот же, доводка без пружины',
    },
    { label: 'Возврат', value: 'пружина 350 мс', easing: 'spring-smooth', tokens: ['spring-smooth'], reduced: 'ease-out' },
    {
      label: 'Второй уровень',
      value: 'высота листа — пружина 350 мс, уровень въезжает на 24 и проявляется за 200 мс',
      easing: 'spring-smooth',
      tokens: ['spring-smooth', 'shift-xl', 'duration-base'],
      reduced: 'высота меняется сразу, без сдвига',
    },
  ],
  examples: [
    { id: 'deal', title: 'Сделка', description: 'Четыре действия, этап со значением и «Ещё» со вторым уровнем «В архив / Удалить».' },
    { id: 'simple', title: 'Два действия', description: 'Без иконок и описания.' },
    { id: 'long-list', title: 'Длинный список', description: '12 сотрудников: список прокручивается, лист тянется вниз от верха списка.' },
  ],
};

export default meta;
