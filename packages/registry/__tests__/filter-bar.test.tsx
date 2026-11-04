import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterBar, type FilterField } from '..';

const fields: FilterField[] = [
  {
    id: 'stage',
    label: 'Этап',
    options: [
      { value: 'qualification', label: 'Квалификация', count: 64 },
      { value: 'negotiation', label: 'Переговоры', count: 48 },
      { value: 'contract', label: 'Договор', count: 31 },
    ],
  },
  {
    id: 'owner',
    label: 'Ответственный',
    options: [
      { value: 'anna', label: 'Анна' },
      { value: 'oleg', label: 'Олег' },
      { value: 'vera', label: 'Вера' },
    ],
  },
];

describe('FilterBar', () => {
  it('reads each applied filter as «field: values» and folds the tail into +N', () => {
    render(<FilterBar fields={fields} value={{ stage: ['negotiation'], owner: ['anna', 'oleg', 'vera'] }} onValueChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Фильтр Этап: Переговоры, изменить' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Фильтр Ответственный: Анна, Олег +1, изменить' })).toBeDefined();
  });

  it('removes a filter with its × and resets all with «Сбросить»', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FilterBar fields={fields} value={{ stage: ['negotiation'], owner: ['anna'] }} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: 'Снять фильтр Этап' }));
    expect(onValueChange).toHaveBeenLastCalledWith({ owner: ['anna'] });

    await user.click(screen.getByRole('button', { name: 'Сбросить' }));
    expect(onValueChange).toHaveBeenLastCalledWith({});
  });

  it('hides «Сбросить» while nothing is filtered', () => {
    render(<FilterBar fields={fields} value={{}} onValueChange={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Сбросить' })).toBeNull();
  });

  it('toggles values of an applied filter from its chip', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FilterBar fields={fields} value={{ stage: ['negotiation'] }} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: 'Фильтр Этап: Переговоры, изменить' }));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: /Договор/ }));
    expect(onValueChange).toHaveBeenLastCalledWith({ stage: ['negotiation', 'contract'] });
  });

  it('adds a new filter from «+ Фильтр» through the field submenu', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FilterBar fields={fields} value={{ stage: ['negotiation'] }} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: 'Фильтр' }));
    // a field that is already applied lives in its chip, not in the add menu
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Этап' })).toBeNull());
    const owner = await screen.findByRole('menuitem', { name: 'Ответственный' });
    owner.focus();
    await user.keyboard('{ArrowRight}');
    // jsdom keeps the opening submenu at pointer-events: none, so the item is clicked directly
    fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Вера' }));
    expect(onValueChange).toHaveBeenLastCalledWith({ stage: ['negotiation'], owner: ['vera'] });
  });

  it('on a narrow screen opens every filter in a bottom sheet', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<FilterBar fields={fields} value={{ stage: ['negotiation'] }} onValueChange={onValueChange} showLabel="Показать 48 сделок" />);

    await user.click(screen.getByRole('button', { name: 'Фильтры, применено: 1' }));
    const sheet = await screen.findByRole('dialog', { name: 'Фильтры' });
    expect(sheet).toBeDefined();

    await user.click(screen.getByRole('checkbox', { name: /Олег/ }));
    expect(onValueChange).toHaveBeenLastCalledWith({ stage: ['negotiation'], owner: ['oleg'] });

    await user.click(screen.getByRole('button', { name: 'Показать 48 сделок' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  describe('folding chips that do not fit into «Ещё»', () => {
    const wide: FilterField[] = [
      ...fields,
      {
        id: 'source',
        label: 'Источник',
        options: [
          { value: 'site', label: 'Сайт' },
          { value: 'telegram', label: 'Telegram' },
        ],
      },
    ];
    const all = { stage: ['negotiation'], owner: ['anna'], source: ['site'] };

    // jsdom has no layout: the row width is set by the test, the hidden measuring row reports fixed widths
    let rowWidth = 0;
    let rowFor: (() => number) | null = null;
    const observers = new Set<() => void>();
    const widthOf = (element: HTMLElement): number => {
      if (element.dataset.slot === 'filter-bar-row') return rowFor ? rowFor() : rowWidth;
      if (element.dataset.slot === 'filter-bar-search') return element.childElementCount > 0 ? 240 : 0;
      if (element.dataset.slot === 'filter-bar-tail') return element.childElementCount > 0 ? 100 : 0;
      return { chip: 150, more: 80, add: 90 }[element.dataset.measure ?? ''] ?? 0;
    };
    const resize = () => act(() => observers.forEach((notify) => notify()));

    beforeEach(() => {
      rowWidth = 0;
      rowFor = null;
      vi.stubGlobal(
        'ResizeObserver',
        class implements ResizeObserver {
          private readonly notify: () => void;
          constructor(callback: ResizeObserverCallback) {
            this.notify = () => callback([], this);
          }
          observe(): void {
            observers.add(this.notify);
          }
          unobserve(): void {}
          disconnect(): void {
            observers.delete(this.notify);
          }
        },
      );
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const width = widthOf(this);
        return { x: 0, y: 0, top: 0, left: 0, right: width, bottom: 32, width, height: 32, toJSON: () => ({}) };
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      observers.clear();
    });

    const chips = () => screen.queryAllByRole('button', { name: /^Фильтр .+, изменить$/ }).map((chip) => chip.getAttribute('aria-label'));

    it('shows every chip while they fit and no «Ещё»', () => {
      render(<FilterBar fields={wide} value={all} onValueChange={() => {}} search={<input aria-label="Поиск" />} count="48 из 312" />);
      rowWidth = 1000;
      resize();
      expect(chips()).toHaveLength(3);
      expect(screen.queryByRole('button', { name: /^Ещё фильтры/ })).toBeNull();
    });

    it('moves the tail chips into «Ещё N» and brings them back when the row widens', () => {
      render(<FilterBar fields={wide} value={all} onValueChange={() => {}} search={<input aria-label="Поиск" />} count="48 из 312" />);
      // 240 search + 150 chip + 80 «Ещё» + 100 count and reset = 570
      rowWidth = 600;
      resize();
      expect(chips()).toEqual(['Фильтр Этап: Переговоры, изменить']);
      const more = screen.getByRole('button', { name: 'Ещё фильтры, применено: 2' });
      expect(more.textContent).toBe('Ещё2');

      rowWidth = 1000;
      resize();
      expect(chips()).toHaveLength(3);
      expect(screen.queryByRole('button', { name: /^Ещё фильтры/ })).toBeNull();
    });

    it('leaves room for «+ Фильтр» while some fields are still free', () => {
      render(<FilterBar fields={wide} value={{ stage: ['negotiation'], owner: ['anna'] }} onValueChange={() => {}} />);
      // 90 «+ Фильтр» + 150 chip + 80 «Ещё» + 100 reset = 420 fits, both chips with «+ Фильтр» and reset = 490 do not
      rowWidth = 450;
      resize();
      expect(chips()).toHaveLength(1);
      expect(screen.getByRole('button', { name: 'Ещё фильтры, применено: 1' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Фильтр' })).toBeDefined();
    });

    it('folds every chip when even one does not fit', () => {
      render(<FilterBar fields={wide} value={all} onValueChange={() => {}} search={<input aria-label="Поиск" />} />);
      rowWidth = 400;
      resize();
      expect(chips()).toHaveLength(0);
      expect(screen.getByRole('button', { name: 'Ещё фильтры, применено: 3' })).toBeDefined();
    });

    it('edits and removes a folded filter from the «Ещё» menu', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<FilterBar fields={wide} value={all} onValueChange={onValueChange} search={<input aria-label="Поиск" />} count="48 из 312" />);
      rowWidth = 600;
      resize();

      await user.click(screen.getByRole('button', { name: 'Ещё фильтры, применено: 2' }));
      expect(await screen.findByRole('menuitem', { name: 'Ответственный: Анна' })).toBeDefined();
      const source = screen.getByRole('menuitem', { name: 'Источник: Сайт' });
      source.focus();
      await user.keyboard('{ArrowRight}');
      fireEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Telegram' }));
      expect(onValueChange).toHaveBeenLastCalledWith({ stage: ['negotiation'], owner: ['anna'], source: ['site', 'telegram'] });

      fireEvent.click(screen.getByRole('menuitem', { name: 'Снять фильтр Источник' }));
      expect(onValueChange).toHaveBeenLastCalledWith({ stage: ['negotiation'], owner: ['anna'] });
    });

    it('measures a hidden copy, so a row that hugs its chips does not grow itself', () => {
      render(<FilterBar fields={wide} value={all} onValueChange={() => {}} />);
      // the row is as wide as what it shows: hiding a chip would shrink it, showing one would widen it
      rowFor = () => chips().length * 150 + (screen.queryByRole('button', { name: /^Ещё фильтры/ }) ? 80 : 0) + 100;
      resize();
      resize();
      resize();
      expect(chips()).toHaveLength(3);

      const copy = document.querySelector<HTMLElement>('[data-slot="filter-bar-measure"]');
      expect(copy?.getAttribute('aria-hidden')).toBe('true');
      expect(copy?.hasAttribute('inert')).toBe(true);
      expect(copy?.querySelectorAll('button')).toHaveLength(0);
    });
  });
});
