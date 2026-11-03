import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { moveSortableItems, SortableList, sortableStep, type SortableLayout, type SortableIndicator } from '..';

interface Task {
  id: string;
  title: string;
  pinned?: boolean;
}

const tasks: Task[] = [
  { id: 'estimate', title: 'Согласовать смету' },
  { id: 'call', title: 'Позвонить «Чайной лавке»' },
  { id: 'contract', title: 'Отправить договор' },
  { id: 'deck', title: 'Подготовить презентацию' },
];
const pinned = (task: Task) => task.pinned === true;
const ids = (list: readonly Task[]) => list.map((task) => task.id);

describe('moveSortableItems', () => {
  it('puts one item at the slot where it should land', () => {
    expect(ids(moveSortableItems(tasks, ['estimate'], 2))).toEqual(['call', 'contract', 'estimate', 'deck']);
    expect(ids(moveSortableItems(tasks, ['deck'], 0))).toEqual(['deck', 'estimate', 'call', 'contract']);
    expect(ids(moveSortableItems(tasks, ['call'], 1))).toEqual(ids(tasks));
  });

  it('moves several items as one block in their list order, gathering a gapped selection', () => {
    expect(ids(moveSortableItems(tasks, ['deck', 'estimate'], 1))).toEqual(['call', 'estimate', 'deck', 'contract']);
    expect(ids(moveSortableItems(tasks, ['estimate', 'call'], 2))).toEqual(['contract', 'deck', 'estimate', 'call']);
  });

  it('keeps pinned items where they are and refuses a slot taken by one', () => {
    const list: Task[] = [{ id: 'pin', title: 'Закрыть сделку', pinned: true }, ...tasks];
    expect(ids(moveSortableItems(list, ['call'], 0, pinned))).toEqual(ids(list));
    expect(ids(moveSortableItems(list, ['deck'], 1, pinned))).toEqual(['pin', 'deck', 'estimate', 'call', 'contract']);
    expect(ids(moveSortableItems(list, ['pin'], 3, pinned))).toEqual(ids(list));
  });
});

describe('sortableStep', () => {
  it('gives the next slot up or down and null at the edges', () => {
    expect(sortableStep(tasks, ['call'], 1)).toBe(2);
    expect(sortableStep(tasks, ['call'], -1)).toBe(0);
    expect(sortableStep(tasks, ['estimate'], -1)).toBeNull();
    expect(sortableStep(tasks, ['deck'], 1)).toBeNull();
  });

  it('jumps over pinned items and moves a block by whole positions', () => {
    const list: Task[] = [tasks[0], { id: 'pin', title: 'Закрыть сделку', pinned: true }, ...tasks.slice(1)] as Task[];
    expect(sortableStep(list, ['estimate'], 1, pinned)).toBe(2);
    expect(ids(moveSortableItems(list, ['estimate'], 2, pinned))).toEqual(['call', 'pin', 'estimate', 'contract', 'deck']);
    expect(sortableStep(tasks, ['estimate', 'call'], 1)).toBe(1);
    expect(sortableStep(tasks, ['contract', 'deck'], 1)).toBeNull();
    expect(sortableStep(tasks, ['estimate'], 3)).toBe(3);
  });
});

// jsdom has no layout: rows stack 48 high from 8 (list) or sit three in a row, 232×112 with a 12 gap (grid).
const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
const getBoundingClientRect = Element.prototype.getBoundingClientRect;
beforeAll(() => {
  Element.prototype.getBoundingClientRect = function (this: Element) {
    if (!(this instanceof HTMLElement) || this.dataset.slot !== 'sortable-item') return rect(0, 0, 640, 400);
    const index = Array.from(this.parentElement?.querySelectorAll(':scope > [data-slot=sortable-item]') ?? []).indexOf(this);
    if (this.closest('[data-layout=grid]')) return rect(16 + (index % 3) * 244, 16 + Math.floor(index / 3) * 124, 232, 112);
    return rect(8, 8 + index * 48, 624, 48);
  };
});
afterAll(() => {
  Element.prototype.getBoundingClientRect = getBoundingClientRect;
});

interface BoardProps {
  layout?: SortableLayout;
  indicator?: SortableIndicator;
  list?: Task[];
  selectable?: boolean;
  disabled?: boolean;
  onChange?: (list: Task[]) => void;
}

function Board({ layout, indicator, list = tasks, selectable = false, disabled, onChange }: BoardProps) {
  const [items, setItems] = useState(list);
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <SortableList
      aria-label="Задачи"
      items={items}
      onItemsChange={(next) => {
        setItems(next);
        onChange?.(next);
      }}
      getLabel={(task) => task.title}
      renderItem={(task) => <span>{task.title}</span>}
      isPinned={pinned}
      layout={layout}
      indicator={indicator}
      disabled={disabled}
      selected={selectable ? selected : undefined}
      onSelectedChange={selectable ? setSelected : undefined}
    />
  );
}

