import { Card, Skeleton } from '@/kvant';

export default function SkeletonCard() {
  return (
    <Card className="w-72" aria-busy="true">
      <Skeleton shape="rect" className="h-32 w-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="w-3/4" />
        <Skeleton className="w-1/2" />
      </div>
    </Card>
  );
}
