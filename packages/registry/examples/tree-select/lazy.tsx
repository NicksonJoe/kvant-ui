import { useState } from 'react';
import { TreeSelect, type TreeSelectNode } from '@/kvant';

const initial: TreeSelectNode[] = [
  { id: 'szfo', label: 'Северо-Западный ФО', hasChildren: true },
  { id: 'pfo', label: 'Приволжский ФО', hasChildren: true },
  { id: 'ufo', label: 'Уральский ФО', hasChildren: true },
];

const loaded: Record<string, TreeSelectNode[]> = {
  szfo: [
    { id: 'spb', label: 'Санкт-Петербург' },
    { id: 'kgd', label: 'Калининград' },
  ],
  pfo: [
    { id: 'kzn', label: 'Казань' },
    { id: 'samara', label: 'Самара' },
  ],
  ufo: [
    { id: 'ekb', label: 'Екатеринбург' },
    { id: 'chel', label: 'Челябинск' },
  ],
};

export default function TreeSelectLazy() {
  const [nodes, setNodes] = useState(initial);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const patch = (id: string, change: Partial<TreeSelectNode>) =>
    setNodes((list) => list.map((node) => (node.id === id ? { ...node, ...change } : node)));

  const load = (node: TreeSelectNode) => {
    const attempt = (attempts[node.id] ?? 0) + 1;
    setAttempts({ ...attempts, [node.id]: attempt });
    patch(node.id, { loading: true, error: undefined });
    // Приволжский fails the first time, so «Повторить» has something to do.
    window.setTimeout(() => {
      if (node.id === 'pfo' && attempt === 1) patch(node.id, { loading: false, error: 'Не удалось загрузить' });
      else patch(node.id, { loading: false, children: loaded[node.id] });
    }, 900);
  };

  return (
    <div className="flex w-104 max-w-full flex-col gap-1.5">
      <span className="text-label-sm font-medium text-fg-2">Склад</span>
      <TreeSelect aria-label="Склад" nodes={nodes} onLoadChildren={load} placeholder="Выберите склад" />
    </div>
  );
}
