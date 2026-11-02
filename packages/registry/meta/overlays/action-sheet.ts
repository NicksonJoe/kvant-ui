import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'action-sheet',
  status: 'beta',
  title: 'Лист действий',
  description: 'Нижний лист на телефоне со списком действий об одном объекте и отдельной плашкой «Отмена». Отрицательные действия — отдельной группой и через подтверждение.',
  category: 'overlays',
  paperBoard: '1DQN-0',
  anatomy: ['Затемнение scrim', 'Лист overlay r28, 8 от краёв', 'Заголовок 13 fg-3', 'Группа действий', 'Действие 56', 'Плашка «Отмена» 56 r28'],
  related: ['sheet', 'menu', 'swipe-actions'],
  source: { file: 'components/action-sheet.tsx', exports: ['ActionSheet', 'ActionSheetTrigger', 'ActionSheetContent', 'ActionSheetGroup', 'ActionSheetItem'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  propsOf: 'ActionSheetContent',
  props: [
    { name: 'title', type: 'string', required: true, description: 'О чём действия: «Айдентика для пекарни»; диктор читает «Действия: …».' },
    { name: 'description', type: 'node', description: 'Строка под заголовком.' },
    { name: 'cancelLabel', type: 'string', default: 'Отмена', description: 'Текст плашки отмены.' },
  ],
  parts: [
    { name: 'ActionSheetGroup', description: 'Связанные действия; группы разделены полосой 8 fill-1.', props: [] },
    {
      name: 'ActionSheetItem',
      description: 'Действие 56: иконка 20 и подпись; после нажатия лист закрывается.',
      props: [
        { name: 'icon', type: 'node', description: 'Иконка 20.' },
        { name: 'destructive', type: 'boolean', description: 'Текст danger-soft-fg.' },
        { name: 'keepOpen', type: 'boolean', description: 'Не закрывать лист после нажатия.' },
      ],
    },
  ],
  slots: [
    { name: 'action-sheet', description: 'Лист с плашкой отмены.' },
    { name: 'action-sheet-group', description: 'Группа действий.' },
    { name: 'action-sheet-item', description: 'Действие.' },
  ],
  states: [{ id: 'open', label: 'открыто', description: 'Лист выезжает снизу, затемнение scrim.' }],
  keyboard: [
    { keys: ['Tab'], action: 'По действиям и «Отмене»' },
    { keys: ['Esc'], action: 'Закрывает' },
  ],
  a11y: ['role="dialog" с названием «Действия: …».', 'Отрицательные действия — отдельной группой и через подтверждение.', 'Фокус возвращается на триггер.'],
  motion: [
    { label: 'Появление', value: 'снизу · 300 мс · ease-fluid', tokens: ['duration-slow'] },
    { label: 'Закрытие', value: '250 мс', tokens: ['duration-moderate'] },
  ],
  examples: [
    { id: 'deal', title: 'Сделка', description: 'Задача, звонок и группа «В архив / Удалить».' },
    { id: 'simple', title: 'Два действия', description: 'Без иконок и описания.' },
  ],
};

export default meta;
