import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MentionField, RelativeTime, formatRelativeTime, type MentionPerson } from '..';

describe('formatRelativeTime', () => {
  const now = new Date('2026-11-03T15:00:00');
  it.each([
    ['2026-11-03T14:59:40', 'только что'],
    ['2026-11-03T14:55:00', '5 мин назад'],
    ['2026-11-03T12:30:00', '2 ч назад'],
    ['2026-11-02T18:52:00', 'вчера, 18:52'],
    ['2026-10-22T14:05:00', '22 октября, 14:05'],
    ['2025-12-30T09:00:00', '30 декабря 2025'],
  ])('%s → %s', (date, text) => {
    expect(formatRelativeTime(new Date(date), now)).toBe(text);
  });
});

describe('formatRelativeTime across a DST switch', () => {
  it('still says «вчера» the day after a 25-hour day', () => {
    vi.stubEnv('TZ', 'Europe/Berlin');
    try {
      expect(formatRelativeTime(new Date('2026-10-25T18:00:00'), new Date('2026-10-26T10:00:00'))).toBe('вчера, 18:00');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('RelativeTime', () => {
  it('is a <time> with the machine date and the exact date as its title', () => {
    render(<RelativeTime date="2026-11-03T14:55:00" now={new Date('2026-11-03T15:00:00')} />);
    const time = screen.getByText('5 мин назад');
    expect(time.tagName).toBe('TIME');
    expect(time.getAttribute('title')).toBe('3 ноября 2026, 14:55');
  });
});

const people: MentionPerson[] = [
  { id: 'marina', name: 'Марина Соколова', role: 'Менеджер по продажам' },
  { id: 'maria', name: 'Мария Ким', role: 'Бухгалтер' },
  { id: 'ilya', name: 'Илья Громов', role: 'Дизайнер' },
];

describe('MentionField', () => {
  it('opens people on «@», filters by the query and inserts a chip', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MentionField aria-label="Комментарий" people={people} onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Комментарий' });

    await user.click(box);
    await user.keyboard('Нужен акт @мар');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      expect.stringContaining('Марина Соколова'),
      expect.stringContaining('Мария Ким'),
    ]);

    await user.keyboard('{ArrowDown}{Enter}');
    expect(box.querySelector('[data-mention-id="maria"]')?.textContent).toBe('@Мария Ким');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onValueChange).toHaveBeenLastCalledWith({ text: 'Нужен акт @Мария Ким ', mentions: ['maria'] });
  });

  it('closes the list on Escape and keeps the typed text', async () => {
    const user = userEvent.setup();
    render(<MentionField aria-label="Комментарий" people={people} />);
    const box = screen.getByRole('textbox', { name: 'Комментарий' });
    await user.click(box);
    await user.keyboard('@ил');
    expect(screen.getByRole('listbox')).toBeDefined();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(box.textContent).toBe('@ил');
  });

  it('keeps line breaks and mentions on later lines, where the browser wraps each line in a div', () => {
    const onValueChange = vi.fn();
    render(<MentionField aria-label="Комментарий" people={people} onValueChange={onValueChange} />);
    const box = screen.getByRole('textbox', { name: 'Комментарий' });
    box.innerHTML = 'Первая строка<div>Вторая <span contenteditable="false" data-mention-id="maria">@Мария Ким</span>&nbsp;</div>';
    fireEvent.input(box);
    expect(onValueChange).toHaveBeenLastCalledWith({ text: 'Первая строка\nВторая @Мария Ким\u00a0', mentions: ['maria'] });
  });
});
