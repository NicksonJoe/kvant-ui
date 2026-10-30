import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addItems, plural } from '../src/add.ts';
import { readConfig } from '../src/config.ts';
import { diffItems, unifiedDiff } from '../src/diff.ts';
import { init } from '../src/init.ts';
import type { Installer } from '../src/install.ts';
import { listItems } from '../src/list.ts';
import { isSafeTarget, parseItem } from '../src/schema.ts';
import { fetchItem, githubRawUrl, registrySource } from '../src/source.ts';

const REGISTRY = fileURLToPath(new URL('../../../apps/docs/public/r/', import.meta.url));
const CLI = fileURLToPath(new URL('../src/index.ts', import.meta.url));

let project: string;
let output: string[];
let installs: { packages: string[]; dev: boolean }[];
const log = (line: string): void => void output.push(line);
const install: Installer = async (packages, { dev }) => void installs.push({ packages, dev });
const read = (path: string): Promise<string> => readFile(join(project, path), 'utf8');

beforeEach(async () => {
  project = await mkdtemp(join(tmpdir(), 'kvant-test-'));
  output = [];
  installs = [];
  await mkdir(join(project, 'src'));
  await writeFile(join(project, 'package.json'), JSON.stringify({ name: 'app', dependencies: { react: '^19.3.1', 'lucide-react': '^1.0.0' } }));
  await writeFile(join(project, 'src/index.css'), ':root {\n  font-family: system-ui;\n}\n');
  await writeFile(join(project, 'index.html'), '<!doctype html>\n<html lang="ru">\n  <body></body>\n</html>\n');
  await writeFile(join(project, 'vite.config.ts'), "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})\n");
});

afterEach(async () => {
  await rm(project, { recursive: true, force: true });
  vi.unstubAllGlobals();
});

const initProject = (options: { theme?: string; font?: string } = {}) =>
  init({ cwd: project, registry: REGISTRY, overwrite: false, install, log, ...options });

async function addToProject(names: string[], overwrite = false) {
  const config = await readConfig(project);
  return addItems(names, { cwd: project, config, source: registrySource(config.registry, project), overwrite, install, log });
}

describe('kvant init', () => {
  it('writes kvant.json, styles, Tailwind for Vite and the theme', async () => {
    await initProject({ theme: 'iris', font: 'geist' });

    expect(JSON.parse(await read('kvant.json'))).toEqual({
      registry: REGISTRY,
      theme: 'iris',
      font: 'geist',
      shape: 'capsule',
      css: 'src/index.css',
      dir: 'src/kvant',
      aliases: { kvant: '@/kvant' },
    });
    expect(await read('src/kvant/styles/tokens.css')).toContain("[data-accent='iris']");
    expect(await read('src/kvant/lib/cn.ts')).toContain('export function cn');
    expect(await read('src/index.css')).toBe(
      [
        '@import "tailwindcss";',
        '@import "./kvant/styles/tokens.css";',
        '@import "./kvant/styles/tailwind.css";',
        '@import "./kvant/styles/components.css";',
        '@import "@fontsource-variable/geist";',
        '@import "@fontsource-variable/jetbrains-mono";',
        '',
        ':root {\n  font-family: system-ui;\n}\n',
      ].join('\n'),
    );
    expect(await read('index.html')).toContain('<html lang="ru" data-accent="iris" data-font="geist" data-shape="capsule">');
    expect(await read('vite.config.ts')).toMatch(/^import tailwindcss from '@tailwindcss\/vite'\n[\s\S]*plugins: \[tailwindcss\(\), react\(\)\]/);
    expect(installs).toEqual([
      { packages: ['tailwindcss@^4', '@tailwindcss/vite@^4'], dev: true },
      { packages: ['@fontsource-variable/geist@^5.3.0', '@fontsource-variable/jetbrains-mono@^5.3.0'], dev: false },
    ]);
  });

  it('is idempotent and rejects unknown themes', async () => {
    await initProject();
    const css = await read('src/index.css');
    await initProject();
    expect(await read('src/index.css')).toBe(css);
    await expect(initProject({ theme: 'neon' })).rejects.toThrow('--theme neon: допустимо graphite, cobalt');
  });
});

