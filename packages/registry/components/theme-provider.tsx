import { useEffect, type ReactNode } from 'react';
import { ACCENTS, DENSITIES, FONTS, MODES, SHAPES, THEME_STORAGE_KEY, ThemeContext, useTheme } from '../theme';

const ALLOWED = { accent: ACCENTS, mode: MODES, font: FONTS, shape: SHAPES, density: DENSITIES };

/**
 * Put it first in `<head>`, inline: the saved theme lands on `<html>` before first paint, so a dark theme never
 * flashes light. Same storage key and values as useTheme; unknown values are skipped.
 */
export const themeScript = `(function () {
  try {
    var saved = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) || '{}');
    var allowed = ${JSON.stringify(ALLOWED)};
    var root = document.documentElement;
    for (var key in allowed) {
      var value = saved[key];
      if (key === 'mode' && value === 'system') value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      if (allowed[key].indexOf(value) >= 0) root.setAttribute('data-' + key, value);
    }
    if (saved.reduceMotion === true) root.setAttribute('data-reduce-motion', '');
  } catch (error) {}
})();`;

export interface ThemeProviderProps {
  /** Interface language on `<html lang>`: hyphenation, the screen reader voice, dates and numbers. */
  lang?: string;
  children: ReactNode;
}

/** One theme state for the app: accent, mode, font, shape, density and motion on `<html>`, shared by every useTheme below. */
export function ThemeProvider({ lang = 'ru', children }: ThemeProviderProps) {
  const theme = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.lang;
    root.lang = lang;
    return () => {
      root.lang = previous;
    };
  }, [lang]);

  return <ThemeContext value={theme}>{children}</ThemeContext>;
}
