import { useState } from 'react';
import { NavigationProgress, cn } from '@/kvant';

const pages = {
  deals: { title: 'Сделки', rows: ['Сайт для «Орбита Лаб» · 1 280 000 ₽', 'Фирменный стиль «Вектор» · 640 000 ₽', 'Аудит интерфейса · 180 000 ₽'] },
  contacts: { title: 'Контакты', rows: ['Анна Северова · «Норда»', 'Илья Громов · «Студия Север»', 'Мария Ветрова · «Студия Вектор»'] },
  reports: { title: 'Отчёты', rows: ['Воронка за октябрь', 'Выручка по менеджерам', 'Источники лидов'] },
} as const;
type PageId = keyof typeof pages;

/** In an app the bar sits fixed on the window's top edge; here it is pinned to the frame with `absolute!`. */
export default function NavigationProgressRouter() {
  const [page, setPage] = useState<PageId>('deals');
  const [loading, setLoading] = useState(false);
  const open = (next: PageId) => {
    if (next === page || loading) return;
    setLoading(true);
    setTimeout(() => {
      setPage(next);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="relative w-full max-w-[480px] overflow-hidden rounded-xl bg-surface-1 shadow-raised">
      <NavigationProgress loading={loading} className="absolute!" />
      <nav className="flex gap-1 border-b border-separator p-2">
        {(Object.keys(pages) as PageId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => open(id)}
            aria-current={id === page ? 'page' : undefined}
            className={cn(
              'h-8 rounded-full px-3 text-label-sm font-medium text-fg-2 hover:bg-fill-1',
              id === page && 'bg-fill-2 text-fg-1',
            )}
          >
            {pages[id].title}
          </button>
        ))}
      </nav>
      <ul aria-busy={loading} className="flex flex-col p-2">
        {pages[page].rows.map((row) => (
          <li key={row} className="rounded-md px-3 py-2.5 text-body-sm tabular-nums">
            {row}
          </li>
        ))}
      </ul>
    </div>
  );
}
