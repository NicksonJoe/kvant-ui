import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TreeSelect, type TreeSelectNode } from '..';

const regions: TreeSelectNode[] = [
  {
    id: 'cfo',
    label: 'Центральный ФО',
    children: [
      {
        id: 'msk',
        label: 'Москва',
        children: [
          { id: 'north', label: 'Северный' },
          { id: 'south', label: 'Южный' },
          { id: 'vnukovo', label: 'Внуково-Карго' },
        ],
      },
      {
        id: 'tula',
        label: 'Тула',
        children: [
          { id: 'tula-1', label: 'Тула-1' },
          { id: 'tula-2', label: 'Тула-2' },
        ],
      },
    ],
  },
  {
    id: 'szfo',
    label: 'Северо-Западный ФО',
    children: [
      { id: 'spb', label: 'Санкт-Петербург' },
      { id: 'kgd', label: 'Калининград' },
    ],
  },
  { id: 'pfo', label: 'Приволжский ФО', hasChildren: true },
  { id: 'ufo', label: 'Уральский ФО', disabled: true, children: [{ id: 'ekb', label: 'Екатеринбург' }] },
];

const row = (name: string) => screen.getByRole('treeitem', { name });
const active = () => document.activeElement;

describe('TreeSelect · single', () => {
  it('opens a tree of collapsed branches with child counts', async () => {
    const user = userEvent.setup();
    render(<TreeSelect aria-label="Склад отгрузки" nodes={regions} placeholder="Все склады" />);
    const trigger = screen.getByRole('button', { name: 'Склад отгрузки' });
    expect(trigger.closest('[data-slot=tree-select]')?.textContent).toContain('Все склады');
    await user.click(trigger);
    const tree = await screen.findByRole('tree', { name: 'Склад отгрузки' });
    expect(within(tree).getAllByRole('treeitem')).toHaveLength(4);
    expect(row('Центральный ФО').getAttribute('aria-expanded')).toBe('false');
    expect(row('Центральный ФО').getAttribute('aria-level')).toBe('1');
    expect(row('Центральный ФО').textContent).toContain('5');
    expect(row('Северо-Западный ФО').textContent).toContain('2');
  });

  it('the chevron expands a branch; picking any node closes and shows the path', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TreeSelect aria-label="Склад отгрузки" nodes={regions} onValueChange={onValueChange} />);
    const trigger = screen.getByRole('button', { name: 'Склад отгрузки' });
    await user.click(trigger);
    await user.click(within(await screen.findByRole('treeitem', { name: 'Центральный ФО' })).getByTestId('tree-select-toggle'));
    expect(row('Центральный ФО').getAttribute('aria-expanded')).toBe('true');
    await user.click(within(row('Москва')).getByTestId('tree-select-toggle'));
    expect(row('Южный').getAttribute('aria-level')).toBe('3');
    await user.click(row('Южный'));
    expect(onValueChange).toHaveBeenLastCalledWith('south');
    await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
    const value = trigger.closest('[data-slot=tree-select]')?.querySelector('[data-slot=tree-select-value]');
    expect(value?.textContent).toBe('Центральный ФО / Москва / Южный');
    expect(value?.querySelector('.text-fg-3')?.textContent).toBe('Центральный ФО / Москва / ');
  });

  it('opens on the selected node with its ancestors expanded; keys walk the tree', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TreeSelect aria-label="Склад отгрузки" nodes={regions} defaultValue="south" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Склад отгрузки' }));
    await waitFor(() => expect(active()).toBe(row('Южный')));
    expect(row('Южный').getAttribute('aria-selected')).toBe('true');
    await user.keyboard('{ArrowUp}');
    expect(active()).toBe(row('Северный'));
    await user.keyboard('{ArrowLeft}');
    expect(active()).toBe(row('Москва'));
    await user.keyboard('{ArrowLeft}');
    expect(row('Москва').getAttribute('aria-expanded')).toBe('false');
    await user.keyboard('{ArrowRight}');
    expect(row('Москва').getAttribute('aria-expanded')).toBe('true');
    await user.keyboard('{ArrowRight}');
    expect(active()).toBe(row('Северный'));
    await user.keyboard('в');
    expect(active()).toBe(row('Внуково-Карго'));
    await user.keyboard('{Home}');
    expect(active()).toBe(row('Центральный ФО'));
    await user.keyboard('*');
    expect(row('Северо-Западный ФО').getAttribute('aria-expanded')).toBe('true');
    await user.keyboard('{End}');
    expect(active()).toBe(row('Екатеринбург'));
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('kgd');
  });

  it('a disabled node cannot be picked but still expands', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TreeSelect aria-label="Склад" nodes={regions} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Склад' }));
    const ufo = await screen.findByRole('treeitem', { name: 'Уральский ФО' });
    expect(ufo.getAttribute('aria-disabled')).toBe('true');
    await user.click(ufo);
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(within(ufo).getByTestId('tree-select-toggle'));
    expect(row('Екатеринбург')).toBeTruthy();
  });

  it('lazy children: expanding asks for them, a spinner while loading, «Повторить» after an error', async () => {
    const user = userEvent.setup();
    const onLoadChildren = vi.fn();
    const { rerender } = render(<TreeSelect aria-label="Склад" nodes={regions} onLoadChildren={onLoadChildren} />);
    await user.click(screen.getByRole('button', { name: 'Склад' }));
    await user.click(within(await screen.findByRole('treeitem', { name: 'Приволжский ФО' })).getByTestId('tree-select-toggle'));
    expect(onLoadChildren).toHaveBeenCalledWith(expect.objectContaining({ id: 'pfo' }));

    const loading = regions.map((node) => (node.id === 'pfo' ? { ...node, loading: true } : node));
    rerender(<TreeSelect aria-label="Склад" nodes={loading} onLoadChildren={onLoadChildren} />);
    expect(row('Приволжский ФО').getAttribute('aria-busy')).toBe('true');
    expect(row('Приволжский ФО').textContent).toContain('загружаем…');

    const failed = regions.map((node) => (node.id === 'pfo' ? { ...node, error: 'Не удалось загрузить' } : node));
    rerender(<TreeSelect aria-label="Склад" nodes={failed} onLoadChildren={onLoadChildren} />);
    expect(screen.getByText('Не удалось загрузить')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onLoadChildren).toHaveBeenCalledTimes(2);
  });

  it('disabled and invalid reach the trigger', () => {
    render(
      <>
        <TreeSelect aria-label="Закрытый" nodes={regions} disabled defaultValue="south" />
        <TreeSelect aria-label="С ошибкой" nodes={regions} invalid />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Закрытый' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'С ошибкой' }).getAttribute('aria-invalid')).toBe('true');
  });
});

