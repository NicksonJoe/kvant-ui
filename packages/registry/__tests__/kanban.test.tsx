import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Kanban, KanbanCard, type KanbanColumn, type KanbanItems } from '..';

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

function Board() {
  const [items, setItems] = useState(initial);
  return (
    <Kanban
      aria-label="Воронка сделок"
      columns={columns}
      items={items}
      onItemsChange={setItems}
      getLabel={(deal) => deal.title}
      renderCard={(deal) => <KanbanCard>{deal.title}</KanbanCard>}
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
});
