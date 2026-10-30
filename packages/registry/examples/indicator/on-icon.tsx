import { Bell, Inbox } from 'lucide-react';
import { CountBadge, IconButton } from '@/kvant';

export default function IndicatorOnIcon() {
  return (
    <div className="flex gap-4">
      <span className="relative">
        <IconButton variant="secondary" aria-label="Уведомления, 3 новых" icon={<Bell />} />
        <CountBadge count={3} className="absolute -top-1 -right-1" />
      </span>
      <span className="relative">
        <IconButton variant="secondary" aria-label="Входящие, 24 письма" icon={<Inbox />} />
        <CountBadge count={24} className="absolute -top-1 -right-2" />
      </span>
    </div>
  );
}
