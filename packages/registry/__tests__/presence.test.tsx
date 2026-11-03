import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Presence } from '..';

const node = () => document.querySelector('[data-slot=presence]');
const frames = () => act(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

afterEach(() => vi.restoreAllMocks());

describe('Presence', () => {
  it('renders nothing while not present', () => {
    render(<Presence present={false}>Анна Соколова</Presence>);
    expect(node()).toBeNull();
  });

  it('mounts with data-starting-style and drops it after the first painted frame', async () => {
    render(<Presence present>Анна Соколова</Presence>);
    expect(node()?.hasAttribute('data-starting-style')).toBe(true);
    await waitFor(() => expect(node()?.hasAttribute('data-starting-style')).toBe(false));
    expect(node()?.textContent).toBe('Анна Соколова');
  });

  it('keeps the element with data-ending-style until its exit animations finish, then unmounts', async () => {
    let finish = () => {};
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ finished } as unknown as Animation]);

    const { rerender } = render(<Presence present>Анна Соколова</Presence>);
    await frames();
    rerender(<Presence present={false}>Анна Соколова</Presence>);
    expect(node()?.hasAttribute('data-ending-style')).toBe(true);
    await frames();
    expect(node()).not.toBeNull();

    await act(async () => finish());
    expect(node()).toBeNull();
  });

  it('reports the end of the exit once, so the row can leave the data', async () => {
    const onExitComplete = vi.fn();
    const { rerender } = render(
      <Presence present motion="collapse" onExitComplete={onExitComplete}>
        <div>Мария Ветрова</div>
      </Presence>,
    );
    await frames();
    expect(onExitComplete).not.toHaveBeenCalled();
    rerender(
      <Presence present={false} motion="collapse" onExitComplete={onExitComplete}>
        <div>Мария Ветрова</div>
      </Presence>,
    );
    await waitFor(() => expect(node()).toBeNull());
    expect(onExitComplete).toHaveBeenCalledTimes(1);
  });

  it('unmounts right away when nothing animates', async () => {
    const { rerender } = render(<Presence present>Анна Соколова</Presence>);
    rerender(<Presence present={false}>Анна Соколова</Presence>);
    await waitFor(() => expect(node()).toBeNull());
  });

  it('stays when shown again during the exit, without restarting the enter', async () => {
    vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ finished: new Promise(() => {}) } as unknown as Animation]);
    const { rerender } = render(<Presence present>Анна Соколова</Presence>);
    await frames();
    rerender(<Presence present={false}>Анна Соколова</Presence>);
    rerender(<Presence present>Анна Соколова</Presence>);
    const element = node();
    expect(element?.hasAttribute('data-ending-style')).toBe(false);
    expect(element?.hasAttribute('data-starting-style')).toBe(false);
    await frames();
    expect(node()).toBe(element);
  });

  it('enters again from the starting style after a full exit', async () => {
    const { rerender } = render(<Presence present>Анна Соколова</Presence>);
    rerender(<Presence present={false}>Анна Соколова</Presence>);
    await waitFor(() => expect(node()).toBeNull());
    rerender(<Presence present>Анна Соколова</Presence>);
    expect(node()?.hasAttribute('data-starting-style')).toBe(true);
  });

  it.each(['fade', 'rise', 'collapse'] as const)('marks the %s motion for the kv-presence recipe', (motion) => {
    render(
      <Presence present motion={motion}>
        Строка
      </Presence>,
    );
    expect(node()?.getAttribute('data-motion')).toBe(motion);
    expect(node()?.classList.contains('kv-presence')).toBe(true);
  });

  it('fades by default', () => {
    render(<Presence present>Строка</Presence>);
    expect(node()?.getAttribute('data-motion')).toBe('fade');
  });

  it('passes the row index to the cascade as --kv-i', () => {
    render(
      <Presence present motion="rise" index={3} className="py-2">
        Ирина Лебедева
      </Presence>,
    );
    const element = node() as HTMLElement;
    expect(element.style.getPropertyValue('--kv-i')).toBe('3');
    expect(element.classList.contains('py-2')).toBe(true);
  });

  it('renders the element given in render, e.g. a list row', () => {
    render(
      <ul>
        <Presence present render={<li />}>
          Мария Ветрова
        </Presence>
      </ul>,
    );
    expect(screen.getByRole('listitem').getAttribute('data-slot')).toBe('presence');
  });
});
