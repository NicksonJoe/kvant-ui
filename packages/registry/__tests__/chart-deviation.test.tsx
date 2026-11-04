import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ButterflyChart, DivergingBarChart, LikertChart, PlanFactChart, SpineChart, SurplusDeficitChart, TornadoChart } from '..';

const num = (el: Element | undefined, name: string) => Number(el?.getAttribute(`data-${name}`));
const all = (slot: string) => [...document.querySelectorAll(`[data-slot=${slot}]`)];
const percent = (value: number) => `${value} %`;
const text = (value: string | null | undefined) => value?.replace(/\u00a0/g, ' ');
const live = () => text(document.querySelector('[aria-live]')?.textContent);
const tooltip = () => document.querySelector('[data-slot=chart-tooltip]');

describe('DivergingBarChart', () => {
  const data = [
    { label: 'Казань', value: 32 },
    { label: 'Москва', value: 8 },
    { label: 'Самара', value: -6 },
    { label: 'Пермь', value: -18 },
  ];

  it('grows positive bars right and negative bars left of one zero line, lengths to scale', () => {
    render(<DivergingBarChart aria-label="Выручка к прошлому году" data={data} formatValue={percent} />);
    const bars = all('diverging-bar');
    expect(bars.map((bar) => bar.getAttribute('data-sign'))).toEqual(['positive', 'positive', 'negative', 'negative']);
    const zero = num(bars[0], 'start');
    for (const bar of bars) expect(num(bar, 'start')).toBe(zero);
    expect(num(bars[0], 'end')).toBeGreaterThan(zero);
    expect(num(bars[3], 'end')).toBeLessThan(zero);
    expect((num(bars[0], 'end') - zero) / (zero - num(bars[3], 'end'))).toBeCloseTo(32 / 18, 2);
    expect(bars[0]?.getAttribute('fill')).toBe('var(--color-chart-1)');
    expect(bars[3]?.getAttribute('fill')).toBe('var(--color-chart-2)');
  });

  it('signs every value and duplicates the data in a table', () => {
    render(<DivergingBarChart aria-label="Выручка к прошлому году" data={data} formatValue={percent} />);
    const plot = screen.getByRole('group', { name: 'Выручка к прошлому году' });
    const table = within(plot).getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Пермь' })).toBeDefined();
    expect(within(table).getByText('−18 %')).toBeDefined();
    expect(within(table).getByText('+32 %')).toBeDefined();
    expect(screen.getByText('Рост')).toBeDefined();
    expect(screen.getByText('Падение')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Рост' })).toBeNull();
  });

  it('steps rows with arrows, Home and End, announcing the value and showing a tooltip', async () => {
    const user = userEvent.setup();
    render(<DivergingBarChart aria-label="Выручка к прошлому году" data={data} formatValue={percent} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(live()).toBe('Казань: +32 %');
    expect(tooltip()?.textContent).toContain('Казань');
    await user.keyboard('{End}');
    expect(live()).toBe('Пермь: −18 %');
    await user.keyboard('{ArrowUp}');
    expect(live()).toBe('Самара: −6 %');
    await user.keyboard('{Home}');
    expect(live()).toBe('Казань: +32 %');
  });

  it('shows the tooltip of the hovered row and hides it on leave', () => {
    render(<DivergingBarChart aria-label="Выручка к прошлому году" data={data} formatValue={percent} />);
    const hit = document.querySelector('[data-row="2"]');
    if (!hit) throw new Error('no hit area');
    fireEvent.pointerMove(hit);
    expect(tooltip()?.textContent).toContain('Самара');
    expect(tooltip()?.textContent).toContain('−6 %');
    fireEvent.pointerLeave(hit);
    expect(tooltip()).toBeNull();
  });
});

describe('LikertChart', () => {
  const categories = ['Нет', 'Скорее нет', 'Нейтрально', 'Скорее да', 'Да'];
  const data = [
    { label: 'Легко найти товар', values: [4, 8, 14, 38, 36] },
    { label: 'Понятные цены', values: [9, 15, 18, 33, 25] },
  ];

  it('centres the neutral answer on the zero line, one segment a row', () => {
    render(<LikertChart aria-label="Мнение о сервисе" categories={categories} data={data} />);
    const neutral = all('likert-segment').filter((segment) => segment.getAttribute('data-category') === 'Нейтрально');
    expect(neutral).toHaveLength(2);
    const zero = num(document.querySelector('[data-slot=likert-zero]') ?? undefined, 'x');
    for (const segment of neutral) expect(zero - num(segment, 'start')).toBeCloseTo(num(segment, 'end') - zero, 5);
  });

  it('puts negative answers left and positive right, strongest outermost, two tones a side', () => {
    render(<LikertChart aria-label="Мнение о сервисе" categories={categories} data={data} />);
    const row = all('likert-segment').filter((segment) => segment.closest('[data-index="0"]'));
    const zero = num(document.querySelector('[data-slot=likert-zero]') ?? undefined, 'x');
    const byName = (name: string) => row.find((segment) => segment.getAttribute('data-category') === name);
    expect(num(byName('Нет'), 'end')).toBeLessThanOrEqual(num(byName('Скорее нет'), 'start'));
    expect(num(byName('Скорее нет'), 'end')).toBeLessThanOrEqual(zero);
    expect(num(byName('Скорее да'), 'start')).toBeGreaterThanOrEqual(zero);
    expect(num(byName('Да'), 'start')).toBeGreaterThanOrEqual(num(byName('Скорее да'), 'end'));
    expect(byName('Нет')?.getAttribute('fill')).toBe('var(--color-div-neg-2)');
    expect(byName('Скорее нет')?.getAttribute('fill')).toBe('var(--color-div-neg-1)');
    expect(byName('Да')?.getAttribute('fill')).toBe('var(--color-div-pos-2)');
  });

  it('sums the positive answers on the right', () => {
    render(<LikertChart aria-label="Мнение о сервисе" categories={categories} data={data} />);
    expect(all('likert-total').map((total) => text(total.textContent))).toEqual(['74 %', '58 %']);
    expect(screen.getByRole('columnheader', { name: 'да, всего' })).toBeDefined();
  });

  it('shows NPS as promoters minus detractors with three tones', () => {
    render(
      <LikertChart
        aria-label="NPS"
        total="net"
        categories={['Критики', 'Нейтральные', 'Промоутеры']}
        data={[{ label: 'Октябрь', values: [12, 26, 62] }]}
      />,
    );
    expect(all('likert-total').map((total) => text(total.textContent))).toEqual(['+50']);
    const fills = all('likert-segment').map((segment) => segment.getAttribute('fill'));
    expect(fills).toEqual(['var(--color-div-neg-2)', 'var(--color-div-mid)', 'var(--color-div-pos-2)']);
  });

  it('legend hides an answer and the total follows', async () => {
    const user = userEvent.setup();
    render(<LikertChart aria-label="Мнение о сервисе" categories={categories} data={data} />);
    const yes = screen.getByRole('button', { name: 'Да' });
    await user.click(yes);
    expect(yes.getAttribute('aria-pressed')).toBe('false');
    expect(all('likert-segment').some((segment) => segment.getAttribute('data-category') === 'Да')).toBe(false);
    expect(text(all('likert-total')[0]?.textContent)).toBe('38 %');
  });

  it('announces every answer of the row reached with the keyboard', async () => {
    const user = userEvent.setup();
    render(<LikertChart aria-label="Мнение о сервисе" categories={categories} data={data} />);
    for (let i = 0; i <= categories.length; i += 1) await user.tab();
    expect(document.activeElement?.getAttribute('aria-roledescription')).toBe('график');
    await user.keyboard('{End}');
    expect(live()).toBe('Понятные цены: Нет 9 %, Скорее нет 15 %, Нейтрально 18 %, Скорее да 33 %, Да 25 %');
    expect(tooltip()?.textContent).toContain('Понятные цены');
  });
});

describe('SpineChart', () => {
  const data = [
    { label: 'Средний чек', value: 2840, mean: 2700, min: 1900, max: 3400, q1: 2450, q3: 2950 },
    { label: 'Конверсия', value: 3.4, mean: 3.4, min: 1.8, max: 5.1 },
    { label: 'Возвраты', value: 3.1, mean: 4.1, min: 1.2, max: 7.5, lowerIsBetter: true },
    { label: 'Доставка в срок', value: 96, mean: 93, min: 81, max: 99 },
    { label: 'Время ответа', value: 7.5, mean: 4.1, min: 1.2, max: 7.5, lowerIsBetter: true },
  ];

  it('places our value against the network mean in the centre, better to the right', () => {
    render(<SpineChart aria-label="Наш магазин против сети" data={data} />);
    const dots = all('spine-dot');
    expect(num(dots[0], 'offset')).toBeGreaterThan(0);
    expect(num(dots[1], 'offset')).toBe(0);
    // lower is better: below the mean lands on the right
    expect(num(dots[2], 'offset')).toBeGreaterThan(0);
    // the worst store sits on the left edge, a full half away
    expect(num(dots[4], 'offset')).toBeLessThan(0);
    expect(Math.abs(num(dots[4], 'offset'))).toBe(Math.abs(num(dots[4], 'half')));
  });

  it('colours a dot only when it deviates beyond the threshold', () => {
    render(<SpineChart aria-label="Наш магазин против сети" data={data} />);
    expect(all('spine-dot').map((dot) => dot.getAttribute('data-tone'))).toEqual(['better', 'same', 'better', 'same', 'worse']);
    expect(all('spine-dot')[4]?.getAttribute('fill')).toBe('var(--color-div-neg-2)');
  });

  it('draws the middle half only when quartiles are given', () => {
    render(<SpineChart aria-label="Наш магазин против сети" data={data} />);
    expect(all('spine-quartiles')).toHaveLength(1);
  });

  it('announces our value, the mean and the verdict', async () => {
    const user = userEvent.setup();
    render(<SpineChart aria-label="Наш магазин против сети" data={data} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(live()).toBe('Средний чек: мы 2 840, среднее 2 700, заметно лучше');
    await user.keyboard('{End}');
    expect(live()).toBe('Время ответа: мы 7,5, среднее 4,1, заметно хуже');
    expect(tooltip()?.textContent).toContain('Худший');
  });
});

describe('SurplusDeficitChart', () => {
  const labels = ['нед. 1', '2', '3'];

  it('keeps the axis of the mockup: 3…9 by 2, unit on top, every 5th week labelled', () => {
    const income = [5.4, 5.7, 6.3, 6.4, 6.6, 7, 7.4, 7.3, 7.1, 6.5, 6.5, 6, 5.5, 5.2, 4.9, 5.2, 4.9, 4.7, 4.6, 4.2, 4.4, 4.8, 5.2, 5.6, 6, 5.8];
    const payments = [6.6, 6.7, 6.5, 6.2, 6.2, 5.7, 5.9, 5.6, 5.2, 4.9, 5.2, 5, 5.3, 5.5, 5.5, 5.8, 6.2, 6.4, 6.5, 6.7, 7.1, 6.7, 6.6, 6.7, 6.3, 6.2];
    render(
      <SurplusDeficitChart
        aria-label="Поступления и платежи"
        unit="млн"
        labels={income.map((_, i) => (i === 0 ? 'нед. 1' : String(i + 1)))}
        series={{ name: 'Поступления', values: income }}
        reference={{ name: 'Платежи', values: payments }}
      />,
    );
    const axis = [...document.querySelectorAll('[data-slot=chart-axis] text')].map((tick) => text(tick.textContent));
    expect(axis).toEqual(['3', '5', '7', '9 млн']);
    const weeks = [...document.querySelectorAll('[data-x-label]')].map((tick) => tick.textContent);
    expect(weeks).toEqual(['нед. 1', '6', '11', '16', '21', '26']);
  });

  it('cuts the fill exactly where the lines cross', () => {
    render(
      <SurplusDeficitChart
        aria-label="Поступления и платежи"
        labels={['нед. 1', '2']}
        series={{ name: 'Поступления', values: [1, 3] }}
        reference={{ name: 'Платежи', values: [3, 1] }}
      />,
    );
    const areas = all('surplus-area');
    expect(areas.map((area) => area.getAttribute('data-kind'))).toEqual(['deficit', 'surplus']);
    // fallback width 560, plot 48…560: the lines cross half way
    expect(num(areas[0], 'from')).toBe(48);
    expect(num(areas[0], 'to')).toBe(304);
    expect(num(areas[1], 'from')).toBe(304);
    expect(num(areas[1], 'to')).toBe(560);
    expect(areas[0]?.getAttribute('fill')).toBe('var(--color-div-neg-1)');
    expect(areas[1]?.getAttribute('fill')).toBe('var(--color-div-pos-1)');
  });

  it('splits on a touching point without an empty sliver', () => {
    render(
      <SurplusDeficitChart
        aria-label="Поступления и платежи"
        labels={labels}
        series={{ name: 'Поступления', values: [1, 2, 3] }}
        reference={{ name: 'Платежи', values: [3, 2, 1] }}
      />,
    );
    const areas = all('surplus-area');
    expect(areas.map((area) => area.getAttribute('data-kind'))).toEqual(['deficit', 'surplus']);
    expect(num(areas[0], 'to')).toBe(304);
    expect(num(areas[1], 'from')).toBe(304);
  });

  it('compares one line against a constant norm', () => {
    render(
      <SurplusDeficitChart
        aria-label="Выручка против плана"
        labels={labels}
        series={{ name: 'Выручка', values: [1, 3, 1] }}
        reference={{ name: 'План', value: 2 }}
      />,
    );
    expect(all('surplus-area').map((area) => area.getAttribute('data-kind'))).toEqual(['deficit', 'surplus', 'deficit']);
  });

  it('sums surplus and deficit in the summary', () => {
    render(
      <SurplusDeficitChart
        aria-label="Поступления и платежи"
        labels={labels}
        period="за 3 недели"
        unit="млн"
        series={{ name: 'Поступления', values: [5.5, 6, 4] }}
        reference={{ name: 'Платежи', values: [5, 5.2, 6.5] }}
      />,
    );
    const summary = document.querySelector('[data-slot=surplus-summary]');
    expect(text(summary?.textContent)).toContain('Профицит за 3 недели +1,3 млн');
    expect(text(summary?.textContent)).toContain('Дефицит −2,5 млн');
  });

  it('legend hides a line and the fill with it', async () => {
    const user = userEvent.setup();
    render(
      <SurplusDeficitChart
        aria-label="Поступления и платежи"
        labels={labels}
        series={{ name: 'Поступления', values: [1, 2, 3] }}
        reference={{ name: 'Платежи', values: [3, 2, 1] }}
      />,
    );
    const payments = screen.getByRole('button', { name: 'Платежи' });
    await user.click(payments);
    expect(payments.getAttribute('aria-pressed')).toBe('false');
    expect(all('surplus-area')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Профицит' })).toBeNull();
  });

  it('steps weeks with ← → and announces both lines and the gap', async () => {
    const user = userEvent.setup();
    render(
      <SurplusDeficitChart
        aria-label="Поступления и платежи"
        labels={labels}
        series={{ name: 'Поступления', values: [5.5, 6, 4] }}
        reference={{ name: 'Платежи', values: [5, 5.2, 6.5] }}
      />,
    );
    for (let i = 0; i < 3; i += 1) await user.tab();
    await user.keyboard('{End}');
    expect(live()).toBe('3: Поступления 4, Платежи 6,5, Дефицит −2,5');
    await user.keyboard('{ArrowLeft}');
    expect(live()).toBe('2: Поступления 6, Платежи 5,2, Профицит +0,8');
    expect(tooltip()?.textContent).toContain('Профицит');
  });
});

describe('TornadoChart', () => {
  const data = [
    { label: 'Аренда склада ±10 %', low: 0.3, high: -0.3 },
    { label: 'Цена товара ±10 %', low: -1.9, high: 1.9 },
    { label: 'Закупочная цена ±10 %', low: 1.4, high: -1.4 },
  ];

  it('sorts by swing, the strongest lever on top', () => {
    render(<TornadoChart aria-label="Что двигает прибыль" data={data} />);
    const rows = within(screen.getByRole('table')).getAllByRole('rowheader').map((cell) => cell.textContent);
    expect(rows).toEqual(['Цена товара ±10 %', 'Закупочная цена ±10 %', 'Аренда склада ±10 %']);
  });

  it('colours a bar by the sign of its effect, not by its side', () => {
    render(<TornadoChart aria-label="Что двигает прибыль" data={data} />);
    const bars = all('tornado-bar');
    const second = bars.filter((bar) => bar.closest('[data-index="1"]'));
    const low = second.find((bar) => bar.getAttribute('data-side') === 'low');
    expect(low?.getAttribute('data-sign')).toBe('positive');
    expect(low?.getAttribute('fill')).toBe('var(--color-div-pos-2)');
    expect(num(low, 'end')).toBeLessThan(num(low, 'start'));
    expect(screen.getAllByText('+1,4')).toHaveLength(2);
    expect(screen.getAllByText('−1,9')).toHaveLength(2);
  });

  it('keeps the given order when sort is off and announces both sides', async () => {
    const user = userEvent.setup();
    render(<TornadoChart aria-label="Что двигает прибыль" data={data} sort={false} lowLabel="Показатель −10 %" highLabel="Показатель +10 %" />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(live()).toBe('Аренда склада ±10 %: Показатель −10 % +0,3, Показатель +10 % −0,3');
  });
});

describe('ButterflyChart', () => {
  it('mirrors two groups around the centre and the legend hides a side', async () => {
    const user = userEvent.setup();
    render(
      <ButterflyChart
        aria-label="Клиенты по возрасту"
        labels={['18–24', '25–34']}
        left={{ name: 'Мужчины', values: [120, 340] }}
        right={{ name: 'Женщины', values: [160, 410] }}
      />,
    );
    const bars = all('butterfly-bar');
    expect(bars).toHaveLength(4);
    const left = bars.find((bar) => bar.getAttribute('data-side') === 'low');
    expect(num(left, 'end')).toBeLessThan(num(left, 'start'));
    expect(left?.getAttribute('fill')).toBe('var(--color-chart-1)');
    await user.click(screen.getByRole('button', { name: 'Женщины' }));
    expect(all('butterfly-bar')).toHaveLength(2);
  });
});

describe('PlanFactChart', () => {
  const data = [
    { label: 'Опт', plan: 5, fact: 4.2 },
    { label: 'Розница', plan: 1.6, fact: 1.9 },
    { label: 'Аренда', plan: 0.5, fact: 0.6, invert: true },
  ];

  it('draws the fact bar and the plan tick on one scale', () => {
    render(<PlanFactChart aria-label="План и факт" data={data} />);
    const bars = all('plan-fact-bar');
    const targets = all('plan-fact-target');
    const start = num(bars[0], 'start');
    expect((num(bars[0], 'end') - start) / (num(targets[0], 'x') - start)).toBeCloseTo(4.2 / 5, 3);
    expect(num(bars[1], 'end')).toBeGreaterThan(num(targets[1], 'x'));
  });

  it('labels the deviation in percent with a tone set by the metric', () => {
    render(<PlanFactChart aria-label="План и факт" data={data} />);
    const badges = all('plan-fact-badge');
    expect(badges.map((badge) => text(badge.textContent))).toEqual(['−16 %', '+19 %', '+20 %']);
    expect(badges.map((badge) => badge.getAttribute('data-tone'))).toEqual(['bad', 'good', 'bad']);
  });

  it('shows a dash without a plan', () => {
    render(<PlanFactChart aria-label="План и факт" data={[{ label: 'Новое', plan: 0, fact: 0.3 }]} />);
    const badge = all('plan-fact-badge')[0];
    expect(badge?.textContent).toBe('—');
    expect(badge?.getAttribute('data-tone')).toBe('neutral');
  });

  it('announces fact, plan and deviation', async () => {
    const user = userEvent.setup();
    render(<PlanFactChart aria-label="План и факт" data={data} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(live()).toBe('Опт: факт 4,2 из 5, −16 %');
    expect(tooltip()?.textContent).toContain('План');
  });
});
