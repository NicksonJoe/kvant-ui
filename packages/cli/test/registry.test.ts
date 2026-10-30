import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { OUT, registryFiles } from '../scripts/registry.ts';
import { resolveItems } from '../src/add.ts';
import { parseIndex, parseItem } from '../src/schema.ts';
import { registrySource } from '../src/source.ts';

const files = registryFiles();
const source = registrySource(fileURLToPath(OUT), process.cwd());

describe('static registry (apps/docs/public/r)', () => {
  it('is up to date with packages/registry (pnpm generate)', () => {
    expect(readdirSync(OUT).sort()).toEqual([...files.keys()].sort());
    for (const [name, text] of files) expect(readFileSync(new URL(name, OUT), 'utf8'), name).toBe(text);
  });

  it('passes the CLI schema', () => {
    const index = parseIndex(JSON.parse(files.get('index.json') ?? ''), 'index.json');
    expect(index.theme.defaults).toEqual({ accent: 'cobalt', font: 'inter', shape: 'capsule' });
    for (const item of index.items) expect(parseItem(JSON.parse(files.get(`${item.name}.json`) ?? ''), item.name).name).toBe(item.name);
  });

  it('ships every file an item imports, through its registry dependencies', async () => {
    const index = parseIndex(JSON.parse(files.get('index.json') ?? ''), 'index.json');
    for (const { name } of index.items) {
      const installed = (await resolveItems(source, [name])).flatMap((item) => item.files);
      const targets = new Set(installed.map((file) => file.target));
      for (const file of installed) {
        for (const [, specifier] of file.content.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
          const base = new URL(specifier ?? '', `file:///${file.target}`).pathname.slice(1);
          expect([`${base}.tsx`, `${base}.ts`].some((target) => targets.has(target)), `${name}: ${file.target} → ${specifier}`).toBe(true);
        }
      }
    }
  });

  it('describes button as the docs expect', () => {
    const button = parseItem(JSON.parse(files.get('button.json') ?? ''), 'button.json');
    expect(button.registryDependencies).toEqual(expect.arrayContaining(['cn', 'spinner']));
    expect(button.dependencies).toEqual(expect.arrayContaining(['@base-ui/react@^1.9.0']));
    expect(button.files[0]).toEqual(expect.objectContaining({ target: 'components/button.tsx', barrel: true }));
  });
});
