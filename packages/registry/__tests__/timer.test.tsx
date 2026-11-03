import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Timer, TimerLaps, TimerRecording, useCountdown, useStopwatch } from '..';

const HOUR = 3_600_000;
const MINUTE = 60_000;
const SECOND = 1000;

const digits = () => [...document.querySelectorAll('[data-slot=timer-digits]')].map((node) => node.textContent);
const units = () => [...document.querySelectorAll('[data-slot=timer-unit]')].map((node) => node.textContent);
const capsule = () => document.querySelector('[data-slot=timer]');

describe('Timer display', () => {
  it('shows hours, minutes and seconds with Russian unit names and fg-4 colons', () => {
    render(<Timer value={2 * HOUR + 14 * MINUTE + 37 * SECOND} />);
    expect(digits()).toEqual(['02', '14', '37']);
    expect(units()).toEqual(['часа', 'минут', 'секунд']);
    const colons = document.querySelectorAll('[data-slot=timer-separator]');
    expect(colons).toHaveLength(2);
    expect(colons[0]?.className).toContain('text-fg-4');
  });

  it('declines the unit names by the number', () => {
    render(<Timer value={1 * HOUR + 21 * MINUTE + 3 * SECOND} />);
    expect(units()).toEqual(['час', 'минута', 'секунды']);
  });

  it('counts down in whole seconds rounded up: 0.4 s left still shows 00:00:01', () => {
    render(<Timer value={400} />);
    expect(digits()).toEqual(['00', '00', '01']);
  });

  it('uses tabular 48/52 500 digits that never change width', () => {
    render(<Timer value={MINUTE} />);
    const group = document.querySelector('[data-slot=timer-digits]');
    expect(group?.className).toContain('text-display-lg');
    expect(group?.className).toContain('tabular-nums');
    expect(group?.className).toContain('font-medium');
  });

  it('is a role=timer whose name and spoken value do not depend on the layout', () => {
    render(<Timer value={2 * HOUR + 14 * MINUTE + 37 * SECOND} aria-label="До ответа клиенту" />);
    const timer = screen.getByRole('timer', { name: 'До ответа клиенту' });
    expect(timer.textContent).toContain('2 часа 14 минут 37 секунд');
    expect(timer.querySelector('[data-slot=timer-value]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('says how late an overdue countdown is and shows the minus', () => {
    render(<Timer value={-(3 * MINUTE + 41 * SECOND)} />);
    expect(screen.getByRole('timer').textContent).toContain('просрочено на 3 минуты 41 секунду');
    expect(document.querySelector('[data-slot=timer-sign]')?.textContent).toBe('−');
  });

  it('stopwatch: floors to tenths and shows them after a comma in fg-3', () => {
    render(<Timer mode="stopwatch" tenths value={47 * MINUTE + 18 * SECOND + 690} />);
    expect(digits()).toEqual(['00', '47', '18,6']);
    expect(units()).toEqual(['часов', 'минут', 'секунд']);
    expect(document.querySelector('[data-slot=timer-tenths]')?.className).toContain('text-fg-3');
  });
});

describe('Timer inline', () => {
  it('countdown capsule: fill-2, clock icon, 02:14:37', () => {
    render(<Timer variant="inline" value={2 * HOUR + 14 * MINUTE + 37 * SECOND} />);
    expect(capsule()?.getAttribute('data-tone')).toBe('neutral');
    expect(capsule()?.className).toContain('bg-fill-2');
    expect(capsule()?.className).toContain('h-6');
    expect(document.querySelector('[data-slot=timer-value]')?.textContent).toBe('02:14:37');
  });

  it('under 15 minutes turns warning-soft', () => {
    render(<Timer variant="inline" value={12 * MINUTE + 5 * SECOND} />);
    expect(capsule()?.getAttribute('data-tone')).toBe('warning');
    expect(capsule()?.className).toContain('bg-warning-soft');
  });

  it('takes its own warning threshold', () => {
    render(<Timer variant="inline" value={12 * MINUTE} warnBelow={10 * MINUTE} />);
    expect(capsule()?.getAttribute('data-tone')).toBe('neutral');
  });

  it('overdue turns danger-soft with a triangle and «−»', () => {
    render(<Timer variant="inline" value={-(3 * MINUTE + 41 * SECOND)} />);
    expect(capsule()?.getAttribute('data-tone')).toBe('danger');
    expect(capsule()?.className).toContain('bg-danger-soft');
    expect(document.querySelector('[data-slot=timer-value]')?.textContent).toBe('−00:03:41');
  });

  it('running stopwatch is accent-soft with a dot', () => {
    render(<Timer variant="inline" mode="stopwatch" value={47 * MINUTE + 18 * SECOND} />);
    expect(capsule()?.getAttribute('data-tone')).toBe('accent');
    expect(capsule()?.className).toContain('bg-accent-soft');
    expect(document.querySelector('[data-slot=timer-dot]')).not.toBeNull();
    expect(document.querySelector('[data-slot=timer-value]')?.textContent).toBe('00:47:18');
  });

  it('paused stopwatch is fill-2 with a pause icon and fg-2 digits', () => {
    render(<Timer variant="inline" mode="stopwatch" paused value={47 * MINUTE + 18 * SECOND} />);
    expect(capsule()?.getAttribute('data-tone')).toBe('paused');
    expect(capsule()?.className).toContain('text-fg-2');
    expect(screen.getByRole('timer').textContent).toContain('на паузе');
  });

  it('changes tone in 150 ms ease-hover', () => {
    render(<Timer variant="inline" value={MINUTE} />);
    expect(capsule()?.className).toContain('duration-(--duration-quick)');
    expect(capsule()?.className).toContain('ease-hover');
  });
});

describe('TimerLaps', () => {
  it('lists the running lap first, then the finished ones, newest on top', () => {
    render(<TimerLaps laps={[16 * MINUTE + 31_500, 18 * MINUTE + 5_900]} current={12 * MINUTE + 41_200} />);
    const rows = [...document.querySelectorAll('[data-slot=timer-lap]')];
    expect(rows.map((row) => row.querySelector('[data-slot=timer-lap-label]')?.textContent)).toEqual([
      'Круг 3',
      'Круг 2 · самый долгий',
      'Круг 1 · самый быстрый',
    ]);
    expect(rows.map((row) => row.querySelector('[data-slot=timer-lap-time]')?.textContent)).toEqual(['12:41,2', '18:05,9', '16:31,5']);
    expect(rows[1]?.getAttribute('data-mark')).toBe('slowest');
    expect(rows[2]?.getAttribute('data-mark')).toBe('fastest');
    expect(rows[0]?.hasAttribute('data-mark')).toBe(false);
  });

  it('marks nothing with a single finished lap', () => {
    render(<TimerLaps laps={[MINUTE]} />);
    expect(document.querySelector('[data-mark]')).toBeNull();
  });

  it('shows hours once a lap is an hour long', () => {
    render(<TimerLaps laps={[HOUR + 2 * MINUTE + 41_200]} />);
    expect(document.querySelector('[data-slot=timer-lap-time]')?.textContent).toBe('1:02:41,2');
  });
});

describe('TimerRecording', () => {
  it('is a dot with a pulsing ring and its label', () => {
    render(<TimerRecording>Идёт запись</TimerRecording>);
    const node = document.querySelector('[data-slot=timer-recording]');
    expect(node?.textContent).toBe('Идёт запись');
    expect(node?.querySelector('.kv-timer-pulse')).not.toBeNull();
  });
});

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date('2026-11-03T14:30:00+03:00') }));
  afterEach(() => vi.useRealTimers());

  it('returns the time left and ticks every second, past zero into overdue', () => {
    const deadline = new Date('2026-11-03T14:30:02+03:00');
    const { result } = renderHook(() => useCountdown(deadline));
    expect(result.current).toBe(2000);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(1000);
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current).toBe(-1000);
  });

  it('wakes up on the second boundary of the display, not 1 s after mount', () => {
    const deadline = Date.now() + 2400;
    const { result } = renderHook(() => useCountdown(deadline));
    // 2.4 s left shows 3; it must flip to 2 after 0.4 s
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe(2000);
  });
});

