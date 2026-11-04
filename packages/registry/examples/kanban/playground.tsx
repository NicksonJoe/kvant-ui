import { useState } from 'react';
import { Kanban, KanbanCard, type KanbanItems } from '@/kvant';
import type { Playground } from '@/kvant/meta';

interface Card {
  id: string;
  title: string;
}

function Demo({ limit, collapsible }: { limit: number; collapsible: boolean }) {
  const [items, setItems] = useState<KanbanItems<Card>>({
    new: [
      { id: 'a', title: 'Сайт для яхт-клуба' },
      { id: 'b', title: 'SMM на квартал' },
    ],
    work: [{ id: 'c', title: 'Навигация для ТЦ' }],
    done: [
      { id: 'd', title: 'Логотип для пекарни' },
      { id: 'e', title: 'Каталог мебели' },
    ],
  });
  return (
    <Kanban
      aria-label="Сделки"
      className="w-full"
      columns={[
        { id: 'new', title: 'Новые', color: 'var(--color-chart-7)' },
        { id: 'work', title: 'В работе', color: 'var(--color-chart-1)', limit },
        { id: 'done', title: 'Готово', color: 'var(--color-chart-6)' },
      ]}
      items={items}
      onItemsChange={setItems}
      collapsible={collapsible}
      defaultCollapsed={['done']}
      getLabel={(card) => card.title}
      renderCard={(card) => <KanbanCard className="text-label-md">{card.title}</KanbanCard>}
    />
  );
}

const playground: Playground = {
  initial: { collapsible: true },
  controls: [{ name: 'limit', type: 'number', options: [1, 2, 3], default: 1, description: 'Лимит WIP второй колонки.' }],
  render: (p) => <Demo limit={p.num('limit')} collapsible={p.bool('collapsible')} />,
  code: (p) =>
    `<Kanban aria-label="Сделки" columns={columns} items={items} onItemsChange={setItems}${p.bool('collapsible') ? ' collapsible' : ''} defaultCollapsed={['done']} getLabel={(deal) => deal.title} renderCard={(deal) => <KanbanCard>{deal.title}</KanbanCard>} />`,
};

export default playground;
