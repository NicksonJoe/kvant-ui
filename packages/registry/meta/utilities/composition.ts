import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'composition',
  status: 'beta',
  title: 'Композиция',
  description:
    'Один компонент — разные элементы: кнопка становится ссылкой, пункт меню — переходом по роутеру. Проп render меняет тег, а вид и поведение держатся на data-slot и data-атрибутах состояния, поэтому смена тега их не ломает. Части Kvant собраны на useRender и mergeProps из Base UI, и библиотека отдаёт их как есть — для своих частей, когда готового компонента нет. Своего кода у утилиты нет: это два реэкспорта и правило, по которому написана вся библиотека.',
  category: 'utilities',
  paperBoard: '1GJ-0',
  anatomy: [
    'render — элемент или функция (props, state) → элемент',
    'Пропсы и обработчики сливаются, className склеивается',
    'ref доходит до итогового тега',
    'data-slot на каждой части',
    'Состояние → data-*: { selected } → data-selected',
  ],
  related: ['button', 'link', 'list', 'segmented-control', 'menu', 'checkbox'],
  source: { file: 'components/composition.tsx', exports: ['useRender', 'mergeProps'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    {
      name: 'render',
      type: 'node',
      signature: 'ReactElement | ((props, state) => ReactElement)',
      control: false,
      description:
        'Итоговый элемент. Элемент — <a href="/deals/new" /> или <Link to="…" /> роутера: его пропсы сливаются с пропсами части. Функция получает готовые props и state и возвращает элемент сама: (props, state) => <a {...props} />.',
    },
    { name: 'defaultTagName', type: 'string', default: 'div', control: false, description: 'Тег, когда render не передан: button, a, span.' },
    {
      name: 'props',
      type: 'object',
      signature: 'Record<string, unknown>',
      control: false,
      description: 'Пропсы части, собранные mergeProps(own, props): свои слева, пользователя справа.',
    },
    {
      name: 'state',
      type: 'object',
      signature: 'Record<string, unknown>',
      control: false,
      description: 'Состояние части. Каждое поле становится data-атрибутом: true → data-selected="", false и undefined — без атрибута, строка → data-side="top". Его же получает функция render.',
    },
    { name: 'ref', type: 'object', signature: 'Ref<Element>', control: false, description: 'Доходит до итогового тега, что бы ни пришло в render, и сливается с ref самого элемента render.' },
  ],
  parts: [
    {
      name: 'mergeProps',
      description: 'Сливает пропсы так же, как каждая часть Kvant сливает свои с пользовательскими.',
      props: [
        {
          name: '...props',
          type: 'object',
          signature: 'mergeProps<"button">(...props: Props[]) => Props',
          description: 'Обработчики событий вызываются все, правый первым; className склеивается; style сливается; остальные пропсы перезаписывает правый.',
        },
      ],
    },
  ],
  slots: [],
  states: [
    { id: 'selected', label: 'выбрано', description: 'Вкладка или сегмент выбраны: surface-1, тень segment.', selector: '[data-selected]' },
    { id: 'highlighted', label: 'под клавишами', description: 'Пункт меню под стрелками или указателем: fill-2.', selector: '[data-highlighted]' },
    { id: 'checked', label: 'отмечено', description: 'Флажок отмечен: accent.', selector: '[data-checked]' },
    { id: 'disabled', label: 'недоступно', description: 'Ссылка-кнопка недоступна: 50 %, aria-disabled, без href, фокус остаётся.', selector: '[data-disabled] · aria-disabled' },
  ],
  keyboard: [
    { keys: ['Enter'], action: 'Ссылка — переход, кнопка — действие: решает итоговый тег' },
    { keys: ['Space'], action: 'Нажимает кнопку; ссылку Space не нажимает' },
    { keys: ['Tab'], action: 'Недоступная ссылка-кнопка остаётся в обходе' },
  ],
  a11y: [
    'Семантика — от итогового тега: переход — ссылка, действие — кнопка. role не подменяем: Button с render={<a href />} остаётся ссылкой без role="button" и type; nativeButton с render не нужен.',
    'Недоступная ссылка-кнопка — aria-disabled и data-disabled, без href и с tabindex="0": фокус остаётся, диктор читает «ссылка, недоступна», клик и Enter ничего не делают. Ссылке роутера href ставит сам роутер, переход останавливает отменённый клик.',
    'Стили пишутся на data-атрибуты (data-selected, data-highlighted, data-checked, data-disabled), а не на теги и :disabled: у ссылки :disabled не бывает, а data-disabled есть у любого тега.',
    'Имена атрибутов у готовых компонентов — от Base UI: Tabs отмечают выбранную вкладку data-active, SegmentedControl — data-checked. Своя часть называет состояние сама через state.',
  ],
  motion: [{ label: 'Смена тега', value: 'то же, что у исходного компонента', note: 'Переходы висят на data-атрибутах, смена тега их не сбрасывает.' }],
  examples: [
    { id: 'render', title: 'render · вид тот же, тег — по смыслу', description: 'Одна кнопка «Создать сделку» как <button>, как <a href> и как ссылка роутера.' },
    { id: 'states', title: 'data-атрибуты · стили не зависят от тега', description: 'Свой сегмент и свой пункт меню на useRender, флажок и недоступная ссылка-кнопка.' },
  ],
};

export default meta;
