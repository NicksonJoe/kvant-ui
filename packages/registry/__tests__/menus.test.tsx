import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Menu,
  MenuContent,
  MenuItem,
  Menubar,
  MenubarTrigger,
  Tour,
} from '..';

describe('ContextMenu', () => {
  it('opens on right click, rings the target while open and runs an item', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    render(
      <ContextMenu>
        <ContextMenuTrigger>Сайт для «Студии Север»</ContextMenuTrigger>
        <ContextMenuContent>
          <MenuItem>Открыть в новой вкладке</MenuItem>
          <MenuItem onClick={onArchive}>Перенести в архив</MenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    const target = screen.getByText('Сайт для «Студии Север»');
    await user.pointer({ keys: '[MouseRight]', target });

    expect(await screen.findByRole('menu')).toBeTruthy();
    expect(target.hasAttribute('data-popup-open')).toBe(true);
    await user.click(screen.getByRole('menuitem', { name: 'Перенести в архив' }));
    expect(onArchive).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(target.hasAttribute('data-popup-open')).toBe(false);
  });
});

describe('Menubar', () => {
  it('takes focus on F10, moves between menus with arrows and opens with ↓', async () => {
    const user = userEvent.setup();
    render(
      <Menubar>
        <Menu>
          <MenubarTrigger>Файл</MenubarTrigger>
          <MenuContent>
            <MenuItem>Новый документ</MenuItem>
          </MenuContent>
        </Menu>
        <Menu>
          <MenubarTrigger>Правка</MenubarTrigger>
          <MenuContent>
            <MenuItem>Отменить ввод</MenuItem>
          </MenuContent>
        </Menu>
      </Menubar>,
    );
    expect(screen.getByRole('menubar')).toBeTruthy();
    await user.keyboard('{F10}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Файл' }));

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Правка' }));
    await user.keyboard('{ArrowDown}');
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Отменить ввод' })).toBeTruthy();
  });
});

describe('HoverCard', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens after 600 ms of hover and closes 300 ms after the pointer leaves', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.stubGlobal('jest', { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <HoverCard>
        <HoverCardTrigger href="#anna">Анна Северова</HoverCardTrigger>
        <HoverCardContent>Аккаунт-менеджер · в сети</HoverCardContent>
      </HoverCard>,
    );
    const trigger = screen.getByText('Анна Северова');
    await user.hover(trigger);
    act(() => vi.advanceTimersByTime(550));
    expect(screen.queryByText('Аккаунт-менеджер · в сети')).toBeNull();
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText('Аккаунт-менеджер · в сети')).toBeTruthy();

    await user.unhover(trigger);
    act(() => vi.advanceTimersByTime(250));
    expect(screen.queryByText('Аккаунт-менеджер · в сети')).toBeTruthy();
    act(() => vi.advanceTimersByTime(100));
    await waitFor(() => expect(screen.queryByText('Аккаунт-менеджер · в сети')).toBeNull());
  });
});

describe('Tour', () => {
  const steps = [
    { target: '#new-deal', title: 'Новая сделка', description: 'Начните с клиента и суммы.' },
    { target: '#filters', title: 'Сохранённые фильтры', description: 'Соберите фильтр один раз.' },
    { target: '#search', title: 'Поиск по всей базе', description: 'Нажмите ⌘K из любого раздела.' },
  ];

  const renderTour = (onOpenChange = vi.fn()) => {
    render(
      <>
        <button type="button" id="new-deal">
          Создать
        </button>
        <button type="button" id="filters">
          Фильтры
        </button>
        <button type="button" id="search">
          Поиск
        </button>
        <Tour defaultOpen steps={steps} onOpenChange={onOpenChange} />
      </>,
    );
    return onOpenChange;
  };

  it('walks the steps with «Далее» and «Назад» and finishes on «Готово»', async () => {
    const user = userEvent.setup();
    const onOpenChange = renderTour();
    const first = await screen.findByRole('dialog', { name: 'Новая сделка' });
    expect(within(first).getByText('1 из 3')).toBeTruthy();
    expect(within(first).queryByRole('button', { name: 'Назад' })).toBeNull();

    await user.click(within(first).getByRole('button', { name: 'Далее' }));
    const second = await screen.findByRole('dialog', { name: 'Сохранённые фильтры' });
    expect(within(second).getByText('2 из 3')).toBeTruthy();
    await user.click(within(second).getByRole('button', { name: 'Назад' }));
    expect(await screen.findByRole('dialog', { name: 'Новая сделка' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    await user.click(screen.getByRole('button', { name: 'Далее' }));
    const last = await screen.findByRole('dialog', { name: 'Поиск по всей базе' });
    expect(within(last).queryByRole('button', { name: 'Пропустить' })).toBeNull();
    await user.click(within(last).getByRole('button', { name: 'Готово' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('moves with arrow keys, ignores clicks outside and ends on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = renderTour();
    await screen.findByRole('dialog', { name: 'Новая сделка' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Далее' })));
    await user.keyboard('{ArrowRight}');
    expect(await screen.findByRole('dialog', { name: 'Сохранённые фильтры' })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Далее' })));
    await user.keyboard('{ArrowLeft}');
    expect(await screen.findByRole('dialog', { name: 'Новая сделка' })).toBeTruthy();

    await user.click(document.body);
    expect(screen.getByRole('dialog', { name: 'Новая сделка' })).toBeTruthy();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
