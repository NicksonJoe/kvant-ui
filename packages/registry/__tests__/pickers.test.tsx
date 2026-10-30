import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Cascader,
  ColorPicker,
  DateField,
  DatePicker,
  DateRangePicker,
  Dropzone,
  Field,
  Listbox,
  NativeSelect,
  RangeCalendar,
  TimePicker,
  TimeSlots,
  UploadItem,
  formatFileSize,
  type CascaderOption,
} from '..';

const roles = [
  { value: 'owner', label: 'Владелец', description: 'Полный доступ', group: 'Команда студии' },
  { value: 'manager', label: 'Менеджер', group: 'Команда студии' },
  { value: 'viewer', label: 'Наблюдатель', group: 'Команда студии' },
  { value: 'client', label: 'Клиент', group: 'Внешние участники', disabled: true },
] as const;

describe('Listbox', () => {
  it('moves the highlight with arrows and typeahead, selects with Enter, groups options', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Listbox aria-label="Роль" options={roles} defaultValue="manager" onValueChange={onValueChange} />);
    const listbox = screen.getByRole('listbox', { name: 'Роль' });
    expect(screen.getByRole('group', { name: 'Команда студии' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Менеджер' }).getAttribute('aria-selected')).toBe('true');

    listbox.focus();
    expect(listbox.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Менеджер' }).id);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('viewer');
    expect(screen.getByRole('option', { name: 'Наблюдатель' }).getAttribute('aria-selected')).toBe('true');

    await user.keyboard('{End}');
    expect(listbox.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Наблюдатель' }).id);
    await user.keyboard('в');
    expect(listbox.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Владелец' }).id);
  });

  it('toggles options in multiple mode', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Listbox multiple aria-label="Роли" options={roles} defaultValue={['owner']} onValueChange={onValueChange} />);
    expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true');
    await user.click(screen.getByRole('option', { name: 'Менеджер' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['owner', 'manager']);
    await user.click(screen.getByRole('option', { name: /Владелец/ }));
    expect(onValueChange).toHaveBeenLastCalledWith(['manager']);
    await user.click(screen.getByRole('option', { name: 'Клиент' }));
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });
});

describe('NativeSelect', () => {
  it('is labelled by Field and keeps the native value', async () => {
    const user = userEvent.setup();
    render(
      <Field label="Валюта">
        <NativeSelect defaultValue="rub">
          <option value="rub">Россия, рубль</option>
          <option value="kzt">Казахстан, тенге</option>
        </NativeSelect>
      </Field>,
    );
    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Валюта' });
    expect(select.value).toBe('rub');
    await user.selectOptions(select, 'kzt');
    expect(select.value).toBe('kzt');
  });
});

const services: readonly CascaderOption[] = [
  {
    value: 'design',
    label: 'Дизайн',
    children: [
      {
        value: 'branding',
        label: 'Брендинг',
        children: [
          { value: 'logo', label: 'Логотип' },
          { value: 'identity', label: 'Фирменный стиль' },
        ],
      },
      { value: 'ui', label: 'Интерфейсы' },
    ],
  },
  { value: 'dev', label: 'Разработка', children: [{ value: 'site', label: 'Сайт' }] },
];

describe('Cascader', () => {
  it('walks the levels with arrows and picks a leaf with Enter', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Cascader aria-label="Услуга" options={services} onValueChange={onValueChange} />);
    const trigger = screen.getByRole('button', { name: 'Услуга' });
    await user.click(trigger);

    const first = await screen.findByRole('option', { name: 'Дизайн' });
    await waitFor(() => expect(document.activeElement).toBe(first));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('option', { name: 'Брендинг' }));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('option', { name: 'Логотип' }));
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(screen.getByRole('option', { name: 'Брендинг' }));
    await user.keyboard('{ArrowRight}{ArrowDown}{Enter}');

    expect(onValueChange).toHaveBeenLastCalledWith(['design', 'branding', 'identity']);
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(trigger.textContent).toContain('Фирменный стиль');
  });
});

