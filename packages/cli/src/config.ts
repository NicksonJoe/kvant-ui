import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isSafeTarget } from './schema.ts';

export const CONFIG_FILE = 'kvant.json';

export interface KvantConfig {
  /** Registry folder, URL or github:owner/repo. */
  registry: string;
  theme: string;
  font: string;
  shape: string;
  /** Project stylesheet that @imports Kvant styles. */
  css: string;
  /** Folder Kvant files are copied into, relative to the project root. */
  dir: string;
  /** How app code imports that folder. */
  aliases: { kvant: string };
}

export async function readConfig(cwd: string): Promise<KvantConfig> {
  let text: string;
  try {
    text = await readFile(join(cwd, CONFIG_FILE), 'utf8');
  } catch {
    throw new Error(`Нет ${CONFIG_FILE}. Сначала выполните kvant init в корне проекта.`);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${CONFIG_FILE}: не JSON`);
  }
  const fields = typeof json === 'object' && json !== null ? (json as Record<string, unknown>) : {};
  const aliases = typeof fields.aliases === 'object' && fields.aliases !== null ? (fields.aliases as Record<string, unknown>) : {};
  const field = (value: unknown, key: string): string => {
    if (typeof value !== 'string' || value === '') throw new Error(`${CONFIG_FILE}: поле «${key}» должно быть непустой строкой`);
    return value;
  };
  const config: KvantConfig = {
    registry: field(fields.registry, 'registry'),
    theme: field(fields.theme, 'theme'),
    font: field(fields.font, 'font'),
    shape: field(fields.shape, 'shape'),
    css: field(fields.css, 'css'),
    dir: field(fields.dir, 'dir'),
    aliases: { kvant: field(aliases.kvant, 'aliases.kvant') },
  };
  // The project's own paths may not leave the project either.
  for (const key of ['css', 'dir'] as const) {
    config[key] = config[key].replace(/^\.\//, '');
    if (!isSafeTarget(config[key])) throw new Error(`${CONFIG_FILE}: «${key}» должен быть путём внутри проекта, например src/kvant`);
  }
  return config;
}

export async function writeConfig(cwd: string, config: KvantConfig): Promise<void> {
  await writeFile(join(cwd, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`);
}
