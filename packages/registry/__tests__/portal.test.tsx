import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LAYERS, Portal } from '..';

describe('LAYERS', () => {
  it('is the seven-step z-index scale from the board', () => {
    expect(LAYERS).toEqual({ content: 0, sticky: 10, dropdown: 40, overlay: 50, modal: 60, toast: 70, tooltip: 80 });
  });
});

describe('Portal', () => {
  it('renders outside the clipping parent, at the end of <body>', () => {
    render(
      <div data-testid="card" className="overflow-hidden">
        <Portal layer="dropdown">
          <p>Подсказка</p>
        </Portal>
      </div>,
    );
    const hint = screen.getByText('Подсказка');
    expect(screen.getByTestId('card').contains(hint)).toBe(false);
    const layer = hint.closest('[data-slot=portal]');
    expect(layer?.parentElement).toBe(document.body);
    expect(document.body.lastElementChild).toBe(layer);
  });

  it.each(Object.entries(LAYERS))('puts layer %s at z-index %i', (layer, z) => {
    render(
      <Portal layer={layer as keyof typeof LAYERS}>
        <p>Слой</p>
      </Portal>,
    );
    const element = screen.getByText('Слой').closest('[data-slot=portal]') as HTMLElement;
    expect(element.getAttribute('data-layer')).toBe(layer);
    expect(element.style.zIndex).toBe(String(z));
    // a positioned box: z-index applies and the layer is one stacking context
    expect(element.className).toContain('relative');
  });

  it('renders into a given container, e.g. a scoped theme', () => {
    const scope = document.createElement('div');
    scope.setAttribute('data-mode', 'dark');
    document.body.append(scope);
    render(
      <Portal layer="modal" container={scope}>
        <p>Внутри</p>
      </Portal>,
    );
    expect(scope.contains(screen.getByText('Внутри'))).toBe(true);
    scope.remove();
  });

  it('leaves <body> clean when it unmounts', () => {
    const { unmount } = render(
      <Portal layer="toast">
        <p>Тост</p>
      </Portal>,
    );
    unmount();
    expect(document.querySelector('[data-slot=portal]')).toBeNull();
  });
});
