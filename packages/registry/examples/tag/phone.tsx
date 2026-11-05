import { useState } from 'react';
import { Tag } from '@/kvant';

const filters = [
  { id: 'all', label: 'Все', count: 6 },
  { id: 'overdue', label: 'Просроченные', count: 2, urgent: true },
  { id: 'mine', label: 'Мои' },
  { id: 'week', label: 'На этой неделе' },
] as const;

/** Phone filter row: 36 chips, one at a time, the row scrolls sideways past the screen edge. */
export default function TagPhone() {
  const [active, setActive] = useState<string>('all');
  return (
    <div className="w-full max-w-[402px] overflow-hidden rounded-xl bg-background py-4 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
      <div role="group" aria-label="Фильтр задач" className="flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none]">
        {filters.map((filter) => (
          <Tag
            key={filter.id}
            size="lg"
            count={'count' in filter ? filter.count : undefined}
            countTone={'urgent' in filter ? 'danger' : undefined}
            selected={active === filter.id}
            onSelectedChange={() => setActive(filter.id)}
          >
            {filter.label}
          </Tag>
        ))}
      </div>
    </div>
  );
}
