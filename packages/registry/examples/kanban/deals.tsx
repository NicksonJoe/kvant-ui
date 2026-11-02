import { useState } from 'react';
import { Avatar, Badge, Kanban, KanbanCard, type KanbanColumn, type KanbanItems } from '@/kvant';

interface Deal {
  id: string;
  title: string;
  client: string;
  amount: number;
  due: string;
  owner: string;
  tag?: string;
  late?: boolean;
}

const rub = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
const sum = (deals: readonly Deal[]) => `${(deals.reduce((total, deal) => total + deal.amount, 0) / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₽`;

const initial: KanbanItems<Deal> = {
  qualification: [
    { id: 'tea', title: 'Упаковка для линейки чая', client: '«Чайная лавка»', amount: 286000, due: '15 дек', owner: 'Илья Громов', tag: 'Упаковка' },
    { id: 'icons', title: 'Иконки для приложения', client: '«Орбита Лаб»', amount: 96000, due: '12 дек', owner: 'Илья Громов' },
  ],
  negotiation: [
    { id: 'brand', title: 'Айдентика и сайт', client: '«Студия Север»', amount: 1284900, due: '14 ноя', owner: 'Анна Северова', tag: 'Брендинг' },
    { id: 'cafe', title: 'Фирменный стиль кафе', client: '«Зерно и пар»', amount: 240000, due: '30 окт', owner: 'Вера Лебедева', late: true },
  ],
  contract: [
    { id: 'book', title: 'Иллюстрации к книге', client: '«Издательство Полка»', amount: 960000, due: '2 дек', owner: 'Вера Лебедева', tag: 'Повторный' },
    { id: 'podcast', title: 'Обложки для подкаста', client: '«Тихий эфир»', amount: 168000, due: '19 ноя', owner: 'Пётр Ильин' },
  ],
  invoice: [],
};

const stages = [
  { id: 'qualification', title: 'Квалификация', color: 'var(--color-chart-7)' },
  { id: 'negotiation', title: 'Переговоры', color: 'var(--color-chart-1)' },
  { id: 'contract', title: 'Договор', color: 'var(--color-chart-3)', limit: 1 },
  { id: 'invoice', title: 'Счёт выставлен', color: 'var(--color-chart-4)' },
];

export default function KanbanDeals() {
  const [items, setItems] = useState(initial);
  const columns: KanbanColumn[] = stages.map((stage) => ({ ...stage, summary: sum(items[stage.id] ?? []) }));
  return (
    <Kanban
      aria-label="Воронка сделок"
      className="w-full"
      columns={columns}
      items={items}
      onItemsChange={setItems}
      getLabel={(deal) => `${deal.title}, ${deal.client}, ${rub.format(deal.amount)}`}
      renderCard={(deal) => (
        <KanbanCard>
          {deal.tag ? (
            <Badge tone="neutral" className="self-start">
              {deal.tag}
            </Badge>
          ) : null}
          <div className="flex flex-col gap-0.5">
            <p className="text-label-md font-medium">{deal.title}</p>
            <p className="text-body-xs text-fg-2">{deal.client}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-label-md font-semibold tabular-nums">{rub.format(deal.amount)}</span>
            <span className={deal.late ? 'rounded-full bg-danger-soft px-1.5 text-caption text-danger-soft-fg' : 'text-caption text-fg-3'}>{deal.due}</span>
            <Avatar name={deal.owner} size={20} />
          </div>
        </KanbanCard>
      )}
    />
  );
}
