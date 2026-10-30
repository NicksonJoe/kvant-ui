import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Editable,
  Field,
  Fieldset,
  Form,
  FormErrorSummary,
  Input,
  InputAddon,
  MaskedInput,
  NumberField,
  OtpInput,
  PasswordInput,
  SearchField,
  Stepper,
  TagsInput,
  Textarea,
  passwordStrength,
} from '..';

afterEach(() => {
  vi.useRealTimers();
});

describe('Fieldset', () => {
  it('names the group with its legend and disables every control inside', () => {
    render(
      <Fieldset legend="Реквизиты для документов" description="Попадут в счёт и акт." disabled>
        <Field label="ИНН">
          <Input />
        </Field>
      </Fieldset>,
    );
    const group = screen.getByRole('group', { name: 'Реквизиты для документов' });
    expect(group.getAttribute('aria-describedby')).toBe(screen.getByText('Попадут в счёт и акт.').id);
    expect((screen.getByRole('textbox', { name: 'ИНН' }) as HTMLInputElement).disabled).toBe(true);
  });
});

describe('Form', () => {
  it('stays quiet while typing, checks a field when it is left and re-checks it on every key while wrong', async () => {
    const user = userEvent.setup();
    const email = (value: unknown) => (String(value).includes('@') ? null : 'Укажите почту в формате name@domain.ru');
    render(
      <Form>
        <Field label="Почта" name="email" validate={email}>
          <Input />
        </Field>
      </Form>,
    );
    const input = screen.getByRole('textbox', { name: 'Почта' });
    await user.type(input, 'anna');
    expect(screen.queryByText(/Укажите почту/)).toBeNull();

    await user.tab();
    expect(await screen.findByText(/Укажите почту/)).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');

    await user.type(input, '@norda.ru');
    await waitFor(() => expect(screen.queryByText(/Укажите почту/)).toBeNull());
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });
});

describe('FormErrorSummary', () => {
  it('takes focus when it appears and leads to the broken field', async () => {
    const user = userEvent.setup();
    render(
      <Form>
        <FormErrorSummary errors={[{ name: 'client', label: 'Клиент', message: 'выберите из списка или создайте нового' }]} />
        <Field label="Клиент" error="Выберите клиента из списка">
          <Input name="client" />
        </Field>
      </Form>,
    );
    const summary = screen.getByRole('alert');
    expect(document.activeElement).toBe(summary);
    expect(summary.textContent).toMatch(/^Проверьте 1\sполе/);

    await user.click(screen.getByRole('button', { name: 'Клиент' }));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Клиент' }));
  });

  it('renders nothing without errors', () => {
    const { container } = render(<FormErrorSummary errors={[]} />);
    expect(container.childElementCount).toBe(0);
  });
});

describe('InputAddon', () => {
  it('puts the caret into the field when the segment is pressed', () => {
    render(
      <Input aria-label="Адрес брифа" prefix={<InputAddon variant="segment">https://</InputAddon>} />,
    );
    fireEvent.mouseDown(screen.getByText('https://'));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Адрес брифа' }));
  });
});

describe('SearchField', () => {
  it('clears on the first Esc and leaves the field on the second', async () => {
    const user = userEvent.setup();
    render(<SearchField aria-label="Поиск по проектам" defaultValue="север" />);
    const search = screen.getByRole('searchbox', { name: 'Поиск по проектам' });
    search.focus();
    await user.keyboard('{Escape}');
    expect((search as HTMLInputElement).value).toBe('');
    expect(document.activeElement).toBe(search);
    await user.keyboard('{Escape}');
    expect(document.activeElement).not.toBe(search);
  });

  it('searches 200 ms after typing stops', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSearch = vi.fn();
    render(<SearchField aria-label="Поиск по проектам" onSearch={onSearch} />);
    await user.type(screen.getByRole('searchbox'), 'сев');
    expect(onSearch).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('сев');
  });

  it('focuses from the shortcut and hides the hint while focused', async () => {
    const user = userEvent.setup();
    render(<SearchField aria-label="Поиск" shortcut="/" />);
    expect(screen.getByText('/')).toBeTruthy();
    await user.keyboard('/');
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Поиск' }));
    expect(screen.queryByText('/')).toBeNull();
  });

  it('swaps the clear button for a spinner while loading', () => {
    render(<SearchField aria-label="Поиск" defaultValue="север" loading />);
    expect(screen.queryByRole('button', { name: 'Очистить' })).toBeNull();
    expect(screen.getByRole('searchbox').getAttribute('aria-busy')).toBe('true');
  });
});

