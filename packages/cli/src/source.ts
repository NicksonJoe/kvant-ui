import { readFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { ITEM_NAME, parseIndex, parseItem, type RegistryIndex, type RegistryItem } from './schema.ts';

export const DEFAULT_REGISTRY = 'github:NicksonJoe/kwant';

/** Where registry JSON comes from: a folder, a URL or a GitHub repository. */
export interface RegistrySource {
  label: string;
  /** Text of one registry file, or `undefined` when it does not exist. */
  read(file: string): Promise<string | undefined>;
}

/** `github:owner/repo[/path][#ref]` → raw URL of the registry folder (default path apps/docs/public/r, ref main). */
export function githubRawUrl(spec: string): string {
  const match = /^github:([\w.-]+)\/([\w.-]+)((?:\/[\w.-]+)*)(?:#([\w./-]+))?$/.exec(spec);
  if (!match) throw new Error(`Не понимаю источник «${spec}»: ожидается github:владелец/репозиторий[/путь][#ветка]`);
  const [, owner, repo, path, ref] = match;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref ?? 'main'}${path || '/apps/docs/public/r'}`;
}

function urlSource(base: string, headers: Record<string, string>): RegistrySource {
  const root = base.endsWith('/') ? base : `${base}/`;
  return {
    label: base,
    async read(file) {
      let response: Response;
      try {
        response = await fetch(new URL(file, root), { headers });
      } catch (error) {
        throw new Error(`Реестр ${base} недоступен: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error(`Реестр ${base} ответил ${response.status} на ${file}`);
      return response.text();
    },
  };
}

export function registrySource(spec: string, cwd: string, env: NodeJS.ProcessEnv = process.env): RegistrySource {
  if (spec.startsWith('github:')) {
    const token = env.GITHUB_TOKEN ?? env.GH_TOKEN;
    // A token opens private repositories; raw.githubusercontent.com accepts it as a plain header.
    return { ...urlSource(githubRawUrl(spec), token ? { Authorization: `token ${token}` } : {}), label: spec };
  }
  if (/^https?:\/\//.test(spec)) return urlSource(spec, {});
  const folder = isAbsolute(spec) ? spec : resolve(cwd, spec);
  return {
    label: folder,
    async read(file) {
      try {
        return await readFile(join(folder, file), 'utf8');
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined;
        throw error;
      }
    },
  };
}

function json(text: string, where: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Некорректный реестр (${where}): не JSON`);
  }
}

export async function fetchItem(source: RegistrySource, name: string): Promise<RegistryItem> {
  if (!ITEM_NAME.test(name)) throw new Error(`Недопустимое имя «${name}»: только латиница, цифры и дефис`);
  const text = await source.read(`${name}.json`);
  if (text === undefined) throw new Error(`«${name}» нет в реестре ${source.label}. Список: kvant list`);
  const item = parseItem(json(text, `${name}.json`), `${name}.json`);
  if (item.name !== name) throw new Error(`Некорректный реестр (${name}.json): внутри элемент «${item.name}»`);
  return item;
}

/** `./block.json` or `https://…/block.json`: one item outside the registry, e.g. a block saved in Playground. */
export function isItemFile(spec: string): boolean {
  return spec.endsWith('.json');
}

/** The item in that file, checked like any registry item; its dependencies still come from the registry. */
export async function readItemFile(spec: string, cwd: string): Promise<RegistryItem> {
  const cut = spec.lastIndexOf('/') + 1;
  const text = await registrySource(spec.slice(0, cut) || '.', cwd).read(spec.slice(cut));
  if (text === undefined) throw new Error(`Файл ${spec} не найден`);
  return parseItem(json(text, spec), spec);
}

export async function fetchIndex(source: RegistrySource): Promise<RegistryIndex> {
  const text = await source.read('index.json');
  if (text === undefined) throw new Error(`В ${source.label} нет index.json — это не реестр Kvant`);
  return parseIndex(json(text, 'index.json'), 'index.json');
}
