import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TableOfContents, type TableOfContentsItem, type TableOfContentsProps } from '..';

const items: readonly TableOfContentsItem[] = [
  { id: 'prepare', label: 'Подготовка' },
  { id: 'export', label: 'Экспорт из старой системы' },
  { id: 'mapping', label: 'Сопоставление полей' },
  { id: 'contacts', label: 'Контакты', level: 3 },
  { id: 'deals', label: 'Сделки', level: 3 },
  { id: 'duplicates', label: 'Проверка дублей' },
  { id: 'run', label: 'Запуск импорта' },
];

// jsdom has no layout: every section is 400 high, laid out from the top of a 500 high scroller.
const SECTION = 400;
const SCREEN = 500;
const CONTENT = items.length * SECTION + 100;

function Article(props: Omit<TableOfContentsProps, 'items' | 'root'>) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div
      data-testid="scroller"
      ref={(node) => {
        root.current = node;
        if (!node) return;
        Object.defineProperty(node, 'clientHeight', { configurable: true, value: SCREEN });
        Object.defineProperty(node, 'scrollHeight', { configurable: true, value: CONTENT });
        node.getBoundingClientRect = () => new DOMRect(0, 0, 800, SCREEN);
        node.querySelectorAll<HTMLElement>('h2, h3').forEach((heading, index) => {
          heading.getBoundingClientRect = () => new DOMRect(0, index * SECTION - node.scrollTop, 600, 32);
        });
      }}
    >
      <h1>Импорт клиентов</h1>
      {items.map((item) => (item.level === 3 ? <h3 key={item.id} id={item.id}>{item.label}</h3> : <h2 key={item.id} id={item.id}>{item.label}</h2>))}
      <TableOfContents items={items} root={root} {...props} />
    </div>
  );
}

function scroll(top: number): void {
  const node = screen.getByTestId('scroller');
  act(() => {
    node.scrollTop = top;
    node.dispatchEvent(new Event('scroll'));
  });
}

const list = () => screen.getByRole('navigation', { name: 'На этой странице' });
const link = (name: string) => within(list()).getByRole('link', { name });
const state = (name: string) => link(name).getAttribute('data-state');

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('data-reduce-motion');
});

describe('TableOfContents', () => {
  it('is a navigation landmark named by its caption, with links to the sections', () => {
    render(<Article />);
    expect(list().getAttribute('data-slot')).toBe('table-of-contents');
    expect(link('Подготовка').getAttribute('href')).toBe('#prepare');
    expect(link('Контакты').closest('[data-level]')?.getAttribute('data-level')).toBe('3');
    expect(within(list()).getAllByRole('link').length).toBeGreaterThanOrEqual(items.length);
  });

  it('marks the section under the 88 line as current, earlier ones read, later ones ahead', () => {
    render(<Article />);
    scroll(SECTION * 2 - 60);
    expect(link('Сопоставление полей').getAttribute('aria-current')).toBe('true');
    expect(state('Сопоставление полей')).toBe('active');
    expect(state('Подготовка')).toBe('read');
    expect(state('Экспорт из старой системы')).toBe('read');
    expect(state('Контакты')).toBe('ahead');
    expect(link('Подготовка').hasAttribute('aria-current')).toBe(false);
  });

  it('starts on the first section and ends on the last one at the bottom of the page', () => {
    render(<Article />);
    expect(state('Подготовка')).toBe('active');
    scroll(CONTENT - SCREEN);
    expect(state('Запуск импорта')).toBe('active');
  });

  it('follows a custom offset', () => {
    render(<Article offset={300} />);
    scroll(SECTION - 250);
    expect(state('Экспорт из старой системы')).toBe('active');
  });

  it('click scrolls the section to the offset line and focuses its heading', () => {
    render(<Article />);
    const node = screen.getByTestId('scroller');
    const scrollTo = vi.fn();
    node.scrollTo = scrollTo;
    fireEvent.click(link('Проверка дублей'));
    expect(scrollTo).toHaveBeenCalledWith({ top: SECTION * 5 - 88, behavior: 'smooth' });
    const heading = screen.getByRole('heading', { name: 'Проверка дублей' });
    expect(document.activeElement).toBe(heading);
    expect(heading.getAttribute('tabindex')).toBe('-1');
  });

  it('jumps at once under reduced motion', () => {
    document.documentElement.setAttribute('data-reduce-motion', '');
    render(<Article />);
    const node = screen.getByTestId('scroller');
    const scrollTo = vi.fn();
    node.scrollTo = scrollTo;
    fireEvent.click(link('Подготовка'));
    expect(scrollTo).toHaveBeenCalledWith({ top: -88, behavior: 'auto' });
  });

  it('narrow screen: a capsule says which top-level section of how many, with a segment per section', () => {
    render(<Article />);
    scroll(SECTION * 3 - 60);
    const capsule = document.querySelector('[data-slot=table-of-contents-capsule]');
    expect(capsule?.textContent).toContain('Раздел 3 из 5');
    expect(capsule?.textContent).toContain('Контакты');
    const segments = [...document.querySelectorAll('[data-slot=table-of-contents-progress] > *')].map((segment) =>
      segment.getAttribute('data-state'),
    );
    expect(segments).toEqual(['read', 'read', 'active', 'ahead', 'ahead']);
  });

  it('the capsule opens the same list in a popover and a pick closes it', () => {
    render(<Article />);
    const capsule = document.querySelector<HTMLElement>('[data-slot=table-of-contents-capsule]');
    if (!capsule) throw new Error('no capsule');
    expect(capsule.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(capsule);
    const popup = document.querySelector<HTMLElement>('[data-slot=table-of-contents-popup]');
    if (!popup) throw new Error('no popup');
    const node = screen.getByTestId('scroller');
    node.scrollTo = vi.fn();
    fireEvent.click(within(popup).getByRole('link', { name: 'Сделки' }));
    expect(node.scrollTo).toHaveBeenCalled();
    expect(capsule.getAttribute('aria-expanded')).toBe('false');
  });

  it('«Наверх» under the list scrolls to the top; backToTop={false} drops it', () => {
    const { unmount } = render(<Article />);
    const node = screen.getByTestId('scroller');
    const scrollTo = vi.fn();
    node.scrollTo = scrollTo;
    fireEvent.click(within(list()).getByRole('button', { name: 'Наверх' }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    unmount();
    render(<Article backToTop={false} />);
    expect(within(list()).queryByRole('button', { name: 'Наверх' })).toBeNull();
  });

  it('takes its own caption', () => {
    render(<Article title="Содержание" />);
    expect(screen.getByRole('navigation', { name: 'Содержание' })).toBeDefined();
  });
});