describe('PasswordInput', () => {
  it('reveals the password with a pressed toggle', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Пароль" defaultValue="Sever-2026!" />);
    const input = screen.getByLabelText('Пароль') as HTMLInputElement;
    expect(input.type).toBe('password');
    const toggle = screen.getByRole('button', { name: 'Показать пароль' });
    await user.click(toggle);
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });

  it('rates passwords on four steps', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('sever26')).toBe(1);
    expect(passwordStrength('severstudio')).toBe(2);
    expect(passwordStrength('sever20262026')).toBe(2);
    expect(passwordStrength('Sever-2026!')).toBe(3);
    expect(passwordStrength('Sever-2026!abc')).toBe(4);
    expect(passwordStrength('конь пила дом рыба')).toBe(4);
  });

  it('shows the meter and what to add next', () => {
    render(<PasswordInput aria-label="Новый пароль" showStrength defaultValue="Sever-2026!" />);
    expect(screen.getByText(/Ещё 3 символа — и станет надёжным/)).toBeTruthy();
    expect((screen.getByLabelText('Новый пароль') as HTMLInputElement).autocomplete).toBe('new-password');
  });
});

describe('NumberField', () => {
  it('steps with the buttons and arrows and stops at the bounds', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<NumberField aria-label="Участников" defaultValue={19} min={1} max={20} onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox', { name: 'Участников' });
    const increase = screen.getByRole('button', { name: 'Увеличить' });
    await user.click(increase);
    expect(onValueChange).toHaveBeenLastCalledWith(20, expect.anything());
    expect((increase as HTMLButtonElement).disabled).toBe(true);

    input.focus();
    await user.keyboard('{ArrowDown}');
    expect((input as HTMLInputElement).value).toBe('19');
  });
});

describe('Stepper', () => {
  it('changes the value by step, announces it and disables the end button', async () => {
    const user = userEvent.setup();
    function Guests() {
      const [guests, setGuests] = useState(3);
      return <Stepper aria-label="Гостей на встрече" value={guests} onValueChange={setGuests} min={0} max={4} />;
    }
    render(<Guests />);
    expect(screen.getByRole('group', { name: 'Гостей на встрече' })).toBeTruthy();
    const increase = screen.getByRole('button', { name: 'Увеличить' });
    await user.click(increase);
    expect(screen.getByRole('status').textContent).toBe('4');
    expect((increase as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('OtpInput', () => {
  it('fills the cells as you type and reports the complete code', async () => {
    const user = userEvent.setup();
    const onValueComplete = vi.fn();
    render(<OtpInput aria-label="Код из СМС" onValueComplete={onValueComplete} />);
    const cells = screen.getAllByRole('textbox');
    expect(cells).toHaveLength(6);
    expect(cells[1]?.getAttribute('aria-label')).toBe('Цифра 2 из 6');
    expect(document.querySelectorAll('[data-slot="otp-input-separator"]')).toHaveLength(1);

    await user.click(cells[0] as HTMLElement);
    await user.keyboard('482913');
    expect(onValueComplete).toHaveBeenCalledWith('482913', expect.anything());
  });

  it('names the first cell with aria-label when there is no visible label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<OtpInput aria-label="Код из СМС" />);
    expect(screen.getAllByRole('textbox')[0]).toBe(screen.getByRole('textbox', { name: 'Код из СМС' }));
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('marks every cell when the code is wrong', () => {
    render(<OtpInput aria-label="Код из СМС" invalid defaultValue="487913" />);
    for (const cell of screen.getAllByRole('textbox')) expect(cell.getAttribute('aria-invalid')).toBe('true');
  });
});

describe('TagsInput', () => {
  it('adds tags with Enter and comma and skips duplicates', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagsInput aria-label="Теги проекта" onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox', { name: 'Теги проекта' });
    await user.type(input, 'брендинг{Enter}сайт,Брендинг{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['брендинг', 'сайт']);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('selects the last tag on the first Backspace and removes it on the second', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagsInput aria-label="Теги проекта" defaultValue={['брендинг', 'сайт']} onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox', { name: 'Теги проекта' });
    await user.click(input);
    await user.keyboard('{Backspace}');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByText(/и «сайт» удалится/)).toBeTruthy();
    await user.keyboard('{Backspace}');
    expect(onValueChange).toHaveBeenLastCalledWith(['брендинг']);
  });

  it('suggests matching tags and creates the typed one', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <TagsInput aria-label="Теги проекта" suggestions={['дизайн-система', 'дизайн-ревью', 'сайт']} onValueChange={onValueChange} />,
    );
    const input = screen.getByRole('combobox', { name: 'Теги проекта' });
    await user.type(input, 'диз');
    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['дизайн-система', 'дизайн-ревью', 'Создать тег «диз»']);

    await user.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]?.id);
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['дизайн-система']);
  });

  it('folds extra tags into «+N» outside focus', () => {
    render(<TagsInput aria-label="Теги проекта" defaultValue={['брендинг', 'сайт', 'срочно', 'упаковка']} visibleTags={3} />);
    expect(screen.getByText('+1')).toBeTruthy();
    expect(screen.queryByText('упаковка')).toBeNull();
  });
});

