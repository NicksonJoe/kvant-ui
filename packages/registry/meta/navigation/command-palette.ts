import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'command-palette',
  status: 'stable',
  title: 'Командная палитра',
  description: 'Поиск и команды по ⌘K: стеклянная панель 640 px, группы, подсветка совпадений, подсказки клавиш.',
  category: 'navigation',
  paperBoard: '7O7-0',
  anatomy: ['Подложка', 'Стеклянная панель', 'Строка поиска с Esc', 'Группы', 'Пункт: иконка, название, подсказка, клавиша', 'Подвал с клавишами'],
  related: ['combobox', 'menu', 'dialog', 'kbd'],
  source: { file: 'components/command-palette.tsx', exports: ['CommandPalette', 'formatResultCount'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['badge', 'combobox'] },
  props: [
    { name: 'placeholder', type: 'string', default: 'Поиск и команды', description: 'Подсказка в строке поиска.' },
    { name: 'hotkey', type: 'boolean', default: true, description: '⌘K или Ctrl+K открывает и закрывает палитру — работает и в русской раскладке.' },
    { name: 'groups', type: 'object', required: true, signature: 'readonly { label: string; items: readonly CommandItem[] }[]', description: 'Группы пунктов: id, label, hint, icon, shortcut, keywords, onSelect.', control: false },
    { name: 'open', type: 'boolean', description: 'Управляемое открытие.', control: false },
    { name: 'onOpenChange', type: 'function', signature: '(open: boolean) => void', description: 'Открытие и закрытие.', control: false },
  ],
  slots: [{ name: 'command-palette', description: 'Панель палитры.' }],
  states: [
    { id: 'open', label: 'открыто', description: 'Без анимации — частое действие с клавиатуры.' },
    { id: 'highlighted', label: 'подсветка', description: 'Фон fill-2, первый пункт подсвечен сразу.' },
    { id: 'empty', label: 'пусто', description: '«Ничего не найдено» и совет, что попробовать.' },
  ],
  keyboard: [
    { keys: ['⌘K', 'Ctrl+K'], action: 'Открывает и закрывает' },
    { keys: ['↑', '↓'], action: 'Двигают подсветку' },
    { keys: ['Enter'], action: 'Выполняет пункт' },
    { keys: ['Esc'], action: 'Закрывает, фокус возвращается' },
  ],
  a11y: [
    'Панель — диалог с названием «Командная палитра», фокус внутри.',
    'Поле ведёт список через aria-activedescendant; количество результатов показано словами: «3 результата».',
    'Горячая клавиша зависит от физической клавиши, а не от раскладки.',
  ],
  motion: [{ label: 'Открытие', value: 'мгновенно (0 мс): палитру вызывают десятки раз в день' }],
  examples: [
    { id: 'commands', title: 'Поиск и команды', description: 'Разделы, действия и клиенты в одной палитре.' },
    { id: 'clients', title: 'Клиенты с подсказками', description: 'Аватары вместо иконок и ключевые слова для поиска.' },
  ],
};

export default meta;
