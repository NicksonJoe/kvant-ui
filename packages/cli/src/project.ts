// Edits of the user's project files. Each edit is additive and idempotent: running a command twice changes nothing.
import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';

export async function readText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined;
    throw error;
  }
}

export async function exists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false,
  );
}

export async function firstExisting(cwd: string, candidates: readonly string[]): Promise<string | undefined> {
  for (const candidate of candidates) if (await exists(join(cwd, candidate))) return candidate;
  return undefined;
}

export const CSS_CANDIDATES = ['src/index.css', 'src/app.css', 'src/styles.css', 'src/styles/globals.css', 'src/app/globals.css', 'app/globals.css', 'styles/globals.css'];
export const VITE_CONFIGS = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs'];

/** `./x` style import path from one file to another, with forward slashes. */
export function importPath(fromFile: string, toFile: string): string {
  const path = relative(dirname(fromFile), toFile).split(sep).join('/');
  return path.startsWith('.') ? path : `./${path}`;
}

const escape = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Adds missing `@import "…";` lines after the leading imports and comments. Returns what was added. */
export async function addCssImports(cssFile: string, specs: readonly string[]): Promise<string[]> {
  const css = (await readText(cssFile)) ?? '';
  const missing = specs.filter((spec, index) => specs.indexOf(spec) === index && !new RegExp(`@import\\s+(?:url\\()?["']${escape(spec)}["']`).test(css));
  if (missing.length === 0) return [];
  const head = /^(?:\s*(?:@charset[^;]*;|@import[^;]*;|\/\*[\s\S]*?\*\/))*/.exec(css)?.[0] ?? '';
  const rest = css.slice(head.length).replace(/^\s*\n/, '');
  const lines = missing.map((spec) => `@import "${spec}";`).join('\n');
  const top = head.trim() ? `${head.trimEnd()}\n${lines}` : lines;
  await writeFile(cssFile, rest ? `${top}\n\n${rest}` : `${top}\n`);
  return missing;
}

/** Appends `export * from './…';` for modules the index does not export yet; the index stays the user's file. */
export async function updateBarrel(dir: string, targets: readonly string[]): Promise<void> {
  const file = join(dir, 'index.ts');
  const current = (await readText(file)) ?? '// Kvant: one entry point for the installed components (import { Button } from "@/kvant").\n';
  const lines = targets.map((target) => `export * from './${target.replace(/\.tsx?$/, '')}';`).filter((line) => !current.includes(line));
  if (lines.length === 0) return;
  await writeFile(file, `${current}${current.endsWith('\n') ? '' : '\n'}${lines.join('\n')}\n`);
}

/** Sets attributes on the <html> tag of index.html. Returns false when there is no index.html. */
export async function setHtmlAttributes(cwd: string, attributes: Record<string, string>): Promise<boolean> {
  const file = join(cwd, 'index.html');
  const html = await readText(file);
  const tag = html && /<html\b[^>]*>/i.exec(html);
  if (!html || !tag) return false;
  let next = tag[0];
  for (const [name, value] of Object.entries(attributes)) {
    const attribute = new RegExp(`\\s${escape(name)}=(["'])[^"']*\\1`);
    next = attribute.test(next) ? next.replace(attribute, ` ${name}="${value}"`) : next.replace(/\s*>$/, ` ${name}="${value}">`);
  }
  if (next !== tag[0]) await writeFile(file, html.replace(tag[0], next));
  return true;
}

/** Plugs @tailwindcss/vite into a Vite config. Returns false when the config is not the usual `plugins: [...]` shape. */
export async function addTailwindVitePlugin(configFile: string): Promise<boolean> {
  const source = (await readText(configFile)) ?? '';
  if (source.includes('@tailwindcss/vite')) return true;
  if (!/plugins:\s*\[/.test(source)) return false;
  const semi = /^import .*;\s*$/m.test(source) ? ';' : '';
  const patched = source.replace(/plugins:\s*\[/, (match) => `${match}tailwindcss(), `);
  await writeFile(configFile, `import tailwindcss from '@tailwindcss/vite'${semi}\n${patched}`);
  return true;
}
