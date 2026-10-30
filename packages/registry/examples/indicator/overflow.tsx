import { CountBadge } from '@/kvant';

export default function IndicatorOverflow() {
  return (
    <div className="flex items-center gap-3">
      <CountBadge count={5} />
      <CountBadge count={42} />
      <CountBadge count={120} />
      <CountBadge count={14} max={9} />
    </div>
  );
}
