import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { InfiniteScroll, type InfiniteScrollLoader, type InfiniteScrollStatus, type InfiniteScrollTrigger } from '..';

// jsdom has no IntersectionObserver: this one is told by the test when the sentinel comes near.
const observers: { callback: IntersectionObserverCallback; options?: IntersectionObserverInit; targets: Element[] }[] = [];
class ObserverStub {
  readonly entry: (typeof observers)[number];
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.entry = { callback, options, targets: [] };
    observers.push(this.entry);
  }
  observe(target: Element) {
    this.entry.targets.push(target);
  }
  unobserve() {}
  disconnect() {
    this.entry.targets = [];
  }
  takeRecords() {
    return [];
  }
}
const original = globalThis.IntersectionObserver;
beforeAll(() => {
  globalThis.IntersectionObserver = ObserverStub as unknown as typeof IntersectionObserver;
});
afterAll(() => {
  globalThis.IntersectionObserver = original;
});
afterEach(() => {
  observers.length = 0;
  vi.useRealTimers();
});

const near = (isIntersecting: boolean) =>
  act(() => {
    for (const observer of observers) {
      if (!observer.targets.length) continue;
      observer.callback(observer.targets.map((target) => ({ target, isIntersecting }) as IntersectionObserverEntry), {} as IntersectionObserver);
    }
  });

interface Event {
  id: string;
  title: string;
}
const page = (from: number, count = 20): Event[] => Array.from({ length: count }, (_, index) => ({ id: `e${from + index}`, title: `Событие ${from + index + 1}` }));

interface FeedProps {
  status?: InfiniteScrollStatus;
  trigger?: InfiniteScrollTrigger;
  loader?: InfiniteScrollLoader;
  items?: Event[];
  hasMore?: boolean;
  onLoadMore?: () => void;
}

function Feed({ status = 'idle', trigger, loader, items = page(0), hasMore = true, onLoadMore = () => {} }: FeedProps) {
  return (
    <InfiniteScroll
      aria-label="События"
      items={items}
      getKey={(event) => event.id}
      renderItem={(event) => <span>{event.title}</span>}
      status={status}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      trigger={trigger}
      loader={loader}
      pageSize={20}
      remaining={148}
      end={
        <>
          <span>Это все события за 30 дней</span>
          <a href="#all">Показать за всё время</a>
        </>
      }
      empty={<span>Событий нет</span>}
      error="Не загрузилось — нет сети"
    />
  );
}

/** Loads 20 more on request, like a page behind an API: loading first, rows on `resolve()`. */
function Remote({ trigger, fail = false }: { trigger?: InfiniteScrollTrigger; fail?: boolean }) {
  const [items, setItems] = useState(page(0));
  const [status, setStatus] = useState<InfiniteScrollStatus>('idle');
  return (
    <>
      <Feed
        trigger={trigger}
        items={items}
        status={status}
        onLoadMore={() => setStatus('loading')}
      />
      <button type="button" onClick={() => (fail ? setStatus('error') : (setItems((list) => [...list, ...page(list.length)]), setStatus('idle')))}>
        resolve
      </button>
    </>
  );
}

const rows = () => within(screen.getByRole('list', { name: 'События' })).getAllByRole('listitem');

