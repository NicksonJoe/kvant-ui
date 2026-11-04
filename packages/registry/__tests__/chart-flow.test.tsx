import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ArcDiagramChart,
  ChordChart,
  CohortChart,
  FunnelChart,
  NetworkChart,
  SankeyChart,
  WaterfallChart,
  chordLayout,
  networkLayout,
  sankeyLayout,
  waterfallLayout,
} from '..';

const slots = (name: string) => [...document.querySelectorAll<SVGElement>(`[data-slot=${name}]`)];
const num = (el: Element | undefined, attr: string) => Number(el?.getAttribute(attr));
// what is drawn, not the screen-reader table or the live region
const visible = (text: string) => screen.getAllByText(text, { ignore: 'table *, [aria-live], script, style' });

type Rect = { x0: number; y0: number; x1: number; y1: number };
const box = (el: Element): Rect => {
  const [x0 = 0, y0 = 0, x1 = 0, y1 = 0] = (el.getAttribute('data-box') ?? '').split(' ').map(Number);
  return { x0, y0, x1, y1 };
};
const overlap = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** Makes useWidth see a container of `width` px (the jsdom stub never reports a size). */
const realObserver = globalThis.ResizeObserver;
function containerWidth(width: number) {
  globalThis.ResizeObserver = class implements ResizeObserver {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {
      this.callback([{ contentRect: { width } } as unknown as ResizeObserverEntry], this);
    }
    unobserve() {}
    disconnect() {}
  };
}
afterEach(() => {
  globalThis.ResizeObserver = realObserver;
});

/* ---------- Funnel ---------- */

const funnel = [
  { label: 'Посетители', value: 48000 },
  { label: 'Карточка товара', value: 21600 },
  { label: 'Корзина', value: 6480 },
  { label: 'Оформление', value: 3240 },
  { label: 'Оплата', value: 2590 },
];

describe('FunnelChart', () => {
  it('draws bars from a common zero, the step conversion and the total', () => {
    render(<FunnelChart aria-label="Воронка заказа" data={funnel} />);
    expect(screen.getByRole('group', { name: 'Воронка заказа' })).toBeDefined();
    const bars = slots('funnel-bar');
    expect(bars).toHaveLength(5);
    expect(num(bars[1], 'data-width') / num(bars[0], 'data-width')).toBeCloseTo(0.45, 2);
    expect(visible('→ 45 %')).toHaveLength(1);
    expect(visible('→ 80 %')).toHaveLength(1);
    expect(visible('итого 5,4 %')).toHaveLength(1);
    expect(visible('48 000')).toHaveLength(1);
  });

  it('steps through the funnel with ↓ ↑ Home End, announcing and showing a tooltip', async () => {
    const user = userEvent.setup();
    render(<FunnelChart aria-label="Воронка заказа" data={funnel} />);
    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByText(/^Карточка товара: 21 600/, { selector: '[aria-live]' })).toBeDefined();
    expect(document.querySelector('[data-slot=chart-tooltip]')).not.toBeNull();
    await user.keyboard('{End}');
    expect(screen.getByText(/^Оплата: 2 590/, { selector: '[aria-live]' })).toBeDefined();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByText(/^Оформление/, { selector: '[aria-live]' })).toBeDefined();
  });

  it('shows the tooltip on hover and hides it on leave', async () => {
    const user = userEvent.setup();
    render(<FunnelChart aria-label="Воронка заказа" data={funnel} />);
    const rows = slots('funnel-row');
    await user.hover(rows[2] as Element);
    const tooltip = document.querySelector<HTMLElement>('[data-slot=chart-tooltip]');
    expect(tooltip && within(tooltip).getByText('Корзина')).toBeTruthy();
    await user.unhover(rows[2] as Element);
    expect(document.querySelector('[data-slot=chart-tooltip]')).toBeNull();
  });
});

/* ---------- Waterfall ---------- */

const bridge = [
  { label: 'План', value: 5.0e6, total: true },
  { label: 'Новые клиенты', value: 0.9e6 },
  { label: 'Допродажи', value: 0.4e6 },
  { label: 'Отток', value: -0.7e6 },
  { label: 'Скидки', value: -0.3e6 },
  { label: 'Сезон', value: -0.2e6 },
  { label: 'Факт', total: true },
];
const millions = (value: number) => (value / 1e6).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

