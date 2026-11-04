import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { VirtualList, type VirtualListGroup } from '..';

// jsdom has no layout: the viewport is 440 high, a row is as high as its data-h (56 by default).
const VIEWPORT = 440;
const offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight') as PropertyDescriptor;
const scrollTo = Element.prototype.scrollTo;
const ResizeObserverStub = globalThis.ResizeObserver;
// like a browser: the first size of an element is reported right after observe()
class ReportingResizeObserver implements ResizeObserver {
  private readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element): void {
    queueMicrotask(() => this.callback([{ target } as ResizeObserverEntry], this));
  }
  unobserve(): void {}
  disconnect(): void {}
}
beforeAll(() => {
  globalThis.ResizeObserver = ReportingResizeObserver;
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.slot === 'scroll-area-viewport' ? VIEWPORT : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      const content = this.querySelector<HTMLElement>('[data-h]');
      return content ? Number(content.dataset.h) : 0;
    },
  });
  // like a browser: no scroll event when the position does not change
  Element.prototype.scrollTo = function scrollTo(this: Element, options?: ScrollToOptions | number) {
    const top = typeof options === 'number' ? options : (options?.top ?? 0);
    if (top === this.scrollTop) return;
    this.scrollTop = top;
    this.dispatchEvent(new Event('scroll'));
  } as Element['scrollTo'];
});
afterAll(() => {
  // clientHeight lives on Element.prototype: dropping the override brings it back
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offsetHeight);
  Element.prototype.scrollTo = scrollTo;
  globalThis.ResizeObserver = ResizeObserverStub;
});

const row = (index: number) => <div data-h="56">Клиент {index + 1}</div>;
const viewport = () => document.querySelector('[data-slot=scroll-area-viewport]') as HTMLElement;
const scrollViewport = (top: number) =>
  act(() => {
    viewport().scrollTop = top;
    fireEvent.scroll(viewport());
  });
const rows = () => screen.getAllByRole('listitem');

