import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'card',
  status: 'stable',
  title: 'Карточка',
  description: 'Группирует связанное содержимое и действия. Высота задана один раз: волосяное кольцо и микротень. Карточки не вкладываются.',
  category: 'data-display',
  paperBoard: '1GX-0',
  anatomy: ['Поверхность r20', 'Шапка: заголовок, описание, действие', 'Содержимое', 'Подвал'],
  related: ['list', 'data-list', 'separator', 'empty-state'],
  source: { file: 'components/card.tsx', exports: ['Card', 'CardHeader'] },
  dependencies: { npm: [], registry: [] },
  props: [
    { name: 'variant', type: 'enum', options: ['raised', 'flat', 'outline', 'interactive'], default: 'raised', description: 'raised — на фоне страницы, flat — внутри панели, outline — только кольцо, interactive — целиком нажимается.' },
    { name: 'padding', type: 'enum', options: ['compact', 'default', 'spacious'], default: 'default', description: 'Внутренний отступ 16 / 20 / 24 px.' },
  ],
  parts: [
    {
      name: 'CardHeader',
      description: 'Заголовок 16/24 semibold, описание fg-3 и действие справа.',
      props: [
        { name: 'title', type: 'node', required: true, description: 'Заголовок.' },
        { name: 'description', type: 'node', description: 'Описание.' },
        { name: 'action', type: 'node', description: 'Обычно IconButton size="sm" variant="ghost".' },
      ],
    },
  ],
  slots: [
    { name: 'card', description: 'Поверхность; несёт data-variant.' },
    { name: 'card-header', description: 'Шапка.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Кольцо hairline и микротень.' },
    { id: 'hover', label: 'наведение', description: 'Только interactive: тень overlay.' },
    { id: 'pressed', label: 'нажатие', description: 'Только interactive: масштаб 0,98.' },
  ],
  matrix: { rowProp: 'variant' },
  keyboard: [],
  a11y: [
    'Карточка — просто контейнер. Если она целиком ссылка, сделайте ссылкой заголовок и растяните её на карточку.',
    'Не вкладывайте карточку в карточку: глубину показывайте отступами и разделителями.',
  ],
  motion: [
    { label: 'Наведение (interactive)', value: 'тень · 150 мс' },
    { label: 'Нажатие (interactive)', value: 'scale .98 · 75 мс · ease-out' },
  ],
  examples: [
    { id: 'deal', title: 'Сделка', description: 'Шапка с действием, сумма и участники.' },
    { id: 'variants', title: 'Варианты', description: 'Четыре вида поверхности.' },
    { id: 'kpi', title: 'Метрика', description: 'Число табличными цифрами и динамика бейджем.' },
  ],
};

export default meta;
