import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, Gallery, type GalleryItem } from '..';

const items: GalleryItem[] = [
  { src: '/office.jpg', alt: 'Офис студии', name: 'office.jpg' },
  { src: '/team.jpg', alt: 'Команда на встрече', name: 'team.jpg' },
  { src: '/review.jpg', alt: 'Отзыв клиента', name: 'review.mp4', video: '/review.mp4', duration: 38 },
  { src: '/desk.jpg', alt: 'Рабочее место', name: 'desk.jpg' },
  { src: '/kitchen.jpg', alt: 'Кухня', name: 'kitchen.jpg' },
];

const box = (name: string) => screen.getByRole('checkbox', { name: `Выбрать: ${name}` });

function Controlled({ onChange }: { onChange?: (selected: readonly number[]) => void }) {
  const [selected, setSelected] = useState<readonly number[]>([]);
  return (
    <Gallery
      items={items}
      selectable
      selected={selected}
      onSelectedChange={(next) => {
        setSelected(next);
        onChange?.(next);
      }}
      bulkActions={(chosen, clear) => (
        <Button size="sm" variant="ghost" onClick={clear}>
          Скачать {chosen.length}
        </Button>
      )}
    />
  );
}

afterEach(() => vi.useRealTimers());

describe('Gallery · video tiles', () => {
  it('shows the poster with ▶ and the length and opens the viewer on the video', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<Gallery items={items} onOpen={onOpen} />);

    const tile = screen.getByRole('button', { name: 'Смотреть видео: Отзыв клиента, 0:38' });
    expect(tile.querySelector('img')?.getAttribute('src')).toBe('/review.jpg');
    expect(tile.querySelector('[data-slot=gallery-duration]')?.textContent).toBe('0:38');
    expect(tile.querySelector('[data-slot=gallery-play]')).not.toBeNull();
    // photos have no play badge
    expect(screen.getByRole('button', { name: 'Открыть: Офис студии' }).querySelector('[data-slot=gallery-play]')).toBeNull();

    await user.click(tile);
    expect(onOpen).toHaveBeenLastCalledWith(2);
  });

  it('leaves the length out when it is unknown', () => {
    render(<Gallery items={[{ src: '/clip.jpg', alt: 'Ролик', video: '/clip.mp4' }]} />);
    const tile = screen.getByRole('button', { name: 'Смотреть видео: Ролик' });
    expect(tile.querySelector('[data-slot=gallery-duration]')).toBeNull();
  });
});

describe('Gallery · selection', () => {
  it('has no checkboxes and no bar unless selectable', () => {
    render(<Gallery items={items} />);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryByRole('group', { name: 'Действия с выбранными' })).toBeNull();
  });

  it('toggles a tile by its circle, counts the choice and clears it from the bar', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    expect(box('Офис студии').getAttribute('aria-checked')).toBe('false');
    expect(screen.queryByRole('group', { name: 'Действия с выбранными' })).toBeNull();

    await user.click(box('Офис студии'));
    await user.click(box('Рабочее место'));
    expect(onChange).toHaveBeenLastCalledWith([0, 3]);
    expect(box('Офис студии').getAttribute('aria-checked')).toBe('true');
    expect(document.querySelector('[data-index="0"]')?.getAttribute('data-selected')).toBe('');

    const bar = screen.getByRole('group', { name: 'Действия с выбранными' });
    expect(bar.textContent).toContain('Выбрано 2');
    expect(screen.getByRole('button', { name: 'Скачать 2' })).toBeDefined();

    await user.click(box('Офис студии'));
    expect(onChange).toHaveBeenLastCalledWith([3]);

    await user.click(screen.getByRole('button', { name: 'Снять выделение' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole('group', { name: 'Действия с выбранными' })).toBeNull();
  });

  it('selects a range with Shift and everything with Ctrl+A, Esc clears', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    await user.click(box('Команда на встрече'));
    await user.keyboard('{Shift>}');
    await user.click(box('Кухня'));
    await user.keyboard('{/Shift}');
    expect(onChange).toHaveBeenLastCalledWith([1, 2, 3, 4]);

    await user.keyboard('{Control>}a{/Control}');
    expect(onChange).toHaveBeenLastCalledWith([0, 1, 2, 3, 4]);
    expect(screen.getByRole('group', { name: 'Действия с выбранными' }).textContent).toContain('Выбрано 5');

    await user.keyboard('{Meta>}a{/Meta}');
    expect(onChange).toHaveBeenLastCalledWith([0, 1, 2, 3, 4]);

    await user.keyboard('{Escape}');
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('toggles the circle with Space and moves between tiles with arrows, Home and End', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    box('Команда на встрече').focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith([1]);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Смотреть видео: Отзыв клиента, 0:38' }));
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Открыть: Команда на встрече' }));
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Открыть: Кухня' }));
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Открыть: Офис студии' }));
  });

  it('in selection mode a click on a tile toggles it, Enter still opens it', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onChange = vi.fn();
    render(<Gallery items={items} selectable defaultSelected={[0]} onSelectedChange={onChange} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: 'Открыть: Рабочее место' }));
    expect(onChange).toHaveBeenLastCalledWith([0, 3]);
    expect(onOpen).not.toHaveBeenCalled();

    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('button', { name: 'Открыть: Команда на встрече' }));
    await user.keyboard('{/Shift}');
    expect(onChange).toHaveBeenLastCalledWith([0, 1, 2, 3]);

    screen.getByRole('button', { name: 'Открыть: Кухня' }).focus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenLastCalledWith(4);
  });

  it('a long press starts the selection and swallows the click that follows', () => {
    vi.useFakeTimers();
    const onOpen = vi.fn();
    const onChange = vi.fn();
    render(<Gallery items={items} selectable onSelectedChange={onChange} onOpen={onOpen} />);
    const tile = screen.getByRole('button', { name: 'Открыть: Кухня' });

    fireEvent.pointerDown(tile, { pointerType: 'touch', clientX: 10, clientY: 10 });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerUp(tile, { pointerType: 'touch' });
    fireEvent.click(tile, { detail: 1 });
    expect(onChange).toHaveBeenLastCalledWith([4]);
    expect(onOpen).not.toHaveBeenCalled();

    // a short tap outside the selection mode opens
    fireEvent.click(box('Кухня'), { detail: 1 });
    expect(onChange).toHaveBeenLastCalledWith([]);
    fireEvent.pointerDown(tile, { pointerType: 'touch', clientX: 10, clientY: 10 });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.pointerUp(tile, { pointerType: 'touch' });
    fireEvent.click(tile, { detail: 1 });
    expect(onOpen).toHaveBeenLastCalledWith(4);
  });

  it('a press that moves is a scroll, not a long press', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<Gallery items={items} selectable onSelectedChange={onChange} />);
    const tile = screen.getByRole('button', { name: 'Открыть: Кухня' });

    fireEvent.pointerDown(tile, { pointerType: 'touch', clientX: 10, clientY: 10 });
    fireEvent.pointerMove(tile, { pointerType: 'touch', clientX: 10, clientY: 40 });
    act(() => vi.advanceTimersByTime(600));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps its own choice when uncontrolled', async () => {
    const user = userEvent.setup();
    render(<Gallery items={items} selectable defaultSelected={[2]} />);
    expect(box('Отзыв клиента').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('group', { name: 'Действия с выбранными' }).textContent).toContain('Выбрано 1');
    await user.click(box('Кухня'));
    expect(screen.getByRole('group', { name: 'Действия с выбранными' }).textContent).toContain('Выбрано 2');
  });
});
