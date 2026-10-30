import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getComponent, isReady, type ReadyComponentMeta } from '@/kvant/meta';
import { MotionReplay, MotionTable } from './Motion';

function ready(id: string): ReadyComponentMeta {
  const meta = getComponent(id);
  if (!meta || !isReady(meta)) throw new Error(`${id} is not ready`);
  return meta;
}

const forced = (element: Element) => ['hover', 'pressed', 'focus'].filter((state) => element.hasAttribute(`data-force-${state}`));

describe('MotionReplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays hover, press, release, leave and focus on the live specimen', () => {
    render(<MotionReplay meta={ready('button')} />);
    const specimen = screen.getByRole('button', { name: 'Создать сделку' });

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    const seen = [0, 700, 700, 700, 700].map((step) => {
      act(() => vi.advanceTimersByTime(step));
      return forced(specimen);
    });
    expect(seen).toEqual([['hover'], ['hover', 'pressed'], ['hover'], [], ['focus']]);
    expect(screen.getByText('Фокус').getAttribute('aria-current')).toBe('step');

    act(() => vi.advanceTimersByTime(700));
    expect(forced(specimen)).toEqual([]);
  });

  it('runs four times slower at ×0,25', () => {
    render(<MotionReplay meta={ready('button')} />);
    const specimen = screen.getByRole('button', { name: 'Создать сделку' });
    fireEvent.click(screen.getByRole('radio', { name: '×0,25' }));
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));

    act(() => vi.advanceTimersByTime(700));
    expect(forced(specimen)).toEqual(['hover']);
    act(() => vi.advanceTimersByTime(2100));
    expect(forced(specimen)).toEqual(['hover', 'pressed']);
  });
});

describe('MotionTable', () => {
  it('shows the event, its parameters and what reduced motion does', () => {
    render(<MotionTable rows={ready('button').motion} />);
    expect(screen.getByRole('columnheader', { name: 'меньше движения' })).toBeTruthy();
    expect(screen.getByRole('row', { name: /Отпускание/ }).textContent).toMatch(/ease-out вместо пружины/);
  });
});
