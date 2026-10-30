import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'list',
  status: 'stable',
  title: 'Список',
  description: 'Строки с медиа, текстом и действиями — основа мобильных экранов и настроек. 44 под указатель, 52 под касание.',
  category: 'data-display',
  paperBoard: '1GX-0',
  anatomy: ['Группа с подписью и примечанием', 'Контейнер r20 (inset — r24)', 'Строка', 'Ведущий слот 32', 'Заголовок и подзаголовок', 'Значение', 'Шеврон или галочка', 'Разделитель от текста'],
  related: ['data-list', 'card', 'switch', 'separator'],
  source: { file: 'components/list.tsx', exports: ['List', 'ListItem'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: [] },
  propsOf: 'ListItem',
  props: [
    { name: 'title', type: 'node', required: true, description: 'Заголовок строки, 14/20 500 (inset — 16/20).' },
    { name: 'subtitle', type: 'node', description: 'Подпись 12/16 fg-3 под заголовком.' },
    { name: 'leading', type: 'node', description: 'Слот 32: иконка 20 или аватар 32. Держит текст соседних строк на одной линии.', control: false },
    { name: 'value', type: 'node', description: 'Значение справа, 14/20 fg-3 табличными цифрами.' },
    { name: 'chevron', type: 'boolean', default: false, description: 'Шеврон справа: строка открывает экран или выбор.' },
    { name: 'selected', type: 'boolean', description: 'Строка выбора: галочка accent вместо шеврона, aria-pressed.' },
    { name: 'destructive', type: 'boolean', default: false, description: 'Опасное действие: текст и иконка danger-soft-fg.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступна: прозрачность 50 %.' },
    { name: 'control', type: 'node', description: 'Переключатель или флажок справа; нажатие по всей строке.', control: false },
    { name: 'href', type: 'string', description: 'Строка-ссылка; для роутера — render={<Link to="…" />}.', control: false },
    { name: 'onClick', type: 'function', signature: '(event) => void', description: 'Строка-кнопка.', control: false },
  ],
  parts: [
    {
      name: 'List',
      description: 'Контейнер строк на surface-1 с микротенью; заголовок группы называет список.',
      props: [
        { name: 'variant', type: 'enum', options: ['plain', 'inset'], default: 'plain', description: 'plain — r20, строки 44; inset — iOS inset-grouped, r24, строки 52, текст 16.' },
        { name: 'header', type: 'node', description: 'Подпись группы 13/16 500 fg-3 над строками.' },
        { name: 'footer', type: 'node', description: 'Примечание 13/18 fg-3 под строками.' },
      ],
    },
  ],
  slots: [
    { name: 'list-group', description: 'Группа: заголовок, список и примечание (section).' },
    { name: 'list', description: 'Список ul; несёт data-variant.' },
    { name: 'list-item', description: 'Пункт li; data-selected у выбранного, разделитель — его ::after.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Разделитель separator с отступом 60 (16 + 32 + 12), у последней строки его нет.' },
    { id: 'hover', label: 'наведение', description: 'Фон fill-1 — только у нажимаемых строк.' },
    { id: 'pressed', label: 'нажатие', description: 'Фон fill-2 на всю ширину, без масштаба.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо 2 ring внутри строки: строка прижата к краю контейнера.' },
    { id: 'selected', label: 'выбрано', description: 'Галочка 16 accent вместо шеврона.', props: { selected: true } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, без наведения.', props: { disabled: true } },
  ],
  matrix: {
    rows: [
      { label: 'значение', props: { chevron: true } },
      { label: 'опасное', props: { destructive: true } },
    ],
    columns: ['rest', 'hover', 'pressed', 'focus', 'selected', 'disabled'],
  },
  keyboard: [
    { keys: ['Tab'], action: 'Идёт по нажимаемым строкам и переключателям' },
    { keys: ['Enter'], action: 'Открывает строку-ссылку или нажимает строку-кнопку' },
    { keys: ['Space'], action: 'Нажимает строку-кнопку или переключает переключатель' },
  ],
  a11y: [
    'Список — ul, заголовок группы связан с ним через aria-labelledby.',
    'Строка с переключателем — label: нажатие по тексту переключает, а экранный диктор читает название переключателя.',
    'Выбранная строка — кнопка с aria-pressed.',
  ],
  motion: [
    { label: 'Наведение', value: 'fill-1 · 75 мс · ease-hover' },
    { label: 'Нажатие', value: 'fill-2 · 75 мс, без масштаба' },
    { label: 'Уход наведения', value: '150 мс' },
  ],
  examples: [
    { id: 'settings', title: 'Настройки', description: 'Шесть видов строк: простая, с аватаром, переключатель, значение, выбор, опасная.' },
    { id: 'inset', title: 'Группа на телефоне', description: 'Inset-grouped: подпись группы, строки 52 и примечание.' },
  ],
};

export default meta;
