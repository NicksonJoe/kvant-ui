import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AngleSlider } from '..';

const slider = () => screen.getByRole('slider');
const now = () => slider().getAttribute('aria-valuenow');

/** Point on a 96 px dial at `deg` clockwise from the top, 40 px from the centre. */
const at = (deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { clientX: 48 + 40 * Math.sin(rad), clientY: 48 - 40 * Math.cos(rad), pointerId: 1 };
};

function placeDial() {
  const dial = document.querySelector<HTMLElement>('[data-slot=angle-slider-dial]');
  if (!dial) throw new Error('no dial');
  dial.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 96, bottom: 96, width: 96, height: 96, toJSON: () => ({}) });
  return dial;
}

describe('AngleSlider · dial', () => {
  it('is a 0–359 slider that reads «135 градусов» and prints «135°» in the middle', () => {
    render(<AngleSlider aria-label="Угол градиента" defaultValue={135} />);
    expect(slider().getAttribute('aria-label')).toBe('Угол градиента');
    expect(slider().getAttribute('aria-valuemin')).toBe('0');
    expect(slider().getAttribute('aria-valuemax')).toBe('359');
    expect(now()).toBe('135');
    expect(slider().getAttribute('aria-valuetext')).toBe('135 градусов');
    expect(document.querySelector('[data-slot=angle-slider-value]')?.textContent).toBe('135°');
  });

  it('declines «градус» by the number', () => {
    const { rerender } = render(<AngleSlider value={1} />);
    expect(slider().getAttribute('aria-valuetext')).toBe('1 градус');
    rerender(<AngleSlider value={2} />);
    expect(slider().getAttribute('aria-valuetext')).toBe('2 градуса');
    rerender(<AngleSlider value={21} />);
    expect(slider().getAttribute('aria-valuetext')).toBe('21 градус');
    rerender(<AngleSlider value={11} />);
    expect(slider().getAttribute('aria-valuetext')).toBe('11 градусов');
  });

  it('keys: ←→ ±1 around the circle, Shift ±15, PageUp / PageDown ±45, Home 0, End 359', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<AngleSlider defaultValue={135} onValueChange={onValueChange} />);
    slider().focus();
    await user.keyboard('{ArrowRight}');
    expect(now()).toBe('136');
    await user.keyboard('{ArrowDown}{ArrowLeft}');
    expect(now()).toBe('134');
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(now()).toBe('149');
    await user.keyboard('{PageUp}');
    expect(now()).toBe('194');
    await user.keyboard('{PageDown}{PageDown}');
    expect(now()).toBe('104');
    await user.keyboard('{Home}{ArrowLeft}');
    expect(now()).toBe('359');
    await user.keyboard('{ArrowRight}');
    expect(now()).toBe('0');
    await user.keyboard('{End}');
    expect(onValueChange).toHaveBeenLastCalledWith(359);
  });

  it('a press anywhere on the circle sets the angle, dragging follows, release commits', () => {
    const onValueChange = vi.fn();
    const onValueCommitted = vi.fn();
    render(<AngleSlider defaultValue={0} onValueChange={onValueChange} onValueCommitted={onValueCommitted} />);
    const dial = placeDial();
    fireEvent.pointerDown(dial, at(90));
    expect(now()).toBe('90');
    expect(dial.hasAttribute('data-dragging')).toBe(true);
    fireEvent.pointerMove(dial, at(180));
    expect(now()).toBe('180');
    fireEvent.pointerUp(dial, at(180));
    expect(onValueCommitted).toHaveBeenLastCalledWith(180);
    expect(dial.hasAttribute('data-dragging')).toBe(false);
    expect(document.activeElement).toBe(slider());
  });

  it('Shift snaps to 15° and shows the ticks while dragging', () => {
    render(<AngleSlider defaultValue={0} />);
    const dial = placeDial();
    fireEvent.pointerDown(dial, { ...at(100), shiftKey: true });
    expect(now()).toBe('105');
    expect(document.querySelector('[data-slot=angle-slider-ticks]')).not.toBeNull();
    fireEvent.pointerUp(dial, at(100));
    expect(document.querySelector('[data-slot=angle-slider-ticks]')).toBeNull();
  });

  it('a double press resets to 0°', () => {
    const onValueChange = vi.fn();
    render(<AngleSlider defaultValue={135} onValueChange={onValueChange} />);
    fireEvent.doubleClick(placeDial());
    expect(onValueChange).toHaveBeenLastCalledWith(0);
    expect(now()).toBe('0');
  });

  it('size lg draws a 160 dial', () => {
    render(<AngleSlider size="lg" defaultValue={45} />);
    expect(document.querySelector('[data-slot=angle-slider-dial] svg')?.getAttribute('width')).toBe('160');
  });

  it('disabled ignores keys and pointers', async () => {
    const user = userEvent.setup();
    render(<AngleSlider disabled defaultValue={135} />);
    expect(slider().getAttribute('aria-disabled')).toBe('true');
    expect(slider().tabIndex).toBe(-1);
    slider().focus();
    await user.keyboard('{ArrowRight}');
    fireEvent.pointerDown(placeDial(), at(10));
    expect(now()).toBe('135');
  });
});

describe('AngleSlider · compact', () => {
  it('a 32 knob with a mark plus a field in degrees; the field accepts 0–359 and wraps 360 → 0', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<AngleSlider variant="compact" aria-label="Поворот" defaultValue={135} onValueChange={onValueChange} />);
    expect(slider().getAttribute('aria-label')).toBe('Поворот');
    const field = screen.getByRole('textbox', { name: 'Поворот, градусы' }) as HTMLInputElement;
    expect(field.value).toBe('135');
    await user.clear(field);
    await user.type(field, '370{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(10);
    expect(field.value).toBe('10');
    await user.keyboard('{ArrowUp}');
    expect(field.value).toBe('11');
    await user.clear(field);
    await user.type(field, 'много');
    await user.tab();
    expect(field.value).toBe('11');
    await user.clear(field);
    await user.type(field, '-90');
    await user.tab();
    expect(field.value).toBe('270');
  });

  it('keys on the knob turn it like the dial', async () => {
    const user = userEvent.setup();
    render(<AngleSlider variant="compact" defaultValue={10} />);
    slider().focus();
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(now()).toBe('355');
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('355');
  });

  it('disabled turns off the field too', () => {
    render(<AngleSlider variant="compact" disabled defaultValue={135} />);
    expect(screen.getByRole('textbox').hasAttribute('disabled')).toBe(true);
  });
});
