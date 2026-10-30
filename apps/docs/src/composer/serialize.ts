// Composer documents as JSON: the export format, share links (#doc=…) and import. Everything read back is
// untrusted: only known node types, known props with valid values and bounded size get through.
import { FORCED_STATES, type ForcedState, type PropMeta, type PropValue } from '@/kvant/meta';
import { acceptsChildren, getSpec, type NodeSpec } from './catalog';
import { CHILDREN, ROOT_ID, createId, type ComposerNode } from './model';

export const FORMAT = 'kvant-composer';
export const VERSION = 1;

export interface SerializedNode {
  type: string;
  props?: Record<string, PropValue>;
  slots?: Record<string, SerializedNode[]>;
  state?: ForcedState;
}

export interface ComposerFile {
  format: typeof FORMAT;
  version: typeof VERSION;
  root: SerializedNode;
}

const MAX_DEPTH = 24;
const MAX_NODES = 1000;
const MAX_TEXT = 2000;
const MAX_SHARE = 200_000;

/* ---------- write ---------- */

/** Ids are left out: they are regenerated on every read. */
function serializeNode(node: ComposerNode): SerializedNode {
  const out: SerializedNode = { type: node.type };
  if (Object.keys(node.props).length > 0) out.props = { ...node.props };
  const slots = Object.entries(node.slots).filter(([, children]) => children.length > 0);
  if (slots.length > 0) out.slots = Object.fromEntries(slots.map(([name, children]) => [name, children.map(serializeNode)]));
  if (node.state) out.state = node.state;
  return out;
}

export function toFile(root: ComposerNode): ComposerFile {
  return { format: FORMAT, version: VERSION, root: serializeNode(root) };
}

export function stringifyDoc(root: ComposerNode): string {
  return JSON.stringify(toFile(root), null, 2);
}

/** URL-safe base64 of the compact JSON. */
export function encodeShare(root: ComposerNode): string {
  // shortcut: no compression — a template is ~2 KB of URL; add deflate if shared screens outgrow links
  let binary = '';
  for (const byte of new TextEncoder().encode(JSON.stringify(toFile(root)))) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* ---------- read ---------- */

function fail(message: string): never {
  throw new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValid(prop: PropMeta, value: unknown): value is PropValue {
  if (prop.options) return prop.options.some((option) => option === value);
  if (prop.type === 'boolean') return typeof value === 'boolean';
  if (prop.type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (prop.type === 'string') return typeof value === 'string' && value.length <= MAX_TEXT;
  return false;
}

/** Unknown props and invalid values are dropped: the node falls back to its defaults. Key order is kept. */
function parseProps(spec: NodeSpec, raw: unknown): Record<string, PropValue> {
  if (raw === undefined) return {};
  if (!isRecord(raw)) fail('Свойства элемента должны быть объектом');
  const metas = new Map(spec.props.map((prop) => [prop.name, prop]));
  const props: Record<string, PropValue> = {};
  for (const [name, value] of Object.entries(raw)) {
    const prop = metas.get(name);
    if (prop && isValid(prop, value)) props[name] = value;
  }
  return props;
}

function parseSlots(spec: NodeSpec, raw: unknown, depth: number, budget: { nodes: number }): Record<string, ComposerNode[]> {
  const slots: Record<string, ComposerNode[]> = {};
  if (raw !== undefined && !isRecord(raw)) fail('Слоты элемента должны быть объектом');
  for (const [name, list] of isRecord(raw) ? Object.entries(raw) : []) {
    if (!spec.slots.some((slot) => slot.name === name)) continue;
    if (!Array.isArray(list)) fail(`Слот «${name}» должен быть списком`);
    slots[name] = list.map((item: unknown) => parseNode(item, depth + 1, budget));
  }
  if (acceptsChildren(spec) && !slots[CHILDREN]) slots[CHILDREN] = [];
  return slots;
}

function parseNode(raw: unknown, depth: number, budget: { nodes: number }): ComposerNode {
  if (depth > MAX_DEPTH) fail(`Вложенность глубже ${MAX_DEPTH} уровней`);
  budget.nodes += 1;
  if (budget.nodes > MAX_NODES) fail(`Больше ${MAX_NODES} элементов`);
  if (!isRecord(raw)) fail('Элемент должен быть объектом');
  const type = raw.type;
  if (typeof type !== 'string') fail('У элемента нет типа');
  const spec = getSpec(type);
  if (!spec) fail(`Неизвестный элемент «${type.slice(0, 40)}»`);
  const node: ComposerNode = { id: createId(), type, props: parseProps(spec, raw.props), slots: parseSlots(spec, raw.slots, depth, budget) };
  const state = FORCED_STATES.find((item) => item === raw.state && spec.states.includes(item));
  return state ? { ...node, state } : node;
}

export function parseDoc(input: unknown): ComposerNode {
  if (!isRecord(input) || input.format !== FORMAT) fail('Это не документ Playground Kvant');
  if (input.version !== VERSION) fail(`Версия документа ${JSON.stringify(input.version)} не поддерживается`);
  const root = parseNode(input.root, 0, { nodes: 0 });
  if (root.type !== 'stack') fail('Корнем документа должен быть стек');
  return { ...root, id: ROOT_ID };
}

/** «Импорт»: a Playground document or a block saved with «Сохранить как блок» (it carries the document). */
export function parseImport(text: string): ComposerNode {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    fail('Это не JSON');
  }
  return parseDoc(isRecord(json) && isRecord(json.composer) ? json.composer : json);
}

export function decodeShare(value: string): ComposerNode {
  if (value.length > MAX_SHARE) fail('Ссылка слишком длинная');
  let text: string;
  try {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
    text = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  } catch {
    fail('Ссылка повреждена');
  }
  return parseImport(text);
}
