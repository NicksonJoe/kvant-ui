import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'meter',
  status: 'stable',
  title: 'Шкала',
  description:
    'Заполненность ресурса, а не ход процесса: место, места в тарифе, лимиты. Пороги делят шкалу на зоны, и вся полоса принимает цвет текущей.',
  category: 'feedback',
  paperBoard: 'APS-0',
  anatomy: ['Подпись и значение', 'Шкала h8 из трёх капсул с зазором 2', 'Заполнение в цвете зоны', 'Риски порогов', 'Статус'],
  related: ['progress', 'chart', 'badge'],
  source: { file: 'components/progress.tsx', exports: ['Meter'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'value', type: 'number', options: [42, 72, 93], default: 42, required: true, description: 'Значение от min до max.' },
    { name: 'label', type: 'string', signature: 'ReactNode', description: 'Что измеряем: «Хранилище».' },
    { name: 'valueLabel', type: 'string', description: 'Конец строки подписи и текст для диктора: «4,2 из 10 ГБ». По умолчанию — процент.' },
    { name: 'status', type: 'string', signature: 'ReactNode', description: 'Строка под шкалой в цвете зоны.' },
    {
      name: 'thresholds',
      type: 'object',
      signature: 'readonly [number, number]',
      description: 'Границы зон в % диапазона: до первой — норма, до второй — внимание, выше — опасность. По умолчанию 60 и 85.',
      control: false,
    },
    { name: 'min', type: 'number', default: 0, description: 'Минимум.', control: false },
    { name: 'max', type: 'number', default: 100, description: 'Максимум.', control: false },
  ],
  slots: [{ name: 'meter', description: 'Корень (role="meter"); data-zone="normal" | "warning" | "critical".' }],
  states: [{ id: 'rest', label: 'значение', description: 'Зона по порогам: до 60 % success, 60–85 % warning, выше 85 % danger.' }],
  matrix: { columnProp: 'value' },
  keyboard: [],
  a11y: [
    'role="meter" с aria-valuenow; valueLabel становится aria-valuetext.',
    'Зона читается не только цветом: статус под шкалой говорит словами.',
    'Шкала не фокусируется — это информация, а не элемент управления.',
  ],
  motion: [
    { label: 'Заполнение', value: 'ширина · 300 мс · ease-standard' },
    { label: 'Смена зоны', value: 'цвет · 150 мс · ease-hover' },
    { label: 'Пульсация', value: 'нет: шкала сообщает, а не тревожит' },
  ],
  examples: [
    { id: 'quotas', title: 'Лимиты тарифа', description: 'Норма, внимание и превышение порога.' },
    { id: 'thresholds', title: 'Свои пороги', description: 'Бюджет в рублях и зоны 75 и 95 %.' },
  ],
};

export default meta;
