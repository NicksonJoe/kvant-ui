import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CommandPalette,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Select,
  Tooltip,
  TooltipProvider,
  ToastProvider,
  formatResultCount,
  toast,
} from '..';

const highlighted = (element: Element | undefined) => element?.hasAttribute('data-highlighted') ?? false;

describe('Menu', () => {
  it('opens from the keyboard, moves with arrows, runs an item on Enter and returns focus', async () => {
    const user = userEvent.setup();
    const onDuplicate = vi.fn();
    render(
      <Menu>
        <MenuTrigger>Действия</MenuTrigger>
        <MenuContent>
          <MenuItem shortcut="⌘E">Изменить</MenuItem>
          <MenuItem shortcut="⌘D" onClick={onDuplicate}>
            Дублировать
          </MenuItem>
          <MenuItem destructive>Удалить</MenuItem>
        </MenuContent>
      </Menu>,
    );
    const trigger = screen.getByRole('button', { name: 'Действия' });
    trigger.focus();
    await user.keyboard('{Enter}');

    const items = await screen.findAllByRole('menuitem');
    await waitFor(() => expect(highlighted(items[0])).toBe(true));
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(highlighted(items[1])).toBe(true));

    await user.keyboard('{Enter}');
    expect(onDuplicate).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Menu>
        <MenuTrigger>Действия</MenuTrigger>
        <MenuContent>
          <MenuItem>Изменить</MenuItem>
        </MenuContent>
      </Menu>,
    );
    await user.click(screen.getByRole('button', { name: 'Действия' }));
    expect(await screen.findByRole('menu')).toBeTruthy();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });
});

describe('Select', () => {
  const stages = [
    { value: 'lead', label: 'Лид' },
    { value: 'brief', label: 'Бриф' },
    { value: 'contract', label: 'Договор' },
  ] as const;

  it('is operable with arrows and Enter', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select aria-label="Этап" options={stages} defaultValue="lead" onValueChange={onValueChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Этап' });
    expect(trigger.textContent).toContain('Лид');

    trigger.focus();
    await user.keyboard('{ArrowDown}');
    const options = await screen.findAllByRole('option');
    await waitFor(() => expect(highlighted(options[0])).toBe(true));
    // Base UI moves focus into the list a moment after opening; keys sent earlier still land on the trigger.
    await waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('option'));
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(highlighted(options[2])).toBe(true));
    await user.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenLastCalledWith('contract');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(trigger.textContent).toContain('Договор');
  });
});

describe('Dialog', () => {
  it('traps focus while open, closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Снаружи</button>
        <Dialog>
          <DialogTrigger>Новая задача</DialogTrigger>
          <DialogContent>
            <DialogTitle>Новая задача</DialogTitle>
            <DialogDescription>Задача появится в карточке сделки.</DialogDescription>
            <input aria-label="Название" />
            <DialogFooter>
              <DialogClose>Отмена</DialogClose>
              <button type="button">Создать задачу</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Новая задача' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    // Base UI's focus guards hand focus back inside on the next frame.
    const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      await settle();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.tab({ shift: true });
    await settle();
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });
});

describe('Tooltip', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens after 600ms of hover and closes at once', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    // Testing Library only advances fake timers it recognises as Jest's; give it the same hook for Vitest.
    vi.stubGlobal('jest', { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <TooltipProvider>
        <Tooltip content="Скопировать ссылку" shortcut="⇧⌘C">
          <button type="button">Копировать</button>
        </Tooltip>
      </TooltipProvider>,
    );
    const button = screen.getByRole('button', { name: 'Копировать' });
    await user.hover(button);
    act(() => vi.advanceTimersByTime(550));
    expect(screen.queryByText('Скопировать ссылку')).toBeNull();
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText('Скопировать ссылку')).toBeTruthy();

    await user.unhover(button);
    act(() => vi.advanceTimersByTime(50));
    expect(screen.queryByText('Скопировать ссылку')).toBeNull();
  });

  it('opens instantly on keyboard focus', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip content="Изменить сделку">
          <button type="button">Изменить</button>
        </Tooltip>
      </TooltipProvider>,
    );
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Изменить' }));
    expect(await screen.findByText('Изменить сделку', {}, { timeout: 50 })).toBeTruthy();
  });
});

