import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Dendrogram, MindMap, OrgChart, layoutTree, type TidyNode } from '..';

const leaf = (width = 10): TidyNode => ({ width });

describe('layoutTree', () => {
  it('spaces siblings by width and gap and centres the parent over its first and last child', () => {
    const { nodes, width } = layoutTree({ width: 30, children: [leaf(), leaf(), leaf()] }, 2);
    expect(nodes.map((node) => node.x)).toEqual([17, 5, 17, 29]);
    expect(nodes.map((node) => node.depth)).toEqual([0, 1, 1, 1]);
    expect(width).toBe(34);
  });

  it('packs subtrees by their contours: a shallow neighbour tucks in, a deep one keeps clear of every level', () => {
    const shallow = layoutTree({ width: 10, children: [{ width: 10, children: [leaf(), leaf(), leaf()] }, leaf()] }, 2);
    expect(shallow.nodes.map((node) => node.x)).toEqual([23, 17, 5, 17, 29, 29]);
    expect(shallow.width).toBe(34);

    const deep = layoutTree({ width: 10, children: [{ width: 10, children: [leaf(), leaf()] }, { width: 10, children: [leaf(), leaf()] }] }, 2);
    const [root, a, a1, a2, b, b1] = deep.nodes;
    expect((b?.x ?? 0) - (a?.x ?? 0)).toBe(24);
    expect((b1?.x ?? 0) - (a2?.x ?? 0)).toBe(12);
    expect(root?.x).toBe(((a?.x ?? 0) + (b?.x ?? 0)) / 2);
    expect(a1?.x).toBe(5);
  });

  it('never overlaps nodes on one level and gives the same result every time', () => {
    const tree: TidyNode = {
      width: 180,
      children: [
        { width: 118, children: [leaf(118), { width: 118, children: [leaf(118), leaf(118), leaf(118)] }] },
        leaf(118),
        { width: 118, children: [{ width: 118, children: [leaf(118)] }, leaf(118)] },
      ],
    };
    const first = layoutTree(tree, 10);
    expect(layoutTree(tree, 10)).toEqual(first);
    const widths = [180, 118, 118, 118, 118, 118, 118, 118, 118, 118, 118, 118];
    const boxes = first.nodes.map((node, i) => ({ depth: node.depth, left: node.x - (widths[i] ?? 0) / 2, right: node.x + (widths[i] ?? 0) / 2 }));
    for (const box of boxes) {
      for (const other of boxes) {
        if (box === other || box.depth !== other.depth) continue;
        expect(box.right + 10 <= other.left || other.right + 10 <= box.left).toBe(true);
      }
    }
    expect(Math.min(...boxes.map((box) => box.left))).toBe(0);
    expect(Math.max(...boxes.map((box) => box.right))).toBe(first.width);
  });
});

const org = {
  title: 'Анна Петрова',
  subtitle: 'Генеральный директор',
  value: 120,
  children: [
    {
      title: 'Сергей Ким',
      subtitle: 'Продажи',
      value: 38,
      children: [
        {
          title: 'Опт',
          subtitle: 'Игорь Лаптев',
          value: 14,
          children: [
            { title: 'Ключевые клиенты', subtitle: 'Вера Ким', value: 6 },
            { title: 'Регионы', subtitle: 'Глеб Носов', value: 8 },
          ],
        },
        { title: 'Розница', subtitle: 'Мария Орлова', value: 16 },
      ],
    },
    { title: 'Олег Белов', subtitle: 'Разработка', value: 34, children: [{ title: 'Платформа', subtitle: 'Лев Чен', value: 15 }] },
  ],
};

const item = (name: string) => screen.getByRole('treeitem', { name: new RegExp(`^${name}`) });
const box = (name: string) => {
  const el = item(name);
  return { x: Number(el.dataset.x), y: Number(el.dataset.y), width: Number(el.dataset.width) };
};

