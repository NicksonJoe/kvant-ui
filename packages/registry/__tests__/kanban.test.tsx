import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Kanban, KanbanCard, type KanbanColumn, type KanbanItems, type KanbanProps } from '..';

interface Deal {
  id: string;
  title: string;
}

const columns: KanbanColumn[] = [
  { id: 'qualification', title: 'Квалификация' },
  { id: 'negotiation', title: 'Переговоры', limit: 1 },
  { id: 'invoice', title: 'Счёт выставлен' },
];

const initial: KanbanItems<Deal> = {
  qualification: [
    { id: 'tea', title: 'Упаковка чая' },
    { id: 'icons', title: 'Иконки' },
  ],
  negotiation: [
    { id: 'brand', title: 'Айдентика' },
    { id: 'cafe', title: 'Стиль кафе' },
  ],
  invoice: [],
};

type BoardProps = Partial<Pick<KanbanProps<Deal>, 'collapsible' | 'collapsed' | 'defaultCollapsed' | 'onCollapsedChange'>>;

function Board(props: BoardProps) {
  const [items, setItems] = useState(initial);
  return (
    <Kanban
      aria-label="Воронка сделок"
      columns={columns}
      items={items}
      onItemsChange={setItems}
      getLabel={(deal) => deal.title}
      renderCard={(deal) => <KanbanCard>{deal.title}</KanbanCard>}
      {...props}
    />
  );
}

const column = (name: string) => screen.getByRole('group', { name: new RegExp(`^${name}`) });

