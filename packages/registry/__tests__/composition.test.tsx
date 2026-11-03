import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, type ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, mergeProps, useRender } from '..';

// Stand-in for a router link: computes href from `to` and spreads the rest onto <a>.
function RouterLink({ to, ...props }: ComponentProps<'a'> & { to: string }) {
  return <a {...props} href={to} />;
}

const errors = vi.spyOn(console, 'error');
afterEach(() => errors.mockClear());

describe('Button render', () => {
  it('stays a native <button type="button"> without render', () => {
    const create = vi.fn();
    render(<Button onClick={create}>Создать сделку</Button>);
    const button = screen.getByRole('button', { name: 'Создать сделку' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('renders <a href> with the button look and link semantics', () => {
    render(<Button render={<a href="/deals/new" />}>Создать сделку</Button>);
    const link = screen.getByRole('link', { name: 'Создать сделку' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/deals/new');
    expect(link.hasAttribute('role')).toBe(false);
    expect(link.hasAttribute('type')).toBe(false);
    expect(link.getAttribute('data-slot')).toBe('button');
    expect(link.getAttribute('data-variant')).toBe('primary');
    expect(link.className).toContain('bg-accent');
    expect(screen.queryByRole('button')).toBeNull();
    expect(errors).not.toHaveBeenCalled();
  });

  it('composes with a router link: handlers merge, className joins, href comes from the router', () => {
    const own = vi.fn();
    const button = vi.fn();
    render(
      <Button className="w-full" onClick={button} render={<RouterLink to="/deals/new" onClick={own} className="mt-2" />}>
        Создать сделку
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Создать сделку' });
    expect(link.getAttribute('href')).toBe('/deals/new');
    expect(link.className).toContain('w-full');
    expect(link.className).toContain('mt-2');
    expect(link.className).toContain('bg-accent');
    fireEvent.click(link);
    expect(own).toHaveBeenCalledTimes(1);
    expect(button).toHaveBeenCalledTimes(1);
  });

  it('passes the state to a render function', () => {
    render(<Button disabled render={(props, state) => <a {...props} data-state-disabled={String(state.disabled)} />}>Выставить счёт</Button>);
    expect(screen.getByText('Выставить счёт').closest('a')?.getAttribute('data-state-disabled')).toBe('true');
  });

  it('a disabled link-button keeps focus, drops href and does not navigate', () => {
    const click = vi.fn();
    render(
      <Button variant="secondary" disabled onClick={click} render={<a href="/invoices/new" />}>
        Выставить счёт
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Выставить счёт' });
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.hasAttribute('data-disabled')).toBe(true);
    expect(link.tabIndex).toBe(0);
    link.focus();
    expect(document.activeElement).toBe(link);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(click).not.toHaveBeenCalled();
  });

  it('a disabled router link-button does not navigate: the click arrives prevented', () => {
    render(
      <Button disabled render={<RouterLink to="/invoices/new" />}>
        Выставить счёт
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Выставить счёт' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.tabIndex).toBe(0);
  });

  it('forwards ref to the final tag', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} render={<a href="/deals/new" />}>
        Создать сделку
      </Button>,
    );
    expect(ref.current?.tagName).toBe('A');
  });
});

describe('useRender and mergeProps', () => {
  function Segment({ selected = false, render, ...props }: useRender.ComponentProps<'button'> & { selected?: boolean }) {
    return useRender({
      defaultTagName: 'button',
      render,
      state: { selected },
      props: mergeProps<'button'>({ type: 'button', className: 'px-3.5' }, props, { 'data-slot': 'segment' } as ComponentProps<'button'>),
    });
  }

  it('turns state into data-* attributes and joins className', () => {
    render(
      <>
        <Segment selected className="rounded-full">
          Сделки
        </Segment>
        <Segment>Задачи</Segment>
      </>,
    );
    const deals = screen.getByRole('button', { name: 'Сделки' });
    expect(deals.getAttribute('data-selected')).toBe('');
    expect(deals.getAttribute('data-slot')).toBe('segment');
    expect(deals.className.split(' ').sort()).toEqual(['px-3.5', 'rounded-full']);
    expect(screen.getByRole('button', { name: 'Задачи' }).hasAttribute('data-selected')).toBe(false);
  });

  it('swaps the tag through render', () => {
    render(<Segment render={<a href="/tasks" />}>Задачи</Segment>);
    expect(screen.getByRole('link', { name: 'Задачи' }).getAttribute('data-slot')).toBe('segment');
  });
});
