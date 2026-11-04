import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  BeeswarmChart,
  BoxPlotChart,
  ErrorBarChart,
  HistogramChart,
  JitterChart,
  LorenzChart,
  ParetoChart,
  PopulationPyramidChart,
  RidgelineChart,
  SpanChart,
  StemLeafChart,
  ViolinChart,
  distributionStats as stats,
} from '..';

const tooltip = () => document.querySelector<HTMLElement>('[data-slot=chart-tooltip]');
const plot = (name: string) => screen.getByRole('group', { name });
const flat = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ');
const live = (name: string) => flat(plot(name).querySelector('[aria-live]')?.textContent);
const all = (slot: string) => [...document.querySelectorAll<SVGElement | HTMLElement>(`[data-slot=${slot}]`)];
const num = (el: Element | undefined, attr: string) => Number(el?.getAttribute(attr));

/* ---------- Statistics ---------- */

describe('distributionStats', () => {
  it('quartiles interpolate linearly between ranks (type 7, QUARTILE.INC)', () => {
    expect(stats.quartiles([4, 1, 3, 2])).toEqual({ q1: 1.75, median: 2.5, q3: 3.25 });
    expect(stats.quartiles([7, 1, 3, 5, 9])).toEqual({ q1: 3, median: 5, q3: 7 });
    expect(stats.quantile([10, 20], 0.9)).toBeCloseTo(19);
    expect(Number.isNaN(stats.quantile([], 0.5))).toBe(true);
  });

  it('box: whiskers reach the last value inside 1.5 IQR, the rest are outliers', () => {
    const box = stats.box([1, 2, 3, 4, 5, 6, 7, 8, 9, 40]);
    expect(box.q1).toBe(3.25);
    expect(box.q3).toBe(7.75);
    expect(box.iqr).toBe(4.5);
    expect(box.low).toBe(1);
    expect(box.high).toBe(9);
    expect(box.outliers).toEqual([40]);
    expect(box.count).toBe(10);
    const low = stats.box([-30, 10, 11, 12, 13, 14]);
    expect(low.outliers).toEqual([-30]);
    expect(low.low).toBe(10);
  });

  it('histogram bins: an explicit step, half-open bins and the maximum in the last one', () => {
    const bins = stats.bins([0, 5, 10, 24.9, 25, 49, 50], { step: 25 });
    expect(bins.map((bin) => [bin.x0, bin.x1, bin.count])).toEqual([
      [0, 25, 4],
      [25, 50, 3],
    ]);
  });

  it('histogram bins: Freedman–Diaconis width rounded to 1, 2, 2,5 or 5 × 10ⁿ', () => {
    const values = Array.from({ length: 100 }, (_, i) => i);
    // IQR 49,5 → 2 · 49,5 / ∛100 ≈ 21,3 → 25
    const bins = stats.bins(values);
    expect(bins[0]?.x1 ?? 0).toBe(25);
    expect(bins.reduce((total, bin) => total + bin.count, 0)).toBe(100);
  });

  it('histogram bins: Sturges when the IQR is zero', () => {
    // 5 values, IQR 0 → ⌈log₂5⌉ + 1 = 4 bins over the range 5…6 → 0,25 → step 0,25
    const bins = stats.bins([5, 5, 5, 5, 6]);
    expect(bins).toHaveLength(4);
    expect(bins[0]?.x1).toBeCloseTo(5.25);
    expect(bins.reduce((total, bin) => total + bin.count, 0)).toBe(5);
    expect(stats.bins([])).toEqual([]);
  });

  it('Silverman bandwidth: 0,9 · min(σ, IQR / 1,34) · n^−⅕', () => {
    // σ = 1,581; IQR / 1,34 = 1,493 → 0,9 · 1,493 · 5^−0,2
    expect(stats.silverman([1, 2, 3, 4, 5])).toBeCloseTo(0.9 * (2 / 1.34) * 5 ** -0.2, 6);
    expect(stats.silverman([3, 3, 3])).toBeGreaterThan(0);
  });

  it('Gaussian KDE: integrates to one, peaks at a lone value at 1 / (h√2π)', () => {
    const grid = Array.from({ length: 2001 }, (_, i) => -10 + i * 0.01);
    const density = stats.kde([-1, 0, 2], grid, 0.8);
    const area = density.reduce((total, d) => total + d * 0.01, 0);
    expect(area).toBeCloseTo(1, 3);
    expect(stats.kde([0], [0], 2)[0]).toBeCloseTo(1 / (2 * Math.sqrt(2 * Math.PI)), 8);
    const symmetric = stats.kde([-1, 1], [-0.5, 0.5], 1);
    expect(symmetric[0]).toBeCloseTo(symmetric[1] ?? 0, 10);
  });

  it('Gini coefficient: 0 for equality, (n − 1) / n when one takes all', () => {
    expect(stats.gini([5, 5, 5, 5])).toBe(0);
    expect(stats.gini([0, 0, 0, 1])).toBeCloseTo(0.75);
    expect(stats.gini([5, 1, 4, 2, 3])).toBeCloseTo(20 / 75);
    expect(stats.gini([])).toBe(0);
  });

  it('Lorenz curve: from 0,0 to 1,1, convex, sorted ascending', () => {
    const curve = stats.lorenz([30, 10, 60]);
    expect(curve).toEqual([
      { x: 0, y: 0 },
      { x: 1 / 3, y: 0.1 },
      { x: 2 / 3, y: 0.4 },
      { x: 1, y: 1 },
    ]);
  });

  it('beeswarm: no two dots closer than 2r + gap, the first sits on the axis', () => {
    const xs = [10, 10, 10, 11, 12, 14, 30, 30.5, 31, 31, 31, 31, 60];
    const offsets = stats.beeswarm(xs, 3, 1);
    expect(offsets).toHaveLength(xs.length);
    expect(offsets[0]).toBe(0);
    expect(offsets[12]).toBe(0);
    for (let i = 0; i < xs.length; i += 1) {
      for (let j = i + 1; j < xs.length; j += 1) {
        const distance = Math.hypot((xs[i] ?? 0) - (xs[j] ?? 0), (offsets[i] ?? 0) - (offsets[j] ?? 0));
        expect(distance).toBeGreaterThanOrEqual(7 - 1e-6);
      }
    }
    // dots pack outward from the axis: the third of a stack lies further out than the second
    expect(Math.abs(offsets[2] ?? 0)).toBeGreaterThanOrEqual(Math.abs(offsets[1] ?? 0));
  });

  it('jitter is seeded: same seed, same offsets; no Math.random', () => {
    const random = vi.spyOn(Math, 'random');
    const a = stats.jitter(20, 7);
    const b = stats.jitter(20, 7);
    const c = stats.jitter(20, 8);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    for (const value of a) {
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThan(1);
    }
    expect(random).not.toHaveBeenCalled();
    random.mockRestore();
  });

  it('stem and leaf: stems by tens with empty stems kept, leaves ascending', () => {
    const plot = stats.stemLeaf([34, 13, 18, 17, 14, 52, 31, 30]);
    expect(plot.unit).toBe(10);
    expect(plot.rows).toEqual([
      { stem: 1, leaves: [3, 4, 7, 8] },
      { stem: 2, leaves: [] },
      { stem: 3, leaves: [0, 1, 4] },
      { stem: 4, leaves: [] },
      { stem: 5, leaves: [2] },
    ]);
    expect(stats.stemLeaf([120, 340, 990], 100).rows.map((row) => row.leaves)).toEqual([[2], [], [4], [], [], [], [], [], [9]]);
  });
});

