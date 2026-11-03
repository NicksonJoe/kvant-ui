import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button, Popconfirm } from '..';

const dialog = () => screen.queryByRole('alertdialog');
const open = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

function Send(props: Partial<Parameters<typeof Popconfirm>[0]>) {
  return (
    <Popconfirm
      title="Отправить счёт № 312 клиенту?"
      description="Письмо со ссылкой на оплату уйдёт на anna@studio-sever.ru."
      confirmLabel="Отправить"
      onConfirm={() => {}}
      {...props}
    >
      <Button variant="secondary">Отправить счёт</Button>
    </Popconfirm>
  );
}

describe('Popconfirm', () => {
  it('opens from its trigger as an alertdialog named by the question and described by the consequence', async () => {
    render(<Send />);
    expect(dialog()).toBeNull();
    open('Отправить счёт');
    const popup = await screen.findByRole('alertdialog');
    const label = document.getElementById(popup.getAttribute('aria-labelledby') ?? '');
    const description = document.getElementById(popup.getAttribute('aria-describedby') ?? '');
    expect(label?.textContent).toBe('Отправить счёт № 312 клиенту?');
    expect(description?.textContent).toBe('Письмо со ссылкой на оплату уйдёт на anna@studio-sever.ru.');
    expect(popup.getAttribute('data-slot')).toBe('popconfirm');
    expect(popup.getAttribute('data-size')).toBe('md');
  });

  it('neutral: the confirm button is primary and takes the focus', async () => {
    render(<Send />);
    open('Отправить счёт');
    const confirm = await screen.findByRole('button', { name: 'Отправить' });
    expect(confirm.getAttribute('data-variant')).toBe('primary');
    await waitFor(() => expect(document.activeElement).toBe(confirm));
  });

  it('danger: the confirm button is danger and the focus waits on «Отмена»', async () => {
    render(
      <Popconfirm tone="danger" title="Удалить комментарий?" onConfirm={() => {}}>
        <Button variant="secondary">Удалить…</Button>
      </Popconfirm>,
    );
    open('Удалить…');
    expect((await screen.findByRole('button', { name: 'Удалить' })).getAttribute('data-variant')).toBe('danger');
    const cancel = screen.getByRole('button', { name: 'Отмена' });
    expect(cancel.getAttribute('data-variant')).toBe('secondary');
    await waitFor(() => expect(document.activeElement).toBe(cancel));
  });

  it('«Отмена» closes without confirming and calls onCancel', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<Send onConfirm={onConfirm} onCancel={onCancel} />);
    open('Отправить счёт');
    fireEvent.click(await screen.findByRole('button', { name: 'Отмена' }));
    await waitFor(() => expect(dialog()).toBeNull());
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Esc is «Отмена»', async () => {
    const onCancel = vi.fn();
    render(<Send onCancel={onCancel} />);
    open('Отправить счёт');
    fireEvent.keyDown(await screen.findByRole('alertdialog'), { key: 'Escape' });
    await waitFor(() => expect(dialog()).toBeNull());
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('a synchronous onConfirm closes at once', async () => {
    const onConfirm = vi.fn();
    render(<Send onConfirm={onConfirm} />);
    open('Отправить счёт');
    fireEvent.click(await screen.findByRole('button', { name: 'Отправить' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('a promise keeps it open with a spinner, «Отмена» disabled and Esc ignored, then closes', async () => {
    let resolve: () => void = () => {};
    const onConfirm = vi.fn(() => new Promise<void>((done) => (resolve = done)));
    render(<Send onConfirm={onConfirm} />);
    open('Отправить счёт');
    const confirm = await screen.findByRole('button', { name: 'Отправить' });
    fireEvent.click(confirm);
    expect(confirm.getAttribute('aria-busy')).toBe('true');
    expect(confirm.querySelector('[data-slot=spinner]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Отмена' }).hasAttribute('disabled')).toBe(true);
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
    expect(dialog()).not.toBeNull();
    await act(async () => resolve());
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('a rejected promise shows the error and turns the button into «Повторить»', async () => {
    const onConfirm = vi.fn(() => Promise.reject(new Error('offline')));
    render(<Send confirmLabel="Закрыть доступ" onConfirm={onConfirm} />);
    open('Отправить счёт');
    fireEvent.click(await screen.findByRole('button', { name: 'Закрыть доступ' }));
    const alert = await screen.findByRole('alert');
    expect(alert.getAttribute('data-slot')).toBe('popconfirm-error');
    expect(alert.textContent).toBe('Не получилось. Попробуйте ещё раз.');
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it('shows the error text it is given', async () => {
    render(<Send defaultOpen error="Нет связи с сервером. Ссылка пока работает." />);
    expect((await screen.findByRole('alert')).textContent).toBe('Нет связи с сервером. Ссылка пока работает.');
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeDefined();
  });

  it('loading prop: busy confirm, disabled «Отмена», Esc does not close', async () => {
    render(<Send defaultOpen loading />);
    const popup = await screen.findByRole('alertdialog');
    expect(screen.getByRole('button', { name: 'Отправить' }).getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('button', { name: 'Отмена' }).hasAttribute('disabled')).toBe(true);
    fireEvent.keyDown(popup, { key: 'Escape' });
    expect(dialog()).not.toBeNull();
  });

  it('icon sits in a 20 slot before the text', async () => {
    render(<Send defaultOpen icon={<svg data-testid="icon" />} />);
    const slot = (await screen.findByRole('alertdialog')).querySelector('[data-slot=popconfirm-icon]');
    expect(slot?.querySelector('[data-testid=icon]')).not.toBeNull();
    expect(slot?.className).toContain('size-5');
  });

  it('size sm: one line, no description, xs buttons', async () => {
    render(<Send defaultOpen size="sm" tone="danger" title="Удалить черновик?" confirmLabel="Удалить" />);
    const popup = await screen.findByRole('alertdialog');
    expect(popup.getAttribute('data-size')).toBe('sm');
    expect(popup.textContent).not.toContain('Письмо со ссылкой');
    expect(screen.getByRole('button', { name: 'Удалить' }).getAttribute('data-size')).toBe('xs');
    expect(popup.className).toContain('rounded-lg');
  });

  it('opens next to an anchor without a trigger of its own, for «Ещё» menus', async () => {
    function Row() {
      const more = useRef<HTMLButtonElement>(null);
      const [confirming, setConfirming] = useState(false);
      return (
        <>
          <button ref={more} type="button" onClick={() => setConfirming(true)}>
            Ещё
          </button>
          <Popconfirm anchor={more} open={confirming} onOpenChange={setConfirming} tone="danger" title="Удалить сделку?" onConfirm={() => {}} />
        </>
      );
    }
    render(<Row />);
    open('Ещё');
    expect(await screen.findByRole('alertdialog', { name: 'Удалить сделку?' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it('forgets an old error when it opens again', async () => {
    const onConfirm = vi.fn(() => Promise.reject(new Error('offline')));
    render(<Send onConfirm={onConfirm} />);
    open('Отправить счёт');
    fireEvent.click(await screen.findByRole('button', { name: 'Отправить' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    await waitFor(() => expect(dialog()).toBeNull());
    open('Отправить счёт');
    await screen.findByRole('alertdialog');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
