import { readFileSync } from 'node:fs';

/** Namespace of Kvant's own `$extensions` in the DTCG files. */
export const EXTENSION = 'cloud.norda.kvant';

/** Palette order. The default accent also styles `:root`. */
export const ACCENTS = ['graphite', 'cobalt', 'iris', 'aqua', 'jade', 'amber', 'ember', 'orchid'] as const;
export type Accent = (typeof ACCENTS)[number];
export const DEFAULT_ACCENT: Accent = 'cobalt';

export const MODES = ['light', 'dark'] as const;
export type Mode = (typeof MODES)[number];

export const STATUS_HUES = ['success', 'warning', 'danger'] as const;
export type StatusHue = (typeof STATUS_HUES)[number];

export interface OklchValue {
  colorSpace: 'oklch';
  components: [number, number, number];
  alpha?: number;
}

export interface TransitionValue {
  duration: string;
  delay: string;
  timingFunction: string;
}

export interface TypographyValue {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
}

/** Colours are DTCG objects; every other value is its CSS form (DTCG has no em, calc() or linear()). */
export type TokenValue = string | number | string[] | number[] | OklchValue | TransitionValue | TypographyValue;

/**
 * How a colour follows the theme inputs (`$extensions["cloud.norda.kvant"]`).
 * The stored components are the default accent's, so the files stay valid DTCG for cobalt.
 */
export interface ColorRole {
  /** Hue becomes --tint-hue and chroma is scaled by --tint-strength: neutrals lean towards the accent. */
  tint?: boolean;
  /** Hue becomes --hue-<status>. */
  hue?: StatusHue;
  /** Lightness, chroma and hue come from --ink; only alpha is the token's own. */
  ink?: boolean;
  /** Emitted as bare `L C H` channels for use inside oklch() (the --ink token itself). */
  channels?: boolean;
}

export interface Token {
  /** CSS custom property without the dashes: `color-surface-1`. */
  name: string;
  /** Group path plus key: ['color', 'surface-1']. */
  path: string[];
  type: string | undefined;
  value: TokenValue;
  /** Group or token description, emitted as a CSS comment. */
  comment?: string;
  role: ColorRole;
}

/** `light` applies in both modes, `dark` overrides it under data-mode="dark". */
export interface ThemeSet {
  light: Token[];
  dark: Token[];
}

export interface TokenSets {
  base: Token[];
  modes: ThemeSet;
  accents: Record<Accent, ThemeSet>;
  /** Opt-in overrides keyed by variant id: font-geist, shape-density, density-compact, reduce-motion. */
  variants: Record<string, Token[]>;
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

const DTCG_DIR = new URL('../dtcg/', import.meta.url);
const ALIAS = /^\{([\w.-]+)\}$/;

function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function child(node: JsonObject, key: string, where: string): JsonObject {
  const value = node[key];
  if (!isObject(value)) throw new Error(`${where}: "${key}" must be a group`);
  return value;
}

function readSet(file: string): JsonObject {
  const json: Json = JSON.parse(readFileSync(new URL(file, DTCG_DIR), 'utf8'));
  if (!isObject(json)) throw new Error(`${file}: expected a DTCG group`);
  return json;
}

const isNumber = (value: Json): value is number => typeof value === 'number';
const isString = (value: Json): value is string => typeof value === 'string';

function oklch(value: JsonObject): OklchValue | undefined {
  const { colorSpace, components, alpha } = value;
  if (colorSpace !== 'oklch' || !Array.isArray(components) || !components.every(isNumber)) return undefined;
  const [l, c, h, extra] = components;
  if (l === undefined || c === undefined || h === undefined || extra !== undefined) return undefined;
  if (alpha === undefined) return { colorSpace, components: [l, c, h] };
  return typeof alpha === 'number' ? { colorSpace, components: [l, c, h], alpha } : undefined;
}

function tokenValue(value: Json | undefined, type: string | undefined, where: string): TokenValue {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (Array.isArray(value) && value.every(isNumber)) return value;
  if (Array.isArray(value) && value.every(isString)) return value;
  if (isObject(value)) {
    if (type === 'color') {
      const color = oklch(value);
      if (color) return color;
    }
    const { duration, delay, timingFunction, fontSize, lineHeight, letterSpacing } = value;
    if (type === 'transition' && typeof duration === 'string' && typeof delay === 'string' && typeof timingFunction === 'string') {
      return { duration, delay, timingFunction };
    }
    if (type === 'typography' && typeof fontSize === 'string' && typeof lineHeight === 'string' && typeof letterSpacing === 'string') {
      return { fontSize, lineHeight, letterSpacing };
    }
  }
  throw new Error(`${where}: unsupported $value for $type ${type ?? '(none)'}`);
}

function colorRole(extensions: Json | undefined, where: string): ColorRole {
  const own = isObject(extensions) ? extensions[EXTENSION] : undefined;
  if (own === undefined) return {};
  if (!isObject(own)) throw new Error(`${where}: $extensions["${EXTENSION}"] must be an object`);
  const hue = own.hue;
  if (hue !== undefined && !STATUS_HUES.some((status) => status === hue)) throw new Error(`${where}: unknown status hue ${String(hue)}`);
  return {
    tint: own.tint === true || undefined,
    hue: STATUS_HUES.find((status) => status === hue),
    ink: own.ink === true || undefined,
    channels: own.channels === true || undefined,
  };
}

/** Depth-first walk in file order; `$type` is inherited, a group's `$description` goes to its first token. */
function flatten(group: JsonObject, path: string[], inheritedType: string | undefined, out: Token[] = []): Token[] {
  const type = typeof group.$type === 'string' ? group.$type : inheritedType;
  let comment = path.length > 0 && typeof group.$description === 'string' ? group.$description : undefined;
  for (const [key, node] of Object.entries(group)) {
    if (key.startsWith('$')) continue;
    const where = [...path, key].join('.');
    if (!isObject(node)) throw new Error(`${where}: expected a token or a group`);
    if (!('$value' in node)) {
      flatten(node, [...path, key], type, out);
      continue;
    }
    const tokenType = typeof node.$type === 'string' ? node.$type : type;
    out.push({
      name: [...path, key].join('-'),
      path: [...path, key],
      type: tokenType,
      value: tokenValue(node.$value, tokenType, where),
      comment: typeof node.$description === 'string' ? node.$description : comment,
      role: colorRole(node.$extensions, where),
    });
    comment = undefined;
  }
  return out;
}

function themeSet(json: JsonObject, file: string): ThemeSet {
  return { light: flatten(child(json, 'light', file), [], undefined), dark: flatten(child(json, 'dark', file), [], undefined) };
}

export function loadTokens(): TokenSets {
  const accents = {} as Record<Accent, ThemeSet>;
  for (const accent of ACCENTS) accents[accent] = themeSet(readSet(`accents/${accent}.tokens.json`), accent);
  const variants: Record<string, Token[]> = {};
  const variantFile = readSet('variants.tokens.json');
  for (const id of Object.keys(variantFile).filter((key) => !key.startsWith('$'))) {
    variants[id] = flatten(child(variantFile, id, 'variants'), [], undefined);
  }
  return {
    base: flatten(readSet('base.tokens.json'), [], undefined),
    modes: themeSet(readSet('modes.tokens.json'), 'modes'),
    accents,
    variants,
  };
}

/** CSS name of an alias target: `{color.accent}` → `color-accent`. */
export function aliasName(value: TokenValue): string | undefined {
  return typeof value === 'string' ? ALIAS.exec(value)?.[1]?.replaceAll('.', '-') : undefined;
}
