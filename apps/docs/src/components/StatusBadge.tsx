import { Badge } from '@/kvant';
import type { ComponentStatus } from '@/kvant/meta';

const STATUS: Record<ComponentStatus, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  stable: { label: 'Готов', tone: 'success' },
  beta: { label: 'Бета', tone: 'warning' },
  planned: { label: 'Скоро', tone: 'neutral' },
};

export function StatusBadge({ status }: { status: ComponentStatus }) {
  const { label, tone } = STATUS[status];
  return (
    <Badge tone={tone} variant="dot">
      {label}
    </Badge>
  );
}
