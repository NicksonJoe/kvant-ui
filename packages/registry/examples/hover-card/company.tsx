import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button, HoverCard, HoverCardContent, HoverCardTrigger, Skeleton } from '@/kvant';

const stats = [
  { value: '3', label: 'сделки' },
  { value: '1,9 млн ₽', label: 'оплачено' },
  { value: '12 дней', label: 'средний цикл' },
];

/** The card opens at once with skeletons of the same size, then the data crossfades in without a jump. */
export default function HoverCardCompany() {
  const [loaded, setLoaded] = useState(false);

  return (
    <p className="flex items-center gap-2 text-label-sm text-fg-3">
      Клиент
      <HoverCard
        onOpenChange={(open) => {
          if (open && !loaded) setTimeout(() => setLoaded(true), 900);
        }}
      >
        <HoverCardTrigger href="#orbita-lab">
          <span aria-hidden className="grid size-5 place-items-center rounded-xs bg-fg-1 text-[8px] font-semibold text-surface-1">
            ОЛ
          </span>
          «Орбита Лаб»
        </HoverCardTrigger>
        <HoverCardContent aria-busy={!loaded}>
          {loaded ? (
            <div className="flex flex-col gap-3 transition-opacity duration-(--duration-quick) ease-out starting:opacity-0">
              <div className="flex items-center gap-3">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-md bg-fg-1 text-[19px] font-semibold text-surface-1">
                  ОЛ
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-label-md font-semibold text-fg-1">«Орбита Лаб»</span>
                  <span className="text-body-xs text-fg-3">Клиент с марта 2024</span>
                </div>
              </div>
              <p className="text-body-xs text-fg-2">
                Продуктовая лаборатория из Санкт-Петербурга. Контакт — Ольга Литвинова, директор по маркетингу.
              </p>
              <dl className="flex gap-6 border-t border-separator pt-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col-reverse">
                    <dt className="text-caption text-fg-3">{stat.label}</dt>
                    <dd className="text-heading-xs font-semibold tabular-nums">{stat.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex gap-2 *:flex-1">
                <Button size="sm" variant="secondary" leadingIcon={<Plus />}>
                  Новая сделка
                </Button>
                <Button size="sm" variant="ghost">
                  Открыть
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Skeleton shape="rect" className="size-12 rounded-md!" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="w-32" />
                  <Skeleton className="w-24" />
                </div>
              </div>
              <div className="flex flex-col gap-2 py-1">
                <Skeleton className="w-full" />
                <Skeleton className="w-40" />
              </div>
              <div className="flex gap-6 border-t border-separator pt-3">
                <Skeleton shape="rect" className="h-10 w-12" />
                <Skeleton shape="rect" className="h-10 w-16" />
                <Skeleton shape="rect" className="h-10 w-14" />
              </div>
              <div className="flex gap-2">
                <Skeleton shape="circle" className="h-8 flex-1" />
                <Skeleton shape="circle" className="h-8 flex-1" />
              </div>
            </div>
          )}
        </HoverCardContent>
      </HoverCard>
    </p>
  );
}