describe('TreeSelect · multiple', () => {
  it('a parent checks every child; parents show «N из M», «все» or mixed', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TreeSelect multiple aria-label="Регионы" nodes={regions} defaultExpanded={['cfo']} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Регионы' }));
    const tree = await screen.findByRole('tree', { name: 'Регионы' });
    expect(tree.getAttribute('aria-multiselectable')).toBe('true');
    await user.click(row('Москва'));
    expect(onValueChange).toHaveBeenLastCalledWith(['north', 'south', 'vnukovo']);
    expect(row('Москва').getAttribute('aria-checked')).toBe('true');
    expect(row('Москва').textContent).toContain('все');
    expect(row('Центральный ФО').getAttribute('aria-checked')).toBe('mixed');
    expect(row('Центральный ФО').textContent).toContain('3 из 5');
    expect(row('Тула').getAttribute('aria-checked')).toBe('false');
    row('Тула').focus();
    await user.keyboard(' ');
    expect(onValueChange).toHaveBeenLastCalledWith(['north', 'south', 'vnukovo', 'tula-1', 'tula-2']);
    expect(row('Центральный ФО').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('tree').closest('[data-slot=tree-select-popup]')?.textContent).toContain('Выбрано: 5');
  });

  it('the field shows the topmost fully selected nodes as chips; a chip and «Сбросить» remove', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TreeSelect multiple aria-label="Регионы" nodes={regions} defaultValue={['north', 'south', 'vnukovo', 'spb']} onValueChange={onValueChange} />);
    const chips = document.querySelectorAll('[data-slot=tree-select-chip]');
    expect([...chips].map((chip) => chip.textContent)).toEqual(['Москва', 'Санкт-Петербург']);
    await user.click(screen.getByRole('button', { name: 'Убрать: Москва' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['spb']);
    await user.click(screen.getByRole('button', { name: 'Регионы' }));
    await user.click(await screen.findByRole('button', { name: 'Сбросить' }));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it('search keeps matches and their ancestors, counts them and selects them all; Esc clears it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TreeSelect multiple searchable aria-label="Регионы" nodes={regions} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Регионы' }));
    const search = await screen.findByRole('searchbox', { name: 'Поиск' });
    await waitFor(() => expect(active()).toBe(search));
    await user.type(search, 'тула');
    const names = within(screen.getByRole('tree')).getAllByRole('treeitem').map((item) => item.getAttribute('aria-label'));
    expect(names).toEqual(['Центральный ФО', 'Тула', 'Тула-1', 'Тула-2']);
    expect(row('Центральный ФО').getAttribute('data-ancestor')).toBe('');
    expect(screen.getByText('3 из 14')).toBeTruthy();
    expect(row('Тула-1').querySelector('mark')?.textContent).toBe('Тула');
    await user.click(screen.getByRole('button', { name: 'Выбрать все найденные' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['tula-1', 'tula-2']);
    await user.keyboard('{Escape}');
    expect((search as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('tree')).toBeTruthy();
    await user.type(search, 'ялта');
    expect(screen.getByText('Ничего не найдено')).toBeTruthy();
  });

  it('↓ from the search goes into the tree', async () => {
    const user = userEvent.setup();
    render(<TreeSelect multiple searchable aria-label="Регионы" nodes={regions} />);
    await user.click(screen.getByRole('button', { name: 'Регионы' }));
    const search = await screen.findByRole('searchbox', { name: 'Поиск' });
    search.focus();
    await user.keyboard('{ArrowDown}');
    expect(active()).toBe(row('Центральный ФО'));
    fireEvent.keyDown(row('Центральный ФО'), { key: 'Enter' });
    expect(row('Центральный ФО').getAttribute('aria-checked')).toBe('true');
  });
});
