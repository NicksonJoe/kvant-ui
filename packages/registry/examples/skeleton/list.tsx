import { Skeleton } from '@/kvant';

export default function SkeletonList() {
  return (
    <div className="flex w-80 flex-col gap-4" aria-busy="true" aria-label="Загрузка клиентов">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3">
          <Skeleton shape="circle" className="size-10" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="w-2/3" />
            <Skeleton className="w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
