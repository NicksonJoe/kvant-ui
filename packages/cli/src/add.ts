import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { KvantConfig } from './config.ts';
import { missingPackages, type Installer } from './install.ts';
import { addCssImports, importPath, readText, updateBarrel } from './project.ts';
import type { RegistryFile, RegistryItem } from './schema.ts';
import { fetchItem, isItemFile, readItemFile, type RegistrySource } from './source.ts';

export type Log = (line: string) => void;

/** Russian plural: plural(5, ['файл', 'файла', 'файлов']) → «5 файлов». */
export function plural(count: number, [one, few, many]: readonly [string, string, string]): string {
  const tens = count % 100;
  const units = count % 10;
  const word = tens > 10 && tens < 20 ? many : units === 1 ? one : units > 1 && units < 5 ? few : many;
  return `${count} ${word}`;
}

/** Requested items and everything they depend on, dependencies first. A `*.json` argument is read from that file. */
export async function resolveItems(source: RegistrySource, names: readonly string[], cwd = process.cwd()): Promise<RegistryItem[]> {
  const items = new Map<string, RegistryItem>();
  const visiting = new Set<string>();
  const visit = async (name: string): Promise<void> => {
    if (items.has(name) || visiting.has(name)) return;
    visiting.add(name);
    const item = isItemFile(name) ? await readItemFile(name, cwd) : await fetchItem(source, name);
    for (const dependency of item.registryDependencies) await visit(dependency);
    items.set(item.name, item);
  };
  for (const name of names) await visit(name);
  return [...items.values()];
}

export interface AddOptions {
  cwd: string;
  config: KvantConfig;
  source: RegistrySource;
  /** Replace files that differ from the registry (the user's edits are lost). */
  overwrite: boolean;
  install: Installer;
  log: Log;
}

export interface AddReport {
  written: string[];
  unchanged: string[];
  /** Differ from the registry and were kept because --overwrite was not given. */
  kept: string[];
  packages: string[];
  imports: string[];
}

export async function addItems(names: readonly string[], options: AddOptions): Promise<AddReport> {
  const { cwd, config, source, overwrite, install, log } = options;
  const items = await resolveItems(source, names, cwd);
  const dir = resolve(cwd, config.dir);
  const report: AddReport = { written: [], unchanged: [], kept: [], packages: [], imports: [] };

  // Items sharing a source file ship identical copies of it: one write per target.
  const files = new Map(items.flatMap((item) => item.files).map((file): [string, RegistryFile] => [file.target, file]));
  for (const { target, content } of files.values()) {
    const path = join(dir, target);
    const current = await readText(path);
    if (current === content) report.unchanged.push(target);
    else if (current !== undefined && !overwrite) report.kept.push(target);
    else {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content);
      report.written.push(target);
    }
  }
  await updateBarrel(
    dir,
    [...files.values()].filter((file) => file.barrel).map((file) => file.target),
  );

  const cssFile = resolve(cwd, config.css);
  const specs = items.flatMap((item) => item.css).map((spec) => (spec.startsWith('./') ? importPath(cssFile, join(dir, spec)) : spec));
  report.imports = await addCssImports(cssFile, specs);

  report.packages = await missingPackages(cwd, items.flatMap((item) => item.dependencies));
  if (report.packages.length > 0) {
    log(`Ставлю ${plural(report.packages.length, ['пакет', 'пакета', 'пакетов'])}: ${report.packages.join(', ')}`);
    await install(report.packages, { dev: false });
  }

  log(`Готово: ${items.map((item) => item.name).join(', ')}.`);
  if (report.written.length > 0) log(`  записано: ${report.written.join(', ')}`);
  if (report.imports.length > 0) log(`  в ${config.css} добавлено: ${report.imports.map((spec) => `@import "${spec}"`).join(', ')}`);
  if (report.kept.length > 0) {
    log(`  не тронуты — отличаются от реестра: ${report.kept.join(', ')}`);
    log('  Посмотреть разницу: kvant-ui diff. Заменить версией из реестра: kvant-ui add … --overwrite');
  }
  return report;
}
