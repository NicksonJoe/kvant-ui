import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'radio-group',
  status: 'stable',
  title: 'Радиокнопки',
  description:
    'Один вариант из двух–пяти, все на виду. Повторное нажатие выбор не снимает, поэтому у группы всегда есть значение по умолчанию или явный вариант «Не выбрано».',
  category: 'selection',
  paperBoard: '1J0-0',
  anatomy: ['Группа с подписью', 'Пункт-подпись', 'Круг 18 px', 'Точка 6 px', 'Описание', 'Ошибка группы'],
  related: ['segmented-control', 'select', 'choice-card', 'checkbox'],
  source: { file: 'components/checkbox.tsx', exports: ['RadioGroup', 'RadioItem'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['spinner'] },
  props: [
    { name: 'label', type: 'string', signature: 'ReactNode', description: 'Видимое название группы, 13/16 500 fg-2; оно же имя radiogroup.' },
    { name: 'orientation', type: 'enum', options: ['vertical', 'horizontal'], default: 'vertical', description: 'Столбик (шаг 12, с описаниями 16) или строка с шагом 24.' },
    { name: 'size', type: 'enum', options: ['md', 'lg'], default: 'md', description: '18 px для указателя или 22 px с точкой 8 и текстом 16/24 для касания.' },
    { name: 'error', type: 'string', signature: 'ReactNode', description: 'Ошибка всей группы: кольца danger и текст под вариантами.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Отключает все пункты.' },
    { name: 'defaultValue', type: 'string', description: 'Выбранный по умолчанию пункт.', control: false },
    { name: 'value', type: 'string', description: 'Управляемое значение.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: string) => void', description: 'Новый выбор.', control: false },
    { name: 'name', type: 'string', description: 'Имя поля в форме.', control: false },
    { name: 'aria-label', type: 'string', description: 'Название группы без видимой подписи.', control: false },
  ],
  parts: [
    {
      name: 'RadioItem',
      description: 'Пункт группы с подписью и необязательным описанием.',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Значение пункта.' },
        { name: 'children', type: 'node', description: 'Подпись.' },
        { name: 'description', type: 'node', description: 'Вторая строка 13/18 fg-3; читается как описание, а не как имя.' },
        { name: 'disabled', type: 'boolean', default: false, description: 'Отключает пункт.' },
      ],
    },
  ],
  slots: [
    { name: 'radio-group', description: 'Группа (role="radiogroup"); несёт data-size.' },
    { name: 'radio', description: 'Круг пункта.' },
    { name: 'radio-description', description: 'Описание пункта.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Фон surface-1, кольцо 1,5 px input.' },
    { id: 'hover', label: 'наведение', description: 'Кольцо fg-3; у выбранного фон accent-hover · 75 мс.' },
    { id: 'pressed', label: 'нажатие', description: 'Фон surface-3 (у выбранного accent-pressed), scale .94.' },
    { id: 'checked', label: 'выбрано', description: 'Заливка accent и точка 6 px accent-fg по центру.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring 2 px с отступом 2 вокруг круга.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 % у всей строки с подписью.', props: { disabled: true } },
    { id: 'invalid', label: 'ошибка', description: 'Кольца danger, выбранный — фон danger; текст ошибки под группой.', props: { error: 'Выберите способ связи' } },
  ],
  matrix: {
    rows: [
      { label: 'не выбрана', props: { checked: false } },
      { label: 'выбрана', props: { checked: true } },
    ],
  },
  keyboard: [
    { keys: ['↑', '↓', '←', '→'], action: 'Выбирают соседний пункт' },
    { keys: ['Tab'], action: 'Входит в группу на выбранном пункте и выходит из неё' },
  ],
  a11y: [
    'Группа — одна остановка Tab, стрелки сразу выбирают пункт.',
    'Дайте группе название: label, aria-label или aria-labelledby.',
    'Описание пункта связано через aria-describedby и не входит в его имя.',
    'Ошибка — у всей группы: aria-invalid и aria-describedby на radiogroup.',
  ],
  motion: [
    { label: 'Точка', value: 'растёт .5 → 1 на spring-snappy (300 мс, отскок 0,1); старая гаснет за 100 мс' },
    { label: 'Фон', value: '75 мс · ease-hover' },
    { label: 'Нажатие', value: 'scale .94 за 75 мс · ease-out, отпускание spring-micro' },
    { label: 'Ошибка', value: 'opacity 150 мс · ease-out, без встряхивания' },
    { label: 'Сниженное движение', value: 'без отскока и масштаба' },
  ],
  examples: [
    { id: 'vertical', title: 'Столбиком с описаниями', description: 'Основной вид для форм: подпись группы и вторая строка у вариантов.' },
    { id: 'horizontal', title: 'В строку', description: 'Для двух–трёх коротких вариантов.' },
    { id: 'invalid', title: 'С ошибкой', description: 'Ошибка всей группы — кольца danger и текст под вариантами.' },
    { id: 'touch', title: 'На касании', description: 'Размер lg: круг 22, точка 8, подпись 16/24.' },
  ],
};

export default meta;
