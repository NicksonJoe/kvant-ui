import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Alert, Banner, Meter, NavigationProgress, ToastProvider, toast } from '..';

describe('Alert', () => {
  it('reads as an alert only for danger', () => {
    render(
      <>
        <Alert tone="danger" title="Платёж не прошёл">
          Банк отклонил списание 4 500 ₽.
        </Alert>
        <Alert tone="success" variant="outline" title="Почта подключена">
          Письма клиентов прикрепляются к сделкам автоматически.
        </Alert>
      </>,
    );
    expect(screen.getByRole('alert').textContent).toContain('Платёж не прошёл');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    const success = screen.getByText('Почта подключена').closest('[data-slot="alert"]');
    expect(success?.getAttribute('data-tone')).toBe('success');
    expect(success?.getAttribute('data-variant')).toBe('outline');
  });
});

describe('Banner', () => {
  it('closes with the button; a danger banner has none', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <>
        <Banner onDismiss={onDismiss}>Плановые работы 30 октября с 02:00 до 04:00 МСК.</Banner>
        <Banner tone="danger" onDismiss={onDismiss}>
          Нет связи с сервером.
        </Banner>
      </>,
    );
    const close = screen.getAllByRole('button', { name: 'Закрыть баннер' });
    expect(close).toHaveLength(1);
    await user.click(close[0] as HTMLElement);
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

describe('Meter', () => {
  it('is a meter whose zone follows the thresholds', () => {
    render(
      <>
        <Meter label="Хранилище" value={42} valueLabel="4,2 из 10 ГБ" />
        <Meter label="Места в тарифе" value={72} />
        <Meter label="Письма за октябрь" value={93} />
      </>,
    );
    const [storage, seats, mail] = screen.getAllByRole('meter');
    expect(storage?.getAttribute('aria-valuenow')).toBe('42');
    expect(storage?.getAttribute('aria-valuetext')).toBe('4,2 из 10 ГБ');
    expect(storage?.getAttribute('data-zone')).toBe('normal');
    expect(seats?.getAttribute('data-zone')).toBe('warning');
    expect(mail?.getAttribute('data-zone')).toBe('critical');
    expect(screen.getByText('4,2 из 10 ГБ')).toBeTruthy();
  });
});

describe('NavigationProgress', () => {
  afterEach(() => vi.useRealTimers());

  const bar = () => document.querySelector<HTMLElement>('[data-slot="navigation-progress"]');
  const width = () => parseFloat(bar()?.style.getPropertyValue('--kv-progress') ?? 'NaN');

  it('appears after 150 ms, trickles below 90 % and completes when loading ends', () => {
    vi.useFakeTimers();
    const { rerender } = render(<NavigationProgress loading />);
    act(() => vi.advanceTimersByTime(140));
    expect(bar()).toBeNull();
    act(() => vi.advanceTimersByTime(20));
    expect(width()).toBe(15);
    act(() => vi.advanceTimersByTime(400));
    expect(width()).toBeGreaterThan(15);
    act(() => vi.advanceTimersByTime(60_000));
    expect(width()).toBeLessThanOrEqual(90);

    rerender(<NavigationProgress loading={false} />);
    act(() => vi.advanceTimersByTime(10));
    expect(width()).toBe(100);
    expect(bar()?.getAttribute('data-state')).toBe('done');
    act(() => vi.advanceTimersByTime(400));
    expect(bar()).toBeNull();
  });

  it('never shows for a transition shorter than 150 ms', () => {
    vi.useFakeTimers();
    const { rerender } = render(<NavigationProgress loading />);
    act(() => vi.advanceTimersByTime(100));
    rerender(<NavigationProgress loading={false} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(bar()).toBeNull();
  });
});

describe('toast defaults', () => {
  afterEach(() => {
    act(() => toast.close());
    vi.useRealTimers();
  });

  // A closing toast stays in the DOM for its exit, marked with data-ending-style; urgent ones are also copied
  // into an assertive live region, hence queryAll.
  const alive = (title: string) =>
    screen
      .queryAllByText(title)
      .some((element) => element.closest('[data-slot="toast"]')?.hasAttribute('data-ending-style') === false);

  it('keeps errors and toasts with an action for 8 s instead of 4 s', () => {
    vi.useFakeTimers();
    render(<ToastProvider>{null}</ToastProvider>);
    act(() => {
      toast.add({ title: 'Ссылка скопирована' });
      toast.add({ type: 'danger', title: 'Не удалось отправить счёт' });
      toast.add({ title: 'Сделка в архиве', actionProps: { children: 'Отменить', onClick: () => {} } });
    });
    act(() => vi.advanceTimersByTime(4100));
    expect(alive('Ссылка скопирована')).toBe(false);
    expect(alive('Не удалось отправить счёт')).toBe(true);
    expect(alive('Сделка в архиве')).toBe(true);
    act(() => vi.advanceTimersByTime(4000));
    expect(alive('Не удалось отправить счёт')).toBe(false);
    expect(alive('Сделка в архиве')).toBe(false);
  });
});
