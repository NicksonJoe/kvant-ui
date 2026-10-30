import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'time-picker',
  status: 'stable',
  title: 'Выбор времени',
  description:
    'Время из колонок часов и минут с шагом 5 минут или свободный слот записи чипами. Занятые слоты видны зачёркнутыми — не нужно гадать, куда делось время.',
  category: 'pickers',
  paperBoard: 'DLG-0',
  anatomy: ['Поле с часами', 'Колонки «Часы» и «Минуты»', 'Пункт-капсула 32', 'Слоты-чипы'],
  related: ['date-picker', 'date-field', 'segmented-control'],
  source: { file: 'components/time-picker.tsx', exports: ['TimePicker', 'TimeSlots'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input', 'popover'] },
  props: [
    { name: 'step', type: 'number', options: [1, 5, 10, 15, 30], default: 5, description: 'Шаг минут.' },
    { name: 'placeholder', type: 'string', default: '--:--', description: 'Текст, пока время не выбрано.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Высота поля.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно.' },
    { name: 'min', type: 'string', description: 'Самое раннее «ЧЧ:ММ»; раньше — приглушено.', control: false },
    { name: 'max', type: 'string', description: 'Самое позднее «ЧЧ:ММ».', control: false },
    { name: 'defaultValue', type: 'string', description: 'Время по умолчанию, «10:30».', control: false },
    { name: 'value', type: 'string', description: 'Управляемое время, 24 часа.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(time: string) => void', description: 'Новое время «ЧЧ:ММ».', control: false },
    { name: 'aria-label', type: 'string', description: 'Имя поля без видимой подписи.', control: false },
  ],
  parts: [
    {
      name: 'TimeSlots',
      description: 'Свободные слоты чипами — радиогруппа.',
      props: [
        { name: 'slots', type: 'object', required: true, signature: 'readonly string[]', description: 'Слоты «ЧЧ:ММ» по порядку.' },
        { name: 'unavailable', type: 'object', signature: 'readonly string[]', description: 'Занятые: приглушены, зачёркнуты и пропускаются стрелками.' },
        { name: 'value', type: 'string', description: 'Управляемый слот.' },
        { name: 'onValueChange', type: 'function', signature: '(slot: string) => void', description: 'Выбранный слот.' },
        { name: 'aria-label', type: 'string', description: 'Имя группы: день и длительность.' },
      ],
    },
  ],
  slots: [
    { name: 'popover-trigger', description: 'Поле со временем.' },
    { name: 'time-picker-popup', description: 'Колонки часов и минут.' },
    { name: 'time-slots', description: 'Чипы слотов (role="radiogroup").' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Иконка часов fg-3, время табличными цифрами.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо ring.' },
    { id: 'open', label: 'открыто', description: 'Колонки под полем; выбранный пункт — fill-2 и 600, недоступный — 40 %.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, фон surface-2.', props: { disabled: true } },
  ],
  matrix: { columns: ['rest', 'hover', 'focus', 'disabled'] },
  keyboard: [
    { keys: ['↑', '↓'], action: 'Выбирают соседний час или минуту' },
    { keys: ['←', '→'], action: 'Переходят между колонками' },
    { keys: ['Home', 'End'], action: 'Первое и последнее доступное значение' },
    { keys: ['Enter', 'Esc'], action: 'Закрывают, фокус возвращается в поле' },
  ],
  a11y: [
    'Колонки — listbox «Часы» и «Минуты»; недоступное время помечено aria-disabled.',
    'Слоты — radiogroup: занятые видны, но пропускаются стрелками и не нажимаются.',
    'Выбор минуты закрывает поповер и возвращает фокус в поле.',
  ],
  motion: [
    { label: 'Колонка', value: 'докручивает выбранный пункт к центру' },
    { label: 'Поповер', value: 'opacity и scale .96 + 4 px · 150 мс · ease-out' },
    { label: 'Чип', value: 'тон 75 мс · ease-hover, галочка scale .8 → 1 за 150 мс' },
  ],
  examples: [
    { id: 'meeting', title: 'Время встречи', description: 'Колонки с шагом 5 минут в рабочие часы.' },
    { id: 'slots', title: 'Свободные слоты', description: 'Чипы с занятыми слотами.' },
  ],
};

export default meta;
