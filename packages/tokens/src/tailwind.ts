import { readFileSync } from 'node:fs';
import { DEFAULT_ACCENT, aliasName, type Token, type TokenSets } from './dtcg.ts';

interface BridgeRule {
  group: string;
  /** Tailwind theme namespace (default: the group name). */
  namespace?: string;
  /** Token key → utility key; `undefined` keeps the token out of Tailwind. */
  pick?: (key: string) => string | undefined;
}

/** Token groups that become Tailwind utilities, in output order. */
const BRIDGE: BridgeRule[] = [
  { group: 'color' },
  { group: 'font' },
  { group: 'font-weight' },
  { group: 'typography', namespace: 'text' },
  {
    group: 'tracking',
    pick: (key) => ({ display: 'display', 'heading-md': 'heading', body: 'body', overline: 'overline' })[key],
  },
  // Numeric spacing comes from `--spacing: 4px`; only the control heights get names.
  { group: 'spacing', pick: (key) => (key.startsWith('control-') ? key : undefined) },
  // rounded-full stays Tailwind's own.
  { group: 'radius', pick: (key) => (key === 'full' ? undefined : key) },
  { group: 'shadow' },
  { group: 'ease' },
  { group: 'animate' },
  { group: 'container' },
];

const ref = (value: string): string => {
  const alias = aliasName(value);
  return alias ? `var(--${alias})` : value;
};

function declarations(rule: BridgeRule, token: Token, key: string): string[] {
  const name = `--${rule.namespace ?? rule.group}-${key}`;
  if (token.type !== 'typography') return [`${name}: var(--${token.name});`];
  const { value } = token;
  if (typeof value !== 'object' || !('fontSize' in value)) throw new Error(`--${token.name}: typography needs fontSize, lineHeight and letterSpacing`);
  return [`${name}: ${ref(value.fontSize)};`, `${name}--line-height: ${ref(value.lineHeight)};`, `${name}--letter-spacing: ${ref(value.letterSpacing)};`];
}

/** Tailwind v4 `@theme` bridge: utilities read the token variables of the default theme's token set. */
export function buildTailwindCss(sets: TokenSets): string {
  const seen = new Set<string>();
  const tokens = [...sets.base, ...sets.modes.light, ...sets.accents[DEFAULT_ACCENT].light].filter((token) => {
    if (seen.has(token.name)) return false;
    seen.add(token.name);
    return true;
  });
  const blocks = BRIDGE.map((rule) =>
    tokens
      .filter((token) => token.path[0] === rule.group)
      .flatMap((token) => {
        const key = rule.pick ? rule.pick(token.path.slice(1).join('-')) : token.path.slice(1).join('-');
        return key === undefined ? [] : declarations(rule, token, key).map((line) => `  ${line}`);
      })
      .join('\n'),
  );
  const head = readFileSync(new URL('./static/tailwind-head.css', import.meta.url), 'utf8').trimEnd();
  const variants = readFileSync(new URL('./static/tailwind-variants.css', import.meta.url), 'utf8').trimEnd();
  return `${head}\n\n@theme inline reference {\n${blocks.filter(Boolean).join('\n\n')}\n}\n\n${variants}\n`;
}
