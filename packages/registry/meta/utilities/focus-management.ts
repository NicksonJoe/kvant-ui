import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'focus-management',
  status: 'beta',
  title: 'Управление фокусом',
  description:
    'Три вещи для своих частей интерфейса. FocusTrap держит Tab внутри своего слоя и возвращает фокус туда, откуда слой открыли. FocusGroup делает ряд кнопок одной остановкой Tab, а внутри него фокус ходит стрелками. focusRing ставит единое кольцо снаружи, вровень или внутрь. Диалоги, шиты, поповеры, меню, вкладки, сегменты и тулбары всё это уже умеют через Base UI — утилиты нужны, когда готового компонента Kvant под задачу нет.',
  category: 'utilities',
  paperBoard: 'Q7-0',
  anatomy: [
    'Кольцо: сплошное 2px ring, контраст к фону ≥ 3 : 1',
    'Снаружи — кнопки, теги, чекбоксы, ссылки: зазор 2',
    'Вровень — поля: рамка ring 1 + тень 1, без зазора',
    'Внутрь — строки таблиц и списков: offset −2',
    'Ловушка: Tab по кругу внутри слоя',
    'Возврат: фокус на элемент, который открыл слой',
    'Группа: одна остановка Tab, стрелки внутри',
  ],
  related: ['toolbar', 'dialog', 'sheet', 'list', 'portal', 'presence'],
  source: { file: 'components/focus-management.tsx', exports: ['FocusGroup', 'FocusTrap', 'focusRing'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'aria-label', type: 'string', control: false, description: 'Название группы для диктора: «Действия со списком». У корня role="group".' },
    { name: 'orientation', type: 'enum', options: ['horizontal', 'vertical'], default: 'horizontal', description: 'Какие стрелки двигают фокус: ← → для ряда, ↑ ↓ для столбца. Попадает в data-orientation.' },
    { name: 'loop', type: 'boolean', default: true, description: 'Стрелка после последнего элемента ведёт к первому и обратно; false — фокус останавливается на краю.' },
    { name: 'children', type: 'node', required: true, control: false, description: 'Кнопки, ссылки, чекбоксы — всё, что принимает фокус. Отключённые (disabled, aria-disabled="true") стрелки пропускают.' },
    { name: 'className', type: 'string', control: false, description: 'Раскладка группы: flex, gap. Остальные атрибуты div тоже передаются.' },
  ],
  parts: [
    {
      name: 'FocusTrap',
      description:
        'Обёртка своего слоя. При появлении ставит фокус на элемент с autoFocus, иначе на первый доступный, а если внутри фокусироваться нечему — на саму обёртку. Tab с последнего элемента ведёт к первому, Shift+Tab с первого — к последнему. При исчезновении возвращает фокус тому, у кого он был до появления, если пользователь сам не увёл его в другое место. Esc и клик мимо не перехватывает: закрытие решает слой. Принимает атрибуты div.',
      props: [{ name: 'children', type: 'node', required: true, description: 'Содержимое слоя: поля и кнопки.' }],
    },
    {
      name: 'focusRing',
      description: 'Классы положения кольца для своих элементов. Снаружи кольцо и так рисует глобальный :focus-visible; outside нужен, чтобы вернуть это положение там, где его переопределили.',
      props: [
        { name: 'outside', type: 'string', description: 'Кнопки, теги, чекбоксы, ссылки, иконки: outline 2 ring, offset 2. Зазор отделяет кольцо от заливки — оно читается и на акцентной кнопке.' },
        { name: 'flush', type: 'string', description: 'Поля ввода: рамка становится ring, плюс тень 0 0 0 1px ring, без outline. Кольцо не наезжает на подпись и соседей.' },
        { name: 'inset', type: 'string', description: 'Строки таблиц и списков: offset −2. Контейнер с overflow: hidden не обрезает кольцо, соседние строки его не перекрывают.' },
      ],
    },
  ],
  slots: [
    { name: 'focus-group', description: 'Корень FocusGroup: role="group", data-orientation.' },
    { name: 'focus-trap', description: 'Корень FocusTrap: tabindex="-1" без своего кольца — принимает фокус, когда внутри нет полей.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Остановка Tab — первый доступный элемент группы, у остальных tabindex="-1".' },
    { id: 'focus', label: 'фокус с клавиатуры', description: 'Кольцо 2px ring на элементе. Остановка Tab переезжает на него и остаётся там, когда фокус уходит из группы.', selector: ':focus-visible · outline 2 ring' },
    { id: 'disabled', label: 'отключено', description: 'disabled и aria-disabled="true" стрелки пропускают; снова включённый элемент возвращается в обход сам.' },
  ],
  keyboard: [
    { keys: ['Tab', 'Shift+Tab'], action: 'Между группами; в FocusTrap — по кругу внутри слоя' },
    { keys: ['←', '→'], action: 'Соседний элемент группы (orientation="horizontal")' },
    { keys: ['↑', '↓'], action: 'Соседний элемент группы (orientation="vertical")' },
    { keys: ['Home', 'End'], action: 'Первый и последний элемент группы' },
  ],
  a11y: [
    'Кольцо рисуется только при работе с клавиатуры (:focus-visible): после клика мышью его нет.',
    'Группа — одна остановка Tab (roving tabindex). Элементы, пришедшие позже или снова включённые, тоже уходят из обхода: группу отслеживает MutationObserver.',
    'В полях ввода стрелки двигают каретку: группа их не перехватывает.',
    'Esc закрывает верхний слой и возвращает фокус на кнопку, которая его открыла: в Dialog, Sheet, Popover и Menu это делает Base UI, в своём слое — FocusTrap, когда слой исчезает.',
    'Кнопка, открывшая слой, должна остаться на странице: если она пропадает вместе со слоем, вернуть фокус некуда, и он уходит на <body>.',
    'FocusTrap не делает остальную страницу инертной и не возвращает фокус, ушедший кликом: для модального окна берите Dialog.',
    'Сплошное кольцо ring даёт 4,4 : 1 к фону, прозрачный ореол 25 % — лишь 1,4 : 1 и тонет на акцентной кнопке, поэтому ореола нет (WCAG 2.4.13).',
  ],
  motion: [
    { label: 'Кольцо фокуса', value: 'появляется сразу, 0 мс', easing: 'instant', note: 'Клавиатура не ждёт анимацию.', reduced: 'так же' },
    { label: 'Перемещение стрелками', value: 'без анимации', note: 'Фокус переходит на соседний элемент в том же кадре.' },
  ],
  examples: [
    { id: 'trap', title: 'Своя панель: ловушка и возврат', description: '«Изменить» открывает правку записи в карточке: Tab ходит по кругу, Esc и «Отмена» возвращают фокус на «Изменить».' },
    { id: 'group', title: 'Стрелки внутри группы', description: 'Ряд иконок и список клиентов — по одной остановке Tab, внутри ← → и ↑ ↓; «В архив» отключена и пропускается.' },
    { id: 'ring', title: 'Три положения кольца', description: 'Кнопка — снаружи, поле — вровень, строки списка — внутрь. Пройдите по ним Tab.' },
  ],
};

export default meta;
