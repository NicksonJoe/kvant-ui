import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bold, House, Mail, Undo2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import {
  AppBar,
  AppBarBack,
  Breadcrumb,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  Pagination,
  Steps,
  TabBar,
  TabBarItem,
  Toolbar,
  ToolbarButton,
  ToolbarToggle,
  TreeView,
  pageRange,
  type TreeNode,
} from '..';

describe('Breadcrumb', () => {
  const path = [
    { label: 'Главная', href: '/' },
    { label: 'Клиенты', href: '/clients' },
    { label: '«Студия Север»', href: '/clients/sever' },
    { label: 'Ребрендинг 2026', href: '/clients/sever/rebrand' },
    { label: 'Макеты логотипа' },
  ];

  it('marks the current page, collapses the middle into a menu and keeps one step back for phones', async () => {
    const user = userEvent.setup();
    render(<Breadcrumb items={path} />);
    const nav = screen.getByRole('navigation', { name: 'Путь' });
    expect(within(nav).getByText('Макеты логотипа').getAttribute('aria-current')).toBe('page');
    expect(within(nav).queryByRole('link', { name: 'Клиенты' })).toBeNull();
    expect(within(nav).getByRole('link', { name: 'Назад: Ребрендинг 2026' }).getAttribute('href')).toBe('/clients/sever/rebrand');

    await user.click(within(nav).getByRole('button', { name: 'Скрытые разделы' }));
    expect(await screen.findByRole('menuitem', { name: 'Клиенты' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: '«Студия Север»' })).toBeTruthy();
  });

  it('shows short paths in full', () => {
    render(<Breadcrumb items={path.slice(2)} />);
    expect(screen.getByRole('link', { name: '«Студия Север»' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Скрытые разделы' })).toBeNull();
  });
});

describe('Pagination', () => {
  it('keeps the first, the last and the neighbours of the current page', () => {
    expect(pageRange(5, 25)).toEqual([1, 'gap', 4, 5, 6, 'gap', 25]);
    expect(pageRange(1, 25)).toEqual([1, 2, 3, 'gap', 25]);
    expect(pageRange(4, 25)).toEqual([1, 2, 3, 4, 5, 'gap', 25]);
    expect(pageRange(25, 25)).toEqual([1, 'gap', 23, 24, 25]);
    expect(pageRange(2, 3)).toEqual([1, 2, 3]);
    expect(pageRange(1, 1)).toEqual([1]);
  });

  it('marks the current page and moves with the arrows', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination page={5} pageCount={25} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Страница 5' }).getAttribute('aria-current')).toBe('page');
    await user.click(screen.getByRole('button', { name: 'Страница 6' }));
    expect(onPageChange).toHaveBeenLastCalledWith(6);
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);

    rerender(<Pagination page={1} pageCount={25} onPageChange={onPageChange} labels={false} />);
    expect(screen.getByRole('button', { name: 'Предыдущая страница' }).hasAttribute('disabled')).toBe(true);

    rerender(<Pagination variant="compact" page={5} pageCount={25} onPageChange={onPageChange} />);
    expect(screen.getByText('5 / 25')).toBeTruthy();
  });
});

describe('Steps', () => {
  it('marks the current step, lets people go back to finished steps only and shows errors', async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(
      <Steps
        current={2}
        onStepClick={onStepClick}
        steps={[
          { title: 'Компания', description: 'ООО «Студия Север»' },
          { title: 'Реквизиты', error: 'ИНН не найден в ФНС' },
          { title: 'Тариф', description: 'Выберите план' },
          { title: 'Оплата', description: 'Счёт или карта' },
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[2]?.getAttribute('aria-current')).toBe('step');
    expect(screen.getByText('ИНН не найден в ФНС')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Компания/ }));
    expect(onStepClick).toHaveBeenCalledWith(0);
    expect(within(items[3] as HTMLElement).queryByRole('button')).toBeNull();
  });
});

