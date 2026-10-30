import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'field',
  status: 'stable',
  title: 'Поле формы',
  description: 'Подпись, контрол, подсказка и ошибка, связанные между собой для экранного диктора. Оборачивает любой ввод.',
  category: 'forms',
  paperBoard: '5B2-0',
  anatomy: ['Корень', 'Подпись и пометка «необязательно»', 'Контрол', 'Подсказка', 'Ошибка с иконкой'],
  related: ['input', 'textarea', 'select', 'fieldset', 'form'],
  source: { file: 'components/field.tsx', exports: ['Field'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: [] },
  props: [
    { name: 'label', type: 'string', signature: 'ReactNode', description: 'Подпись над контролом, 13/16 medium.' },
    { name: 'description', type: 'string', signature: 'ReactNode', description: 'Подсказка под контролом; попадает в aria-describedby.' },
    { name: 'error', type: 'string', signature: 'ReactNode', description: 'Текст ошибки. Помечает контрол aria-invalid и связывает сообщение с ним. Без него поле показывает сообщения validate, нативных ограничений и errors формы.' },
    { name: 'validate', type: 'function', signature: '(value: unknown) => string | null', description: 'Своя проверка; когда она сработает, решает Form (по умолчанию — при уходе из поля, дальше на каждый символ, пока поле с ошибкой).', control: false },
    { name: 'optional', type: 'boolean', default: false, description: 'Добавляет пометку «необязательно» после подписи.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Отключает контрол внутри поля.' },
    { name: 'children', type: 'node', required: true, description: 'Контрол: Input, Textarea, Select, Combobox…', control: false },
  ],
  slots: [{ name: 'field', description: 'Корень поля: колонка с промежутком 6 px.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Подпись fg-2, подсказка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо контрола; подпись не меняется.' },
    { id: 'invalid', label: 'ошибка', description: 'Рамка danger, текст ошибки с иконкой вместо подсказки.', props: { error: 'Укажите почту в формате name@domain.ru' } },
    { id: 'disabled', label: 'отключено', description: 'Контрол прозрачный на 50 %, фон surface-2.', props: { disabled: true } },
  ],
  matrix: {},
  keyboard: [],
  a11y: [
    'Подпись связана с контролом: нажатие на неё ставит фокус в поле.',
    'Подсказка и ошибка попадают в aria-describedby — экранный диктор читает их после названия поля.',
    'Ошибка ставит контролу aria-invalid; цвет не единственный признак — рядом иконка и текст.',
    'Пишите ошибку как подсказку, что сделать: «Укажите почту в формате name@domain.ru».',
  ],
  motion: [
    { label: 'Появление ошибки', value: 'прозрачность 150 мс · ease-out' },
    { label: 'Рамка при ошибке', value: 'встряска ±4 px ×3 за 300 мс; при сниженном движении без сдвига' },
  ],
  examples: [
    { id: 'with-description', title: 'С подсказкой', description: 'Подсказка объясняет формат до того, как случится ошибка.' },
    { id: 'error', title: 'Ошибка', description: 'Сообщение заменяет подсказку и говорит, что исправить.' },
    { id: 'form', title: 'Форма клиента', description: 'Несколько полей с общим ритмом 16 px.' },
  ],
};

export default meta;
