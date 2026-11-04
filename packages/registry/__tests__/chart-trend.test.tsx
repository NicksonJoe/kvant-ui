import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  CalendarHeatmapChart,
  CandlestickChart,
  ComboChart,
  ConnectedScatterChart,
  CyclePlotChart,
  EventMarkerChart,
  ForecastChart,
  KagiChart,
  OhlcChart,
  PercentAreaChart,
  PointFigureChart,
  RangeAreaChart,
  RenkoChart,
  StackedAreaChart,
  StepLineChart,
  StreamChart,
  TimeColumnChart,
  kagiLines,
  pointFigureColumns,
  renkoBricks,
} from '..';

const plot = (name: string) => screen.getByRole('group', { name });
// Russian numbers use no-break spaces; compare with plain ones
const flat = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ');
const live = (name: string) => flat(plot(name).querySelector('[aria-live]')?.textContent);
const slots = (slot: string) => [...document.querySelectorAll<SVGElement>(`[data-slot=${slot}]`)];
const tooltip = () => document.querySelector<HTMLElement>('[data-slot=chart-tooltip]');

async function stepTo(name: string, keys: string) {
  const user = userEvent.setup();
  plot(name).focus();
  await user.keyboard(keys);
  return user;
}

const months = ['Ноя', 'Дек', 'Янв', 'Фев'];
const channels = [
  { name: 'Сайт', values: [300_000, 340_000, 250_000, 280_000] },
  { name: 'Партнёры', values: [200_000, 210_000, 170_000, 190_000] },
  { name: 'Прямые', values: [100_000, 120_000, 90_000, 110_000] },
];

describe('reversal algorithms', () => {
  it('renko adds a brick per full brick size and reverses only after two bricks', () => {
    expect(renkoBricks([100, 101, 102.5, 104, 99, 98, 103], 2)).toEqual([
      { direction: 'up', low: 100, high: 102, index: 2 },
      { direction: 'up', low: 102, high: 104, index: 3 },
      { direction: 'down', low: 100, high: 102, index: 4 },
      { direction: 'down', low: 98, high: 100, index: 5 },
      { direction: 'up', low: 100, high: 102, index: 6 },
    ]);
    expect(renkoBricks([100, 107], 2).map((brick) => brick.high)).toEqual([102, 104, 106]);
    expect(renkoBricks([100, 101.9, 98.1], 2)).toEqual([]);
  });

  it('point and figure extends a column box by box and reverses after `reversal` boxes', () => {
    expect(pointFigureColumns([10, 12.4, 13, 11, 9.5, 9, 12, 13.2], 1, 3)).toEqual([
      { direction: 'x', low: 10, high: 13, boxes: 4, index: 2 },
      { direction: 'o', low: 9, high: 12, boxes: 4, index: 4 },
      { direction: 'x', low: 10, high: 13, boxes: 4, index: 7 },
    ]);
    // a two-box pullback is not a reversal at 3
    expect(pointFigureColumns([10, 14, 12], 1, 3)).toHaveLength(1);
    expect(pointFigureColumns([20, 18, 16], 2, 3)).toEqual([{ direction: 'o', low: 16, high: 20, boxes: 3, index: 2 }]);
  });

  it('kagi turns on the reversal threshold and thickens past the previous shoulder', () => {
    const lines = kagiLines([100, 96, 92, 95, 99, 104, 101, 98, 103], 3);
    expect(lines.map(({ direction, start, end }) => [direction, start, end])).toEqual([
      ['down', 100, 92],
      ['up', 92, 104],
      ['down', 104, 98],
      ['up', 98, 103],
    ]);
    expect(lines.map((line) => line.segments)).toEqual([
      [{ from: 100, to: 92, yang: false }],
      [
        { from: 92, to: 100, yang: false },
        { from: 100, to: 104, yang: true },
      ],
      [{ from: 104, to: 98, yang: true }],
      [{ from: 98, to: 103, yang: true }],
    ]);
  });

  it('kagi thins below the previous waist and accepts a reversal in price', () => {
    const lines = kagiLines([100, 110, 105, 112, 100, 95], 4, 'price');
    expect(lines.map(({ direction, start, end }) => [direction, start, end])).toEqual([
      ['up', 100, 110],
      ['down', 110, 105],
      ['up', 105, 112],
      ['down', 112, 95],
    ]);
    expect(lines[3]?.segments).toEqual([
      { from: 112, to: 105, yang: true },
      { from: 105, to: 95, yang: false },
    ]);
  });
});

