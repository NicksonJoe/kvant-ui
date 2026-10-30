import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'form',
  status: 'stable',
  title: 'Форма',
  description: 'Поля в порядке чтения, проверка по правилу «ушёл из поля — проверяем, исправляет — на каждый символ», сводка ошибок сверху и кнопки внизу.',
  category: 'forms',
  paperBoard: '5B2-0',
  anatomy: ['<form>', 'Сводка ошибок', 'Поля и группы', 'Кнопки: основная последней'],
  related: ['field', 'fieldset', 'alert', 'button'],
  source: { file: 'components/form.tsx', exports: ['Form', 'FormErrorSummary', 'FormActions'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: [] },
  propsOf: 'Form',
  props: [
    { name: 'validationMode', type: 'enum', options: ['onBlur', 'onSubmit', 'onChange'], default: 'onBlur', description: 'onBlur — проверка при уходе из поля, дальше на каждый символ, пока поле с ошибкой; при отправке проверяется всё.' },
    { name: 'errors', type: 'object', signature: 'Record<string, string | string[]>', description: 'Ошибки с сервера по name полей — встанут под нужными полями.', control: false },
    { name: 'onSubmit', type: 'function', signature: '(event: FormEvent<HTMLFormElement>) => void', description: 'Отправка. Повтор, пока запрос в пути, блокируйте сами.', control: false },
    { name: 'onFormSubmit', type: 'function', signature: '(values: Record<string, unknown>) => void', description: 'Значения полей после успешной проверки.', control: false },
  ],
  parts: [
    {
      name: 'FormErrorSummary',
      description: 'Сводка над полями: появляется после неудачной отправки и сразу получает фокус, строки ведут к полям.',
      props: [
        { name: 'errors', type: 'object', signature: 'readonly { name: string; label: string; message: string }[]', required: true, description: 'Пусто — сводки нет.' },
        { name: 'title', type: 'node', description: 'Заголовок; по умолчанию «Проверьте N поля».' },
      ],
    },
    {
      name: 'FormActions',
      description: 'Ряд кнопок справа; sticky — стеклянная капсула h56, прилипает к низу, пока есть несохранённое.',
      props: [
        { name: 'status', type: 'node', description: 'Слева: точка и «Не сохранено · 2 ошибки».' },
        { name: 'sticky', type: 'boolean', default: false, description: 'Липкая панель снизу.' },
      ],
    },
  ],
  slots: [
    { name: 'form', description: 'Форма: колонка с промежутком 20 px.' },
    { name: 'form-error-summary', description: 'Сводка ошибок (role="alert").' },
    { name: 'form-actions', description: 'Ряд кнопок или липкая панель.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Поля без ошибок; кнопка отправки активна всегда.' },
    { id: 'invalid', label: 'ошибки', description: 'Сводка danger-soft сверху, у полей — рамка danger и текст ошибки.' },
  ],
  keyboard: [
    { keys: ['Enter'], action: 'Отправляет форму из однострочного поля' },
    { keys: ['Tab'], action: 'Идёт по полям в порядке чтения' },
  ],
  a11y: [
    'Кнопку отправки не отключайте: при неудачной попытке сводка получает фокус и объясняет, что мешает.',
    'Каждая строка сводки — кнопка, которая ставит фокус в своё поле.',
    'Печатает — молчим; ушёл из поля — проверяем; исправляет — проверяем на каждый символ; стало верно — ошибка уходит сразу.',
    'Ошибки сервера передавайте в errors по name полей — они встанут туда же, где ошибки проверки.',
  ],
  motion: [
    { label: 'Появление ошибки', value: 'прозрачность 150 мс · ease-out и встряска рамки ±4 px ×3 за 300 мс' },
    { label: 'Исчезновение ошибки', value: 'прозрачность 100 мс' },
    { label: 'Сводка', value: 'появляется сразу и получает фокус — браузер сам прокручивает к ней' },
  ],
  examples: [
    { id: 'project', title: 'Новый проект', description: 'Нажмите «Создать проект»: сводка получает фокус, ошибки встают у полей, липкая панель их считает.' },
    { id: 'validation', title: 'Когда показывать ошибку', description: 'Уйдите из поля с неполной почтой, затем исправьте её.' },
  ],
};

export default meta;
