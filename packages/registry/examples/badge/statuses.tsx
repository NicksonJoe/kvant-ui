import { CircleCheck, Clock } from 'lucide-react';
import { Badge } from '@/kvant';

export default function BadgeStatuses() {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant="dot" tone="accent">
          Бриф
        </Badge>
        <Badge variant="dot" tone="warning">
          Переговоры
        </Badge>
        <Badge variant="dot" tone="success">
          Договор
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone="success" icon={<CircleCheck />}>
          Счёт оплачен
        </Badge>
        <Badge tone="warning" icon={<Clock />}>
          3 дня до срока
        </Badge>
        <Badge variant="solid" tone="danger">
          12
        </Badge>
        <Badge variant="outline">v2.4</Badge>
      </div>
    </div>
  );
}
