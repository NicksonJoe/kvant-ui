import { useState } from 'react';
import { Button, NavigationProgress } from '@/kvant';

/** A transition under 150ms never shows the bar: nothing flashes on a fast network. */
export default function NavigationProgressFast() {
  const [loading, setLoading] = useState(false);
  const navigate = (ms: number) => {
    setLoading(true);
    setTimeout(() => setLoading(false), ms);
  };

  return (
    <div className="relative flex w-full max-w-[480px] flex-col gap-3 overflow-hidden rounded-xl bg-surface-1 p-4 pt-5 shadow-raised">
      <NavigationProgress loading={loading} className="absolute!" />
      <p className="text-body-sm text-fg-2">Сравните: быстрый переход проходит без полосы, долгий — с ней.</p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={loading} onClick={() => navigate(80)}>
          Переход за 80 мс
        </Button>
        <Button size="sm" variant="secondary" disabled={loading} onClick={() => navigate(2500)}>
          Переход за 2,5 с
        </Button>
      </div>
    </div>
  );
}
