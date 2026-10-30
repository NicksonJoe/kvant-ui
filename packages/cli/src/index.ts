#!/usr/bin/env node
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { addItems, type Log } from './add.ts';
import { CONFIG_FILE, readConfig } from './config.ts';
import { diffItems } from './diff.ts';
import { init } from './init.ts';
import { detectPackageManager, packageInstaller } from './install.ts';
import { listItems } from './list.ts';
import { exists } from './project.ts';
import { DEFAULT_REGISTRY, registrySource } from './source.ts';

const HELP = `kvant — компоненты Kvant в вашем проекте

  kvant init [--theme cobalt] [--font inter] [--shape capsule] [--alias @/kvant] [--dir src/kvant] [--css src/index.css]
  kvant add <имя…> [--overwrite]    скопировать компоненты с зависимостями
  kvant add ./блок.json             блок из Playground: файл блока, зависимости — из реестра
  kvant diff [имя…]                 чем установленные файлы отличаются от реестра
  kvant list                        что есть в реестре

  --registry <источник>   папка, URL (по умолчанию ${DEFAULT_REGISTRY}) или github:владелец/репозиторий[/путь][#ветка];
                          для приватного репозитория задайте GITHUB_TOKEN
  --overwrite             заменить файлы, которые отличаются от реестра (ваши правки пропадут)
`;

const log: Log = (line) => process.stdout.write(`${line}\n`);

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      registry: { type: 'string' },
      theme: { type: 'string' },
      font: { type: 'string' },
      shape: { type: 'string' },
      alias: { type: 'string' },
      dir: { type: 'string' },
      css: { type: 'string' },
      overwrite: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  const [command, ...names] = positionals;
  if (values.help || !command) {
    process.stdout.write(HELP);
    return command || values.help ? 0 : 1;
  }

  const cwd = process.cwd();
  const install = packageInstaller(cwd, await detectPackageManager(cwd));
  switch (command) {
    case 'init':
      await init({ ...values, cwd, install, log });
      return 0;
    case 'add': {
      if (names.length === 0) throw new Error('Укажите, что добавить: kvant add button dialog');
      const config = await readConfig(cwd);
      const source = registrySource(values.registry ?? config.registry, cwd);
      await addItems(names, { cwd, config, source, overwrite: values.overwrite, install, log });
      return 0;
    }
    case 'diff': {
      const config = await readConfig(cwd);
      await diffItems(names, { cwd, config, source: registrySource(values.registry ?? config.registry, cwd), log });
      return 0;
    }
    case 'list': {
      const config = (await exists(join(cwd, CONFIG_FILE))) ? await readConfig(cwd) : undefined;
      const source = registrySource(values.registry ?? config?.registry ?? DEFAULT_REGISTRY, cwd);
      await listItems({ cwd, config, source, log });
      return 0;
    }
    default:
      throw new Error(`Нет команды «${command}». Справка: kvant --help`);
  }
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.stderr.write(`kvant: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  },
);