describe('waterfallLayout', () => {
  it('hangs each step on the previous total and sums the totals', () => {
    const bars = waterfallLayout(bridge);
    expect(bars.map((bar) => bar.kind)).toEqual(['total', 'up', 'up', 'down', 'down', 'down', 'total']);
    expect(bars[1]).toMatchObject({ start: 5e6, end: 5.9e6 });
    expect(bars[3]).toMatchObject({ start: 6.3e6, end: 5.6e6 });
    expect(bars[6]?.start).toBe(0);
    expect(bars[6]?.end).toBeCloseTo(5.1e6);
  });
});

describe('WaterfallChart', () => {
  it('colours totals, growth and losses and signs every step', () => {
    render(<WaterfallChart aria-label="От плана к факту" data={bridge} formatValue={millions} />);
    const bars = slots('waterfall-bar');
    expect(bars.map((bar) => bar.getAttribute('data-kind'))).toEqual(['total', 'up', 'up', 'down', 'down', 'down', 'total']);
    expect(bars[0]?.getAttribute('fill')).toBe('var(--color-fg-3)');
    expect(bars[1]?.getAttribute('fill')).toBe('var(--color-chart-1)');
    expect(bars[3]?.getAttribute('fill')).toBe('var(--color-chart-2)');
    expect(visible('+0,9')).toHaveLength(1);
    expect(visible('−0,7')).toHaveLength(1);
    expect(visible('5,1')).toHaveLength(1);
    expect(slots('waterfall-connector')).toHaveLength(6);
    expect(visible('Итог')).toHaveLength(1);
    expect(visible('Потеря')).toHaveLength(1);
  });

  it('a loss hangs from the previous level down; the connector sits on that level', () => {
    render(<WaterfallChart aria-label="От плана к факту" data={bridge} formatValue={millions} />);
    const bars = slots('waterfall-bar');
    const connectors = slots('waterfall-connector');
    const loss = bars[3];
    // the loss starts at the level the previous connector marks
    expect(num(loss, 'y')).toBeCloseTo(num(connectors[2], 'y1'), 5);
    expect(num(bars[6], 'data-end')).toBeCloseTo(5.1e6);
  });

  it('steps with ← → and announces the change and the running total', async () => {
    const user = userEvent.setup();
    render(<WaterfallChart aria-label="От плана к факту" data={bridge} formatValue={millions} />);
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(screen.getByText('Отток: −0,7, итог 5,6', { selector: '[aria-live]' })).toBeDefined();
    expect(document.querySelector('[data-slot=chart-tooltip]')).not.toBeNull();
  });
});

/* ---------- Sankey ---------- */

const journeyNodes = [
  { id: 'search', label: 'Поиск' },
  { id: 'ads', label: 'Реклама' },
  { id: 'social', label: 'Соцсети' },
  { id: 'partners', label: 'Партнёры' },
  { id: 'site', label: 'Сайт' },
  { id: 'app', label: 'Приложение' },
  { id: 'buy', label: 'Покупка' },
  { id: 'left', label: 'Ушли' },
];
const journeyLinks = [
  { source: 'search', target: 'site', value: 3000 },
  { source: 'search', target: 'app', value: 1200 },
  { source: 'ads', target: 'site', value: 1900 },
  { source: 'ads', target: 'app', value: 1200 },
  { source: 'social', target: 'site', value: 900 },
  { source: 'social', target: 'app', value: 1000 },
  { source: 'partners', target: 'site', value: 600 },
  { source: 'partners', target: 'app', value: 200 },
  { source: 'site', target: 'buy', value: 341 },
  { source: 'site', target: 'left', value: 6059 },
  { source: 'app', target: 'buy', value: 249 },
  { source: 'app', target: 'left', value: 3351 },
];