describe('kvant add', () => {
  beforeEach(() => initProject());

  it('copies items with their registry dependencies, exports them and installs missing packages only', async () => {
    installs = [];
    const report = await addToProject(['button', 'dialog']);

    expect(report.written).toEqual(expect.arrayContaining(['components/button.tsx', 'components/dialog.tsx', 'components/spinner.tsx']));
    expect(await read('src/kvant/components/dialog.tsx')).toContain("from './button'");
    const barrel = await read('src/kvant/index.ts');
    for (const module of ['./lib/cn', './components/spinner', './components/button', './components/dialog']) expect(barrel).toContain(`export * from '${module}';`);
    // lucide-react is already in package.json: never reinstalled or bumped.
    expect(installs).toHaveLength(1);
    expect(installs[0]?.packages).toContain('@base-ui/react@^1.9.0');
    expect(installs[0]?.packages.join()).not.toContain('lucide-react');
  });

  it('never overwrites a modified file without --overwrite', async () => {
    await addToProject(['button']);
    const file = join(project, 'src/kvant/components/button.tsx');
    await writeFile(file, '// my button\n');

    const kept = await addToProject(['button']);
    expect(kept.kept).toEqual(['components/button.tsx']);
    expect(await readFile(file, 'utf8')).toBe('// my button\n');
    expect(output.join('\n')).toContain('не тронуты — отличаются от реестра: components/button.tsx');

    const replaced = await addToProject(['button'], true);
    expect(replaced.written).toEqual(['components/button.tsx']);
    expect(await readFile(file, 'utf8')).toContain('export function Button');
  });

  it('fails clearly on unknown or unsafe names', async () => {
    await expect(addToProject(['nope'])).rejects.toThrow('«nope» нет в реестре');
    await expect(addToProject(['../secrets'])).rejects.toThrow('Недопустимое имя');
  });

  it('adds a block saved by Playground from its JSON file, taking its dependencies from the registry', async () => {
    const block = {
      name: 'deal-card',
      type: 'component',
      title: 'Карточка сделки',
      description: 'Блок из Playground',
      dependencies: [],
      registryDependencies: ['button'],
      files: [
        {
          target: 'blocks/deal-card.tsx',
          content: "import { Button } from '../components/button';\n\nexport function DealCard() {\n  return <Button>Открыть</Button>;\n}\n",
          barrel: true,
        },
      ],
      css: [],
      composer: { format: 'kvant-composer', version: 1, root: { type: 'stack' } },
    };
    await writeFile(join(project, 'deal-card.json'), JSON.stringify(block));

    const report = await addToProject(['./deal-card.json']);
    expect(report.written).toEqual(expect.arrayContaining(['blocks/deal-card.tsx', 'components/button.tsx', 'components/spinner.tsx']));
    expect(await read('src/kvant/index.ts')).toContain("export * from './blocks/deal-card';");
    expect(output.join('\n')).toContain('Готово: cn, spinner, button, deal-card.');
  });

  it('checks a block file like any registry item', async () => {
    await writeFile(join(project, 'broken.json'), JSON.stringify({ name: 'broken', type: 'component', title: '', description: '', files: [{ target: '../escape.ts', content: '' }] }));
    await expect(addToProject(['./broken.json'])).rejects.toThrow('недопустимый путь файла');
    await expect(addToProject(['./missing.json'])).rejects.toThrow('Файл ./missing.json не найден');
  });
});

describe('kvant diff and list', () => {
  beforeEach(async () => {
    await initProject();
    await addToProject(['spinner']);
  });

  it('shows local edits against the registry', async () => {
    const config = await readConfig(project);
    const source = registrySource(config.registry, project);
    expect(await diffItems([], { cwd: project, config, source, log })).toBe(0);

    const file = join(project, 'src/kvant/components/spinner.tsx');
    await writeFile(file, (await readFile(file, 'utf8')).replace('export function Spinner', 'export function MySpinner'));
    output = [];
    expect(await diffItems([], { cwd: project, config, source, log })).toBe(1);
    const diff = output.join('\n');
    expect(diff).toContain('--- src/kvant/components/spinner.tsx');
    expect(diff).toMatch(/^-export function MySpinner/m);
    expect(diff).toMatch(/^\+export function Spinner/m);
    expect(diff).toContain('Отличаются от реестра: 1\u00a0файл.');
  });

  it('marks installed items', async () => {
    const config = await readConfig(project);
    await listItems({ cwd: project, config, source: registrySource(REGISTRY, project), log });
    expect(output).toContainEqual(expect.stringMatching(/^ {2}✓ spinner +Спиннер/));
    expect(output).toContainEqual(expect.stringMatching(/^ {4}dialog +/));
  });
});

