import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'phone-chrome',
  status: 'beta',
  title: 'Системные элементы телефона',
  description:
    'Статус-бар iOS 62 и полоска «Домой» 139 × 5 для макетов, демо и скриншотов экранов Норды на телефоне. В приложении их рисует система: здесь они нужны, чтобы экран в документации и в презентации выглядел как на iPhone. Цвет берут из fg-1, поэтому сами переходят в тёмную тему.',
  category: 'navigation',
  paperBoard: '17DW-1',
  anatomy: ['Статус-бар 402 × 62: время 17/22 600 и значки 82 × 22', 'Полоска «Домой» 139 × 5, r full, 8 от нижнего края'],
  related: ['tab-bar', 'topbar'],
  source: { file: 'components/phone-chrome.tsx', exports: ['PhoneStatusBar', 'PhoneHomeIndicator'] },
  dependencies: { npm: [], registry: [] },
  props: [{ name: 'time', type: 'string', default: '9:41', description: 'Время слева.' }],
  parts: [{ name: 'PhoneHomeIndicator', description: 'Полоска «Домой» у нижнего края экрана.', props: [] }],
  slots: [
    { name: 'phone-status-bar', description: 'Статус-бар.' },
    { name: 'phone-home-indicator', description: 'Полоска «Домой».' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'fg-1 текущей темы: в светлой тёмный, в тёмной светлый.' },
  ],
  keyboard: [],
  a11y: ['Оба элемента — украшение макета: aria-hidden, в обход фокуса не попадают.'],
  motion: [],
  examples: [
    { id: 'screen', title: 'Экран целиком', description: 'Статус-бар сверху и полоска «Домой» снизу у экрана сделок.' },
    { id: 'modes', title: 'Светлая и тёмная', description: 'Оба элемента в светлой и тёмной теме.' },
  ],
};

export default meta;
