import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  BulletChart,
  ClevelandDotChart,
  GroupedBarChart,
  HorizontalBarChart,
  IsotypeChart,
  LollipopChart,
  ParallelCoordinatesChart,
  ProportionalAreaChart,
  RadarChart,
  RadialBarChart,
  StackedBarChart,
} from '..';

const marks = (slot: string) => Array.from(document.querySelectorAll<SVGElement>(`[data-slot=${slot}]`));
const attr = (el: Element | undefined, name: string) => el?.getAttribute(name) ?? null;
const num = (el: Element | undefined, name: string) => Number(attr(el, name));
const spoken = (plot: HTMLElement) => plot.querySelector('[aria-live]')?.textContent ?? '';
const tooltip = () => document.querySelector<HTMLElement>('[data-slot=chart-tooltip]');
const thousand = (value: number) => `${value} тыс`;

async function focusPlot(name: string) {
  const plot = screen.getByRole('group', { name });
  act(() => plot.focus());
  return plot;
}

describe('HorizontalBarChart', () => {
  const data = [
    { label: 'Аналитика', value: 100 },
    { label: 'Склад Pro', value: 400 },
    { label: 'Касса Онлайн', value: 200 },
  ];

  it('sorts by value, scales lengths from a common zero and duplicates the data as a table', () => {
    render(<HorizontalBarChart aria-label="Выручка по товарам" name="Выручка" formatValue={thousand} data={data} />);
    const plot = screen.getByRole('group', { name: 'Выручка по товарам' });
    const bars = marks('chart-bar');
    expect(bars.map((bar) => attr(bar, 'data-label'))).toEqual(['Склад Pro', 'Касса Онлайн', 'Аналитика']);
    expect(num(bars[1], 'data-length') / num(bars[0], 'data-length')).toBeCloseTo(0.5);
    expect(num(bars[0], 'data-thickness')).toBe(16);
    const rows = within(within(plot).getByRole('table')).getAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(within(rows[1] as HTMLElement).getByText('400 тыс')).toBeDefined();
  });

  it('keeps the given order without sort', () => {
    render(<HorizontalBarChart aria-label="Выручка" sort={false} data={data} />);
    expect(marks('chart-bar').map((bar) => attr(bar, 'data-label'))).toEqual(['Аналитика', 'Склад Pro', 'Касса Онлайн']);
  });

  it('steps rows with arrows, Home and End, shows a tooltip and announces the value', async () => {
    const user = userEvent.setup();
    render(<HorizontalBarChart aria-label="Выручка по товарам" name="Выручка" formatValue={thousand} data={data} />);
    const plot = await focusPlot('Выручка по товарам');
    await user.keyboard('{ArrowDown}');
    expect(spoken(plot)).toBe('Склад Pro: 400 тыс');
    expect(tooltip()?.textContent).toContain('Выручка');
    await user.keyboard('{ArrowDown}');
    expect(spoken(plot)).toBe('Касса Онлайн: 200 тыс');
    await user.keyboard('{End}');
    expect(spoken(plot)).toBe('Аналитика: 100 тыс');
    await user.keyboard('{Home}');
    expect(spoken(plot)).toBe('Склад Pro: 400 тыс');
    act(() => plot.blur());
    expect(tooltip()).toBeNull();
  });

  it('shows the tooltip of the hovered row', async () => {
    const user = userEvent.setup();
    render(<HorizontalBarChart aria-label="Выручка" formatValue={thousand} data={data} />);
    await user.hover(marks('chart-hit')[2] as Element);
    expect(tooltip()?.textContent).toContain('Аналитика');
    expect(tooltip()?.textContent).toContain('100 тыс');
  });
});