describe('sankeyLayout', () => {
  const layout = sankeyLayout(journeyNodes, journeyLinks, { x0: 96, x1: 1132, height: 300 });
  const node = (id: string) => layout.nodes.find((item) => item.id === id);

  it('puts nodes in topological columns and stretches every column to the full height', () => {
    expect(layout.columns).toBe(3);
    expect(['search', 'ads', 'social', 'partners'].map((id) => node(id)?.column)).toEqual([0, 0, 0, 0]);
    expect(node('site')?.column).toBe(1);
    expect(node('left')?.column).toBe(2);
    expect(node('search')?.x0).toBe(96);
    expect(node('left')?.x1).toBe(1132);
    expect(node('search')?.y0).toBe(0);
    expect(node('partners')?.y1).toBeCloseTo(300);
    expect(node('left')?.y1).toBeCloseTo(300);
  });

  it('sizes nodes by the sum of their flows and keeps 16 px between them in the densest column', () => {
    const search = node('search');
    const ads = node('ads');
    const site = node('site');
    if (!search || !ads || !site) throw new Error('missing nodes');
    expect(search.value).toBe(4200);
    expect(site.value).toBe(6400);
    const ky = (search.y1 - search.y0) / search.value;
    expect((site.y1 - site.y0) / site.value).toBeCloseTo(ky);
    expect(ads.y0 - search.y1).toBeCloseTo(16);
  });

  it('draws links as Bézier ribbons as wide as their value, stacked at both ends', () => {
    const links = layout.links.filter((link) => link.source === 'search');
    const search = node('search');
    if (!search) throw new Error('missing search');
    const ky = (search.y1 - search.y0) / search.value;
    expect(links[0]?.width).toBeCloseTo(3000 * ky);
    expect(links[0]?.path).toMatch(/^M108 0C/);
    // the second link leaves right under the first
    expect((links[1]?.y0 ?? 0) - (links[1]?.width ?? 0) / 2).toBeCloseTo((links[0]?.y0 ?? 0) + (links[0]?.width ?? 0) / 2);
  });

  it('reorders a column to remove crossings but keeps the input order on ties', () => {
    const crossed = sankeyLayout(
      [{ id: 'a' }, { id: 'b' }, { id: 'y' }, { id: 'x' }],
      [
        { source: 'a', target: 'x', value: 10 },
        { source: 'b', target: 'y', value: 10 },
      ],
      { x0: 0, x1: 300, height: 100 },
    );
    const y0 = (id: string) => crossed.nodes.find((item) => item.id === id)?.y0 ?? 0;
    expect(y0('x')).toBeLessThan(y0('y'));
    expect(y0('a')).toBeLessThan(y0('b'));
    // purchase and churn cross once either way: the given order stays
    expect((node('buy')?.y0 ?? 0) < (node('left')?.y0 ?? 0)).toBe(true);
  });

  it('drops links that would close a cycle', () => {
    const cyclic = sankeyLayout(
      [{ id: 'a' }, { id: 'b' }],
      [
        { source: 'a', target: 'b', value: 5 },
        { source: 'b', target: 'a', value: 3 },
      ],
      { x0: 0, x1: 100, height: 50 },
    );
    expect(cyclic.links).toHaveLength(1);
    expect(cyclic.nodes.map((item) => item.column)).toEqual([0, 1]);
  });
});

describe('SankeyChart', () => {
  it('labels nodes with values, the last column with shares, and paints the highlighted flow', () => {
    render(<SankeyChart aria-label="Путь клиента" nodes={journeyNodes} links={journeyLinks} highlight="buy" />);
    expect(screen.getByRole('group', { name: 'Путь клиента' })).toBeDefined();
    expect(slots('sankey-node')).toHaveLength(8);
    expect(slots('sankey-link')).toHaveLength(12);
    expect(visible('4 200')).toHaveLength(1);
    expect(visible('590 · 5,9 %')).toHaveLength(1);
    const highlighted = slots('sankey-link').filter((link) => link.getAttribute('data-highlight') !== null);
    expect(highlighted).toHaveLength(2);
    expect(highlighted[0]?.getAttribute('fill')).toBe('var(--color-seq-2)');
    expect(slots('sankey-link')[0]?.getAttribute('fill')).toBe('var(--color-fill-3)');
  });

  it('colours the first column with the palette, the rest neutral', () => {
    render(<SankeyChart aria-label="Путь клиента" nodes={journeyNodes} links={journeyLinks} />);
    const nodes = slots('sankey-node');
    expect(nodes[0]?.getAttribute('fill')).toBe('var(--color-chart-1)');
    expect(nodes[1]?.getAttribute('fill')).toBe('var(--color-chart-2)');
    expect(nodes[4]?.getAttribute('fill')).toBe('var(--color-fg-2)');
  });

  it('on a narrow plot moves middle labels off the ribbons, above or below the node, never onto a node or another label', () => {
    containerWidth(362);
    render(<SankeyChart aria-label="Путь клиента" nodes={journeyNodes} links={journeyLinks} />);
    const labels = slots('sankey-label');
    const middle = labels.filter((label) => !['left', 'right'].includes(label.getAttribute('data-placement') ?? ''));
    expect(middle).toHaveLength(2);
    for (const label of middle) expect(['above', 'below', 'line-above', 'line-below']).toContain(label.getAttribute('data-placement'));
    const nodes = slots('sankey-node').map((node) => ({
      x0: num(node, 'x'),
      y0: num(node, 'y'),
      x1: num(node, 'x') + num(node, 'width'),
      y1: num(node, 'y') + num(node, 'height'),
    }));
    const boxes = middle.map(box);
    for (const rect of boxes) {
      expect(nodes.some((node) => overlap(rect, node))).toBe(false);
      expect(rect.x0).toBeGreaterThanOrEqual(0);
      expect(rect.x1).toBeLessThanOrEqual(362);
    }
    expect(overlap(boxes[0] as Rect, boxes[1] as Rect)).toBe(false);
  });

  it('steps through nodes with ← →, dims unrelated flows and shows the link tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<SankeyChart aria-label="Путь клиента" nodes={journeyNodes} links={journeyLinks} />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText(/^Поиск: 4 200/, { selector: '[aria-live]' })).toBeDefined();
    const dimmed = slots('sankey-link').filter((link) => link.getAttribute('opacity') === '0.35');
    expect(dimmed).toHaveLength(10);
    await user.hover(slots('sankey-link')[9] as Element);
    const tooltip = document.querySelector<HTMLElement>('[data-slot=chart-tooltip]');
    expect(tooltip && within(tooltip).getByText('Сайт → Ушли')).toBeTruthy();
  });
});

