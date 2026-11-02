import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { oklchToRgba, resolveColors, toHex, type Rgba } from '../src/color.ts';
import { buildTokensCss } from '../src/css.ts';
import { ACCENTS, DEFAULT_ACCENT, MODES, loadTokens, type Accent, type Mode } from '../src/dtcg.ts';
import { buildDart, buildPhp } from '../src/native.ts';
import { buildTailwindCss } from '../src/tailwind.ts';

const sets = loadTokens();
const registryFile = (file: string): string => readFileSync(new URL(`../../registry/styles/${file}`, import.meta.url), 'utf8');

function hex(accent: Accent, mode: Mode, name: string): string {
  const color = resolveColors(sets, accent, mode).get(name);
  if (!color) throw new Error(`${accent}/${mode}: no --${name}`);
  return toHex(color);
}

describe('generated styles', () => {
  it('registry tokens.css and tailwind.css match the DTCG sources (pnpm generate)', () => {
    expect(registryFile('tokens.css')).toBe(buildTokensCss(sets));
    expect(registryFile('tailwind.css')).toBe(buildTailwindCss(sets));
  });

  it('keeps the default accent on :root so a page without attributes is cobalt light', () => {
    const css = buildTokensCss(sets);
    expect(css).toContain(":root,\n[data-accent='cobalt'] {\n  --color-accent: oklch(0.565 0.19 258);");
    expect(css.indexOf(":root,\n[data-accent='cobalt']")).toBeLessThan(css.indexOf("[data-accent='graphite'] {"));
  });

  it('bridges text styles with their line height and tracking', () => {
    const css = buildTailwindCss(sets);
    expect(css).toContain('--text-body-md: var(--text-body-md);\n  --text-body-md--line-height: var(--leading-body-md);\n  --text-body-md--letter-spacing: var(--tracking-body);');
    expect(css).toContain('--tracking-heading: var(--tracking-heading-md);');
    expect(css).not.toContain('--radius-full:');
  });
});

describe('colours', () => {
  it('resolves cobalt to the brand colours', () => {
    expect(hex('cobalt', 'light', 'color-accent')).toBe('#1c71e2');
    expect(hex('cobalt', 'light', 'color-background')).toBe('#f8f9fb');
  });

  it('stores the default accent values in the DTCG files, so they stay valid DTCG for cobalt', () => {
    const resolved = resolveColors(sets, DEFAULT_ACCENT, 'light');
    for (const token of [...sets.modes.light, ...sets.accents[DEFAULT_ACCENT].light]) {
      if (!token.name.startsWith('color-') || typeof token.value !== 'object' || !('colorSpace' in token.value)) continue;
      const stored = token.role.ink ? undefined : oklchToRgba(token.value.components, token.value.alpha);
      if (stored) expect(resolved.get(token.name), token.name).toEqual(stored);
    }
  });

  it('resolves every colour of every accent in both modes', () => {
    const names = [...resolveColors(sets, DEFAULT_ACCENT, 'light').keys()];
    for (const accent of ACCENTS) for (const mode of MODES) expect([...resolveColors(sets, accent, mode).keys()], `${accent}/${mode}`).toEqual(names);
  });

  it('keeps fg-4 readable as text (4.5:1) on the surfaces text sits on, in every accent and mode', () => {
    const luminance = ({ r, g, b }: Rgba): number => {
      const [R = 0, G = 0, B = 0] = [r, g, b].map((v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4));
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };
    for (const accent of ACCENTS)
      for (const mode of MODES) {
        const colors = resolveColors(sets, accent, mode);
        const color = (name: string): Rgba => {
          const value = colors.get(name);
          if (!value) throw new Error(`${accent}/${mode}: no --${name}`);
          return value;
        };
        const fg = luminance(color('color-fg-4'));
        for (const surface of ['color-background', 'color-surface-1', 'color-surface-2']) {
          const bg = luminance(color(surface));
          const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
          expect(ratio, `${accent}/${mode} fg-4 on ${surface}`).toBeGreaterThanOrEqual(4.5);
        }
      }
  });

  it('follows the accent tint in neutrals and the dark mode overrides', () => {
    expect(hex('ember', 'light', 'color-background')).not.toBe(hex('cobalt', 'light', 'color-background'));
    expect(hex('cobalt', 'dark', 'color-accent')).not.toBe(hex('cobalt', 'light', 'color-accent'));
  });
});

describe('native stubs (cobalt)', () => {
  it('writes Flutter colours per mode', () => {
    const dart = buildDart(sets, 'cobalt');
    expect(dart).toContain("import 'dart:ui';");
    expect(dart).toContain('abstract final class KvantCobaltLight {');
    expect(dart).toContain('abstract final class KvantCobaltDark {');
    expect(dart).toContain('  static const accent = Color(0xFF1C71E2);');
    expect(dart).toContain('  static const background = Color(0xFFF8F9FB);');
    expect(dart).toMatch(/static const border = Color\(0x24[0-9A-F]{6}\);/);
  });

  it('writes a Filament colour array per mode', () => {
    const php = buildPhp(sets, 'cobalt');
    expect(php.startsWith('<?php\n\ndeclare(strict_types=1);')).toBe(true);
    expect(php).toContain("    'light' => [\n        'background' => '#f8f9fb',");
    expect(php).toContain("        'accent' => '#1c71e2',");
    expect(php).toMatch(/'border' => '#[0-9a-f]{8}',/);
    expect(php.trimEnd().endsWith('];')).toBe(true);
  });
});

describe('sources', () => {
  it('has one DTCG file per accent of the theme switcher', () => {
    const files = readdirSync(new URL('../dtcg/accents/', import.meta.url)).map((file) => file.replace('.tokens.json', ''));
    expect(files.sort()).toEqual([...ACCENTS].sort());
    const theme = readFileSync(new URL('../../registry/theme.ts', import.meta.url), 'utf8');
    expect(theme).toContain(`export const ACCENTS = [${ACCENTS.map((accent) => `'${accent}'`).join(', ')}] as const;`);
  });
});
