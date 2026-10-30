import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'alert-dialog',
  status: 'stable',
  title: 'Подтверждение',
  description: 'Прерывает работу, чтобы подтвердить важное или необратимое действие. Закрывается только явным выбором.',
  category: 'overlays',
  paperBoard: 'DHN-0',
  anatomy: ['Подложка', 'Панель 400 px', 'Круг с иконкой', 'Заголовок-вопрос', 'Последствия', '«Отмена» и действие'],
  related: ['dialog', 'toast', 'button'],
  source: {
    file: 'components/dialog.tsx',
    exports: ['AlertDialog', 'AlertDialogTrigger', 'AlertDialogContent', 'AlertDialogTitle', 'AlertDialogDescription', 'AlertDialogClose'],
  },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  propsOf: 'AlertDialogContent',
  props: [
    { name: 'tone', type: 'enum', options: ['danger', 'accent'], default: 'danger', description: 'Цвет круга с иконкой.' },
    { name: 'icon', type: 'node', description: 'Иконка 20 px в круге 40 px.', control: false },
  ],
  slots: [{ name: 'alert-dialog', description: 'Панель подтверждения.' }],
  states: [{ id: 'open', label: 'открыто', description: 'Подложка не закрывает — нужен выбор.' }],
  keyboard: [
    { keys: ['Tab'], action: 'Между «Отмена» и действием' },
    { keys: ['Esc'], action: 'Отменяет' },
  ],
  a11y: [
    'role="alertdialog": экранный диктор сразу читает заголовок и последствия.',
    'Заголовок — вопрос («Удалить сделку?»), кнопка — тот же глагол («Удалить»), а не «Да».',
    'Если действие можно отменить, лучше выполнить его сразу и показать уведомление с «Отменить».',
  ],
  motion: [
    { label: 'Панель', value: 'прозрачность и scale .96 · 200 мс · ease-out' },
    { label: 'Закрытие', value: '150 мс' },
    { label: 'Кнопка при совпадении', value: 'включается прозрачностью · 100 мс · ease-hover' },
  ],
  examples: [
    { id: 'delete', title: 'Удаление', description: 'Опасное действие: круг danger, кнопка danger.' },
    { id: 'send', title: 'Отправка клиенту', description: 'Тон accent для важного, но не опасного шага.' },
    { id: 'type-to-confirm', title: 'Ввод названия', description: 'Необратимое: кнопка ждёт точного совпадения.' },
  ],
};

export default meta;
