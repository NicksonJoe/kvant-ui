import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionSheet, ActionSheetContent, ActionSheetGroup, ActionSheetItem, ActionSheetSub, ActionSheetTrigger } from '..';

afterEach(() => vi.restoreAllMocks());

function DealSheet({ onTask = () => {}, onArchive = () => {} }: { onTask?: () => void; onArchive?: () => void }) {
  return (
    <ActionSheet>
      <ActionSheetTrigger>Действия</ActionSheetTrigger>
      <ActionSheetContent title="Айдентика для пекарни" description="«Хлебница» · 1 284 900 ₽">
        <ActionSheetGroup>
          <ActionSheetItem onClick={onTask}>Создать задачу</ActionSheetItem>
          <ActionSheetItem value="Переговоры" keepOpen>
            Изменить этап
          </ActionSheetItem>
        </ActionSheetGroup>
        <ActionSheetGroup>
          <ActionSheetSub label="Ещё" value="В архив, удалить">
            <ActionSheetGroup>
              <ActionSheetItem onClick={onArchive}>В архив…</ActionSheetItem>
              <ActionSheetItem destructive>Удалить…</ActionSheetItem>
            </ActionSheetGroup>
          </ActionSheetSub>
        </ActionSheetGroup>
      </ActionSheetContent>
    </ActionSheet>
  );
}

async function openSheet() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Действия' }));
  const dialog = await screen.findByRole('dialog', { name: 'Действия: Айдентика для пекарни' });
  return { user, dialog };
}

