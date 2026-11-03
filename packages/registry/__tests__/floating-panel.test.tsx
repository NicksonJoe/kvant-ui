import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FloatingPanel, type FloatingPanelPosition } from '..';

const WIDTH = 360;
const HEIGHT = 240;
const panel = () => document.querySelector<HTMLElement>('[data-slot=floating-panel]');
const header = () => document.querySelector<HTMLElement>('[data-slot=floating-panel-header]');
const px = (value: string) => Number.parseFloat(value) || 0;

// jsdom has no layout: place the panel from its own left/right/top/bottom in a 1024 × 768 window.
function rectOf(element: Element): DOMRect {
  if (!(element instanceof HTMLElement) || element.dataset.slot !== 'floating-panel') return new DOMRect();
  const { left, right, top, bottom } = element.style;
  const x = left ? px(left) : window.innerWidth - px(right) - WIDTH;
  const y = top ? px(top) : window.innerHeight - px(bottom) - HEIGHT;
  return new DOMRect(x, y, WIDTH, HEIGHT);
}

function drag(dx: number, dy: number, from = { x: 700, y: 530 }) {
  const handle = header();
  if (!handle) throw new Error('no header');
  fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: from.x, clientY: from.y });
  fireEvent.pointerMove(window, { pointerId: 1, clientX: from.x + dx / 2, clientY: from.y + dy / 2 });
  fireEvent.pointerMove(window, { pointerId: 1, clientX: from.x + dx, clientY: from.y + dy });
  fireEvent.pointerUp(window, { pointerId: 1, clientX: from.x + dx, clientY: from.y + dy });
}

function Notes(props: Partial<Parameters<typeof FloatingPanel>[0]>) {
  return (
    <FloatingPanel defaultOpen title="Заметки к звонку" badge="2 из 3" footer={<span>Сохранено в 14:32</span>} {...props}>
      <p>«Орбита Лаб» · созвон 14:00–14:30</p>
    </FloatingPanel>
  );
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return rectOf(this);
  });
  window.localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

