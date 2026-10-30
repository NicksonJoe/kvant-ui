import { join } from 'node:path';
import { addItems, type Log } from './add.ts';
import { CONFIG_FILE, writeConfig, type KvantConfig } from './config.ts';
import { readPackageJson, type Installer } from './install.ts';
import { addTailwindVitePlugin, CSS_CANDIDATES, firstExisting, setHtmlAttributes, VITE_CONFIGS } from './project.ts';
import { isSafeTarget } from './schema.ts';
import { DEFAULT_REGISTRY, fetchIndex, registrySource } from './source.ts';

export interface InitOptions {
  cwd: string;
  registry?: string;
  theme?: string;
  font?: string;
  shape?: string;
  alias?: string;
  dir?: string;
  css?: string;
  overwrite: boolean;
  install: Installer;
  log: Log;
}

function choose(value: string | undefined, allowed: readonly string[], fallback: string, flag: string): string {
  const chosen = value ?? fallback;
  if (!allowed.includes(chosen)) throw new Error(`${flag} ${chosen}: допустимо ${allowed.join(', ')}`);
  return chosen;
}

function projectPath(value: string, flag: string): string {
  const path = value.replace(/^\.\//, '');
  if (!isSafeTarget(path)) throw new Error(`${flag} ${value}: нужен путь внутри проекта, например src/kvant`);
  return path;
}

/** Writes kvant.json, sets up Tailwind v4 in a Vite app, installs styles, cn and the font, applies the theme to index.html. */
export async function init(options: InitOptions): Promise<KvantConfig> {
  const { cwd, install, log } = options;
  const pkg = await readPackageJson(cwd);
  const registry = options.registry ?? DEFAULT_REGISTRY;
  const source = registrySource(registry, cwd);
  const { theme } = await fetchIndex(source);

  const css = options.css ?? (await firstExisting(cwd, CSS_CANDIDATES));
  if (!css) throw new Error(`Не нашёл файл стилей (${CSS_CANDIDATES.join(', ')}). Укажите его: kvant init --css путь/к/файлу.css`);

  const config: KvantConfig = {
    registry,
    theme: choose(options.theme, theme.accents, theme.defaults.accent, '--theme'),
    font: choose(options.font, theme.fonts, theme.defaults.font, '--font'),
    shape: choose(options.shape, theme.shapes, theme.defaults.shape, '--shape'),
    css: projectPath(css, '--css'),
    dir: projectPath(options.dir ?? 'src/kvant', '--dir'),
    aliases: { kvant: options.alias ?? '@/kvant' },
  };
  await writeConfig(cwd, config);
  log(`Записан ${CONFIG_FILE}: тема ${config.theme}, шрифт ${config.font}, форма ${config.shape}, папка ${config.dir}.`);

  const versions = { ...pkg.devDependencies, ...pkg.dependencies };
  if (!versions.tailwindcss) {
    const viteConfig = await firstExisting(cwd, VITE_CONFIGS);
    if (viteConfig) {
      log('Ставлю Tailwind CSS v4 для Vite.');
      await install(['tailwindcss@^4', '@tailwindcss/vite@^4'], { dev: true });
      if (!(await addTailwindVitePlugin(join(cwd, viteConfig)))) {
        log(`Добавьте плагин вручную в ${viteConfig}: import tailwindcss from '@tailwindcss/vite' и tailwindcss() в plugins.`);
      }
    } else {
      log('Tailwind CSS не найден. Установите Tailwind CSS v4 по инструкции для вашего сборщика: https://tailwindcss.com/docs/installation');
    }
  } else if (!/^[\^~]?4|^latest$|^\*$/.test(versions.tailwindcss)) {
    log(`Kvant рассчитан на Tailwind CSS v4, в проекте ${versions.tailwindcss}.`);
  }

  await addItems(['styles', 'cn', `font-${config.font}`], { cwd, config, source, overwrite: options.overwrite, install, log });

  const attributes = { 'data-accent': config.theme, 'data-font': config.font, 'data-shape': config.shape };
  if (await setHtmlAttributes(cwd, attributes)) log('Тема применена в index.html.');
  else log(`Добавьте на <html>: ${Object.entries(attributes).map(([name, value]) => `${name}="${value}"`).join(' ')}`);

  log('Дальше: kvant add button dialog');
  log(`Импорт: import { Button } from '${config.aliases.kvant}' — алиас должен вести в ${config.dir} (paths в tsconfig и resolve.alias у сборщика).`);
  return config;
}