const order = () => screen.getAllByRole('listitem').map((row) => row.textContent?.replace(/\d+ из \d+$/, ''));
const quote = (text: string) => `«${text.replace(/«/g, '„').replace(/»/g, '“')}»`;
const handle = (name: string) => screen.getByRole('button', { name: `Переместить ${quote(name)}` });
const status = () => screen.getByRole('status').textContent;
const row = (name: string) => screen.getAllByRole('listitem').find((item) => item.textContent?.startsWith(name)) as HTMLElement;

describe('SortableList', () => {
  it('renders a named list with a handle per row and a disabled handle on pinned rows', () => {
    render(<Board list={[{ id: 'pin', title: 'Закрыть сделку', pinned: true }, ...tasks]} />);
    expect(screen.getByRole('list', { name: 'Задачи' })).toBeDefined();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(handle('Согласовать смету').hasAttribute('disabled')).toBe(false);
    expect(handle('Закрыть сделку').hasAttribute('disabled')).toBe(true);
    expect(row('Закрыть сделку').hasAttribute('data-pinned')).toBe(true);
  });

  it('disables every handle when the list is disabled', () => {
    render(<Board disabled />);
    for (const button of screen.getAllByRole('button')) expect(button.hasAttribute('disabled')).toBe(true);
  });

  describe('from the keyboard', () => {
    it('lifts on Space, moves with arrows, shows the position and drops on Space', () => {
      const onChange = vi.fn();
      render(<Board onChange={onChange} />);
      const call = handle('Позвонить «Чайной лавке»');
      call.focus();

      fireEvent.keyDown(call, { key: ' ' });
      expect(row('Позвонить').hasAttribute('data-grabbed')).toBe(true);
      expect(within(row('Позвонить')).getByText('2 из 4')).toBeDefined();
      expect(screen.getByText('двигать')).toBeDefined();
      expect(status()).toBe('«Позвонить „Чайной лавке“» поднята, позиция 2 из 4. Стрелки — двигать, Space — положить, Esc — отменить');

      fireEvent.keyDown(call, { key: 'ArrowDown' });
      expect(order()).toEqual(['Согласовать смету', 'Отправить договор', 'Позвонить «Чайной лавке»', 'Подготовить презентацию']);
      expect(within(row('Позвонить')).getByText('3 из 4')).toBeDefined();
      expect(status()).toBe('«Позвонить „Чайной лавке“» — позиция 3 из 4');
      expect(document.activeElement).toBe(handle('Позвонить «Чайной лавке»'));
      expect(onChange).not.toHaveBeenCalled();

      fireEvent.keyDown(handle('Позвонить «Чайной лавке»'), { key: ' ' });
      expect(ids(onChange.mock.lastCall?.[0] ?? [])).toEqual(['estimate', 'contract', 'call', 'deck']);
      expect(row('Позвонить').hasAttribute('data-grabbed')).toBe(false);
      expect(screen.queryByText('двигать')).toBeNull();
      expect(status()).toBe('«Позвонить „Чайной лавке“» перемещена на позицию 3 из 4');
    });

    it('puts the row back on Escape without a change', () => {
      const onChange = vi.fn();
      render(<Board onChange={onChange} />);
      const estimate = handle('Согласовать смету');
      fireEvent.keyDown(estimate, { key: 'Enter' });
      fireEvent.keyDown(estimate, { key: 'ArrowDown' });
      fireEvent.keyDown(handle('Согласовать смету'), { key: 'ArrowDown' });
      fireEvent.keyDown(handle('Согласовать смету'), { key: 'Escape' });
      expect(order()).toEqual(tasks.map((task) => task.title));
      expect(onChange).not.toHaveBeenCalled();
      expect(status()).toBe('Перемещение отменено, «Согласовать смету» на позиции 1 из 4');
    });

    it('stops at the edges and steps over pinned rows', () => {
      render(<Board list={[tasks[0], { id: 'pin', title: 'Закрыть сделку', pinned: true }, ...tasks.slice(1)] as Task[]} />);
      const estimate = handle('Согласовать смету');
      fireEvent.keyDown(estimate, { key: ' ' });
      fireEvent.keyDown(estimate, { key: 'ArrowUp' });
      expect(order()[0]).toBe('Согласовать смету');
      fireEvent.keyDown(handle('Согласовать смету'), { key: 'ArrowDown' });
      expect(order()).toEqual(['Позвонить «Чайной лавке»', 'Закрыть сделку', 'Согласовать смету', 'Отправить договор', 'Подготовить презентацию']);
    });

    it('moves by one with ←/→ and by a row with ↑/↓ in a grid', () => {
      const six = [...tasks, { id: 'invoice', title: 'Выставить счёт' }, { id: 'review', title: 'Ревью макетов' }];
      render(<Board layout="grid" list={six} />);
      const estimate = handle('Согласовать смету');
      fireEvent.keyDown(estimate, { key: ' ' });
      fireEvent.keyDown(estimate, { key: 'ArrowRight' });
      expect(order()[1]).toBe('Согласовать смету');
      fireEvent.keyDown(handle('Согласовать смету'), { key: 'ArrowDown' });
      expect(order()[4]).toBe('Согласовать смету');
      fireEvent.keyDown(handle('Согласовать смету'), { key: 'ArrowDown' });
      expect(order()[4]).toBe('Согласовать смету');
    });
  });

  describe('with a mouse', () => {
    const press = (target: HTMLElement, x: number, y: number) => fireEvent.pointerDown(target, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: x, clientY: y });
    const move = (x: number, y: number) => fireEvent.pointerMove(window, { pointerId: 1, pointerType: 'mouse', clientX: x, clientY: y });
    const release = (x: number, y: number) => fireEvent.pointerUp(window, { pointerId: 1, pointerType: 'mouse', clientX: x, clientY: y });

    it('lifts after 4 px, leaves a slot that travels with the pointer and drops into it', () => {
      const onChange = vi.fn();
      render(<Board onChange={onChange} />);
      press(handle('Согласовать смету'), 20, 30);
      move(22, 32);
      expect(document.querySelector('[data-slot=sortable-overlay]')).toBeNull();

      move(20, 140);
      const overlay = document.querySelector('[data-slot=sortable-overlay]');
      expect(overlay?.textContent).toContain('Согласовать смету');
      expect(row('Согласовать смету').hasAttribute('data-placeholder')).toBe(true);
      expect(order()).toEqual(['Позвонить «Чайной лавке»', 'Отправить договор', 'Согласовать смету', 'Подготовить презентацию']);

      release(20, 140);
      expect(ids(onChange.mock.lastCall?.[0] ?? [])).toEqual(['call', 'contract', 'estimate', 'deck']);
      expect(document.querySelector('[data-slot=sortable-overlay]')).toBeNull();
      expect(status()).toBe('«Согласовать смету» перемещена на позицию 3 из 4');
    });

    it('does not lift on a click shorter than the threshold', () => {
      const onChange = vi.fn();
      render(<Board onChange={onChange} />);
      press(handle('Отправить договор'), 20, 130);
      move(21, 131);
      release(21, 131);
      expect(onChange).not.toHaveBeenCalled();
      expect(row('Отправить договор').hasAttribute('data-placeholder')).toBe(false);
    });

    it('cancels on Escape and puts the row back', () => {
      const onChange = vi.fn();
      render(<Board onChange={onChange} />);
      press(handle('Согласовать смету'), 20, 30);
      move(20, 180);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(order()).toEqual(tasks.map((task) => task.title));
      expect(document.querySelector('[data-slot=sortable-overlay]')).toBeNull();
      release(20, 180);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('draws an insertion line in line mode, refuses pinned rows and returns the row home', () => {
      const onChange = vi.fn();
      const list: Task[] = [{ id: 'pin', title: 'Закрыть сделку', pinned: true }, ...tasks];
      render(<Board indicator="line" list={list} onChange={onChange} />);
      press(handle('Позвонить «Чайной лавке»'), 20, 130);
      move(20, 160);
      expect(row('Позвонить').hasAttribute('data-dragging')).toBe(true);
      expect(row('Позвонить').hasAttribute('data-placeholder')).toBe(false);
      expect(document.querySelector('[data-slot=sortable-line]')).not.toBeNull();
      expect(document.querySelector('[data-slot=sortable-ghost]')?.textContent).toBe('Позвонить «Чайной лавке»');
      expect(order()).toEqual(list.map((task) => task.title));

      move(20, 30);
      expect(row('Закрыть сделку').hasAttribute('data-blocked')).toBe(true);
      expect(within(row('Закрыть сделку')).getByText('Закреплённые не двигаются')).toBeDefined();
      expect(document.querySelector('[data-slot=sortable-line]')).toBeNull();
      release(20, 30);
      expect(onChange).not.toHaveBeenCalled();
      expect(row('Закрыть сделку').hasAttribute('data-blocked')).toBe(false);

      press(handle('Подготовить презентацию'), 20, 226);
      move(20, 70);
      release(20, 70);
      expect(ids(onChange.mock.lastCall?.[0] ?? [])).toEqual(['pin', 'deck', 'estimate', 'call', 'contract']);
    });

    it('shows «Отпустите здесь» in the slot of a grid and drops a card into the next row', () => {
      const onChange = vi.fn();
      const six = [...tasks, { id: 'invoice', title: 'Выставить счёт' }, { id: 'review', title: 'Ревью макетов' }];
      render(<Board layout="grid" list={six} onChange={onChange} />);
      press(handle('Согласовать смету'), 230, 30);
      move(474, 154);
      expect(within(row('Согласовать смету')).getByText('Отпустите здесь')).toBeDefined();
      release(474, 154);
      expect(ids(onChange.mock.lastCall?.[0] ?? [])).toEqual(['call', 'contract', 'deck', 'invoice', 'estimate', 'review']);
    });
  });

  describe('with several rows selected', () => {
    it('toggles rows by the checkbox and by a click on the row', () => {
      render(<Board selectable />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать «Позвонить „Чайной лавке“»' }));
      expect(row('Позвонить').hasAttribute('data-selected')).toBe(true);
      fireEvent.click(row('Отправить договор'));
      expect(row('Отправить договор').hasAttribute('data-selected')).toBe(true);
      fireEvent.click(row('Отправить договор'));
      expect(row('Отправить договор').hasAttribute('data-selected')).toBe(false);
    });

    it('moves every selected row with the one that is dragged, keeping their order', () => {
      const onChange = vi.fn();
      render(<Board selectable onChange={onChange} />);
      fireEvent.click(row('Согласовать смету'));
      fireEvent.click(row('Отправить договор'));
      fireEvent.pointerDown(handle('Отправить договор'), { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 20, clientY: 130 });
      fireEvent.pointerMove(window, { pointerId: 1, pointerType: 'mouse', clientX: 20, clientY: 230 });
      expect(document.querySelector('[data-slot=sortable-overlay]')?.textContent).toContain('2');
      fireEvent.pointerUp(window, { pointerId: 1, pointerType: 'mouse', clientX: 20, clientY: 230 });
      expect(ids(onChange.mock.lastCall?.[0] ?? [])).toEqual(['call', 'deck', 'estimate', 'contract']);
    });

    it('moves the selected block from the keyboard too', () => {
      const onChange = vi.fn();
      render(<Board selectable onChange={onChange} />);
      fireEvent.click(row('Согласовать смету'));
      fireEvent.click(row('Позвонить'));
      fireEvent.keyDown(handle('Позвонить «Чайной лавке»'), { key: ' ' });
      fireEvent.keyDown(handle('Позвонить «Чайной лавке»'), { key: 'ArrowDown' });
      fireEvent.keyDown(handle('Позвонить «Чайной лавке»'), { key: ' ' });
      expect(ids(onChange.mock.lastCall?.[0] ?? [])).toEqual(['contract', 'estimate', 'call', 'deck']);
    });
  });

  describe('on a touch screen', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('lifts after a 250 ms press and drops where the finger lets go', () => {
      vi.useFakeTimers();
      const onChange = vi.fn();
      render(<Board onChange={onChange} />);
      const target = handle('Согласовать смету');
      fireEvent.touchStart(target, { touches: [{ clientX: 20, clientY: 30 }] });
      act(() => vi.advanceTimersByTime(200));
      expect(row('Согласовать смету').hasAttribute('data-placeholder')).toBe(false);
      act(() => vi.advanceTimersByTime(60));
      fireEvent.touchMove(target, { touches: [{ clientX: 20, clientY: 180 }] });
      expect(row('Согласовать смету').hasAttribute('data-placeholder')).toBe(true);
      fireEvent.touchEnd(target, { changedTouches: [{ clientX: 20, clientY: 180 }] });
      expect(ids(onChange.mock.lastCall?.[0] ?? [])).toEqual(['call', 'contract', 'deck', 'estimate']);
    });

    it('treats a quick swipe as scrolling', () => {
      vi.useFakeTimers();
      const onChange = vi.fn();
      render(<Board onChange={onChange} />);
      const target = handle('Согласовать смету');
      fireEvent.touchStart(target, { touches: [{ clientX: 20, clientY: 30 }] });
      fireEvent.touchMove(target, { touches: [{ clientX: 20, clientY: 60 }] });
      act(() => vi.advanceTimersByTime(300));
      fireEvent.touchEnd(target, { changedTouches: [{ clientX: 20, clientY: 60 }] });
      expect(onChange).not.toHaveBeenCalled();
      expect(row('Согласовать смету').hasAttribute('data-placeholder')).toBe(false);
    });
  });
});
