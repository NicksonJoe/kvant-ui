import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
});
