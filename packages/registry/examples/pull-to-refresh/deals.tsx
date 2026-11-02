import { useState } from 'react';
import { PullToRefresh } from '@/kvant';

export default function PullToRefreshDeals() {
  const [deals, setDeals] = useState(['Навигация для ТЦ', 'Сайт для яхт-клуба', 'Упаковка чайной линейки']);
  return (
    <PullToRefresh
      className="h-72 w-full max-w-sm overflow-hidden rounded-xl bg-surface-1 shadow-raised"
      onRefresh={async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setDeals((list) => ['Ребрендинг кофейни', ...list]);
        return '1 новая сделка';
      }}
    >
      <ul>
        {deals.map((deal) => (
          <li key={deal} className="border-b border-separator px-4 py-3 text-label-md">
            {deal}
          </li>
        ))}
      </ul>
    </PullToRefresh>
  );
}
