import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TransferList, type TransferItem } from '..';

const people: TransferItem[] = [
  { id: 'kim', label: 'Мария Ким', description: 'Бухгалтерия' },
  { id: 'belova', label: 'Тамара Белова', description: 'Логистика' },
  { id: 'lebedev', label: 'Олег Лебедев', description: 'Продажи · опт' },
  { id: 'volkova', label: 'Ирина Волкова', description: 'Приглашение не принято', disabled: true },
  { id: 'smirnov', label: 'Алексей Смирнов', description: 'Владелец воронки', locked: true },
  { id: 'petrov', label: 'Игорь Петров', description: 'Закупки' },
];

const source = () => screen.getByRole('listbox', { name: 'Сотрудники' });
const target = () => screen.getByRole('listbox', { name: 'Имеют доступ' });
const names = (list: HTMLElement) => within(list).queryAllByRole('option').map((option) => option.getAttribute('aria-label'));
const option = (name: string) => screen.getByRole('option', { name });
const header = (title: string) => screen.getByText(title).closest('[data-slot=transfer-list-header]')?.textContent;

function Access(props: Partial<Parameters<typeof TransferList>[0]>) {
  return <TransferList items={people} titles={['Сотрудники', 'Имеют доступ']} defaultValue={['smirnov', 'petrov']} {...props} />;
}

describe('TransferList', () => {
  it('splits the items: the value on the right, the rest on the left, each sorted by name, locked first', () => {
    render(<Access />);
    expect(names(source())).toEqual(['Ирина Волкова', 'Мария Ким', 'Олег Лебедев', 'Тамара Белова']);
    expect(names(target())).toEqual(['Алексей Смирнов', 'Игорь Петров']);
    expect(source().getAttribute('aria-multiselectable')).toBe('true');
    expect(header('Сотрудники')).toContain('4');
    expect(option('Алексей Смирнов').getAttribute('aria-disabled')).toBe('true');
    expect(option('Алексей Смирнов').querySelector('[data-slot=transfer-list-lock]')).not.toBeNull();
  });

  it('a row press marks it; the main button carries the count and moves the marked rows', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Access onValueChange={onValueChange} />);
    const forward = screen.getByRole('button', { name: 'Перенести отмеченные вправо' });
    expect(forward.hasAttribute('disabled')).toBe(true);
    await user.click(option('Мария Ким'));
    await user.click(option('Олег Лебедев'));
    expect(option('Мария Ким').getAttribute('aria-selected')).toBe('true');
    expect(header('Сотрудники')).toContain('2 из 4 отмечено');
    expect(forward.textContent).toBe('2');
    await user.click(forward);
    expect(onValueChange).toHaveBeenLastCalledWith(['smirnov', 'petrov', 'kim', 'lebedev']);
    expect(names(target())).toEqual(['Алексей Смирнов', 'Игорь Петров', 'Мария Ким', 'Олег Лебедев']);
    expect(option('Мария Ким').hasAttribute('data-moved')).toBe(true);
    expect(option('Мария Ким').getAttribute('aria-selected')).toBe('false');
    expect(option('Мария Ким').textContent).toContain('Только что добавлено');
  });

  it('a disabled row is not marked; a double press moves one row', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Access onValueChange={onValueChange} />);
    await user.click(option('Ирина Волкова'));
    expect(option('Ирина Волкова').getAttribute('aria-selected')).toBe('false');
    expect(option('Ирина Волкова').getAttribute('aria-disabled')).toBe('true');
    await user.dblClick(option('Игорь Петров'));
    expect(onValueChange).toHaveBeenLastCalledWith(['smirnov']);
  });

  it('«отметить все» marks the movable rows, a second press clears them; partial is mixed', async () => {
    const user = userEvent.setup();
    render(<Access />);
    const all = screen.getByRole('checkbox', { name: 'Отметить все: Сотрудники' });
    await user.click(option('Мария Ким'));
    expect(all.getAttribute('aria-checked')).toBe('mixed');
    await user.click(all);
    expect(names(source()).filter((name) => option(name ?? '').getAttribute('aria-selected') === 'true')).toEqual(['Мария Ким', 'Олег Лебедев', 'Тамара Белова']);
    expect(all.getAttribute('aria-checked')).toBe('true');
    await user.click(all);
    expect(header('Сотрудники')).not.toContain('отмечено');
  });

  it('«всё» moves every movable row and keeps the locked one', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Access onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Вернуть все влево' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['smirnov']);
    await user.click(screen.getByRole('button', { name: 'Перенести все вправо' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['smirnov', 'petrov', 'kim', 'lebedev', 'belova']);
  });

  it('keys: ↑↓ walk the rows, Space marks, ⌘A marks all, Enter moves; Shift+press marks a run', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Access onValueChange={onValueChange} />);
    option('Мария Ким').focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(option('Олег Лебедев'));
    await user.keyboard(' ');
    expect(option('Олег Лебедев').getAttribute('aria-selected')).toBe('true');
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['smirnov', 'petrov', 'lebedev']);

    option('Мария Ким').focus();
    await user.keyboard('{Meta>}a{/Meta}');
    expect(option('Тамара Белова').getAttribute('aria-selected')).toBe('true');
    await user.keyboard('{Meta>}a{/Meta}');
    expect(option('Тамара Белова').getAttribute('aria-selected')).toBe('false');

    await user.click(option('Мария Ким'));
    await user.keyboard('{Shift>}');
    await user.click(option('Тамара Белова'));
    await user.keyboard('{/Shift}');
    expect(header('Сотрудники')).toContain('2 из 3 отмечено');
  });

  it('search filters its own list and says when nothing matched', async () => {
    const user = userEvent.setup();
    render(<Access />);
    const [left] = screen.getAllByRole('searchbox');
    if (!left) throw new Error('no search');
    await user.type(left, 'бух');
    expect(names(source())).toEqual(['Мария Ким']);
    expect(header('Сотрудники')).toContain('1 из 4');
    await user.clear(left);
    await user.type(left, 'инн');
    expect(names(source())).toEqual([]);
    expect(within(source()).getByText('Ничего не нашлось')).toBeTruthy();
    expect(header('Сотрудники')).toContain('0 из 4');
  });

  it('an empty right list explains what to do', () => {
    render(<Access defaultValue={[]} empty={{ title: 'Пока ничего не выбрано', description: 'Отметьте поля слева и перенесите сюда' }} />);
    expect(within(target()).getByText('Пока ничего не выбрано')).toBeTruthy();
  });

  it('loading: skeleton rows under aria-busy, buttons off; an error offers «Повторить»', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<Access loading />);
    expect(source().getAttribute('aria-busy')).toBe('true');
    expect(names(source())).toEqual([]);
    expect(screen.getByRole('button', { name: 'Перенести все вправо' }).hasAttribute('disabled')).toBe(true);
    rerender(<Access error={{ title: 'Не удалось загрузить сотрудников', description: 'Нет соединения с сервером' }} onRetry={onRetry} />);
    expect(screen.getByText('Не удалось загрузить сотрудников')).toBeTruthy();
    expect(header('Сотрудники')).toContain('—');
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('disabled: rows stay readable, nothing reacts', () => {
    const onValueChange = vi.fn();
    render(<Access disabled onValueChange={onValueChange} />);
    fireEvent.click(option('Мария Ким'));
    expect(option('Мария Ким').getAttribute('aria-selected')).toBe('false');
    expect(source().getAttribute('aria-disabled')).toBe('true');
    for (const button of screen.getAllByRole('button')) expect(button.hasAttribute('disabled')).toBe(true);
  });
});