describe('Toast', () => {
  afterEach(() => {
    act(() => toast.close());
  });

  const rendered = () => Array.from(document.querySelectorAll('[data-slot="toast"]'));
  const visible = () => rendered().filter((element) => !element.hasAttribute('data-limited'));

  it('keeps three toasts in the stack and dismisses with the close button', async () => {
    const user = userEvent.setup();
    render(<ToastProvider>{null}</ToastProvider>);
    act(() => {
      toast.add({ title: 'Сделка перенесена', type: 'success' });
      toast.add({ title: 'Счёт отправлен', type: 'info' });
      toast.add({ title: 'Задача создана' });
      toast.add({ title: 'Клиент добавлен', type: 'success' });
    });
    await waitFor(() => expect(visible()).toHaveLength(3));
    expect(visible()[0]?.textContent).toContain('Клиент добавлен');

    // Base UI keeps toast buttons aria-hidden until the region is entered (F6), so find them by label.
    const [frontClose] = screen.getAllByLabelText('Закрыть уведомление');
    await user.click(frontClose as HTMLElement);
    await waitFor(() => expect(rendered().some((element) => element.textContent?.includes('Клиент добавлен'))).toBe(false));
  });

  it('dismisses itself after the timeout', async () => {
    vi.useFakeTimers();
    render(<ToastProvider timeout={4000}>{null}</ToastProvider>);
    act(() => {
      toast.add({ title: 'Ссылка скопирована' });
    });
    expect(screen.getByText('Ссылка скопирована')).toBeTruthy();
    act(() => vi.advanceTimersByTime(4100));
    vi.useRealTimers();
    await waitFor(() => expect(screen.queryByText('Ссылка скопирована')).toBeNull());
  });
});

describe('CommandPalette', () => {
  const setup = () => {
    const onClient = vi.fn();
    const onDeal = vi.fn();
    const onSite = vi.fn();
    render(
      <CommandPalette
        groups={[
          { label: 'Клиенты', items: [{ id: 'bakery', label: '«Хлебница»', hint: 'Клиент · Ольга Миронова', onSelect: onClient }] },
          {
            label: 'Сделки',
            items: [
              { id: 'identity', label: 'Айдентика для пекарни', hint: '1 284 900 ₽', onSelect: onDeal },
              { id: 'site', label: 'Сайт для яхт-клуба', hint: '860 000 ₽', onSelect: onSite },
            ],
          },
        ]}
      />,
    );
    return { onClient, onDeal, onSite };
  };

  it('opens on Ctrl+K, moves with arrows and runs the highlighted item on Enter', async () => {
    const user = userEvent.setup();
    const { onDeal } = setup();
    await user.keyboard('{Control>}k{/Control}');
    const input = await screen.findByRole('combobox', { name: 'Поиск по командам' });
    await waitFor(() => expect(document.activeElement).toBe(input));

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    await waitFor(() => expect(highlighted(options[0])).toBe(true));
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(highlighted(options[1])).toBe(true));
    await user.keyboard('{Enter}');

    expect(onDeal).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('filters by text, counts results in Russian and shows an empty state', async () => {
    const user = userEvent.setup();
    const { onSite } = setup();
    await user.keyboard('{Meta>}k{/Meta}');
    const input = await screen.findByRole('combobox', { name: 'Поиск по командам' });
    await waitFor(() => expect(document.activeElement).toBe(input));

    await user.keyboard('яхт');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText(/^1\sрезультат$/)).toBeTruthy();
    await user.keyboard('{Enter}');
    expect(onSite).toHaveBeenCalledOnce();

    await user.keyboard('{Meta>}k{/Meta}');
    const reopened = await screen.findByRole('combobox', { name: 'Поиск по командам' });
    await waitFor(() => expect(document.activeElement).toBe(reopened));
    expect(screen.getAllByRole('option')).toHaveLength(3);
    await user.keyboard('ремонт');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('Ничего не найдено')).toBeTruthy();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('puts title matches above hint matches, across groups, while typing', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CommandPalette
        groups={[
          { label: 'Документация', items: [{ id: 'icons', label: 'Иконки', keywords: ['кнопки'], onSelect }] },
          {
            label: 'Компоненты',
            items: [
              { id: 'group', label: 'Группа кнопок', onSelect },
              { id: 'button', label: 'Кнопка', onSelect },
            ],
          },
        ]}
      />,
    );
    await user.keyboard('{Meta>}k{/Meta}');
    const input = await screen.findByRole('combobox', { name: 'Поиск по командам' });
    await waitFor(() => expect(document.activeElement).toBe(input));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Иконки', 'Группа кнопок', 'Кнопка']);

    await user.keyboard('кноп');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Кнопка', 'Группа кнопок', 'Иконки']);
  });

  it('pluralises the result count', () => {
    expect([1, 2, 5, 11, 21, 24].map(formatResultCount)).toEqual([
      '1 результат',
      '2 результата',
      '5 результатов',
      '11 результатов',
      '21 результат',
      '24 результата',
    ]);
  });
});
