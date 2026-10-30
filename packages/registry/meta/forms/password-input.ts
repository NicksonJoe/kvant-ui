import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'password-input',
  status: 'stable',
  title: 'Поле пароля',
  description: 'Скрытый ввод с кнопкой «показать». При создании пароля — шкала из четырёх сегментов и совет, что добавить; второго поля «повторите пароль» нет.',
  category: 'forms',
  paperBoard: 'A8B-0',
  anatomy: ['Капсула h36', 'Поле type="password"', 'Кнопка-глаз 28 с отступом 4', 'Шкала: 4 сегмента h4', 'Уровень и совет'],
  related: ['input', 'field', 'form', 'progress'],
  source: { file: 'components/password-input.tsx', exports: ['PasswordInput', 'passwordStrength'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input'] },
  props: [
    { name: 'showStrength', type: 'boolean', default: false, description: 'Шкала и совет под полем — для нового пароля; autocomplete становится new-password.' },
    { name: 'defaultValue', type: 'string', description: 'Начальное значение.' },
    { name: 'placeholder', type: 'string', description: 'Обычно не нужен: требования — в подсказке Field.' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Высота 32 / 36 / 44 px.' },
    { name: 'invalid', type: 'boolean', default: false, description: 'Ошибка без Field.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступно.' },
    { name: 'onValueChange', type: 'function', signature: '(value: string) => void', description: 'Новое значение.', control: false },
  ],
  parts: [
    {
      name: 'passwordStrength',
      description: 'Оценка 0–4: слабый — короче 10; средний — 10+ без букв, цифр и знаков вместе; хороший — все три; надёжный — 14+ или фраза из четырёх слов.',
      props: [{ name: 'password', type: 'string', required: true, description: 'Пароль; возвращает 0 | 1 | 2 | 3 | 4.' }],
    },
  ],
  slots: [
    { name: 'password-input', description: 'Колонка: капсула и шкала.' },
    { name: 'password-strength', description: 'Шкала и совет; несёт data-strength.' },
  ],
  states: [
    { id: 'rest', label: 'скрыт', description: 'Точки с разрядкой .12em, глаз fg-3.', props: { defaultValue: 'Sever-2026!' } },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо ring.' },
    { id: 'filled', label: 'со шкалой', description: 'Сегменты danger → warning → success, уровень и совет.', props: { defaultValue: 'Sever-2026!', showStrength: true } },
    { id: 'invalid', label: 'ошибка', description: 'Рамка danger.', props: { invalid: true } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {},
  keyboard: [
    { keys: ['Tab'], action: 'Из поля на кнопку-глаз — отдельная остановка' },
    { keys: ['Space', 'Enter'], action: 'На глазе показывают или прячут пароль' },
  ],
  a11y: [
    'Глаз — переключатель с aria-pressed и постоянным названием «Показать пароль»; курсор в поле не сбивается.',
    'При отправке формы пароль снова скрывается.',
    'Уровень надёжности объявляется вежливо, только когда меняется; полоски скрыты от диктора.',
    'autocomplete="new-password" включает предложение надёжного пароля в iOS и браузерах.',
  ],
  motion: [
    { label: 'Сегменты', value: 'заполняются слева направо, 150 мс · ease-out через 35 мс' },
    { label: 'Смена тона', value: '150 мс · ease-hover' },
    { label: 'Глаз', value: 'кросс-фейд и scale .8 → 1, 150 мс' },
  ],
  examples: [
    { id: 'new-password', title: 'Новый пароль', description: 'Шкала и совет: «Хороший. Ещё 3 символа — и станет надёжным».' },
    { id: 'sign-in', title: 'Вход', description: 'Текущий пароль без шкалы, требования не нужны.' },
  ],
};

export default meta;
