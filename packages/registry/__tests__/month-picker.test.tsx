import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MonthCalendar, MonthPicker, MonthRangePicker, parseMonth } from '..';

const today = new Date(2026, 10, 4);
const month = (name: RegExp | string) => screen.getByRole('button', { name });
const heading = () => screen.getByRole('heading').textContent;
const footer = () => document.querySelector('[data-slot=month-range-popup] p')?.textContent;

describe('parseMonth', () => {
  it('reads «10.2026», «10/26», «окт 26», «Октябрь 2026» and a bare month in the given year', () => {
    expect(parseMonth('10.2026', 'month', 2026)).toEqual(new Date(2026, 9, 1));
    expect(parseMonth('3/26', 'month', 2026)).toEqual(new Date(2026, 2, 1));
    expect(parseMonth('окт 26', 'month', 2026)).toEqual(new Date(2026, 9, 1));
    expect(parseMonth('Октябрь 2026', 'month', 2026)).toEqual(new Date(2026, 9, 1));
    expect(parseMonth('сент.', 'month', 2025)).toEqual(new Date(2025, 8, 1));
    expect(parseMonth('2024', 'year', 2026)).toEqual(new Date(2024, 0, 1));
  });

  it('rejects what is not a month', () => {
    expect(parseMonth('13.2026', 'month', 2026)).toBeNull();
    expect(parseMonth('абв', 'month', 2026)).toBeNull();
    expect(parseMonth('', 'month', 2026)).toBeNull();
    expect(parseMonth('20', 'year', 2026)).toBeNull();
  });
});

describe('MonthCalendar', () => {
  it('shows twelve months in full words, the selected one pressed and the current one marked', () => {
    render(<MonthCalendar today={today} defaultValue={new Date(2026, 9, 1)} />);
    const grid = screen.getByRole('grid', { name: '2026' });
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(12);
    expect(month('Октябрь 2026').closest('[role=gridcell]')?.getAttribute('aria-selected')).toBe('true');
    expect(month('Ноябрь 2026').getAttribute('aria-current')).toBe('date');
    expect(month('Январь 2026').textContent).toBe('Январь');
  });

  it('picks a month and keeps months outside min / max out of reach', () => {
    const onValueChange = vi.fn();
    render(<MonthCalendar today={today} max={today} onValueChange={onValueChange} />);
    fireEvent.click(month('Декабрь 2026'));
    expect(month('Декабрь 2026').getAttribute('aria-disabled')).toBe('true');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Следующий год' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(month('Март 2026'));
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 2, 1));
  });

  it('pages years with the arrows in the header', () => {
    render(<MonthCalendar today={today} />);
    fireEvent.click(screen.getByRole('button', { name: 'Предыдущий год' }));
    expect(screen.getByRole('grid', { name: '2025' })).toBeTruthy();
  });

  it('moves focus: ←→ ±1, ↑↓ ±3, Home / End the row edges, PageUp / PageDown a year', async () => {
    const user = userEvent.setup();
    render(<MonthCalendar today={today} defaultValue={new Date(2026, 4, 1)} />);
    month('Май 2026').focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(month('Июнь 2026'));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(month('Сентябрь 2026'));
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(month('Июль 2026'));
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(month('Сентябрь 2026'));
    await user.keyboard('{ArrowUp}{ArrowLeft}');
    expect(document.activeElement).toBe(month('Май 2026'));
    await user.keyboard('{PageUp}');
    expect(document.activeElement).toBe(month('Май 2025'));
    await user.keyboard('{PageDown}{PageDown}');
    expect(document.activeElement).toBe(month('Май 2027'));
    expect(month('Май 2027').tabIndex).toBe(0);
  });

  it('the year in the header opens a decade of years; picking one returns to its months', () => {
    render(<MonthCalendar today={today} defaultValue={new Date(2024, 1, 1)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Выбрать год, сейчас 2024' }));
    expect(heading()).toBe('2020 – 2029');
    const years = within(screen.getByRole('grid', { name: '2020 – 2029' })).getAllByRole('button');
    expect(years.map((year) => year.textContent)).toEqual(['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030']);
    expect(years[0]?.hasAttribute('data-outside')).toBe(true);
    expect(years[11]?.hasAttribute('data-outside')).toBe(true);
    expect(screen.getByRole('button', { name: '2026' }).getAttribute('aria-current')).toBe('date');
    fireEvent.click(screen.getByRole('button', { name: '2022' }));
    expect(screen.getByRole('grid', { name: '2022' })).toBeTruthy();
  });

  it('a year outside the decade is picked and pages there', () => {
    const onValueChange = vi.fn();
    render(<MonthCalendar granularity="year" today={today} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: '2030' }));
    expect(onValueChange).toHaveBeenCalledWith(new Date(2030, 0, 1));
    expect(heading()).toBe('2030 – 2039');
    fireEvent.click(screen.getByRole('button', { name: 'Предыдущее десятилетие' }));
    expect(heading()).toBe('2020 – 2029');
  });
});

