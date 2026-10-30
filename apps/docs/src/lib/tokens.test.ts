import { describe, expect, it } from 'vitest';
import { components, isReady } from '@/kvant/meta';
import { REDUCED_MOTION, ROOT_VALUES, TOKENS, TOKEN_GROUPS, cleanValue, motionTokenNames, tokensOf } from './tokens';

describe('tokens', () => {
  it('lists every public token of tokens.css once, without the theme inputs', () => {
    const names = TOKENS.map((token) => token.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(expect.arrayContaining(['--color-accent', '--color-ring', '--spring-micro', '--radius-control-md', '--text-body-sm']));
    expect(names.filter((name) => /^--(ink|tint-|hue-)/.test(name))).toEqual([]);
  });

  it('files each token under exactly one group', () => {
    for (const token of TOKENS) expect(TOKEN_GROUPS.map((group) => group.id)).toContain(token.group);
    expect(tokensOf('motion').map((token) => token.name)).toEqual(expect.arrayContaining(['--duration-micro', '--ease-out', '--scale-press']));
    expect(tokensOf('color').every((token) => token.name.startsWith('--color-'))).toBe(true);
  });

  it('knows what reduced motion remaps, and from what', () => {
    expect(REDUCED_MOTION['--duration-base']).toBe('150ms');
    expect(REDUCED_MOTION['--scale-press']).toBe('1');
    expect(REDUCED_MOTION['--duration-micro']).toBeUndefined();
    expect(ROOT_VALUES['--duration-base']).toBe('200ms');
  });
});

describe('motionTokenNames', () => {
  it('collects the tokens and curves of motion rows once, in order', () => {
    expect(
      motionTokenNames([
        { label: 'Наведение', value: '', easing: 'ease-hover', tokens: ['duration-micro', 'ease-hover'] },
        { label: 'Фокус', value: '', easing: 'instant' },
        { label: 'Отпускание', value: '', easing: 'spring-micro' },
      ]),
    ).toEqual(['duration-micro', 'ease-hover', 'spring-micro']);
  });

  it('names only real tokens in the motion rows of ready components', () => {
    const named = components.filter(isReady).flatMap((meta) => meta.motion.flatMap((row) => row.tokens ?? []));
    expect(named.filter((name) => !TOKENS.some((token) => token.name === `--${name}`))).toEqual([]);
  });
});

describe('cleanValue', () => {
  it('folds the tint arithmetic a computed custom property keeps', () => {
    expect(cleanValue('oklch(0.215 calc(0.012 * 1) 258)')).toBe('oklch(0.215 0.012 258)');
    expect(cleanValue('oklch(0.616 calc(0.016 * 0.6) 286)')).toBe('oklch(0.616 0.0096 286)');
    expect(cleanValue('  200ms  ')).toBe('200ms');
  });
});
