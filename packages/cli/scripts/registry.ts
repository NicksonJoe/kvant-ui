// Builds the static registry served at ui.norda.cloud/r from packages/registry. Format: docs/registry-schema.md.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { components, isReady } from '../../registry/meta/index.ts';
import { DEFAULT_THEME, FONTS, SHAPES, ACCENTS, type Font } from '../../registry/theme.ts';
import type { ItemType, RegistryFile, RegistryIndex, RegistryItem } from '../src/schema.ts';

const REGISTRY = new URL('../../registry/', import.meta.url);
export const OUT = new URL('../../../apps/docs/public/r/', import.meta.url);

/** React is the app's own; Kvant never installs it. */
const PEERS = new Set(['react', 'react-dom']);

interface Draft {
  name: string;
  type: ItemType;
  title: string;
  description: string;
  files: string[];
  dependencies?: string[];
  css?: string[];
}

const FONT_ITEMS: Record<Font, { title: string; description: string; packages: string[]; css: string[] }> = {
  inter: {
    title: 'Шрифт Inter',
    description: 'Inter с оптическим размером и JetBrains Mono для кода и цифр.',
    packages: ['@fontsource-variable/inter', '@fontsource-variable/jetbrains-mono'],
    css: ['@fontsource-variable/inter/opsz.css', '@fontsource-variable/jetbrains-mono'],
  },
  geist: {
    title: 'Шрифт Geist',
    description: 'Geist и JetBrains Mono для кода и цифр.',
    packages: ['@fontsource-variable/geist', '@fontsource-variable/jetbrains-mono'],
    css: ['@fontsource-variable/geist', '@fontsource-variable/jetbrains-mono'],
  },
};

/** Every file in lib/ is an item; these get a human description, new helpers a generic one. */
const LIB_TEXT: Record<string, { title: string; description: string }> = {
  cn: { title: 'cn', description: 'Склеивает классы; className — для раскладки, не для переопределения рецепта.' },
  recipes: { title: 'Рецепты списков', description: 'Общие классы всплывающих списков: меню, выбор, комбобокс.' },
};

const readJson = (url: URL): { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } =>
  JSON.parse(readFileSync(url, 'utf8'));

function libDraft(file: string): Draft {
  const name = file.replace(/\.tsx?$/, '');
  const camel = name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
  const text = LIB_TEXT[name] ?? {
    title: camel,
    description: name.startsWith('use-') ? `Хук ${camel}, общий для компонентов Kvant.` : 'Общий код компонентов Kvant.',
  };
  return { name, type: 'lib', ...text, files: [`lib/${file}`] };
}

function drafts(): Draft[] {
  const libs = readdirSync(new URL('lib/', REGISTRY))
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
    .sort((a, b) => Number(b === 'cn.ts') - Number(a === 'cn.ts') || a.localeCompare(b, 'en'));
  return [
    {
      name: 'styles',
      type: 'style',
      title: 'Стили Kvant',
      description: 'Токены (8\u00a0тем × светлая и тёмная), мост Tailwind v4 и CSS-рецепты движения.',
      files: ['styles/tokens.css', 'styles/tailwind.css', 'styles/components.css'],
      css: ['tailwindcss', './styles/tokens.css', './styles/tailwind.css', './styles/components.css'],
    },
    ...libs.map(libDraft),
    {
      name: 'theme',
      type: 'lib',
      title: 'Тема',
      description: 'useTheme: акцент, режим, шрифт, форма и плотность на <html> с запоминанием выбора.',
      files: ['theme.ts'],
    },
    ...FONTS.map((font) => {
      const { packages, ...rest } = FONT_ITEMS[font];
      return { name: `font-${font}`, type: 'font' as const, files: [], dependencies: packages, ...rest };
    }),
    ...components.filter(isReady).map((meta) => ({
      name: meta.id,
      type: 'component' as const,
      title: meta.title,
      description: meta.description,
      files: [meta.source.file],
    })),
  ];
}

/** Module specifiers of `import … from` / `export … from` / side-effect imports. */
function specifiers(source: string): string[] {
  return [...source.matchAll(/(?:^|\s)(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]|(?:^|\s)import\s*['"]([^'"]+)['"]/gm)].map(
    (match) => match[1] ?? match[2] ?? '',
  );
}