describe('Kanban', () => {
  it('shows counts, the over-limit warning and the empty column', () => {
    render(<Board />);
    expect(within(column('Квалификация')).getByText('2')).toBeDefined();
    expect(within(column('Переговоры')).getByText('2 / 1')).toBeDefined();
    expect(within(column('Счёт выставлен')).getByText('Здесь пока пусто')).toBeDefined();
  });

  it('moves a card between columns and within one with Alt+arrows and announces it', () => {
    render(<Board />);
    const card = screen.getByRole('button', { name: /Упаковка чая/ });
    card.focus();

    fireEvent.keyDown(card, { key: 'ArrowRight', altKey: true });
    expect(within(column('Переговоры')).getByText('Упаковка чая')).toBeDefined();
    expect(screen.getByRole('status').textContent).toBe('«Упаковка чая» — в «Переговоры», позиция 3 из 3');

    fireEvent.keyDown(screen.getByRole('button', { name: /Упаковка чая/ }), { key: 'ArrowUp', altKey: true });
    const titles = within(column('Переговоры')).getAllByRole('button').map((button) => button.textContent);
    expect(titles).toEqual(['Айдентика', 'Упаковка чая', 'Стиль кафе']);
  });

  it('drops a dragged card into another column', () => {
    render(<Board />);
    fireEvent.dragStart(screen.getByRole('button', { name: /Иконки/ }));
    fireEvent.dragOver(column('Счёт выставлен'));
    fireEvent.drop(column('Счёт выставлен'));
    expect(within(column('Счёт выставлен')).getByText('Иконки')).toBeDefined();
    expect(within(column('Квалификация')).queryByText('Иконки')).toBeNull();
  });

  describe('on a touch screen', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('moves a card after a long press and a drag to another column', () => {
      vi.useFakeTimers();
      render(<Board />);
      const card = screen.getByRole('button', { name: /Иконки/ });
      const target = column('Счёт выставлен');
      document.elementFromPoint = () => target;

      fireEvent.touchStart(card, { touches: [{ clientX: 10, clientY: 10 }] });
      act(() => vi.advanceTimersByTime(400));
      fireEvent.touchMove(card, { touches: [{ clientX: 600, clientY: 40 }] });
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 600, clientY: 40 }] });

      expect(within(column('Счёт выставлен')).getByText('Иконки')).toBeDefined();
    });

    it('treats a quick swipe as scrolling, not as a drag', () => {
      vi.useFakeTimers();
      render(<Board />);
      const card = screen.getByRole('button', { name: /Иконки/ });
      document.elementFromPoint = () => column('Счёт выставлен');

      fireEvent.touchStart(card, { touches: [{ clientX: 10, clientY: 10 }] });
      fireEvent.touchMove(card, { touches: [{ clientX: 60, clientY: 10 }] });
      act(() => vi.advanceTimersByTime(400));
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 60, clientY: 10 }] });

      expect(within(column('Квалификация')).getByText('Иконки')).toBeDefined();
    });
  });

  describe('collapsed columns', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('offers no collapse button unless the board is collapsible', () => {
      render(<Board />);
      expect(screen.queryByRole('button', { name: /^Свернуть колонку/ })).toBeNull();
    });

    it('collapses a column from its header into a narrow strip and expands it back, keeping focus', async () => {
      const user = userEvent.setup();
      render(<Board collapsible />);
      const collapse = screen.getByRole('button', { name: 'Свернуть колонку «Квалификация»' });
      expect(collapse.getAttribute('aria-expanded')).toBe('true');

      await user.click(collapse);
      const strip = column('Квалификация');
      expect(strip.dataset.collapsed).toBe('');
      expect(within(strip).queryByText('Упаковка чая')).toBeNull();
      const expand = within(strip).getByRole('button', { name: 'Развернуть колонку «Квалификация»' });
      expect(expand.getAttribute('aria-expanded')).toBe('false');
      expect(within(strip).getByText('2')).toBeDefined();
      expect(document.activeElement).toBe(expand);

      await user.keyboard('{Enter}');
      expect(within(column('Квалификация')).getByText('Упаковка чая')).toBeDefined();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Свернуть колонку «Квалификация»' }));
    });

    it('puts the summary next to the title in the strip', () => {
      render(
        <Kanban
          aria-label="Воронка сделок"
          columns={[{ id: 'paid', title: 'Оплачено', summary: '4,8 млн ₽' }]}
          items={{ paid: [{ id: 'tea', title: 'Упаковка чая' }] }}
          onItemsChange={() => {}}
          getLabel={(deal) => deal.title}
          renderCard={(deal) => <KanbanCard>{deal.title}</KanbanCard>}
          defaultCollapsed={['paid']}
        />,
      );
      expect(within(column('Оплачено')).getByText('Оплачено · 4,8 млн ₽')).toBeDefined();
    });

    it('starts from defaultCollapsed and reports every change', async () => {
      const user = userEvent.setup();
      const onCollapsedChange = vi.fn();
      render(<Board collapsible defaultCollapsed={['invoice']} onCollapsedChange={onCollapsedChange} />);
      expect(column('Счёт выставлен').dataset.collapsed).toBe('');

      await user.click(screen.getByRole('button', { name: 'Свернуть колонку «Переговоры»' }));
      expect(onCollapsedChange).toHaveBeenLastCalledWith(['invoice', 'negotiation']);
      await user.click(screen.getByRole('button', { name: 'Развернуть колонку «Счёт выставлен»' }));
      expect(onCollapsedChange).toHaveBeenLastCalledWith(['negotiation']);
      expect(column('Счёт выставлен').dataset.collapsed).toBeUndefined();
    });

    it('follows a controlled collapsed list and only asks to change it', async () => {
      const user = userEvent.setup();
      const onCollapsedChange = vi.fn();
      render(<Board collapsible collapsed={['invoice']} onCollapsedChange={onCollapsedChange} />);

      await user.click(screen.getByRole('button', { name: 'Развернуть колонку «Счёт выставлен»' }));
      expect(onCollapsedChange).toHaveBeenLastCalledWith([]);
      expect(column('Счёт выставлен').dataset.collapsed).toBe('');
    });

    it('takes a dragged card onto the strip, highlighted while over it, and adds it to the end', () => {
      render(<Board defaultCollapsed={['invoice']} />);
      fireEvent.dragStart(screen.getByRole('button', { name: /Иконки/ }));
      fireEvent.dragOver(column('Счёт выставлен'));
      expect(column('Счёт выставлен').dataset.dropTarget).toBe('');

      fireEvent.drop(column('Счёт выставлен'));
      expect(within(column('Квалификация')).queryByText('Иконки')).toBeNull();
      expect(column('Счёт выставлен').dataset.dropTarget).toBeUndefined();
      expect(within(column('Счёт выставлен')).getByText('1')).toBeDefined();
      expect(screen.getByRole('status').textContent).toBe('«Иконки» — в «Счёт выставлен», позиция 1 из 1');
    });

    it('moves a card into a collapsed neighbour with Alt+→ and leaves focus on the strip', () => {
      render(<Board defaultCollapsed={['invoice']} />);
      const card = screen.getByRole('button', { name: /Айдентика/ });
      card.focus();
      fireEvent.keyDown(card, { key: 'ArrowRight', altKey: true });

      expect(within(column('Переговоры')).queryByText('Айдентика')).toBeNull();
      expect(screen.getByRole('status').textContent).toBe('«Айдентика» — в «Счёт выставлен», позиция 1 из 1');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Развернуть колонку «Счёт выставлен»' }));
    });

    it('takes a touch drag onto the strip', () => {
      vi.useFakeTimers();
      render(<Board defaultCollapsed={['invoice']} />);
      const card = screen.getByRole('button', { name: /Иконки/ });
      const strip = screen.getByRole('button', { name: 'Развернуть колонку «Счёт выставлен»' });
      document.elementFromPoint = () => strip;

      fireEvent.touchStart(card, { touches: [{ clientX: 10, clientY: 10 }] });
      act(() => vi.advanceTimersByTime(400));
      fireEvent.touchMove(card, { touches: [{ clientX: 900, clientY: 40 }] });
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 900, clientY: 40 }] });

      expect(within(column('Квалификация')).queryByText('Иконки')).toBeNull();
      expect(within(column('Счёт выставлен')).getByText('1')).toBeDefined();
    });
  });
});
