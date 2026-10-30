import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Message, MessageGroup, PromptAttachment, PromptInput, Resizable, ScrollArea } from '..';

describe('Resizable', () => {
  it('is a focusable separator moved by keys, clamped and reset by double click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Resizable label="Ширина списка сделок" defaultValue={40} min={20} max={70} onValueChange={onValueChange}>
        <div>Список</div>
        <div>Карточка</div>
      </Resizable>,
    );
    const handle = screen.getByRole('separator', { name: 'Ширина списка сделок' });
    expect(handle.getAttribute('aria-valuenow')).toBe('40');
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');

    handle.focus();
    await user.keyboard('{ArrowRight}');
    expect(Number(handle.getAttribute('aria-valuenow'))).toBeGreaterThan(40);
    await user.keyboard('{End}');
    expect(handle.getAttribute('aria-valuenow')).toBe('70');
    await user.keyboard('{Home}');
    expect(handle.getAttribute('aria-valuenow')).toBe('20');
    expect(onValueChange).toHaveBeenLastCalledWith(20);

    fireEvent.doubleClick(handle);
    expect(handle.getAttribute('aria-valuenow')).toBe('40');
  });
});

describe('ScrollArea', () => {
  it('renders its content inside a scrollable viewport', () => {
    render(
      <ScrollArea className="h-40">
        <p>Участники проекта</p>
      </ScrollArea>,
    );
    expect(screen.getByText('Участники проекта').closest('[data-slot="scroll-area"]')).toBeTruthy();
  });
});

describe('Message', () => {
  it('groups bubbles of one author and reads the delivery status', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <>
        <MessageGroup direction="incoming" author="Анна Северова">
          <Message>Добрый день!</Message>
          <Message>Посмотрели макеты.</Message>
          <Message time="14:02">Успеете до пятницы?</Message>
        </MessageGroup>
        <Message direction="outgoing" time="14:07" status="read">
          Смета во вложении
        </Message>
        <Message direction="outgoing" status="failed" onRetry={onRetry}>
          Ссылка на макеты
        </Message>
      </>,
    );
    const bubble = (text: string) => screen.getByText(text).closest('[data-slot="message"]');
    expect(bubble('Добрый день!')?.getAttribute('data-position')).toBe('first');
    expect(bubble('Посмотрели макеты.')?.getAttribute('data-position')).toBe('middle');
    expect(bubble('Успеете до пятницы?')?.getAttribute('data-position')).toBe('last');
    expect(screen.getByText('Прочитано')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

function Composer({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <PromptInput
      value={value}
      onValueChange={setValue}
      onSubmit={(text) => {
        onSubmit(text);
        setValue('');
      }}
    />
  );
}

describe('PromptInput', () => {
  it('sends on Enter, keeps Shift+Enter for a new line and blocks empty messages', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Composer onSubmit={onSubmit} />);
    const field = screen.getByRole('textbox', { name: 'Сообщение' });
    const send = screen.getByRole('button', { name: 'Отправить' });
    expect(send.hasAttribute('disabled')).toBe(true);

    await user.type(field, 'Анна, добрый день!{Shift>}{Enter}{/Shift}Ссылка ниже');
    expect(onSubmit).not.toHaveBeenCalled();
    expect((field as HTMLTextAreaElement).value).toBe('Анна, добрый день!\nСсылка ниже');

    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Анна, добрый день!\nСсылка ниже');
    expect((field as HTMLTextAreaElement).value).toBe('');
  });

  it('locks the field while sending and explains why it is disabled', () => {
    const { rerender } = render(<PromptInput value="Макет и смета" onSubmit={() => {}} sending />);
    expect(screen.getByRole('textbox', { name: 'Сообщение' }).hasAttribute('readonly')).toBe(true);
    expect(screen.getByRole('button', { name: 'Отправляется' }).getAttribute('aria-busy')).toBe('true');

    rerender(<PromptInput onSubmit={() => {}} disabled placeholder="Чат закрыт: сделка перенесена в архив" />);
    expect(screen.getByPlaceholderText('Чат закрыт: сделка перенесена в архив').hasAttribute('disabled')).toBe(true);
  });

  it('removes an attachment', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <PromptInput
        onSubmit={() => {}}
        attachments={<PromptAttachment name="Смета_доработки.pdf" meta="184 КБ · PDF" onRemove={onRemove} />}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Убрать «Смета_доработки.pdf»' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