/* ---------- Chord ---------- */

const plans = [
  { id: 'start', label: 'Старт' },
  { id: 'business', label: 'Бизнес' },
  { id: 'pro', label: 'Про' },
  { id: 'corp', label: 'Корп' },
  { id: 'gone', label: 'Ушли', color: 'var(--color-fg-4)' },
];
const moves = [
  { source: 'start', target: 'business', value: 320 },
  { source: 'start', target: 'gone', value: 180 },
  { source: 'business', target: 'pro', value: 210 },
  { source: 'business', target: 'start', value: 90 },
  { source: 'business', target: 'gone', value: 160 },
  { source: 'pro', target: 'corp', value: 120 },
  { source: 'pro', target: 'gone', value: 60 },
  { source: 'corp', target: 'gone', value: 40 },
];

describe('chordLayout', () => {
  it('gives every group an arc ∝ all its flows in and out, with equal gaps', () => {
    const pad = (4 * Math.PI) / 180;
    const { groups, ribbons } = chordLayout(plans, moves, pad);
    const total = moves.reduce((sum, move) => sum + move.value, 0) * 2;
    const k = (2 * Math.PI - plans.length * pad) / total;
    const business = groups[1];
    expect(business?.value).toBe(320 + 210 + 90 + 160);
    expect((business?.end ?? 0) - (business?.start ?? 0)).toBeCloseTo((business?.value ?? 0) * k);
    expect(groups[0]?.start).toBe(0);
    expect((groups[1]?.start ?? 0) - (groups[0]?.end ?? 0)).toBeCloseTo(pad);
    expect((groups[4]?.end ?? 0) + pad).toBeCloseTo(2 * Math.PI);
    for (const ribbon of ribbons) {
      expect(ribbon.sourceArc.end - ribbon.sourceArc.start).toBeCloseTo(ribbon.value * k);
      expect(ribbon.targetArc.end - ribbon.targetArc.start).toBeCloseTo(ribbon.value * k);
    }
  });

  it('keeps every ribbon end inside its own group', () => {
    const { groups, ribbons } = chordLayout(plans, moves);
    for (const ribbon of ribbons) {
      const source = groups.find((group) => group.id === ribbon.source);
      const target = groups.find((group) => group.id === ribbon.target);
      expect(ribbon.sourceArc.start).toBeGreaterThanOrEqual((source?.start ?? 0) - 1e-9);
      expect(ribbon.sourceArc.end).toBeLessThanOrEqual((source?.end ?? 0) + 1e-9);
      expect(ribbon.targetArc.start).toBeGreaterThanOrEqual((target?.start ?? 0) - 1e-9);
      expect(ribbon.targetArc.end).toBeLessThanOrEqual((target?.end ?? 0) + 1e-9);
    }
  });
});

