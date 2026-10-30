import { Clock } from 'lucide-react';
import { Button, EmptyState, Skeleton } from '@/kvant';

export default function TimelineStates() {
  return (
    <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
      <div aria-busy="true" aria-label="История загружается" className="flex flex-col gap-5 rounded-xl bg-surface-1 p-6 shadow-raised">
        <Skeleton className="w-16" />
        {[0, 1].map((row) => (
          <div key={row} className="flex items-start gap-3">
            <Skeleton shape="circle" className="mt-0.5 size-2.5" />
            <div className="flex flex-1 flex-col gap-2.5">
              <Skeleton className="w-4/5" />
              <Skeleton className="w-1/2" />
            </div>
            <Skeleton className="w-9" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-surface-1 shadow-raised">
        <EmptyState
          icon={<Clock />}
          title="История появится здесь"
          description="Сюда попадут звонки, письма, смена этапов и оплаты по этой сделке."
          actions={
            <>
              <Button size="sm">Добавить заметку</Button>
              <Button size="sm" variant="ghost">
                Как это работает
              </Button>
            </>
          }
        />
      </div>
    </div>
  );
}