describe('FloatingPanel', () => {
  it('is a non-modal dialog named by its title, portalled above the page', () => {
    render(<Notes />);
    const dialog = screen.getByRole('dialog', { name: 'Заметки к звонку' });
    expect(dialog.getAttribute('aria-modal')).toBe('false');
    expect(dialog.getAttribute('data-slot')).toBe('floating-panel');
    expect(dialog.closest('[data-slot=portal]')).not.toBeNull();
    expect(dialog.className).toContain('fixed');
    expect(document.querySelector('[data-slot=floating-panel-body]')?.textContent).toContain('«Орбита Лаб»');
    expect(document.querySelector('[data-slot=floating-panel-footer]')?.textContent).toBe('Сохранено в 14:32');
  });

  it('starts 16 px from the bottom right corner', () => {
    render(<Notes />);
    expect(panel()?.style.right).toBe('16px');
    expect(panel()?.style.bottom).toBe('16px');
  });

  it('renders nothing while closed', () => {
    render(<Notes defaultOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('«Закрыть» closes it and reports the change', () => {
    const onOpenChange = vi.fn();
    render(<Notes onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('collapses into a capsule with the badge and expands back', () => {
    const onCollapsedChange = vi.fn();
    render(<Notes onCollapsedChange={onCollapsedChange} />);
    expect(document.querySelector('[data-slot=floating-panel-badge]')).toBeNull();
    const collapse = screen.getByRole('button', { name: 'Свернуть' });
    expect(collapse.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(collapse);
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(panel()?.hasAttribute('data-collapsed')).toBe(true);
    expect(document.querySelector('[data-slot=floating-panel-badge]')?.textContent).toBe('2 из 3');
    expect(document.querySelector('[data-slot=floating-panel-content]')?.hasAttribute('inert')).toBe(true);
    const expand = screen.getByRole('button', { name: 'Развернуть' });
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(expand);
    expect(panel()?.hasAttribute('data-collapsed')).toBe(false);
  });

  it('follows the pointer 1:1 while dragged, lifted', () => {
    render(<Notes />);
    const handle = header();
    if (!handle) throw new Error('no header');
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 700, clientY: 530 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 650, clientY: 500 });
    expect(panel()?.hasAttribute('data-dragging')).toBe(true);
    expect(panel()?.style.translate).toBe('-50px -30px');
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 650, clientY: 500 });
    expect(panel()?.hasAttribute('data-dragging')).toBe(false);
  });

  it('docks to the nearest corner where it is dropped and reports the position', () => {
    const onPositionChange = vi.fn();
    render(<Notes onPositionChange={onPositionChange} />);
    // from left 648, top 512 to left 548, top 472
    drag(-100, -40);
    const position: FloatingPanelPosition = { corner: 'bottom-right', x: 116, y: 56 };
    expect(onPositionChange).toHaveBeenLastCalledWith(position);
    expect(panel()?.style.right).toBe('116px');
    expect(panel()?.style.bottom).toBe('56px');
  });

  it('springs back inside the window, 16 px from the edge', () => {
    render(<Notes />);
    drag(300, 100);
    expect(panel()?.style.right).toBe('16px');
    expect(panel()?.style.bottom).toBe('16px');
  });

  it('snaps to the 16 px line when dropped closer than 16 to it', () => {
    const onPositionChange = vi.fn();
    render(<Notes onPositionChange={onPositionChange} />);
    // left 48 stays, top 22 snaps to 16
    drag(-600, -490);
    expect(onPositionChange).toHaveBeenLastCalledWith({ corner: 'top-left', x: 48, y: 16 });
    expect(panel()?.style.left).toBe('48px');
    expect(panel()?.style.top).toBe('16px');
  });

  it('ignores presses on its buttons and the secondary mouse button', () => {
    render(<Notes />);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Закрыть' }), { pointerId: 1, button: 0, clientX: 990, clientY: 530 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 900, clientY: 500 });
    expect(panel()?.hasAttribute('data-dragging')).toBe(false);
    const handle = header();
    if (handle) fireEvent.pointerDown(handle, { pointerId: 2, button: 2, clientX: 700, clientY: 530 });
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 600, clientY: 500 });
    expect(panel()?.hasAttribute('data-dragging')).toBe(false);
  });

  it('moves from the keyboard: arrows on the grip step 16 px, with Shift 64 px', () => {
    render(<Notes />);
    const grip = screen.getByRole('button', { name: 'Переместить панель' });
    fireEvent.keyDown(grip, { key: 'ArrowLeft' });
    expect(panel()?.style.right).toBe('32px');
    fireEvent.keyDown(grip, { key: 'ArrowUp', shiftKey: true });
    expect(panel()?.style.bottom).toBe('80px');
    fireEvent.keyDown(grip, { key: 'ArrowRight' });
    fireEvent.keyDown(grip, { key: 'ArrowRight' });
    fireEvent.keyDown(grip, { key: 'ArrowRight' });
    expect(panel()?.style.right).toBe('16px');
  });

  it('remembers the position under storageKey', () => {
    const { unmount } = render(<Notes storageKey="call-notes" />);
    drag(-100, -40);
    expect(JSON.parse(window.localStorage.getItem('call-notes') ?? 'null')).toEqual({ corner: 'bottom-right', x: 116, y: 56 });
    unmount();
    render(<Notes storageKey="call-notes" />);
    expect(panel()?.style.right).toBe('116px');
    expect(panel()?.style.bottom).toBe('56px');
  });

  it('ignores a broken saved position', () => {
    window.localStorage.setItem('call-notes', '{"corner":"middle"}');
    render(<Notes storageKey="call-notes" />);
    expect(panel()?.style.right).toBe('16px');
  });

  it('takes a starting position', () => {
    render(<Notes defaultPosition={{ corner: 'top-left', x: 24, y: 80 }} />);
    expect(panel()?.style.left).toBe('24px');
    expect(panel()?.style.top).toBe('80px');
  });

  it('strategy="absolute" stays in place inside its positioned parent', () => {
    render(
      <div style={{ position: 'relative' }}>
        <Notes strategy="absolute" />
      </div>,
    );
    expect(panel()?.closest('[data-slot=portal]')).toBeNull();
    expect(panel()?.className).toContain('absolute');
  });
});
