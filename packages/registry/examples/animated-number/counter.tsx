import { useState } from 'react';
import { AnimatedNumber, Button } from '@/kvant';

export default function AnimatedNumberCounter() {
  const [count, setCount] = useState(12);
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 items-center gap-2 rounded-full bg-surface-1 pr-2 pl-3.5 shadow-raised">
        <span className="text-label-md font-medium">Заявки</span>
        <AnimatedNumber value={count} className="rounded-full bg-accent px-1.5 text-caption font-semibold text-accent-fg" />
      </span>
      <Button variant="ghost" size="sm" onClick={() => setCount((value) => value + 1)}>
        Новая заявка
      </Button>
    </div>
  );
}
