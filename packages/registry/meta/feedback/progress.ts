import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'progress',
  status: 'stable',
  title: 'Прогресс',
  description: 'Сколько задачи уже сделано: линия с подписью и процентом или круг. Без значения — неопределённый.',
  category: 'feedback',
  paperBoard: 'APS-0',
  anatomy: ['Подпись и значение', 'Дорожка fill-2', 'Заполнение accent'],
  related: ['spinner', 'meter', 'skeleton', 'navigation-progress'],
  source: { file: 'components/progress.tsx', exports: ['Progress', 'ProgressCircle'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'value', type: 'number', options: [0, 24, 62, 100], default: 62, description: 'Значение от 0 до max; null — неопределённый прогресс.' },
    { name: 'label', type: 'string', signature: 'ReactNode', description: 'Подпись над линией; справа появится «62 %».' },
    { name: 'size', type: 'enum', options: ['sm', 'md', 'lg'], default: 'md', description: 'Толщина 4 / 6 / 8 px.' },
    { name: 'max', type: 'number', default: 100, description: 'Максимум.', control: false },
  ],
  parts: [
    {
      name: 'ProgressCircle',
      description: 'Круговой прогресс 20–64 px; без значения вращается.',
      props: [
        { name: 'size', type: 'number', options: [20, 32, 48, 64], default: 32, description: 'Диаметр; толщина 3–5 px.' },
        { name: 'showValue', type: 'boolean', default: false, description: 'Процент в центре (48 и 64 px).' },
      ],
    },
  ],
  slots: [
    { name: 'progress', description: 'Линейный прогресс (role="progressbar").' },
    { name: 'progress-circle', description: 'Круговой прогресс.' },
  ],
  states: [
    { id: 'rest', label: 'идёт', description: 'Заполнение accent, табличные цифры.' },
    { id: 'loading', label: 'неопределённо', description: 'Отрезок 30 % бежит по дорожке за 1500 мс.' },
  ],
  keyboard: [],
  a11y: [
    'role="progressbar" с aria-valuenow и текстом значения «62 %».',
    'Подпись связана с полосой — экранный диктор читает, что именно грузится.',
  ],
  motion: [
    { label: 'Заполнение', value: 'ширина · 300 мс · ease-standard' },
    { label: 'Неопределённый', value: '1500 мс · ease-in-out, по кругу' },
    { label: 'Сниженное движение', value: 'значение меняется так же — это информация, а не украшение' },
  ],
  examples: [
    { id: 'import', title: 'Импорт контактов', description: 'Подпись слева, процент справа.' },
    { id: 'circle', title: 'Круговой', description: 'Четыре размера; в больших — процент в центре.' },
    { id: 'indeterminate', title: 'Неопределённый', description: 'Когда объём работы неизвестен.' },
  ],
};

export default meta;
