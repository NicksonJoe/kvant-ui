import { DEFAULT_ACCENT, aliasName, type Accent, type Mode, type Token, type TokenSets } from './dtcg.ts';

export interface Rgba {
  /** 0–255 */
  r: number;
  g: number;
  b: number;
  /** 0–1 */
  a: number;
}

/** OKLCH → sRGB (Björn Ottosson's matrices). */
export function oklchToRgba([l, c, h]: readonly [number, number, number], alpha = 1): Rgba {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);
  const lms = [l + 0.3963377774 * a + 0.2158037573 * b, l - 0.1055613458 * a - 0.0638541728 * b, l - 0.0894841775 * a - 1.291485548 * b].map(
    (value) => value ** 3,
  );
  const [L = 0, M = 0, S = 0] = lms;
  const linear = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
  // shortcut: out-of-gamut channels are clipped, not gamut-mapped; fine for the stub palettes, map properly before shipping P3 colours.
  const [r = 0, g = 0, bl = 0] = linear.map((value) => {
    const encoded = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
  });
  return { r, g, b: bl, a: alpha };
}

const hex2 = (value: number): string => value.toString(16).padStart(2, '0');

/** `#rrggbb`, or `#rrggbbaa` when translucent. */
export function toHex({ r, g, b, a }: Rgba): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(Math.round(a * 255)) : ''}`;
}

/**
 * Token sets in the order the CSS cascade applies them on <html data-accent data-mode>:
 * equal-specificity rules in source order, then the [data-mode='dark'] pairs that outrank them.
 */
function cascade(sets: TokenSets, accent: Accent, mode: Mode): Token[][] {
  const accents = accent === DEFAULT_ACCENT ? [sets.accents[accent]] : [sets.accents[DEFAULT_ACCENT], sets.accents[accent]];
  const light = [sets.base, sets.modes.light, ...(mode === 'dark' ? [sets.modes.dark] : []), ...accents.map((set) => set.light)];
  return mode === 'dark' ? [...light, ...accents.map((set) => set.dark)] : light;
}

/** Every `color-*` token resolved to sRGB for one accent and mode. */
export function resolveColors(sets: TokenSets, accent: Accent, mode: Mode): Map<string, Rgba> {
  const tokens = new Map<string, Token>();
  for (const layer of cascade(sets, accent, mode)) for (const token of layer) tokens.set(token.name, token);

  const lookup = (name: string): Token => {
    const token = tokens.get(name);
    if (!token) throw new Error(`${accent}/${mode}: --${name} is not defined`);
    return token;
  };
  const number = (name: string): number => {
    const { value } = lookup(name);
    if (typeof value !== 'number') throw new Error(`${accent}/${mode}: --${name} must be a number`);
    return value;
  };
  const channels = (name: string, depth = 0): { lch: [number, number, number]; alpha: number } => {
    const token = lookup(name);
    const alias = aliasName(token.value);
    if (alias) {
      if (depth > 8) throw new Error(`${accent}/${mode}: alias loop at --${name}`);
      return channels(alias, depth + 1);
    }
    const { value, role } = token;
    if (typeof value !== 'object' || !('colorSpace' in value)) throw new Error(`${accent}/${mode}: --${name} is not a colour`);
    const alpha = value.alpha ?? 1;
    if (role.ink) return { lch: channels('ink', depth + 1).lch, alpha };
    const [l, c, h] = value.components;
    if (role.tint) return { lch: [l, c * number('tint-strength'), number('tint-hue')], alpha };
    if (role.hue) return { lch: [l, c, number(`hue-${role.hue}`)], alpha };
    return { lch: [l, c, h], alpha };
  };

  const colors = new Map<string, Rgba>();
  for (const name of tokens.keys()) {
    if (!name.startsWith('color-')) continue;
    const { lch, alpha } = channels(name);
    colors.set(name, oklchToRgba(lch, alpha));
  }
  return colors;
}
