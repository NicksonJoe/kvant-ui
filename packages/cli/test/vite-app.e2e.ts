// A fresh Vite + React + TS app (the create-vite template) → kvant-ui init → kvant-ui add button dialog → tsc -b && vite build.
// Installs real packages: pnpm reuses its store, so it works offline once the workspace is installed.
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, expect, it } from 'vitest';

const CLI = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const REGISTRY = fileURLToPath(new URL('../../../apps/docs/public/r/', import.meta.url));

// The workspace's own pnpm settings (npm_config_*, PNPM_*) must not leak into the temp app.
const env: NodeJS.ProcessEnv = {
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(npm_|pnpm_)/i.test(key))),
  npm_config_prefer_offline: 'true',
};

let app = '';

function run(command: string, args: string[]): string {
  const result = spawnSync(command, args, { cwd: app, env, encoding: 'utf8' });
  const output = `${result.stdout}\n${result.stderr}`;
  expect(result.status, `${command} ${args.join(' ')}\n${output}`).toBe(0);
  return output;
}

const TEMPLATE: Record<string, string> = {
  'package.json': JSON.stringify(
    {
      name: 'kvant-e2e-app',
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: { build: 'tsc -b && vite build' },
      dependencies: { react: '^19.3.1', 'react-dom': '^19.3.1' },
      devDependencies: {
        '@types/node': '^26.6.5',
        '@types/react': '^19.3.0',
        '@types/react-dom': '^19.3.0',
        '@vitejs/plugin-react': '^6.1.2',
        typescript: '~6.0.3',
        vite: '^8.3.5',
      },
    },
    null,
    2,
  ),
  'index.html':
    '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>kvant-e2e-app</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n',
  'vite.config.ts': "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\n// https://vite.dev/config/\nexport default defineConfig({\n  plugins: [react()],\n})\n",
  'tsconfig.json': '{\n  "files": [],\n  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]\n}\n',
  'tsconfig.app.json': `{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
`,
  'tsconfig.node.json': `{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
`,
  'src/main.tsx':
    "import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport './index.css'\nimport App from './App.tsx'\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>,\n)\n",
  'src/App.tsx': "function App() {\n  return <h1>Vite + React</h1>\n}\n\nexport default App\n",
  'src/index.css': ':root {\n  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;\n  line-height: 1.5;\n}\n',
};

const APP_WITH_KVANT = `import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from './kvant'

function App() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background">
      <Dialog>
        <DialogTrigger render={<Button />}>Новая задача</DialogTrigger>
        <DialogContent>
          <DialogTitle>Новая задача</DialogTitle>
          <DialogDescription>Задача появится в карточке сделки.</DialogDescription>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>Отмена</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default App
`;

afterAll(async () => {
  if (app) await rm(app, { recursive: true, force: true });
});

it('kvant-ui init + kvant-ui add button dialog: the app typechecks and builds', async () => {
  app = await mkdtemp(join(tmpdir(), 'kvant-e2e-'));
  await mkdir(join(app, 'src'));
  for (const [file, content] of Object.entries(TEMPLATE)) await writeFile(join(app, file), content);
  run('pnpm', ['install']);

  const initOutput = run(process.execPath, [CLI, 'init', '--registry', REGISTRY, '--theme', 'jade']);
  expect(initOutput).toContain('Записан kvant.json');
  run(process.execPath, [CLI, 'add', 'button', 'dialog']);

  const pkg = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'));
  expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })).toEqual(
    expect.arrayContaining(['tailwindcss', '@tailwindcss/vite', '@base-ui/react', 'lucide-react', '@fontsource-variable/inter']),
  );
  expect(await readdir(join(app, 'src/kvant/components'))).toEqual(expect.arrayContaining(['button.tsx', 'dialog.tsx', 'spinner.tsx']));

  await writeFile(join(app, 'src/App.tsx'), APP_WITH_KVANT);
  run('pnpm', ['run', 'build']);

  const assets = join(app, 'dist/assets');
  const cssFile = (await readdir(assets)).find((file) => file.endsWith('.css'));
  const css = await readFile(join(assets, cssFile ?? ''), 'utf8');
  expect(css).toContain('--color-accent:'); // tokens
  expect(css).toContain('.bg-accent'); // utilities generated from the copied Button
  expect(css).toContain('.kv-dialog'); // motion recipes
});
