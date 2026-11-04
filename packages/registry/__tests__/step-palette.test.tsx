import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CANVAS_STEP_MIME, StepPalette, readCanvasStepDrag, type CanvasStepGroup } from '../components/step-palette';

const groups: CanvasStepGroup[] = [
  {
    id: 'triggers',
    title: 'Триггеры',
    items: [
      { id: 'tg-message', kind: 'trigger', title: 'Новое сообщение', keywords: ['telegram'] },
      { id: 'schedule', kind: 'trigger', title: 'По расписанию' },
    ],
  },
  {
    id: 'actions',
    title: 'Действия',
    items: [{ id: 'create-deal', kind: 'action', title: 'Создать сделку' }],
  },
];

function dataTransfer(): DataTransfer {
  const store = new Map<string, string>();
  return {
    effectAllowed: 'none',
    dropEffect: 'none',
    setData: (type: string, value: string) => store.set(type, value),
    getData: (type: string) => store.get(type) ?? '',
    get types() {
      return [...store.keys()];
    },
  } as unknown as DataTransfer;
}

describe('StepPalette', () => {
  it('lists steps in named groups', () => {
    render(<StepPalette groups={groups} onInsert={vi.fn()} />);
    const triggers = screen.getByRole('group', { name: 'Триггеры' });
    expect(within(triggers).getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Создать сделку' })).toBeTruthy();
  });

  it('inserts on click and on Enter', async () => {
    const onInsert = vi.fn();
    render(<StepPalette groups={groups} onInsert={onInsert} />);
    await userEvent.click(screen.getByRole('button', { name: 'По расписанию' }));
    expect(onInsert).toHaveBeenLastCalledWith(groups[0]?.items[1]);
    screen.getByRole('button', { name: 'Создать сделку' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onInsert).toHaveBeenLastCalledWith(groups[1]?.items[0]);
  });

  it('filters by title and keywords, hides empty groups and says when nothing matches', async () => {
    render(<StepPalette groups={groups} onInsert={vi.fn()} />);
    const search = screen.getByRole('searchbox', { name: 'Найти шаг' });
    await userEvent.type(search, 'TELEGRAM');
    expect(screen.getAllByRole('button', { name: /Новое сообщение/ })).toHaveLength(1);
    expect(screen.queryByRole('group', { name: 'Действия' })).toBeNull();
    await userEvent.clear(search);
    await userEvent.type(search, 'фывап');
    expect(screen.getByText('Ничего не нашлось')).toBeTruthy();
  });

  it('«/» focuses the search; ↓ walks the steps; Enter in the search inserts the first match', async () => {
    const onInsert = vi.fn();
    render(<StepPalette groups={groups} onInsert={onInsert} />);
    await userEvent.keyboard('/');
    const search = screen.getByRole('searchbox', { name: 'Найти шаг' });
    expect(document.activeElement).toBe(search);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Новое сообщение' }));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Создать сделку' }));
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'По расписанию' }));
    search.focus();
    await userEvent.type(search, 'сделк{Enter}');
    expect(onInsert).toHaveBeenLastCalledWith(groups[1]?.items[0]);
  });

  it('drags a step with the kvant MIME type: kind and template id', () => {
    render(<StepPalette groups={groups} onInsert={vi.fn()} />);
    const item = screen.getByRole('button', { name: 'Создать сделку' });
    expect(item.getAttribute('draggable')).toBe('true');
    const transfer = dataTransfer();
    fireEvent.dragStart(item, { dataTransfer: transfer });
    expect(JSON.parse(transfer.getData(CANVAS_STEP_MIME))).toEqual({ kind: 'action', templateId: 'create-deal' });
    expect(readCanvasStepDrag(transfer)).toEqual({ kind: 'action', templateId: 'create-deal' });
    expect(transfer.effectAllowed).toBe('copy');
  });

  it('reads only a well-formed payload from a drop', () => {
    const transfer = dataTransfer();
    expect(readCanvasStepDrag(transfer)).toBeNull();
    transfer.setData(CANVAS_STEP_MIME, '{"kind":"rocket","templateId":"x"}');
    expect(readCanvasStepDrag(transfer)).toBeNull();
    transfer.setData(CANVAS_STEP_MIME, 'not json');
    expect(readCanvasStepDrag(transfer)).toBeNull();
    transfer.setData(CANVAS_STEP_MIME, '{"kind":"wait","templateId":"pause"}');
    expect(readCanvasStepDrag(transfer)).toEqual({ kind: 'wait', templateId: 'pause' });
  });
});