describe('RangeCalendar', () => {
  it('shows two months; the second click closes the range and swaps the ends when needed', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RangeCalendar today={new Date(2026, 9, 29)} defaultMonth={new Date(2026, 8, 1)} onValueChange={onValueChange} />);
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /, 5 октября 2026/ }));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /, 2 октября 2026/ }));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: new Date(2026, 9, 2), end: new Date(2026, 9, 5) });
  });
});

describe('DatePicker', () => {
  it('opens on the selected day, not on the month buttons', async () => {
    const user = userEvent.setup();
    render(<DatePicker aria-label="Срок сдачи" defaultValue={new Date(2026, 10, 12)} />);
    await user.click(screen.getByRole('button', { name: 'Срок сдачи' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: /, 12 ноября 2026/ })));
  });
});

describe('DateRangePicker', () => {
  it('a preset draws the range, «Применить» commits it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const today = new Date(2026, 9, 29);
    render(<DateRangePicker aria-label="Период отчёта" today={today} max={today} onValueChange={onValueChange} />);
    const trigger = screen.getByRole('button', { name: 'Период отчёта' });
    await user.click(trigger);

    const preset = await screen.findByRole('button', { name: '7 дней' });
    await user.click(preset);
    expect(preset.getAttribute('aria-pressed')).toBe('true');
    expect(onValueChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Применить' }));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: new Date(2026, 9, 23), end: today });
    await waitFor(() => expect(trigger.textContent).toContain('23.10.2026\u00a0— 29.10.2026'));
  });
});

describe('DateField', () => {
  it('types a date segment by segment and steps the focused segment with arrows', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateField aria-label="Дата договора" onValueChange={onValueChange} />);
    expect(screen.getByRole('group', { name: 'Дата договора' })).toBeTruthy();
    screen.getByRole('spinbutton', { name: 'день' }).focus();

    await user.keyboard('27102026');
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 9, 27));
    expect(document.activeElement).toBe(screen.getByRole('spinbutton', { name: 'год' }));

    await user.keyboard('{ArrowUp}');
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2027, 9, 27));
  });

  it('explains an impossible date once focus leaves the field', async () => {
    const user = userEvent.setup();
    render(<DateField aria-label="Дата акта" />);
    screen.getByRole('spinbutton', { name: 'день' }).focus();
    await user.keyboard('31022026');
    expect(screen.queryByText('В феврале 2026 года 28 дней')).toBeNull();
    await user.tab();
    await user.tab();
    expect(screen.getByText('В феврале 2026 года 28 дней')).toBeTruthy();
    expect(screen.getByRole('spinbutton', { name: 'день' }).getAttribute('aria-invalid')).toBe('true');
  });
});

describe('TimePicker', () => {
  it('picks the hour, then the minute, and closes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="Время встречи" defaultValue="10:30" onValueChange={onValueChange} />);
    const trigger = screen.getByRole('button', { name: 'Время встречи' });
    expect(trigger.textContent).toContain('10:30');
    await user.click(trigger);

    const hours = await screen.findByRole('listbox', { name: 'Часы' });
    expect(within(hours).getByRole('option', { name: '10' }).getAttribute('aria-selected')).toBe('true');
    await user.click(within(hours).getByRole('option', { name: '11' }));
    expect(onValueChange).toHaveBeenLastCalledWith('11:30');

    await user.click(within(screen.getByRole('listbox', { name: 'Минуты' })).getByRole('option', { name: '45' }));
    expect(onValueChange).toHaveBeenLastCalledWith('11:45');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  });
});

describe('TimeSlots', () => {
  it('skips taken slots and selects a free one', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimeSlots aria-label="Пятница, 30 октября" slots={['09:30', '10:00', '10:30']} unavailable={['10:00']} onValueChange={onValueChange} />);
    expect(screen.getByRole('radiogroup', { name: 'Пятница, 30 октября' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '10:00' }).getAttribute('aria-disabled')).toBe('true');
    await user.click(screen.getByRole('radio', { name: '10:30' }));
    expect(onValueChange).toHaveBeenLastCalledWith('10:30');
  });
});