describe('StackedAreaChart', () => {
  it('stacks layers into a total, steps with the keyboard and hides a layer from the legend', async () => {
    render(<StackedAreaChart aria-label="Выручка по каналам" labels={months} series={channels} />);
    expect(plot('Выручка по каналам').getAttribute('aria-roledescription')).toBe('график');
    expect(slots('trend-layer').map((layer) => layer.dataset.series)).toEqual(['Сайт', 'Партнёры', 'Прямые']);
    expect(within(plot('Выручка по каналам')).getAllByRole('row')).toHaveLength(5);

    const user = await stepTo('Выручка по каналам', '{End}');
    expect(live('Выручка по каналам')).toContain('Фев: Сайт 280 000');
    expect(within(tooltip() as HTMLElement).getByText('580 000')).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Прямые' }));
    expect(screen.getByRole('button', { name: 'Прямые' }).getAttribute('aria-pressed')).toBe('false');
    expect(slots('trend-layer')).toHaveLength(2);
  });

  it('PercentAreaChart turns each period into shares of 100 % and labels the bottom layer', async () => {
    render(<PercentAreaChart aria-label="Доля каналов" labels={months} series={channels} />);
    expect([...plot('Доля каналов').querySelectorAll('[data-slot=chart-axis] text')].map((tick) => flat(tick.textContent))).toEqual([
      '0 %',
      '25 %',
      '50 %',
      '75 %',
      '100 %',
    ]);
    expect(screen.getByText('48 %', { selector: '[data-slot=trend-share]' })).toBeDefined();
    await stepTo('Доля каналов', '{Home}');
    expect(live('Доля каналов')).toContain('Сайт 50,0 %');
  });

  it('StreamChart has no value axis and keeps values for the tooltip', async () => {
    render(<StreamChart aria-label="Спрос по категориям" labels={months} series={channels} />);
    expect(plot('Спрос по категориям').querySelector('[data-slot=chart-axis]')).toBeNull();
    expect(slots('trend-layer')).toHaveLength(3);
    await stepTo('Спрос по категориям', '{ArrowRight}{ArrowRight}');
    expect(live('Спрос по категориям')).toBe('Дек: Сайт 340 000, Партнёры 210 000, Прямые 120 000');
  });
});

describe('StepLineChart', () => {
  it('marks and labels only the changes with the step size', async () => {
    render(
      <StepLineChart
        aria-label="Цена тарифа"
        labels={['Янв', 'Фев', 'Мар', 'Апр', 'Май']}
        values={[990, 990, 1190, 1190, 1290]}
        formatValue={(value) => `${value.toLocaleString('ru-RU')} ₽`}
      />,
    );
    expect(slots('trend-step')).toHaveLength(2);
    expect(screen.getByText('1 190 ₽ · +20 %')).toBeDefined();
    expect(screen.getByText('1 290 ₽ · +8 %')).toBeDefined();
    await stepTo('Цена тарифа', '{End}');
    expect(live('Цена тарифа')).toBe('Май: Значение 1 290 ₽');
  });
});

describe('TimeColumnChart', () => {
  it('draws one column per period and labels only the last and the minimum', async () => {
    render(<TimeColumnChart aria-label="Выручка по месяцам" labels={months} values={[3.1e6, 3.6e6, 2.4e6, 5.2e6]} />);
    expect(slots('trend-column')).toHaveLength(4);
    expect(slots('trend-value-label').map((label) => flat(label.textContent))).toEqual(['2,4 млн', '5,2 млн']);
    expect(screen.queryByRole('button')).toBeNull();
    await stepTo('Выручка по месяцам', '{ArrowLeft}');
    expect(live('Выручка по месяцам')).toBe('Фев: Значение 5 200 000');
  });
});