describe('GroupedBarChart', () => {
  const props = {
    labels: ['I кв', 'II кв', 'III кв', 'IV кв'],
    series: [
      { name: 'План', values: [28, 32, 34, 38] },
      { name: 'Факт', values: [26, 33, 37, 21] },
    ],
  };

  it('draws 24px columns with a 2px gap inside each group and a note over the group', () => {
    render(<GroupedBarChart aria-label="План и факт" notes={[undefined, undefined, undefined, 'идёт']} {...props} />);
    const bars = marks('chart-bar');
    expect(bars).toHaveLength(8);
    expect(num(bars[0], 'data-thickness')).toBe(24);
    // the first group: План then Факт, side by side with a 2px gap
    const plan = bars.find((bar) => attr(bar, 'data-series') === 'План' && attr(bar, 'data-index') === '0');
    const fact = bars.find((bar) => attr(bar, 'data-series') === 'Факт' && attr(bar, 'data-index') === '0');
    expect(num(fact, 'data-x') - num(plan, 'data-x')).toBeCloseTo(26);
    expect(screen.getByText('идёт')).toBeDefined();
  });

  it('hides a series from the legend', async () => {
    const user = userEvent.setup();
    render(<GroupedBarChart aria-label="План и факт" {...props} />);
    const plan = screen.getByRole('button', { name: 'План' });
    await user.click(plan);
    expect(plan.getAttribute('aria-pressed')).toBe('false');
    expect(marks('chart-bar').every((bar) => attr(bar, 'data-series') === 'Факт')).toBe(true);
  });

  it('turns into horizontal bars', () => {
    render(<GroupedBarChart aria-label="План и факт" orientation="horizontal" {...props} />);
    expect(attr(document.querySelector('[data-slot=grouped-bar-chart]') ?? undefined, 'data-orientation')).toBe('horizontal');
    expect(num(marks('chart-bar')[0], 'data-thickness')).toBe(12);
  });

  it('steps groups and reads every series', async () => {
    const user = userEvent.setup();
    render(<GroupedBarChart aria-label="План и факт" formatValue={(value) => `${value} млн`} {...props} />);
    const plot = await focusPlot('План и факт');
    await user.keyboard('{ArrowRight}');
    expect(spoken(plot)).toBe('I кв: План 28 млн, Факт 26 млн');
    await user.keyboard('{End}');
    expect(spoken(plot)).toBe('IV кв: План 38 млн, Факт 21 млн');
    expect(tooltip()?.textContent).toContain('21 млн');
  });
});

describe('StackedBarChart', () => {
  const props = {
    labels: ['Май', 'Июнь'],
    series: [
      { name: 'Сайт', values: [420, 460] },
      { name: 'Партнёры', values: [260, 230] },
      { name: 'Прямые', values: [180, 220] },
    ],
  };

  it('stacks segments, rounds only the top one and prints the total over the column', () => {
    render(<StackedBarChart aria-label="Выручка по каналам" formatTotal={(value) => `${value} итого`} {...props} />);
    const bars = marks('chart-bar');
    expect(bars).toHaveLength(6);
    expect(bars.filter((bar) => attr(bar, 'data-top') === 'true').map((bar) => attr(bar, 'data-series'))).toEqual(['Прямые', 'Прямые']);
    expect(marks('chart-total').map((total) => total.textContent)).toEqual(['860 итого', '910 итого']);
    // segments of one column touch with a 2px gap
    const site = bars.find((bar) => attr(bar, 'data-series') === 'Сайт' && attr(bar, 'data-index') === '0');
    const partners = bars.find((bar) => attr(bar, 'data-series') === 'Партнёры' && attr(bar, 'data-index') === '0');
    expect(num(site, 'data-y') - (num(partners, 'data-y') + num(partners, 'data-length'))).toBeCloseTo(2);
  });

  it('recounts totals and the top segment when a series is hidden', async () => {
    const user = userEvent.setup();
    render(<StackedBarChart aria-label="Выручка по каналам" {...props} />);
    await user.click(screen.getByRole('button', { name: 'Прямые' }));
    expect(marks('chart-total').map((total) => total.textContent)).toEqual(['680', '690']);
    expect(marks('chart-bar').filter((bar) => attr(bar, 'data-top') === 'true').map((bar) => attr(bar, 'data-series'))).toEqual(['Партнёры', 'Партнёры']);
  });

  it('reads the column with its total', async () => {
    const user = userEvent.setup();
    render(<StackedBarChart aria-label="Выручка по каналам" {...props} />);
    const plot = await focusPlot('Выручка по каналам');
    await user.keyboard('{ArrowRight}');
    expect(spoken(plot)).toBe('Май: Сайт 420, Партнёры 260, Прямые 180, всего 860');
    expect(tooltip()?.textContent).toContain('Всего');
  });
});

