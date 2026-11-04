import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { WordBarChart, WordCloudChart, type WordDatum } from '..';

const slots = (name: string) => [...document.querySelectorAll<HTMLElement | SVGElement>(`[data-slot=${name}]`)];
const tooltip = () => document.querySelector<HTMLElement>('[data-slot=chart-tooltip]');

const words: WordDatum[] = [
  { text: 'доставка', value: 142 },
  { text: 'быстро', value: 118, tone: 'positive' },
  { text: 'удобно', value: 96, tone: 'positive' },
  { text: 'курьер', value: 88 },
  { text: 'цена', value: 84 },
  { text: 'качество', value: 72, tone: 'positive' },
  { text: 'дорого', value: 61, tone: 'negative' },
  { text: 'поддержка', value: 58 },
  { text: 'долго', value: 54, tone: 'negative' },
  { text: 'приложение', value: 51 },
  { text: 'вежливо', value: 47, tone: 'positive' },
  { text: 'ошибка', value: 39, tone: 'negative' },
  { text: 'скидка', value: 37, tone: 'positive' },
  { text: 'упаковка', value: 34 },
  { text: 'не дозвониться', value: 12, tone: 'negative' },
  { text: 'спасибо', value: 9, tone: 'positive' },
];

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
const box = (el: Element): Box => ({
  x: Number(el.getAttribute('data-x')),
  y: Number(el.getAttribute('data-y')),
  w: Number(el.getAttribute('data-w')),
  h: Number(el.getAttribute('data-h')),
});
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('WordCloudChart', () => {
  it('sizes words 12–40 by the square root of their frequency, heavy from 22', () => {
    render(<WordCloudChart aria-label="О чём пишут в отзывах" words={words} />);
    const placed = slots('word-cloud-word');
    const size = (text: string) => Number(placed.find((word) => word.textContent === text)?.getAttribute('font-size'));
    expect(size('доставка')).toBe(40);
    expect(size('спасибо')).toBe(12);
    const expected = 12 + (28 * (Math.sqrt(61) - 3)) / (Math.sqrt(142) - 3);
    expect(size('дорого')).toBeCloseTo(expected, 0);
    expect(placed.find((word) => word.textContent === 'доставка')?.getAttribute('font-weight')).toBe('600');
    expect(placed.find((word) => word.textContent === 'спасибо')?.getAttribute('font-weight')).toBe('500');
  });

  it('places the largest word in the centre and no two words overlap, all inside the plot', () => {
    render(<WordCloudChart aria-label="Отзывы" words={words} height={282} />);
    const placed = slots('word-cloud-word');
    expect(placed).toHaveLength(words.length);
    const boxes = placed.map(box);
    const [first] = boxes;
    expect(first && Math.abs(first.x + first.w / 2 - 280)).toBeLessThan(1);
    expect(first && Math.abs(first.y + first.h / 2 - 141)).toBeLessThan(1);
    for (let i = 0; i < boxes.length; i += 1) {
      const a = boxes[i] as Box;
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.y).toBeGreaterThanOrEqual(0);
      expect(a.x + a.w).toBeLessThanOrEqual(560);
      expect(a.y + a.h).toBeLessThanOrEqual(282);
      for (let j = i + 1; j < boxes.length; j += 1) expect(overlap(a, boxes[j] as Box), `${i} × ${j}`).toBe(false);
    }
  });

  it('lays out the same words the same way every time', () => {
    const { unmount } = render(<WordCloudChart aria-label="Отзывы" words={words} />);
    const before = slots('word-cloud-word').map(box);
    unmount();
    render(<WordCloudChart aria-label="Отзывы" words={[...words].reverse()} />);
    expect(slots('word-cloud-word').map(box)).toEqual(before);
  });

  it('colours by tone only and lets the legend hide a tone', async () => {
    const user = userEvent.setup();
    render(<WordCloudChart aria-label="Отзывы" words={words} />);
    expect(slots('word-cloud-word').filter((word) => word.dataset.tone === 'negative')).toHaveLength(4);
    const negative = screen.getByRole('button', { name: 'Ругают' });
    await user.click(negative);
    expect(negative.getAttribute('aria-pressed')).toBe('false');
    expect(slots('word-cloud-word').filter((word) => word.dataset.tone === 'negative')).toHaveLength(0);
    expect(slots('word-cloud-word')).toHaveLength(12);
  });

  it('has no legend when no word carries a tone', () => {
    render(<WordCloudChart aria-label="Отзывы" words={[{ text: 'доставка', value: 10 }, { text: 'цена', value: 4 }]} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('reads the words as a table, steps with arrows and shows a tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<WordCloudChart aria-label="Отзывы" words={words} />);
    const table = screen.getByRole('table', { name: 'Отзывы' });
    expect(within(table).getAllByRole('row')).toHaveLength(words.length + 1);
    const plot = screen.getByRole('group', { name: 'Отзывы' });
    plot.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(tooltip()?.textContent).toContain('быстро');
    expect(tooltip()?.textContent).toContain('118');
    expect(tooltip()?.textContent).toContain('Хвалят');
    expect(plot.querySelector('[aria-live]')?.textContent).toContain('быстро');
    fireEvent.pointerLeave(plot.querySelector('svg') as SVGElement);
    fireEvent.pointerEnter(slots('word-cloud-word').find((word) => word.textContent === 'цена') as SVGElement);
    expect(tooltip()?.textContent).toContain('цена');
  });
});

describe('WordBarChart', () => {
  it('sorts by frequency on one shared axis and colours by tone', () => {
    render(<WordBarChart aria-label="Частые слова" words={[...words].reverse()} />);
    const rows = slots('word-bar-row');
    expect(rows[0]?.dataset.label).toBe('доставка');
    expect(rows[rows.length - 1]?.dataset.label).toBe('спасибо');
    const bars = slots('word-bar') as HTMLElement[];
    expect(parseFloat(bars[1]?.style.width ?? '0') / parseFloat(bars[0]?.style.width ?? '1')).toBeCloseTo(118 / 142, 2);
    expect(rows[1]?.dataset.tone).toBe('positive');
    expect(rows[0]?.dataset.tone).toBe('neutral');
  });

  it('legend hides a tone', async () => {
    const user = userEvent.setup();
    render(<WordBarChart aria-label="Частые слова" words={words} />);
    await user.click(screen.getByRole('button', { name: 'Хвалят' }));
    expect(slots('word-bar-row').filter((row) => row.dataset.tone === 'positive')).toHaveLength(0);
  });

  it('steps through words with arrows and hovers', async () => {
    const user = userEvent.setup();
    render(<WordBarChart aria-label="Частые слова" words={words} />);
    const plot = screen.getByRole('group', { name: 'Частые слова' });
    plot.focus();
    await user.keyboard('{Home}');
    expect(tooltip()?.textContent).toContain('доставка');
    expect(plot.querySelector('[aria-live]')?.textContent).toContain('доставка');
    await user.keyboard('{ArrowDown}');
    expect(tooltip()?.textContent).toContain('быстро');
    fireEvent.pointerEnter(slots('word-bar-row')[3] as HTMLElement);
    expect(tooltip()?.textContent).toContain('курьер');
  });
});
