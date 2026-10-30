import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'scroll-area',
  status: 'stable',
  title: 'Область прокрутки',
  description:
    'Одна прокрутка во всём интерфейсе. Затухание у края показывает, что содержимое продолжается, и появляется только с той стороны, где оно есть. Полоса тонкая и прячется, пока к ней не потянулись.',
  category: 'content',
  paperBoard: '1GJ-0',
  anatomy: ['Область', 'Затухание: сверху 24, снизу 32', 'Полоса: бегунок 4 fg-4 / 60 %', 'При наведении: 6 fg-4 и дорожка 8 fill-2', 'Отступ от края 3'],
  related: ['list', 'card', 'carousel'],
  source: { file: 'components/scroll-area.tsx', exports: ['ScrollArea'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'orientation', type: 'enum', options: ['vertical', 'horizontal', 'both'], default: 'vertical', description: 'Направление прокрутки; both — две полосы и без затухания.' },
    { name: 'fade', type: 'boolean', default: true, description: 'Затухание краёв там, где содержимое продолжается.' },
    { name: 'className', type: 'string', description: 'Класс корня: задайте высоту (или ширину).', control: false },
  ],
  slots: [{ name: 'scroll-area', description: 'Корень; внутри — область просмотра и полосы.' }],
  states: [
    { id: 'rest', label: 'в начале', description: 'Сверху затухания нет, снизу — 32.' },
    { id: 'hover', label: 'наведение на полосу', description: 'Бегунок 6 fg-4 и дорожка 8 fill-2.' },
    { id: 'pressed', label: 'перетаскивание', description: 'Бегунок fg-3.' },
  ],
  keyboard: [{ keys: ['↑', '↓', 'PageUp', 'PageDown', 'Space'], action: 'Прокручивают область, когда фокус внутри' }],
  a11y: [
    'Прокрутка остаётся нативной: колесо, тачпад, клавиши и экранная лупа работают как обычно.',
    'Затухание — маска, а не наложение: текст под ним выделяется и читается.',
  ],
  motion: [
    { label: 'Затухание', value: 'растёт с расстоянием до края (до 24 / 32 px)' },
    { label: 'Полоса', value: 'появляется при прокрутке за 150 мс, прячется через 1000 мс покоя за 300 мс' },
    { label: 'Ширина бегунка', value: '4 → 6, 100 мс ease-hover' },
  ],
  examples: [
    { id: 'members', title: 'Участники проекта', description: 'Список в карточке с затуханием краёв.' },
    { id: 'horizontal', title: 'Горизонтальная', description: 'Лента фильтров в одну строку.' },
  ],
};

export default meta;
