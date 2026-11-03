import { InfiniteScroll, type InfiniteScrollLoader, type InfiniteScrollStatus, type InfiniteScrollTrigger } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const rows = [
  { id: 'a', title: 'Илья Громов перевёл сделку в «Договор»', detail: 'Сайт и CRM-интеграция · «Орбита Лаб»' },
  { id: 'b', title: 'Анна Северова выставила счёт № 318', detail: 'Анимация логотипа · 312 500 ₽' },
];

const playground: Playground = {
  initial: { hasMore: true },
  render: (p) => (
    <InfiniteScroll
      aria-label="События"
      className="w-full max-w-104"
      items={rows}
      getKey={(row) => row.id}
      hasMore={p.bool('hasMore')}
      status={p.pick<InfiniteScrollStatus>('status', ['idle', 'loading', 'error'])}
      trigger={p.pick<InfiniteScrollTrigger>('trigger', ['auto', 'button'])}
      loader={p.pick<InfiniteScrollLoader>('loader', ['spinner', 'skeleton'])}
      pageSize={20}
      remaining={148}
      error="Не загрузилось — нет сети"
      end="Это все события за 30 дней"
      onLoadMore={() => {}}
      renderItem={(row) => (
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <span className="text-body-sm text-fg-1">{row.title}</span>
          <span className="text-label-sm text-fg-3">{row.detail}</span>
        </div>
      )}
    />
  ),
  code: (p) =>
    `<InfiniteScroll aria-label="События" items={events} getKey={(event) => event.id} renderItem={(event) => event.title} hasMore={${p.bool('hasMore')}}${p.attrs(['status', 'trigger', 'loader'])} onLoadMore={loadMore} />`,
};

export default playground;
