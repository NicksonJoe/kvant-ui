import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'hover-card',
  status: 'stable',
  title: 'Карточка при наведении',
  description: 'Превью человека или записи при наведении на упоминание. Повторяет то, что есть по ссылке, поэтому на касании не нужна.',
  category: 'overlays',
  paperBoard: '1GY-0',
  anatomy: ['Упоминание-ссылка', 'Карточка 300 px r20', 'Аватар 48', 'Имя и роль', 'Описание', 'Цифры', 'Действия sm'],
  related: ['popover', 'tooltip', 'avatar', 'skeleton'],
  source: { file: 'components/popover.tsx', exports: ['HoverCard', 'HoverCardTrigger', 'HoverCardContent'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  propsOf: 'HoverCardContent',
  props: [
    { name: 'side', type: 'enum', options: ['top', 'bottom', 'left', 'right'], default: 'bottom', description: 'Сторона от упоминания; у края экрана переворачивается.' },
    { name: 'align', type: 'enum', options: ['start', 'center', 'end'], default: 'start', description: 'Выравнивание вдоль упоминания.' },
    { name: 'sideOffset', type: 'number', options: [4, 8, 12], default: 8, description: 'Отступ от упоминания, px.' },
  ],
  parts: [
    {
      name: 'HoverCardTrigger',
      description: 'Ссылка-упоминание 14/20 500 с подчёркиванием; внутри можно поставить аватар 20.',
      props: [
        { name: 'href', type: 'string', required: true, description: 'Куда ведёт упоминание — карточка лишь превью.' },
        { name: 'delay', type: 'number', default: 600, description: 'Задержка открытия, мс.' },
        { name: 'closeDelay', type: 'number', default: 300, description: 'Задержка закрытия, мс: курсор успевает перейти на карточку.' },
      ],
    },
  ],
  slots: [
    { name: 'hover-card-trigger', description: 'Упоминание.' },
    { name: 'hover-card', description: 'Карточка; aria-busy, пока данные грузятся.' },
  ],
  states: [
    { id: 'open', label: 'открыто', description: 'Через 600 мс наведения или фокуса; закрывается через 300 мс после ухода курсора.' },
    { id: 'loading', label: 'загрузка', description: 'Скелетоны держат размер карточки, потом содержимое проявляется без сдвига.' },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Фокус на упоминании открывает карточку' },
    { keys: ['Esc'], action: 'Закрывает' },
    { keys: ['Enter'], action: 'Переходит по ссылке' },
  ],
  a11y: [
    'Упоминание остаётся обычной ссылкой — всё из карточки должно быть доступно по ней.',
    'Карточка не перехватывает фокус; действия в ней — дубли, а не единственный путь.',
    'Пока данные грузятся, на карточке стоит aria-busy.',
  ],
  motion: [
    { label: 'Открытие', value: 'через 600 мс · прозрачность, scale .96 и сдвиг 4 px · 150 мс · ease-out' },
    { label: 'Закрытие', value: 'через 300 мс · прозрачность 100 мс' },
    { label: 'Скелетон → содержимое', value: 'crossfade 150 мс без сдвига' },
  ],
  examples: [
    { id: 'person', title: 'Человек', description: 'Аватар со статусом, роль, цифры и действия.' },
    { id: 'company', title: 'Компания с загрузкой', description: 'Скелетоны держат высоту, пока данные приходят.' },
  ],
};

export default meta;