describe('ChordChart', () => {
  it('labels arcs with totals and paints the focused group’s flows its colour on top', () => {
    render(<ChordChart aria-label="Переходы между тарифами" groups={plans} flows={moves} highlight="business" />);
    expect(slots('chord-group')).toHaveLength(5);
    expect(visible('Бизнес · 780')).toHaveLength(1);
    const ribbons = slots('chord-ribbon');
    const highlighted = ribbons.filter((ribbon) => ribbon.getAttribute('data-highlight') !== null);
    expect(highlighted).toHaveLength(3);
    expect(highlighted[0]?.getAttribute('fill')).toBe('var(--color-chart-2)');
    // drawn last, i.e. on top
    expect(ribbons.slice(-3).every((ribbon) => ribbon.getAttribute('data-highlight') !== null)).toBe(true);
    expect(slots('chord-group')[4]?.getAttribute('fill')).toBe('var(--color-fg-4)');
  });

  it('focuses a group from the keyboard and lists its flows in the tooltip', async () => {
    const user = userEvent.setup();
    render(<ChordChart aria-label="Переходы между тарифами" groups={plans} flows={moves} />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText(/^Старт: ушло 500, пришло 90/, { selector: '[aria-live]' })).toBeDefined();
    expect(slots('chord-ribbon').filter((ribbon) => ribbon.getAttribute('data-highlight') !== null)).toHaveLength(2);
    const tooltip = document.querySelector<HTMLElement>('[data-slot=chart-tooltip]');
    expect(tooltip && within(tooltip).getByText('→ Бизнес')).toBeTruthy();
  });
});

/* ---------- Network ---------- */

const services = [
  { id: 'crm', label: 'CRM', group: 'Каналы' },
  { id: 'site', label: 'Сайт', group: 'Каналы' },
  { id: 'tg', label: 'Telegram', group: 'Каналы' },
  { id: 'stock', label: 'Склад', group: 'Наши модули' },
  { id: 'cash', label: 'Касса', group: 'Наши модули' },
  { id: '1c', label: '1С', group: 'Учёт' },
  { id: 'bank', label: 'Банк', group: 'Учёт' },
];
const pairs = [
  { source: 'crm', target: 'site', value: 30 },
  { source: 'crm', target: 'tg', value: 22 },
  { source: 'site', target: 'tg', value: 8 },
  { source: 'stock', target: 'cash', value: 40 },
  { source: 'stock', target: '1c', value: 35 },
  { source: 'cash', target: '1c', value: 28 },
  { source: '1c', target: 'bank', value: 25 },
  { source: 'crm', target: 'cash', value: 6 },
];

describe('networkLayout', () => {
  it('is deterministic for the same seed and stays inside the unit square', () => {
    const a = networkLayout(services, pairs);
    const b = networkLayout(services, pairs);
    expect([...a.entries()]).toEqual([...b.entries()]);
    for (const point of a.values()) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    }
  });

  it('pulls linked nodes closer than unlinked ones', () => {
    const at = networkLayout(services, pairs);
    const distance = (s: string, t: string) => {
      const p = at.get(s);
      const q = at.get(t);
      return p && q ? Math.hypot(p.x - q.x, p.y - q.y) : Number.NaN;
    };
    const linked = new Set(pairs.map((pair) => `${pair.source}|${pair.target}`));
    const near: number[] = [];
    const far: number[] = [];
    services.forEach((s, i) =>
      services.slice(i + 1).forEach((t) => {
        (linked.has(`${s.id}|${t.id}`) || linked.has(`${t.id}|${s.id}`) ? near : far).push(distance(s.id, t.id));
      }),
    );
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(mean(near)).toBeLessThan(mean(far));
  });

  it('keeps nodes placed by hand where the mock-up put them', () => {
    const fixed = services.map((node, i) => ({ ...node, x: i / 6, y: 0.5 }));
    const at = networkLayout(fixed, pairs);
    expect(at.get('cash')).toEqual({ x: 4 / 6, y: 0.5 });
  });
});