describe('TabBar', () => {
  it('marks the current section and reads the unread count', () => {
    render(
      <TabBar aria-label="Разделы">
        <TabBarItem href="#home" icon={<House />} label="Сводка" />
        <TabBarItem href="#inbox" icon={<Mail />} label="Входящие" count={4} active />
      </TabBar>,
    );
    expect(screen.getByRole('navigation', { name: 'Разделы' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Входящие, 4 новых' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Сводка' }).hasAttribute('aria-current')).toBe(false);
  });
});

describe('TreeView', () => {
  const nodes: readonly TreeNode[] = [
    {
      id: 'sever',
      label: '«Студия Север»',
      children: [
        { id: 'contracts', label: 'Договоры', children: [{ id: 'c1', label: 'Договор № 24-117.pdf' }] },
        { id: 'brief', label: 'Бриф.docx' },
      ],
    },
    { id: 'polus', label: 'Полюс', children: [{ id: 'p1', label: 'Смета.pdf' }] },
  ];

  it('follows the WAI-ARIA tree keyboard model', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(<TreeView aria-label="Документы клиента" nodes={nodes} defaultExpanded={['sever']} onSelectedChange={onSelectedChange} />);
    const item = (name: string) => screen.getByRole('treeitem', { name });

    await user.tab();
    expect(document.activeElement).toBe(item('«Студия Север»'));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(item('Договоры'));
    expect(item('Договоры').getAttribute('aria-expanded')).toBe('false');

    await user.keyboard('{ArrowRight}');
    expect(item('Договоры').getAttribute('aria-expanded')).toBe('true');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(item('Договор № 24-117.pdf'));

    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(item('Договоры'));
    await user.keyboard('{ArrowLeft}');
    expect(item('Договоры').getAttribute('aria-expanded')).toBe('false');

    await user.keyboard('{End}');
    expect(document.activeElement).toBe(item('Полюс'));
    await user.keyboard('{Home}{Enter}');
    expect(onSelectedChange).toHaveBeenLastCalledWith('sever');
    expect(item('«Студия Север»').getAttribute('aria-selected')).toBe('true');
  });
});

describe('Toolbar', () => {
  it('toggles formatting and moves focus with arrows', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar aria-label="Форматирование">
        <ToolbarButton label="Отменить" icon={<Undo2 />} />
        <ToolbarToggle label="Жирный" icon={<Bold />} />
      </Toolbar>,
    );
    expect(screen.getByRole('toolbar', { name: 'Форматирование' })).toBeTruthy();
    const bold = screen.getByRole('button', { name: 'Жирный' });
    await user.click(bold);
    expect(bold.getAttribute('aria-pressed')).toBe('true');

    screen.getByRole('button', { name: 'Отменить' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(bold);
  });
});

describe('NavigationMenu', () => {
  it('opens a panel from its trigger and marks the current link', async () => {
    const user = userEvent.setup();
    render(
      <NavigationMenu aria-label="Основное меню">
        <NavigationMenuItem label="Возможности">
          <NavigationMenuLink href="#pipeline" title="Воронка сделок" description="Этапы и прогноз выручки" />
        </NavigationMenuItem>
        <NavigationMenuItem href="#pricing" label="Тарифы" active />
      </NavigationMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Возможности' });
    await user.click(trigger);
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('true'));
    expect(await screen.findByRole('link', { name: /Воронка сделок/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Тарифы' }).getAttribute('aria-current')).toBe('page');
  });
});

describe('AppBar', () => {
  it('names the screen, links back and reports scroll state', () => {
    render(<AppBar title="Сделка № 24-117" leading={<AppBarBack href="#deals" label="Сделки" />} scrolled />);
    expect(screen.getByRole('heading', { level: 1, name: 'Сделка № 24-117' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Сделки' }).getAttribute('href')).toBe('#deals');
    expect(screen.getByRole('banner').hasAttribute('data-scrolled')).toBe(true);
  });
});
