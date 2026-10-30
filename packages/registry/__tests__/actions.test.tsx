import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlignCenter, AlignLeft, ArrowRight, Bell, Bold, Italic, NotebookPen, Plus, UserPlus } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, CopyButton, Fab, FabMenu, Link, ToggleButton, ToggleGroup, ToggleGroupItem } from '..';

describe('Button', () => {
  it('while loading with only a trailing icon, keeps the label and puts the spinner in place of the icon', () => {
    render(
      <Button variant="link" trailingIcon={<ArrowRight data-testid="arrow" />} loading>
        Все сделки
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Все сделки' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(screen.queryByTestId('arrow')).toBeNull();
    expect(button.querySelector('[data-slot=button-label]')?.classList.contains('invisible')).toBe(false);
    expect(button.lastElementChild?.getAttribute('data-slot')).toBe('spinner');
  });
});

describe('ToggleButton', () => {
  it('exposes the state as aria-pressed and flips it with Space', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<ToggleButton onPressedChange={onPressedChange}>Избранное</ToggleButton>);
    const toggle = screen.getByRole('button', { name: 'Избранное' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    toggle.focus();
    await user.keyboard(' ');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.hasAttribute('data-pressed')).toBe(true);
    expect(onPressedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('keeps the icon-only name when pressed', async () => {
    const user = userEvent.setup();
    render(<ToggleButton iconOnly icon={<Bell />} aria-label="Уведомления по сделке" />);
    const toggle = screen.getByRole('button', { name: 'Уведомления по сделке' });
    await user.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Уведомления по сделке' })).toBe(toggle);
  });
});

describe('ToggleGroup', () => {
  it('in single mode presses one item and lets the pressed one be released', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup aria-label="Выравнивание" defaultValue={['left']} onValueChange={onValueChange}>
        <ToggleGroupItem value="left" aria-label="По левому краю">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="По центру">
          <AlignCenter />
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole('group', { name: 'Выравнивание' })).toBeTruthy();
    const center = screen.getByRole('button', { name: 'По центру' });
    await user.click(center);
    expect(onValueChange).toHaveBeenLastCalledWith(['center'], expect.anything());
    expect(screen.getByRole('button', { name: 'По левому краю' }).getAttribute('aria-pressed')).toBe('false');

    await user.click(center);
    expect(onValueChange).toHaveBeenLastCalledWith([], expect.anything());
  });

  it('in multiple mode keeps every pressed item and moves focus with arrows', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup multiple aria-label="Начертание" onValueChange={onValueChange}>
        <ToggleGroupItem value="bold" aria-label="Жирный">
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Курсив">
          <Italic />
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    const bold = screen.getByRole('button', { name: 'Жирный' });
    await user.click(bold);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Курсив' }));
    await user.keyboard(' ');
    expect(onValueChange).toHaveBeenLastCalledWith(['bold', 'italic'], expect.anything());
  });
});

describe('Fab', () => {
  it('keeps the label as the accessible name when folded to a circle', () => {
    const { rerender } = render(<Fab icon={<Plus />} label="Новая задача" extended />);
    const fab = screen.getByRole('button', { name: 'Новая задача' });
    expect(fab.hasAttribute('data-extended')).toBe(true);

    rerender(<Fab icon={<Plus />} label="Новая задача" />);
    expect(screen.getByRole('button', { name: 'Новая задача' }).hasAttribute('data-extended')).toBe(false);
  });

  it('opens the speed dial as a menu and runs the chosen action', async () => {
    const user = userEvent.setup();
    const onNote = vi.fn();
    render(
      <FabMenu
        icon={<Plus />}
        label="Создать"
        actions={[
          { label: 'Заметка', icon: <NotebookPen />, onClick: onNote },
          { label: 'Контакт', icon: <UserPlus /> },
        ]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Создать' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    await user.click(trigger);

    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Заметка', 'Контакт']);
    await user.click(screen.getByRole('menuitem', { name: 'Заметка' }));
    expect(onNote).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });
});

describe('Link', () => {
  it('opens external links in a new tab and says so', () => {
    render(
      <Link href="https://norda.ru/brief" external>
        Бриф
      </Link>,
    );
    const link = screen.getByRole('link', { name: /Бриф.*откроется в новой вкладке/ });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('drops the href while disabled', () => {
    render(
      <Link href="/resend" disabled>
        Отправить ещё раз через 0:42
      </Link>,
    );
    const text = screen.getByText('Отправить ещё раз через 0:42');
    expect(text.hasAttribute('href')).toBe(false);
    expect(text.getAttribute('aria-disabled')).toBe('true');
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('CopyButton', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the value, confirms it for two seconds and announces it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CopyButton value="norda.app/i/4F7K-29QX" aria-label="Копировать ссылку" />);
    const button = screen.getByRole('button', { name: 'Копировать ссылку' });

    await user.click(button);
    await waitFor(() => expect(button.hasAttribute('data-copied')).toBe(true));
    expect(await navigator.clipboard.readText()).toBe('norda.app/i/4F7K-29QX');
    expect(screen.getByRole('status').textContent).toBe('Скопировано');

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(button.hasAttribute('data-copied')).toBe(false);
  });

  it('swaps the visible label while copied', async () => {
    const user = userEvent.setup();
    render(<CopyButton value="КП-2026-114" label="Копировать" />);
    await user.click(screen.getByRole('button', { name: 'Копировать' }));
    expect(await screen.findByRole('button', { name: 'Скопировано' })).toBeTruthy();
  });
});
