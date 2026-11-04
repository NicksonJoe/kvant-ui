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
  it('shows the month with today marked, three rows a day: all three events, or two and «+N ещё»', () => {
    render(<Scheduler aria-label="Календарь" events={events} categories={categories} defaultDate="2026-11-03" today="2026-11-02" />);
    expect(screen.getByRole('heading', { name: 'Ноябрь 2026' })).toBeDefined();
    const monday = screen.getByRole('gridcell', { name: /^2 ноября/ });
    expect(monday.getAttribute('aria-current')).toBe('date');
    // four events do not fit three rows: two of them and «+2 ещё», as in the layout
    expect(within(monday).getAllByRole('button', { name: /^\d\d:\d\d/ })).toHaveLength(2);
    expect(within(monday).getByRole('button', { name: 'Ещё 2 события, 2 ноября' })).toBeDefined();
    expect(within(screen.getByRole('gridcell', { name: /^3 ноября/ })).getByRole('button', { name: 'Весь день, Срок сметы' })).toBeDefined();
  });

  it('pages months and opens all events of the day in a popover from «+N ещё»', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Scheduler aria-label="Календарь" events={events} categories={categories} defaultDate="2026-11-03" today="2026-11-02" onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Следующий месяц' }));
    expect(screen.getByRole('heading', { name: 'Декабрь 2026' })).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Сегодня' }));
    const more = screen.getByRole('button', { name: 'Ещё 2 события, 2 ноября' });
    await user.click(more);
    // the month stays: «+N ещё» no longer switches to the day view
    expect(screen.getByRole('heading', { name: 'Ноябрь 2026' })).toBeDefined();
    expect(more.getAttribute('aria-expanded')).toBe('true');
    const dialog = screen.getByRole('dialog', { name: 'Пн, 2 ноября' });
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
    expect(within(dialog).getByText('4 события')).toBeDefined();
    const items = within(dialog).getAllByRole('button');
    expect(items.map((item) => item.getAttribute('aria-label'))).toEqual([
      '10:00–11:00, Бриф «Полка»',
      '12:30–13:30, Звонок «Орбите»',
      '15:00–16:00, Демо',
      '15:30–16:30, Ревью',
    ]);
    await user.click(within(dialog).getByRole('button', { name: '15:30–16:30, Ревью' }));
    expect(onSelect).toHaveBeenCalledWith('review');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('moves focus into the day popover and returns it to «+N ещё» on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Scheduler
        aria-label="Календарь"
        events={[...events, { id: 'trip', title: 'Командировка', start: '2026-11-01', end: '2026-11-02', allDay: true, category: 'meeting' }]}
        categories={categories}
        defaultDate="2026-11-03"
        today="2026-11-02"
      />,
    );
    const more = screen.getByRole('button', { name: 'Ещё 3 события, 2 ноября' });
    more.focus();
    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog', { name: 'Пн, 2 ноября' });
    // all-day first, with its whole range
    const first = within(dialog).getByRole('button', { name: '1–2 ноября, Командировка' });
    expect(document.activeElement).toBe(first);
    expect(within(dialog).getAllByRole('button')).toHaveLength(5);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(more);
  });

  it('draws a multi-day event as one bar across the week, announced once', () => {
    render(
      <Scheduler
        aria-label="Календарь"
        events={[
          { id: 'trip', title: 'Командировка в Казань', start: '2026-11-10', end: '2026-11-12', allDay: true, category: 'meeting' },
          { id: 'tea', title: '«Лавка Гусева»', start: '2026-11-11T17:00', end: '2026-11-11T18:00', category: 'call' },
        ]}
        categories={categories}
        defaultDate="2026-11-03"
        today="2026-11-02"
      />,
    );
    const bars = screen.getAllByRole('button', { name: '10–12 ноября, Командировка в Казань' });
    expect(bars).toHaveLength(1);
    const bar = bars[0] as HTMLElement;
    expect(bar.dataset.span).toBe('3');
    expect(bar.dataset.lane).toBe('0');
    expect(bar.dataset.clipped).toBeUndefined();
    expect(bar.textContent).toBe('Командировка в Казань · 10–12 ноя');
    expect(within(screen.getByRole('gridcell', { name: /^10 ноября/ })).getByRole('button', { name: /Командировка/ })).toBe(bar);
    // covered days count the event but do not repeat it
    const wednesday = screen.getByRole('gridcell', { name: '11 ноября, 2 события' });
    expect(within(wednesday).queryByRole('button', { name: /Командировка/ })).toBeNull();
    expect(within(wednesday).getByRole('button', { name: '17:00–18:00, «Лавка Гусева»' })).toBeDefined();
    expect(screen.getByRole('gridcell', { name: '12 ноября, 1 событие' })).toBeDefined();
  });

  it('wraps a multi-day event onto the next week with cut edges and keeps one entry for the reader', () => {
    const { container } = render(
      <Scheduler
        aria-label="Календарь"
        events={[
          { id: 'fair', title: 'Ярмарка', start: '2026-11-13', end: '2026-11-17', allDay: true },
          { id: 'audit', title: 'Аудит', start: '2026-10-20', end: '2026-10-27', allDay: true },
        ]}
        defaultDate="2026-11-03"
        today="2026-11-02"
      />,
    );
    const segments = (title: string) => [...container.querySelectorAll<HTMLElement>('[data-slot="scheduler-span"]')].filter((node) => node.textContent?.startsWith(title));
    const [head, tail] = segments('Ярмарка');
    expect(segments('Ярмарка')).toHaveLength(2);
    expect(head?.dataset.span).toBe('3');
    expect(head?.dataset.clipped).toBe('end');
    expect(tail?.dataset.span).toBe('2');
    expect(tail?.dataset.clipped).toBe('start');
    expect(screen.getAllByRole('button', { name: '13–17 ноября, Ярмарка' })).toEqual([head]);
    expect(tail?.getAttribute('aria-hidden')).toBe('true');
    expect(tail?.tabIndex).toBe(-1);
    // started before the grid: its first visible piece is the one announced
    const audit = screen.getByRole('button', { name: '20–27 октября, Аудит' });
    expect(audit.dataset.span).toBe('2');
    expect(audit.dataset.clipped).toBe('start');
    expect(within(screen.getByRole('gridcell', { name: /^26 октября/ })).getByRole('button')).toBe(audit);
  });

  it('stacks overlapping all-day events in lanes, greedily by start and length, stable', () => {
    const lane = (name: string) => screen.getByRole('button', { name }).dataset.lane;
    render(
      <Scheduler
        aria-label="Календарь"
        events={[
          { id: 'b', title: 'Б', start: '2026-11-11', end: '2026-11-13', allDay: true },
          { id: 'a', title: 'А', start: '2026-11-10', end: '2026-11-12', allDay: true },
          { id: 'c', title: 'В', start: '2026-11-13', allDay: true },
          { id: 'short', title: 'Короткое', start: '2026-11-16', allDay: true },
          { id: 'long', title: 'Длинное', start: '2026-11-16', end: '2026-11-18', allDay: true },
          { id: 'twin1', title: 'Первое', start: '2026-11-24', end: '2026-11-25', allDay: true },
          { id: 'twin2', title: 'Второе', start: '2026-11-24', end: '2026-11-25', allDay: true },
        ]}
        defaultDate="2026-11-03"
        today="2026-11-02"
      />,
    );
    expect(lane('10–12 ноября, А')).toBe('0');
    expect(lane('11–13 ноября, Б')).toBe('1');
    // А ends on the 12th, so the 13th reuses its lane
    expect(lane('Весь день, В')).toBe('0');
    expect(lane('16–18 ноября, Длинное')).toBe('0');
    expect(lane('Весь день, Короткое')).toBe('1');
    expect(lane('24–25 ноября, Первое')).toBe('0');
    expect(lane('24–25 ноября, Второе')).toBe('1');
  });

  it('shows exactly three events of a day in full, without «+N ещё»', () => {
    render(
      <Scheduler
        aria-label="Календарь"
        events={[
          { id: 'trip', title: 'Командировка', start: '2026-11-09', end: '2026-11-11', allDay: true },
          { id: 'call', title: 'Звонок', start: '2026-11-11T12:00', end: '2026-11-11T12:30' },
          { id: 'demo', title: 'Демо', start: '2026-11-11T15:00', end: '2026-11-11T16:00' },
          { id: 'one', title: 'Планёрка', start: '2026-11-12T09:30', end: '2026-11-12T10:00' },
          { id: 'two', title: 'Бриф', start: '2026-11-12T11:00', end: '2026-11-12T12:00' },
          { id: 'three', title: 'Ревью', start: '2026-11-12T15:00', end: '2026-11-12T16:00' },
        ]}
        defaultDate="2026-11-03"
        today="2026-11-02"
      />,
    );
    const wednesday = screen.getByRole('gridcell', { name: '11 ноября, 3 события' });
    expect(within(wednesday).getAllByRole('button', { name: /^\d\d:\d\d/ })).toHaveLength(2);
    expect(within(wednesday).queryByRole('button', { name: /^Ещё/ })).toBeNull();
    const thursday = screen.getByRole('gridcell', { name: '12 ноября, 3 события' });
    expect(within(thursday).getAllByRole('button', { name: /^\d\d:\d\d/ })).toHaveLength(3);
    expect(within(thursday).queryByRole('button', { name: /^Ещё/ })).toBeNull();
  });

  it('keeps a bar in the last row only when every day under it shows all its events', () => {
    render(
      <Scheduler
        aria-label="Календарь"
        events={[
          { id: 'a', title: 'А', start: '2026-11-09', end: '2026-11-10', allDay: true },
          { id: 'b', title: 'Б', start: '2026-11-09', end: '2026-11-10', allDay: true },
          { id: 'c', title: 'В', start: '2026-11-09', end: '2026-11-10', allDay: true },
          { id: 'call', title: 'Звонок', start: '2026-11-10T12:00', end: '2026-11-10T12:30' },
        ]}
        defaultDate="2026-11-03"
        today="2026-11-02"
      />,
    );
    // Tuesday overflows, so В would run over its «+N ещё»: В goes to «+N» on both days
    expect(screen.queryByRole('button', { name: '9–10 ноября, В' })).toBeNull();
    expect(within(screen.getByRole('gridcell', { name: /^9 ноября/ })).getByRole('button', { name: 'Ещё 1 событие, 9 ноября' })).toBeDefined();
    expect(within(screen.getByRole('gridcell', { name: /^10 ноября/ })).getByRole('button', { name: 'Ещё 2 события, 10 ноября' })).toBeDefined();
  });

  it('counts bars in the rows of a day and hides the rest behind «+N ещё»', async () => {
    const user = userEvent.setup();
    render(
      <Scheduler
        aria-label="Календарь"
        events={[
          { id: 'a', title: 'А', start: '2026-11-09', end: '2026-11-11', allDay: true },
          { id: 'b', title: 'Б', start: '2026-11-10', end: '2026-11-11', allDay: true },
          { id: 'c', title: 'В', start: '2026-11-10', end: '2026-11-12', allDay: true },
          { id: 'd', title: 'Г', start: '2026-11-11', end: '2026-11-12', allDay: true },
          { id: 'call', title: 'Звонок', start: '2026-11-11T12:00', end: '2026-11-11T12:30' },
        ]}
        defaultDate="2026-11-03"
        today="2026-11-02"
      />,
    );
    const wednesday = screen.getByRole('gridcell', { name: '11 ноября, 5 событий' });
    // two rows go to bars, the third to «+N ещё»: two more bars and the call
    expect(within(wednesday).queryByRole('button', { name: /Звонок/ })).toBeNull();
    await user.click(within(wednesday).getByRole('button', { name: 'Ещё 3 события, 11 ноября' }));
    const dialog = screen.getByRole('dialog', { name: 'Ср, 11 ноября' });
    expect(within(dialog).getAllByRole('button')).toHaveLength(5);
  });

  it('spans multi-day events across the «весь день» row of the week', () => {
    render(
      <Scheduler
        aria-label="Календарь"
        events={[
          { id: 'trip', title: 'Командировка', start: '2026-11-03', end: '2026-11-05', allDay: true },
          { id: 'long', title: 'Отпуск', start: '2026-10-30', end: '2026-11-10', allDay: true },
          { id: 'estimate', title: 'Срок сметы', start: '2026-11-04', allDay: true },
        ]}
        defaultView="week"
        defaultDate="2026-11-03"
      />,
    );
    const trip = screen.getByRole('button', { name: '3–5 ноября, Командировка' });
    expect(screen.getAllByRole('button', { name: /Командировка/ })).toHaveLength(1);
    expect(trip.dataset.span).toBe('3');
    const vacation = screen.getByRole('button', { name: '30 октября – 10 ноября, Отпуск' });
    expect(vacation.dataset.span).toBe('7');
    expect(vacation.dataset.clipped).toBe('both');
    expect(new Set([trip.dataset.lane, vacation.dataset.lane, screen.getByRole('button', { name: 'Весь день, Срок сметы' }).dataset.lane]).size).toBe(3);
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