/* ---------- Charts ---------- */

describe('HistogramChart', () => {
  const deals = [12_000, 18_000, 30_000, 41_000, 44_000, 52_000, 55_000, 61_000, 78_000, 84_000, 90_000, 140_000];

  it('draws one touching bar per bin, the median and a data table', () => {
    render(<HistogramChart aria-label="Размер сделки" values={deals} step={25_000} unit="₽" formatValue={(v) => `${(v / 1000).toLocaleString('ru-RU')} тыс ₽`} />);
    const bins = all('histogram-bin');
    expect(bins.map((bin) => bin.getAttribute('data-count'))).toEqual(['2', '3', '3', '3', '0', '1']);
    expect(screen.getByText('Медиана 53,5 тыс ₽')).toBeTruthy();
    const table = within(plot('Размер сделки')).getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(7);
    expect(screen.getByText('150 тыс ₽')).toBeTruthy();
  });

  it('steps bins with ← → and shows the tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<HistogramChart aria-label="Размер сделки" values={deals} step={25_000} countLabel="Сделок" />);
    plot('Размер сделки').focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(live('Размер сделки')).toBe('25 000–50 000: Сделок 3');
    await user.keyboard('{End}');
    expect(live('Размер сделки')).toContain('Сделок 1');
    await user.hover(all('histogram-hit')[0] as Element);
    expect(flat(tooltip()?.textContent)).toContain('0–25 000');
    expect(flat(tooltip()?.textContent)).toContain('Сделок2');
  });
});

