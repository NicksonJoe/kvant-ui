import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Marquee } from '..';

function Logos(props: Partial<Parameters<typeof Marquee>[0]>) {
  return (
    <Marquee aria-label="Клиенты" {...props}>
      <span>Орбита Лаб</span>
      <span>Студия Север</span>
      <a href="/clients/kvadrat">квадрат</a>
    </Marquee>
  );
}

const slot = (name: string) => document.querySelector(`[data-slot=${name}]`);

describe('Marquee', () => {
  it('renders the row once as a named list, each child an item', () => {
    render(<Logos />);
    const list = screen.getByRole('list', { name: 'Клиенты' });
    expect(list.getAttribute('data-slot')).toBe('marquee-list');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(list.querySelectorAll('[data-slot=marquee-item]')).toHaveLength(3);
  });

  it('repeats the row for a seamless loop; the copies are hidden from readers and keyboard', () => {
    render(<Logos />);
    const lists = document.querySelectorAll('[data-slot=marquee-list]');
    expect(lists).toHaveLength(2);
    const copy = lists[1];
    expect(copy?.getAttribute('aria-hidden')).toBe('true');
    expect(copy?.hasAttribute('inert')).toBe(true);
    // only the first row is reachable: one link, not two
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('moves one row per loop: the track knows how many copies it holds', () => {
    render(<Logos />);
    const style = slot('marquee-track')?.getAttribute('style') ?? '';
    expect(style).toContain('--kv-marquee-copies: 2');
    expect(style).toContain('--kv-marquee-duration: 40s');
  });

  it('takes the loop time, step and edge fade from props', () => {
    render(<Logos duration={60} gap={48} fade={96} />);
    expect(slot('marquee-track')?.getAttribute('style')).toContain('--kv-marquee-duration: 60s');
    expect(slot('marquee')?.getAttribute('style')).toContain('--kv-marquee-gap: 48px');
    expect(slot('marquee-viewport')?.getAttribute('style')).toContain('96px');
  });

  it('fades both edges with a mask, so it works on any surface', () => {
    render(<Logos />);
    const style = slot('marquee-viewport')?.getAttribute('style') ?? '';
    expect(style).toContain('mask-image');
    expect(style).toContain('160px');
    expect(slot('marquee-viewport')?.className).toContain('kv-marquee');
  });

  it('shows the caption above the row and names the list by it', () => {
    render(
      <Marquee caption="Норде доверяют 1 200 студий и агентств">
        <span>Орбита Лаб</span>
      </Marquee>,
    );
    expect(slot('marquee-caption')?.textContent).toBe('Норде доверяют 1 200 студий и агентств');
    expect(screen.getByRole('list', { name: 'Норде доверяют 1 200 студий и агентств' })).toBeDefined();
  });

  it('draws items 24 high in fg-3', () => {
    render(<Logos />);
    expect(slot('marquee-item')?.className).toContain('h-6');
    expect(slot('marquee')?.className).toContain('text-fg-3');
  });
});

describe('Marquee copies', () => {
  const ROW = 300;
  const observers: ResizeObserverCallback[] = [];
  const ResizeObserverStub = globalThis.ResizeObserver;
  const VIEWPORT = 1000;
  class ManualResizeObserver implements ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      observers.push(callback);
    }
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  const resize = () => act(() => observers.forEach((callback) => callback([], new ManualResizeObserver(() => {}))));
  const copies = () => document.querySelectorAll('[data-slot=marquee-list]').length;

  beforeEach(() => {
    globalThis.ResizeObserver = ManualResizeObserver;
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset.slot === 'marquee-list' ? ROW : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset.slot === 'marquee-viewport' ? VIEWPORT : 0;
      },
    });
  });
  afterEach(() => {
    globalThis.ResizeObserver = ResizeObserverStub;
    Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    observers.length = 0;
  });

  it('covers a wide viewport with a spare copy waiting off-screen', () => {
    render(<Logos />);
    resize();
    expect(copies()).toBe(5);
  });

  it('takes no width from its own track: in a w-max preview more copies would widen it and ask for more copies', () => {
    render(<Logos />);
    const viewport = slot('marquee-viewport');
    expect(viewport?.className).toContain('[contain:inline-size]');
    expect(viewport?.className).toContain('[contain-intrinsic-inline-size:40rem]');
  });
});
