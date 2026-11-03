import { render, screen } from '@testing-library/react';
import { Calendar, Check, Star } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { ICON_SIZES, ICON_TILE_SIZES, ICON_TILE_TONES, Icon, IconTile } from '..';

const svg = (container: HTMLElement) => container.querySelector('svg');

describe('Icon', () => {
  it('defaults to 16 px, stroke 1.75, currentColor and hidden from screen readers', () => {
    const { container } = render(<Icon icon={Calendar} />);
    const icon = svg(container);
    expect(icon?.getAttribute('data-slot')).toBe('icon');
    expect(icon?.getAttribute('width')).toBe('16');
    expect(icon?.getAttribute('height')).toBe('16');
    expect(icon?.getAttribute('stroke-width')).toBe('1.75');
    expect(icon?.getAttribute('stroke')).toBe('currentColor');
    expect(icon?.getAttribute('fill')).toBe('none');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it.each([
    [12, '1.75'],
    [14, '1.75'],
    [16, '1.75'],
    [20, '1.5'],
    [24, '1.5'],
    [32, '1.5'],
  ] as const)('size %i draws stroke %s', (size, stroke) => {
    const { container } = render(<Icon icon={Calendar} size={size} />);
    expect(svg(container)?.getAttribute('width')).toBe(String(size));
    expect(svg(container)?.getAttribute('stroke-width')).toBe(stroke);
  });

  it('lists the six sizes of the scale', () => {
    expect(ICON_SIZES).toEqual([12, 14, 16, 20, 24, 32]);
  });

  it('with a label it is an image with a name', () => {
    render(<Icon icon={Check} label="Оплачено" />);
    const icon = screen.getByRole('img', { name: 'Оплачено' });
    expect(icon.hasAttribute('aria-hidden')).toBe(false);
  });

  it('filled: fill takes the text colour, the icon pops in again when it turns on', () => {
    const { container, rerender } = render(<Icon icon={Star} />);
    const outline = svg(container);
    expect(outline?.hasAttribute('data-filled')).toBe(false);
    rerender(<Icon icon={Star} filled />);
    const filled = svg(container);
    expect(filled?.hasAttribute('data-filled')).toBe(true);
    expect(filled?.getAttribute('class')).toContain('fill-current');
    expect(filled?.getAttribute('class')).toContain('starting:scale-[calc(1_-_(1_-_var(--scale-enter))_*_5)]');
    expect(filled).not.toBe(outline);
  });

  it('passes className and other svg attributes through', () => {
    const { container } = render(<Icon icon={Calendar} className="text-fg-3" data-testid="calendar" />);
    expect(svg(container)?.getAttribute('class')).toContain('text-fg-3');
    expect(screen.getByTestId('calendar')).toBe(svg(container));
  });
});

describe('IconTile', () => {
  it('defaults to a 32 neutral circle with a 16 icon', () => {
    render(
      <IconTile data-testid="tile">
        <Calendar />
      </IconTile>,
    );
    const tile = screen.getByTestId('tile');
    expect(tile.getAttribute('data-slot')).toBe('icon-tile');
    expect(tile.getAttribute('data-size')).toBe('32');
    expect(tile.getAttribute('data-tone')).toBe('neutral');
    expect(tile.className).toContain('size-8');
    expect(tile.className).toContain('rounded-full');
    expect(tile.className).toContain('[&_svg]:size-4');
    expect(tile.className).toContain('[&_svg]:stroke-[1.75]');
    expect(tile.className).toContain('bg-fill-2');
    expect(tile.className).toContain('text-fg-2');
  });

  it.each([
    [24, 'size-6', '[&_svg]:size-3.5', '[&_svg]:stroke-[1.75]'],
    [32, 'size-8', '[&_svg]:size-4', '[&_svg]:stroke-[1.75]'],
    [40, 'size-10', '[&_svg]:size-5', '[&_svg]:stroke-[1.5]'],
  ] as const)('size %i: circle %s, icon %s, %s', (size, circle, icon, stroke) => {
    render(
      <IconTile size={size} data-testid="tile">
        <Calendar />
      </IconTile>,
    );
    const tile = screen.getByTestId('tile');
    expect(tile.className).toContain(circle);
    expect(tile.className).toContain(icon);
    expect(tile.className).toContain(stroke);
  });

  it.each([
    ['neutral', 'bg-fill-2', 'text-fg-2'],
    ['accent', 'bg-accent-soft', 'text-accent-soft-fg'],
    ['success', 'bg-success-soft', 'text-success-soft-fg'],
    ['warning', 'bg-warning-soft', 'text-warning-soft-fg'],
    ['danger', 'bg-danger-soft', 'text-danger-soft-fg'],
    ['solid', 'bg-accent', 'text-accent-fg'],
  ] as const)('tone %s: %s and %s from one pair', (tone, bg, fg) => {
    render(
      <IconTile tone={tone} data-testid="tile">
        <Calendar />
      </IconTile>,
    );
    const classes = screen.getByTestId('tile').className.split(' ');
    expect(classes).toContain(bg);
    expect(classes).toContain(fg);
  });

  it('lists sizes and tones', () => {
    expect(ICON_TILE_SIZES).toEqual([24, 32, 40]);
    expect(ICON_TILE_TONES).toEqual(['neutral', 'accent', 'success', 'warning', 'danger', 'solid']);
  });

  it('leaves the meaning to the icon: no role, the icon inside stays hidden', () => {
    const { container } = render(
      <IconTile tone="success">
        <Check />
      </IconTile>,
    );
    const tile = container.firstElementChild;
    expect(tile?.hasAttribute('role')).toBe(false);
    expect(svg(container)?.getAttribute('aria-hidden')).toBe('true');
  });
});
