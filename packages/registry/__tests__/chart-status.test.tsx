import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GaugeChart, HeatTable, RagList, Scorecard } from '..';

const signed = (value: number) => (value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0');

describe('GaugeChart', () => {
  it('is a meter named by its label, with the value, range and target read out', () => {
    render(<GaugeChart label="NPS за октябрь" value={62} min={-100} max={100} target={70} formatValue={signed} />);
    const meter = screen.getByRole('meter', { name: 'NPS за октябрь' });
    expect(meter.getAttribute('aria-valuenow')).toBe('62');
    expect(meter.getAttribute('aria-valuemin')).toBe('-100');
    expect(meter.getAttribute('aria-valuemax')).toBe('100');
    expect(meter.getAttribute('aria-valuetext')).toBe('+62, цель +70');
    expect(screen.getByText('+62')).toBeDefined();
    expect(screen.getByText('−100')).toBeDefined();
    expect(screen.getByText('+100')).toBeDefined();
    expect(screen.getByText('цель +70')).toBeDefined();
    expect(meter.querySelector('[data-slot=gauge-value]')?.getAttribute('data-share')).toBe('0.81');
    expect(meter.querySelector('[data-slot=gauge-target]')).not.toBeNull();
  });

  it('clamps the arc to the scale and draws no target tick without a target', () => {
    render(<GaugeChart label="Загрузка склада" value={130} size="sm" formatValue={(value) => `${value} %`} />);
    const meter = screen.getByRole('meter', { name: 'Загрузка склада' });
    expect(meter.getAttribute('data-size')).toBe('sm');
    expect(meter.querySelector('[data-slot=gauge-value]')?.getAttribute('data-share')).toBe('1');
    expect(meter.querySelector('[data-slot=gauge-target]')).toBeNull();
    expect(meter.getAttribute('aria-valuetext')).toBe('130 %');
  });

  it('shows value, target and the gap in a tooltip on focus', async () => {
    const user = userEvent.setup();
    render(<GaugeChart label="Заказы в срок" value={92} target={90} formatValue={(value) => `${value} %`} />);
    await user.tab();
    const tooltip = document.querySelector('[data-slot=chart-tooltip]') as HTMLElement;
    expect(within(tooltip).getByText('Цель')).toBeDefined();
    expect(within(tooltip).getByText('90 %')).toBeDefined();
    expect(within(tooltip).getByText('+2 %')).toBeDefined();
    await user.tab();
    expect(document.querySelector('[data-slot=chart-tooltip]')).toBeNull();
  });
});

const ragItems = [
  { label: 'Выручка', value: '18,4 млн ₽', target: 'план 18,0', owner: 'Сергей', status: 'green' },
  { label: 'Конверсия сайта', value: '2,9 %', target: 'план 3,2 %', owner: 'Анна', status: 'amber' },
  { label: 'Отток клиентов', value: '6,1 %', target: 'не выше 4 %', owner: 'Ирина', status: 'red' },
  { label: 'Средний чек', value: '2 840 ₽', target: 'план 2 700', owner: 'Сергей', status: 'green' },
] as const;

describe('RagList', () => {
  it('lists every KPI as a table row with status word, value, target and owner', () => {
    render(<RagList aria-label="Светофор KPI за октябрь" items={ragItems} />);
    const table = screen.getByRole('table', { name: 'Светофор KPI за октябрь' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(4);
    const churn = rows[2] as HTMLElement;
    expect(within(churn).getByText('Срыв')).toBeDefined();
    expect(within(churn).getByText('6,1 %')).toBeDefined();
    expect(within(churn).getByText('не выше 4 %')).toBeDefined();
    expect(within(churn).getByText('Ирина')).toBeDefined();
    expect(churn.querySelector('[data-slot=badge]')?.getAttribute('data-tone')).toBe('danger');
    expect(within(rows[1] as HTMLElement).getByText('Риск')).toBeDefined();
  });

  it('sums statuses into a summary bar with counts in words', () => {
    render(<RagList aria-label="Светофор" items={ragItems} />);
    const segments = [...document.querySelectorAll<HTMLElement>('[data-slot=rag-summary-segment]')];
    expect(segments.map((segment) => segment.style.flexGrow)).toEqual(['2', '1', '1']);
    expect(screen.getByText('В норме · 2')).toBeDefined();
    expect(screen.getByText('Риск · 1')).toBeDefined();
    expect(screen.getByText('Срыв · 1')).toBeDefined();
  });

  it('renames statuses and can drop the summary', () => {
    render(<RagList aria-label="Светофор" items={ragItems} summary={false} statusLabels={{ red: 'Провал' }} />);
    expect(document.querySelector('[data-slot=rag-summary]')).toBeNull();
    expect(screen.getByText('Провал')).toBeDefined();
  });
});

const cohorts = [
  { label: 'Май', caption: '1 240 чел', values: [100, 41, 32, 27, 24, 22] },
  { label: 'Июнь', caption: '1 380 чел', values: [100, 44, 34, 29, 26, null] },
  { label: 'Июль', caption: '1 510 чел', values: [100, 46, 36, 31, null, null] },
];
const months = ['Месяц 0', 'Месяц 1', 'Месяц 2', 'Месяц 3', 'Месяц 4', 'Месяц 5'];

describe('HeatTable', () => {
  it('draws a cell per value, skips empty ones and bins by thresholds with readable text', () => {
    render(
      <HeatTable aria-label="Удержание по когортам" columns={months} rows={cohorts} thresholds={[27, 35, 45, 75]} formatValue={(value) => `${value} %`} />,
    );
    const cells = [...document.querySelectorAll<HTMLElement>('[data-slot=heat-table-cell]')];
    expect(cells).toHaveLength(15);
    const bins = cells.slice(0, 6).map((cell) => cell.dataset.bin);
    expect(bins).toEqual(['4', '2', '1', '1', '0', '0']);
    expect(cells[0]?.className).toContain('text-surface-1');
    expect(cells[1]?.className).toContain('text-fg-1');
    expect(cells[0]?.style.background).toBe('var(--color-seq-5)');
    const table = within(screen.getByRole('group', { name: 'Удержание по когортам' })).getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByText('1 380 чел', { exact: false })).toBeDefined();
  });

  it('bins into equal intervals without thresholds and centres a diverging scale on the midpoint', () => {
    render(
      <HeatTable
        aria-label="Отклонение от плана"
        scale="diverging"
        columns={['Сен', 'Окт']}
        rows={[{ label: 'Анна', values: [-20, 3] }, { label: 'Олег', values: [10, 20] }]}
      />,
    );
    const cells = [...document.querySelectorAll<HTMLElement>('[data-slot=heat-table-cell]')];
    expect(cells.map((cell) => cell.dataset.bin)).toEqual(['0', '2', '3', '4']);
    expect(cells[0]?.style.background).toBe('var(--color-div-neg-2)');
    expect(cells[2]?.style.background).toBe('var(--color-div-pos-1)');
  });

  it('adds a summary column without fill and a legend with band edges', () => {
    render(
      <HeatTable
        aria-label="Выполнение плана"
        columns={['Май', 'Июн']}
        rows={[{ label: 'Анна Северова', values: [107, 129] }]}
        thresholds={[85, 95, 105, 115]}
        legend="Выполнение плана, %"
        summary="mean"
        summaryLabel="Среднее"
        formatSummary={(value) => `${value} %`}
      />,
    );
    expect(document.querySelector('[data-slot=heat-table-summary]')?.textContent).toBe('118 %');
    const legend = document.querySelector('[data-slot=heat-table-legend]') as HTMLElement;
    expect(within(legend).getByText('Выполнение плана, %')).toBeDefined();
    expect(within(legend).getByText('до 85')).toBeDefined();
    expect(within(legend).getByText('85–94')).toBeDefined();
    expect(within(legend).getByText('115+')).toBeDefined();
  });

  it('walks the cells with arrows, skipping empty ones, and speaks and shows the cell', async () => {
    const user = userEvent.setup();
    render(<HeatTable aria-label="Удержание" columns={months} rows={cohorts} formatValue={(value) => `${value} %`} />);
    const plot = screen.getByRole('group', { name: 'Удержание' });
    plot.focus();
    await user.keyboard('{ArrowRight}');
    expect(plot.querySelector('[aria-live]')?.textContent).toBe('Май, Месяц 0: 100 %');
    await user.keyboard('{End}');
    expect(plot.querySelector('[aria-live]')?.textContent).toBe('Май, Месяц 5: 22 %');
    await user.keyboard('{ArrowDown}');
    expect(plot.querySelector('[aria-live]')?.textContent).toBe('Июнь, Месяц 4: 26 %');
    expect(document.querySelector('[data-slot=heat-table-cell][data-active]')?.textContent).toBe('26 %');
    const tooltip = document.querySelector('[data-slot=chart-tooltip]') as HTMLElement;
    expect(within(tooltip).getByText('Июнь · Месяц 4')).toBeDefined();
    await user.keyboard('{ArrowUp}{Home}');
    expect(plot.querySelector('[aria-live]')?.textContent).toBe('Май, Месяц 0: 100 %');
  });
});

const scoreRows = [
  { label: 'Выручка', unit: 'млн ₽', value: 5.1, target: 5, decimals: 1, trend: [4.2, 4.5, 4.3, 4.7, 4.9, 5.1], status: 'green' },
  { label: 'Конверсия сайта', unit: '%', value: 2.6, target: 3, decimals: 1, trend: [3.1, 2.9, 3.1, 2.7, 2.7, 2.6], status: 'amber' },
  { label: 'Отток', unit: '% · чем ниже, тем лучше', value: 6.8, target: 5, decimals: 1, lowerIsBetter: true, status: 'red' },
] as const;

describe('Scorecard', () => {
  it('puts fact, plan, attainment, trend and status in one row per KPI', () => {
    render(<Scorecard aria-label="Показатели месяца" rows={scoreRows} />);
    const table = screen.getByRole('table', { name: 'Показатели месяца' });
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'Показатель',
      'Факт',
      'План',
      'Выполнение',
      'Полгода',
      'Статус',
    ]);
    const [revenue, conversion, churn] = within(table).getAllByRole('row').slice(1) as HTMLElement[];
    if (!revenue || !conversion || !churn) throw new Error('rows');
    expect(within(revenue).getByText('5,1')).toBeDefined();
    expect(within(revenue).getByText('5,0')).toBeDefined();
    expect(within(revenue).getByText('102 %')).toBeDefined();
    expect(within(revenue).getByText('В норме')).toBeDefined();
    expect(within(conversion).getByText('Внимание')).toBeDefined();
    expect(within(churn).getByText('Риск')).toBeDefined();
  });

  it('draws attainment on a 0–130 % bar with the plan tick at 100 %, plan / fact when lower is better', () => {
    render(<Scorecard aria-label="Показатели" rows={scoreRows} />);
    const bars = [...document.querySelectorAll<HTMLElement>('[data-slot=scorecard-bar]')];
    expect(bars.map((bar) => bar.dataset.attainment)).toEqual(['1.02', '0.867', '0.735']);
    expect(bars[0]?.style.width).toBe('78.5%');
    expect(bars[0]?.style.background).toBe('var(--color-chart-1)');
    expect(bars[1]?.style.background).toBe('var(--color-seq-3)');
    expect(screen.getByText('74 %')).toBeDefined();
    expect((document.querySelector('[data-slot=scorecard-plan]') as HTMLElement).style.left).toBe('76.9%');
  });

  it('caps the bar at 130 % and shows the trend values in a tooltip on focus', async () => {
    const user = userEvent.setup();
    render(
      <Scorecard
        aria-label="Показатели"
        trendLabels={['Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь']}
        rows={[{ label: 'Новые клиенты', unit: 'шт', value: 45, target: 30, trend: [24, 27, 30, 31, 34, 45], status: 'green' }]}
      />,
    );
    expect((document.querySelector('[data-slot=scorecard-bar]') as HTMLElement).style.width).toBe('100%');
    expect(screen.getByText('150 %')).toBeDefined();
    await user.tab();
    const trend = screen.getByRole('img', { name: /Новые клиенты, полгода/ });
    expect(document.activeElement).toBe(trend);
    const tooltip = document.querySelector('[data-slot=chart-tooltip]') as HTMLElement;
    expect(within(tooltip).getByText('Октябрь')).toBeDefined();
    expect(within(tooltip).getByText('45')).toBeDefined();
  });
});