describe('MaskedInput', () => {
  it('formats digits by the mask and submits them unmasked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MaskedInput aria-label="Телефон" mask="(###) ###-##-##" prefix="+7" name="phone" onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox', { name: 'Телефон' }) as HTMLInputElement;
    await user.type(input, '9123456');
    expect(input.value).toBe('(912) 345-6');
    await user.type(input, '7890');
    expect(input.value).toBe('(912) 345-67-89');
    expect(onValueChange).toHaveBeenLastCalledWith('9123456789');
    expect((document.querySelector('input[name="phone"]') as HTMLInputElement).value).toBe('+79123456789');
  });

  it('normalises a pasted number with the country code', async () => {
    const user = userEvent.setup();
    render(<MaskedInput aria-label="Телефон" mask="(###) ###-##-##" prefix="+7" />);
    const input = screen.getByRole('textbox', { name: 'Телефон' }) as HTMLInputElement;
    await user.click(input);
    await user.paste('8 912 345-67-89');
    expect(input.value).toBe('(912) 345-67-89');
  });

  it('deletes the digit behind a literal on Backspace instead of getting stuck on it', async () => {
    const user = userEvent.setup();
    render(<MaskedInput aria-label="Телефон" mask="(###) ###-##-##" defaultValue="9123" />);
    const input = screen.getByRole('textbox', { name: 'Телефон' }) as HTMLInputElement;
    expect(input.value).toBe('(912) 3');
    await user.click(input);
    await user.keyboard('{End}{ArrowLeft}{Backspace}');
    expect(input.value).toBe('(913');
    expect(input.selectionStart).toBe(3);
  });
});

describe('Editable', () => {
  it('saves on Enter and gives focus back to the text', async () => {
    const user = userEvent.setup();
    const onValueCommit = vi.fn();
    render(<Editable aria-label="Название проекта" defaultValue="Ребрендинг «Студии Север»" onValueCommit={onValueCommit} />);
    await user.click(screen.getByRole('button', { name: /Название проекта/ }));
    const input = screen.getByRole('textbox', { name: 'Название проекта' }) as HTMLInputElement;
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);

    await user.clear(input);
    await user.keyboard('Ребрендинг и сайт{Enter}');
    expect(onValueCommit).toHaveBeenCalledWith('Ребрендинг и сайт');
    const preview = screen.getByRole('button', { name: /Ребрендинг и сайт/ });
    expect(document.activeElement).toBe(preview);
  });

  it('reverts on Esc and never saves an empty value', async () => {
    const user = userEvent.setup();
    const onValueCommit = vi.fn();
    render(<Editable aria-label="Название проекта" defaultValue="Север" onValueCommit={onValueCommit} />);
    await user.click(screen.getByRole('button', { name: /Север/ }));
    await user.keyboard('Юг{Escape}');
    expect(screen.getByRole('button', { name: /Север/ })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Север/ }));
    await user.clear(screen.getByRole('textbox', { name: 'Название проекта' }));
    await user.keyboard('{Enter}');
    expect(onValueCommit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Север/ })).toBeTruthy();
  });
});

describe('Textarea counter', () => {
  it('warns from 90 % and lets the text run over the limit as an error', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Комментарий" maxLength={10} />);
    const textarea = screen.getByRole('textbox', { name: 'Комментарий' });
    const counter = () => document.querySelector('[data-slot="textarea-counter"]');

    await user.type(textarea, '123456789');
    expect(counter()?.getAttribute('data-limit')).toBe('near');
    await user.type(textarea, '012');
    expect((textarea as HTMLTextAreaElement).value).toHaveLength(12);
    expect(counter()?.textContent).toBe('12 / 10');
    expect(counter()?.getAttribute('data-limit')).toBe('over');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    await waitFor(() => expect(screen.getByText(/Лимит превышен/)).toBeTruthy());
  });
});
