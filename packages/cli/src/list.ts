import { join, resolve } from 'node:path';
import type { Log } from './add.ts';
import type { KvantConfig } from './config.ts';
import { exists } from './project.ts';
import type { ItemType } from './schema.ts';
import { fetchIndex, type RegistrySource } from './source.ts';

const SECTIONS: Record<ItemType, string> = { component: 'Компоненты', lib: 'Утилиты', style: 'Стили', font: 'Шрифты' };

/** Registry items by type; ✓ marks items whose files are all in the project. */
export async function listItems(options: { cwd: string; config: KvantConfig | undefined; source: RegistrySource; log: Log }): Promise<void> {
  const { cwd, config, source, log } = options;
  const index = await fetchIndex(source);
  const dir = config && resolve(cwd, config.dir);
  const width = Math.max(...index.items.map((item) => item.name.length));
  for (const [type, title] of Object.entries(SECTIONS)) {
    const items = index.items.filter((item) => item.type === type);
    if (items.length === 0) continue;
    log(`${title}:`);
    for (const item of items) {
      const installed = dir !== undefined && item.files.length > 0 && (await Promise.all(item.files.map((target) => exists(join(dir, target))))).every(Boolean);
      log(`  ${installed ? '✓' : ' '} ${item.name.padEnd(width)}  ${item.title}`);
    }
  }
  log(`Реестр: ${source.label}. Установить: kvant add <имя…>`);
}
