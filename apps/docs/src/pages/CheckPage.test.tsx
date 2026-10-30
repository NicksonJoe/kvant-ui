import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { EnvironmentProvider } from '../lib/environment';
import { PreviewProvider } from '../lib/preview';
import { CheckPage } from './CheckPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <EnvironmentProvider>
        <PreviewProvider>
          <CheckPage />
        </PreviewProvider>
      </EnvironmentProvider>
    </MemoryRouter>,
  );
}

describe('CheckPage', () => {
  it('shows each ready component in its key states', () => {
    renderPage();
    const button = screen.getByRole('region', { name: 'Кнопка' });
    expect(within(button).getAllByRole('figure').map((figure) => figure.querySelector('figcaption span')?.textContent)).toEqual([
      'покой',
      'наведение',
      'нажатие',
      'фокус',
      'отключено',
      'загрузка',
    ]);
    expect(within(button).getByRole('link', { name: 'Кнопка' }).getAttribute('href')).toBe('/components/button?tab=states');
  });

  it('puts light and dark side by side for every component', () => {
    renderPage();
    fireEvent.click(screen.getByRole('switch', { name: 'Светлый и тёмный' }));
    const button = screen.getByRole('region', { name: 'Кнопка' });
    expect([...button.querySelectorAll('[data-mode]')].map((scope) => scope.getAttribute('data-mode'))).toEqual(['light', 'dark']);
    const components = screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('/components/'));
    expect(document.querySelectorAll('[data-mode="dark"]')).toHaveLength(components.length);
  });
});