describe('ComboChart', () => {
  it('puts columns and a line on one axis; the line may start later and either can hide', async () => {
    render(
      <ComboChart
        aria-label="Выручка и тренд"
        labels={months}
        bars={{ name: 'Месяц', values: [3.1, 3.6, 2.4, 2.8] }}
        line={{ name: 'Среднее, 3 мес', values: [null, null, 3.03, 2.93] }}
      />,
    );
    expect(slots('trend-column')).toHaveLength(4);
    expect(slots('trend-line')).toHaveLength(1);
    const user = await stepTo('Выручка и тренд', '{Home}');
    expect(live('Выручка и тренд')).toBe('Ноя: Месяц 3,1');
    await user.keyboard('{End}');
    expect(live('Выручка и тренд')).toBe('Фев: Месяц 2,8, Среднее, 3 мес 2,9');
    await user.click(screen.getByRole('button', { name: 'Месяц' }));
    expect(slots('trend-column')).toHaveLength(0);
  });
});

describe('ForecastChart', () => {
  const data = [
    { value: 2.4 },
    { value: 2.8 },
    { value: 3.3 },
    { value: 3.6, inner: [3.4, 3.8] as const, outer: [3.1, 4.2] as const },
    { value: 4.1, inner: [3.6, 4.6] as const, outer: [3.0, 5.4] as const },
  ];

  it('draws the fact solid, the forecast dashed with two widening bands and a «today» rule', async () => {
    render(<ForecastChart aria-label="Прогноз выручки" labels={['Янв', 'Фев', 'Мар', 'Апр', 'Май']} data={data} today={2} />);
    expect(slots('trend-band').map((band) => band.dataset.band)).toEqual(['outer', 'inner']);
    expect(slots('trend-forecast')[0]?.getAttribute('stroke-dasharray')).toBe('6 4');
    expect(slots('trend-today')).toHaveLength(1);
    expect(screen.getByText('80 %: 3 – 5,4')).toBeDefined();
    await stepTo('Прогноз выручки', '{End}');
    expect(live('Прогноз выручки')).toBe('Май: Прогноз 4,1, 50 % 3,6 – 4,6, 80 % 3 – 5,4');
    await userEvent.setup().keyboard('{Home}');
    expect(live('Прогноз выручки')).toBe('Янв: Факт 2,4');
  });
});

describe('RangeAreaChart', () => {
  it('shades min–max and labels only the last range and value', async () => {
    render(
      <RangeAreaChart
        aria-label="Заказы в день"
        labels={['Май', 'Июн', 'Июл']}
        data={[
          { low: 120, high: 210, value: 180 },
          { low: 140, high: 250, value: 200 },
          { low: 190, high: 292, value: 234 },
        ]}
      />,
    );
    expect(slots('trend-band')).toHaveLength(1);
    expect(screen.getByText('190–292')).toBeDefined();
    expect(screen.getByText('в среднем 234')).toBeDefined();
    await stepTo('Заказы в день', '{ArrowRight}');
    expect(live('Заказы в день')).toBe('Май: Среднее 180, Мин – макс 120 – 210');
  });
});

