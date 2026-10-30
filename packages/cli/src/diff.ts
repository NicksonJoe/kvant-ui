import { join, resolve } from 'node:path';
import { plural, resolveItems, type Log } from './add.ts';
import type { KvantConfig } from './config.ts';
import { exists, readText } from './project.ts';
import { fetchIndex, type RegistrySource } from './source.ts';

type Edit = { kind: ' ' | '-' | '+'; line: string };

/** Line diff by longest common subsequence: plenty for component files of a few hundred lines. */
function edits(before: string[], after: string[]): Edit[] {
  const width = after.length + 1;
  const common = new Uint32Array((before.length + 1) * width);
  const at = (i: number, j: number): number => common[i * width + j] ?? 0;
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      common[i * width + j] = before[i] === after[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }
  const out: Edit[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      out.push({ kind: ' ', line: before[i] ?? '' });
      i++;
      j++;
    } else if (i < before.length && (j === after.length || at(i + 1, j) >= at(i, j + 1))) {
      out.push({ kind: '-', line: before[i] ?? '' });
      i++;
    } else {
      out.push({ kind: '+', line: after[j] ?? '' });
      j++;
    }
  }
  return out;
}

const CONTEXT = 3;

/** Unified diff with 3 lines of context; empty when the texts are equal. */
export function unifiedDiff(before: string, after: string, fromLabel: string, toLabel: string): string {
  if (before === after) return '';
  const lines = (text: string): string[] => text.replace(/\n$/, '').split('\n');
  const list = edits(lines(before), lines(after));
  // Changes closer than two contexts apart share a hunk.
  const groups: [number, number][] = [];
  list.forEach((edit, position) => {
    if (edit.kind === ' ') return;
    const last = groups.at(-1);
    if (last && position - last[1] <= 2 * CONTEXT) last[1] = position;
    else groups.push([position, position]);
  });
  const out = [`--- ${fromLabel}`, `+++ ${toLabel}`];
  for (const [first, last] of groups) {
    const start = Math.max(first - CONTEXT, 0);
    const hunk = list.slice(start, Math.min(last + CONTEXT + 1, list.length));
    const prefix = list.slice(0, start);
    const fromStart = prefix.filter((edit) => edit.kind !== '+').length + 1;
    const toStart = prefix.filter((edit) => edit.kind !== '-').length + 1;
    const fromCount = hunk.filter((edit) => edit.kind !== '+').length;
    const toCount = hunk.filter((edit) => edit.kind !== '-').length;
    out.push(`@@ -${fromStart},${fromCount} +${toStart},${toCount} @@`, ...hunk.map((edit) => `${edit.kind}${edit.line}`));
  }
  return out.join('\n');
}

/**
 * Prints how installed files differ from the registry (- local, + registry).
 * Without names: every registry item whose files are in the project. Returns the number of differing files.
 */
export async function diffItems(names: readonly string[], options: { cwd: string; config: KvantConfig; source: RegistrySource; log: Log }): Promise<number> {
  const { cwd, config, source, log } = options;
  const dir = resolve(cwd, config.dir);
  const selected = [...names];
  if (selected.length === 0) {
    const index = await fetchIndex(source);
    for (const item of index.items) {
      if (item.files.length > 0 && (await Promise.all(item.files.map((target) => exists(join(dir, target))))).some(Boolean)) selected.push(item.name);
    }
  }
  const checked = new Set<string>();
  let changed = 0;
  for (const item of await resolveItems(source, selected)) {
    for (const { target, content } of item.files) {
      if (checked.has(target)) continue;
      checked.add(target);
      const local = await readText(join(dir, target));
      if (local === undefined) continue;
      const diff = unifiedDiff(local, content, `${config.dir}/${target}`, `${source.label}/${item.name}.json`);
      if (!diff) continue;
      changed++;
      log(diff);
    }
  }
  log(changed === 0 ? 'Все установленные файлы совпадают с реестром.' : `Отличаются от реестра: ${plural(changed, ['файл', 'файла', 'файлов'])}.`);
  return changed;
}
