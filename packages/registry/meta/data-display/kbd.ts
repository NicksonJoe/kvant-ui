import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'kbd',
  status: 'stable',
  title: 'Клавиша',
  description: 'Показывает клавишу или сочетание: в подсказках, меню и командной палитре.',
  category: 'data-display',
  paperBoard: '9O3-0',
  anatomy: ['Колпачок 20 px с нижней гранью', 'Символ моноширинным шрифтом'],
  related: ['tooltip', 'command-palette', 'menu'],
  source: { file: 'components/badge.tsx', exports: ['Kbd'] },
  dependencies: { npm: [], registry: [] },
  props: [{ name: 'children', type: 'string', signature: 'ReactNode', description: 'Символ: ⌘, ⇧, Esc, ↵ или буква.' }],
  slots: [{ name: 'kbd', description: 'Нативный kbd.' }],
  states: [{ id: 'rest', label: 'покой', description: 'Surface-1, кольцо border и нижняя грань.' }],
  keyboard: [],
  a11y: ['Нативный элемент kbd; символы ⌘ и ⇧ экранный диктор читает как «command» и «shift».', 'Сочетание пишите отдельными клавишами, а не одной строкой.'],
  motion: [{ label: '—', value: 'статичен' }],
  examples: [
    { id: 'combos', title: 'Сочетания', description: 'Отдельный колпачок на каждую клавишу.' },
    { id: 'inline', title: 'В тексте', description: 'Подсказка в строке подписи.' },
  ],
};

export default meta;