describe('registry sources', () => {
  it('maps github: specs to raw URLs and sends GITHUB_TOKEN', async () => {
    expect(githubRawUrl('github:norda/kvant')).toBe('https://raw.githubusercontent.com/norda/kvant/main/apps/docs/public/r');
    expect(githubRawUrl('github:norda/kvant/public/r#v1.2')).toBe('https://raw.githubusercontent.com/norda/kvant/v1.2/public/r');
    expect(() => githubRawUrl('github:norda')).toThrow('github:владелец/репозиторий');

    const item = await readFile(join(REGISTRY, 'cn.json'), 'utf8');
    const fetchMock = vi.fn<(url: URL, init: RequestInit) => Promise<Response>>(async () => new Response(item));
    vi.stubGlobal('fetch', fetchMock);
    await fetchItem(registrySource('github:norda/kvant', project, { GITHUB_TOKEN: 'secret' }), 'cn');
    const [url, request] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe('https://raw.githubusercontent.com/norda/kvant/main/apps/docs/public/r/cn.json');
    expect(request?.headers).toEqual({ Authorization: 'token secret' });
  });

  it('reads a registry over HTTP', async () => {
    const server: Server = createServer(async (request, response) => {
      try {
        response.end(await readFile(join(REGISTRY, request.url ?? '')));
      } catch {
        response.statusCode = 404;
        response.end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    try {
      const source = registrySource(`http://127.0.0.1:${port}/`, project);
      expect((await fetchItem(source, 'spinner')).files[0]?.target).toBe('components/spinner.tsx');
      await expect(fetchItem(source, 'missing')).rejects.toThrow('«missing» нет в реестре');
    } finally {
      server.close();
    }
  });
});

describe('registry schema', () => {
  it('keeps targets inside the Kvant folder', () => {
    expect(isSafeTarget('components/button.tsx')).toBe(true);
    for (const target of ['../x.ts', 'a/../../x.ts', '/etc/passwd', 'C:\\x.ts', 'a\\b.ts', './x.ts', 'a//b.ts', '']) expect(isSafeTarget(target), target).toBe(false);
  });

  it('rejects items that would escape the folder or smuggle install flags', () => {
    const item = { name: 'x', type: 'lib', title: 'x', description: '', dependencies: [], registryDependencies: [], css: [], files: [] };
    expect(() => parseItem({ ...item, files: [{ target: '../../.bashrc', content: '' }] }, 'x.json')).toThrow('недопустимый путь');
    expect(() => parseItem({ ...item, dependencies: ['--global'] }, 'x.json')).toThrow('недопустимое значение');
    expect(() => parseItem({ ...item, css: ['x"; @import "evil'] }, 'x.json')).toThrow('недопустимое значение');
    expect(parseItem(item, 'x.json').name).toBe('x');
  });
});

describe('helpers', () => {
  it('writes unified diffs', () => {
    expect(unifiedDiff('a\nb\nc', 'a\nb\nc', 'x', 'y')).toBe('');
    expect(unifiedDiff('a\nb\nc\n', 'a\nB\nc\n', 'x', 'y')).toBe('--- x\n+++ y\n@@ -1,3 +1,3 @@\n a\n-b\n+B\n c');
  });

  it('declines Russian nouns', () => {
    expect([1, 2, 5, 11, 21, 104].map((count) => plural(count, ['файл', 'файла', 'файлов']))).toEqual(
      ['1 файл', '2 файла', '5 файлов', '11 файлов', '21 файл', '104 файла'].map((text) => text.replace(' ', '\u00a0')),
    );
  });

  it('runs as a command', () => {
    const help = spawnSync(process.execPath, [CLI, '--help'], { encoding: 'utf8' });
    expect(help.status).toBe(0);
    expect(help.stdout).toContain('kvant add <имя…>');
    const unknown = spawnSync(process.execPath, [CLI, 'remove'], { encoding: 'utf8', cwd: project });
    expect(unknown.status).toBe(1);
    expect(unknown.stderr).toContain('Нет команды «remove»');
  });
});
