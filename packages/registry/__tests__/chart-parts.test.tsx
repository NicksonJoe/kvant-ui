import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CirclePackingChart,
  IcicleChart,
  MarimekkoChart,
  NightingaleChart,
  ParliamentChart,
  PercentBarChart,
  PieChart,
  SunburstChart,
  TreemapChart,
  VennChart,
  VoronoiTreemapChart,
  WaffleChart,
} from '..';

const num = (el: Element | undefined, name: string) => Number(el?.getAttribute(`data-${name}`));
const marks = (root: ParentNode = document) => [...root.querySelectorAll('[data-slot=parts-chart-mark]')];
const text = (value: string | null | undefined) => value?.replace(/\u00a0/g, ' ');
const live = () => text(document.querySelector('[aria-live]')?.textContent);
const tooltip = () => document.querySelector('[data-slot=chart-tooltip]');
const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const close = (actual: number, expected: number, tolerance: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
const TAU = Math.PI * 2;
/** Text drawn in the SVG, not the screen-reader table next to it. */
const plot = () => within(document.querySelector('[data-slot=parts-chart] svg') as unknown as HTMLElement);

const OriginalObserver = globalThis.ResizeObserver;
afterEach(() => {
  globalThis.ResizeObserver = OriginalObserver;
});
/** Makes useWidth report `width`, as a phone card would. */
function withWidth(width: number) {
  globalThis.ResizeObserver = class implements ResizeObserver {
    private readonly callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe(target: Element) {
      this.callback([{ target, contentRect: { width } as DOMRectReadOnly } as ResizeObserverEntry], this);
    }
    unobserve() {}
    disconnect() {}
  };
}

async function stepWith(name: string, keys: string) {
  const user = userEvent.setup();
  const plot = screen.getByRole('group', { name });
  expect(plot.getAttribute('aria-roledescription')).toBe('график');
  plot.focus();
  await user.keyboard(keys);
  return live();
}

const channels = [
  { label: 'Партнёры', value: 2_760_000 },
  { label: 'Сайт', value: 8_460_000 },
  { label: 'Офлайн', value: 1_480_000 },
  { label: 'Маркетплейсы', value: 5_700_000 },
];

describe('PieChart', () => {
  it('starts at 12 o’clock clockwise, largest first, angles to scale', () => {
    render(<PieChart aria-label="Выручка по каналам" data={channels} />);
    const slices = marks();
    expect(slices.map((slice) => slice.getAttribute('data-label'))).toEqual(['Сайт', 'Маркетплейсы', 'Партнёры', 'Офлайн']);
    expect(num(slices[0], 'start')).toBe(0);
    close(num(slices[3], 'end'), TAU, 1e-9);
    for (let i = 1; i < slices.length; i += 1) close(num(slices[i], 'start'), num(slices[i - 1], 'end'), 1e-9);
    close(num(slices[0], 'end') - num(slices[0], 'start'), (8_460_000 / 18_400_000) * TAU, 1e-9);
    // a surface stroke separates the slices
    expect(slices[0]?.getAttribute('stroke')).toBe('var(--color-surface-1)');
  });

  it('labels outside with a leader line, or lists shares under a narrow pie', () => {
    const { unmount } = render(<PieChart aria-label="Выручка по каналам" data={channels} />);
    expect(document.querySelectorAll('[data-slot=parts-chart-leader]')).toHaveLength(4);
    expect(plot().getByText('Маркетплейсы')).toBeTruthy();
    expect(plot().getByText('46 %')).toBeTruthy();
    unmount();
    withWidth(360);
    render(<PieChart aria-label="Выручка по каналам" data={channels} />);
    expect(document.querySelectorAll('[data-slot=parts-chart-leader]')).toHaveLength(0);
    const list = document.querySelector('[data-slot=parts-chart-list]');
    expect(list && within(list as HTMLElement).getByText('Маркетплейсы')).toBeTruthy();
  });

  it('steps slices with ← → Home End, shows a tooltip on hover and dims the rest', async () => {
    render(<PieChart aria-label="Выручка по каналам" data={channels} formatValue={(value) => `${(value / 1e6).toLocaleString('ru-RU')} млн ₽`} />);
    expect(await stepWith('Выручка по каналам', '{ArrowRight}')).toBe('Сайт: 8,46 млн ₽, 46,0 %');
    expect(await stepWith('Выручка по каналам', '{End}')).toBe('Офлайн: 1,48 млн ₽, 8,0 %');
    const slices = marks();
    fireEvent.pointerEnter(slices[1] as Element);
    expect(text(tooltip()?.textContent)).toContain('Маркетплейсы');
    expect(slices[0]?.getAttribute('opacity')).toBe('0.3');
    expect(slices[1]?.getAttribute('opacity')).toBe('1');
    // the data table carries every value
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(5);
  });
});

const cities = ['Москва', 'Санкт-Петербург', 'Казань'];
const citySeries = [
  { name: 'Сайт', values: [520, 440, 380] },
  { name: 'Партнёры', values: [300, 340, 270] },
  { name: 'Прямые', values: [180, 220, 350] },
];

describe('PercentBarChart', () => {
  it('fills every row to 100 % with 2 px gaps and labels wide segments inside', () => {
    render(<PercentBarChart aria-label="Доля каналов по городам" labels={cities} series={citySeries} />);
    const row = marks().filter((mark) => mark.getAttribute('data-row') === '0');
    expect(row).toHaveLength(3);
    const widths = row.map((mark) => num(mark, 'width'));
    const start = num(row[0], 'x');
    close(sum(widths) + 2 * (row.length - 1), 604 - start, 1e-6);
    close(widths[0] ?? 0, (604 - start) * 0.52 - 1, 1e-6);
    expect(plot().getAllByText('52 %')).toHaveLength(1);
    expect(plot().getByText('Санкт-Петербург')).toBeTruthy();
  });

  it('legend hides a series and the rest re-normalise to 100 %', async () => {
    const user = userEvent.setup();
    render(<PercentBarChart aria-label="Доля каналов по городам" labels={cities} series={citySeries} />);
    await user.click(screen.getByRole('button', { name: 'Партнёры' }));
    expect(screen.getByRole('button', { name: 'Партнёры' }).getAttribute('aria-pressed')).toBe('false');
    const row = marks().filter((mark) => mark.getAttribute('data-row') === '0');
    expect(row.map((mark) => mark.getAttribute('data-series'))).toEqual(['Сайт', 'Прямые']);
    close(num(row[0], 'share'), 520 / 700, 1e-9);
  });

  it('steps rows and shows the row tooltip', async () => {
    render(<PercentBarChart aria-label="Доля каналов по городам" labels={cities} series={citySeries} />);
    expect(await stepWith('Доля каналов по городам', '{ArrowRight}')).toBe('Москва: Сайт 52,0 %, Партнёры 30,0 %, Прямые 18,0 %');
    expect(text(tooltip()?.textContent)).toContain('Москва');
  });
});

const products = [
  { label: 'Склад Pro', value: 4_050, group: 'Склад' },
  { label: 'Касса Онлайн', value: 3_500, group: 'Касса' },
  { label: 'Маркетплейс', value: 2_940, group: 'Склад' },
  { label: 'Склад Lite', value: 2_390, group: 'Склад' },
  { label: 'Учёт ЭДО', value: 1_840, group: 'Сервисы' },
  { label: 'Курьеры', value: 1_290, group: 'Сервисы' },
  { label: 'Касса Мини', value: 1_100, group: 'Касса' },
  { label: 'Аналитика', value: 920, group: 'Сервисы' },
  { label: 'Обучение', value: 370, group: 'Сервисы' },
];
const productTotal = sum(products.map((item) => item.value));

describe('TreemapChart', () => {
  it('squarifies: areas to scale, largest at top left, no overlaps, nothing too thin', () => {
    render(<TreemapChart aria-label="Структура выручки" data={products} height={260} />);
    const tiles = marks();
    expect(tiles).toHaveLength(9);
    expect(tiles[0]?.getAttribute('data-label')).toBe('Склад Pro');
    expect([num(tiles[0], 'x'), num(tiles[0], 'y')]).toEqual([0, 0]);
    const rects = tiles.map((tile) => ({ x: num(tile, 'x'), y: num(tile, 'y'), w: num(tile, 'width'), h: num(tile, 'height'), v: num(tile, 'value') }));
    for (const rect of rects) {
      close((rect.w * rect.h) / (604 * 260), rect.v / productTotal, 1e-6);
      expect(rect.x + rect.w).toBeLessThanOrEqual(604 + 1e-6);
      expect(rect.y + rect.h).toBeLessThanOrEqual(260 + 1e-6);
      expect(Math.max(rect.w / rect.h, rect.h / rect.w)).toBeLessThan(4.5);
    }
    for (const [i, a] of rects.entries()) {
      for (const b of rects.slice(i + 1)) {
        const overlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 1e-6 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 1e-6;
        expect(overlap).toBe(false);
      }
    }
  });

  it('colours by group, labels only tiles that fit, legend hides a group', async () => {
    const user = userEvent.setup();
    render(<TreemapChart aria-label="Структура выручки" data={products} height={260} />);
    const tiles = marks();
    expect(tiles[0]?.getAttribute('fill')).toBe(tiles[2]?.getAttribute('fill'));
    expect(tiles[0]?.getAttribute('fill')).not.toBe(tiles[1]?.getAttribute('fill'));
    expect(plot().getByText('Склад Pro')).toBeTruthy();
    expect(plot().queryByText('Обучение')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Касса' }));
    const shown = marks();
    expect(shown).toHaveLength(7);
    close(sum(shown.map((tile) => num(tile, 'width') * num(tile, 'height'))), 604 * 260, 1e-3);
  });

  it('steps tiles by size and reads the share', async () => {
    render(<TreemapChart aria-label="Структура выручки" data={products} />);
    expect(await stepWith('Структура выручки', '{ArrowRight}{ArrowRight}')).toBe('Касса Онлайн: 3 500, 19,0 % · Касса');
    fireEvent.pointerEnter(marks()[3] as Element);
    expect(text(tooltip()?.textContent)).toContain('Склад Lite');
  });
});

const lines = [
  {
    label: 'Склад',
    children: [
      { label: 'Pro', value: 4_050 },
      { label: 'Маркетплейс', value: 2_940 },
      { label: 'Lite', value: 2_390 },
    ],
  },
  {
    label: 'Касса',
    children: [
      { label: 'Онлайн', value: 3_500 },
      { label: 'Мини', value: 1_100 },
    ],
  },
  {
    label: 'Сервисы',
    children: [
      { label: 'ЭДО', value: 1_840 },
      { label: 'Курьеры', value: 1_290 },
      { label: 'Аналитика', value: 1_290 },
    ],
  },
];

describe('SunburstChart', () => {
  it('puts lines on the inner ring, products inside their line’s span on the outer, the total in the centre', () => {
    render(<SunburstChart aria-label="Структура выручки по линейкам" data={lines} formatTotal={(total) => (total / 1000).toLocaleString('ru-RU')} totalLabel="млн ₽" />);
    const inner = marks().filter((mark) => mark.getAttribute('data-depth') === '1');
    const outer = marks().filter((mark) => mark.getAttribute('data-depth') === '2');
    expect(inner).toHaveLength(3);
    expect(outer).toHaveLength(8);
    close(num(inner[2], 'end'), TAU, 1e-9);
    close(num(inner[0], 'end'), (9_380 / 18_400) * TAU, 1e-9);
    for (const child of outer) {
      const parent = inner.find((mark) => mark.getAttribute('data-label') === child.getAttribute('data-group'));
      expect(num(child, 'start')).toBeGreaterThanOrEqual(num(parent, 'start') - 1e-9);
      expect(num(child, 'end')).toBeLessThanOrEqual(num(parent, 'end') + 1e-9);
      expect(child.getAttribute('fill')).toBe(parent?.getAttribute('fill'));
      // 4 px between the rings
      expect(num(child, 'inner') - num(parent, 'outer')).toBe(4);
    }
    const total = document.querySelector('[data-slot=parts-chart-total]') as HTMLElement;
    expect(within(total as unknown as HTMLElement).getByText('18,4')).toBeTruthy();
    expect(within(total as unknown as HTMLElement).getByText('млн ₽')).toBeTruthy();
    expect(plot().getByText('Pro 22 %')).toBeTruthy();
  });

  it('legend hides a line and the rings close the gap', async () => {
    const user = userEvent.setup();
    render(<SunburstChart aria-label="Структура выручки по линейкам" data={lines} />);
    await user.click(screen.getByRole('button', { name: 'Касса' }));
    const inner = marks().filter((mark) => mark.getAttribute('data-depth') === '1');
    expect(inner.map((mark) => mark.getAttribute('data-label'))).toEqual(['Склад', 'Сервисы']);
    close(num(inner[1], 'end'), TAU, 1e-9);
  });

  it('steps sectors line by line and hides outer labels on a narrow card', async () => {
    withWidth(360);
    render(<SunburstChart aria-label="Структура выручки по линейкам" data={lines} />);
    expect(plot().queryByText('Pro 22 %')).toBeNull();
    expect(await stepWith('Структура выручки по линейкам', '{ArrowRight}{ArrowRight}')).toBe('Склад · Pro: 4 050, 22,0 %');
  });
});

describe('IcicleChart', () => {
  it('stacks root, lines and products in rows; widths are shares; labels only from 52 px', () => {
    render(<IcicleChart aria-label="Иерархия выручки" data={lines} rootLabel="Выручка" formatValue={(value) => `${(value / 1000).toLocaleString('ru-RU')} млн ₽`} />);
    const rows = [0, 1, 2].map((depth) => marks().filter((mark) => mark.getAttribute('data-depth') === String(depth)));
    expect(rows.map((row) => row.length)).toEqual([1, 3, 8]);
    expect(rows[0]?.[0]?.getAttribute('fill')).toBe('var(--color-surface-3)');
    expect(num(rows[1]?.[0], 'y')).toBe(74);
    close(num(rows[1]?.[0], 'width'), 604 * (9_380 / 18_400) - 1, 1e-6);
    expect(plot().getByText('Выручка · 18,4 млн ₽ · 100 %')).toBeTruthy();
    expect(plot().getByText('Склад · 51 %')).toBeTruthy();
    // Мини is 1 100 of 18 400 → 36 px, too narrow for a label
    expect(plot().queryByText('Мини')).toBeNull();
  });

  it('steps segments and shows the tooltip', async () => {
    render(<IcicleChart aria-label="Иерархия выручки" data={lines} />);
    expect(await stepWith('Иерархия выручки', '{ArrowRight}')).toBe('Всего: 18 400, 100,0 %');
    expect(await stepWith('Иерархия выручки', '{ArrowRight}')).toBe('Склад: 9 380, 51,0 %');
    fireEvent.pointerEnter(marks().find((mark) => mark.getAttribute('data-label') === 'Онлайн') as Element);
    expect(text(tooltip()?.textContent)).toContain('Касса · Онлайн');
  });
});

const waffle = [
  { label: 'Сайт', value: 45.6 },
  { label: 'Маркетплейсы', value: 30.7 },
  { label: 'Партнёры', value: 15.2 },
  { label: 'Офлайн', value: 8.5 },
];

describe('WaffleChart', () => {
  it('rounds to 100 cells by largest remainder and fills columns bottom up', () => {
    render(<WaffleChart aria-label="Каналы: 100 клеток" data={waffle} />);
    const cells = marks();
    expect(cells).toHaveLength(100);
    const count = (label: string) => cells.filter((cell) => cell.getAttribute('data-label') === label).length;
    expect(waffle.map((item) => count(item.label))).toEqual([46, 31, 15, 8]);
    expect([num(cells[0], 'col'), num(cells[0], 'row')]).toEqual([0, 9]);
    expect([num(cells[9], 'col'), num(cells[9], 'row')]).toEqual([0, 0]);
    expect([num(cells[10], 'col'), num(cells[10], 'row')]).toEqual([1, 9]);
    expect(num(cells[10], 'x') - num(cells[0], 'x')).toBe(26);
    expect(screen.getByText('46 из 100 · 46 %')).toBeTruthy();
  });

  it('hover highlights the whole category, keys step categories', async () => {
    render(<WaffleChart aria-label="Каналы: 100 клеток" data={waffle} />);
    const cells = marks();
    fireEvent.pointerEnter(cells[60] as Element);
    expect(text(tooltip()?.textContent)).toContain('Маркетплейсы');
    expect(cells[0]?.getAttribute('opacity')).toBe('0.3');
    expect(cells[50]?.getAttribute('opacity')).toBe('1');
    expect(await stepWith('Каналы: 100 клеток', '{End}')).toBe('Офлайн: 8 из 100, 8,5 %');
  });
});

const regions = ['Москва', 'Санкт-Петербург', 'Сибирь'];
const regionSeries = [
  { name: 'Сайт', values: [1_976, 968, 180] },
  { name: 'Партнёры', values: [1_140, 748, 240] },
  { name: 'Прямые', values: [684, 484, 180] },
];

describe('MarimekkoChart', () => {
  it('column widths are market shares, segments are shares inside the column, first series at the bottom', () => {
    render(<MarimekkoChart aria-label="Рынок по регионам и каналам" labels={regions} series={regionSeries} />);
    const all = marks();
    const column = (index: number) => all.filter((mark) => mark.getAttribute('data-column') === String(index));
    const total = 3_800 + 2_200 + 600;
    close(num(column(0)[0], 'width'), 604 * (3_800 / total) - 1, 1e-6);
    const moscow = column(0);
    expect(moscow.map((mark) => mark.getAttribute('data-series'))).toEqual(['Сайт', 'Партнёры', 'Прямые']);
    expect(num(moscow[0], 'y')).toBeGreaterThan(num(moscow[1], 'y'));
    close(num(moscow[0], 'height'), 220 * 0.52 - 1, 1e-6);
    expect(plot().getByText('58 % рынка')).toBeTruthy();
    // Сибирь is 55 px wide: no labels inside
    expect(column(2).length).toBe(3);
    expect(plot().getAllByText('30 %')).toHaveLength(1);
    expect(plot().queryByText('40 %')).toBeNull();
  });

  it('legend hides a series, tooltip names column and series', async () => {
    const user = userEvent.setup();
    render(<MarimekkoChart aria-label="Рынок по регионам и каналам" labels={regions} series={regionSeries} />);
    await user.click(screen.getByRole('button', { name: 'Прямые' }));
    expect(marks().filter((mark) => mark.getAttribute('data-column') === '0')).toHaveLength(2);
    expect(await stepWith('Рынок по регионам и каналам', '{ArrowRight}')).toBe('Москва · Сайт: 1 976, 63,4 %');
    fireEvent.pointerEnter(marks()[1] as Element);
    expect(text(tooltip()?.textContent)).toContain('Партнёры');
  });
});

const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const monthValues = [62, 58, 74, 88, 100, 94, 80, 77, 99, 116, 136, 158];

describe('NightingaleChart', () => {
  it('equal angles from 12 o’clock, radius ∝ √value, highlighted months in colour', () => {
    render(
      <NightingaleChart
        aria-label="Выручка по месяцам: роза"
        data={months.map((label, i) => ({ label, value: monthValues[i] ?? 0 }))}
        highlight={['Окт', 'Ноя', 'Дек']}
        legendLabels={{ base: 'Месяц', highlight: 'Последний квартал' }}
      />,
    );
    const petals = marks();
    expect(petals).toHaveLength(12);
    expect(num(petals[0], 'start')).toBe(0);
    close(num(petals[1], 'start'), TAU / 12, 1e-9);
    const R = num(petals[11], 'r');
    close(num(petals[0], 'r'), R * Math.sqrt(62 / 158), 1e-9);
    expect(petals[11]?.getAttribute('fill')).toBe('var(--color-chart-1)');
    expect(petals[0]?.getAttribute('fill')).toBe('var(--color-seq-3)');
    expect(screen.getByText('Последний квартал')).toBeTruthy();
    expect(plot().getByText('Июл')).toBeTruthy();
  });

  it('steps months', async () => {
    render(<NightingaleChart aria-label="Роза" data={months.map((label, i) => ({ label, value: monthValues[i] ?? 0 }))} />);
    expect(await stepWith('Роза', '{End}')).toBe('Дек: 158');
  });
});

const team = [
  { label: 'Продажи', value: 38 },
  { label: 'Разработка', value: 34 },
  { label: 'Поддержка', value: 22 },
  { label: 'Маркетинг', value: 14 },
  { label: 'Офис', value: 12, other: true },
];

describe('ParliamentChart', () => {
  it('seats every person in 5 rows, departments left to right, «other» in fg-4', () => {
    render(<ParliamentChart aria-label="Команда по отделам" data={team} totalLabel="сотрудников" />);
    const seats = marks();
    expect(seats).toHaveLength(120);
    expect(new Set(seats.map((seat) => num(seat, 'radius'))).size).toBe(5);
    const angles = (label: string) => seats.filter((seat) => seat.getAttribute('data-label') === label).map((seat) => num(seat, 'angle'));
    expect(team.map((item) => angles(item.label).length)).toEqual([38, 34, 22, 14, 12]);
    for (let i = 1; i < team.length; i += 1) {
      expect(Math.min(...angles(team[i - 1]?.label ?? ''))).toBeGreaterThanOrEqual(Math.max(...angles(team[i]?.label ?? '')) - 1e-9);
    }
    const office = seats.find((seat) => seat.getAttribute('data-label') === 'Офис');
    expect(office?.getAttribute('fill')).toBe('var(--color-fg-4)');
    const r = num(seats[0], 'r');
    for (const [i, a] of seats.entries()) {
      for (const b of seats.slice(i + 1)) expect(Math.hypot(num(a, 'cx') - num(b, 'cx'), num(a, 'cy') - num(b, 'cy'))).toBeGreaterThanOrEqual(2 * r);
    }
    expect(plot().getByText('120')).toBeTruthy();
    expect(plot().getByText('сотрудников')).toBeTruthy();
    expect(screen.getByText('Продажи · 38')).toBeTruthy();
  });

  it('hover highlights the department, keys step departments', async () => {
    render(<ParliamentChart aria-label="Команда по отделам" data={team} />);
    fireEvent.pointerEnter(marks()[0] as Element);
    expect(text(tooltip()?.textContent)).toContain('Продажи');
    // keys continue from the hovered department
    expect(await stepWith('Команда по отделам', '{ArrowRight}')).toBe('Разработка: 34, 28,3 %');
  });
});

const sets = [{ label: 'Касса', legend: 'Купили кассу' }, { label: 'Склад', legend: 'Купили склад' }, { label: 'ЭДО', legend: 'Подключили ЭДО' }];
const vennRegions = [
  { sets: ['Касса'], value: 1_840 },
  { sets: ['Склад'], value: 1_210 },
  { sets: ['ЭДО'], value: 960 },
  { sets: ['Касса', 'Склад'], value: 640 },
  { sets: ['Касса', 'ЭДО'], value: 310 },
  { sets: ['Склад', 'ЭДО'], value: 270 },
  { sets: ['Касса', 'Склад', 'ЭДО'], value: 180 },
];

function lens(r1: number, r2: number, d: number) {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const a = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
  const b = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
  return a + b - 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
}

describe('VennChart', () => {
  it('draws three equal outline circles and the count of every exact combination', () => {
    render(<VennChart aria-label="Пересечение продуктов" sets={sets} regions={vennRegions} />);
    const circles = [...document.querySelectorAll('[data-slot=parts-chart-set]')];
    expect(circles).toHaveLength(3);
    expect(new Set(circles.map((circle) => num(circle, 'r'))).size).toBe(1);
    expect(circles[0]?.getAttribute('fill')).toBe('none');
    expect(circles[0]?.getAttribute('stroke-width')).toBe('2.5');
    for (const value of ['1 840', '1 210', '960', '640', '310', '270', '180']) expect(plot().getByText(value)).toBeTruthy();
    expect(plot().getByText('все три')).toBeTruthy();
    expect(screen.getByText('Подключили ЭДО')).toBeTruthy();
    expect(marks()).toHaveLength(7);
  });

  it('Euler mode: circle areas and the overlap follow the counts', () => {
    render(
      <VennChart
        aria-label="Касса и склад"
        proportional
        sets={sets.slice(0, 2)}
        regions={[
          { sets: ['Касса'], value: 2_000 },
          { sets: ['Склад'], value: 1_000 },
          { sets: ['Касса', 'Склад'], value: 500 },
        ]}
      />,
    );
    const [a, b] = [...document.querySelectorAll('[data-slot=parts-chart-set]')];
    const ra = num(a, 'r');
    const rb = num(b, 'r');
    close((ra * ra) / (rb * rb), 2_500 / 1_500, 1e-6);
    const d = Math.hypot(num(a, 'cx') - num(b, 'cx'), num(a, 'cy') - num(b, 'cy'));
    close(lens(ra, rb, d) / (Math.PI * ra * ra), 500 / 2_500, 1e-3);
  });

  it('steps regions and names the combination', async () => {
    render(<VennChart aria-label="Пересечение продуктов" sets={sets} regions={vennRegions} />);
    expect(await stepWith('Пересечение продуктов', '{ArrowRight}'.repeat(4))).toBe('Касса и Склад: 640');
    fireEvent.pointerEnter(marks()[6] as Element);
    expect(text(tooltip()?.textContent)).toContain('Касса, Склад и ЭДО');
  });
});

describe('VoronoiTreemapChart', () => {
  it('cells inside the circle with areas close to the shares, the same layout on every render', () => {
    const { unmount } = render(<VoronoiTreemapChart aria-label="Продукты в форме круга" data={products} />);
    const cells = marks();
    expect(cells).toHaveLength(9);
    const R = num(document.querySelector('[data-slot=parts-chart-bound]') ?? undefined, 'r');
    const cx = num(document.querySelector('[data-slot=parts-chart-bound]') ?? undefined, 'cx');
    const cy = num(document.querySelector('[data-slot=parts-chart-bound]') ?? undefined, 'cy');
    const areas = cells.map((cell) => num(cell, 'area'));
    const whole = sum(areas);
    close(whole, Math.PI * R * R, Math.PI * R * R * 0.01);
    let error = 0;
    for (const [i, cell] of cells.entries()) {
      const target = num(cell, 'value') / productTotal;
      const share = (areas[i] ?? 0) / whole;
      expect(Math.abs(share - target) / target).toBeLessThan(0.08);
      error += Math.abs(share - target);
      const points = (cell.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
      for (let k = 0; k < points.length; k += 2) expect(Math.hypot((points[k] ?? 0) - cx, (points[k + 1] ?? 0) - cy)).toBeLessThanOrEqual(R + 0.5);
    }
    expect(error).toBeLessThan(0.02);
    const first = cells.map((cell) => cell.getAttribute('d'));
    unmount();
    render(<VoronoiTreemapChart aria-label="Продукты в форме круга" data={products} />);
    expect(marks().map((cell) => cell.getAttribute('d'))).toEqual(first);
  });

  it('names cells from 9 %, numbers below, steps cells', async () => {
    render(<VoronoiTreemapChart aria-label="Продукты в форме круга" data={products} />);
    expect(plot().getByText('Учёт ЭДО')).toBeTruthy();
    expect(plot().queryByText('Курьеры')).toBeNull();
    expect(plot().getByText('7 %')).toBeTruthy();
    expect(await stepWith('Продукты в форме круга', '{ArrowRight}')).toBe('Склад Pro: 4 050, 22,0 % · Склад');
  });
});

describe('CirclePackingChart', () => {
  const packed = products.map((item) => ({ ...item, value: Math.round(item.value / 10) }));

  it('areas ∝ values, circles 1,5 px apart, all inside the whole', () => {
    render(<CirclePackingChart aria-label="Продукты кругами" data={packed} />);
    const circles = marks();
    expect(circles).toHaveLength(9);
    const r0 = num(circles[0], 'r');
    const v0 = num(circles[0], 'value');
    for (const circle of circles) close((num(circle, 'r') / r0) ** 2, num(circle, 'value') / v0, 1e-6);
    for (const [i, a] of circles.entries()) {
      for (const b of circles.slice(i + 1)) {
        const d = Math.hypot(num(a, 'cx') - num(b, 'cx'), num(a, 'cy') - num(b, 'cy'));
        expect(d - num(a, 'r') - num(b, 'r')).toBeGreaterThanOrEqual(1.4);
      }
    }
    const bound = document.querySelector('[data-slot=parts-chart-bound]') ?? undefined;
    expect(bound?.getAttribute('fill')).toBe('var(--color-fill-1)');
    for (const circle of circles) {
      expect(Math.hypot(num(circle, 'cx') - num(bound, 'cx'), num(circle, 'cy') - num(bound, 'cy')) + num(circle, 'r')).toBeLessThanOrEqual(num(bound, 'r'));
    }
  });

  it('names circles that fit, numbers small ones, legend hides a group', async () => {
    const user = userEvent.setup();
    render(<CirclePackingChart aria-label="Продукты кругами" data={packed} formatValue={(value) => `${value} тыс`} />);
    expect(plot().getByText('Склад Pro')).toBeTruthy();
    expect(plot().getByText('405 тыс')).toBeTruthy();
    expect(plot().queryByText('Обучение')).toBeNull();
    expect(plot().getByText('37')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Сервисы' }));
    expect(marks()).toHaveLength(5);
    expect(await stepWith('Продукты кругами', '{Home}')).toBe('Склад Pro: 405 тыс, 29,0 % · Склад');
  });
});
