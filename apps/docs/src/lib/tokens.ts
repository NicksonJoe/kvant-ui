import { useSyncExternalStore } from 'react';
import type { MotionMeta } from '@/kvant/meta';
import tokensCss from '../../../../packages/registry/styles/tokens.css?raw';

export const TOKEN_GROUPS = [
  { id: 'color', title: 'Цвет', prefixes: ['color-'], lead: 'Роли, а не оттенки. Значения зависят от темы и режима.' },
  { id: 'typography', title: 'Типографика', prefixes: ['font-', 'text-', 'leading-', 'tracking-'], lead: 'Шрифты, кегли, интерлиньяж и трекинг.' },
  { id: 'spacing', title: 'Отступы и размеры', prefixes: ['spacing-'], lead: 'Сетка 4 px и высоты контролов; компактная плотность опускает их на ступень.' },
  { id: 'radius', title: 'Радиусы', prefixes: ['radius-'], lead: 'Контролы — капсулы; форма «Скругление» меняет только радиусы контролов.' },
  { id: 'shadow', title: 'Тени', prefixes: ['shadow-'], lead: 'Кольцо и микротень вместо тяжёлых теней; в тёмном режиме — подъём светлотой.' },
  { id: 'motion', title: 'Движение', prefixes: ['duration-', 'ease-', 'spring-', 'shift-', 'scale-', 'animate-'], lead: 'Длительности, кривые, пружины, смещения и масштабы.' },
  { id: 'layout', title: 'Сетка и прочее', prefixes: ['breakpoint-', 'container-', 'opacity-'], lead: 'Брейкпоинты, ширины контейнеров и прозрачность.' },
] as const;
export type TokenGroupId = (typeof TOKEN_GROUPS)[number]['id'];

export interface Token {
  /** Custom property: `--color-accent`. */
  name: string;
  group: TokenGroupId;
}

// Theme inputs and component internals, not tokens to use.
const INTERNAL = /^--(ink$|tint-|hue-|kv-)/;

function groupOf(name: string): TokenGroupId | undefined {
  return TOKEN_GROUPS.find((group) => group.prefixes.some((prefix) => name.startsWith(`--${prefix}`)))?.id;
}

/** Every public token declared in tokens.css, in source order: the page, the search and the motion tools read this. */
export const TOKENS: readonly Token[] = [...new Set([...tokensCss.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1] ?? ''))]
  .filter((name) => !INTERNAL.test(name))
  .flatMap((name) => {
    const group = groupOf(name);
    return group ? [{ name, group }] : [];
  });

export function tokensOf(group: TokenGroupId): Token[] {
  return TOKENS.filter((token) => token.group === group);
}

/** Tokens a component's motion uses: those the rows name and the curves they draw, once each, without `instant` and `linear`. */
export function motionTokenNames(rows: readonly MotionMeta[]): string[] {
  const named = rows.flatMap((row) => [...(row.tokens ?? []), ...(row.easing ? [row.easing] : [])]);
  return [...new Set(named)].filter((name) => TOKENS.some((token) => token.name === `--${name}`));
}

/** Id of the token's row on /docs/tokens: `--color-accent` → `token-color-accent`. */
export function tokenAnchor(name: string): string {
  return `token-${name.replace(/^--/, '')}`;
}

function declarations(block: RegExp): Readonly<Record<string, string>> {
  const body = block.exec(tokensCss)?.[1] ?? '';
  return Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1] ?? '', (match[2] ?? '').trim()]));
}

/** The base `:root` block: theme-independent values as written in tokens.css. */
export const ROOT_VALUES = declarations(/:root\s*\{([^}]*)\}/);

/** The `[data-reduce-motion]` block: what reduced motion remaps. */
export const REDUCED_MOTION = declarations(/\[data-reduce-motion\]\s*\{([^}]*)\}/);

/** A computed custom property keeps the tint arithmetic: `calc(0.012 * 1)` → `0.012`. */
export function cleanValue(value: string): string {
  return value.trim().replace(/calc\(([\d.]+) \* ([\d.]+)\)/g, (_, a: string, b: string) => String(Number((Number(a) * Number(b)).toFixed(4))));
}

let version = 0;

function subscribe(onChange: () => void): () => void {
  const bump = () => {
    version += 1;
    onChange();
  };
  // the environment lives in attributes on <html>; the OS settings can flip mode and motion too
  const observer = new MutationObserver(bump);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-accent', 'data-mode', 'data-font', 'data-shape', 'data-density', 'data-reduce-motion'] });
  const queries = ['(prefers-color-scheme: dark)', '(prefers-reduced-motion: reduce)'].map((query) => window.matchMedia(query));
  for (const query of queries) query.addEventListener('change', bump);
  return () => {
    observer.disconnect();
    for (const query of queries) query.removeEventListener('change', bump);
  };
}

const getVersion = () => version;

/** Live token values on <html>: the caller re-renders when the theme, mode, density or motion changes. */
export function useTokenValues(): (name: string) => string {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  const style = getComputedStyle(document.documentElement);
  return (name) => cleanValue(style.getPropertyValue(name));
}