describe('ActionSheet second level', () => {
  it('opens the nested list in the same sheet, moves focus to its title and goes back with «Назад»', async () => {
    render(<DealSheet />);
    const { user, dialog } = await openSheet();

    const more = screen.getByRole('button', { name: /Ещё/ });
    expect(more.textContent).toContain('В архив, удалить');
    await user.click(more);

    const heading = screen.getByRole('heading', { name: 'Ещё' });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByRole('button', { name: 'Удалить…' })).toBeDefined();
    // the first level is out of the way: hidden for the reader and for Tab
    expect(screen.queryByRole('button', { name: 'Создать задачу' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Ещё' })).toBeDefined();
    expect(dialog.isConnected).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.queryByRole('heading', { name: 'Ещё' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Создать задачу' })).toBeDefined();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Ещё/ }));
    expect(screen.getByRole('dialog')).toBe(dialog);
  });

  it('Esc returns from the second level first, the next Esc closes the sheet', async () => {
    render(<DealSheet />);
    const { user } = await openSheet();
    await user.click(screen.getByRole('button', { name: /Ещё/ }));
    expect(screen.getByRole('heading', { name: 'Ещё' })).toBeDefined();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('heading', { name: 'Ещё' })).toBeNull();
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Ещё/ }));

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('runs an action of the second level and closes the whole sheet; it reopens at the first level', async () => {
    const onArchive = vi.fn();
    render(<DealSheet onArchive={onArchive} />);
    const { user } = await openSheet();
    await user.click(screen.getByRole('button', { name: /Ещё/ }));
    await user.click(screen.getByRole('button', { name: 'В архив…' }));
    expect(onArchive).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await user.click(screen.getByRole('button', { name: 'Действия' }));
    expect(await screen.findByRole('button', { name: 'Создать задачу' })).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Ещё' })).toBeNull();
  });

  it('shows a value next to an item that keeps the sheet open', async () => {
    render(<DealSheet />);
    const { user } = await openSheet();
    const stage = screen.getByRole('button', { name: /Изменить этап/ });
    expect(stage.textContent).toContain('Переговоры');
    await user.click(stage);
    expect(screen.getByRole('dialog')).toBeDefined();
  });
});

describe('ActionSheet drag to dismiss', () => {
  let now = 0;
  const setup = async () => {
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    render(<DealSheet />);
    const { dialog } = await openSheet();
    // jsdom has no layout: the sheet is 280 px tall, so the distance threshold is 98 px
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(new DOMRect(8, 400, 359, 280));
    const header = dialog.querySelector('[data-slot=action-sheet-header]') as HTMLElement;
    return { dialog, header };
  };
  const drag = (target: HTMLElement, steps: readonly [ms: number, y: number][], pointerType = 'mouse') => {
    now = 0;
    fireEvent.pointerDown(target, { pointerId: 1, pointerType, button: 0, clientX: 100, clientY: 400 });
    for (const [ms, y] of steps) {
      now = ms;
      fireEvent.pointerMove(target, { pointerId: 1, pointerType, clientX: 100, clientY: 400 + y });
    }
  };
  const release = (target: HTMLElement, y: number) => fireEvent.pointerUp(target, { pointerId: 1, clientX: 100, clientY: 400 + y });

  it('follows the pointer 1:1 and closes past 35 % of its height', async () => {
    const { dialog, header } = await setup();
    drag(header, [
      [400, 40],
      [800, 104],
    ]);
    expect(dialog.hasAttribute('data-dragging')).toBe(true);
    expect(dialog.style.translate).toBe('0 104px');
    now = 1200;
    release(header, 104);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('springs back below the threshold after a slow release', async () => {
    const { dialog, header } = await setup();
    drag(header, [
      [400, 40],
      [800, 90],
    ]);
    now = 1200;
    release(header, 90);
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(dialog.hasAttribute('data-dragging')).toBe(false);
    expect(dialog.style.translate).toBe('');
  });

  it('closes on a fast flick shorter than the threshold', async () => {
    const { header } = await setup();
    drag(header, [
      [20, 20],
      [50, 60],
    ]);
    release(header, 60);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('resists a pull upwards and never closes on it', async () => {
    const { dialog, header } = await setup();
    drag(header, [
      [400, -50],
      [800, -100],
    ]);
    expect(dialog.style.translate).toBe('0 -30px');
    now = 820;
    release(header, -100);
    expect(screen.getByRole('dialog')).toBe(dialog);
  });

  it('a small move stays a tap; after a real drag the click does not run the action', async () => {
    const onTask = vi.fn();
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    render(<DealSheet onTask={onTask} />);
    const { dialog } = await openSheet();
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(new DOMRect(8, 400, 359, 280));
    const task = screen.getByRole('button', { name: 'Создать задачу' });

    drag(task, [[100, 3]]);
    expect(dialog.hasAttribute('data-dragging')).toBe(false);
    release(task, 3);

    drag(task, [
      [400, 30],
      [800, 60],
    ]);
    now = 1200;
    release(task, 60);
    fireEvent.click(task);
    expect(onTask).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBe(dialog);
  });

  it('touch in a scrolled list scrolls it; at the top a pull down drags the sheet', async () => {
    const { dialog } = await setup();
    const list = dialog.querySelector('[data-slot=action-sheet-list]') as HTMLElement;
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 900 });
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 500 });
    const item = screen.getByRole('button', { name: 'Создать задачу' });

    list.scrollTop = 120;
    fireEvent.touchStart(item, { touches: [{ clientX: 100, clientY: 400 }] });
    fireEvent.touchMove(item, { touches: [{ clientX: 100, clientY: 460 }] });
    expect(dialog.hasAttribute('data-dragging')).toBe(false);
    fireEvent.touchEnd(item, { changedTouches: [{ clientX: 100, clientY: 460 }] });

    list.scrollTop = 0;
    now = 0;
    fireEvent.touchStart(item, { touches: [{ clientX: 100, clientY: 400 }] });
    now = 400;
    fireEvent.touchMove(item, { touches: [{ clientX: 100, clientY: 420 }] });
    now = 800;
    const move = fireEvent.touchMove(item, { touches: [{ clientX: 100, clientY: 520 }] });
    expect(move).toBe(false);
    expect(dialog.hasAttribute('data-dragging')).toBe(true);
    expect(dialog.style.translate).toBe('0 120px');
    now = 1200;
    act(() => {
      fireEvent.touchEnd(item, { changedTouches: [{ clientX: 100, clientY: 520 }] });
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
