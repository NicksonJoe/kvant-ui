import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ActionSheet, ActionSheetContent, ActionSheetGroup, ActionSheetItem, ActionSheetTrigger, PullToRefresh, SwipeActions } from '..';

describe('ActionSheet', () => {
  it('opens named after its subject, runs an action and closes, and has a separate cancel', async () => {
    const user = userEvent.setup();
    const onTask = vi.fn();
    render(
      <ActionSheet>
        <ActionSheetTrigger>Действия</ActionSheetTrigger>
        <ActionSheetContent title="Айдентика для пекарни">
          <ActionSheetGroup>
            <ActionSheetItem onClick={onTask}>Создать задачу</ActionSheetItem>
            <ActionSheetItem>Позвонить</ActionSheetItem>
          </ActionSheetGroup>
          <ActionSheetGroup>
            <ActionSheetItem destructive>Удалить…</ActionSheetItem>
          </ActionSheetGroup>
        </ActionSheetContent>
      </ActionSheet>,
    );

    await user.click(screen.getByRole('button', { name: 'Действия' }));
    expect(await screen.findByRole('dialog', { name: 'Действия: Айдентика для пекарни' })).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Создать задачу' }));
    expect(onTask).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await user.click(screen.getByRole('button', { name: 'Действия' }));
    await user.click(await screen.findByRole('button', { name: 'Отмена' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('SwipeActions', () => {
  const swipe = (row: HTMLElement, from: number, to: number) => {
    fireEvent.pointerDown(row, { pointerType: 'touch', pointerId: 1, clientX: from, clientY: 20 });
    fireEvent.pointerMove(row, { pointerType: 'touch', pointerId: 1, clientX: (from + to) / 2, clientY: 21 });
    fireEvent.pointerMove(row, { pointerType: 'touch', pointerId: 1, clientX: to, clientY: 21 });
    fireEvent.pointerUp(row, { pointerType: 'touch', pointerId: 1, clientX: to, clientY: 21 });
  };

  it('opens the trailing actions past 40 % and makes them reachable', () => {
    const onTask = vi.fn();
    render(
      <SwipeActions trailing={[{ id: 'task', label: 'Задача', onSelect: onTask }, { id: 'more', label: 'Ещё', tone: 'neutral', onSelect: () => {} }]}>
        <div>Айдентика для пекарни</div>
      </SwipeActions>,
    );
    const row = screen.getByText('Айдентика для пекарни').parentElement as HTMLElement;
    const root = row.parentElement as HTMLElement;
    expect(root.dataset.state).toBe('closed');

    swipe(row, 300, 220);
    expect(root.dataset.state).toBe('trailing');
    fireEvent.click(screen.getByRole('button', { name: 'Задача' }));
    expect(onTask).toHaveBeenCalledOnce();
  });

  it('runs the outer leading action on a full swipe', () => {
    const onRead = vi.fn();
    render(
      <SwipeActions leading={[{ id: 'read', label: 'Прочитано', onSelect: onRead }]}>
        <div>Айдентика для пекарни</div>
      </SwipeActions>,
    );
    swipe(screen.getByText('Айдентика для пекарни').parentElement as HTMLElement, 20, 320);
    expect(onRead).toHaveBeenCalledOnce();
  });
});

describe('PullToRefresh', () => {
  it('arms at the threshold, refreshes on release and shows the result', async () => {
    let finish: (value: string) => void = () => {};
    const onRefresh = vi.fn(() => new Promise<string>((resolve) => (finish = resolve)));
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <p>Сделки</p>
      </PullToRefresh>,
    );
    const area = screen.getByText('Сделки').parentElement as HTMLElement;

    fireEvent.touchStart(area, { touches: [{ clientX: 0, clientY: 0 }] });
    fireEvent.touchMove(area, { touches: [{ clientX: 0, clientY: 120 }] });
    expect(screen.getByText('Отпустите, чтобы обновить')).toBeDefined();
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 0, clientY: 120 }] });

    expect(onRefresh).toHaveBeenCalledOnce();
    expect(screen.getByRole('status').textContent).toBe('Обновляем…');
    await act(async () => finish('1 новая сделка'));
    expect(await screen.findByText('1 новая сделка')).toBeDefined();
  });

  it('does nothing below the threshold', () => {
    const onRefresh = vi.fn(async (): Promise<string | undefined> => undefined);
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <p>Сделки</p>
      </PullToRefresh>,
    );
    const area = screen.getByText('Сделки').parentElement as HTMLElement;
    fireEvent.touchStart(area, { touches: [{ clientX: 0, clientY: 0 }] });
    fireEvent.touchMove(area, { touches: [{ clientX: 0, clientY: 50 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 0, clientY: 50 }] });
    expect(onRefresh).not.toHaveBeenCalled();
  });
});

describe('SwipeActions from the keyboard', () => {
  it('opens the side whose action gets focus and closes when focus leaves', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SwipeActions trailing={[{ id: 'task', label: 'Задача', onSelect: () => {} }]}>
          <button type="button">Айдентика для пекарни</button>
        </SwipeActions>
        <button type="button">после</button>
      </>,
    );
    await user.tab();
    expect(document.activeElement?.textContent).toBe('Айдентика для пекарни');
    await user.tab();
    expect(document.activeElement?.textContent).toBe('Задача');
    expect(document.querySelector('[data-slot=swipe-actions]')?.getAttribute('data-state')).toBe('trailing');
    await user.tab();
    expect(document.querySelector('[data-slot=swipe-actions]')?.getAttribute('data-state')).toBe('closed');
  });
});

describe('PullToRefresh with a fast flick', () => {
  it('refreshes when the move and the release arrive before a render', () => {
    const onRefresh = vi.fn(async () => undefined);
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <p>Сделки</p>
      </PullToRefresh>,
    );
    const area = screen.getByText('Сделки').parentElement as HTMLElement;
    act(() => {
      fireEvent.touchStart(area, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchMove(area, { touches: [{ clientX: 0, clientY: 140 }] });
      fireEvent.touchEnd(area, { changedTouches: [{ clientX: 0, clientY: 140 }] });
    });
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
