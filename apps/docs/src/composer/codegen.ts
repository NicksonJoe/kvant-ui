// Composer tree → clean JSX: a component with its imports, the `kvant-ui add` command and a registry block item.
import * as kvant from '@/kvant';
import type { ReadyComponentMeta } from '@/kvant/meta';
import registryPackage from '@/kvant/package.json?raw';
import { readyComponents } from '../lib/registry';
import { CHILDREN, type ComposerNode } from './model';
import { readProps, requireSpec, type ComposableSpec, type PrimitiveSpec } from './catalog';
import {
  SECTION_DESCRIPTION,
  SECTION_HEADER,
  SECTION_TITLE,
  cardWidthClass,
  gridClasses,
  iconClasses,
  isIconName,
  rowClasses,
  sectionClasses,
  stackClasses,
  textStyle,
} from './primitives';
import { toFile, type ComposerFile } from './serialize';

const INDENT = '  ';

function indent(code: string): string {
  return code
    .split('\n')
    .map((line) => (line ? INDENT + line : line))
    .join('\n');
}

/** JSX text; anything JSX would read as syntax (or trim) goes into a string expression. */
function jsxText(value: string): string {
  return /[{}<>\n]/.test(value) || value !== value.trim() ? `{${JSON.stringify(value)}}` : value;
}

