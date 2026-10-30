import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'native-select',
  status: 'stable',
  title: 'Системный список',
  description:
    'Тот же вид, что у поля, но список рисует система: колесо на iOS, меню на macOS. Двойной шеврон вместо одинарного подсказывает, что откроется системный выбор.',
  category: 'pickers',
  paperBoard: '9SZ-0',
  anatomy: ['Капсула поля', 'Родной select', 'Двойной шеврон'],
  related: ['select', 'combobox', 'input'],
  source: { file: 'components/native-select.tsx', exports: ['NativeSelect'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['input'] },
  props: [
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Высота 32, 36 или 44, как у поля.' },
    { name: 'invalid', type: 'boolean', default: false, description: 'Рамка danger; внутри Field с error ставится сама.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступен.' },
    { name: 'required', type: 'boolean', default: false, description: 'Обязателен в форме.' },
    { name: 'children', type: 'node', description: 'Пункты option и группы optgroup.', control: false },
    { name: 'defaultValue', type: 'string', description: 'Значение по умолчанию.', control: false },
    { name: 'value', type: 'string', description: 'Управляемое значение.', control: false },
    { name: 'onChange', type: 'function', signature: '(event: ChangeEvent<HTMLSelectElement>) => void', description: 'Новый выбор.', control: false },
    { name: 'name', type: 'string', description: 'Имя поля в форме.', control: false },
  ],
  slots: [{ name: 'native-select', description: 'Капсула поля вокруг select.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Рамка 1 px input, двойной шеврон fg-3.' },
    { id: 'hover', label: 'наведение', description: 'Рамка fg-3.' },
    { id: 'focus', label: 'фокус', description: 'Рамка и кольцо ring.' },
    { id: 'invalid', label: 'ошибка', description: 'Рамка danger.', props: { invalid: true } },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %, фон surface-2.', props: { disabled: true } },
  ],
  matrix: { rowProp: 'size' },
  keyboard: [
    { keys: ['Space', 'Alt + ↓'], action: 'Открывают системный список' },
    { keys: ['↑', '↓'], action: 'Меняют значение без открытия (Windows, Linux)' },
    { keys: ['А–Я'], action: 'Набор прыгает к пункту' },
  ],
  a11y: [
    'Это настоящий select: доступность, автозаполнение и отправка формы — от браузера.',
    'Внутри Field подпись, описание и ошибка связываются сами.',
    'В мобильных формах предпочитайте его выпадающему списку: системный пикер удобнее пальцем.',
  ],
  motion: [
    { label: 'Рамка', value: '100 мс · ease-hover' },
    { label: 'Список', value: 'рисует система' },
  ],
  examples: [
    { id: 'currency', title: 'В форме', description: 'Подпись и описание через Field.' },
    { id: 'sizes', title: 'Три размера', description: 'sm 32, md 36 и lg 44 для касания.' },
  ],
};

export default meta;