describe('BulletChart', () => {
  const data = [
    { label: 'Выручка', unit: 'млн ₽', value: 4.2, target: 5, ranges: [2.5, 3.5, 5] as const },
    { label: 'Новые клиенты', unit: 'шт', value: 38, target: 30, ranges: [24, 32, 40] as const },
  ];

  it('draws zones, the measure and the target on one scale per row', () => {
    render(<BulletChart aria-label="Цели месяца" data={data} />);
    expect(marks('chart-zone')).toHaveLength(6);
    const [measure] = marks('chart-bar');
    const [target] = marks('chart-target');
    const [zone] = marks('chart-zone');
    const track = num(zone, 'data-length') / (2.5 / 5);
    expect(num(measure, 'data-length')).toBeCloseTo(track * (4.2 / 5));
    expect(num(measure, 'data-thickness')).toBe(8);
    expect(num(target, 'data-x') - num(zone, 'data-x')).toBeCloseTo(track);
    expect(screen.getByText('цель 5')).toBeDefined();
    expect(screen.getByText('млн ₽')).toBeDefined();
  });

  it('announces fact, target and completion', async () => {
    const user = userEvent.setup();
    render(<BulletChart aria-label="Цели месяца" data={data} />);
    const plot = await focusPlot('Цели месяца');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(spoken(plot)).toBe('Новые клиенты: 38 шт, цель 30, выполнено 126,7 %');
  });
});

describe('LollipopChart', () => {
  it('draws a stem and a ringed dot per category from zero, sorted', async () => {
    const user = userEvent.setup();
    render(
      <LollipopChart
        aria-label="Повторные покупки"
        formatValue={(value) => `${value} %`}
        data={[
          { label: 'Мебель', value: 18 },
          { label: 'Корма', value: 64 },
        ]}
      />,
    );
    expect(marks('chart-dot').map((dot) => attr(dot, 'data-label'))).toEqual(['Корма', 'Мебель']);
    expect(marks('chart-stem')).toHaveLength(2);
    expect(num(marks('chart-dot')[0], 'r')).toBe(5);
    expect(screen.getByText('0')).toBeDefined();
    const plot = await focusPlot('Повторные покупки');
    await user.keyboard('{End}');
    expect(spoken(plot)).toBe('Мебель: 18 %');
  });
});

describe('ClevelandDotChart', () => {
  const props = {
    labels: ['Москва', 'Екатеринбург'],
    series: [
      { name: '2025', values: [4.9, 4.4] },
      { name: '2026', values: [5.7, 4.3] },
    ],
  };

  it('links the two dots, signs the difference and colours the past in fg-4', () => {
    render(<ClevelandDotChart aria-label="Средний чек" {...props} />);
    expect(marks('chart-dot')).toHaveLength(4);
    expect(attr(marks('chart-dot')[0], 'fill')).toBe('var(--color-fg-4)');
    const deltas = marks('chart-delta');
    expect(deltas.map((delta) => delta.textContent)).toEqual(['+0,8', '−0,1']);
    expect(attr(deltas[1], 'data-negative')).toBe('true');
    // the scale does not start at zero
    expect(screen.queryByText('0')).toBeNull();
  });

  it('drops the difference when a series is hidden', async () => {
    const user = userEvent.setup();
    render(<ClevelandDotChart aria-label="Средний чек" {...props} />);
    await user.click(screen.getByRole('button', { name: '2025' }));
    expect(marks('chart-dot')).toHaveLength(2);
    expect(marks('chart-delta')).toHaveLength(0);
  });

  it('reads both values and the difference', async () => {
    const user = userEvent.setup();
    render(<ClevelandDotChart aria-label="Средний чек" {...props} />);
    const plot = await focusPlot('Средний чек');
    await user.keyboard('{ArrowDown}');
    expect(spoken(plot)).toBe('Москва: 2025 4,9, 2026 5,7, разница +0,8');
  });
});