describe('VirtualList', () => {
  it('keeps only the window and the overscan in the DOM, with an honest height', () => {
    render(<VirtualList aria-label="Клиенты" count={1284} renderRow={row} />);

    const list = screen.getByRole('list', { name: 'Клиенты' });
    // 440 / 56 ≈ 8 visible + 6 below
    expect(rows().length).toBeGreaterThanOrEqual(8);
    expect(rows().length).toBeLessThanOrEqual(20);
    expect(list.style.height).toBe(`${1284 * 56}px`);
    expect(rows()[0]?.getAttribute('aria-setsize')).toBe('1284');
    expect(rows()[0]?.getAttribute('aria-posinset')).toBe('1');
  });

  it('renders the rows under the scroll position', async () => {
    render(<VirtualList aria-label="Клиенты" count={1284} renderRow={row} />);

    scrollViewport(700 * 56);

    await waitFor(() => expect(screen.getByText('Клиент 701')).toBeTruthy());
    expect(screen.queryByText('Клиент 1')).toBeNull();
    expect(rows().length).toBeLessThanOrEqual(30);
  });

  it('renders nothing again while the scroll stays inside the same rows', async () => {
    const renderRow = vi.fn(row);
    render(<VirtualList aria-label="Клиенты" count={1284} renderRow={renderRow} />);
    // the first move sets the direction and adds the rows ahead; at 10 the ninth row (top 448) peeks in
    scrollViewport(10);
    renderRow.mockClear();

    // the same rows 1–9 stay in the window
    scrollViewport(20);
    scrollViewport(40);

    await act(async () => {});
    expect(renderRow).not.toHaveBeenCalled();
  });

  it('renders only the rows that enter the window when it moves', async () => {
    const renderRow = vi.fn(row);
    render(<VirtualList aria-label="Клиенты" count={1284} renderRow={renderRow} />);
    scrollViewport(20 * 56);
    await waitFor(() => expect(screen.getByText('Клиент 21')).toBeTruthy());
    const before = new Set(rows().map((item) => Number(item.getAttribute('aria-posinset')) - 1));
    renderRow.mockClear();

    scrollViewport(21 * 56);

    await waitFor(() => expect(screen.queryByText('Клиент 15')).toBeNull());
    // the rows already on screen keep their render; only the ones coming in are drawn
    expect(renderRow).toHaveBeenCalled();
    for (const [index] of renderRow.mock.calls) expect(before.has(index), `row ${index + 1}`).toBe(false);
  });

  it('shows a placeholder of the row height while the row has no data', () => {
    render(<VirtualList aria-label="Клиенты" count={100} renderRow={(index) => (index < 2 ? row(index) : null)} />);

    expect(screen.getByText('Клиент 2')).toBeTruthy();
    expect(rows()[2]?.querySelector('[data-slot=virtual-list-placeholder]')).toBeTruthy();
    expect(rows()[2]?.getAttribute('aria-busy')).toBe('true');
  });

  it('holds the placeholder back for 100 ms at rest, but shows it at once for rows that scroll in', async () => {
    render(<VirtualList aria-label="Клиенты" count={1284} renderRow={() => null} />);
    const placeholderOf = (posinset: number) =>
      document.querySelector(`[aria-posinset="${posinset}"] [data-slot=virtual-list-placeholder]`) as HTMLElement | null;
    expect(placeholderOf(1)?.hasAttribute('data-delayed')).toBe(true);

    scrollViewport(600 * 56);

    await waitFor(() => expect(placeholderOf(601)).toBeTruthy());
    expect(placeholderOf(601)?.hasAttribute('data-delayed')).toBe(false);
  });

  it('fills the empty height around the rendered rows with skeleton rows, so a fast scroll never shows white', async () => {
    render(<VirtualList aria-label="Клиенты" count={1284} renderRow={row} />);
    const fillers = () => [...document.querySelectorAll<HTMLElement>('[data-slot=virtual-list-filler]')];

    scrollViewport(600 * 56);
    await waitFor(() => expect(screen.getByText('Клиент 601')).toBeTruthy());

    const posinsets = rows().map((item) => Number(item.getAttribute('aria-posinset')));
    const first = Math.min(...posinsets) - 1;
    const last = Math.max(...posinsets) - 1;
    const [above, below] = fillers();
    expect(above?.style.top).toBe('0px');
    expect(above?.style.height).toBe(`${first * 56}px`);
    expect(below?.style.top).toBe(`${(last + 1) * 56}px`);
    expect(below?.style.height).toBe(`${(1284 - last - 1) * 56}px`);
    expect(above?.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes a placeholder of its own', () => {
    render(<VirtualList aria-label="Журнал" count={100} renderRow={() => null} placeholder={<span>Загружается…</span>} />);

    expect(screen.getAllByText('Загружается…').length).toBeGreaterThan(0);
  });

  it('reports the rendered rows so the data can come in pages', async () => {
    const onRangeChange = vi.fn();
    render(<VirtualList aria-label="Клиенты" count={1284} renderRow={() => null} onRangeChange={onRangeChange} />);

    expect(onRangeChange).toHaveBeenLastCalledWith(0, expect.any(Number));
    scrollViewport(450 * 56);

    await waitFor(() => {
      const [start, end] = onRangeChange.mock.lastCall as [number, number];
      expect(start).toBeLessThanOrEqual(450);
      expect(end).toBeGreaterThanOrEqual(457);
    });
  });

  describe('groups', () => {
    const groups: VirtualListGroup[] = [
      { title: 'А', description: '30 клиентов', count: 30 },
      { title: 'Б', description: '40 клиентов', count: 40 },
      { title: 'В', description: '30 клиентов', count: 30 },
    ];

    it('puts a 32 header above each group and counts only rows for the reader', () => {
      render(<VirtualList aria-label="Клиенты" count={100} groups={groups} renderRow={row} />);

      const list = screen.getByRole('list');
      expect(list.style.height).toBe(`${100 * 56 + 3 * 32}px`);
      expect(within(list).getByText('30 клиентов')).toBeTruthy();
      expect(rows()[0]?.getAttribute('aria-posinset')).toBe('1');
      expect(rows()[0]?.getAttribute('aria-setsize')).toBe('100');
    });

    it('keeps the header of the current group stuck on top', async () => {
      render(<VirtualList aria-label="Клиенты" count={100} groups={groups} renderRow={row} />);
      const sticky = () => document.querySelector('[data-slot=virtual-list-sticky]') as Element;
      expect(sticky().textContent).toContain('А');

      // inside «Б»: header А (32) + 30 rows + header Б + 5 rows
      scrollViewport(32 + 30 * 56 + 32 + 5 * 56);

      await waitFor(() => expect(sticky().textContent).toContain('Б'));
      expect(sticky()?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('measures rows of different heights', async () => {
    render(
      <VirtualList
        aria-label="Сообщения"
        count={3}
        measureRows
        renderRow={(index) => <div data-h={[40, 120, 80][index]}>Сообщение {index + 1}</div>}
      />,
    );

    await waitFor(() => expect(screen.getByRole('list').style.height).toBe('240px'));
  });

  it('shows a skeleton for the window on the first load', () => {
    render(<VirtualList aria-label="Клиенты" count={0} loading renderRow={row} />);

    const list = screen.getByRole('list');
    expect(list?.getAttribute('aria-busy')).toBe('true');
    expect(list.querySelectorAll('[data-slot=virtual-list-placeholder]').length).toBeGreaterThanOrEqual(8);
  });

  it('shows the empty state when there are no rows', () => {
    render(<VirtualList aria-label="Клиенты" count={0} renderRow={row} empty={<p>Нет клиентов на «Щ»</p>} />);

    expect(screen.getByText('Нет клиентов на «Щ»')).toBeTruthy();
    expect(screen.queryByRole('listitem')).toBeNull();
  });

  it('puts the footer after the last row', () => {
    render(<VirtualList aria-label="Клиенты" count={2} renderRow={row} footer={<p>Это все 2 клиента</p>} />);

    const footer = screen.getByText('Это все 2 клиента');
    expect(screen.getByRole('list').compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('jumps to the edges with End and Home and moves focus to the row', async () => {
    render(<VirtualList aria-label="Клиенты" count={1284} renderRow={row} />);

    fireEvent.keyDown(viewport(), { key: 'End' });
    await waitFor(() => expect(document.activeElement?.getAttribute('aria-posinset')).toBe('1284'));
    expect(screen.getByText('Клиент 1284')).toBeTruthy();

    fireEvent.keyDown(viewport(), { key: 'Home' });
    await waitFor(() => expect(document.activeElement?.getAttribute('aria-posinset')).toBe('1'));
  });

  it('keeps the focused row in the DOM when it scrolls away', async () => {
    render(<VirtualList aria-label="Клиенты" count={1284} renderRow={(index) => <button data-h="56">Открыть {index + 1}</button>} />);

    act(() => screen.getByText('Открыть 3').focus());
    scrollViewport(600 * 56);

    await waitFor(() => expect(screen.getByText('Открыть 601')).toBeTruthy());
    expect(screen.getByText('Открыть 3')).toBe(document.activeElement);
  });

  it('shows the position while scrolling fast and hides it after 800 ms', async () => {
    const groups: VirtualListGroup[] = [
      { title: 'А', count: 400 },
      { title: 'К', count: 884 },
    ];
    render(<VirtualList aria-label="Клиенты" count={1284} groups={groups} renderRow={row} />);
    const indicator = () => document.querySelector('[data-slot=virtual-list-position]') as Element;
    expect(indicator().hasAttribute('data-visible')).toBe(false);

    scrollViewport(5 * VIEWPORT);
    scrollViewport(32 + 400 * 56 + 32 + 11 * 56);

    await waitFor(() => expect(indicator().hasAttribute('data-visible')).toBe(true));
    expect(indicator().textContent).toMatch(/К\s*412–419\sиз\s1\s284/);
    await waitFor(() => expect(indicator().hasAttribute('data-visible')).toBe(false), { timeout: 1500 });
  });

  it('shows the position while the scrollbar thumb is held, however slowly it moves', async () => {
    render(<VirtualList aria-label="Клиенты" count={1284} renderRow={row} />);
    const indicator = () => document.querySelector('[data-slot=virtual-list-position]') as Element;
    // jsdom never measures the viewport as scrollable, so Base UI draws no bar: stand one in with the same slot
    const scrollbar = document.createElement('div');
    scrollbar.dataset.slot = 'scroll-area-scrollbar';
    document.querySelector('[data-slot=scroll-area]')?.append(scrollbar);

    fireEvent.pointerDown(scrollbar);
    await waitFor(() => expect(indicator().hasAttribute('data-visible')).toBe(true));
    scrollViewport(112);
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(indicator().hasAttribute('data-visible')).toBe(true);

    fireEvent.pointerUp(window);
    await waitFor(() => expect(indicator().hasAttribute('data-visible')).toBe(false), { timeout: 1500 });
  });
});
