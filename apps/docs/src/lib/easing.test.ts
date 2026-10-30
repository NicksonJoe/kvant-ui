import { describe, expect, it } from 'vitest';
import { easingCurve, resolveEasing, scaleTimes, splitTransition, springConstants, springLinear, toMs } from './easing';

// Values of --ease-spring-0 and --ease-spring-10 in tokens.css at a few stops.
const SPRING_0 = [
  [0.138, 0.365],
  [0.336, 0.817],
  [0.524, 0.954],
] as const;
const SPRING_10 = [
  [0.155, 0.393],
  [0.32, 0.794],
  [0.479, 0.95],
] as const;

function valueAt(css: string, x: number): number {
  const points = easingCurve(css);
  const index = points.findIndex(([px]) => px >= x);
  const [x0, y0] = points[index - 1] ?? [0, 0];
  const [x1, y1] = points[index] ?? [1, 1];
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
}

describe('springConstants', () => {
  it('turns Apple duration and bounce into stiffness and damping (mass 1)', () => {
    const { stiffness, damping } = springConstants(0.2, 0);
    expect(stiffness).toBeCloseTo(987, 0);
    expect(damping).toBeCloseTo(62.8, 1);
  });
});

describe('springLinear', () => {
  it('draws the same curves as the spring tokens', () => {
    for (const [x, y] of SPRING_0) expect(valueAt(springLinear(0), x)).toBeCloseTo(y, 1);
    for (const [x, y] of SPRING_10) expect(valueAt(springLinear(0.1), x)).toBeCloseTo(y, 1);
  });

  it('starts at 0, ends at 1 and overshoots only with a bounce', () => {
    const calm = easingCurve(springLinear(0)).map(([, y]) => y);
    const bouncy = easingCurve(springLinear(0.3)).map(([, y]) => y);
    expect(calm[0]).toBe(0);
    expect(calm.at(-1)).toBe(1);
    expect(Math.max(...calm)).toBeLessThanOrEqual(1);
    expect(Math.max(...bouncy)).toBeGreaterThan(1.01);
  });
});

describe('easingCurve', () => {
  it('samples cubic-bezier from (0, 0) to (1, 1)', () => {
    const points = easingCurve('cubic-bezier(0.23, 1, 0.32, 1)');
    expect(points[0]).toEqual([0, 0]);
    expect(points.at(-1)).toEqual([1, 1]);
    expect(valueAt('cubic-bezier(0.23, 1, 0.32, 1)', 0.5)).toBeGreaterThan(0.9);
  });

  it('reads linear() stops with and without positions', () => {
    expect(easingCurve('linear(0, 0.5 20%, 1)')).toEqual([
      [0, 0],
      [0.2, 0.5],
      [1, 1],
    ]);
    expect(easingCurve('linear(0, 0.25, 1)')).toEqual([
      [0, 0],
      [0.5, 0.25],
      [1, 1],
    ]);
  });

  it('knows linear and the instant step', () => {
    expect(easingCurve('linear')).toEqual([
      [0, 0],
      [1, 1],
    ]);
    expect(easingCurve('step-start')).toEqual([
      [0, 0],
      [0, 1],
      [1, 1],
    ]);
    expect(easingCurve('nonsense')).toEqual([]);
  });
});

describe('toMs', () => {
  it('reads a CSS time', () => {
    expect(toMs('75ms')).toBe(75);
    expect(toMs(' 0.3s ')).toBe(300);
    expect(toMs('kv-spin 800ms linear infinite')).toBeNull();
  });
});

describe('splitTransition', () => {
  it('separates the duration from the easing of a spring token', () => {
    expect(splitTransition('200ms linear(0, 1)')).toEqual({ ms: 200, easing: 'linear(0, 1)' });
    expect(splitTransition('cubic-bezier(0.2, 0, 0, 1)')).toEqual({ ms: null, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  });
});

describe('resolveEasing', () => {
  const read = (name: string) => ({ '--ease-hover': 'cubic-bezier(0.25, 0.1, 0.25, 1)', '--spring-micro': '200ms linear(0, 1)' })[name] ?? '';

  it('turns a motion token into the easing to draw', () => {
    expect(resolveEasing('ease-hover', read)).toBe('cubic-bezier(0.25, 0.1, 0.25, 1)');
    expect(resolveEasing('spring-micro', read)).toBe('linear(0, 1)');
    expect(resolveEasing('instant', read)).toBe('step-start');
    expect(resolveEasing('linear', read)).toBe('linear');
  });
});

describe('scaleTimes', () => {
  it('multiplies every time in a CSS value and nothing else', () => {
    expect(scaleTimes('200ms linear(0, 0.5 20%, 1)', 4)).toBe('800ms linear(0, 0.5 20%, 1)');
    expect(scaleTimes('kv-spin 800ms linear infinite', 4)).toBe('kv-spin 3200ms linear infinite');
    expect(scaleTimes('0.3s', 2)).toBe('600ms');
    expect(scaleTimes('0ms', 4)).toBe('0ms');
  });
});
