import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackToTop, scrollToTop, type BackToTopProps } from '..';

// jsdom has no layout: the scroller is 500 high with 3000 of content, so two screens are 1000.
const SCREEN = 500;
const CONTENT = 3000;

function sized(element: HTMLElement, height = SCREEN, scrollHeight = CONTENT): void {
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: height });
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: scrollHeight });
  element.getBoundingClientRect = () => new DOMRect(0, 0, 800, height);
}

function scroll(element: HTMLElement, top: number): void {
  act(() => {
    element.scrollTop = top;
    element.dispatchEvent(new Event('scroll'));
  });
}

function Page({ children, ...props }: Omit<BackToTopProps, 'root'> & { children?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={(node) => {
        if (node) sized(node);
        root.current = node;
      }}
      data-testid="scroller"
    >
      <h1>Импорт клиентов</h1>
      {children}
      <BackToTop root={root} {...props} />
    </div>
  );
}

// The dock carries position and show / hide; the button inside carries hover, press and focus.
const dock = () => document.querySelector<HTMLElement>('[data-slot=back-to-top]');
const button = () => document.querySelector<HTMLButtonElement>('[data-slot=back-to-top-button]');
const scroller = () => screen.getByTestId('scroller');
const shown = () => dock()?.hasAttribute('data-visible') === true && dock()?.hasAttribute('inert') === false;

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.style.removeProperty('--kv-toast-lift');
  document.documentElement.removeAttribute('data-reduce-motion');
});

describe('BackToTop', () => {
  it('is hidden and out of reach at the top of the page', () => {
    render(<Page />);
    expect(button()).not.toBeNull();
    expect(shown()).toBe(false);
    expect(dock()?.hasAttribute('inert')).toBe(true);
  });

  it('shows deeper than two screens and keeps its state between one and two (hysteresis)', () => {
    render(<Page />);
    scroll(scroller(), 1200);
    expect(shown()).toBe(true);
    scroll(scroller(), 700);
    expect(shown()).toBe(true);
    scroll(scroller(), 400);
    expect(shown()).toBe(false);
    scroll(scroller(), 900);
    expect(shown()).toBe(false);
  });

  it('icon: a 44 circle named «Наверх» by aria-label', () => {
    render(<Page visible />);
    expect(button()?.getAttribute('aria-label')).toBe('Наверх');
    expect(dock()?.getAttribute('data-variant')).toBe('icon');
    expect(button()?.textContent).toBe('');
  });

  it('label: a capsule whose visible text is the name', () => {
    render(<Page visible variant="label" label="К началу" />);
    expect(button()?.hasAttribute('aria-label')).toBe(false);
    expect(button()?.textContent).toBe('К началу');
    expect(screen.getByRole('button', { name: 'К началу' })).toBe(button());
  });

  it('progress: the ring is scrollTop / (scrollHeight − clientHeight), without smoothing', () => {
    render(<Page variant="progress" />);
    const arc = () => document.querySelector('[data-slot=back-to-top-progress]');
    scroll(scroller(), 1250);
    expect(arc()?.getAttribute('stroke-dasharray')).toBe('50 100');
    scroll(scroller(), 2500);
    expect(arc()?.getAttribute('stroke-dasharray')).toBe('100 100');
    expect(button()?.getAttribute('aria-label')).toBe('Наверх');
  });

  it('progress={…} draws a share of your own instead of the scroll position', () => {
    render(<Page variant="progress" progress={0.62} />);
    scroll(scroller(), 1250);
    expect(document.querySelector('[data-slot=back-to-top-progress]')?.getAttribute('stroke-dasharray')).toBe('62 100');
  });

  it('visible={true} shows it without scrolling, visible={false} hides it deep down (bulk bar open)', () => {
    const { rerender } = render(<Page visible />);
    expect(shown()).toBe(true);
    rerender(<Page visible={false} />);
    scroll(scroller(), 2000);
    expect(shown()).toBe(false);
  });

  it('click scrolls the root to the top smoothly and moves focus to the first heading', () => {
    render(<Page visible />);
    const scrollTo = vi.fn();
    scroller().scrollTo = scrollTo;
    fireEvent.click(screen.getByRole('button', { name: 'Наверх' }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    const heading = screen.getByRole('heading', { name: 'Импорт клиентов' });
    expect(document.activeElement).toBe(heading);
    expect(heading.getAttribute('tabindex')).toBe('-1');
  });

  it('jumps at once under reduced motion', () => {
    document.documentElement.setAttribute('data-reduce-motion', '');
    render(<Page visible />);
    const scrollTo = vi.fn();
    scroller().scrollTo = scrollTo;
    fireEvent.click(screen.getByRole('button', { name: 'Наверх' }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('a prevented onClick keeps the page where it is', () => {
    render(<Page visible onClick={(event) => event.preventDefault()} />);
    const scrollTo = vi.fn();
    scroller().scrollTo = scrollTo;
    fireEvent.click(screen.getByRole('button', { name: 'Наверх' }));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('on a phone shows only while the page is scrolled up', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ matches: query.includes('640'), media: query }) as MediaQueryList);
    render(<Page />);
    scroll(scroller(), 1500);
    expect(shown()).toBe(false);
    scroll(scroller(), 1400);
    expect(shown()).toBe(true);
    scroll(scroller(), 1450);
    expect(shown()).toBe(false);
  });

  it('placement: absolute in its own scroller, fixed in the window, inline without offsets', () => {
    const { unmount } = render(<Page visible />);
    expect(dock()?.getAttribute('data-placement')).toBe('absolute');
    expect(dock()?.className.split(' ')).toContain('absolute');
    unmount();
    const fixed = render(<BackToTop visible />);
    expect(dock()?.className.split(' ')).toContain('fixed');
    fixed.unmount();
    render(<BackToTop visible placement="inline" />);
    const classes = dock()?.className.split(' ') ?? [];
    expect(classes).not.toContain('fixed');
    expect(classes).not.toContain('absolute');
    expect(classes).not.toContain('right-6');
  });

  it('fab: marks the phone place above the Fab', () => {
    render(<Page visible fab />);
    expect(dock()?.hasAttribute('data-fab')).toBe(true);
  });

  it('lifts itself above the footer once the footer enters the screen', () => {
    function WithFooter() {
      const root = useRef<HTMLDivElement>(null);
      const footer = useRef<HTMLElement>(null);
      return (
        <div
          ref={(node) => {
            if (node) sized(node);
            root.current = node;
          }}
          data-testid="scroller"
        >
          <footer
            ref={(node) => {
              if (node) node.getBoundingClientRect = () => new DOMRect(0, 380, 800, 200);
              footer.current = node;
            }}
          />
          <BackToTop root={root} footer={footer} visible />
        </div>
      );
    }
    render(<WithFooter />);
    scroll(scroller(), 2500);
    expect(dock()?.style.getPropertyValue('--kv-lift')).toBe('120px');
  });

  it('listens to the window when there is no root and lifts the toasts while shown', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: SCREEN });
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: CONTENT });
    const { unmount } = render(<BackToTop />);
    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 1500 });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(shown()).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--kv-toast-lift')).not.toBe('');
    unmount();
    expect(document.documentElement.style.getPropertyValue('--kv-toast-lift')).toBe('');
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });
});

describe('scrollToTop', () => {
  it('scrolls the window when no root is given', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    scrollToTop();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
