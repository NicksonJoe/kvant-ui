import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BarTableChart, BumpChart, OrderedBarChart, RankStripChart, SlopeChart, type BarTableColumn } from '..';

const slots = (name: string) => [...document.querySelectorAll<HTMLElement | SVGElement>(`[data-slot=${name}]`)];
const tooltip = () => document.querySelector<HTMLElement>('[data-slot=chart-tooltip]');
const num = (el: Element | undefined, attr: string) => Number(el?.getAttribute(attr));

describe('OrderedBarChart', () => {
  const managers = [
    { label: 'Олег Панов', value: 1_120_000 },
    { label: 'Анна Северова', value: 1_840_000 },
    { label: 'Вы · Дарья Ким', value: 1_310_000 },
    { label: 'Пётр Гаев', value: 480_000 },
  ];

  it('sorts descending, numbers the places and scales bars to the largest value', () => {
    render(<OrderedBarChart aria-label="Рейтинг менеджеров" data={managers} focus="Вы · Дарья Ким" />);
    expect(screen.getByRole('group', { name: 'Рейтинг менеджеров' })).toBeTruthy();
    const rows = slots('ordered-bar-row');
    expect(rows.map((row) => row.dataset.label)).toEqual(['Анна Северова', 'Вы · Дарья Ким', 'Олег Панов', 'Пётр Гаев']);
    expect(rows.map((row) => row.dataset.rank)).toEqual(['1', '2', '3', '4']);
    const bars = slots('ordered-bar') as HTMLElement[];
    const first = parseFloat(bars[0]?.style.width ?? '0');
    const last = parseFloat(bars[3]?.style.width ?? '0');
    expect(first).toBeGreaterThan(0);
    expect(last / first).toBeCloseTo(480 / 1840, 2);
  });

  it('marks only the focus row and keeps the others neutral', () => {
    render(<OrderedBarChart aria-label="Рейтинг" data={managers} focus="Вы · Дарья Ким" />);
    const focused = slots('ordered-bar-row').filter((row) => row.dataset.focus !== undefined);
    expect(focused.map((row) => row.dataset.label)).toEqual(['Вы · Дарья Ким']);
  });

  it('reads the data as a table', () => {
    render(<OrderedBarChart aria-label="Рейтинг" data={managers} formatValue={(value) => `${value / 1e6} млн ₽`} />);
    const table = screen.getByRole('table', { name: 'Рейтинг' });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(within(table).getByText('1.84 млн ₽')).toBeTruthy();
  });

  it('steps through places with arrows and announces them', async () => {
    const user = userEvent.setup();
    render(<OrderedBarChart aria-label="Рейтинг" data={managers} formatValue={(value) => `${value / 1e6} млн ₽`} />);
    const plot = screen.getByRole('group', { name: 'Рейтинг' });
    plot.focus();
    await user.keyboard('{ArrowDown}');
    expect(tooltip()?.textContent).toContain('Анна Северова');
    expect(plot.querySelector('[aria-live]')?.textContent).toContain('1 место');
    await user.keyboard('{End}');
    expect(tooltip()?.textContent).toContain('Пётр Гаев');
    await user.keyboard('{ArrowUp}');
    expect(tooltip()?.textContent).toContain('Олег Панов');
    fireEvent.blur(plot);
    expect(tooltip()).toBeNull();
  });

  it('shows the tooltip on hover', () => {
    render(<OrderedBarChart aria-label="Рейтинг" data={managers} />);
    fireEvent.pointerEnter(slots('ordered-bar-row')[2] as HTMLElement);
    expect(tooltip()?.textContent).toContain('Олег Панов');
  });
});

