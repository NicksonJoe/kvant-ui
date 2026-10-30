import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'cascader',
  status: 'stable',
  title: 'Иерархический выбор',
  description:
    'Выбор из иерархии до трёх уровней: каждая колонка раскрывает следующую. Поле показывает путь целиком — «Дизайн › Брендинг › Фирменный стиль».',
  category: 'pickers',
  paperBoard: '9SZ-0',
  anatomy: ['Поле с путём', 'Колонки уровней 200 px', 'Разделитель 1 px', 'Пункт со стрелкой', 'Галочка выбранного'],
  related: ['select', 'tree-view', 'combobox'],
  source: { file: 'components/cascader.tsx', exports: ['Cascader'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input', 'popover'] },
  props: [
    {
      name: 'options',
      type: 'object',
      required: true,
      signature: 'readonly { value: string; label: string; disabled?: boolean; children?: CascaderOption[] }[]',
      description: 'Дерево вариантов; выбрать можно только лист.',
      control: false,
    },
    { name: 'placeholder', type: 'string', default: 'Выберите', description: 'Текст, пока ничего не выбрано.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Высота поля.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступен.' },
    { name: 'defaultValue', type: 'object', signature: 'readonly string[] | null', description: 'Путь по умолчанию.', control: false },
    { name: 'value', type: 'object', signature: 'readonly string[] | null', description: 'Управляемый путь от верхнего уровня до листа.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(path: string[]) => void', description: 'Выбранный путь.', control: false },
    { name: 'aria-label', type: 'string', description: 'Имя поля без видимой подписи.', control: false },
  ],
  slots: [
    { name: 'popover-trigger', description: 'Поле с путём.' },
    { name: 'cascader-popup', description: 'Колонки уровней.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Предки пути fg-3, разделители › fg-4, выбранный лист fg-1.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо ring.' },
    { id: 'open', label: 'открыто', description: 'Колонки под полем: путь — fill-2 и 500, выбранный лист — галочка accent.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, фон surface-2.', props: { disabled: true } },
  ],
  matrix: { columns: ['rest', 'hover', 'focus', 'disabled'] },
  keyboard: [
    { keys: ['↑', '↓'], action: 'Двигаются по колонке' },
    { keys: ['→', 'Enter'], action: 'Раскрывают ветку и переходят в неё' },
    { keys: ['←'], action: 'Возвращает на уровень выше' },
    { keys: ['Enter', 'Space'], action: 'На листе — выбирает и закрывает' },
    { keys: ['Esc'], action: 'Закрывает, фокус возвращается в поле' },
  ],
  a11y: [
    'Каждая колонка — listbox с именем родителя; пункты пути отмечены aria-selected.',
    'Фокус ходит по пунктам; закрытие возвращает его в поле.',
    'Выбрать можно только лист — ветки раскрываются.',
  ],
  motion: [
    { label: 'Колонка', value: 'появляется opacity 150 мс · ease-out со сдвигом 4 px' },
    { label: 'Наведение на ветку', value: 'раскрывает колонку через 100 мс (намерение)' },
    { label: 'Шеврон поля', value: 'поворот на 180° за 150 мс · ease-out' },
  ],
  examples: [
    { id: 'service', title: 'Услуга', description: 'Три уровня с выбранным путём.' },
    { id: 'region', title: 'Регион и город', description: 'Два уровня, пустое поле.' },
  ],
};

export default meta;
