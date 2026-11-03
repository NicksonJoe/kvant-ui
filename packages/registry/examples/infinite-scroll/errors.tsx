import { useEffect, useRef, useState } from 'react';
import { InfiniteScroll, Switch, type InfiniteScrollLoader, type InfiniteScrollStatus } from '@/kvant';

interface Call {
  id: string;
  title: string;
  detail: string;
}

const PAGE = 3;
const call = (n: number): Call => ({ id: `call-${n}`, title: `Звонок № ${1042 - n}`, detail: n % 2 ? 'Входящий · 4 мин' : 'Исходящий · 12 мин' });

/** The next page fails while the network is off: the rows stay, «Повторить» and one retry by itself after 3 s. */
export default function Errors() {
  const [calls, setCalls] = useState(() => Array.from({ length: PAGE }, (_, n) => call(n)));
  const [status, setStatus] = useState<InfiniteScrollStatus>('idle');
  const [online, setOnline] = useState(false);
  const [loader, setLoader] = useState<InfiniteScrollLoader>('skeleton');
  const network = useRef(online);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    network.current = online;
  }, [online]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const loadMore = () => {
    setStatus('loading');
    timer.current = setTimeout(() => {
      if (!network.current) {
        setStatus('error');
        return;
      }
      setCalls((list) => [...list, ...Array.from({ length: PAGE }, (_, n) => call(list.length + n))]);
      setStatus('idle');
    }, 800);
  };

  return (
    <div className="flex w-full max-w-104 flex-col gap-4">
      <div className="flex flex-wrap gap-5">
        <Switch checked={online} onCheckedChange={setOnline}>
          Сеть есть
        </Switch>
        <Switch checked={loader === 'skeleton'} onCheckedChange={(on) => setLoader(on ? 'skeleton' : 'spinner')}>
          Скелетоны
        </Switch>
      </div>
      <div className="h-80 overflow-y-auto rounded-xl">
        <InfiniteScroll
          aria-label="Звонки"
          items={calls}
          getKey={(item) => item.id}
          hasMore={calls.length < 30}
          status={status}
          loader={loader}
          onLoadMore={loadMore}
          error="Не загрузилось — нет сети"
          renderItem={(item) => (
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="flex h-5 shrink-0 items-center">
                <span className="size-2 rounded-full bg-chart-1" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body-sm text-fg-1">{item.title}</span>
                <span className="text-label-sm text-fg-3">{item.detail}</span>
              </span>
            </div>
          )}
        />
      </div>
    </div>
  );
}