describe('SlopeChart', () => {
  const channels = [
    { label: 'Рекомендации', from: 5.2, to: 5.5 },
    { label: 'Партнёры', from: 4.4, to: 3.0 },
    { label: 'Реклама', from: 3.8, to: 2.1 },
    { label: 'Сайт', from: 2.4, to: 3.6 },
    { label: 'Соцсети', from: 1.3, to: 1.2 },
  ];
  const pct = (value: number) => `${value.toLocaleString('ru-RU', { minimumFractionDigits: 1 })} %`;

  it('draws one line per item between the two period axes, higher values higher up', () => {
    render(<SlopeChart aria-label="Конверсия по каналам" periods={['Сентябрь', 'Октябрь']} data={channels} focus="Сайт" formatValue={pct} />);
    const lines = slots('slope-line');
    expect(lines).toHaveLength(5);
    const site = lines.find((line) => line.dataset.label === 'Сайт');
    expect(site?.dataset.focus).toBeDefined();
    expect(num(site, 'y2')).toBeLessThan(num(site, 'y1'));
    const social = lines.find((line) => line.dataset.label === 'Соцсети');
    const referrals = lines.find((line) => line.dataset.label === 'Рекомендации');
    expect(num(referrals, 'y1')).toBeLessThan(num(social, 'y1'));
    expect(screen.getByText('Сентябрь', { selector: 'text' })).toBeTruthy();
    expect(screen.getByText('Октябрь', { selector: 'text' })).toBeTruthy();
  });

  it('labels the start with name and value, the end with the value, and never lets labels collide', () => {
    render(
      <SlopeChart
        aria-label="Конверсия"
        periods={['Сентябрь', 'Октябрь']}
        data={[...channels, { label: 'Выставки', from: 4.3, to: 3.05 }]}
        formatValue={pct}
      />,
    );
    expect(screen.getByText('Сайт 2,4 %', { selector: 'text' })).toBeTruthy();
    expect(screen.getByText('3,6 %', { selector: 'text' })).toBeTruthy();
    for (const side of ['start', 'end']) {
      const ys = slots('slope-label')
        .filter((label) => label.dataset.side === side)
        .map((label) => num(label, 'y'))
        .sort((a, b) => a - b);
      for (let i = 1; i < ys.length; i += 1) expect((ys[i] ?? 0) - (ys[i - 1] ?? 0)).toBeGreaterThanOrEqual(16);
    }
  });

  it('steps through items with arrows: tooltip with both periods and the change', async () => {
    const user = userEvent.setup();
    render(<SlopeChart aria-label="Конверсия" periods={['Сентябрь', 'Октябрь']} data={channels} formatValue={pct} />);
    const plot = screen.getByRole('group', { name: 'Конверсия' });
    plot.focus();
    await user.keyboard('{ArrowRight}');
    const tip = tooltip();
    expect(tip?.textContent).toContain('Рекомендации');
    expect(tip?.textContent).toContain('Сентябрь');
    expect(tip?.textContent).toContain('5,5 %');
    expect(tip?.textContent).toContain('+0,3');
    expect(slots('slope-line').find((line) => line.dataset.active !== undefined)?.dataset.label).toBe('Рекомендации');
    await user.keyboard('{End}');
    expect(plot.querySelector('[aria-live]')?.textContent).toContain('Соцсети');
  });
});