describe('useStopwatch', () => {
  beforeEach(() => vi.useFakeTimers({ now: 0 }));
  afterEach(() => vi.useRealTimers());

  it('starts, pauses, resumes and resets', () => {
    const { result } = renderHook(() => useStopwatch());
    expect(result.current.running).toBe(false);
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.elapsed).toBe(1500);
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.elapsed).toBe(1500);
    expect(result.current.running).toBe(false);
    act(() => result.current.toggle());
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.elapsed).toBe(2000);
    act(() => result.current.reset());
    expect(result.current.elapsed).toBe(0);
    expect(result.current.running).toBe(false);
    expect(result.current.laps).toEqual([]);
  });

  it('records laps as durations and keeps the running lap apart', () => {
    const { result } = renderHook(() => useStopwatch({ autoStart: true }));
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.lap());
    act(() => vi.advanceTimersByTime(2500));
    act(() => result.current.lap());
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.laps).toEqual([1000, 2500]);
    expect(result.current.lapElapsed).toBe(300);
    expect(result.current.elapsed).toBe(3800);
  });

  it('continues from a saved value and saved laps', () => {
    const { result } = renderHook(() => useStopwatch({ initial: 47 * MINUTE, laps: [16 * MINUTE, 18 * MINUTE] }));
    expect(result.current.elapsed).toBe(47 * MINUTE);
    expect(result.current.laps).toEqual([16 * MINUTE, 18 * MINUTE]);
    expect(result.current.lapElapsed).toBe(13 * MINUTE);
  });
});
