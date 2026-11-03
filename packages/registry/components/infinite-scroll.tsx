import { ChevronDown, CircleAlert, RotateCcw } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { Spinner } from './spinner';
import { Announce } from './visually-hidden';

/** The next page is asked for while the sentinel is still this far below the screen. */
const AHEAD = '0px 0px 150% 0px';
const RETRY_AFTER = 3000;

export type InfiniteScrollStatus = 'idle' | 'loading' | 'error';
export type InfiniteScrollTrigger = 'auto' | 'button';
export type InfiniteScrollLoader = 'spinner' | 'skeleton';

function scrollRoot(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
  }
  return null;
}

function SkeletonRow({ faded = false }: { faded?: boolean }) {
  return (
    <div data-slot="infinite-scroll-skeleton" aria-hidden="true" className={cn('flex items-start gap-3 px-4 py-3', faded && 'opacity-60')}>
      <span className="flex h-5 shrink-0 items-center">
        <span className="size-2 rounded-full bg-fill-3" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2 pt-[5px]">
        <span className={cn('h-2.5 max-w-full rounded-full bg-fill-2', faded ? 'w-45' : 'w-55')} />
        <span className={cn('h-2 max-w-full rounded-full bg-fill-1', faded ? 'w-50' : 'w-40')} />
      </span>
      <span className="flex w-10 shrink-0 justify-end pt-1.5">
        <span className="h-2 w-7 rounded-full bg-fill-1" />
      </span>
    </div>
  );
}

export interface InfiniteScrollProps<T> extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  items: readonly T[];
  getKey: (item: T) => string;
  /** Row content; rows are separated by a hairline. */
  renderItem: (item: T) => ReactNode;
  /** More rows behind the last one. */
  hasMore: boolean;
  /** State of the next page: loading shows the tail, error keeps the rows and offers «Повторить». */
  status?: InfiniteScrollStatus;
  /** Ask for the next page; it is never called again until `status` or the rows change. */
  onLoadMore: () => void;
  /** auto — when the end comes near; button — «Показать ещё», when a footer or a total sits under the list. */
  trigger?: InfiniteScrollTrigger;
  /** spinner — «Загружаем ещё»; skeleton — rows of the page, when its size is known and is up to 3 screens. */
  loader?: InfiniteScrollLoader;
  /** Rows in a page, for «Показать ещё 20». */
  pageSize?: number;
  /** Rows still not loaded, for «из 148». */
  remaining?: number;
  /** Error line of the next page. */
  error?: string;
  /** Under the last row once there is nothing more: «Это все события за 30 дней» and a link to widen the period. */
  end?: ReactNode;
  /** Instead of the list when there are no rows and nothing more. */
  empty?: ReactNode;
}

/**
 * A feed that brings the next page before the reader reaches the end: a sentinel watched 1.5 screens ahead,
 * one request at a time. The tail always says what is going on — loading, failed or the end of the data.
 */