describe('OrgChart', () => {
  it('is a tree: levels, positions and expansion; deeper than three levels starts folded with a count', () => {
    render(<OrgChart aria-label="Оргструктура" data={org} />);
    const tree = screen.getByRole('tree', { name: 'Оргструктура' });
    expect(within(tree).getAllByRole('treeitem')).toHaveLength(6);
    expect(item('Анна Петрова').getAttribute('aria-level')).toBe('1');
    expect(item('Анна Петрова').getAttribute('aria-expanded')).toBe('true');
    expect(item('Сергей Ким').getAttribute('aria-setsize')).toBe('2');
    expect(item('Олег Белов').getAttribute('aria-posinset')).toBe('2');
    expect(item('Опт').getAttribute('aria-expanded')).toBe('false');
    expect(item('Розница').hasAttribute('aria-expanded')).toBe(false);
    expect(within(item('Опт')).getByText('+2')).toBeDefined();
    expect(screen.queryByRole('treeitem', { name: /Регионы/ })).toBeNull();
    expect(screen.getByRole('group', { name: 'Оргструктура' }).querySelectorAll('table tbody tr')).toHaveLength(8);
  });

  it('lays levels 110 apart, centres a parent over its children and keeps siblings clear', () => {
    render(<OrgChart aria-label="Оргструктура" data={org} layout="tree" />);
    const root = box('Анна Петрова');
    const sergey = box('Сергей Ким');
    const opt = box('Опт');
    const retail = box('Розница');
    expect([root.y, sergey.y, opt.y]).toEqual([0, 110, 220]);
    expect(root.width).toBe(180);
    expect(opt.width).toBe(118);
    expect(sergey.x + sergey.width / 2).toBe((opt.x + opt.width / 2 + retail.x + retail.width / 2) / 2);
    expect(retail.x - (opt.x + opt.width)).toBe(10);
    expect(document.querySelectorAll('[data-slot=org-chart-link]').length).toBe(5);
  });

  it('stacks leaves in a column under their parent when asked, keeping the upper levels a tree', () => {
    render(<OrgChart aria-label="Оргструктура" data={org} layout="stack" />);
    const sergey = box('Сергей Ким');
    const oleg = box('Олег Белов');
    expect([sergey.y, oleg.y]).toEqual([110, 110]);
    expect(box('Опт')).toMatchObject({ x: sergey.x + 12, y: 170 });
    expect(box('Розница')).toMatchObject({ x: sergey.x + 12, y: 230 });
    expect(box('Платформа')).toMatchObject({ x: oleg.x + 12, y: 170 });
    expect(oleg.x - (sergey.x + 130)).toBeGreaterThanOrEqual(10);
    expect(item('Опт').dataset.layout).toBe('stack');
  });

  it('switches to an indented list on request: 24 per level, one row per node', () => {
    render(<OrgChart aria-label="Оргструктура" data={org} layout="indent" />);
    expect(box('Анна Петрова')).toMatchObject({ x: 0, y: 0 });
    expect(box('Сергей Ким')).toMatchObject({ x: 24, y: 60 });
    expect(box('Опт')).toMatchObject({ x: 48, y: 120 });
    expect(box('Олег Белов')).toMatchObject({ x: 24, y: 240 });
  });

  it('moves with arrows, opens and closes branches and toggles with Enter and click', async () => {
    const user = userEvent.setup();
    render(<OrgChart aria-label="Оргструктура" data={org} />);
    await user.tab();
    expect(document.activeElement).toBe(item('Анна Петрова'));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(item('Сергей Ким'));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(item('Опт'));
    await user.keyboard('{ArrowRight}');
    expect(item('Опт').getAttribute('aria-expanded')).toBe('true');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(item('Ключевые клиенты'));
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(item('Опт'));
    await user.keyboard('{ArrowLeft}');
    expect(item('Опт').getAttribute('aria-expanded')).toBe('false');
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(item('Платформа'));
    await user.keyboard('{Home}{Enter}');
    expect(screen.getAllByRole('treeitem')).toHaveLength(1);
    await user.click(item('Анна Петрова'));
    expect(screen.getAllByRole('treeitem')).toHaveLength(6);
  });

  it('shows head count and share of the company in a tooltip on focus', async () => {
    const user = userEvent.setup();
    render(<OrgChart aria-label="Оргструктура" data={org} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    const tooltip = document.querySelector('[data-slot=chart-tooltip]') as HTMLElement;
    expect(within(tooltip).getByText('Сергей Ким')).toBeDefined();
    expect(within(tooltip).getByText('38')).toBeDefined();
    expect(within(tooltip).getByText('31,7 %')).toBeDefined();
  });
});

const baskets = {
  height: 6.4,
  children: [
    { label: 'Хозтовары', height: 0.9, children: [{ label: 'Порошок' }, { label: 'Губки' }] },
    {
      height: 4.2,
      children: [
        { label: 'Завтрак', height: 1, children: [{ label: 'Печенье' }, { label: 'Шоколад' }] },
        { label: 'Молочное и хлеб', height: 1.5, children: [{ label: 'Хлеб' }, { label: 'Сыр' }] },
      ],
    },
  ],
};

describe('Dendrogram', () => {
  it('lists leaves in merge order and colours the groups below the cut, links above it in fg-4', () => {
    render(<Dendrogram aria-label="Какие товары покупают вместе" data={baskets} cut={2} />);
    const labels = [...document.querySelectorAll('[data-slot=dendrogram-leaf]')].map((leafEl) => leafEl.textContent);
    expect(labels).toEqual(['Порошок', 'Губки', 'Печенье', 'Шоколад', 'Хлеб', 'Сыр']);
    expect(screen.getByText('срез: 3 группы')).toBeDefined();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Хозтовары', 'Завтрак', 'Молочное и хлеб']);
    const links = [...document.querySelectorAll<SVGPathElement>('[data-slot=dendrogram-link]')];
    expect(links.map((link) => link.dataset.group ?? '-')).toEqual(['-', '0', '-', '1', '2']);
    expect(links[1]?.getAttribute('stroke')).toBe('var(--color-chart-1)');
    expect(links[0]?.getAttribute('stroke')).toBe('var(--color-fg-4)');
    expect(document.querySelector('[data-slot=dendrogram-cut]')).not.toBeNull();
  });

  it('draws one colour and no cut line without a cut', () => {
    render(<Dendrogram aria-label="Корзины" data={baskets} />);
    expect(document.querySelector('[data-slot=dendrogram-cut]')).toBeNull();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('steps through leaves with arrows: tooltip and spoken group, nearest neighbour and distance', async () => {
    const user = userEvent.setup();
    render(<Dendrogram aria-label="Корзины" data={baskets} cut={2} />);
    const plot = screen.getByRole('group', { name: 'Корзины' });
    plot.focus();
    await user.keyboard('{ArrowDown}');
    expect(plot.querySelector('[aria-live]')?.textContent).toBe('Порошок: Хозтовары, ближе всего: Губки, расстояние 0,9');
    await user.keyboard('{End}{ArrowUp}');
    expect(plot.querySelector('[aria-live]')?.textContent).toBe('Хлеб: Молочное и хлеб, ближе всего: Сыр, расстояние 1,5');
    const tooltip = document.querySelector('[data-slot=chart-tooltip]') as HTMLElement;
    expect(within(tooltip).getByText('Хлеб')).toBeDefined();
    expect(within(tooltip).getByText('Молочное и хлеб')).toBeDefined();
    expect(within(plot).getByRole('table')).toBeDefined();
  });
});

const plan = {
  label: 'Запуск Kvant 2.0',
  children: [
    { label: 'Продукт', children: [{ label: 'Тариф «Про»' }, { label: 'Офлайн-режим' }, { label: 'Импорт из 1С' }] },
    { label: 'Маркетинг', children: [{ label: 'Лендинг' }, { label: 'Вебинар' }, { label: 'Партнёры' }] },
    { label: 'Продажи', children: [{ label: 'Скрипт демо' }, { label: 'Скидка до 31.12' }] },
    { label: 'Поддержка', children: [{ label: 'База знаний' }, { label: 'Обучение' }, { label: 'Чат 24/7' }] },
    { label: 'Метрики', children: [{ label: 'MRR' }, { label: 'Отток' }] },
  ],
};

describe('MindMap', () => {
  it('splits branches left and right evenly by leaves, colours them in order and thins lines towards leaves', () => {
    render(<MindMap aria-label="План запуска" data={plan} side="both" />);
    expect(screen.getByRole('tree', { name: 'План запуска' })).toBeDefined();
    expect(screen.getAllByRole('treeitem')).toHaveLength(19);
    const sides = ['Продукт', 'Маркетинг', 'Продажи', 'Поддержка', 'Метрики'].map((name) => item(name).dataset.side);
    expect(sides).toEqual(['left', 'left', 'right', 'right', 'right']);
    const links = [...document.querySelectorAll<SVGPathElement>('[data-slot=mind-map-link]')];
    expect(links).toHaveLength(18);
    const branch = links.find((link) => link.dataset.depth === '1');
    const twig = links.find((link) => link.dataset.depth === '2');
    expect(branch?.getAttribute('stroke-width')).toBe('3');
    expect(twig?.getAttribute('stroke-width')).toBe('1.5');
    expect(links.filter((link) => link.getAttribute('stroke') === 'var(--color-chart-3)')).toHaveLength(3);
  });

  it('puts every branch on the right when asked', () => {
    render(<MindMap aria-label="План запуска" data={plan} side="right" />);
    expect(screen.getAllByRole('treeitem').filter((el) => el.dataset.side === 'left')).toHaveLength(0);
  });

  it('walks the map like a tree and folds a branch to a count', async () => {
    const user = userEvent.setup();
    render(<MindMap aria-label="План запуска" data={plan} />);
    await user.tab();
    expect(document.activeElement).toBe(item('Запуск Kvant 2.0'));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(item('Продукт'));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(item('Тариф «Про»'));
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(item('Продукт').getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('treeitem', { name: 'Тариф «Про»' })).toBeNull();
    expect(within(item('Продукт')).getByText('+3')).toBeDefined();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('treeitem', { name: 'Тариф «Про»' })).toBeDefined();
  });
});