function stringAttr(name: string, value: string): string {
  return /["{}\n]/.test(value) ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`;
}

/** `<Tag a b>…</Tag>`; attributes go one per line once they hold JSX or the tag gets long. */
function element(tag: string, attrs: readonly string[], children: readonly string[] = [], text = ''): string {
  const flat = attrs.length > 0 ? `<${tag} ${attrs.join(' ')}` : `<${tag}`;
  const multiline = attrs.some((attr) => attr.includes('\n')) || flat.length > 80;
  const open = multiline ? `<${tag}\n${attrs.map(indent).join('\n')}\n` : flat;
  if (children.length === 0 && !text) return multiline ? `${open}/>` : `${open} />`;
  if (children.length === 0 && !multiline && `${open}>${jsxText(text)}</${tag}>`.length <= 100) return `${open}>${jsxText(text)}</${tag}>`;
  const body = children.length > 0 ? children : [jsxText(text)];
  return `${open}>\n${body.map(indent).join('\n')}\n</${tag}>`;
}

function slotAttr(name: string, nodes: readonly ComposerNode[]): string {
  const parts = nodes.map(nodeCode);
  const value = parts.length === 1 ? (parts[0] ?? '') : `<>\n${parts.map(indent).join('\n')}\n</>`;
  return value.includes('\n') ? `${name}={\n${indent(value)}\n}` : `${name}={${value}}`;
}

const classAttr = (className: string): string[] => (className ? [`className="${className}"`] : []);

function primitiveCode(spec: PrimitiveSpec, node: ComposerNode): string {
  const read = readProps(spec, node);
  const children = (node.slots[CHILDREN] ?? []).map(nodeCode);
  switch (spec.type) {
    case 'stack':
      return element('div', classAttr(stackClasses(read)), children);
    case 'row':
      return element('div', classAttr(rowClasses(read)), children);
    case 'grid':
      return element('div', classAttr(gridClasses(read)), children);
    case 'section': {
      const title = read.text('title');
      const description = read.text('description');
      const heading = title ? element('h2', classAttr(SECTION_TITLE), [], title) : '';
      const note = description ? element('p', classAttr(SECTION_DESCRIPTION), [], description) : '';
      const header = heading && note ? element('div', classAttr(SECTION_HEADER), [heading, note]) : heading || note;
      return element('section', classAttr(sectionClasses(read)), [...(header ? [header] : []), ...children]);
    }
    case 'card': {
      const action = node.slots.action ?? [];
      const title = read.text('title');
      const description = read.text('description');
      const header =
        title || description || action.length > 0
          ? element('CardHeader', [
              stringAttr('title', title),
              ...(description ? [stringAttr('description', description)] : []),
              ...(action.length > 0 ? [slotAttr('action', action)] : []),
            ])
          : '';
      const attrs = [read.attrs(['variant']), read.attrs(['padding'])].map((attr) => attr.trim()).filter(Boolean);
      return element('Card', [...attrs, ...classAttr(cardWidthClass(read))], [...(header ? [header] : []), ...children]);
    }
    case 'text': {
      const { tag, className } = textStyle(read);
      return element(tag, classAttr(className), [], read.text('text'));
    }
    case 'icon': {
      const name = read.text('name');
      return element(isIconName(name) ? name : 'Sparkles', classAttr(iconClasses(read)));
    }
  }
}

function composableCode(spec: ComposableSpec, node: ComposerNode): string {
  const read = readProps(spec, node);
  const scalar = spec.props.filter((prop) => prop.name !== CHILDREN).map((prop) => read.attrs([prop.name]).trim());
  const slots = spec.slots
    .filter((slot) => slot.name !== CHILDREN && (node.slots[slot.name]?.length ?? 0) > 0)
    .map((slot) => slotAttr(slot.name, node.slots[slot.name] ?? []));
  const children = (node.slots[CHILDREN] ?? []).map(nodeCode);
  const label = spec.props.some((prop) => prop.name === CHILDREN) ? read.text(CHILDREN) : '';
  return element(spec.exportName, [...scalar.filter(Boolean), ...slots], children, label);
}

export function nodeCode(node: ComposerNode): string {
  const spec = requireSpec(node.type);
  if (spec.kind === 'leaf') return spec.playground.code(readProps(spec, node));
  if (spec.kind === 'composable') return composableCode(spec, node);
  return primitiveCode(spec, node);
}

/** What the component returns: the only block on the page, or the page stack with all of them. */
function bodyCode(root: ComposerNode): string {
  const blocks = root.slots[CHILDREN] ?? [];
  if (blocks.length === 0) return 'null';
  return blocks.length === 1 && blocks[0] ? nodeCode(blocks[0]) : nodeCode(root);
}

/* ---------- imports and dependencies ---------- */

const kvantExports = new Set(Object.keys(kvant));

/** Kvant names and icon tags a snippet uses (the same scan the docs use for examples). */
function scan(code: string): { names: string[]; icons: string[] } {
  const words = new Set(code.match(/\b[A-Za-z_]\w*\b/g) ?? []);
  const tags = new Set([...code.matchAll(/<([A-Z]\w*)/g)].map((match) => match[1] ?? ''));
  return {
    names: [...words].filter((word) => kvantExports.has(word)).sort(),
    icons: [...tags].filter((tag) => tag && !kvantExports.has(tag)).sort(),
  };
}

/** Export name → the first ready component that ships it (its registry item and source file). */
const owners = new Map<string, ReadyComponentMeta>();
for (const meta of readyComponents) for (const name of meta.source.exports) if (!owners.has(name)) owners.set(name, meta);

export type ImportStyle = 'alias' | 'relative';

function importLines(body: string, style: ImportStyle): string[] {
  const { names, icons } = scan(body);
  const lines = icons.length > 0 ? [`import { ${icons.join(', ')} } from 'lucide-react';`] : [];
  if (names.length === 0) return lines;
  if (style === 'alias') return [...lines, `import { ${names.join(', ')} } from '@/kvant';`];
  // a block lives in `<kvant>/blocks/`: import the component files next to it, not the barrel that re-exports the block
  const byFile = new Map<string, string[]>();
  for (const name of names) {
    const file = owners.get(name)?.source.file;
    const from = file ? `../${file.replace(/\.tsx?$/, '')}` : '@/kvant';
    byFile.set(from, [...(byFile.get(from) ?? []), name]);
  }
  return [...lines, ...[...byFile].sort(([a], [b]) => a.localeCompare(b)).map(([from, list]) => `import { ${list.join(', ')} } from '${from}';`)];
}

export interface CodeOptions {
  /** Name of the exported function component. */
  name?: string;
  imports?: ImportStyle;
}

export function generateCode(root: ComposerNode, { name = 'Block', imports = 'alias' }: CodeOptions = {}): string {
  const body = bodyCode(root);
  const returned = body.includes('\n') ? `(\n${indent(indent(body))}\n  )` : body;
  const component = `export function ${name}() {\n  return ${returned};\n}\n`;
  const lines = importLines(body, imports);
  return lines.length > 0 ? `${lines.join('\n')}\n\n${component}` : component;
}

/** Registry items `kvant-ui add` needs for the page, in alphabetical order. */
export function usedComponents(root: ComposerNode): string[] {
  const ids = scan(bodyCode(root)).names.map((name) => owners.get(name)?.id).filter((id): id is string => id !== undefined);
  return [...new Set(ids)].sort();
}

export function installCommand(root: ComposerNode): string | null {
  const ids = usedComponents(root);
  return ids.length > 0 ? `npx kvant-ui add ${ids.join(' ')}` : null;
}

/* ---------- registry block ---------- */

/** Same rule as the CLI's item names: latin, digits and single hyphens. */
export const BLOCK_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const LATIN: Readonly<Record<string, string>> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** «Карточка сделки» → `kartochka-sdelki`. */
export function blockSlug(title: string): string {
  const latin = [...title.toLocaleLowerCase('ru')].map((char) => LATIN[char] ?? char).join('');
  return latin.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'block';
}

/** `kartochka-sdelki` → `KartochkaSdelki`. */
export function componentName(slug: string): string {
  const name = slug
    .split('-')
    .map((part) => (part ? part[0]?.toUpperCase() + part.slice(1) : ''))
    .join('');
  return /^[A-Z]/.test(name) ? name : `Block${name}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** `lucide-react@^1.63.0`: the range the registry components are built against. */
function packageSpec(name: string): string {
  const parsed: unknown = JSON.parse(registryPackage);
  const range = isRecord(parsed) && isRecord(parsed.dependencies) ? parsed.dependencies[name] : undefined;
  return typeof range === 'string' ? `${name}@${range}` : name;
}

export interface BlockInfo {
  /** Item name for `kvant-ui add`, see BLOCK_NAME. */
  name: string;
  title: string;
  description: string;
}

/** A registry item in the CLI format (docs/registry-schema.md) plus the Playground document to reopen it. */
export interface BlockItem {
  name: string;
  type: 'component';
  title: string;
  description: string;
  dependencies: string[];
  registryDependencies: string[];
  files: { target: string; content: string; barrel: boolean }[];
  css: string[];
  composer: ComposerFile;
}

export function blockItem(root: ComposerNode, info: BlockInfo): BlockItem {
  const content = generateCode(root, { name: componentName(info.name), imports: 'relative' });
  return {
    name: info.name,
    type: 'component',
    title: info.title,
    description: info.description,
    dependencies: scan(bodyCode(root)).icons.length > 0 ? [packageSpec('lucide-react')] : [],
    registryDependencies: usedComponents(root),
    files: [{ target: `blocks/${info.name}.tsx`, content, barrel: true }],
    css: [],
    composer: toFile(root),
  };
}
