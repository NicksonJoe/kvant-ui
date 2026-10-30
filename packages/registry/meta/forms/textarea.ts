import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'textarea',
  status: 'stable',
  title: 'Многострочное поле',
  description: 'Ввод нескольких строк: комментарии, описания, письма. Счётчик символов по желанию: от 90 % предупреждает, сверх лимита — ошибка.',
  category: 'forms',
  paperBoard: 'A8B-0',
  anatomy: ['Рамка r20', 'Область текста', 'Счётчик «84 / 500»'],
  related: ['input', 'field', 'rich-text-editor'],
  source: { file: 'components/input.tsx', exports: ['Textarea'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'placeholder', type: 'string', description: 'Пример текста.' },
    { name: 'rows', type: 'number', options: [2, 3, 5, 8], default: 3, description: 'Видимых строк, минимум 96 px.' },
    { name: 'maxLength', type: 'number', options: [140, 500, 2000], description: 'Мягкий лимит: счётчик «84 / 500», от 90 % — warning, сверх лимита — danger и aria-invalid. Текст не обрезается.' },
    { name: 'invalid', type: 'boolean', default: false, description: 'Ошибка без Field.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно.' },
    { name: 'readOnly', type: 'boolean', default: false, description: 'Только чтение.' },
    { name: 'defaultValue', type: 'string', description: 'Начальный текст неуправляемого поля.', control: false },
    { name: 'onValueChange', type: 'function', signature: '(value: string) => void', description: 'Новый текст при каждом изменении.', control: false },
  ],
  slots: [
    { name: 'textarea', description: 'Рамка поля.' },
    { name: 'textarea-counter', description: 'Счётчик символов, скрыт от экранного диктора; data-limit="near" от 90 %, "over" сверх лимита.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Рамка input, скругление 20 px.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо цвета ring.' },
    {
      id: 'filled',
      label: 'у лимита',
      description: 'От 90 % лимита счётчик warning-soft-fg 500.',
      props: { maxLength: 140, defaultValue: 'Перенесли презентацию на четверг, 14:00. Нужны логотипы в SVG и шрифты из брендбука — пришлите, пожалуйста, до вторника, 12:00.' },
    },
    { id: 'invalid', label: 'ошибка', description: 'Рамка danger; сверх лимита — и счётчик danger-soft-fg.', props: { invalid: true } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {},
  keyboard: [{ keys: ['Enter'], action: 'Новая строка; отправка — только по кнопке или ⌘↵, если вы её добавите' }],
  a11y: [
    'Счётчик скрыт от экранного диктора: вежливо объявляются только 90 % и превышение лимита, а не каждый символ.',
    'Лимит мягкий — вставленный текст не обрезается молча. Сверх лимита поле получает aria-invalid, а в Field пишите, что сделать: «Сократите текст на 12 символов».',
    'Используйте внутри Field — подпись и ошибка свяжутся с полем.',
  ],
  motion: [
    { label: 'Рамка и кольцо', value: '100 мс · ease-hover' },
    { label: 'Цвет счётчика', value: '100 мс · ease-hover' },
  ],
  examples: [
    { id: 'counter', title: 'Со счётчиком', description: 'Счётчик показывает, сколько осталось, цифры табличные.' },
    { id: 'limit', title: 'Сверх лимита', description: 'От 90 % счётчик предупреждает, сверх лимита поле становится ошибкой.' },
    { id: 'error', title: 'Ошибка', description: 'В Field с error рамка и сообщение ставятся сами.' },
  ],
};

export default meta;
