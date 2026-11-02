import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotificationCenter, type NotificationItem } from '..';

const items: NotificationItem[] = [
  { id: 'm1', group: 'Сегодня', title: 'Вера упомянула вас в сделке «Сайт для Орбиты»', meta: '5 мин назад', unread: true, mention: true },
  { id: 'p1', group: 'Сегодня', title: 'Оплачен счёт № 312 на 48 000 ₽', meta: '28 мин назад · Т-Банк', unread: true },
  { id: 'l1', group: 'Вчера', title: 'Новая заявка из Telegram от Марины Ким', meta: '18:42' },
];

describe('NotificationCenter', () => {
  it('names the bell with the unread count and opens the panel grouped by day', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter items={items} />);

    await user.click(screen.getByRole('button', { name: 'Уведомления, 2 непрочитанных' }));
    expect(await screen.findByText('Сегодня')).toBeDefined();
    expect(screen.getByText('Вчера')).toBeDefined();
    expect(screen.getByText('Новая заявка из Telegram от Марины Ким')).toBeDefined();
  });

  it('filters by tab and shows an empty state when a tab has nothing', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter items={items.map((item) => ({ ...item, mention: false }))} defaultOpen />);

    await user.click(await screen.findByRole('tab', { name: /Непрочитанные/ }));
    expect(screen.queryByText('Новая заявка из Telegram от Марины Ким')).toBeNull();
    expect(screen.getByText('Оплачен счёт № 312 на 48 000 ₽')).toBeDefined();

    await user.click(screen.getByRole('tab', { name: /Упоминания/ }));
    expect(screen.getByText('Упоминаний нет')).toBeDefined();
  });

  it('marks everything read and opens an item', async () => {
    const user = userEvent.setup();
    const onMarkAllRead = vi.fn();
    const onItemClick = vi.fn();
    render(<NotificationCenter items={items} defaultOpen onMarkAllRead={onMarkAllRead} onItemClick={onItemClick} />);

    await user.click(await screen.findByRole('button', { name: 'Прочитать всё' }));
    expect(onMarkAllRead).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Оплачен счёт № 312 на 48 000 ₽' }));
    expect(onItemClick).toHaveBeenCalledWith('p1');
  });

  it('hides «Прочитать всё» and the count when everything is read', () => {
    render(<NotificationCenter items={items.map((item) => ({ ...item, unread: false }))} />);
    expect(screen.getByRole('button', { name: 'Уведомления' })).toBeDefined();
  });
});
