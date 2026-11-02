import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'pull-to-refresh',
  status: 'beta',
  title: 'Обновление жестом',
  description: 'Потянуть список вниз от верха: кольцо заполняется, на пороге замыкается, после отпускания — спиннер и итог плашкой. Ошибка — полоса с «Повторить», данные остаются.',
  category: 'feedback',
  paperBoard: '1DQN-0',
  anatomy: ['Кольцо 28, штрих 2,5', 'Подпись «Отпустите, чтобы обновить»', 'Плашка итога', 'Полоса ошибки danger-soft'],
  related: ['swipe-actions', 'spinner', 'toast'],
  source: { file: 'components/pull-to-refresh.tsx', exports: ['PullToRefresh', 'pullDistance'] },
  dependencies: { npm: ['lucide-react'], registry: ['spinner'] },
  props: [
    { name: 'onRefresh', type: 'function', signature: '() => Promise<ReactNode>', required: true, description: 'Перезагрузка; верните короткий итог — «1 новая сделка» — или ничего для «Обновлено».' },
    { name: 'children', type: 'node', required: true, control: false, description: 'Прокручиваемый список.' },
  ],
  slots: [
    { name: 'pull-to-refresh', description: 'Корень.' },
    { name: 'pull-to-refresh-indicator', description: 'Кольцо и подпись.' },
    { name: 'pull-to-refresh-area', description: 'Прокручиваемая область.' },
  ],
  states: [
    { id: 'rest', label: 'покой', description: 'Индикатор скрыт до 16 pt хода.' },
    { id: 'loading', label: 'обновление', description: 'Спиннер на 56, минимум 600 мс.' },
    { id: 'invalid', label: 'ошибка', description: 'Полоса danger-soft с «Повторить» 44.' },
  ],
  keyboard: [],
  a11y: ['Ход объявляется статусом: «Обновляем…», «Обновлено», «Не удалось обновить».', 'Жест только для касания — дублируйте обновление кнопкой в шапке.'],
  motion: [
    { label: 'Ход', value: '1:1 до 88, дальше сопротивление 0,4 до 160' },
    { label: 'Возврат', value: '300 мс · ease-fluid', tokens: ['duration-slow'] },
    { label: 'Итог', value: 'плашка 1,2 с' },
  ],
  examples: [
    { id: 'deals', title: 'Сделки', description: 'Новая сделка появляется сверху, плашка «1 новая сделка».' },
    { id: 'error', title: 'Ошибка', description: 'Полоса с «Повторить».' },
  ],
};

export default meta;
