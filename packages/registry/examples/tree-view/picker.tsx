import { useState } from 'react';
import { TreeView, type TreeNode } from '@/kvant';

const folders: readonly TreeNode[] = [
  {
    id: 'projects',
    label: 'Проекты',
    children: [
      { id: 'rebrand', label: 'Ребрендинг 2026', children: [{ id: 'logo', label: 'Макеты логотипа' }, { id: 'guide', label: 'Гайдлайн' }] },
      { id: 'site', label: 'Сайт для «Полюса»' },
    ],
  },
  { id: 'archive', label: 'Архив', children: [{ id: 'y2025', label: '2025' }] },
];

const names = new Map<string, string>();
const collect = (nodes: readonly TreeNode[]) =>
  nodes.forEach((node) => {
    names.set(node.id, node.label);
    if (node.children) collect(node.children);
  });
collect(folders);

export default function TreeViewPicker() {
  const [selected, setSelected] = useState('rebrand');

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="rounded-xl bg-surface-1 p-2 shadow-raised">
        <TreeView aria-label="Папка для файла" nodes={folders} defaultExpanded={['projects']} selected={selected} onSelectedChange={setSelected} />
      </div>
      <p className="text-body-sm text-fg-2">
        Сохранить в: <span className="font-medium text-fg-1">{names.get(selected)}</span>
      </p>
    </div>
  );
}
