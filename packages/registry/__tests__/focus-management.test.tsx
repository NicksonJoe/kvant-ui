import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { FocusGroup, FocusTrap, focusRing } from '..';

const active = () => document.activeElement;
const tabIndexes = () => screen.getAllByRole('button').map((button) => button.tabIndex);

function Editor({ autoFocusName = false }: { autoFocusName?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Изменить запись
      </button>
      <button type="button">Снаружи</button>
      {open ? (
        <FocusTrap aria-label="Запись">
          <input aria-label="Имя" autoFocus={autoFocusName} />
          <button type="button" disabled>
            Недоступно
          </button>
          <button type="button" onClick={() => setOpen(false)}>
            Сохранить
          </button>
        </FocusTrap>
      ) : null}
    </>
  );
}

describe('FocusTrap', () => {
  it('moves focus to the first tabbable element inside on mount', () => {
    render(<Editor />);
    const trigger = screen.getByRole('button', { name: 'Изменить запись' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(active()).toBe(screen.getByRole('textbox', { name: 'Имя' }));
    expect(document.querySelector('[data-slot=focus-trap]')).not.toBeNull();
  });

  it('keeps an autoFocus element instead of the first one', () => {
    function Trap() {
      return (
        <FocusTrap>
          <button type="button">Первая</button>
          <button type="button" autoFocus>
            Вторая
          </button>
        </FocusTrap>
      );
    }
    render(<Trap />);
    expect(active()).toBe(screen.getByRole('button', { name: 'Вторая' }));
  });

  it('cycles Tab from the last element to the first and Shift+Tab back, skipping disabled ones', () => {
    render(<Editor />);
    fireEvent.click(screen.getByRole('button', { name: 'Изменить запись' }));
    const name = screen.getByRole('textbox', { name: 'Имя' });
    const save = screen.getByRole('button', { name: 'Сохранить' });

    save.focus();
    fireEvent.keyDown(save, { key: 'Tab' });
    expect(active()).toBe(name);

    fireEvent.keyDown(name, { key: 'Tab', shiftKey: true });
    expect(active()).toBe(save);
  });

  it('leaves Tab between inner elements to the browser', () => {
    render(<Editor />);
    fireEvent.click(screen.getByRole('button', { name: 'Изменить запись' }));
    const name = screen.getByRole('textbox', { name: 'Имя' });
    const event = fireEvent.keyDown(name, { key: 'Tab' });
    // fireEvent returns false once the default action is prevented
    expect(event).toBe(true);
    expect(active()).toBe(name);
  });

  it('returns focus to the element that opened it when it unmounts', () => {
    render(<Editor />);
    const trigger = screen.getByRole('button', { name: 'Изменить запись' });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(active()).toBe(trigger);
  });

  it('does not pull focus back when the user already moved it outside', () => {
    render(<Editor />);
    const trigger = screen.getByRole('button', { name: 'Изменить запись' });
    trigger.focus();
    fireEvent.click(trigger);
    const outside = screen.getByRole('button', { name: 'Снаружи' });
    outside.focus();
    // closing from outside: the trap unmounts while focus is elsewhere
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Сохранить' })));
    expect(active()).toBe(outside);
  });

  it('focuses the container itself and holds Tab when nothing inside can take focus', () => {
    render(<FocusTrap aria-label="Пусто">Нет полей</FocusTrap>);
    const trap = document.querySelector('[data-slot=focus-trap]') as HTMLElement;
    expect(trap.getAttribute('tabindex')).toBe('-1');
    expect(active()).toBe(trap);
    expect(fireEvent.keyDown(trap, { key: 'Tab' })).toBe(false);
    expect(active()).toBe(trap);
  });
});

function Group({ orientation, loop, extra = false }: { orientation?: 'horizontal' | 'vertical'; loop?: boolean; extra?: boolean }) {
  return (
    <FocusGroup aria-label="Действия" orientation={orientation} loop={loop}>
      <button type="button">Жирный</button>
      <button type="button">Курсив</button>
      <button type="button" aria-disabled="true">
        Ссылка
      </button>
      <button type="button" disabled>
        Код
      </button>
      <button type="button">Цитата</button>
      {extra ? <button type="button">Список</button> : null}
    </FocusGroup>
  );
}

describe('FocusGroup', () => {
  it('is one Tab stop: only the first item is tabbable', () => {
    render(<Group />);
    expect(screen.getByRole('group', { name: 'Действия' }).getAttribute('data-slot')).toBe('focus-group');
    expect(screen.getByRole('group').getAttribute('data-orientation')).toBe('horizontal');
    expect(tabIndexes()).toEqual([0, -1, -1, -1, -1]);
  });

  it('moves focus with ← → and skips disabled items, the tab stop follows', () => {
    render(<Group />);
    const [bold, italic, , , quote] = screen.getAllByRole('button');
    if (!bold || !italic || !quote) throw new Error('no buttons');
    bold.focus();
    fireEvent.keyDown(bold, { key: 'ArrowRight' });
    expect(active()).toBe(italic);
    fireEvent.keyDown(italic, { key: 'ArrowRight' });
    expect(active()).toBe(quote);
    expect(tabIndexes()).toEqual([-1, -1, -1, -1, 0]);
    fireEvent.keyDown(quote, { key: 'ArrowLeft' });
    expect(active()).toBe(italic);
  });

  it('wraps around at the ends by default and stops there with loop={false}', () => {
    const { unmount } = render(<Group />);
    const buttons = screen.getAllByRole('button');
    const first = buttons[0] as HTMLElement;
    const last = buttons[4] as HTMLElement;
    last.focus();
    fireEvent.keyDown(last, { key: 'ArrowRight' });
    expect(active()).toBe(first);
    fireEvent.keyDown(first, { key: 'ArrowLeft' });
    expect(active()).toBe(last);
    unmount();

    render(<Group loop={false} />);
    const stopLast = screen.getAllByRole('button')[4] as HTMLElement;
    stopLast.focus();
    fireEvent.keyDown(stopLast, { key: 'ArrowRight' });
    expect(active()).toBe(stopLast);
  });

  it('jumps to the first and last item with Home and End', () => {
    render(<Group />);
    const buttons = screen.getAllByRole('button');
    const first = buttons[0] as HTMLElement;
    first.focus();
    fireEvent.keyDown(first, { key: 'End' });
    expect(active()).toBe(buttons[4]);
    fireEvent.keyDown(buttons[4] as HTMLElement, { key: 'Home' });
    expect(active()).toBe(first);
  });

  it('uses ↑ ↓ when vertical and leaves ← → alone', () => {
    render(<Group orientation="vertical" />);
    const buttons = screen.getAllByRole('button');
    const first = buttons[0] as HTMLElement;
    first.focus();
    expect(fireEvent.keyDown(first, { key: 'ArrowRight' })).toBe(true);
    expect(active()).toBe(first);
    expect(fireEvent.keyDown(first, { key: 'ArrowDown' })).toBe(false);
    expect(active()).toBe(buttons[1]);
    fireEvent.keyDown(buttons[1] as HTMLElement, { key: 'ArrowUp' });
    expect(active()).toBe(first);
  });

  it('keeps the tab stop on the item focused last, by Tab or by click', () => {
    render(<Group />);
    const italic = screen.getByRole('button', { name: 'Курсив' });
    fireEvent.focus(italic);
    expect(tabIndexes()).toEqual([-1, 0, -1, -1, -1]);
  });

  it('takes items added later out of the Tab order', async () => {
    const { rerender } = render(<Group />);
    rerender(<Group extra />);
    // MutationObserver callbacks run as microtasks
    await act(async () => {});
    expect(screen.getByRole('button', { name: 'Список' }).tabIndex).toBe(-1);
    expect(tabIndexes().filter((index) => index === 0)).toHaveLength(1);
  });

  it('lets arrow keys move the caret inside a text field', () => {
    render(
      <FocusGroup aria-label="Фильтры">
        <input aria-label="Поиск" />
        <button type="button">Сбросить</button>
      </FocusGroup>,
    );
    const search = screen.getByRole('textbox');
    search.focus();
    expect(fireEvent.keyDown(search, { key: 'ArrowRight' })).toBe(true);
    expect(active()).toBe(search);
  });
});

describe('focusRing', () => {
  it('names the three ring placements from the board', () => {
    expect(focusRing.outside).toContain('outline-offset-2');
    expect(focusRing.flush).toContain('focus-visible:border-ring');
    expect(focusRing.flush).toContain('focus-visible:shadow-[0_0_0_1px_var(--color-ring)]');
    expect(focusRing.inset).toContain('focus-visible:-outline-offset-2');
  });
});