describe('InfiniteScroll', () => {
  it('renders the rows as a named list and watches a sentinel 150 % of the screen ahead', () => {
    render(<Feed />);
    expect(rows()).toHaveLength(20);
    expect(observers[0]?.options?.rootMargin).toBe('0px 0px 150% 0px');
    expect(document.querySelector('[data-slot=infinite-scroll-sentinel]')).not.toBeNull();
  });

  it('asks for the next page once when the sentinel comes near and not again while it loads', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<Feed onLoadMore={onLoadMore} />);
    near(true);
    near(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(<Feed onLoadMore={onLoadMore} status="loading" />);
    near(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('keeps loading while the sentinel stays near after a page came in', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<Feed onLoadMore={onLoadMore} />);
    near(true);
    rerender(<Feed onLoadMore={onLoadMore} status="loading" />);
    rerender(<Feed onLoadMore={onLoadMore} items={page(0, 40)} />);
    expect(onLoadMore).toHaveBeenCalledTimes(2);
    near(false);
    rerender(<Feed onLoadMore={onLoadMore} status="loading" items={page(0, 40)} />);
    rerender(<Feed onLoadMore={onLoadMore} items={page(0, 60)} />);
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it('shows «Загружаем ещё» with a spinner in a 56 tail and marks the list busy', () => {
    render(<Feed status="loading" />);
    const tail = document.querySelector('[data-slot=infinite-scroll-tail]') as HTMLElement;
    expect(tail.textContent).toBe('Загружаем ещё');
    expect(tail.querySelector('[data-slot=spinner]')).not.toBeNull();
    expect(screen.getByRole('list', { name: 'События' }).getAttribute('aria-busy')).toBe('true');
  });

  it('shows skeleton rows instead when the loader is skeleton', () => {
    render(<Feed status="loading" loader="skeleton" />);
    const skeletons = document.querySelectorAll('[data-slot=infinite-scroll-skeleton]');
    expect(skeletons.length).toBe(2);
    for (const skeleton of skeletons) expect(skeleton.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByText('Загружаем ещё')).toBeNull();
  });

  it('keeps the rows on an error and offers «Повторить»', () => {
    const onLoadMore = vi.fn();
    render(<Feed status="error" onLoadMore={onLoadMore} />);
    expect(rows()).toHaveLength(20);
    expect(document.querySelector('[data-slot=infinite-scroll-tail]')?.textContent).toBe('Не загрузилось — нет сетиПовторить');
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('retries once by itself 3 s after an error', () => {
    vi.useFakeTimers();
    const onLoadMore = vi.fn();
    const { rerender } = render(<Feed status="error" onLoadMore={onLoadMore} />);
    act(() => vi.advanceTimersByTime(2900));
    expect(onLoadMore).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(<Feed status="loading" onLoadMore={onLoadMore} />);
    rerender(<Feed status="error" onLoadMore={onLoadMore} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('ends with the summary and stops watching when there is nothing more', () => {
    const onLoadMore = vi.fn();
    render(<Feed hasMore={false} onLoadMore={onLoadMore} />);
    near(true);
    expect(onLoadMore).not.toHaveBeenCalled();
    expect(document.querySelector('[data-slot=infinite-scroll-sentinel]')).toBeNull();
    expect(document.querySelector('[data-slot=infinite-scroll-end]')?.textContent).toBe('Это все события за 30 дней' + 'Показать за всё время');
  });

  it('shows the empty state when there are no rows and nothing more', () => {
    render(<Feed hasMore={false} items={[]} />);
    expect(screen.getByText('Событий нет')).toBeDefined();
    expect(screen.queryByRole('list')).toBeNull();
  });

  describe('with «Показать ещё»', () => {
    it('loads on click only, keeps the button width while busy and never watches the scroll', () => {
      const onLoadMore = vi.fn();
      const { rerender } = render(<Feed trigger="button" onLoadMore={onLoadMore} />);
      expect(observers.every((observer) => observer.targets.length === 0)).toBe(true);
      const button = screen.getByRole('button', { name: /Показать ещё 20/ });
      expect(button.textContent).toBe('Показать ещё 20из 148');
      fireEvent.click(button);
      expect(onLoadMore).toHaveBeenCalledTimes(1);
      rerender(<Feed trigger="button" onLoadMore={onLoadMore} status="loading" />);
      const busy = screen.getByRole('button', { name: /Показать ещё 20/ });
      expect(busy.getAttribute('aria-busy')).toBe('true');
      expect(busy.textContent).toBe('Показать ещё 20из 148');
      fireEvent.click(busy);
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('moves focus to the first new row and announces «Загружено 20»', () => {
      render(<Remote trigger="button" />);
      fireEvent.click(screen.getByRole('button', { name: /Показать ещё/ }));
      fireEvent.click(screen.getByRole('button', { name: 'resolve' }));
      expect(rows()).toHaveLength(40);
      expect(document.activeElement).toBe(rows()[20]);
      expect(screen.getByRole('status').textContent).toBe('Загружено 20');
    });
  });

  it('announces a loaded page in auto mode without moving focus', () => {
    render(<Remote />);
    near(true);
    // the new rows push the sentinel out of reach
    near(false);
    fireEvent.click(screen.getByRole('button', { name: 'resolve' }));
    expect(rows()).toHaveLength(40);
    expect(screen.getByRole('status').textContent).toBe('Загружено 20');
    expect(document.activeElement).not.toBe(rows()[20]);
  });

  it('announces an error of the next page', () => {
    render(<Remote fail />);
    near(true);
    fireEvent.click(screen.getByRole('button', { name: 'resolve' }));
    expect(screen.getByRole('status').textContent).toBe('Не загрузилось — нет сети');
  });
});