describe('BumpChart', () => {
  const months = ['Мар', 'Апр', 'Май', 'Июн'];
  const products = [
    { name: 'Склад Pro', ranks: [1, 1, 1, 2] },
    { name: 'Маркетплейс', ranks: [2, 3, 2, 1] },
    { name: 'Склад Lite', ranks: [3, 2, 4, 4] },
    { name: 'Касса Онлайн', ranks: [4, 4, 3, 3] },
  ];

  it('puts each period on a column and each place on an evenly spaced row', () => {
    render(<BumpChart aria-label="Места продуктов" labels={months} series={products} highlight={['Касса Онлайн', 'Склад Lite']} />);
    expect(slots('bump-line')).toHaveLength(4);
    const cash = slots('bump-point').filter((point) => point.dataset.series === 'Касса Онлайн');
    expect(cash).toHaveLength(4);
    const pro = slots('bump-point').filter((point) => point.dataset.series === 'Склад Pro');
    const step = num(cash[0], 'cy') - num(pro[0], 'cy');
    expect(step).toBeGreaterThan(0);
    expect(num(cash[2], 'cy') - num(pro[0], 'cy')).toBeCloseTo((step * 2) / 3, 5);
    expect(slots('bump-line').filter((line) => line.dataset.highlight !== undefined).map((line) => line.dataset.series)).toEqual(['Склад Lite', 'Касса Онлайн']);
  });

  it('names series at the start and the final place with the name at the finish', () => {
    render(<BumpChart aria-label="Места" labels={months} series={products} highlight={['Касса Онлайн']} />);
    expect(screen.getAllByText('Касса Онлайн').length).toBeGreaterThan(0);
    expect(screen.getByText('3 · Касса Онлайн')).toBeTruthy();
    expect(screen.getByText('1 · Маркетплейс')).toBeTruthy();
  });

  it('legend tells each highlighted story and hides series', async () => {
    const user = userEvent.setup();
    render(<BumpChart aria-label="Места" labels={months} series={products} highlight={['Касса Онлайн']} />);
    const story = screen.getByRole('button', { name: 'Касса Онлайн: с 4 на 3' });
    const others = screen.getByRole('button', { name: 'Остальные' });
    await user.click(story);
    expect(story.getAttribute('aria-pressed')).toBe('false');
    expect(slots('bump-line').map((line) => line.dataset.series)).not.toContain('Касса Онлайн');
    await user.click(others);
    expect(slots('bump-line')).toHaveLength(0);
  });

  it('steps through periods with a tooltip listing the places', async () => {
    const user = userEvent.setup();
    render(<BumpChart aria-label="Места" labels={months} series={products} tooltipLabels={['Март', 'Апрель', 'Май', 'Июнь']} />);
    const plot = screen.getByRole('group', { name: 'Места' });
    plot.focus();
    await user.keyboard('{End}');
    const rows = [...(tooltip()?.querySelectorAll('.flex-1') ?? [])].map((row) => row.textContent);
    expect(tooltip()?.textContent).toContain('Июнь');
    expect(rows).toEqual(['Маркетплейс', 'Склад Pro', 'Касса Онлайн', 'Склад Lite']);
    expect(plot.querySelector('[aria-live]')?.textContent).toContain('1 — Маркетплейс');
  });
});

