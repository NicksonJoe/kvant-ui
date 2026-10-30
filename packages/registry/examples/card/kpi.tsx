import { TrendingUp } from 'lucide-react';
import { Badge, Card } from '@/kvant';

export default function CardKpi() {
  return (
    <Card className="w-72">
      <span className="text-label-sm font-medium text-fg-2">Выручка за октябрь</span>
      <div className="flex items-baseline justify-between gap-3">
        <data value="4812000" className="text-display-sm font-semibold tabular-nums">
          4,81 млн ₽
        </data>
        <Badge tone="success" icon={<TrendingUp />}>
          +12,4 %
        </Badge>
      </div>
      <span className="text-caption text-fg-3">Против 4,28 млн ₽ в сентябре</span>
    </Card>
  );
}
