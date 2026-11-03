import { useEffect, useRef, useState } from 'react';
import { InfiniteScroll, type InfiniteScrollStatus } from '@/kvant';

interface Invoice {
  id: string;
  number: number;
  client: string;
  amount: number;
}

const TOTAL = 168;
const PAGE = 20;
const CLIENTS = ['«Орбита Лаб»', '«Чайная лавка»', '«Полярный свет»', '«Тихий эфир»', '«Издательство Полка»', '«Маркет 24»'];
const rub = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
const invoice = (n: number): Invoice => ({ id: `invoice-${n}`, number: 318 - n, client: CLIENTS[n % CLIENTS.length] ?? '', amount: 40_000 + ((n * 7_919) % 300) * 1_000 });

/** A list with a total under it: «Показать ещё» instead of loading on scroll; focus moves to the first new row. */
export default function LoadMore() {
  const [invoices, setInvoices] = useState(() => Array.from({ length: PAGE }, (_, n) => invoice(n)));
  const [status, setStatus] = useState<InfiniteScrollStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const loadMore = () => {
    setStatus('loading');
    timer.current = setTimeout(() => {
      setInvoices((list) => [...list, ...Array.from({ length: Math.min(PAGE, TOTAL - list.length) }, (_, n) => invoice(list.length + n))]);
      setStatus('idle');
    }, 900);
  };

  return (
    <div className="flex w-full max-w-104 flex-col gap-3">
      <InfiniteScroll
        aria-label="Счета"
        items={invoices}
        getKey={(item) => item.id}
        hasMore={invoices.length < TOTAL}
        status={status}
        onLoadMore={loadMore}
        trigger="button"
        pageSize={PAGE}
        remaining={TOTAL - invoices.length}
        end="Это все счета за год"
        renderItem={(item) => (
          <div className="flex items-start gap-3 px-4 py-3">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-body-sm text-fg-1">Счёт № {item.number}</span>
              <span className="text-label-sm text-fg-3">{item.client}</span>
            </span>
            <span className="shrink-0 text-body-sm text-fg-1 tabular-nums">{rub.format(item.amount)}</span>
          </div>
        )}
      />
      <p className="px-4 text-label-sm text-fg-2">Итого за год: {rub.format(31_420_000)}</p>
    </div>
  );
}
