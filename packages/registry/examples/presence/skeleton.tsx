import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, Button, Presence, Skeleton } from '@/kvant';

const visits = [
  { name: 'Анна Соколова', service: 'Стрижка и укладка', time: '14:30' },
  { name: 'Мария Ветрова', service: 'Окрашивание', time: '16:00' },
];

const row = 'flex h-16 items-center gap-3 not-last:border-b not-last:border-separator';

export default function PresenceSkeleton() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div className="flex w-full max-w-96 flex-col gap-3">
      {/* one grid cell: the skeleton and the rows cross-fade on the same place, nothing jumps */}
      <div aria-busy={loading} className="grid rounded-xl bg-surface-1 px-5 shadow-raised">
        <Presence present={loading} className="[grid-area:1/1]">
          {visits.map((visit) => (
            <div key={visit.name} className={row}>
              <Skeleton shape="circle" className="size-10" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="w-28" />
                <Skeleton className="h-2 w-20" />
              </div>
              <Skeleton className="w-10" />
            </div>
          ))}
        </Presence>
        <Presence present={!loading} className="[grid-area:1/1]">
          {visits.map((visit) => (
            <div key={visit.name} className={row}>
              <Avatar name={visit.name} size={40} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-label-md font-medium text-fg-1">{visit.name}</span>
                <span className="text-body-xs text-fg-3">{visit.service}</span>
              </div>
              <time className="text-body-sm text-fg-2">{visit.time}</time>
            </div>
          ))}
        </Presence>
      </div>
      <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} disabled={loading} onClick={() => setLoading(true)} className="self-start">
        Обновить
      </Button>
    </div>
  );
}
