import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnimatedNumber, BarList, StackedBar } from '..';

describe('BarList', () => {
  it('lists every item with its value and a bar relative to the largest', () => {
    render(
      <BarList
        aria-label="Выручка по менеджерам"
        data={[
          { label: 'Анна', value: 1200000 },
          { label: 'Олег', value: 600000 },
        ]}
        formatValue={(value) => `${value / 1e6} млн ₽`}
      />,
    );
    const list = screen.getByRole('list', { name: 'Выручка по менеджерам' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[1] as HTMLElement).getByText('0.6 млн ₽')).toBeDefined();
    expect((rows[1]?.querySelector('[data-slot=bar-list-bar]') as HTMLElement).style.width).toBe('50%');
  });
});

describe('StackedBar', () => {
  it('splits one bar into shares and names each part in the legend', () => {
    render(
      <StackedBar
        aria-label="Источники сделок"
        data={[
          { label: 'Сайт', value: 120 },
          { label: 'Telegram', value: 60 },
          { label: 'Рекомендация', value: 20 },
        ]}
      />,
    );
    expect(screen.getByRole('group', { name: 'Источники сделок' })).toBeDefined();
    expect(document.querySelectorAll('[data-slot=stacked-bar-segment]')).toHaveLength(3);
    expect(screen.getByText('60,0 %')).toBeDefined();
    expect(screen.getByText('10,0 %')).toBeDefined();
  });
});

describe('AnimatedNumber', () => {
  it('reads as the final formatted value and rolls each digit to its place', () => {
    const { rerender } = render(<AnimatedNumber value={1248500} suffix=" ₽" />);
    expect(screen.getByText('1 248 500 ₽', { selector: '.sr-only' })).toBeDefined();

    rerender(<AnimatedNumber value={1312400} suffix=" ₽" />);
    expect(screen.getByText('1 312 400 ₽', { selector: '.sr-only' })).toBeDefined();
    const digits = [...document.querySelectorAll<HTMLElement>('[data-slot=animated-number-digit]')].map((digit) => digit.dataset.value);
    expect(digits).toEqual(['1', '3', '1', '2', '4', '0', '0']);
  });
});
