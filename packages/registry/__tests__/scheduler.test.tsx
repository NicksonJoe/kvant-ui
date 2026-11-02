import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Scheduler, type SchedulerCategory, type SchedulerEvent } from '..';

const categories: SchedulerCategory[] = [
  { id: 'meeting', label: 'Встречи', color: 'var(--color-chart-1)' },
  { id: 'call', label: 'Звонки', color: 'var(--color-chart-3)' },
  { id: 'deadline', label: 'Сроки', color: 'var(--color-chart-2)' },
];

const events: SchedulerEvent[] = [
  { id: 'brief', title: 'Бриф «Полка»', start: '2026-11-02T10:00', end: '2026-11-02T11:00', category: 'meeting' },
  { id: 'orbit', title: 'Звонок «Орбите»', start: '2026-11-02T12:30', end: '2026-11-02T13:30', category: 'call' },
  { id: 'demo', title: 'Демо', start: '2026-11-02T15:00', end: '2026-11-02T16:00', category: 'meeting' },
  { id: 'review', title: 'Ревью', start: '2026-11-02T15:30', end: '2026-11-02T16:30', category: 'meeting' },
  { id: 'estimate', title: 'Срок сметы', start: '2026-11-03', allDay: true, category: 'deadline' },
];

describe('Scheduler', () => {
  it('shows the month with today marked, up to three events a day and «+N ещё»', () => {
    render(<Scheduler aria-label="Календарь" events={events} categories={categories} defaultDate="2026-11-03" today="2026-11-02" />);
    expect(screen.getByRole('heading', { name: 'Ноябрь 2026' })).toBeDefined();
    const monday = screen.getByRole('gridcell', { name: /^2 ноября/ });
    expect(monday.getAttribute('aria-current')).toBe('date');
    expect(within(monday).getAllByRole('button', { name: /^\d\d:\d\d/ })).toHaveLength(3);
    expect(within(monday).getByRole('button', { name: 'Ещё 1 событие, 2 ноября' })).toBeDefined();
    expect(within(screen.getByRole('gridcell', { name: /^3 ноября/ })).getByRole('button', { name: 'Весь день, Срок сметы' })).toBeDefined();
  });

  it('pages months and opens a day from «+N ещё»', async () => {
    const user = userEvent.setup();
    render(<Scheduler aria-label="Календарь" events={events} categories={categories} defaultDate="2026-11-03" today="2026-11-02" />);
    await user.click(screen.getByRole('button', { name: 'Следующий месяц' }));
    expect(screen.getByRole('heading', { name: 'Декабрь 2026' })).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Сегодня' }));
    await user.click(screen.getByRole('button', { name: 'Ещё 1 событие, 2 ноября' }));
    expect(screen.getByRole('heading', { name: '2 ноября, понедельник' })).toBeDefined();
  });

  it('lays out a week by the hour and splits overlapping events', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Scheduler aria-label="Календарь" events={events} categories={categories} defaultDate="2026-11-03" defaultView="week" onSelect={onSelect} />);
    expect(screen.getByRole('heading', { name: '2 – 8 ноября 2026' })).toBeDefined();
    const demo = screen.getByRole('button', { name: '15:00–16:00, Демо' });
    const review = screen.getByRole('button', { name: '15:30–16:30, Ревью' });
    expect(demo.style.width).toBe('50%');
    expect(review.style.left).toBe('50%');
    // 10:00 with the day starting at 8:00 and 48px an hour
    expect(screen.getByRole('button', { name: '10:00–11:00, Бриф «Полка»' }).style.top).toBe('96px');
    await user.click(demo);
    expect(onSelect).toHaveBeenCalledWith('demo');
  });

  it('keeps events outside the shown hours inside the grid, pinned to its edge', () => {
    render(
      <Scheduler
        aria-label="Календарь"
        events={[
          { id: 'early', title: 'Ранний созвон', start: '2026-11-02T07:00', end: '2026-11-02T07:30' },
          { id: 'late', title: 'Поздний', start: '2026-11-02T21:00', end: '2026-11-02T22:00' },
          { id: 'long', title: 'Выезд', start: '2026-11-02T18:00', end: '2026-11-02T23:00' },
        ]}
        defaultView="day"
        defaultDate="2026-11-02"
      />,
    );
    // 8:00–20:00 at 48px an hour: the grid is 576px tall
    const early = screen.getByRole('button', { name: /Ранний созвон/ });
    const late = screen.getByRole('button', { name: /Поздний/ });
    const long = screen.getByRole('button', { name: /Выезд/ });
    expect(early.style.top).toBe('0px');
    expect(Number.parseFloat(late.style.top) + Number.parseFloat(late.style.height)).toBeLessThanOrEqual(576);
    expect(Number.parseFloat(long.style.top) + Number.parseFloat(long.style.height)).toBeLessThanOrEqual(576);
    expect(early.dataset.clipped).toBe('start');
    expect(late.dataset.clipped).toBe('end');
  });
});
