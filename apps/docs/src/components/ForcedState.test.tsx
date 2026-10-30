import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ForcedState } from './ForcedState';

describe('ForcedState', () => {
  it('marks the first interactive element with the forced state', () => {
    render(
      <ForcedState state="hover">
        <span>
          <button type="button">Сохранить</button>
          <button type="button">Отмена</button>
        </span>
      </ForcedState>,
    );
    expect(screen.getByText('Сохранить').hasAttribute('data-force-hover')).toBe(true);
    expect(screen.getByText('Отмена').hasAttribute('data-force-hover')).toBe(false);
  });

  it('keeps the preview inert and unforced without a state', () => {
    const { container } = render(
      <ForcedState>
        <input aria-label="Поле" />
      </ForcedState>,
    );
    const input = screen.getByLabelText('Поле');
    expect([...input.attributes].some((attribute) => attribute.name.startsWith('data-force'))).toBe(false);
    expect(container.firstElementChild?.hasAttribute('inert')).toBe(true);
  });
});
