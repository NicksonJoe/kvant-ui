import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Calendar,
  Checkbox,
  Field,
  Input,
  SegmentedControl,
  Tag,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  addMonths,
  formatDate,
  monthWeeks,
} from '..';

describe('SegmentedControl', () => {
  it('moves the selection with arrow keys', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        aria-label="Период"
        defaultValue="week"
        onValueChange={onValueChange}
        options={[
          { value: 'day', label: 'День' },
          { value: 'week', label: 'Неделя' },
          { value: 'month', label: 'Месяц' },
        ]}
      />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Период' })).toBeTruthy();
    const week = screen.getByRole('radio', { name: 'Неделя' });
    expect(week.getAttribute('aria-checked')).toBe('true');

    week.focus();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith('month');
    expect(screen.getByRole('radio', { name: 'Месяц' }).getAttribute('aria-checked')).toBe('true');

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(onValueChange).toHaveBeenLastCalledWith('day');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'День' }));
  });
});

describe('Tag', () => {
  it('reads the count with the label of a filter chip', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <Tag size="lg" count={2} countTone="danger" onSelectedChange={onSelectedChange}>
        Просроченные
      </Tag>,
    );
    const chip = screen.getByRole('button', { name: 'Просроченные, 2' });
    await user.click(chip);
    expect(onSelectedChange.mock.lastCall?.[0]).toBe(true);
  });
});

describe('Tabs', () => {
  it('follows focus with arrow keys and shows the matching panel', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="deals">
        <TabsList aria-label="Разделы клиента">
          <TabsTab value="deals">Сделки</TabsTab>
          <TabsTab value="contacts">Контакты</TabsTab>
          <TabsTab value="tasks">Задачи</TabsTab>
        </TabsList>
        <TabsPanel value="deals">Семь сделок</TabsPanel>
        <TabsPanel value="contacts">Два контакта</TabsPanel>
        <TabsPanel value="tasks">Четыре задачи</TabsPanel>
      </Tabs>,
    );
    screen.getByRole('tab', { name: 'Сделки' }).focus();
    await user.keyboard('{ArrowRight}');
    const contacts = screen.getByRole('tab', { name: 'Контакты' });
    expect(document.activeElement).toBe(contacts);
    expect(contacts.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toBe('Два контакта');

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Задачи' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('Checkbox', () => {
  it('exposes the indeterminate state as aria-checked="mixed" and resolves to checked on click', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox indeterminate aria-label="Выбрать все сделки" onCheckedChange={onCheckedChange} />);
    const box = screen.getByRole('checkbox', { name: 'Выбрать все сделки' });
    expect(box.getAttribute('aria-checked')).toBe('mixed');
    expect(box.hasAttribute('data-indeterminate')).toBe(true);

    await user.click(box);
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('toggles from the label with Space', async () => {
    const user = userEvent.setup();
    render(<Checkbox>Напомнить за день</Checkbox>);
    const box = screen.getByRole('checkbox', { name: 'Напомнить за день' });
    box.focus();
    await user.keyboard(' ');
    expect(box.getAttribute('aria-checked')).toBe('true');
  });
});

describe('Field', () => {
  it('links the label, description and error to the control', () => {
    render(
      <Field
        label="Почта для счетов"
        optional
        description="Сюда придут закрывающие документы."
        error="Укажите почту в формате name@domain.ru"
      >
        <Input defaultValue="anna.sever@studio" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: /Почта для счетов/ });
    expect(input.getAttribute('aria-invalid')).toBe('true');

    const describedBy = (input.getAttribute('aria-describedby') ?? '').split(' ');
    const description = screen.getByText('Сюда придут закрывающие документы.');
    const error = screen.getByText('Укажите почту в формате name@domain.ru');
    expect(description.id).not.toBe('');
    expect(error.id).not.toBe('');
    expect(describedBy).toContain(description.id);
    expect(describedBy).toContain(error.id);
  });

  it('is valid without an error', () => {
    render(
      <Field label="Название компании">
        <Input placeholder="Название компании" />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Название компании' }).getAttribute('aria-invalid')).toBeNull();
  });
});

describe('Calendar', () => {
  const today = new Date(2026, 9, 29);

  it('starts weeks on Monday and covers the month', () => {
    const weeks = monthWeeks(new Date(2026, 9, 1));
    expect(weeks).toHaveLength(5);
    const [first, last] = [weeks[0]?.[0], weeks[4]?.[6]];
    expect(first && formatDate(first)).toBe('28.09.2026');
    expect(last && formatDate(last)).toBe('01.11.2026');
    expect(formatDate(addMonths(new Date(2026, 0, 31), 1))).toBe('28.02.2026');
  });

  it('moves focus with arrows and pages, selects with Enter', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar today={today} defaultValue={new Date(2026, 9, 27)} onValueChange={onValueChange} />);
    expect(screen.getByRole('grid', { name: 'Октябрь 2026' })).toBeTruthy();

    const selected = screen.getByRole('button', { name: /27 октября 2026/ });
    expect(selected.tabIndex).toBe(0);
    selected.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /28 октября 2026/ }));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /, 4 ноября 2026/ }));
    expect(screen.getByRole('grid', { name: 'Ноябрь 2026' })).toBeTruthy();

    await user.keyboard('{PageUp}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 9, 4));
    expect(screen.getByRole('button', { name: /29 октября 2026/ }).getAttribute('aria-current')).toBe('date');
  });
});
