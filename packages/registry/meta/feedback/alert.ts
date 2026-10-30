import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'alert',
  status: 'stable',
  title: 'Оповещение',
  description:
    'Сообщение внутри контента, рядом с тем, к чему относится, — не исчезает само. Баннер — его версия для всего продукта на верхнем краю окна.',
  category: 'feedback',
  paperBoard: '6IR-0',
  anatomy: ['Контейнер r16', 'Иконка тона 20', 'Заголовок 14/20 600', 'Текст 14/20', 'Действие sm'],
  related: ['toast', 'alert-dialog', 'badge'],
  source: { file: 'components/alert.tsx', exports: ['Alert', 'Banner', 'ALERT_TONES', 'ALERT_VARIANTS', 'BANNER_TONES'] },
  dependencies: { npm: ['lucide-react'], registry: [] },
  props: [
    {
      name: 'tone',
      type: 'enum',
      options: ['accent', 'success', 'warning', 'danger', 'neutral'],
      default: 'accent',
      description: 'Цвет фона и иконки. Цвет несёт тон — никакой полосы слева.',
    },
    { name: 'variant', type: 'enum', options: ['soft', 'outline'], default: 'soft', description: 'Мягкий фон тона или surface-1 с волосяной рамкой.' },
    { name: 'title', type: 'string', signature: 'ReactNode', description: 'Что случилось: «Платёж не прошёл».' },
    { name: 'icon', type: 'node', description: 'Своя иконка 20 px вместо иконки тона.', control: false },
    { name: 'action', type: 'node', description: 'Обычно <Button size="sm" variant="secondary">.', control: false },
  ],
  parts: [
    {
      name: 'Banner',
      description: 'Сообщение для всего продукта: h44 во всю ширину, по центру; ставьте первым на странице. Один за раз, важнейший сверху.',
      props: [
        { name: 'tone', type: 'enum', options: ['accent', 'warning', 'danger', 'inverse'], default: 'accent', description: 'Тон баннера.' },
        { name: 'icon', type: 'node', description: 'Иконка 16 px.' },
        {
          name: 'onDismiss',
          type: 'function',
          signature: '() => void',
          description: 'Показывает ×; вызывается, когда баннер свернулся. Опасный не закрывается — он живёт, пока есть проблема.',
        },
      ],
    },
  ],
  slots: [
    { name: 'alert', description: 'Оповещение; несёт data-tone и data-variant.' },
    { name: 'banner', description: 'Баннер; data-state="closing" на время сворачивания.' },
  ],
  states: [{ id: 'rest', label: 'покой', description: 'Мягкий фон тона или surface-1 с рамкой; иконка в цвете тона.' }],
  keyboard: [{ keys: ['Tab'], action: 'Переходит к действию и крестику' }],
  a11y: [
    'role="alert" только у опасного тона — экранный диктор зачитает его сразу; остальные — обычный текст страницы.',
    'Тон всегда дублирован иконкой и словами, не только цветом.',
    'Крестик баннера — кнопка «Закрыть баннер».',
  ],
  motion: [
    { label: 'Оповещение', value: 'появляется вместе с содержимым, без своей анимации' },
    { label: 'Закрытие баннера', value: 'высота 44 → 0 · 150 мс · ease-standard, страница поднимается' },
  ],
  examples: [
    { id: 'tones', title: 'Тона', description: 'Акцент, успех, внимание, опасность и нейтральный с действием.' },
    { id: 'outline', title: 'Контурные', description: 'Спокойные пояснения в формах и настройках.' },
    { id: 'banner', title: 'Баннеры', description: 'Плановые работы, тариф, нет связи и новости.' },
  ],
};

export default meta;
