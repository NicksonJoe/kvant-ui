import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  BubbleChart,
  CorrelationMatrixChart,
  HeatMatrixChart,
  HexbinChart,
  QuadrantChart,
  ScatterChart,
  bubbleRadius,
  correlationMatrix,
  fitTrend,
  hexBins,
  logTicks,
  pearsonCorrelation,
} from '..';

/** Deterministic pseudo-random numbers in [0, 1). */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const attr = (el: Element | undefined, name: string) => Number(el?.getAttribute(name));
const plot = (name: string) => screen.getByRole('group', { name });
const overlay = (root: HTMLElement) => root.querySelector('[data-slot=chart-overlay]') as Element;

describe('correlation maths', () => {
  it('fits a least-squares line and its R²', () => {
    const exact = fitTrend(
      [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
      ],
      'linear',
    );
    expect(exact?.slope).toBeCloseTo(2);
    expect(exact?.intercept).toBeCloseTo(1);
    expect(exact?.r2).toBeCloseTo(1);

    const noisy = fitTrend(
      [
        { x: 1, y: 1 },
        { x: 2, y: 3 },
        { x: 3, y: 2 },
        { x: 4, y: 5 },
      ],
      'linear',
    );
    expect(noisy?.slope).toBeCloseTo(1.1);
    expect(noisy?.intercept).toBeCloseTo(0);
    expect(noisy?.r2).toBeCloseTo(1 - 2.7 / 8.75);
    expect(noisy?.at(10)).toBeCloseTo(11);
  });

  it('has a confidence band that contains the line and is narrowest at the mean x', () => {
    const next = random(7);
    const points = Array.from({ length: 40 }, (_, i) => ({ x: i, y: 3 * i + 10 + (next() - 0.5) * 20 }));
    const fit = fitTrend(points, 'linear');
    if (!fit) throw new Error('no fit');
    const width = (x: number) => {
      const [low, high] = fit.band(x);
      expect(low).toBeLessThanOrEqual(fit.at(x));
      expect(high).toBeGreaterThanOrEqual(fit.at(x));
      return high - low;
    };
    expect(width(19.5)).toBeLessThan(width(0));
    expect(width(19.5)).toBeLessThan(width(39));
    expect(width(0)).toBeCloseTo(width(39));
  });

  it('fits an exponential trend through ln y', () => {
    const fit = fitTrend(
      [0, 1, 2, 3, 4].map((x) => ({ x, y: 900 * Math.exp(-0.3 * x) })),
      'exponential',
    );
    expect(fit?.at(5)).toBeCloseTo(900 * Math.exp(-1.5));
    expect(fit?.r2).toBeCloseTo(1);
    expect(fitTrend([{ x: 0, y: 5 }, { x: 1, y: 0 }], 'exponential')).toBeNull();
  });

  it('refuses to fit fewer than two distinct x', () => {
    expect(fitTrend([{ x: 1, y: 1 }], 'linear')).toBeNull();
    expect(fitTrend([{ x: 2, y: 1 }, { x: 2, y: 5 }], 'linear')).toBeNull();
  });

  it('computes Pearson correlation and a symmetric matrix', () => {
    expect(pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
    expect(pearsonCorrelation([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1);
    // x̄ 2,5 · ȳ 2,75 · Sxy 5,5 · Sxx 5 · Syy 8,75
    expect(pearsonCorrelation([1, 2, 3, 4], [1, 3, 2, 5])).toBeCloseTo(5.5 / Math.sqrt(5 * 8.75));
    expect(pearsonCorrelation([1, 2, 3], [4, 4, 4])).toBeNaN();

    const matrix = correlationMatrix([
      [1, 2, 3, 4],
      [1, 3, 2, 5],
      [4, 3, 2, 1],
    ]);
    expect(matrix.map((row, i) => row[i])).toEqual([1, 1, 1]);
    expect(matrix[0]?.[1]).toBeCloseTo(matrix[1]?.[0] ?? 0);
    expect(matrix[0]?.[2]).toBeCloseTo(-1);
  });

  it('puts every point into the hexagon around it, the nearest centre', () => {
    const next = random(42);
    const radius = 12;
    const points = Array.from({ length: 600 }, () => ({ x: next() * 400 - 50, y: next() * 300 - 50 }));
    const bins = hexBins(points, radius);
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(points.length);
    expect(new Set(bins.map((bin) => `${bin.x}:${bin.y}`)).size).toBe(bins.length);

    const centres = bins.map((bin) => ({ x: bin.x, y: bin.y }));
    for (const bin of bins) {
      for (const index of bin.points) {
        const p = points[index];
        if (!p) throw new Error('missing point');
        const dx = Math.abs(p.x - bin.x);
        const dy = Math.abs(p.y - bin.y);
        // pointy-top hexagon: inside the vertical sides and below the slanted edges
        expect(dx).toBeLessThanOrEqual((Math.sqrt(3) / 2) * radius + 1e-9);
        expect(dy).toBeLessThanOrEqual(radius - dx / Math.sqrt(3) + 1e-9);
        const own = Math.hypot(p.x - bin.x, p.y - bin.y);
        // one assertion per point: an expect per centre made this test the slowest in the suite
        const nearest = Math.min(...centres.map((other) => Math.hypot(p.x - other.x, p.y - other.y)));
        expect(own).toBeLessThanOrEqual(nearest + 1e-9);
      }
    }
    // centres sit on the lattice: rows 1,5 r apart, every other row shifted by half a column
    for (const bin of bins) {
      const row = Math.round(bin.y / (1.5 * radius));
      expect(bin.y).toBeCloseTo(row * 1.5 * radius);
      const column = bin.x / (Math.sqrt(3) * radius) - (Math.abs(row) % 2) / 2;
      expect(column).toBeCloseTo(Math.round(column));
    }
  });

  it('picks 1-2-5 log ticks around the data', () => {
    expect(logTicks(14, 950)).toEqual([10, 20, 50, 100, 200, 500, 1000]);
    expect(logTicks(6200, 410_000)).toEqual([5000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000]);
    expect(logTicks(20, 20)).toEqual([20]);
  });

  it('sizes bubbles by area, not radius', () => {
    expect(bubbleRadius(12, 12, 32)).toBeCloseTo(32);
    const area = (value: number) => Math.PI * bubbleRadius(value, 12, 32) ** 2;
    expect(area(3) / area(12)).toBeCloseTo(0.25);
    expect(bubbleRadius(0, 12, 32)).toBe(0);
  });
});

const priceSeries = [
  {
    name: 'Товар',
    points: [
      { x: 500, y: 720, label: 'Касса Онлайн' },
      { x: 2000, y: 410, label: 'Учёт ЭДО' },
      { x: 4000, y: 260, label: 'Склад Lite' },
      { x: 6000, y: 160, label: 'Курьеры' },
      { x: 9000, y: 60, label: 'Аналитика' },
    ],
  },
  {
    name: 'Вне тренда',
    trend: false,
    points: [{ x: 7500, y: 600, label: 'Склад Pro: дорого и много', callout: true }],
  },
];

describe('ScatterChart', () => {
  it('draws every point, reads the data as a table and prints only the callouts', () => {
    render(<ScatterChart aria-label="Цена и продажи" series={priceSeries} xName="Цена" yName="Продано" />);
    const group = plot('Цена и продажи');
    expect(group.querySelectorAll('[data-slot=scatter-point]')).toHaveLength(6);
    expect(within(group).getAllByRole('row')).toHaveLength(7);
    expect(group.querySelectorAll('[data-slot=scatter-callout]')).toHaveLength(1);
    expect(screen.getByText('Склад Pro: дорого и много', { selector: 'text' })).toBeDefined();
    expect(screen.queryByText('Курьеры', { selector: 'text' })).toBeNull();
  });

  it('draws the trend over the series that take part in it and states R²', () => {
    render(<ScatterChart aria-label="Цена и продажи" series={priceSeries} trend="linear" band />);
    const trend = document.querySelector('[data-slot=scatter-trend]');
    expect(trend).not.toBeNull();
    const fit = fitTrend(priceSeries[0]?.points ?? [], 'linear');
    expect(Number(trend?.getAttribute('data-r2'))).toBeCloseTo(fit?.r2 ?? 0, 3);
    expect(document.querySelector('[data-slot=scatter-band]')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Тренд, R² = 0,\d\d/ })).toBeDefined();
  });

  it('legend hides a series and the trend', async () => {
    const user = userEvent.setup();
    render(<ScatterChart aria-label="Цена и продажи" series={priceSeries} trend="exponential" />);
    await user.click(screen.getByRole('button', { name: 'Вне тренда' }));
    expect(document.querySelectorAll('[data-slot=scatter-point]')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Вне тренда' }).getAttribute('aria-pressed')).toBe('false');
    await user.click(screen.getByRole('button', { name: /Тренд/ }));
    expect(document.querySelector('[data-slot=scatter-trend]')).toBeNull();
  });

  it('shows the nearest point under the pointer, and nothing far from every point', () => {
    render(<ScatterChart aria-label="Цена и продажи" series={priceSeries} xName="Цена" yName="Продано" formatX={(v) => `${v} ₽`} />);
    const group = plot('Цена и продажи');
    const target = [...group.querySelectorAll('[data-slot=scatter-point]')].find((el) => el.getAttribute('data-label') === 'Склад Lite');
    fireEvent.pointerMove(overlay(group), { clientX: attr(target, 'cx') + 3, clientY: attr(target, 'cy') - 2 });
    const tooltip = group.querySelector('[data-slot=chart-tooltip]') as HTMLElement;
    expect(within(tooltip).getByText('Склад Lite')).toBeDefined();
    expect(within(tooltip).getByText('4000 ₽')).toBeDefined();
    expect(target?.getAttribute('data-active')).toBe('true');

    fireEvent.pointerMove(overlay(group), { clientX: 2000, clientY: 2000 });
    expect(group.querySelector('[data-slot=chart-tooltip]')).toBeNull();
  });

  it('steps through the points in x order with ← → Home End and reads them out', async () => {
    const user = userEvent.setup();
    render(<ScatterChart aria-label="Цена и продажи" series={priceSeries} xName="Цена" yName="Продано" />);
    const group = plot('Цена и продажи');
    group.focus();
    await user.keyboard('{ArrowRight}');
    expect(group.querySelector('[aria-live]')?.textContent).toMatch(/^Касса Онлайн/);
    await user.keyboard('{End}');
    expect(group.querySelector('[aria-live]')?.textContent).toMatch(/^Аналитика/);
    await user.keyboard('{ArrowLeft}');
    expect(group.querySelector('[aria-live]')?.textContent).toMatch(/^Склад Pro/);
    await user.keyboard('{Home}');
    expect(group.querySelector('[aria-live]')?.textContent).toBe('Касса Онлайн: Цена 500, Продано 720');
  });
});

const segments = [
  {
    name: 'Малый бизнес',
    points: [
      { label: 'Розница', x: 900, y: 14_000, size: 11_700_000 },
      { label: 'Салоны', x: 230, y: 15_000, size: 3_700_000 },
    ],
  },
  { name: 'Крупный', points: [{ label: 'Логистика', x: 14, y: 230_000, size: 3_200_000 }] },
];

describe('BubbleChart', () => {
  it('sizes bubbles by area, draws the big ones first and labels them', () => {
    render(<BubbleChart aria-label="Сегменты клиентов" series={segments} xScale="log" yScale="log" xUnit="клиентов" />);
    const bubbles = [...document.querySelectorAll('[data-slot=bubble]')];
    const radii = bubbles.map((el) => attr(el, 'r'));
    expect(radii).toEqual([...radii].sort((a, b) => b - a));
    expect(radii[0]).toBeCloseTo(32);
    expect((attr(bubbles[2], 'r') / attr(bubbles[0], 'r')) ** 2).toBeCloseTo(3_200_000 / 11_700_000);
    expect(screen.getByText('Розница', { selector: 'text' })).toBeDefined();
    expect(screen.getByText('11,7 млн', { selector: 'text' })).toBeDefined();
  });

  it('labels log axes with real values and shows a size scale', () => {
    render(
      <BubbleChart aria-label="Сегменты клиентов" series={segments} xScale="log" yScale="log" xUnit="клиентов" formatXTick={String} sizeName="Выручка" />,
    );
    expect(screen.getByText('1000 клиентов')).toBeDefined();
    expect(screen.getByText('50')).toBeDefined();
    expect(screen.getByText('200 тыс')).toBeDefined();
    const scale = document.querySelector('[data-slot=bubble-size-legend]') as Element;
    expect(within(scale as HTMLElement).getByText('Выручка')).toBeDefined();
    expect(scale.querySelectorAll('circle')).toHaveLength(3);
  });

  it('legend hides a series; keyboard steps in x order', async () => {
    const user = userEvent.setup();
    render(<BubbleChart aria-label="Сегменты клиентов" series={segments} xScale="log" sizeName="Выручка" />);
    await user.click(screen.getByRole('button', { name: 'Крупный' }));
    expect(document.querySelectorAll('[data-slot=bubble]')).toHaveLength(2);
    const group = plot('Сегменты клиентов');
    group.focus();
    await user.keyboard('{ArrowRight}');
    expect(group.querySelector('[aria-live]')?.textContent).toMatch(/^Салоны/);
    expect(group.querySelector('[data-slot=chart-tooltip]')).not.toBeNull();
  });

  it('places labels clear of each other and of other bubbles, dropping those that do not fit', () => {
    const crowd = Array.from({ length: 12 }, (_, i) => ({ label: `Сегмент ${i + 1}`, x: 10 + (i % 4), y: 10 + Math.floor(i / 4), size: 1_000_000 * (i + 1) }));
    render(<BubbleChart aria-label="Плотные сегменты" series={[{ name: 'Сегмент', points: crowd }]} />);
    const labels = [...document.querySelectorAll('[data-slot=bubble-label]')];
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.length).toBeLessThan(crowd.length);
    const boxes = labels.map((el) => {
      const [x0 = 0, y0 = 0, x1 = 0, y1 = 0] = (el.getAttribute('data-box') ?? '').split(' ').map(Number);
      return { label: el.getAttribute('data-label'), x0, y0, x1, y1 };
    });
    boxes.forEach((a, i) =>
      boxes.slice(i + 1).forEach((b) => {
        const apart = a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0;
        expect(apart, `${a.label} × ${b.label}`).toBe(true);
      }),
    );
    for (const box of boxes) {
      for (const bubble of document.querySelectorAll('[data-slot=bubble]')) {
        if (bubble.getAttribute('data-label') === box.label) continue;
        const cx = attr(bubble, 'cx');
        const cy = attr(bubble, 'cy');
        const near = Math.hypot(cx - Math.max(box.x0, Math.min(cx, box.x1)), cy - Math.max(box.y0, Math.min(cy, box.y1)));
        expect(near, `${box.label} over ${bubble.getAttribute('data-label')}`).toBeGreaterThanOrEqual(attr(bubble, 'r'));
      }
    }
  });
});

const days = ['Пн', 'Вт', 'Ср'];
const hours = ['8:00', '9:00', '10:00', '11:00'];
const orders = [
  [4, 12, 25, 41],
  [8, 33, 62, 95],
  [15, 20, 79, 80],
];

describe('HeatMatrixChart', () => {
  it('colours every cell by its threshold step and explains the steps', () => {
    render(<HeatMatrixChart aria-label="Заказы по дням и часам" rows={days} columns={hours} values={orders} legendTitle="Заказов в час" />);
    const cells = [...document.querySelectorAll('[data-slot=heat-matrix-cell]')];
    expect(cells).toHaveLength(12);
    expect(cells.map((cell) => cell.getAttribute('data-level'))).toEqual(['0', '0', '1', '2', '0', '1', '3', '4', '0', '1', '3', '4']);
    const legend = document.querySelector('[data-slot=heat-matrix-legend]') as HTMLElement;
    expect(within(legend).getByText('Заказов в час')).toBeDefined();
    for (const text of ['до 20', '20–39', '40–59', '60–79', '80+']) expect(within(legend).getByText(text)).toBeDefined();
  });

  it('moves over the grid with arrows, reading row, column and value', async () => {
    const user = userEvent.setup();
    render(<HeatMatrixChart aria-label="Заказы по дням и часам" rows={days} columns={hours} values={orders} />);
    const group = plot('Заказы по дням и часам');
    group.focus();
    await user.keyboard('{ArrowRight}');
    expect(group.querySelector('[aria-live]')?.textContent).toBe('Пн, 8:00: 4');
    await user.keyboard('{ArrowRight}{ArrowDown}');
    expect(group.querySelector('[aria-live]')?.textContent).toBe('Вт, 9:00: 33');
    await user.keyboard('{End}');
    expect(group.querySelector('[aria-live]')?.textContent).toBe('Вт, 11:00: 95');
    await user.keyboard('{ArrowDown}{ArrowDown}{Home}');
    expect(group.querySelector('[aria-live]')?.textContent).toBe('Ср, 8:00: 15');
  });

  it('shows a tooltip for the cell under the pointer', () => {
    render(<HeatMatrixChart aria-label="Заказы по дням и часам" rows={days} columns={hours} values={orders} />);
    const cell = document.querySelectorAll('[data-slot=heat-matrix-cell]')[6] as Element;
    fireEvent.pointerEnter(cell);
    const tooltip = document.querySelector('[data-slot=chart-tooltip]') as HTMLElement;
    expect(within(tooltip).getByText('Вт, 10:00')).toBeDefined();
    expect(within(tooltip).getByText('62')).toBeDefined();
    expect(cell.getAttribute('data-active')).toBe('true');
  });
});

describe('CorrelationMatrixChart', () => {
  it('computes Pearson r for every pair and colours it on the diverging scale', () => {
    render(
      <CorrelationMatrixChart
        aria-label="Связь показателей"
        variables={[
          { name: 'Звонки', values: [10, 20, 30, 40, 50] },
          { name: 'Встречи', values: [2, 4, 5, 8, 10] },
          { name: 'Отказы', values: [9, 7, 6, 3, 1] },
        ]}
      />,
    );
    const cells = [...document.querySelectorAll('[data-slot=heat-matrix-cell]')];
    expect(cells).toHaveLength(9);
    expect(cells[0]?.getAttribute('data-value')).toBe('1');
    expect(Number(cells[1]?.getAttribute('data-value'))).toBeCloseTo(pearsonCorrelation([10, 20, 30, 40, 50], [2, 4, 5, 8, 10]));
    expect(cells[1]?.getAttribute('data-level')).toBe('4');
    expect(cells[2]?.getAttribute('data-level')).toBe('0');
    expect(cells[3]?.getAttribute('data-value')).toBe(cells[1]?.getAttribute('data-value'));
    expect(screen.getAllByText(/^−0,9\d$/, { selector: 'text' }).length).toBeGreaterThan(0);
    const legend = document.querySelector('[data-slot=heat-matrix-legend]') as HTMLElement;
    expect(within(legend).getByText('нет связи')).toBeDefined();
  });
});

describe('HexbinChart', () => {
  const next = random(3);
  const visits = Array.from({ length: 400 }, () => ({ x: next() * 30, y: 2000 + next() * 15_000 }));

  it('bins the points into hexagons, skips empty ones and keeps every point', () => {
    render(<HexbinChart aria-label="Чек и время на сайте" points={visits} xUnit="мин на сайте" />);
    const cells = [...document.querySelectorAll('[data-slot=hexbin-cell]')];
    expect(cells.length).toBeGreaterThan(10);
    expect(cells.reduce((sum, cell) => sum + Number(cell.getAttribute('data-count')), 0)).toBe(visits.length);
    expect(cells.every((cell) => Number(cell.getAttribute('data-count')) > 0)).toBe(true);
    expect(screen.getByText('30 мин на сайте')).toBeDefined();
  });

  it('uses threshold legend steps', () => {
    render(<HexbinChart aria-label="Чек и время на сайте" points={visits} thresholds={[2, 4, 6, 8]} />);
    const legend = document.querySelector('[data-slot=hexbin-legend]') as HTMLElement;
    for (const text of ['1', '2–3', '4–5', '6–7', '8+']) expect(within(legend).getByText(text)).toBeDefined();
    const levels = [...document.querySelectorAll('[data-slot=hexbin-cell]')].map((cell) => {
      const count = Number(cell.getAttribute('data-count'));
      return [count, Number(cell.getAttribute('data-level'))] as const;
    });
    for (const [count, level] of levels) expect(level).toBe([2, 4, 6, 8].filter((t) => count >= t).length);
  });

  it('shows the hexagon under the pointer and steps through cells by keyboard', async () => {
    const user = userEvent.setup();
    render(<HexbinChart aria-label="Чек и время на сайте" points={visits} countName="Заказов" />);
    const group = plot('Чек и время на сайте');
    const cell = group.querySelector('[data-slot=hexbin-cell]') as Element;
    fireEvent.pointerMove(overlay(group), { clientX: attr(cell, 'data-cx'), clientY: attr(cell, 'data-cy') + 3 });
    const tooltip = group.querySelector('[data-slot=chart-tooltip]') as HTMLElement;
    expect(within(tooltip).getByText(cell.getAttribute('data-count') ?? '')).toBeDefined();
    expect(within(tooltip).getByText('Заказов')).toBeDefined();

    group.focus();
    await user.keyboard('{Home}');
    expect(group.querySelector('[aria-live]')?.textContent).toMatch(/^Заказов \d+/);
  });

  it('draws annotations with a leader line', () => {
    render(
      <HexbinChart
        aria-label="Чек и время на сайте"
        points={visits}
        annotations={[{ x: 3, y: 4000, labelX: 5, labelY: 12_000, title: 'Быстрая покупка', note: 'визит до 8 мин' }]}
      />,
    );
    const note = document.querySelector('[data-slot=hexbin-annotation]') as HTMLElement;
    expect(within(note).getByText('Быстрая покупка')).toBeDefined();
    expect(note.querySelector('path')?.getAttribute('d')).toMatch(/^M[\d.]+ [\d.]+V[\d.]+H[\d.]+$/);
    expect(note.querySelector('text')?.getAttribute('text-anchor')).toBe('start');
  });

  it('turns an annotation that would run past the right edge to end at its anchor', () => {
    render(
      <HexbinChart
        aria-label="Чек и время на сайте"
        points={visits}
        annotations={[{ x: 26, y: 12_000, labelX: 27, labelY: 5000, title: 'Обдуманный выбор', note: 'чек растёт с длиной визита · 36 % заказов' }]}
      />,
    );
    const note = document.querySelector('[data-slot=hexbin-annotation]') as Element;
    expect(note.querySelector('text')?.getAttribute('text-anchor')).toBe('end');
  });
});

const products = [
  { label: 'Склад Pro', x: 24, y: 38 },
  { label: 'Касса Онлайн', x: 31, y: 22 },
  { label: 'Маркетплейс', x: 8, y: 41 },
  { label: 'Курьеры', x: -12, y: 12 },
  { label: 'Учёт ЭДО', x: 12, y: 14 },
];

describe('QuadrantChart', () => {
  it('splits at the medians by default and names the quadrants', () => {
    render(
      <QuadrantChart
        aria-label="Рост и маржа продуктов"
        points={products}
        quadrants={{ topLeft: 'Удержать маржу', topRight: 'Звёзды', bottomLeft: 'Пересмотреть', bottomRight: 'Растут в убыток' }}
        focus="topRight"
      />,
    );
    const divider = document.querySelector('[data-slot=quadrant-divider]') as Element;
    expect(divider.getAttribute('data-x')).toBe('12');
    expect(divider.getAttribute('data-y')).toBe('22');
    for (const name of ['Удержать маржу', 'Звёзды', 'Пересмотреть', 'Растут в убыток']) expect(screen.getByText(name, { selector: 'text' })).toBeDefined();
    const points = [...document.querySelectorAll('[data-slot=quadrant-point]')];
    expect(points.filter((p) => p.getAttribute('data-focus') === 'true').map((p) => p.getAttribute('data-label'))).toEqual(['Склад Pro', 'Касса Онлайн']);
    expect(points.find((p) => p.getAttribute('data-label') === 'Курьеры')?.getAttribute('data-quadrant')).toBe('bottomLeft');
  });

  it('takes explicit split values and says the quadrant when stepping', async () => {
    const user = userEvent.setup();
    render(
      <QuadrantChart
        aria-label="Рост и маржа продуктов"
        points={products}
        xSplit={10}
        ySplit={25}
        xName="Рост"
        yName="Маржа"
        quadrants={{ topLeft: 'Удержать маржу', topRight: 'Звёзды', bottomLeft: 'Пересмотреть', bottomRight: 'Растут в убыток' }}
      />,
    );
    const group = plot('Рост и маржа продуктов');
    group.focus();
    await user.keyboard('{ArrowRight}');
    expect(group.querySelector('[aria-live]')?.textContent).toBe('Курьеры: Рост −12, Маржа 12 — Пересмотреть');
    await user.keyboard('{ArrowRight}');
    expect(group.querySelector('[aria-live]')?.textContent).toMatch(/^Маркетплейс.*Удержать маржу$/);
    expect(group.querySelector('[data-slot=chart-tooltip]')).not.toBeNull();
  });
});