describe('MonthPicker', () => {
  it('shows the month in the field and the placeholder when empty', () => {
    const { rerender } = render(<MonthPicker aria-label="Отчётный месяц" today={today} />);
    const input = screen.getByRole('combobox', { name: 'Отчётный месяц' });
    expect(input.getAttribute('placeholder')).toBe('Месяц и год');
    rerender(<MonthPicker aria-label="Отчётный месяц" today={today} value={new Date(2026, 9, 1)} />);
    expect((input as HTMLInputElement).value).toBe('Октябрь 2026');
  });

  it('a press on the field opens the months; a pick closes them and fills the field', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MonthPicker aria-label="Отчётный месяц" today={today} onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'Отчётный месяц' });
    await user.click(input);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    await user.click(await screen.findByRole('button', { name: 'Август 2026' }));
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 7, 1));
    expect((input as HTMLInputElement).value).toBe('Август 2026');
    await waitFor(() => expect(input.getAttribute('aria-expanded')).toBe('false'));
  });

  it('accepts typing «10.2026» and «окт 26»; Enter tidies the text', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MonthPicker aria-label="Отчётный месяц" today={today} onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'Отчётный месяц' }) as HTMLInputElement;
    await user.type(input, '03.2025');
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2025, 2, 1));
    await user.keyboard('{Enter}');
    expect(input.value).toBe('Март 2025');
    await user.clear(input);
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    await user.type(input, 'окт 26');
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 9, 1));
  });

  it('puts back the last month when the typed text is not one', async () => {
    const user = userEvent.setup();
    render(<MonthPicker aria-label="Отчётный месяц" today={today} defaultValue={new Date(2026, 9, 1)} />);
    const input = screen.getByRole('combobox', { name: 'Отчётный месяц' }) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'когда-нибудь');
    await user.tab();
    expect(input.value).toBe('Октябрь 2026');
  });

  it('ignores a typed month outside min / max', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MonthPicker aria-label="Отчётный месяц" today={today} max={today} onValueChange={onValueChange} />);
    await user.type(screen.getByRole('combobox', { name: 'Отчётный месяц' }), '03.2027');
    expect(onValueChange).not.toHaveBeenCalledWith(new Date(2027, 2, 1));
  });

  it('clears with the cross', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MonthPicker aria-label="Отчётный месяц" today={today} defaultValue={new Date(2026, 9, 1)} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Очистить' }));
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect((screen.getByRole('combobox', { name: 'Отчётный месяц' }) as HTMLInputElement).value).toBe('');
  });

  it('↓ opens the months with focus on the selected one', async () => {
    const user = userEvent.setup();
    render(<MonthPicker aria-label="Отчётный месяц" today={today} defaultValue={new Date(2026, 9, 1)} />);
    screen.getByRole('combobox', { name: 'Отчётный месяц' }).focus();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Октябрь 2026' })));
  });

  it('year granularity: «Год», a grid of years, «2024» in the field', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MonthPicker granularity="year" aria-label="Год выпуска" today={today} onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'Год выпуска' }) as HTMLInputElement;
    expect(input.placeholder).toBe('Год');
    await user.click(input);
    await user.click(await screen.findByRole('button', { name: '2024' }));
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2024, 0, 1));
    expect(input.value).toBe('2024');
  });

  it('disabled and invalid reach the input', () => {
    render(
      <>
        <MonthPicker aria-label="Закрытый" disabled defaultValue={new Date(2026, 8, 1)} />
        <MonthPicker aria-label="С ошибкой" invalid />
      </>,
    );
    expect(screen.getByRole('combobox', { name: 'Закрытый' }).hasAttribute('disabled')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Очистить' })).toBeNull();
    expect(screen.getByRole('combobox', { name: 'С ошибкой' }).getAttribute('aria-invalid')).toBe('true');
  });
});

describe('MonthRangePicker', () => {
  it('shows the range in the trigger: «Июль — сентябрь 2026», across years with both years', () => {
    const { rerender } = render(
      <MonthRangePicker aria-label="Период" today={today} value={{ start: new Date(2026, 6, 1), end: new Date(2026, 8, 1) }} />,
    );
    expect(screen.getByRole('button', { name: 'Период' }).textContent).toBe('Июль — сентябрь 2026');
    rerender(<MonthRangePicker aria-label="Период" today={today} value={{ start: new Date(2025, 10, 1), end: new Date(2026, 1, 1) }} />);
    expect(screen.getByRole('button', { name: 'Период' }).textContent).toBe('Ноябрь 2025 — февраль 2026');
    rerender(<MonthRangePicker aria-label="Период" today={today} value={null} />);
    expect(screen.getByRole('button', { name: 'Период' }).textContent).toBe('Период');
  });

  it('a quarter or two presses draw a draft; «Применить» commits it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MonthRangePicker aria-label="Период" today={today} max={today} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Период' }));
    const third = await screen.findByRole('button', { name: 'III квартал 2026' });
    expect(screen.getByRole('button', { name: 'IV квартал 2026' }).hasAttribute('disabled')).toBe(true);
    await user.click(third);
    expect(third.getAttribute('aria-pressed')).toBe('true');
    expect(footer()).toBe('Июль\u00a0— сентябрь 2026');
    expect(month('Август 2026').closest('[role=gridcell]')?.getAttribute('aria-selected')).toBe('true');
    expect(onValueChange).not.toHaveBeenCalled();

    await user.click(month('Май 2026'));
    expect(footer()).toBe('Выберите конец периода');
    expect((screen.getByRole('button', { name: 'Применить' }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(month('Февраль 2026'));
    expect(footer()).toBe('Февраль\u00a0— май 2026');
    await user.click(screen.getByRole('button', { name: 'Применить' }));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: new Date(2026, 1, 1), end: new Date(2026, 4, 1) });
  });

  it('closing without «Применить» keeps the old range', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const value = { start: new Date(2026, 6, 1), end: new Date(2026, 8, 1) };
    render(<MonthRangePicker aria-label="Период" today={today} defaultValue={value} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Период' }));
    await user.click(await screen.findByRole('button', { name: 'I квартал 2026' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Применить' })).toBeNull());
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Период' }).textContent).toBe('Июль — сентябрь 2026');
  });
});
