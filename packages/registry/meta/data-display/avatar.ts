import type { ReadyComponentMeta } from '../types';

const meta: ReadyComponentMeta = {
  id: 'avatar',
  status: 'stable',
  title: 'Аватар',
  description: 'Человек или компания: фото или инициалы на мягком акценте, точка присутствия, группа с «+N».',
  category: 'data-display',
  paperBoard: '9O3-0',
  anatomy: ['Круг', 'Фото или инициалы', 'Точка статуса', 'Группа с наложением и счётчиком'],
  related: ['badge', 'hover-card', 'list'],
  source: { file: 'components/card.tsx', exports: ['Avatar', 'AvatarGroup', 'initials'] },
  dependencies: { npm: ['@base-ui/react'], registry: [] },
  props: [
    { name: 'name', type: 'string', required: true, description: 'Имя: из него инициалы и подпись для экранного диктора.' },
    { name: 'size', type: 'number', options: [20, 24, 28, 32, 40, 48, 64], default: 32, description: 'Диаметр, px; инициалы — 40 % размера. 28 — в шапке и чате.' },
    { name: 'status', type: 'enum', options: ['online', 'away', 'busy', 'offline'], description: 'Точка присутствия, четверть размера: в сети, отошёл, не беспокоить, не в сети.' },
    { name: 'src', type: 'string', description: 'Фото; пока грузится или при ошибке — инициалы.', control: false },
  ],
  parts: [
    {
      name: 'AvatarGroup',
      description: 'Наложение −8 px с кольцом surface-1, лишние — счётчиком «+N».',
      props: [
        { name: 'max', type: 'number', default: 3, description: 'Сколько показать до «+N».' },
        { name: 'size', type: 'number', options: [20, 24, 28, 32, 40, 48, 64], default: 32, description: 'Размер счётчика «+N» на surface-3; аватарам задайте тот же.' },
      ],
    },
  ],
  slots: [
    { name: 'avatar', description: 'Аватар (role="img" с именем).' },
    { name: 'avatar-group', description: 'Группа.' },
  ],
  states: [{ id: 'rest', label: 'покой', description: 'Инициалы semibold на accent-soft.' }],
  matrix: { rowProp: 'status', columnProp: 'size' },
  keyboard: [],
  a11y: ['Аватар — изображение с именем человека; инициалы скрыты от экранного диктора.', 'Статус дублируйте текстом рядом, если он важен для задачи.'],
  motion: [{ label: 'Фото', value: 'появляется после загрузки без вспышки инициалов' }],
  examples: [
    { id: 'sizes', title: 'Размеры и статусы', description: 'Семь размеров и четыре статуса.' },
    { id: 'group', title: 'Команда проекта', description: 'Группа с «+N».' },
  ],
};

export default meta;
