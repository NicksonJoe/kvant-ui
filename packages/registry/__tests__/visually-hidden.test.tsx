import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Announce, SkipLink, VisuallyHidden } from '..';

describe('VisuallyHidden', () => {
  it('names an icon button without showing the text', () => {
    render(
      <button type="button">
        <svg aria-hidden />
        <VisuallyHidden>Изменить сделку «Айдентика»</VisuallyHidden>
      </button>,
    );
    const hidden = screen.getByText('Изменить сделку «Айдентика»');
    expect(screen.getByRole('button', { name: 'Изменить сделку «Айдентика»' })).toBeDefined();
    expect(hidden.tagName).toBe('SPAN');
    expect(hidden.getAttribute('data-slot')).toBe('visually-hidden');
    expect(hidden.className.split(' ')).toContain('sr-only');
  });

  it('takes another tag through render', () => {
    render(<VisuallyHidden render={<h2 />}>Фильтры</VisuallyHidden>);
    expect(screen.getByRole('heading', { level: 2, name: 'Фильтры' }).className.split(' ')).toContain('sr-only');
  });
});

describe('SkipLink', () => {
  it('links to #main with the default label and is hidden until focused', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: 'Перейти к содержимому' });
    expect(link.getAttribute('href')).toBe('#main');
    expect(link.getAttribute('data-slot')).toBe('skip-link');
    expect(link.className.split(' ')).toContain('not-focus:sr-only');
  });

  it('moves focus to the target past the menu', () => {
    render(
      <>
        <SkipLink />
        <nav>
          <a href="/deals">Сделки</a>
        </nav>
        <main id="main">Содержимое</main>
      </>,
    );
    const main = screen.getByRole('main');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    screen.getByRole('link', { name: 'Перейти к содержимому' }).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(main);
  });

  it('keeps an existing tabindex and leaves the click alone without a target', () => {
    render(
      <>
        <SkipLink href="#results">К результатам</SkipLink>
        <section id="results" tabIndex={0}>
          Результаты
        </section>
      </>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'К результатам' }));
    expect(screen.getByText('Результаты').getAttribute('tabindex')).toBe('0');

    const lost = new MouseEvent('click', { bubbles: true, cancelable: true });
    render(<SkipLink href="#nowhere">Мимо</SkipLink>);
    screen.getByRole('link', { name: 'Мимо' }).dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(false);
  });
});

describe('Announce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const region = () => document.querySelector('[data-slot=announce]');

  it('polite: role="status", aria-live="polite", hidden, empty until the first announcement', () => {
    render(<Announce />);
    const live = region();
    expect(live?.getAttribute('role')).toBe('status');
    expect(live?.getAttribute('aria-live')).toBe('polite');
    expect(live?.getAttribute('aria-atomic')).toBe('true');
    expect(live?.className.split(' ')).toContain('sr-only');
    expect(live?.textContent).toBe('');
  });

  it('assertive: role="alert", aria-live="assertive"', () => {
    render(<Announce politeness="assertive">Не удалось сохранить — нет сети</Announce>);
    expect(region()?.getAttribute('role')).toBe('alert');
    expect(region()?.getAttribute('aria-live')).toBe('assertive');
  });

  it('mounts empty and writes the first text a beat later, so a region shown with its text is still read', () => {
    render(<Announce>Сохранено</Announce>);
    expect(region()?.textContent).toBe('');
    act(() => vi.advanceTimersByTime(100));
    expect(region()?.textContent).toBe('Сохранено');
  });

  it('changes only the text: the region element stays the same', () => {
    const { rerender } = render(<Announce />);
    const live = region();
    rerender(<Announce>Загружено 20 клиентов</Announce>);
    expect(region()).toBe(live);
    expect(live?.textContent).toBe('Загружено 20 клиентов');
    rerender(<Announce>Загружено 40 клиентов</Announce>);
    expect(live?.textContent).toBe('Загружено 40 клиентов');
  });

  it('does not repeat the same text within 2 s, repeats it after', () => {
    const { rerender } = render(<Announce />);
    rerender(<Announce>Сохранено</Announce>);
    expect(region()?.textContent).toBe('Сохранено');
    rerender(<Announce>{''}</Announce>);
    expect(region()?.textContent).toBe('');
    act(() => vi.advanceTimersByTime(1500));
    rerender(<Announce>Сохранено</Announce>);
    expect(region()?.textContent).toBe('');
    rerender(<Announce>{''}</Announce>);
    act(() => vi.advanceTimersByTime(600));
    rerender(<Announce>Сохранено</Announce>);
    expect(region()?.textContent).toBe('Сохранено');
  });

  it('never moves focus', () => {
    render(
      <>
        <input aria-label="Название" />
        <Announce />
      </>,
    );
    const input = screen.getByRole('textbox');
    input.focus();
    render(<Announce politeness="assertive">Не удалось сохранить</Announce>);
    act(() => vi.advanceTimersByTime(100));
    expect(document.activeElement).toBe(input);
  });
});
