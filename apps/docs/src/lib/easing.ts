/** A point of an easing curve: input progress → output progress, both 0..1 (output may overshoot). */
export type CurvePoint = readonly [x: number, y: number];

const round = (value: number, digits = 3) => Number(value.toFixed(digits));

/** Apple spring model (duration d in seconds, bounce b) → constants with mass 1: k = (2π/d)², c = 4π(1 − b)/d. */
export function springConstants(duration: number, bounce: number): { stiffness: number; damping: number } {
  return { stiffness: ((2 * Math.PI) / duration) ** 2, damping: (4 * Math.PI * (1 - bounce)) / duration };
}

/** Step response of a unit spring (ω₀ = 1) with damping ratio ζ = 1 − bounce, 0 ≤ bounce < 1. */
function springResponse(bounce: number, t: number): number {
  const zeta = 1 - bounce;
  if (zeta >= 1) return 1 - Math.exp(-t) * (1 + t);
  const omega = Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * t) * (Math.cos(omega * t) + (zeta / omega) * Math.sin(omega * t));
}

/**
 * The spring as a CSS easing: its step response until it stays within 0.1 % of the target, squeezed into
 * the transition — the same shape as the --ease-spring-* tokens (the transition duration is the spring's d).
 */
export function springLinear(bounce: number, samples = 40): string {
  const step = 0.005;
  let settled = 0;
  for (let t = 0; t < 60; t += step) if (Math.abs(springResponse(bounce, t) - 1) > 0.001) settled = t + step;
  const values = Array.from({ length: samples + 1 }, (_, index) =>
    index === samples ? 1 : round(springResponse(bounce, (index / samples) * settled)),
  );
  return `linear(${values.join(', ')})`;
}

const KEYWORDS: Record<string, string> = {
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  'ease-in': 'cubic-bezier(0.42, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.58, 1)',
  'ease-in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
};

function bezierPoints(x1: number, y1: number, x2: number, y2: number, samples: number): CurvePoint[] {
  const at = (s: number, a: number, b: number) => 3 * (1 - s) ** 2 * s * a + 3 * (1 - s) * s ** 2 * b + s ** 3;
  return Array.from({ length: samples + 1 }, (_, index) => {
    const s = index / samples;
    return [round(at(s, x1, x2), 4), round(at(s, y1, y2), 4)] as const;
  });
}

/** `linear()` stops: positions are optional; missing ones are spread evenly between their neighbours. */
function linearPoints(args: string): CurvePoint[] {
  const stops: { y: number; x: number | null }[] = [];
  for (const part of args.split(',')) {
    const [value = '', ...positions] = part.trim().split(/\s+/);
    const y = Number(value);
    if (!Number.isFinite(y)) return [];
    if (positions.length === 0) stops.push({ y, x: null });
    for (const position of positions) stops.push({ y, x: Number.parseFloat(position) / 100 });
  }
  const first = stops[0];
  const last = stops.at(-1);
  if (!first || !last) return [];
  first.x ??= 0;
  last.x ??= 1;
  const points: CurvePoint[] = [];
  let previous = 0;
  stops.forEach((stop, index) => {
    if (stop.x === null) {
      const nextIndex = stops.findIndex((item, at) => at > index && item.x !== null);
      const next = stops[nextIndex]?.x ?? 1;
      const before = stops.slice(0, index).findLastIndex((item) => item.x !== null);
      stop.x = previous + ((next - previous) * (index - before)) / (nextIndex - before);
    }
    // a position smaller than an earlier one is clamped up, as in CSS
    previous = Math.max(previous, stop.x);
    points.push([round(previous, 4), stop.y]);
  });
  return points;
}

/** Points of a CSS easing for drawing: cubic-bezier(), linear(), the keywords and the instant step. */
export function easingCurve(css: string, samples = 32): CurvePoint[] {
  const value = KEYWORDS[css.trim()] ?? css.trim();
  if (value === 'linear') return [[0, 0], [1, 1]];
  if (value === 'step-start' || /^steps\(1,\s*(jump-)?start\)$/.test(value)) return [[0, 0], [0, 1], [1, 1]];
  const bezier = /^cubic-bezier\(([^)]+)\)$/.exec(value);
  if (bezier) {
    const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = (bezier[1] ?? '').split(',').map(Number);
    return [x1, y1, x2, y2].every(Number.isFinite) ? bezierPoints(x1, y1, x2, y2, samples) : [];
  }
  const linear = /^linear\((.+)\)$/.exec(value);
  return linear ? linearPoints(linear[1] ?? '') : [];
}

/** `75ms` or `0.3s` → milliseconds; null for anything else. */
export function toMs(value: string): number | null {
  const match = /^(\d*\.?\d+)(ms|s)$/.exec(value.trim());
  return match ? Number(match[1]) * (match[2] === 's' ? 1000 : 1) : null;
}

/** A transition shorthand as the spring tokens write it: `200ms linear(…)` → 200 and the easing. */
export function splitTransition(value: string): { ms: number | null; easing: string } {
  const match = /^(\d*\.?\d+)(ms|s)\s+(.+)$/.exec(value.trim());
  if (!match) return { ms: null, easing: value.trim() };
  return { ms: Number(match[1]) * (match[2] === 's' ? 1000 : 1), easing: match[3] ?? '' };
}

/** A motion token as an easing to draw: `ease-hover` → its cubic-bezier, `spring-micro` → its linear(), `instant` → a step. */
export function resolveEasing(token: string, read: (name: string) => string): string {
  if (token === 'instant') return 'step-start';
  if (token === 'linear') return 'linear';
  const value = read(`--${token}`);
  return token.startsWith('spring-') ? splitTransition(value).easing : value;
}

/** Multiplies every time in a CSS value: `kv-spin 800ms linear infinite` × 4 → `kv-spin 3200ms linear infinite`. */
export function scaleTimes(value: string, factor: number): string {
  return value.replace(/(?<![\w.])(\d*\.?\d+)(ms|s)\b/g, (_, amount: string, unit: string) => {
    const ms = Number(amount) * (unit === 's' ? 1000 : 1);
    return `${round(ms * factor)}ms`;
  });
}
