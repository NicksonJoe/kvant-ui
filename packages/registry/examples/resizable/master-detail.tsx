import { Badge, Resizable } from '@/kvant';

const deals = [
  { title: 'Редизайн сайта', client: '«Орбита Лаб»', amount: '1 284 900 ₽' },
  { title: 'Фирменный стиль', client: '«Студия Север»', amount: '640 000 ₽' },
  { title: 'Приложение доставки', client: 'Кофейня «Зерно»', amount: '2 150 000 ₽' },
  { title: 'Презентация для фонда', client: 'Мост Капитал', amount: '320 000 ₽' },
];

export default function ResizableMasterDetail() {
  return (
    <Resizable label="Ширина списка сделок" defaultValue={40} min={25} max={70} className="h-80 w-full max-w-3xl overflow-hidden rounded-xl bg-surface-1 shadow-raised">
      <div className="flex flex-col gap-1 p-2">
        <div className="flex items-baseline justify-between px-2 py-2">
          <h3 className="text-label-md font-semibold">Сделки</h3>
          <span className="text-caption text-fg-3">12 в работе</span>
        </div>
        {deals.map((deal, index) => (
          <a
            key={deal.title}
            href="#deal"
            aria-current={index === 0 ? 'page' : undefined}
            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-fill-1 aria-[current=page]:bg-fill-2"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-label-md font-medium text-fg-1">{deal.title}</span>
              <span className="truncate text-caption text-fg-3">{deal.client}</span>
            </span>
            <span className="text-body-sm text-fg-2 tabular-nums">{deal.amount}</span>
          </a>
        ))}
      </div>
      <div className="flex flex-col gap-4 p-7">
        <div className="flex flex-col gap-1">
          <h3 className="text-heading-lg font-semibold">Редизайн сайта</h3>
          <p className="text-body-sm text-fg-3">«Орбита Лаб» · ответственная Анна Северова</p>
        </div>
        <div className="flex gap-2">
          <Badge tone="info">Переговоры</Badge>
          <Badge tone="warning">Срок 31.10</Badge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-caption text-fg-3">Сумма сделки</span>
          <span className="text-heading-xl font-semibold tabular-nums">1 284 900 ₽</span>
        </div>
      </div>
    </Resizable>
  );
}
