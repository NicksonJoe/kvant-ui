import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  isSignatureTooShort,
  SignatureCard,
  SignaturePad,
  signatureLength,
  signatureStrokeWidth,
  signatureToSvg,
  smoothStroke,
  type SignatureData,
  type SignatureStroke,
} from '..';

const line = (from: number, to: number, y = 0): SignatureStroke => [
  { x: from, y, width: 3 },
  { x: (from + to) / 2, y, width: 3 },
  { x: to, y, width: 3 },
];

describe('signature geometry', () => {
  it('a pen sets the width by pressure, 2–3.5', () => {
    expect(signatureStrokeWidth({ pointerType: 'pen', pressure: 0, speed: 0 })).toBe(2);
    expect(signatureStrokeWidth({ pointerType: 'pen', pressure: 1, speed: 5 })).toBe(3.5);
    expect(signatureStrokeWidth({ pointerType: 'pen', pressure: 0.5, speed: 0 })).toBe(2.75);
  });

  it('a finger or a mouse has no pressure: slow is thick, fast is thin', () => {
    expect(signatureStrokeWidth({ pointerType: 'mouse', pressure: 0.5, speed: 0 })).toBe(3.5);
    expect(signatureStrokeWidth({ pointerType: 'touch', pressure: 0.5, speed: 1.5 })).toBe(2.75);
    expect(signatureStrokeWidth({ pointerType: 'mouse', pressure: 0.5, speed: 9 })).toBe(2);
  });

  it('smooths a stroke with quadratic curves through the midpoints', () => {
    const segments = smoothStroke([
      { x: 0, y: 0, width: 2 },
      { x: 10, y: 0, width: 3 },
      { x: 10, y: 10, width: 2 },
    ]);
    expect(segments).toEqual([
      { from: { x: 0, y: 0 }, to: { x: 5, y: 0 }, width: 2.5 },
      { from: { x: 5, y: 0 }, control: { x: 10, y: 0 }, to: { x: 10, y: 5 }, width: 3 },
      { from: { x: 10, y: 5 }, to: { x: 10, y: 10 }, width: 2.5 },
    ]);
  });

  it('a single touch is a dot, two points a straight line', () => {
    expect(smoothStroke([{ x: 4, y: 4, width: 3 }])).toEqual([{ from: { x: 4, y: 4 }, to: { x: 4, y: 4 }, width: 3 }]);
    expect(
      smoothStroke([
        { x: 0, y: 0, width: 2 },
        { x: 6, y: 8, width: 3 },
      ]),
    ).toEqual([{ from: { x: 0, y: 0 }, to: { x: 6, y: 8 }, width: 2.5 }]);
  });

  it('length adds up all strokes; shorter than 40 px or fewer than 2 strokes is a stray mark', () => {
    expect(signatureLength([line(0, 30), line(0, 20, 10)])).toBe(50);
    expect(isSignatureTooShort([line(0, 300)], { minLength: 40, minStrokes: 2 })).toBe(true);
    expect(isSignatureTooShort([line(0, 30), line(0, 20, 10)], { minLength: 40, minStrokes: 2 })).toBe(false);
    expect(isSignatureTooShort([line(0, 20), line(0, 10, 10)], { minLength: 40, minStrokes: 2 })).toBe(true);
    expect(isSignatureTooShort([line(0, 300)], { minLength: 40, minStrokes: 1 })).toBe(false);
  });

  it('SVG keeps the size, the ink and a transparent background', () => {
    const data: SignatureData = { strokes: [line(10, 110, 50)], typed: null, width: 640, height: 200, color: 'rgb(31, 35, 42)' };
    const svg = signatureToSvg(data);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200" viewBox="0 0 640 200"')).toBe(true);
    expect(svg).toContain('stroke="rgb(31, 35, 42)"');
    expect(svg).toContain(' Q');
    expect(svg).not.toContain('<rect');
    const typed = signatureToSvg({ ...data, strokes: [], typed: 'Ирина Котова' });
    expect(typed).toContain('>Ирина Котова</text>');
  });
});