describe('BoxPlotChart', () => {
  const groups = [
    { name: 'Москва', values: [1, 1.5, 2, 2, 2.5, 3, 3.5, 5.5] },
    { name: 'Казань', values: [2, 2.5, 3, 3.5, 4, 4.5, 5] },
  ];

  it('draws box, median, whiskers and outliers per group', () => {
    render(<BoxPlotChart aria-label="Срок доставки по городам" groups={groups} unit="дн" />);
    const rows = all('box-plot-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.getAttribute('data-median')).toBe('2.25');
    expect(all('box-plot-outlier').map((dot) => dot.getAttribute('data-value'))).toEqual(['5.5']);
    expect(screen.getByText('50 % значений')).toBeTruthy();
    expect(screen.getByText('Выброс')).toBeTruthy();
    const median = rows[0]?.querySelector('[data-slot=box-plot-median]');
    const box = rows[0]?.querySelector('[data-slot=box-plot-box]');
    expect(num(median ?? undefined, 'x1')).toBeGreaterThan(num(box ?? undefined, 'x'));
  });

  it('steps rows with ↓ and reads the five numbers', async () => {
    const user = userEvent.setup();
    render(<BoxPlotChart aria-label="Срок доставки по городам" groups={groups} formatValue={(v) => `${String(v).replace('.', ',')} дн`} />);
    plot('Срок доставки по городам').focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(live('Срок доставки по городам')).toBe('Казань: медиана 3,5 дн, квартили 2,75 дн–4,25 дн, усы 2 дн–5 дн');
    await user.hover(all('box-plot-hit')[0] as Element);
    expect(flat(tooltip()?.textContent)).toContain('Москва');
    expect(flat(tooltip()?.textContent)).toContain('Выбросы1');
  });
});

describe('ViolinChart', () => {
  const groups = [
    { name: 'Старт', values: [14, 18, 20, 21, 22, 22, 23, 25, 27, 31] },
    { name: 'Бизнес', values: [24, 30, 33, 36, 37, 38, 41, 44, 50] },
  ];

  it('one mirrored density shape per group with quartile bar and median', () => {
    render(<ViolinChart aria-label="Средний чек по тарифам" groups={groups} bandwidth={4} />);
    const violins = all('violin');
    expect(violins).toHaveLength(2);
    expect(violins[0]?.getAttribute('d')).toMatch(/^M.+Z$/);
    expect(violins[0]?.getAttribute('data-bandwidth')).toBe('4');
    expect(screen.getByText('22', { selector: 'text' })).toBeTruthy();
    expect(screen.getByText('37', { selector: 'text' })).toBeTruthy();
  });

  it('Silverman bandwidth by default; keyboard and tooltip', async () => {
    const user = userEvent.setup();
    render(<ViolinChart aria-label="Средний чек по тарифам" groups={groups} />);
    expect(Number(all('violin')[0]?.getAttribute('data-bandwidth'))).toBeCloseTo(stats.silverman(groups[0]?.values ?? []), 6);
    plot('Средний чек по тарифам').focus();
    await user.keyboard('{End}');
    expect(live('Средний чек по тарифам')).toBe('Бизнес: медиана 37, квартили 33–41, от 24 до 50');
    await user.hover(all('violin-hit')[0] as Element);
    expect(flat(tooltip()?.textContent)).toContain('Старт');
  });
});

describe('RidgelineChart', () => {
  const groups = [
    { name: 'Сен', values: [30, 35, 40, 42, 45, 50, 60] },
    { name: 'Окт', values: [25, 30, 34, 38, 40, 44, 52] },
  ];

  it('ridges share one height scale; the focus row is highlighted and labelled', () => {
    render(<RidgelineChart aria-label="Время доставки по месяцам" groups={groups} restLabel="Прошлые месяцы" unit="мин" />);
    const rows = all('ridgeline-row');
    expect(rows).toHaveLength(2);
    expect(rows[1]?.getAttribute('data-focus')).toBe('true');
    expect(rows[0]?.hasAttribute('data-focus')).toBe(false);
    expect(screen.getByText('медиана 38')).toBeTruthy();
    expect(screen.getByText('Прошлые месяцы')).toBeTruthy();
  });

  it('steps rows and shows the median on hover', async () => {
    const user = userEvent.setup();
    render(<RidgelineChart aria-label="Время доставки по месяцам" groups={groups} />);
    plot('Время доставки по месяцам').focus();
    await user.keyboard('{ArrowDown}');
    expect(live('Время доставки по месяцам')).toBe('Сен: медиана 42, квартили 37,5–47,5, значений 7');
    await user.hover(all('ridgeline-hit')[1] as Element);
    expect(flat(tooltip()?.textContent)).toContain('Окт');
  });
});

describe('BeeswarmChart', () => {
  const groups = [
    { name: 'Чат', values: [2, 3, 3, 3.1, 3.2, 4, 5, 6, 6.6, 7, 7, 7, 8, 12] },
    { name: 'Почта', values: [6, 10, 14, 18, 18, 18.2, 22, 30, 41] },
  ];

  it('one dot per value, no overlaps inside a row, the median per row', () => {
    render(<BeeswarmChart aria-label="Время первого ответа" groups={groups} unit="ч" formatValue={(v) => `${String(v).replace('.', ',')} ч`} />);
    const dots = all('beeswarm-point');
    expect(dots).toHaveLength(23);
    const first = dots.filter((dot) => dot.getAttribute('data-group') === '0');
    for (let i = 0; i < first.length; i += 1) {
      for (let j = i + 1; j < first.length; j += 1) {
        const d = Math.hypot(num(first[i], 'cx') - num(first[j], 'cx'), num(first[i], 'cy') - num(first[j], 'cy'));
        expect(d).toBeGreaterThanOrEqual(7 - 1e-6);
      }
    }
    expect(screen.getByText('мед. 5,5 ч')).toBeTruthy();
    expect(all('beeswarm-median')).toHaveLength(2);
  });

  it('← → walk the values, ↓ jumps to the next row', async () => {
    const user = userEvent.setup();
    render(<BeeswarmChart aria-label="Время первого ответа" groups={groups} />);
    plot('Время первого ответа').focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(live('Время первого ответа')).toBe('Чат: 3');
    await user.keyboard('{End}');
    expect(live('Время первого ответа')).toBe('Чат: 12');
    await user.keyboard('{ArrowDown}');
    expect(live('Время первого ответа')).toBe('Почта: 10');
    await user.hover(all('beeswarm-point')[0] as Element);
    expect(flat(tooltip()?.textContent)).toContain('Чат');
  });
});

describe('JitterChart', () => {
  const groups = [
    { name: 'Север', values: [58, 64, 70, 74, 74, 80, 92], labels: ['Анна', 'Борис', 'Вера', 'Глеб', 'Дина', 'Егор', 'Жанна'] },
    { name: 'Юг', values: [35, 50, 63, 63, 70, 93] },
  ];
  const xs = () => all('jitter-point').map((dot) => dot.getAttribute('cx'));

  it('deterministic jitter: the same seed draws the same picture', () => {
    const { unmount } = render(<JitterChart aria-label="Выполнение плана" groups={groups} unit="%" />);
    const first = xs();
    expect(first).toHaveLength(13);
    unmount();
    const again = render(<JitterChart aria-label="Выполнение плана" groups={groups} unit="%" />);
    expect(xs()).toEqual(first);
    again.unmount();
    render(<JitterChart aria-label="Выполнение плана" groups={groups} unit="%" seed={42} />);
    expect(xs()).not.toEqual(first);
    expect(screen.getByText('74', { selector: 'text' })).toBeTruthy();
    expect(all('jitter-median')).toHaveLength(2);
  });

  it('↑ ↓ walk the values, → the next group; names come into the tooltip', async () => {
    const user = userEvent.setup();
    render(<JitterChart aria-label="Выполнение плана" groups={groups} formatValue={(v) => `${v} %`} />);
    plot('Выполнение плана').focus();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(live('Выполнение плана')).toBe('Борис, Север: 64 %');
    await user.keyboard('{ArrowRight}');
    expect(live('Выполнение плана')).toBe('Юг: 63 %');
    await user.hover(all('jitter-point')[6] as Element);
    expect(flat(tooltip()?.textContent)).toContain('Жанна');
  });
});

describe('PopulationPyramidChart', () => {
  const rows = [
    { label: '65+', left: 1.6, right: 2.3 },
    { label: '25–34', left: 14.8, right: 17.2 },
  ];

  it('two halves from a shared corridor; the legend hides a side', async () => {
    const user = userEvent.setup();
    render(<PopulationPyramidChart aria-label="Клиенты по возрасту и полу" rows={rows} series={['Мужчины', 'Женщины']} unit="%" />);
    expect(all('pyramid-bar')).toHaveLength(4);
    expect(screen.getByText('14,8', { selector: 'text' })).toBeTruthy();
    const left = all('pyramid-bar').filter((bar) => bar.getAttribute('data-side') === 'left');
    const right = all('pyramid-bar').filter((bar) => bar.getAttribute('data-side') === 'right');
    expect(num(left[1], 'data-length')).toBeLessThan(num(right[1], 'data-length'));
    await user.click(screen.getByRole('button', { name: 'Мужчины' }));
    expect(screen.getByRole('button', { name: 'Мужчины' }).getAttribute('aria-pressed')).toBe('false');
    expect(all('pyramid-bar')).toHaveLength(2);
  });

  it('rows step with ↓ and read both sides', async () => {
    const user = userEvent.setup();
    render(<PopulationPyramidChart aria-label="Клиенты по возрасту и полу" rows={rows} series={['Мужчины', 'Женщины']} formatValue={(v) => `${String(v).replace('.', ',')} %`} />);
    plot('Клиенты по возрасту и полу').focus();
    await user.keyboard('{ArrowDown}');
    expect(live('Клиенты по возрасту и полу')).toBe('65+: Мужчины 1,6 %, Женщины 2,3 %');
    await user.hover(all('pyramid-hit')[1] as Element);
    expect(flat(tooltip()?.textContent)).toContain('25–34');
  });
});

describe('ParetoChart', () => {
  const data = [
    { label: 'Передумал', value: 8 },
    { label: 'Брак', value: 31 },
    { label: 'Не подошёл размер', value: 22 },
    { label: 'Долгая доставка', value: 14 },
    { label: 'Не как на фото', value: 11 },
    { label: 'Прочее', value: 14 },
  ];

  it('sorts descending, marks the vital few up to 80 % and labels the last point under the threshold', () => {
    render(<ParetoChart aria-label="Причины возвратов" data={data} />);
    const bars = all('pareto-bar');
    expect(bars.map((bar) => bar.getAttribute('data-label'))).toEqual(['Брак', 'Не подошёл размер', 'Долгая доставка', 'Прочее', 'Не как на фото', 'Передумал']);
    expect(bars.map((bar) => bar.hasAttribute('data-vital'))).toEqual([true, true, true, true, false, false]);
    expect(all('pareto-point').map((dot) => dot.getAttribute('data-cumulative'))).toEqual(['0.31', '0.53', '0.67', '0.81', '0.92', '1']);
    expect(screen.getByText('67 %', { selector: 'text' })).toBeTruthy();
    expect(screen.getByText('80 %', { selector: 'text' })).toBeTruthy();
  });

  it('the legend hides the cumulative line; ← → read share and running total', async () => {
    const user = userEvent.setup();
    render(<ParetoChart aria-label="Причины возвратов" data={data} />);
    await user.click(screen.getByRole('button', { name: 'Накопленно' }));
    expect(all('pareto-point')).toHaveLength(0);
    plot('Причины возвратов').focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(live('Причины возвратов')).toBe('Не подошёл размер: 22, доля 22,0 %, накопленно 53,0 %');
    await user.hover(all('pareto-hit')[0] as Element);
    expect(flat(tooltip()?.textContent)).toContain('Брак');
  });
});

describe('LorenzChart', () => {
  const revenue = [5, 5, 10, 10, 20, 50, 100, 300];

  it('curve under the line of equality with the Gini coefficient', () => {
    render(<LorenzChart aria-label="Концентрация выручки" values={revenue} populationLabel="клиентов" valueLabel="Доля выручки" />);
    expect(all('lorenz-curve')).toHaveLength(1);
    expect(all('lorenz-equality')).toHaveLength(1);
    const gini = stats.gini(revenue);
    expect(screen.getByText(`Джини ${gini.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)).toBeTruthy();
    const table = within(plot('Концентрация выручки')).getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(12);
  });

  it('steps deciles: the poorest share and what it brings', async () => {
    const user = userEvent.setup();
    render(<LorenzChart aria-label="Концентрация выручки" values={revenue} populationLabel="клиентов" valueLabel="Доля выручки" />);
    plot('Концентрация выручки').focus();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    // half the clients (5, 5, 10, 10) bring 30 of 500
    expect(live('Концентрация выручки')).toBe('50 % клиентов: Доля выручки 6,0 %');
    await user.hover(all('lorenz-hit')[9] as Element);
    expect(flat(tooltip()?.textContent)).toContain('100 % клиентов');
  });
});

describe('ErrorBarChart', () => {
  const data = [
    { label: 'Новый онбординг', value: 2.4, low: 0.9, high: 3.9 },
    { label: 'Чат-бот', value: -0.6, low: -2.3, high: 1.1 },
  ];

  it('significance by colour and weight; signed labels at the right end', () => {
    render(<ErrorBarChart aria-label="A/B-тесты" data={data} unit="п. п." />);
    const bars = all('error-bar');
    expect(bars.map((bar) => bar.getAttribute('data-significant'))).toEqual(['true', 'false']);
    expect(screen.getByText('+2,4', { selector: 'text' }).getAttribute('font-weight')).toBe('600');
    expect(screen.getByText('−0,6', { selector: 'text' }).getAttribute('font-weight')).toBeNull();
    expect(screen.getByText('Не отличить от нуля', { selector: 'li' })).toBeTruthy();
  });

  it('rows step and read the interval', async () => {
    const user = userEvent.setup();
    render(<ErrorBarChart aria-label="A/B-тесты" data={data} />);
    plot('A/B-тесты').focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(live('A/B-тесты')).toBe('Чат-бот: −0,6, интервал от −2,3 до +1,1, не отличить от нуля');
    await user.hover(all('error-bar-hit')[0] as Element);
    expect(flat(tooltip()?.textContent)).toContain('Новый онбординг');
  });
});

describe('SpanChart', () => {
  const data = [
    { label: 'Стажёр', start: 60, end: 80, mark: 70 },
    { label: 'Руководитель', start: 380, end: 560 },
  ];

  it('bars from start to end with the range label and an optional mark', () => {
    render(<SpanChart aria-label="Вилки зарплат" data={data} unit="тыс" markLabel="Медиана" />);
    const bars = all('span-bar');
    expect(bars).toHaveLength(2);
    expect(num(bars[1], 'width')).toBeGreaterThan(num(bars[0], 'width'));
    expect(all('span-mark')).toHaveLength(1);
    expect(screen.getByText('60–80', { selector: 'text' })).toBeTruthy();
    expect(screen.getByText('Медиана', { selector: 'li' })).toBeTruthy();
  });

  it('rows step with ↓', async () => {
    const user = userEvent.setup();
    render(<SpanChart aria-label="Вилки зарплат" data={data} markLabel="Медиана" />);
    plot('Вилки зарплат').focus();
    await user.keyboard('{ArrowDown}');
    expect(live('Вилки зарплат')).toBe('Стажёр: 60–80, Медиана 70');
    await user.hover(all('span-hit')[1] as Element);
    expect(flat(tooltip()?.textContent)).toContain('380–560');
  });
});

describe('StemLeafChart', () => {
  const days = [13, 14, 17, 18, 20, 22, 23, 27, 27, 28, 29, 30, 30, 31, 31, 35, 35, 35, 37, 38, 38, 39, 40, 40, 41, 41, 42, 43, 45, 46, 46, 48, 48, 48, 49, 50, 53, 53, 53, 55, 56, 56, 58, 59, 64, 64, 69];

  it('stems, ascending leaves, counts and the median row', () => {
    render(<StemLeafChart aria-label="Сроки закрытия сделок" values={days} />);
    const rows = all('stem-leaf-row');
    expect(rows).toHaveLength(6);
    expect(rows[0]?.textContent).toContain('3478');
    expect(rows.map((row) => row.hasAttribute('data-median'))).toEqual([false, false, false, true, false, false]);
    expect(within(rows[3] as HTMLElement).getByText('13 · медиана')).toBeTruthy();
  });

  it('rows step and read the range', async () => {
    const user = userEvent.setup();
    render(<StemLeafChart aria-label="Сроки закрытия сделок" values={days} />);
    plot('Сроки закрытия сделок').focus();
    await user.keyboard('{ArrowDown}');
    expect(live('Сроки закрытия сделок')).toBe('10–19: 4 значения, 13, 14, 17, 18');
    await user.hover(all('stem-leaf-row')[5] as Element);
    expect(flat(tooltip()?.textContent)).toContain('60–69');
  });
});
