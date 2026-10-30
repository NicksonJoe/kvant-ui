import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'button-group',
  status: 'stable',
  title: 'Группа кнопок',
  description: 'Связанные действия в одной капсуле с волосяными разделителями. Кнопка с меню — частный случай.',
  category: 'actions',
  paperBoard: '5HU-0',
  anatomy: ['Капсула-панель', 'Сегмент', 'Разделитель', 'Сегмент-иконка'],
  related: ['button', 'menu', 'segmented-control', 'toggle-group'],
  source: { file: 'components/button.tsx', exports: ['ButtonGroup', 'ButtonGroupItem'] },
  dependencies: { npm: ['@base-ui/react'], registry: ['button'] },
  props: [
    { name: 'variant', type: 'enum', options: ['secondary', 'primary'], default: 'secondary', description: 'secondary — нейтральная панель, primary — основное действие с вариантами.' },
    { name: 'size', type: 'enum', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md', description: 'Высота всех сегментов, как у Button.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Отключает все сегменты.' },
    { name: 'aria-label', type: 'string', description: 'Название группы для экранного диктора.', control: false },
  ],
  parts: [
    {
      name: 'ButtonGroupItem',
      description: 'Сегмент группы — кнопка панели инструментов.',
      props: [
        { name: 'iconOnly', type: 'boolean', default: false, description: 'Квадратный сегмент под одну иконку; нужен aria-label.' },
        { name: 'disabled', type: 'boolean', default: false, description: 'Отключает сегмент.' },
      ],
    },
  ],
  slots: [
    { name: 'button-group', description: 'Капсула-панель (role="toolbar").' },
    { name: 'button-group-item', description: 'Сегмент.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Одна внешняя форма, сегменты разделены волосяной линией.' },
    { id: 'hover', label: 'наведение', description: 'Фон сегмента на шаг темнее.' },
    { id: 'pressed', label: 'нажатие', description: 'Фон сегмента control-pressed или accent-pressed.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо внутри сегмента, чтобы не наезжать на соседей.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: { rowProp: 'variant' },
  keyboard: [
    { keys: ['←', '→'], action: 'Переходят между сегментами' },
    { keys: ['Tab'], action: 'Выводит фокус из группы' },
    { keys: ['Enter', 'Space'], action: 'Нажимают сегмент' },
  ],
  a11y: [
    'Группа — панель инструментов (role="toolbar"): в порядке Tab она занимает одну остановку.',
    'Сегментам-иконкам нужен aria-label, а группе — название через aria-label.',
    'Кнопка меню в группе получает aria-expanded и держит нажатый фон, пока меню открыто.',
  ],
  motion: [{ label: 'Наведение и нажатие', value: 'цвет фона 75 мс · ease-hover, без масштаба' }],
  examples: [
    { id: 'navigation', title: 'Навигация по периоду', description: 'Назад, сегодня, вперёд — три связанных действия.' },
    { id: 'split', title: 'Кнопка с меню', description: 'Основное действие и стрелка с вариантами.' },
  ],
};

export default meta;
