// Registry format, see docs/registry-schema.md. Registry JSON is untrusted input: everything is checked before use.

export const ITEM_TYPES = ['component', 'lib', 'style', 'font'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export interface RegistryFile {
  /** Path inside the project's Kvant folder: `components/button.tsx`. */
  target: string;
  content: string;
  /** Re-exported from `<kvant folder>/index.ts`, so the app imports everything from `@/kvant`. */
  barrel?: boolean;
}

export interface RegistryItem {
  name: string;
  type: ItemType;
  title: string;
  description: string;
  /** npm packages with ranges: `@base-ui/react@^1.9.0`. */
  dependencies: string[];
  /** Kvant items this one imports; installed first. */
  registryDependencies: string[];
  files: RegistryFile[];
  /** Stylesheets the project CSS @imports, in order. `./styles/tokens.css` is inside the Kvant folder, anything else is a package. */
  css: string[];
}

export interface IndexItem extends Omit<RegistryItem, 'files'> {
  /** Targets only: enough to tell what is installed. */
  files: string[];
}

export interface ThemeOptions {
  accents: string[];
  fonts: string[];
  shapes: string[];
  defaults: { accent: string; font: string; shape: string };
}

export interface RegistryIndex {
  name: string;
  homepage: string;
  /** Values `kvant-ui init` accepts for --theme, --font and --shape. */
  theme: ThemeOptions;
  items: IndexItem[];
}

export const ITEM_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PACKAGE_SPEC = /^(?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*(?:@[\w.^~<>=*|+ -]+)?$/i;
const CSS_IMPORT = /^(?:\.\/)?[\w@][\w@./-]*$/;

/** Relative, forward slashes, no `.` or `..` segments: a target can never leave the Kvant folder. */
export function isSafeTarget(target: string): boolean {
  return !target.startsWith('/') && !/[\\:]/.test(target) && target.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
}

type Fields = Record<string, unknown>;

function invalid(where: string, problem: string): never {
  throw new Error(`Некорректный реестр (${where}): ${problem}`);
}

function object(value: unknown, where: string): Fields {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid(where, 'ожидался объект');
  return value as Fields;
}

function text(fields: Fields, key: string, where: string): string {
  const value = fields[key];
  if (typeof value !== 'string') invalid(where, `поле «${key}» должно быть строкой`);
  return value;
}

function texts(fields: Fields, key: string, where: string, pattern: RegExp): string[] {
  const value = fields[key] ?? [];
  if (!Array.isArray(value)) invalid(where, `поле «${key}» должно быть списком`);
  return value.map((entry: unknown) => {
    if (typeof entry !== 'string' || !pattern.test(entry)) invalid(where, `недопустимое значение в «${key}»: ${JSON.stringify(entry)}`);
    return entry;
  });
}

function itemType(fields: Fields, where: string): ItemType {
  const value = fields.type;
  const type = ITEM_TYPES.find((candidate) => candidate === value);
  if (!type) invalid(where, `неизвестный тип ${JSON.stringify(value)}`);
  return type;
}

function itemName(fields: Fields, where: string): string {
  const name = text(fields, 'name', where);
  if (!ITEM_NAME.test(name)) invalid(where, `недопустимое имя ${JSON.stringify(name)}`);
  return name;
}

function common(fields: Fields, where: string): Omit<RegistryItem, 'files'> {
  return {
    name: itemName(fields, where),
    type: itemType(fields, where),
    title: text(fields, 'title', where),
    description: text(fields, 'description', where),
    dependencies: texts(fields, 'dependencies', where, PACKAGE_SPEC),
    registryDependencies: texts(fields, 'registryDependencies', where, ITEM_NAME),
    css: texts(fields, 'css', where, CSS_IMPORT),
  };
}

function target(value: unknown, where: string): string {
  if (typeof value !== 'string' || !isSafeTarget(value)) invalid(where, `недопустимый путь файла ${JSON.stringify(value)}`);
  return value;
}

export function parseItem(json: unknown, where: string): RegistryItem {
  const fields = object(json, where);
  const files = fields.files;
  if (!Array.isArray(files)) invalid(where, 'поле «files» должно быть списком');
  return {
    ...common(fields, where),
    files: files.map((entry: unknown) => {
      const file = object(entry, where);
      return { target: target(file.target, where), content: text(file, 'content', where), ...(file.barrel === true ? { barrel: true } : {}) };
    }),
  };
}

export function parseIndex(json: unknown, where: string): RegistryIndex {
  const fields = object(json, where);
  const theme = object(fields.theme, `${where}: theme`);
  const defaults = object(theme.defaults, `${where}: theme.defaults`);
  const items = fields.items;
  if (!Array.isArray(items)) invalid(where, 'поле «items» должно быть списком');
  return {
    name: text(fields, 'name', where),
    homepage: text(fields, 'homepage', where),
    theme: {
      accents: texts(theme, 'accents', where, ITEM_NAME),
      fonts: texts(theme, 'fonts', where, ITEM_NAME),
      shapes: texts(theme, 'shapes', where, ITEM_NAME),
      defaults: { accent: text(defaults, 'accent', where), font: text(defaults, 'font', where), shape: text(defaults, 'shape', where) },
    },
    items: items.map((entry: unknown) => {
      const item = object(entry, where);
      const files = item.files;
      if (!Array.isArray(files)) invalid(where, 'поле «files» должно быть списком');
      return { ...common(item, where), files: files.map((file: unknown) => target(file, where)) };
    }),
  };
}