describe('CalendarHeatmapChart', () => {
  const data = [
    { date: '2026-03-02', value: 0 },
    { date: '2026-03-03', value: 4 },
    { date: '2026-03-04', value: 12 },
    { date: '2026-03-05', value: 30 },
    { date: '2026-03-06', value: 60 },
    { date: '2026-03-07', value: 140 },
    { date: '2026-03-08', value: 8 },
    { date: '2026-03-09', value: 25 },
  ];

  it('puts days in Monday-first week columns with five bounded steps and a zero colour', async () => {
    render(<CalendarHeatmapChart aria-label="Заказы по дням" data={data} legendTitle="Заказов в день" />);
    const cells = slots('trend-cell');
    expect(cells.map((cell) => cell.dataset.level)).toEqual(['0', '1', '2', '3', '4', '5', '1', '3']);
    expect(cells[0]?.getAttribute('fill')).toBe('var(--color-fill-2)');
    expect(cells[5]?.getAttribute('fill')).toBe('var(--color-seq-5)');
    // 9 March is the next Monday: a new column, first row
    expect(cells[7]?.getAttribute('y')).toBe(cells[0]?.getAttribute('y'));
    expect(screen.getByText('10–24')).toBeDefined();
    expect(screen.getByText('100+')).toBeDefined();

    const user = await stepTo('Заказы по дням', '{Home}');
    expect(live('Заказы по дням')).toBe('2 марта 2026, понедельник: Значение 0');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(live('Заказы по дням')).toBe('4 марта 2026, среда: Значение 12');
    await user.keyboard('{ArrowRight}');
    expect(live('Заказы по дням')).toBe('9 марта 2026, понедельник: Значение 25');
    expect(tooltip()).not.toBeNull();
  });
});

describe('CyclePlotChart', () => {
  it('draws a panel per month with a mean rule and a mini line over the years', async () => {
    render(
      <CyclePlotChart
        aria-label="Сезонность выручки"
        periods={['2024', '2025', '2026']}
        data={[
          { label: 'Янв', values: [60, 70, 80] },
          { label: 'Фев', values: [62, 74, 86] },
          { label: 'Дек', values: [90, 110, null] },
        ]}
      />,
    );
    expect(slots('trend-panel')).toHaveLength(3);
    expect(slots('trend-mean')).toHaveLength(3);
    expect(slots('trend-last').map((dot) => dot.dataset.period)).toEqual(['2026', '2026', '2025']);
    await stepTo('Сезонность выручки', '{End}');
    expect(live('Сезонность выручки')).toBe('Дек: 2024 90, 2025 110, Среднее 100');
  });
});

describe('ConnectedScatterChart', () => {
  it('joins points in time, enlarges the last and labels start, end and notes', async () => {
    render(
      <ConnectedScatterChart
        aria-label="Реклама и выручка"
        xName="Реклама"
        yName="Выручка"
        data={[
          { label: 'Ноя 2025', x: 800_000, y: 3_100_000 },
          { label: 'Янв 2026', x: 1_100_000, y: 2_400_000, note: 'Янв — провал после праздников' },
          { label: 'Окт 2026', x: 2_400_000, y: 5_200_000 },
        ]}
      />,
    );
    const points = slots('trend-point');
    expect(points.map((point) => point.getAttribute('r'))).toEqual(['4', '4', '5']);
    expect(screen.getByText('Ноя 2025', { selector: 'text' })).toBeDefined();
    expect(screen.getByText('Окт 2026', { selector: 'text' })).toBeDefined();
    expect(screen.getByText('Янв — провал после праздников', { selector: 'text' })).toBeDefined();
    await stepTo('Реклама и выручка', '{ArrowRight}{ArrowRight}');
    expect(live('Реклама и выручка')).toBe('Янв 2026: Реклама 1 100 000, Выручка 2 400 000');
  });
});

describe('EventMarkerChart', () => {
  it('draws releases as dashed rules with a code and incidents as danger diamonds', async () => {
    render(
      <EventMarkerChart
        aria-label="Активные пользователи"
        labels={['1 июл', '2 июл', '3 июл', '4 июл']}
        series={{ name: 'DAU', values: [13_000, 15_000, 12_000, 16_000] }}
        events={[
          { index: 1, code: 'v2.4', label: 'Новый checkout' },
          { index: 2, kind: 'incident', label: 'Сбой оплаты' },
        ]}
      />,
    );
    expect(slots('trend-release')).toHaveLength(1);
    expect(slots('trend-release')[0]?.getAttribute('stroke-dasharray')).toBe('3 3');
    expect(screen.getByText('v2.4')).toBeDefined();
    expect(slots('trend-incident')[0]?.getAttribute('fill')).toBe('var(--color-danger)');
    await stepTo('Активные пользователи', '{ArrowRight}{ArrowRight}');
    expect(live('Активные пользователи')).toBe('2 июл: DAU 15 000, Релиз v2.4 Новый checkout');
  });
});