describe('NetworkChart', () => {
  it('sizes nodes by √links, colours them by group and hides a group from the legend', async () => {
    const user = userEvent.setup();
    render(<NetworkChart aria-label="Какие интеграции подключают вместе" nodes={services} links={pairs} />);
    const nodes = slots('network-node');
    expect(nodes).toHaveLength(7);
    const radius = (id: string) => num(nodes.find((node) => node.getAttribute('data-id') === id), 'r');
    // CRM has 3 links, Banking 1: radius ratio is √3
    expect(radius('crm') / radius('bank')).toBeCloseTo(Math.sqrt(3), 1);
    expect(nodes[0]?.getAttribute('fill')).toBe('var(--color-chart-1)');
    expect(nodes[3]?.getAttribute('fill')).toBe('var(--color-chart-2)');
    expect(slots('network-link')).toHaveLength(8);
    await user.click(screen.getByRole('button', { name: 'Учёт' }));
    expect(slots('network-node')).toHaveLength(5);
    expect(slots('network-link')).toHaveLength(5);
  });

  it('places every label clear of other nodes, other labels and the plot edge on a narrow plot', () => {
    containerWidth(362);
    render(<NetworkChart aria-label="Интеграции" nodes={services} links={pairs} />);
    const circles = slots('network-node');
    const labels = slots('network-label');
    expect(labels.length).toBeGreaterThan(0);
    const boxes = labels.map(box);
    labels.forEach((label, i) => {
      const rect = boxes[i] as Rect;
      expect(rect.x0).toBeGreaterThanOrEqual(0);
      expect(rect.x1).toBeLessThanOrEqual(362);
      const own = label.parentElement?.querySelector('[data-slot=network-node]');
      for (const circle of circles) {
        if (circle === own) continue;
        const [cx, cy, r] = [num(circle, 'cx'), num(circle, 'cy'), num(circle, 'r')];
        const dx = cx - Math.min(rect.x1, Math.max(rect.x0, cx));
        const dy = cy - Math.min(rect.y1, Math.max(rect.y0, cy));
        expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(r);
      }
      boxes.slice(i + 1).forEach((other) => expect(overlap(rect, other)).toBe(false));
    });
  });

  it('steps through nodes with ← →, announcing its links', async () => {
    const user = userEvent.setup();
    render(<NetworkChart aria-label="Какие интеграции подключают вместе" nodes={services} links={pairs} />);
    const plot = screen.getByRole('group', { name: 'Какие интеграции подключают вместе' });
    plot.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText(/^CRM: 3 связи/, { selector: '[aria-live]' })).toBeDefined();
    expect(document.querySelector('[data-slot=chart-tooltip]')).not.toBeNull();
    const strong = slots('network-link').filter((link) => link.getAttribute('data-active') !== null);
    expect(strong).toHaveLength(3);
  });
});

/* ---------- Arc diagram ---------- */

const sections = [
  { id: 'home', label: 'Главная', value: 100000 },
  { id: 'catalog', label: 'Каталог', value: 78000 },
  { id: 'card', label: 'Карточка', value: 64000 },
  { id: 'cart', label: 'Корзина', value: 31000 },
];
const paths = [
  { source: 'home', target: 'catalog', value: 62000 },
  { source: 'catalog', target: 'card', value: 48000 },
  { source: 'card', target: 'cart', value: 25000 },
  { source: 'home', target: 'cart', value: 9000 },
  { source: 'card', target: 'catalog', value: 22000 },
  { source: 'cart', target: 'card', value: 11000 },
];

describe('ArcDiagramChart', () => {
  it('puts forward steps above the axis, returns below, widths 1–10 by volume', () => {
    render(<ArcDiagramChart aria-label="Пути по разделам" nodes={sections} links={paths} />);
    const arcs = slots('arc-link');
    expect(arcs).toHaveLength(6);
    const forward = arcs.filter((arc) => arc.getAttribute('data-direction') === 'forward');
    const back = arcs.filter((arc) => arc.getAttribute('data-direction') === 'back');
    expect(forward).toHaveLength(4);
    expect(back).toHaveLength(2);
    expect(forward[0]?.getAttribute('stroke')).toBe('var(--color-chart-1)');
    expect(back[0]?.getAttribute('stroke')).toBe('var(--color-chart-2)');
    // the biggest is drawn first so smaller arcs stay visible on top
    expect(num(arcs[0], 'stroke-width')).toBe(10);
    expect(Math.min(...arcs.map((arc) => num(arc, 'stroke-width')))).toBeGreaterThanOrEqual(1);
    const [axis] = slots('arc-axis');
    expect(num(forward[0], 'data-y')).toBeLessThan(num(axis, 'y1'));
    expect(num(back[0], 'data-y')).toBeGreaterThan(num(axis, 'y1'));
    expect(visible('62 тыс')).toHaveLength(1);
    expect(visible('22 тыс назад')).toHaveLength(1);
    expect(visible('100 тыс')).toHaveLength(1);
  });

  it('hides returns from the legend and steps nodes from the keyboard', async () => {
    const user = userEvent.setup();
    render(<ArcDiagramChart aria-label="Пути по разделам" nodes={sections} links={paths} />);
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(slots('arc-link')).toHaveLength(4);
    screen.getByRole('group', { name: 'Пути по разделам' }).focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByText(/^Каталог: 78 тыс/, { selector: '[aria-live]' })).toBeDefined();
  });
});

