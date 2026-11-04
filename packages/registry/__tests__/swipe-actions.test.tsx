import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SwipeActions, type SwipeAction } from '..';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const trailing: readonly SwipeAction[] = [
  { id: 'task', label: 'Задача', onSelect: () => {} },
  { id: 'more', label: 'Ещё', tone: 'neutral', onSelect: () => {} },
];

function renderRow(props: { leading?: readonly SwipeAction[]; onOpen?: () => void } = {}) {
  render(
    <SwipeActions leading={props.leading} trailing={trailing}>
      <button type="button" onClick={props.onOpen}>
        Айдентика для пекарни
      </button>
    </SwipeActions>,
  );
  const content = screen.getByText('Айдентика для пекарни');
  const row = document.querySelector('[data-slot=swipe-actions-row]') as HTMLElement;
  const root = document.querySelector('[data-slot=swipe-actions]') as HTMLElement;
  return { content, row, root };
}

describe('SwipeActions with a mouse', () => {
  // event.timeStamp in jsdom is Date.now()
  const mouse = (target: HTMLElement, steps: readonly [ms: number, x: number][], from = 300) => {
    vi.setSystemTime(0);
    fireEvent.pointerDown(target, { pointerType: 'mouse', pointerId: 1, button: 0, clientX: from, clientY: 20 });
    for (const [ms, x] of steps) {
      vi.setSystemTime(ms);
      fireEvent.pointerMove(target, { pointerType: 'mouse', pointerId: 1, buttons: 1, clientX: x, clientY: 21 });
    }
    const last = steps.at(-1);
    fireEvent.pointerUp(target, { pointerType: 'mouse', pointerId: 1, clientX: last ? last[1] : from, clientY: 21 });
  };

  it('drags the row like a finger and opens the trailing actions past 40 %', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { content, root } = renderRow();
    mouse(content, [
      [300, 260],
      [600, 220],
    ]);
    expect(root.dataset.state).toBe('trailing');
  });

  it('marks the row while dragged so text is not selected', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { content, row } = renderRow();
    fireEvent.pointerDown(content, { pointerType: 'mouse', pointerId: 1, button: 0, clientX: 300, clientY: 20 });
    fireEvent.pointerMove(content, { pointerType: 'mouse', pointerId: 1, buttons: 1, clientX: 250, clientY: 21 });
    expect(row.hasAttribute('data-dragging')).toBe(true);
    fireEvent.pointerUp(content, { pointerType: 'mouse', pointerId: 1, clientX: 250, clientY: 21 });
    expect(row.hasAttribute('data-dragging')).toBe(false);
  });

  it('a click with a few pixels of jitter stays a click', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const onOpen = vi.fn();
    const { content, root } = renderRow({ onOpen });
    mouse(content, [[100, 296]]);
    fireEvent.click(content, { detail: 1 });
    expect(onOpen).toHaveBeenCalledOnce();
    expect(root.dataset.state).toBe('closed');
  });

  it('swallows the click that ends a swipe', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const onOpen = vi.fn();
    const { content } = renderRow({ onOpen });
    mouse(content, [
      [300, 260],
      [600, 220],
    ]);
    fireEvent.click(content, { detail: 1 });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('a click on an open row closes it instead of opening the row', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const onOpen = vi.fn();
    const { content, root } = renderRow({ onOpen });
    mouse(content, [
      [300, 260],
      [600, 220],
    ]);
    // the click that ends the swipe is long gone
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    fireEvent.click(content, { detail: 1 });
    expect(onOpen).not.toHaveBeenCalled();
    expect(root.dataset.state).toBe('closed');
  });

  it('opens on a quick flick shorter than 40 % of the actions', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { content, root } = renderRow();
    // 30 px in 50 ms = 0.6 px/ms, past the 0.3 px/ms threshold; 40 % of 144 would be 58 px
    mouse(content, [
      [20, 290],
      [50, 270],
    ]);
    expect(root.dataset.state).toBe('trailing');
  });

  it('ignores the right and middle buttons', () => {
    const { content, root } = renderRow();
    fireEvent.pointerDown(content, { pointerType: 'mouse', pointerId: 1, button: 2, clientX: 300, clientY: 20 });
    fireEvent.pointerMove(content, { pointerType: 'mouse', pointerId: 1, clientX: 200, clientY: 21 });
    fireEvent.pointerUp(content, { pointerType: 'mouse', pointerId: 1, clientX: 200, clientY: 21 });
    expect(root.dataset.state).toBe('closed');
  });
});

describe('SwipeActions with a two-finger trackpad swipe', () => {
  it('moves the row by deltaX, keeps the page from going back and settles when the wheel stops', () => {
    vi.useFakeTimers();
    const { row, root } = renderRow();
    const first = fireEvent.wheel(row, { deltaX: 40, deltaY: 2 });
    expect(first).toBe(false);
    fireEvent.wheel(row, { deltaX: 40, deltaY: 0 });
    expect(row.style.transform).toBe('translateX(-80px)');
    expect(root.dataset.state).toBe('closed');
    act(() => vi.advanceTimersByTime(300));
    expect(root.dataset.state).toBe('trailing');
    expect(row.style.transform).toBe('translateX(-144px)');

    // the other way closes it
    fireEvent.wheel(row, { deltaX: -60, deltaY: 0 });
    fireEvent.wheel(row, { deltaX: -60, deltaY: 0 });
    act(() => vi.advanceTimersByTime(300));
    expect(root.dataset.state).toBe('closed');
  });

  it('leaves vertical scrolling alone for the whole gesture', () => {
    vi.useFakeTimers();
    const { row, root } = renderRow();
    expect(fireEvent.wheel(row, { deltaX: 1, deltaY: 30 })).toBe(true);
    expect(fireEvent.wheel(row, { deltaX: 40, deltaY: 10 })).toBe(true);
    act(() => vi.advanceTimersByTime(300));
    expect(root.dataset.state).toBe('closed');
    expect(row.style.transform).toBe('translateX(0px)');
  });

  it('never runs the full-swipe action from the wheel', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    const { row, root } = renderRow({ leading: [{ id: 'done', label: 'Готово', tone: 'success', onSelect: onDone }] });
    for (let step = 0; step < 10; step += 1) fireEvent.wheel(row, { deltaX: -80, deltaY: 0 });
    act(() => vi.advanceTimersByTime(300));
    expect(onDone).not.toHaveBeenCalled();
    expect(root.dataset.state).toBe('leading');
  });

  it('ignores pinch-zoom (ctrl + wheel)', () => {
    vi.useFakeTimers();
    const { row, root } = renderRow();
    expect(fireEvent.wheel(row, { deltaX: 40, deltaY: 0, ctrlKey: true })).toBe(true);
    act(() => vi.advanceTimersByTime(300));
    expect(root.dataset.state).toBe('closed');
  });
});
