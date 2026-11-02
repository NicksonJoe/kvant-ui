import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'mention',
  status: 'beta',
  title: 'Упоминания',
  description: '«@» в поле открывает список людей прямо под кареткой. Список фильтруется по мере ввода, первая строка активна — Enter вставляет её. Упоминание становится цельным чипом: удаляется одним Backspace.',
  category: 'forms',
  paperBoard: '1DPQ-0',
  anatomy: ['Поле r12 с рамкой input', 'Запрос «@мар»', 'Список людей 288: аватар 32, имя, роль', 'Подсказка клавиш', 'Чип упоминания accent-soft'],
  related: ['textarea', 'prompt-input', 'combobox'],
  source: { file: 'components/mention-field.tsx', exports: ['MentionField'] },
  dependencies: { npm: [], registry: ['avatar'] },
  props: [
    { name: 'aria-label', type: 'string', required: true, description: 'Название поля.' },
    { name: 'people', type: 'object', signature: 'readonly MentionPerson[]', required: true, control: false, description: 'Кого можно упомянуть: id, имя, роль, фото.' },
    { name: 'placeholder', type: 'string', description: 'Подсказка в пустом поле.' },
    { name: 'minRows', type: 'number', options: [1, 3, 5], default: 3, description: 'Высота в строках до прокрутки.' },
    { name: 'onValueChange', type: 'function', signature: '(value: { text: string; mentions: readonly string[] }) => void', description: 'Текст с «@Имя» и id упомянутых.' },
  ],
  slots: [{ name: 'mention-field', description: 'Поле со списком.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Поле с подсказкой.' },
    { id: 'focus', label: 'фокус', description: 'Рамка ring и кольцо 1.' },
    { id: 'open', label: 'список', description: 'Под кареткой, первая строка активна, совпадение жирным.' },
  ],
  keyboard: [
    { keys: ['@'], action: 'Открывает список людей' },
    { keys: ['↑', '↓'], action: 'Активная строка' },
    { keys: ['Enter', 'Tab'], action: 'Вставляет упоминание' },
    { keys: ['Esc'], action: 'Закрывает список, текст остаётся' },
    { keys: ['Backspace'], action: 'Удаляет чип целиком' },
  ],
  a11y: ['Поле — textbox с aria-autocomplete="list" и aria-activedescendant на активную строку.', 'Список — listbox «Люди»; фокус остаётся в поле.', 'Чип читается как «@Имя».'],
  motion: [{ label: 'Список', value: 'появляется сразу, фильтрация без анимации строк' }],
  examples: [
    { id: 'comment', title: 'Комментарий', description: 'Заметка к сделке с подсчётом упомянутых.' },
    { id: 'short', title: 'В одну строку', description: 'Ответ в задаче, minRows=1.' },
  ],
};

export default meta;