export function InfiniteScroll<T>({
  'aria-label': label,
  items,
  getKey,
  renderItem,
  hasMore,
  status = 'idle',
  onLoadMore,
  trigger = 'auto',
  loader = 'spinner',
  pageSize = 20,
  remaining,
  error = 'Не загрузилось',
  end,
  empty,
  className,
  ...props
}: InfiniteScrollProps<T>) {
  const list = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  // rows seen at the last render: a longer list means a page came in («Загружено 20»)
  const [seen, setSeen] = useState(items.length);
  const [loaded, setLoaded] = useState(0);
  if (items.length !== seen) {
    setSeen(items.length);
    setLoaded(Math.max(items.length - seen, 0));
  }
  const announcement = status === 'error' ? error : status === 'loading' || !loaded ? '' : `Загружено ${loaded}`;
  // one request at a time: set when asked, cleared when the status or the rows answer
  const asked = useRef(false);
  const retried = useRef(false);
  const focusFrom = useRef<number | null>(null);
  const count = useRef(items.length);
  const ask = useRef(onLoadMore);
  useLayoutEffect(() => {
    ask.current = onLoadMore;
  });

  const request = () => {
    if (asked.current || status === 'loading') return;
    asked.current = true;
    ask.current();
  };

  useEffect(() => {
    asked.current = false;
  }, [status, items.length]);

  const watching = trigger === 'auto' && hasMore;
  useEffect(() => {
    const element = sentinel.current;
    if (!watching || !element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => setNear(entries.some((entry) => entry.isIntersecting)), {
      root: scrollRoot(element),
      rootMargin: AHEAD,
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      setNear(false);
    };
  }, [watching]);

  useEffect(() => {
    if (!watching || !near || status !== 'idle' || asked.current) return;
    asked.current = true;
    ask.current();
  }, [watching, near, status, items.length]);

  // a failed page is asked for once more by itself; a page that comes in resets it
  useEffect(() => {
    if (status !== 'error' || retried.current || trigger !== 'auto') return;
    const timer = setTimeout(() => {
      retried.current = true;
      asked.current = true;
      ask.current();
    }, RETRY_AFTER);
    return () => clearTimeout(timer);
  }, [status, trigger]);

  useLayoutEffect(() => {
    const before = count.current;
    count.current = items.length;
    if (items.length <= before) return;
    retried.current = false;
    if (focusFrom.current === null) return;
    const row = list.current?.querySelectorAll<HTMLElement>(':scope > [data-slot=infinite-scroll-item]')[focusFrom.current];
    focusFrom.current = null;
    row?.focus();
  }, [items.length]);

  if (!items.length && !hasMore && status === 'idle') {
    return (
      <div data-slot="infinite-scroll" data-empty="" className={cn('flex flex-col items-center justify-center p-6 text-center', className)} {...props}>
        {empty}
      </div>
    );
  }

  const loading = status === 'loading';
  const more = remaining !== undefined ? Math.min(pageSize, remaining) : pageSize;
  let tail: ReactNode = null;
  if (status === 'error') {
    tail = (
      <div data-slot="infinite-scroll-tail" data-status="error" className="flex h-14 items-center gap-2.5 px-4">
        <CircleAlert aria-hidden className="size-4 shrink-0 stroke-2 text-danger" />
        <span className="min-w-0 flex-1 text-label-sm font-medium text-danger-soft-fg">{error}</span>
        <Button variant="outline" size="sm" leadingIcon={<RotateCcw aria-hidden />} onClick={request} className="rounded-full px-3">
          Повторить
        </Button>
      </div>
    );
  } else if (trigger === 'button' && hasMore) {
    tail = (
      <div data-slot="infinite-scroll-tail" className="flex h-18 items-center justify-center">
        <Button
          variant="outline"
          loading={loading}
          leadingIcon={<ChevronDown aria-hidden />}
          onClick={() => {
            if (loading) return;
            focusFrom.current = items.length;
            request();
          }}
          className="w-59 max-w-full gap-2 rounded-full px-3.5"
        >
          Показать ещё {more}
          {remaining !== undefined ? <span className="ml-2 text-label-sm font-normal text-fg-3 tabular-nums">из {remaining}</span> : null}
        </Button>
      </div>
    );
  } else if (loading) {
    tail =
      loader === 'skeleton' ? (
        <div data-slot="infinite-scroll-tail" className="divide-y divide-separator">
          <SkeletonRow />
          <SkeletonRow faded />
        </div>
      ) : (
        <div data-slot="infinite-scroll-tail" className="flex h-14 items-center justify-center gap-2 text-label-sm font-medium text-fg-3">
          <Spinner size={16} />
          Загружаем ещё
        </div>
      );
  } else if (!hasMore && end) {
    tail = (
      <div data-slot="infinite-scroll-end" className="flex min-h-18 flex-col items-center justify-center gap-0.5 px-4 py-3 text-center text-label-sm font-medium text-fg-2">
        {end}
      </div>
    );
  }

  return (
    <div data-slot="infinite-scroll" className={cn('flex flex-col overflow-clip rounded-xl bg-surface-1 shadow-raised', className)} {...props}>
      <div ref={list} role="list" aria-label={label} aria-busy={loading || undefined} className="flex flex-col divide-y divide-separator">
        {items.map((item) => (
          <div key={getKey(item)} role="listitem" tabIndex={-1} data-slot="infinite-scroll-item" className="focus-visible:-outline-offset-2">
            {renderItem(item)}
          </div>
        ))}
      </div>
      {watching ? <div ref={sentinel} data-slot="infinite-scroll-sentinel" aria-hidden="true" className="h-px" /> : null}
      {tail ? <div className={cn(items.length > 0 && 'border-t border-separator')}>{tail}</div> : null}
      <Announce>{announcement}</Announce>
    </div>
  );
}
