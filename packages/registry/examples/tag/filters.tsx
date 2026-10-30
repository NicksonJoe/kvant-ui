import { useState } from 'react';
import { Tag } from '@/kvant';

const filters = ['Мои', 'Просроченные', 'Крупные', 'Без задач'];

export default function TagFilters() {
  const [active, setActive] = useState<readonly string[]>(['Мои']);
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {filters.map((filter) => (
        <Tag
          key={filter}
          selected={active.includes(filter)}
          onSelectedChange={(on) => setActive((current) => (on ? [...current, filter] : current.filter((item) => item !== filter)))}
        >
          {filter}
        </Tag>
      ))}
    </div>
  );
}