describe('RadarChart', () => {
  const props = {
    axes: ['Цена', 'Качество', 'Сервис', 'Доставка', 'Ассортимент', 'Бренд'],
    series: [
      { name: 'Мы', values: [80, 68, 90, 55, 70, 58] },
      { name: 'Конкурент', values: [60, 85, 72, 75, 50, 78] },
    ],
  };

  it('draws grid rings, spokes, one outline per series and names every axis', () => {
    render(<RadarChart aria-label="Оценка против конкурента" max={100} {...props} />);
    expect(marks('chart-ring')).toHaveLength(4);
    expect(attr(marks('chart-ring')[3], 'stroke')).toBe('var(--color-border)');
    expect(marks('chart-line')).toHaveLength(2);
    expect(marks('chart-dot')).toHaveLength(12);
    for (const axis of props.axes) expect(screen.getAllByText(axis).length).toBeGreaterThan(0);
  });

  it('steps axes and hides a series', async () => {
    const user = userEvent.setup();
    render(<RadarChart aria-label="Оценка против конкурента" {...props} />);
    const plot = await focusPlot('Оценка против конкурента');
    await user.keyboard('{ArrowRight}');
    expect(spoken(plot)).toBe('Цена: Мы 80, Конкурент 60');
    await user.click(screen.getByRole('button', { name: 'Конкурент' }));
    expect(marks('chart-line')).toHaveLength(1);
  });
});

describe('ParallelCoordinatesChart', () => {
  const axes = [
    { label: 'Цена, тыс ₽', min: 0, max: 12 },
    { label: 'Возвраты, %', min: 0, max: 12, invert: true },
  ];
  const rows = [
    { name: 'Склад Pro', values: [9, 2] },
    { name: 'Касса Мини', values: [3, 10] },
    { name: 'Аналитика', values: [6, 6] },
  ];

  it('draws a line per row, focuses the highlighted ones and flips the axes marked lower-is-better', () => {
    render(<ParallelCoordinatesChart aria-label="Профиль товаров" axes={axes} rows={rows} highlight={['Склад Pro', 'Касса Мини']} />);
    const lines = marks('chart-line');
    expect(lines).toHaveLength(3);
    expect(lines.filter((line) => attr(line, 'data-highlight') === 'true').map((line) => attr(line, 'data-series'))).toEqual(['Склад Pro', 'Касса Мини']);
    // labels only next to the focus lines
    expect(screen.getAllByText('Склад Pro').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('[data-slot=chart-label]')).toHaveLength(2);
    // inverted axis: a small value sits near the top
    const pro = marks('chart-dot').filter((dot) => attr(dot, 'data-series') === 'Склад Pro');
    const mini = marks('chart-dot').filter((dot) => attr(dot, 'data-series') === 'Касса Мини');
    expect(num(pro[1], 'cy')).toBeLessThan(num(mini[1], 'cy'));
    expect(screen.getByText('Возвраты, % ↓')).toBeDefined();
  });

  it('filters rows by dragging along an axis and clears with Escape', async () => {
    render(<ParallelCoordinatesChart aria-label="Профиль товаров" axes={axes} rows={rows} />);
    const [axis] = marks('chart-brush-area');
    const svg = axis?.closest('svg');
    if (!axis || !svg) throw new Error('no axis');
    const top = num(axis, 'y');
    const height = num(axis, 'height');
    // drag over the upper half of «Цена»: values 6…12
    fireEvent.pointerDown(axis, { clientX: 0, clientY: top });
    fireEvent.pointerMove(svg, { clientX: 0, clientY: top + height / 2 });
    fireEvent.pointerUp(svg, { clientX: 0, clientY: top + height / 2 });
    expect(marks('chart-brush')).toHaveLength(1);
    const filtered = marks('chart-line').filter((line) => attr(line, 'data-filtered') === 'true');
    expect(filtered.map((line) => attr(line, 'data-series'))).toEqual(['Касса Мини']);
    const plot = await focusPlot('Профиль товаров');
    fireEvent.keyDown(plot, { key: 'Escape' });
    expect(marks('chart-brush')).toHaveLength(0);
  });

  it('steps rows and reads every axis', async () => {
    const user = userEvent.setup();
    render(<ParallelCoordinatesChart aria-label="Профиль товаров" axes={axes} rows={rows} />);
    const plot = await focusPlot('Профиль товаров');
    await user.keyboard('{ArrowRight}');
    expect(spoken(plot)).toBe('Склад Pro: Цена, тыс ₽ 9, Возвраты, % 2');
    expect(tooltip()?.textContent).toContain('Склад Pro');
  });
});

