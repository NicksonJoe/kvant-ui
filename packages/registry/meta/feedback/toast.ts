import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'toast',
  status: 'stable',
  title: 'Уведомление',
  description:
    'Короткое сообщение о результате без остановки работы: успех, ошибка, «Отменить». Стопка до трёх; ошибки и тосты с действием живут 8 секунд.',
  category: 'feedback',
  paperBoard: '6IR-0',
  anatomy: ['Стеклянная плашка 360 px', 'Иконка статуса', 'Заголовок', 'Описание', 'Действие', 'Крестик'],
  related: ['alert', 'alert-dialog', 'progress'],
  source: { file: 'components/toast.tsx', exports: ['ToastProvider', 'toast', 'useToasts'] },
  dependencies: { npm: ['@base-ui/react', 'lucide-react'], registry: ['spinner'] },
  propsOf: 'toast',
  props: [
    { name: 'type', type: 'enum', options: ['success', 'warning', 'danger', 'info', 'loading'], default: 'success', description: 'Иконка статуса. toast.promise ставит loading, success и error сам.' },
    { name: 'title', type: 'string', required: true, description: 'Что произошло: «Сделка сохранена».' },
    { name: 'description', type: 'string', description: 'Подробность одной строкой.' },
    { name: 'actionProps', type: 'object', signature: '{ children: ReactNode; onClick: () => void }', description: 'Кнопка-ссылка, обычно «Отменить».', control: false },
  ],
  parts: [
    {
      name: 'ToastProvider',
      description: 'Ставится один раз в корне приложения; стопка в правом нижнем углу в 24 px от краёв, на телефоне — сверху по центру.',
      props: [
        {
          name: 'timeout',
          type: 'number',
          default: 4000,
          description: 'Через сколько мс скрыть; ошибки и тосты с действием — 8000. На наведении, фокусе и скрытой вкладке таймер стоит.',
        },
      ],
    },
  ],
  slots: [
    { name: 'toast-viewport', description: 'Область стопки.' },
    { name: 'toast', description: 'Уведомление.' },
  ],
  states: [
    { id: 'rest', label: 'в стопке', description: 'Задние уведомления уменьшены до .95 и .90 и выглядывают на 8 px.' },
    { id: 'expanded', label: 'раскрыто', description: 'Наведение или фокус раскрывает стопку.' },
    { id: 'loading', label: 'загрузка', description: 'Спиннер вместо иконки, пока промис не завершится; потом тот же тост меняет содержимое.' },
  ],
  keyboard: [
    { keys: ['F6'], action: 'Переводит фокус в область уведомлений' },
    { keys: ['Esc'], action: 'Закрывает уведомление в фокусе' },
  ],
  a11y: [
    'Область уведомлений — живой регион (polite): экранный диктор читает новое сообщение, не забирая фокус; ошибки — сразу (assertive).',
    'Таймер останавливается на наведении и фокусе, чтобы успеть прочитать и нажать «Отменить».',
    'Не кладите в уведомление единственный путь к важному действию — оно исчезнет.',
  ],
  motion: [
    { label: 'Появление', value: 'снизу на 16 px и прозрачность · 350 мс · ease-fluid' },
    { label: 'Уход', value: 'прозрачность и 8 px · 200 мс' },
    { label: 'Стопка', value: 'scale .95 / .90, сдвиг 8 px; раскрытие и сворачивание — 400 мс · ease-fluid' },
    { label: 'Промис', value: 'смена иконки crossfade 150 мс' },
    { label: 'Смахивание', value: 'вправо или вниз (на телефоне — вверх), быстрее 0,11 px/мс' },
    { label: 'Таймер', value: '4000 мс, ошибки и с действием — 8000 мс' },
  ],
  examples: [
    { id: 'types', title: 'Типы', description: 'Успех, предупреждение, ошибка и информация.' },
    { id: 'undo', title: 'С отменой', description: 'Обратимое действие выполняется сразу, а уведомление даёт «Отменить».' },
    { id: 'promise', title: 'Долгая операция', description: 'toast.promise показывает загрузку и итог.' },
  ],
};

export default meta;