const pad = () => document.querySelector('[data-slot=signature-pad-surface]') as HTMLElement;
const draw = (points: readonly [number, number][]) => {
  const [first, ...rest] = points;
  if (!first) return;
  fireEvent.pointerDown(pad(), { clientX: first[0], clientY: first[1], pointerId: 1, pointerType: 'mouse', buttons: 1 });
  for (const [x, y] of rest) fireEvent.pointerMove(pad(), { clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', buttons: 1 });
  fireEvent.pointerUp(pad(), { pointerId: 1, pointerType: 'mouse' });
};
const signature = () => {
  draw([
    [40, 100],
    [80, 60],
    [140, 110],
    [200, 70],
  ]);
  draw([
    [40, 130],
    [220, 126],
  ]);
};
const button = (name: string) => screen.getByRole('button', { name });

describe('SignaturePad', () => {
  it('empty: label and note above, the hint on the line, every action unavailable', () => {
    render(<SignaturePad label="Подпись получателя" meta="Акт № 1184 от 2 ноября" />);
    expect(screen.getByText('Подпись получателя')).not.toBeNull();
    expect(screen.getByText('Акт № 1184 от 2 ноября')).not.toBeNull();
    expect(screen.getByText('Распишитесь пальцем или мышью')).not.toBeNull();
    expect(pad().getAttribute('data-state')).toBe('empty');
    expect(pad().getAttribute('aria-label')).toBe('Подпись получателя, пусто');
    expect(pad().className).toContain('touch-none');
    // the sheet stays white in the dark theme: the signature goes to a PDF
    expect(pad().getAttribute('data-mode')).toBe('light');
    expect(button('Отменить штрих').hasAttribute('disabled')).toBe(true);
    expect(button('Очистить').hasAttribute('disabled')).toBe(true);
    expect(button('Принять подпись').hasAttribute('disabled')).toBe(true);
  });

  it('drawing hides the hint, enables the actions and shows who signs', () => {
    render(<SignaturePad label="Подпись получателя" signer="Ирина Котова, кладовщик" />);
    expect(screen.queryByText('Ирина Котова, кладовщик')).toBeNull();
    draw([
      [40, 100],
      [90, 80],
    ]);
    expect(pad().getAttribute('data-state')).toBe('signed');
    expect(pad().getAttribute('aria-label')).toBe('Подпись получателя, есть подпись');
    expect(document.querySelector('[data-slot=signature-pad-hint]')?.hasAttribute('data-hidden')).toBe(true);
    expect(button('Очистить').hasAttribute('disabled')).toBe(false);
    expect(button('Принять подпись').hasAttribute('disabled')).toBe(false);
    expect(screen.getByText('Ирина Котова, кладовщик')).not.toBeNull();
  });

  it('undo takes back the last stroke, by the button and by ⌘Z / Ctrl+Z', () => {
    const onAccept = vi.fn();
    render(<SignaturePad onAccept={onAccept} />);
    signature();
    fireEvent.click(button('Отменить штрих'));
    fireEvent.click(button('Принять подпись'));
    // one stroke left: a stray mark, not accepted
    expect(onAccept).not.toHaveBeenCalled();
    fireEvent.keyDown(pad(), { key: 'z', metaKey: true });
    expect(pad().getAttribute('data-state')).toBe('empty');
    signature();
    fireEvent.keyDown(pad(), { key: 'z', ctrlKey: true });
    fireEvent.keyDown(pad(), { key: 'z', ctrlKey: true });
    expect(pad().getAttribute('data-state')).toBe('empty');
  });

  it('clear empties the field at once and hands back a restore for the undo toast', () => {
    const onClear = vi.fn<(restore: () => void) => void>();
    render(<SignaturePad onClear={onClear} />);
    signature();
    fireEvent.click(button('Очистить'));
    expect(pad().getAttribute('data-state')).toBe('empty');
    expect(onClear).toHaveBeenCalledTimes(1);
    const restore = onClear.mock.lastCall?.[0];
    act(() => restore?.());
    expect(pad().getAttribute('data-state')).toBe('signed');
  });

  it('a stray mark is refused with a reason; the next stroke clears it', () => {
    const onAccept = vi.fn();
    render(<SignaturePad onAccept={onAccept} />);
    draw([
      [40, 100],
      [60, 96],
    ]);
    fireEvent.click(button('Принять подпись'));
    expect(onAccept).not.toHaveBeenCalled();
    expect(pad().getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('[data-slot=signature-pad-error]')?.textContent).toBe('Похоже на случайный штрих');
    draw([
      [40, 130],
      [80, 128],
    ]);
    expect(pad().getAttribute('aria-invalid')).toBeNull();
  });

  it('accept hands over the strokes, the size and the ink', () => {
    const onAccept = vi.fn<(data: SignatureData) => void>();
    render(<SignaturePad onAccept={onAccept} />);
    signature();
    fireEvent.click(button('Принять подпись'));
    const data = onAccept.mock.lastCall?.[0];
    expect(data?.strokes).toHaveLength(2);
    expect(data?.strokes[0]?.[0]).toMatchObject({ x: 40, y: 100 });
    expect(data?.typed).toBeNull();
    expect(typeof data?.color).toBe('string');
  });

  it('Enter opens typing the name: the signature is set in a font and can be accepted', () => {
    const onAccept = vi.fn<(data: SignatureData) => void>();
    render(<SignaturePad onAccept={onAccept} />);
    fireEvent.keyDown(pad(), { key: 'Enter' });
    const field = screen.getByRole('textbox', { name: 'Имя для подписи' });
    fireEvent.change(field, { target: { value: 'Ирина Котова' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(pad().getAttribute('data-state')).toBe('signed');
    expect(document.querySelector('[data-slot=signature-pad-typed]')?.textContent).toBe('Ирина Котова');
    fireEvent.click(button('Принять подпись'));
    expect(onAccept.mock.lastCall?.[0].typed).toBe('Ирина Котова');
  });

  it('Esc closes typing without a signature', () => {
    render(<SignaturePad />);
    fireEvent.keyDown(pad(), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Имя для подписи' }), { key: 'Escape' });
    expect(screen.queryByRole('textbox', { name: 'Имя для подписи' })).toBeNull();
    expect(pad().getAttribute('data-state')).toBe('empty');
  });

  it('disabled: half opacity, the reason under the field, no drawing', () => {
    render(<SignaturePad disabled description="Сначала отметьте полученные позиции" />);
    expect(pad().getAttribute('aria-disabled')).toBe('true');
    expect(pad().tabIndex).toBe(-1);
    expect(screen.getByText('Сначала отметьте полученные позиции')).not.toBeNull();
    draw([
      [40, 100],
      [90, 80],
    ]);
    expect(pad().getAttribute('data-state')).toBe('empty');
  });
});

describe('SignatureCard', () => {
  it('shows the accepted picture, who and when, and the actions', () => {
    render(<SignatureCard src="data:image/png;base64,AAAA" name="Ирина Котова" time="2 ноября 2026, 14:32" actions={<button type="button">Ещё</button>} />);
    const card = document.querySelector('[data-slot=signature-card]') as HTMLElement;
    expect(card.querySelector('img')?.getAttribute('alt')).toBe('Подпись: Ирина Котова');
    expect(card.textContent).toContain('2 ноября 2026, 14:32');
    expect(button('Ещё')).not.toBeNull();
  });
});
