import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'tab-bar',
  status: 'stable',
  title: 'Таб-бар',
  description:
    'Разделы приложения внизу экрана телефона в духе iOS 26: плавающая стеклянная капсула в 16 от краёв и отдельный круг поиска. Выбранная вкладка — акцентный цвет и подложка fill-2; при прокрутке вниз бар сворачивается до выбранной вкладки.',
  category: 'navigation',
  paperBoard: '1M9-0',
  anatomy: ['Стеклянная капсула h62, padding 4', 'Вкладка 54, r full', 'Иконка 24 и подпись 10/12 500', 'Подложка выбранной fill-2', 'Счётчик 18 danger', 'Круг действия 62'],
  related: ['sidebar', 'tabs', 'indicator', 'topbar'],
  source: { file: 'components/tab-bar.tsx', exports: ['TabBar', 'TabBarItem', 'TabBarCenter', 'TabBarAction'] },
  dependencies: { npm: ['@base-ui/react'], registry: ['indicator'] },
  props: [
    { name: 'aria-label', type: 'string', required: true, description: 'Название навигации: «Разделы приложения».', control: false },
    { name: 'minimized', type: 'boolean', default: false, description: 'Свёрнут до текущей вкладки, пока страницу листают вниз.' },
    { name: 'action', type: 'node', description: 'Отдельный стеклянный круг справа, обычно TabBarAction с поиском.', control: false },
  ],
  parts: [
    {
      name: 'TabBarItem',
      description: 'Вкладка: ссылка по умолчанию; для роутера — render={<Link to="…" />}.',
      props: [
        { name: 'icon', type: 'node', required: true, description: 'Иконка 24, штрих 1,5.' },
        { name: 'label', type: 'string', required: true, description: 'Подпись 10/12.' },
        { name: 'count', type: 'number', description: 'Счётчик непрочитанного на иконке; читается как «Входящие, 4 новых».' },
        { name: 'active', type: 'boolean', description: 'Текущий раздел: accent и aria-current="page".' },
      ],
    },
    {
      name: 'TabBarCenter',
      description: 'Слот 64 между вкладками для лица агента: AgentAvatar 56. В свёрнутом баре скрыт.',
      props: [{ name: 'aria-label', type: 'string', required: true, description: 'Название кнопки: «Агент Норды».' }],
    },
    { name: 'TabBarAction', description: 'Стеклянный круг 62 рядом с баром.', props: [{ name: 'icon', type: 'node', required: true, description: 'Иконка 24.' }, { name: 'aria-label', type: 'string', required: true, description: 'Название действия.' }] },
  ],
  slots: [
    { name: 'tab-bar', description: 'Навигация; data-minimized в свёрнутом виде.' },
    { name: 'tab-bar-center', description: 'Слот по центру.' },
    { name: 'tab-bar-action', description: 'Круг действия.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Иконка и подпись fg-1.' },
    { id: 'pressed', label: 'нажатие', description: 'fill-1, масштаб 0,97.' },
    { id: 'selected', label: 'выбрано', description: 'accent, капсула fill-2.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо ring, отступ 2 (клавиатура iPad).' },
    { id: 'collapsed', label: 'свёрнуто', description: 'Остаётся только текущая вкладка в круге 62.', props: { minimized: true } },
  ],
  keyboard: [
    { keys: ['Tab'], action: 'Идёт по вкладкам и кругу действия' },
    { keys: ['Enter'], action: 'Открывает раздел' },
  ],
  a11y: [
    'Навигация с названием; текущая вкладка — aria-current="page".',
    'Счётчик скрыт от экранного диктора и читается в названии вкладки: «Входящие, 4 новых».',
    'Стекло только на плавающем баре — никогда на контенте под ним.',
  ],
  motion: [
    { label: 'Подложка выбранной вкладки', value: 'перетекает, spring-snappy 0,30 / 0,10' },
    { label: 'Сворачивание при прокрутке вниз', value: '250 мс ease-fluid' },
    { label: 'Счётчик', value: 'появление spring-bouncy' },
  ],
  examples: [
    { id: 'app', title: 'Приложение', description: 'Четыре вкладки, счётчик и круг поиска над списком сделок.' },
    { id: 'minimized', title: 'Свёрнут при прокрутке', description: 'Листайте список вниз — бар сворачивается до текущей вкладки.' },
    { id: 'agent', title: 'С агентом по центру', description: 'Норда на телефоне: лицо агента между разделами.' },
  ],
};

export default meta;