/* ---------- Cohort ---------- */

const cohorts = [
  { label: 'Май', values: [1240, 508, 397, 335, 298, 273] },
  { label: 'Июнь', values: [1380, 607, 469, 400, 359] },
  { label: 'Июль', values: [1510, 695, 544, 468] },
  { label: 'Октябрь', values: [1700] },
];

describe('CohortChart', () => {
  it('shows each period as a share of the first column, coloured on the seq ramp', () => {
    render(<CohortChart aria-label="Удержание по когортам" data={cohorts} />);
    const cells = slots('cohort-cell');
    expect(cells).toHaveLength(6 + 5 + 4 + 1);
    expect(visible('100 %')).toHaveLength(4);
    expect(visible('41 %')).toHaveLength(1);
    expect(visible('1 240 чел')).toHaveLength(1);
    expect(visible('Месяц 5')).toHaveLength(1);
    expect(cells[0]?.getAttribute('data-level')).toBe('5');
    expect(cells[0]?.getAttribute('fill')).toBe('var(--color-seq-5)');
    expect(cells[1]?.getAttribute('data-level')).toBe('3');
    expect(cells[5]?.getAttribute('data-level')).toBe('1');
  });

  it('colours the Paper mock-up data exactly as the mock-up does', () => {
    // percent → seq class, read from the cohort board in Paper
    const mockup: [string, number[], number[]][] = [
      ['Май', [100, 41, 32, 27, 24, 22], [5, 3, 2, 2, 1, 1]],
      ['Июнь', [100, 44, 34, 29, 26], [5, 3, 2, 2, 1]],
      ['Июль', [100, 46, 36, 31], [5, 4, 3, 2]],
      ['Август', [100, 48, 38], [5, 4, 3]],
      ['Сентябрь', [100, 51], [5, 4]],
      ['Октябрь', [100], [5]],
    ];
    render(<CohortChart aria-label="Удержание" data={mockup.map(([label, percents]) => ({ label, values: percents.map((pct) => pct * 10) }))} />);
    const levels = slots('cohort-cell').map((cell) => Number(cell.getAttribute('data-level')));
    expect(levels).toEqual(mockup.flatMap(([, , expected]) => expected));
  });

  it('keeps text readable: light on the darkest cells, flipped in the dark theme', () => {
    render(<CohortChart aria-label="Удержание по когортам" data={cohorts} />);
    const text = (level: string) => document.querySelector(`[data-slot=cohort-value][data-level="${level}"]`)?.getAttribute('class') ?? '';
    expect(text('5')).toContain('fill-surface-1');
    expect(text('4')).toContain('fill-fg-1');
    expect(text('4')).toContain('dark:fill-surface-1');
    expect(text('3')).toContain('fill-fg-1');
    expect(text('3')).not.toContain('surface-1');
    expect(text('1')).not.toContain('surface-1');
  });

  it('walks the triangle with arrows in both directions, skipping empty cells', async () => {
    const user = userEvent.setup();
    render(<CohortChart aria-label="Удержание по когортам" data={cohorts} />);
    screen.getByRole('group', { name: 'Удержание по когортам' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Май, месяц 0: 100 %, 1 240 чел', { selector: '[aria-live]' })).toBeDefined();
    await user.keyboard('{End}');
    expect(screen.getByText(/^Май, месяц 5: 22 %/, { selector: '[aria-live]' })).toBeDefined();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText(/^Июнь, месяц 4: 26 %/, { selector: '[aria-live]' })).toBeDefined();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByText(/^Октябрь, месяц 0/, { selector: '[aria-live]' })).toBeDefined();
    expect(document.querySelector('[data-slot=chart-tooltip]')).not.toBeNull();
  });
});