describe('IsotypeChart', () => {
  it('rounds the value to whole icons, prints the exact number and the key', async () => {
    const user = userEvent.setup();
    render(
      <IsotypeChart
        aria-label="Клиенты по сегментам"
        unit={100}
        unitLabel="Один значок — 100 клиентов"
        data={[
          { label: 'Малый бизнес', value: 1240 },
          { label: 'Госсектор', value: 90 },
        ]}
      />,
    );
    const icons = marks('chart-icon');
    expect(icons.filter((icon) => attr(icon, 'data-label') === 'Малый бизнес')).toHaveLength(12);
    expect(icons.filter((icon) => attr(icon, 'data-label') === 'Госсектор')).toHaveLength(1);
    expect(screen.getByText('Один значок — 100 клиентов')).toBeDefined();
    const plot = await focusPlot('Клиенты по сегментам');
    await user.keyboard('{ArrowDown}');
    expect(spoken(plot)).toBe('Малый бизнес: 1 240, 12 значков');
  });
});

describe('ProportionalAreaChart', () => {
  it('nests circles on a common bottom with area proportional to the value', async () => {
    const user = userEvent.setup();
    render(
      <ProportionalAreaChart
        aria-label="Размер рынка"
        formatValue={(value) => `${value} млрд ₽`}
        data={[
          { label: 'SAM', value: 12, description: 'доступный нам' },
          { label: 'TAM', value: 48, description: 'весь рынок' },
        ]}
      />,
    );
    const [big, small] = marks('chart-circle');
    expect(attr(big, 'data-label')).toBe('TAM');
    expect(num(small, 'r') / num(big, 'r')).toBeCloseTo(0.5);
    expect(num(big, 'cy') + num(big, 'r')).toBeCloseTo(num(small, 'cy') + num(small, 'r'));
    expect(attr(big, 'fill')).toBe('var(--color-seq-1)');
    expect(screen.getByText('TAM · 48 млрд ₽')).toBeDefined();
    expect(document.querySelector('[data-slot=proportional-area-chart] svg')?.textContent).toContain('доступный нам');
    const plot = await focusPlot('Размер рынка');
    await user.keyboard('{End}');
    expect(spoken(plot)).toBe('SAM: 12 млрд ₽, доступный нам');
  });
});

describe('RadialBarChart', () => {
  it('maps the maximum to 270° on concentric arcs and labels each ring', async () => {
    const user = userEvent.setup();
    render(
      <RadialBarChart
        aria-label="Выполнение плана"
        formatValue={(value) => `${value} %`}
        data={[
          { label: 'Москва', value: 86 },
          { label: 'Казань', value: 50 },
        ]}
      />,
    );
    const arcs = marks('chart-arc');
    expect(arcs.map((arc) => num(arc, 'data-angle'))).toEqual([232.2, 135]);
    expect(num(arcs[0], 'data-radius') - num(arcs[1], 'data-radius')).toBe(24);
    expect(num(arcs[0], 'stroke-width')).toBe(14);
    expect(screen.getByText('Москва · 86 %')).toBeDefined();
    const plot = await focusPlot('Выполнение плана');
    await user.keyboard('{ArrowRight}');
    expect(spoken(plot)).toBe('Москва: 86 %');
    expect(tooltip()).not.toBeNull();
  });
});
