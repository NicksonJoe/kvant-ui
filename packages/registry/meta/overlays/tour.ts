import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'tour',
  status: 'stable',
  title: 'Тур',
  description: 'Знакомит с одной функцией за раз: затемнение с вырезом по форме цели и карточка шага рядом. Пять шагов или меньше, Esc завершает.',
  category: 'overlays',
  paperBoard: '1GY-0',
  anatomy: ['Затемнение scrim с вырезом', 'Карточка 320 px r20', 'Счётчик «2 из 4» и точки', 'Заголовок и текст', '«Пропустить», «Назад», «Далее»'],
  related: ['popover', 'dialog', 'steps'],
  source: { file: 'components/tour.tsx', exports: ['Tour'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['button'] },
  props: [
    {
      name: 'steps',
      type: 'object',
      required: true,
      signature: "readonly { target: string | (() => Element | null); title: ReactNode; description: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }[]",
      description: 'Шаги: цель (селектор или функция), заголовок, текст и сторона карточки.',
      control: false,
    },
    { name: 'open', type: 'boolean', description: 'Управляемое открытие.', control: false },
    { name: 'defaultOpen', type: 'boolean', default: false, description: 'Открыть сразу.', control: false },
    {
      name: 'onOpenChange',
      type: 'function',
      signature: '(open: boolean) => void',
      description: 'false — на «Готово», «Пропустить», × и Esc: запомните, что тур показан.',
    },
  ],
  slots: [
    { name: 'tour-spotlight', description: 'Вырез в затемнении: цель + 4 px, форма цели.' },
    { name: 'tour', description: 'Карточка шага.' },
  ],
  states: [{ id: 'open', label: 'открыто', description: 'Затемнение, вырез у цели, карточка в 12 px от выреза; страница вне выреза не нажимается.' }],
  keyboard: [
    { keys: ['→', '←'], action: 'Следующий и предыдущий шаг' },
    { keys: ['Enter'], action: 'На «Далее» — следующий шаг, на последнем — «Готово»' },
    { keys: ['Esc'], action: 'Завершает тур' },
  ],
  a11y: [
    'Карточка — диалог с заголовком шага; фокус при открытии на «Далее».',
    'Цель в вырезе остаётся нажимаемой, остальная страница — нет.',
    'Тур можно пропустить с любого шага, кроме последнего, и показывается он один раз.',
  ],
  motion: [
    { label: 'Вход', value: 'затемнение 200 мс; карточка — прозрачность, scale .96 и 8 px · 200 мс · ease-out' },
    { label: 'Следующий шаг', value: 'вырез переезжает 250 мс · ease-standard, текст карточки проявляется 150 мс' },
    { label: 'Esc', value: 'всё уходит прозрачностью 150 мс' },
  ],
  examples: [
    { id: 'deals', title: 'Первый вход', description: 'Три шага по экрану сделок.' },
    { id: 'whats-new', title: 'Что нового', description: 'Один шаг: только «Готово».' },
  ],
};

export default meta;
