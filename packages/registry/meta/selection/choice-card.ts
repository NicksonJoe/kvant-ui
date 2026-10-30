import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'choice-card',
  status: 'stable',
  title: 'Карточка выбора',
  description:
    'Когда у варианта есть цена, описание или иконка: тарифы, доставка, роли. Вся карточка — одна цель нажатия; выбор показан кольцом 2 px, лёгким тоном accent и индикатором в углу — не только цветом.',
  category: 'selection',
  paperBoard: '1J0-0',
  anatomy: ['Группа', 'Карточка r 20', 'Иконка 20 в круге 36', 'Заголовок и описание', 'Индикатор 18 справа вверху', 'Цена или список'],
  related: ['radio-group', 'checkbox', 'segmented-control', 'card'],
  source: { file: 'components/choice-card.tsx', exports: ['ChoiceCardGroup', 'ChoiceCard'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'multiple', type: 'boolean', default: false, description: 'Чекбокс-карточки: можно выбрать несколько.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Отключает все карточки.' },
    { name: 'defaultValue', type: 'string', signature: 'string | string[]', description: 'Выбор по умолчанию; в режиме multiple — массив.', control: false },
    { name: 'value', type: 'string', signature: 'string | string[]', description: 'Управляемый выбор.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: string) => void | (value: string[]) => void', description: 'Новый выбор.', control: false },
    { name: 'className', type: 'string', description: 'Сетка карточек: по умолчанию один столбец с шагом 12.', control: false },
    { name: 'aria-label', type: 'string', description: 'Название группы.', control: false },
  ],
  parts: [
    {
      name: 'ChoiceCard',
      description: 'Карточка-вариант.',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Значение варианта.' },
        { name: 'title', type: 'node', required: true, description: 'Заголовок; он же имя карточки.' },
        { name: 'description', type: 'node', description: 'Строка 13/18 fg-3 под заголовком.' },
        { name: 'icon', type: 'node', description: 'Иконка 20 в круге 36; включает компактный вид (заголовок 14/20).' },
        { name: 'children', type: 'node', description: 'Цена, список возможностей.' },
        { name: 'disabled', type: 'boolean', default: false, description: 'Недоступна.' },
      ],
    },
  ],
  slots: [
    { name: 'choice-card-group', description: 'Сетка карточек (radiogroup или group).' },
    { name: 'choice-card', description: 'Карточка (role="radio" или "checkbox").' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Фон surface-1, волосяное кольцо hairline.' },
    { id: 'hover', label: 'наведение', description: 'Кольцо border и тень 1 px; кольцо индикатора fg-3.' },
    { id: 'pressed', label: 'нажатие', description: 'Карточка scale .98.' },
    { id: 'selected', label: 'выбрано', description: 'Кольцо 2 px accent, фон accent-soft; иконка accent-soft-fg на surface-1.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring 2 px с отступом 2.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  keyboard: [
    { keys: ['↑', '↓', '←', '→'], action: 'Радиокарточки: выбирают соседнюю' },
    { keys: ['Space'], action: 'Чекбокс-карточки: отмечают карточку в фокусе' },
    { keys: ['Tab'], action: 'Радиокарточки — одна остановка; чекбокс-карточки — каждая' },
  ],
  a11y: [
    'Карточка целиком — radio или checkbox: имя — заголовок (aria-labelledby), описание — aria-describedby.',
    'Выбор дублируется формой индикатора, а не только цветом.',
    'Группе нужно имя: aria-label или aria-labelledby.',
  ],
  motion: [
    { label: 'Кольцо и тон', value: '75 мс · ease-hover' },
    { label: 'Нажатие', value: 'scale .98 за 75 мс · ease-out, отпускание spring-micro' },
    { label: 'Индикатор', value: 'как у радиокнопки и флажка' },
  ],
  examples: [
    { id: 'plans', title: 'Тариф', description: 'Радиокарточки с ценой и списком возможностей.' },
    { id: 'features', title: 'Возможности', description: 'Чекбокс-карточки с иконками.' },
  ],
};

export default meta;
