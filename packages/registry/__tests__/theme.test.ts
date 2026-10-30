import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEME_STORAGE_KEY, applyTheme, readThemePreferences } from '..';

describe('theme', () => {
  beforeEach(() => localStorage.clear());

  it('puts density on the root element next to the other theme attributes', () => {
    const root = document.createElement('div');
    applyTheme({ ...DEFAULT_THEME, accent: 'jade', density: 'compact' }, root);
    expect(root.getAttribute('data-accent')).toBe('jade');
    expect(root.getAttribute('data-density')).toBe('compact');
  });

  it('reads a saved density and falls back on unknown values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ density: 'compact', accent: 'neon' }));
    expect(readThemePreferences()).toMatchObject({ density: 'compact', accent: 'cobalt' });

    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ density: 'huge' }));
    expect(readThemePreferences().density).toBe('regular');
  });
});