describe('ColorPicker', () => {
  it('edits the colour through HEX, swatches and the keyboard', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorPicker aria-label="Цвет метки" defaultValue="#3986E4" swatches={['#3986E4', '#C2612C']} onValueChange={onValueChange} />);
    const trigger = screen.getByRole('button', { name: 'Цвет метки' });
    expect(trigger.textContent).toContain('#3986E4');
    await user.click(trigger);

    const hex = await screen.findByRole('textbox', { name: 'Значение HEX' });
    await user.clear(hex);
    await user.type(hex, '1c71e2{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('#1C71E2');

    await user.click(screen.getByRole('radio', { name: '#C2612C' }));
    expect(onValueChange).toHaveBeenLastCalledWith('#C2612C');

    const area = screen.getByRole('slider', { name: 'Насыщенность и яркость' });
    area.focus();
    await user.keyboard('{ArrowDown}');
    expect(onValueChange).toHaveBeenCalledTimes(3);
    expect(onValueChange.mock.lastCall?.[0]).not.toBe('#C2612C');

    const alpha = screen.getByRole('textbox', { name: 'Непрозрачность' });
    await user.clear(alpha);
    await user.type(alpha, '50{Enter}');
    expect(onValueChange.mock.lastCall?.[0]).toMatch(/^#[0-9A-F]{6}80$/);
  });
});

describe('Dropzone', () => {
  const pdf = new File(['%PDF'], 'Бриф.pdf', { type: 'application/pdf' });
  const keynote = new File(['key'], 'Презентация.key', { type: '' });

  it('accepts matching files and names the rejected one with the reason', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onFiles = vi.fn();
    const { container } = render(<Dropzone accept=".pdf,.png,.jpg" maxSize={20 * 1024 * 1024} maxFiles={10} onFiles={onFiles} />);
    expect(screen.getByRole('button', { name: /Перетащите файлы/ })).toBeTruthy();
    expect(screen.getByText('PDF, PNG или JPG · до 20 МБ · не больше 10 файлов')).toBeTruthy();

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('no file input');
    await user.upload(input, [pdf, keynote]);
    expect(onFiles).toHaveBeenCalledWith([pdf], [{ file: keynote, reason: '«Презентация.key» — нужен PDF, PNG или JPG' }]);
    expect(screen.getByText('Этот файл не подойдёт')).toBeTruthy();
  });

  it('shows the drop target state while files are dragged over', () => {
    render(<Dropzone accept=".pdf" onFiles={() => {}} />);
    const zone = screen.getByRole('button');
    fireEvent.dragEnter(zone, { dataTransfer: { types: ['Files'], items: [{ kind: 'file', type: 'application/pdf' }] } });
    expect(zone.getAttribute('data-drag')).toBe('accept');
    expect(screen.getByText('Отпустите, чтобы загрузить 1 файл')).toBeTruthy();
    fireEvent.dragLeave(zone);
    expect(zone.hasAttribute('data-drag')).toBe(false);
  });
});

describe('UploadItem', () => {
  it('shows progress and the actions of each status', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onRemove = vi.fn();
    const { rerender } = render(<UploadItem name="Бриф.pdf" size={8_808_038} status="uploading" progress={37} onRemove={onRemove} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('37');
    expect(screen.getByText('3,1 из 8,4 МБ')).toBeTruthy();

    rerender(
      <UploadItem name="Смета.xlsx" size={1_200_000} status="error" error="Связь прервалась — файл не сохранён" onRetry={onRetry} onRemove={onRemove} />,
    );
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    await user.click(screen.getByRole('button', { name: 'Убрать «Смета.xlsx»' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('formats sizes the Russian way', () => {
    expect(formatFileSize(512)).toBe('512 Б');
    expect(formatFileSize(1_258_291)).toBe('1,2 МБ');
    expect(formatFileSize(20 * 1024 * 1024)).toBe('20 МБ');
  });
});
