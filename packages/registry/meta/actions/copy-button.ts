import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'copy-button',
  status: 'stable',
  title: 'Кнопка копирования',
  description: 'Копирует ссылку, ключ или номер и подтверждает галочкой на две секунды. Круг 28 в поле или кнопка с подписью.',
  category: 'actions',
  paperBoard: '5HU-0',
  anatomy: ['Кнопка: круг 28 или sm с подписью', 'Иконка «копировать» → галочка', 'Подсказка', 'Объявление для экранного диктора'],
  related: ['button', 'input', 'code-block', 'tooltip'],
  source: { file: 'components/copy-button.tsx', exports: ['CopyButton'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['button', 'tooltip'] },
  props: [
    { name: 'value', type: 'string', required: true, description: 'Что попадёт в буфер обмена.' },
    { name: 'label', type: 'string', description: 'Подпись кнопки («Копировать»). Без неё — круг 28 с подсказкой; ширина кнопки с подписью не прыгает (min-width 140).' },
    { name: 'aria-label', type: 'string', default: 'Копировать', description: 'Название кнопки-иконки и текст её подсказки.' },
    { name: 'disabled', type: 'boolean', default: false, description: 'Недоступна.' },
    { name: 'onCopied', type: 'function', signature: '(value: string) => void', description: 'После удачного копирования.', control: false },
  ],
  slots: [{ name: 'copy-button', description: 'Кнопка-иконка; несёт data-copied, пока видна галочка.' }],
  states: [
    { id: 'rest', label: 'покой', description: 'Иконка fg-2 без фона.' },
    { id: 'hover', label: 'наведение', description: 'Фон fill-2, иконка fg-1, подсказка «Копировать ссылку».' },
    { id: 'pressed', label: 'нажатие', description: 'Фон fill-3, масштаб 0,94.' },
    { id: 'focus', label: 'фокус', description: 'Кольцо 2 px ring.' },
    { id: 'disabled', label: 'отключено', description: 'Прозрачность 50 %.', props: { disabled: true } },
  ],
  matrix: {
    rows: [
      { label: 'иконка', props: {} },
      { label: 'с подписью', props: { label: 'Копировать' } },
    ],
  },
  keyboard: [{ keys: ['Enter', 'Space'], action: 'Копирует' }],
  a11y: [
    '«Скопировано» объявляется вежливо (role="status") — на касании подсказок нет, а результат нужно услышать.',
    'Подсказка не исчезает, а меняет текст на «Скопировано».',
    'Если буфер обмена недоступен (страница без HTTPS, запрет браузера), диктор услышит «Не удалось скопировать».',
  ],
  motion: [
    { label: 'Иконка → галочка', value: 'кросс-фейд и scale .8 → 1, 150 мс · ease-out' },
    { label: 'Возврат', value: 'через 2000 мс' },
    { label: 'Сниженное движение', value: 'без масштаба, только прозрачность' },
  ],
  examples: [
    { id: 'in-field', title: 'В поле', description: 'Ссылка-приглашение только для чтения: круг 28 справа, концентрично капсуле.' },
    { id: 'labelled', title: 'С подписью', description: 'Подпись меняется на «Скопировано», ширина держится.' },
  ],
};

export default meta;