/** Registry file an import points to: `./spinner` from components/button.tsx → components/spinner.tsx. */
function registryFile(from: string, specifier: string): string {
  const base = posix.join(posix.dirname(from), specifier);
  const file = [base, `${base}.tsx`, `${base}.ts`, `${base}/index.ts`].find((candidate) => /\.[cm]?[jt]sx?$|\.css$/.test(candidate) && existsSync(new URL(candidate, REGISTRY)));
  if (!file) throw new Error(`${from}: cannot resolve ${specifier}`);
  return file;
}

/** `@base-ui/react/button` → `@base-ui/react`. */
const packageOf = (specifier: string): string => specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/');

export function buildRegistry(): { index: RegistryIndex; items: RegistryItem[] } {
  const list = drafts();
  const duplicate = list.find((draft, position) => list.findIndex((other) => other.name === draft.name) !== position);
  if (duplicate) throw new Error(`Two registry items are called "${duplicate.name}": rename the lib file or the component id`);
  const registryPkg = readJson(new URL('package.json', REGISTRY));
  const docsPkg = readJson(new URL('../../../apps/docs/package.json', import.meta.url));
  const versions: Record<string, string> = { ...docsPkg.dependencies, ...registryPkg.dependencies };
  const spec = (name: string): string => {
    const range = versions[name];
    if (!range) throw new Error(`No version for ${name}: add it to packages/registry/package.json`);
    return `${name}@${range}`;
  };

  // The item that owns a file: the one named like the file, else the first that ships it.
  const owners = new Map<string, string>();
  for (const draft of list) {
    for (const file of draft.files) {
      if (!owners.has(file) || posix.basename(file).replace(/\.\w+$/, '') === draft.name) owners.set(file, draft.name);
    }
  }
  const barrel = new Set(specifiers(readFileSync(new URL('index.ts', REGISTRY), 'utf8')).map((specifier) => registryFile('index.ts', specifier)));

  const items = list.map((draft): RegistryItem => {
    const packages = new Set(draft.dependencies);
    const needs = new Set<string>();
    const targets = [...draft.files];
    const files: RegistryFile[] = [];
    // `targets` grows while walking: a file no item owns (a part without its own docs page yet) travels with its importer.
    for (let position = 0; position < targets.length; position++) {
      const target = targets[position] ?? '';
      const content = readFileSync(new URL(target, REGISTRY), 'utf8');
      for (const specifier of target.endsWith('.css') ? [] : specifiers(content)) {
        if (!specifier.startsWith('.')) {
          if (!PEERS.has(packageOf(specifier))) packages.add(packageOf(specifier));
          continue;
        }
        const file = registryFile(target, specifier);
        const owner = owners.get(file);
        if (targets.includes(file)) continue;
        if (owner) needs.add(owner);
        else targets.push(file);
      }
      files.push({ target, content, ...(barrel.has(target) ? { barrel: true } : {}) });
    }
    return {
      name: draft.name,
      type: draft.type,
      title: draft.title,
      description: draft.description,
      dependencies: [...packages].sort().map(spec),
      registryDependencies: [...needs].sort(),
      files,
      css: draft.css ?? [],
    };
  });

  const index: RegistryIndex = {
    name: 'kvant',
    homepage: 'https://ui.norda.cloud',
    theme: {
      accents: [...ACCENTS],
      fonts: [...FONTS],
      shapes: [...SHAPES],
      defaults: { accent: DEFAULT_THEME.accent, font: DEFAULT_THEME.font, shape: DEFAULT_THEME.shape },
    },
    items: items.map(({ files, ...item }) => ({ ...item, files: files.map((file) => file.target) })),
  };
  return { index, items };
}

/** File name → JSON text, exactly as written to apps/docs/public/r. */
export function registryFiles(): Map<string, string> {
  const { index, items } = buildRegistry();
  const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
  return new Map([['index.json', json(index)], ...items.map((item): [string, string] => [`${item.name}.json`, json(item)])]);
}
