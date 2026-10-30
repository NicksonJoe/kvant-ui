import { readFileSync } from 'node:fs';
import { ACCENTS, DEFAULT_ACCENT, aliasName, type OklchValue, type ColorRole, type Token, type TokenSets } from './dtcg.ts';

/** Variant id in variants.tokens.json → the <html> attribute that switches it on. */
const VARIANT_SELECTORS: Record<string, string> = {
  'font-geist': "[data-font='geist']",
  'shape-density': "[data-shape='density']",
  'density-compact': "[data-density='compact']",
  'reduce-motion': '[data-reduce-motion]',
};

const GENERIC_FAMILIES = new Set(['serif', 'sans-serif', 'monospace', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', '-apple-system']);

function oklch({ components: [l, c, h], alpha }: OklchValue, role: ColorRole): string {
  const opacity = alpha === undefined ? '' : ` / ${alpha}`;
  if (role.ink) return `oklch(var(--ink)${opacity})`;
  const chroma = role.tint ? `calc(${c} * var(--tint-strength))` : String(c);
  const hue = role.tint ? 'var(--tint-hue)' : role.hue ? `var(--hue-${role.hue})` : String(h);
  return role.channels ? `${l} ${chroma} ${hue}` : `oklch(${l} ${chroma} ${hue}${opacity})`;
}

const reference = (value: string): string => {
  const alias = aliasName(value);
  return alias ? `var(--${alias})` : value;
};

export function cssValue(token: Token): string {
  const { value } = token;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return reference(value);
  if (Array.isArray(value)) {
    if (token.type === 'cubicBezier') return `cubic-bezier(${value.join(', ')})`;
    return value.map((family) => (typeof family === 'string' && !GENERIC_FAMILIES.has(family) ? `'${family}'` : String(family))).join(', ');
  }
  if ('colorSpace' in value) return oklch(value, token.role);
  if ('timingFunction' in value) {
    return [value.duration, reference(value.timingFunction), value.delay === '0ms' ? '' : value.delay].filter(Boolean).join(' ');
  }
  throw new Error(`--${token.name}: ${token.type} has no single CSS value`);
}

function rule(selectors: string[], tokens: Token[], extra: string[] = [], indent = ''): string {
  const lines = extra.map((declaration) => `${indent}  ${declaration};`);
  let group: string | undefined;
  for (const token of tokens) {
    if (token.type === 'typography') continue;
    if (lines.length > 0 && token.path[0] !== group) lines.push('');
    group = token.path[0];
    if (token.comment) lines.push(`${indent}  /* ${token.comment} */`);
    lines.push(`${indent}  --${token.name}: ${cssValue(token)};`);
  }
  return `${indent}${selectors.join(`,\n${indent}`)} {\n${lines.join('\n')}\n${indent}}`;
}

const section = (title: string): string => `/* ---------- ${title} ---------- */`;

export function buildTokensCss(sets: TokenSets): string {
  const header = `/*
 * Kvant tokens — plain CSS custom properties, no framework required.
 * Generated from the Kvant DTCG tokens (packages/tokens): change the tokens, not this file.
 * Theme = data-accent × data-mode on <html> (set before first paint).
 * Scoped theming: put BOTH data-accent and data-mode on the scoping element.
 *   data-accent  ${ACCENTS.map((accent) => (accent === DEFAULT_ACCENT ? `${accent} (default)` : accent)).join(' | ')}
 *   data-mode    light (default) | dark
 *   data-font    inter (default) | geist
 *   data-shape   capsule (default) | density
 *   data-density regular (default) | compact
 *   data-reduce-motion   presence forces reduced motion (the OS setting applies too)
 */`;

  // The default accent comes first: its `:root` rules must lose to any later [data-accent] of equal specificity.
  const accents = [DEFAULT_ACCENT, ...ACCENTS.filter((accent) => accent !== DEFAULT_ACCENT)].flatMap((accent) => {
    const own = `[data-accent='${accent}']`;
    const isDefault = accent === DEFAULT_ACCENT;
    const { light, dark } = sets.accents[accent];
    return [
      rule(isDefault ? [':root', own] : [own], light),
      ...(dark.length > 0 ? [rule(isDefault ? [":root[data-mode='dark']", `${own}[data-mode='dark']`] : [`${own}[data-mode='dark']`], dark)] : []),
    ];
  });

  const variants = Object.entries(sets.variants).map(([id, tokens]) => {
    const selector = VARIANT_SELECTORS[id];
    if (!selector) throw new Error(`variants.tokens.json: unknown variant "${id}"`);
    if (id !== 'reduce-motion') return rule([selector], tokens);
    return `${rule([selector], tokens)}\n@media (prefers-reduced-motion: reduce) {\n${rule([':root'], tokens, [], '  ')}\n}`;
  });

  return [
    header,
    rule([':root'], sets.base),
    section('Neutrals, statuses and effects: light (also the base for dark)'),
    rule([':root', "[data-mode='light']"], sets.modes.light, ['color-scheme: light']),
    section('Neutrals, statuses and effects: dark'),
    rule(["[data-mode='dark']"], sets.modes.dark, ['color-scheme: dark']),
    section('Accents: light values apply in both modes, dark values override them'),
    ...accents,
    section('Variants: font, shape, density, reduced motion (springs become ease-out, no shifts or scales)'),
    ...variants,
    readFileSync(new URL('./static/tokens-tail.css', import.meta.url), 'utf8').trimEnd(),
  ].join('\n\n') + '\n';
}
