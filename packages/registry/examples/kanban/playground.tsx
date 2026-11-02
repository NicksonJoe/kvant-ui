import { useState } from 'react';
import { Kanban, KanbanCard, type KanbanItems } from '@/kvant';
import type { Playground } from '@/kvant/meta';

interface Card {
  id: string;
  title: string;
}

function Demo({ limit }: { limit: number }) {
  const [items, setItems] = useState<KanbanItems<Card>>({
    new: [
      { id: 'a', title: 'Сайт для яхт-клуба' },
      { id: 'b', title: 'SMM на квартал' },
    ],
    work: [{ id: 'c', title: 'Навигация для ТЦ' }],
  });
  return (
    <Kanban
      aria-label="Сделки"
      className="w-full"
      columns={[
        { id: 'new', title: 'Новые', color: 'var(--color-chart-7)' },
        { id: 'work', title: 'В работе', color: 'var(--color-chart-1)', limit },
      ]}
      items={items}
      onItemsChange={setItems}
      getLabel={(card) => card.title}
      renderCard={(card) => <KanbanCard className="text-label-md">{card.title}</KanbanCard>}
    />
  );
}

const playground: Playground = {
  controls: [{ name: 'limit', type: 'number', options: [1, 2, 3], default: 1, description: 'Лимит WIP второй колонки.' }],
  render: (p) => <Demo limit={p.num('limit')} />,
  code: () => `<Kanban aria-label="Сделки" columns={columns} items={items} onItemsChange={setItems} getLabel={(deal) => deal.title} renderCard={(deal) => <KanbanCard>{deal.title}</KanbanCard>} />`,
};

export default playground;
