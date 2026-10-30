import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'popover',
  status: 'stable',
  title: 'Поповер',
  description: 'Немодальная панель у кнопки: быстрая настройка, заметка, ссылка. Закрывается щелчком вне.',
  category: 'overlays',
  paperBoard: '1GY-0',
  anatomy: ['Триггер', 'Панель 320 px r20', 'Заголовок', 'Описание', 'Содержимое и действия'],
  related: ['tooltip', 'hover-card', 'menu', 'dialog'],
  source: {
    file: 'components/popover.tsx',
    exports: ['Popover', 'PopoverTrigger', 'PopoverContent', 'PopoverTitle', 'PopoverDescription', 'PopoverClose'],
  },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  propsOf: 'PopoverContent',
  props: [
    { name: 'side', type: 'enum', options: ['top', 'bottom', 'left', 'right'], default: 'bottom', description: 'Сторона от триггера; у края экрана переворачивается.' },
    { name: 'align', type: 'enum', options: ['start', 'center', 'end'], default: 'center', description: 'Выравнивание вдоль триггера.' },
    { name: 'sideOffset', type: 'number', options: [4, 8, 12], default: 8, description: 'Отступ от триггера, px.' },
  ],
  slots: [
    { name: 'popover-trigger', description: 'Триггер.' },
    { name: 'popover', description: 'Панель.' },
  ],
  states: [{ id: 'open', label: 'открыто', description: 'Панель у триггера, тень overlay.' }],
  keyboard: [
    { keys: ['Enter', 'Space'], action: 'Открывают с триггера' },
    { keys: ['Esc'], action: 'Закрывает, фокус возвращается на триггер' },
  ],
  a11y: ['Триггер получает aria-expanded и aria-controls.', 'Фокус переходит в панель; Tab за её пределы закрывает поповер.'],
  motion: [
    { label: 'Открытие', value: 'прозрачность и scale .96 + 4 px от триггера · 150 мс · ease-out' },
    { label: 'Закрытие', value: 'прозрачность · 100 мс' },
  ],
  examples: [
    { id: 'reminder', title: 'Напоминание', description: 'Заголовок, описание и два действия.' },
    { id: 'share', title: 'Поделиться', description: 'Ссылка и переключатель доступа в панели.' },
  ],
};

export default meta;