describe('CandlestickChart and OhlcChart', () => {
  const data = [
    { label: '01.10', open: 100, high: 101, low: 94, close: 96 },
    { label: '02.10', open: 96, high: 99, low: 95, close: 98.5 },
    { label: '03.10', open: 98.5, high: 104, low: 97, close: 103 },
  ];

  it('hollow rising and filled falling candles on a price axis that does not start at zero', async () => {
    render(<CandlestickChart aria-label="Курс: свечи" data={data} formatValue={(value) => `${value} ₽`} />);
    expect(slots('trend-candle').map((candle) => candle.dataset.direction)).toEqual(['down', 'up', 'up']);
    expect(slots('trend-candle')[1]?.querySelector('rect')?.getAttribute('fill')).toBe('var(--color-surface-1)');
    const ticks = [...plot('Курс: свечи').querySelectorAll('[data-slot=chart-axis] text')].map((tick) => flat(tick.textContent));
    expect(ticks[0]).not.toBe('0');
    await stepTo('Курс: свечи', '{End}');
    expect(live('Курс: свечи')).toBe('03.10: Открытие 98.5 ₽, Максимум 104 ₽, Минимум 97 ₽, Закрытие 103 ₽');
  });

  it('OHLC bars carry open and close ticks', () => {
    render(<OhlcChart aria-label="Курс: OHLC" data={data} />);
    const bars = slots('trend-ohlc');
    expect(bars).toHaveLength(3);
    expect(bars[0]?.querySelectorAll('line')).toHaveLength(3);
  });
});

describe('RenkoChart, PointFigureChart and KagiChart', () => {
  const prices = [100, 101, 102.5, 104, 99, 98, 103];

  it('Renko draws the computed bricks and steps through them', async () => {
    render(<RenkoChart aria-label="Ренко" values={prices} brickSize={2} />);
    expect(slots('trend-brick').map((brick) => brick.dataset.direction)).toEqual(['up', 'up', 'down', 'down', 'up']);
    await stepTo('Ренко', '{End}');
    expect(live('Ренко')).toBe('Кирпич 5: Рост 100 – 102');
  });

  it('Point and figure draws X and O columns box by box', async () => {
    render(<PointFigureChart aria-label="Крестики-нолики" values={[10, 12.4, 13, 11, 9.5, 9, 12, 13.2]} boxSize={1} reversal={3} />);
    const columns = slots('trend-pf-column');
    expect(columns.map((column) => column.dataset.direction)).toEqual(['x', 'o', 'x']);
    expect(columns[1]?.querySelectorAll('circle')).toHaveLength(4);
    await stepTo('Крестики-нолики', '{ArrowRight}{ArrowRight}');
    expect(live('Крестики-нолики')).toBe('Колонка 2: Нолики 9 – 12, Клеток 4');
  });

  it('Kagi draws yang thick and yin thin', async () => {
    render(<KagiChart aria-label="Каги" values={[100, 96, 92, 95, 99, 104, 101, 98, 103]} reversal={3} />);
    const segments = slots('trend-kagi-segment');
    expect(segments.filter((segment) => segment.dataset.yang === 'true').every((segment) => segment.getAttribute('stroke-width') === '3')).toBe(true);
    expect(segments.filter((segment) => segment.dataset.yang === 'false').every((segment) => segment.getAttribute('stroke-width') === '1.5')).toBe(true);
    await stepTo('Каги', '{ArrowRight}{ArrowRight}');
    expect(live('Каги')).toBe('Линия 2: Рост 92 → 104');
  });
});