describe('RankStripChart', () => {
  const factors = [
    { label: 'Цена', rank: 4, previous: 3 },
    { label: 'Скорость доставки', rank: 2, previous: 2 },
    { label: 'Поддержка', rank: 1, previous: 3 },
  ];

  it('puts the current place as a numbered circle on an 8-place track, the previous as a ring', () => {
    render(<RankStripChart aria-label="Наше место" data={factors} places={8} previousLabel="Квартал назад" />);
    expect(screen.getByText('место среди 8')).toBeTruthy();
    expect(slots('rank-strip-row')).toHaveLength(3);
    const current = slots('rank-strip-current');
    expect(current.map((item) => item.textContent)).toEqual(['4', '2', '1']);
    // the unchanged factor draws no ring
    expect(slots('rank-strip-previous')).toHaveLength(2);
    const [price, , support] = current;
    expect(num(support, 'data-cx')).toBeLessThan(num(price, 'data-cx'));
  });

  it('spells the change with an arrow and a number, never colour alone', () => {
    render(<RankStripChart aria-label="Наше место" data={factors} places={8} />);
    expect(slots('rank-strip-change').map((item) => item.textContent)).toEqual(['↓ 1', 'без изм.', '↑ 2']);
  });

  it('legend hides the previous places', async () => {
    const user = userEvent.setup();
    render(<RankStripChart aria-label="Наше место" data={factors} places={8} previousLabel="Квартал назад" />);
    await user.click(screen.getByRole('button', { name: 'Квартал назад' }));
    expect(slots('rank-strip-previous')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Сейчас' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('steps through rows with arrows', async () => {
    const user = userEvent.setup();
    render(<RankStripChart aria-label="Наше место" data={factors} places={8} previousLabel="Квартал назад" />);
    const plot = screen.getByRole('group', { name: 'Наше место' });
    plot.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(tooltip()?.textContent).toContain('Скорость доставки');
    expect(tooltip()?.textContent).toContain('2 из 8');
    expect(plot.querySelector('[aria-live]')?.textContent).toContain('Скорость доставки');
  });
});

describe('BarTableChart', () => {
  interface Manager {
    name: string;
    deals: number;
    revenue: number;
    conversion: number;
    change: number;
  }
  const managers: Manager[] = [
    { name: 'Анна Северова', deals: 31, revenue: 1.84, conversion: 28.4, change: 12 },
    { name: 'Михаил Орлов', deals: 27, revenue: 1.52, conversion: 24.1, change: 4 },
    { name: 'Дарья Ким', deals: 24, revenue: 1.31, conversion: 26.7, change: -3 },
  ];
  const columns: BarTableColumn<Manager>[] = [
    { id: 'name', header: 'Менеджер', kind: 'label', value: (row) => row.name, avatar: true },
    { id: 'deals', header: 'Сделки', kind: 'bar', value: (row) => row.deals },
    { id: 'conversion', header: 'Конверсия', kind: 'threshold', value: (row) => row.conversion, threshold: 25 },
    { id: 'change', header: 'К сентябрю', kind: 'delta', value: (row) => row.change },
  ];

  it('is a native table; bars share one scale per column', () => {
    render(<BarTableChart aria-label="Менеджеры" rows={managers} columns={columns} getRowId={(row) => row.name} />);
    const table = screen.getByRole('table', { name: 'Менеджеры' });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(4);
    const bars = slots('bar-table-bar') as HTMLElement[];
    expect(bars.map((bar) => bar.style.width)).toEqual(['100%', `${Math.round((27 / 31) * 1000) / 10}%`, `${Math.round((24 / 31) * 1000) / 10}%`]);
    expect(screen.getByRole('img', { name: 'Анна Северова' })).toBeTruthy();
  });

  it('fills threshold cells from the threshold and says so in words', () => {
    render(<BarTableChart aria-label="Менеджеры" rows={managers} columns={columns} getRowId={(row) => row.name} />);
    const chips = slots('bar-table-threshold');
    expect(chips.map((chip) => chip.dataset.above !== undefined)).toEqual([true, false, true]);
    expect(chips[0]?.textContent).toContain('выше порога');
  });

  it('shows deltas as soft status with an arrow and a word', () => {
    render(<BarTableChart aria-label="Менеджеры" rows={managers} columns={columns} getRowId={(row) => row.name} />);
    const deltas = slots('bar-table-delta');
    expect(deltas.map((delta) => delta.dataset.tone)).toEqual(['success', 'success', 'danger']);
    expect(deltas[2]?.textContent).toContain('Снижение');
    expect(deltas[2]?.textContent).toContain('−3\u00a0%');
  });

  it('sorts by a numeric column, largest first', async () => {
    const user = userEvent.setup();
    render(<BarTableChart aria-label="Менеджеры" rows={managers} columns={columns} getRowId={(row) => row.name} />);
    const header = screen.getByRole('columnheader', { name: /Конверсия/ });
    await user.click(within(header).getByRole('button'));
    expect(header.getAttribute('aria-sort')).toBe('descending');
    const names = slots('bar-table-label').map((label) => label.textContent);
    expect(names).toEqual(['Анна Северова', 'Дарья Ким', 'Михаил Орлов']);
    await user.click(within(header).getByRole('button'));
    expect(header.getAttribute('aria-sort')).toBe('ascending');
  });
});
