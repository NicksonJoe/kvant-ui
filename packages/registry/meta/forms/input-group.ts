import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'input-group',
  status: 'stable',
  title: 'Поле с дополнениями',
  description: 'Слева — иконка или неизменяемая часть значения, справа — одно действие или статус. Короткая часть пишется внутри, длинная становится сегментом.',
  category: 'forms',
  paperBoard: '210-0',
  anatomy: ['Капсула поля', 'Начало: иконка, текст или сегмент', 'Поле ввода', 'Конец: единица, сегмент, кнопка, клавиша или спиннер'],
  related: ['input', 'search-field', 'copy-button', 'field'],
  source: { file: 'components/input.tsx', exports: ['InputAddon', 'Input'] },
  dependencies: { npm: ['@base-ui/react'], registry: ['input'] },
  props: [
    { name: 'variant', type: 'enum', options: ['inline', 'segment'], default: 'inline', description: 'inline — текст fg-3 внутри капсулы; segment — ячейка surface-2 у края за волосяной линией.' },
    { name: 'children', type: 'string', signature: 'ReactNode', description: 'Неизменяемая часть: «₽», «https://», «.ru».' },
  ],
  slots: [{ name: 'input-addon', description: 'Дополнение; несёт data-variant.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Сегмент surface-2, текст fg-2, разделитель border.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3 у всей капсулы.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо вокруг всей капсулы, сегмент не меняется.' },
    { id: 'loading', label: 'проверка', description: 'Спиннер 16 справа; ввод не блокируется.' },
    { id: 'invalid', label: 'ошибка', description: 'Рамка danger у всей капсулы.' },
  ],
  keyboard: [{ keys: ['Tab'], action: 'Сначала поле, затем кнопки внутри' }],
  a11y: [
    'Дополнение не печатается и не уходит с формой; нажатие на него ставит курсор в поле.',
    'Если часть значения важна для смысла («https://»), продублируйте её в подписи или подсказке поля.',
    'Справа — не больше одного элемента: спиннер вытесняет очистку, клавиша-подсказка исчезает на касании.',
    'Итог асинхронной проверки объявляйте через описание поля с aria-live="polite".',
  ],
  motion: [
    { label: 'Очистка', value: 'появление: прозрачность и scale .8 → 1, 150 мс · ease-out' },
    { label: 'Спиннер', value: '800 мс на оборот, linear; показывайте его не раньше чем через 150 мс ожидания, чтобы не мигал' },
  ],
  examples: [
    { id: 'segments', title: 'Префикс и суффикс', description: 'Протокол и домен — сегментами, рубли — внутри капсулы.' },
    { id: 'check', title: 'Загрузка и проверка', description: 'Свободен ли адрес: спиннер справа, итог — иконкой и строкой под полем.' },
  ],
};

export default meta;
