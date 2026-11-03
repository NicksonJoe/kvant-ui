import { useState } from 'react';
import { SortableList, type SortableIndicator, type SortableLayout } from '@/kvant';
import type { Playground } from '@/kvant/meta';

interface Item {
  id: string;
  title: string;
}

const initial: Item[] = [
  { id: 'a', title: 'Согласовать смету' },
  { id: 'b', title: 'Позвонить клиенту' },
  { id: 'c', title: 'Отправить договор' },
  { id: 'd', title: 'Подготовить презентацию' },
  { id: 'e', title: 'Выставить счёт' },
  { id: 'f', title: 'Ревью макетов' },
];

function Demo({ layout, indicator, selectable, disabled }: { layout: SortableLayout; indicator: SortableIndicator; selectable: boolean; disabled: boolean }) {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <SortableList
      aria-label="Задачи"
      className={layout === 'grid' ? 'w-full max-w-190' : 'w-full max-w-120'}
      layout={layout}
      indicator={indicator}
      disabled={disabled}
      items={items}
      onItemsChange={setItems}
      selected={selectable ? selected : undefined}
      onSelectedChange={selectable ? setSelected : undefined}
      getLabel={(item) => item.title}
      renderItem={(item) => <span className="block truncate">{item.title}</span>}
    />
  );
}

const playground: Playground = {
  controls: [{ name: 'selectable', type: 'boolean', default: false, description: 'Чекбоксы и перенос нескольких строк.' }],
  render: (p) => (
    <Demo
      layout={p.pick('layout', ['list', 'grid'] as const)}
      indicator={p.pick('indicator', ['slot', 'line'] as const)}
      selectable={p.bool('selectable')}
      disabled={p.bool('disabled')}
    />
  ),
  code: (p) =>
    `<SortableList aria-label="Задачи"${p.attrs(['layout', 'indicator', 'disabled'])} items={items} onItemsChange={setItems}${p.bool('selectable') ? ' selected={selected} onSelectedChange={setSelected}' : ''} getLabel={(task) => task.title} renderItem={(task) => task.title} />`,
};

export default playground;
