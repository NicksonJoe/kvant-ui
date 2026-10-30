import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { exists, readText } from './project.ts';

export const PACKAGE_MANAGERS = ['pnpm', 'yarn', 'bun', 'npm'] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export type Installer = (packages: string[], options: { dev: boolean }) => Promise<void>;

const LOCKFILES: [string, PackageManager][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
];

/** Lockfile first, then the manager that launched us (npx / pnpm dlx / bunx), then npm. */
export async function detectPackageManager(cwd: string, userAgent = process.env.npm_config_user_agent ?? ''): Promise<PackageManager> {
  for (const [file, manager] of LOCKFILES) if (await exists(join(cwd, file))) return manager;
  return PACKAGE_MANAGERS.find((manager) => userAgent.startsWith(`${manager}/`)) ?? 'npm';
}

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export async function readPackageJson(cwd: string): Promise<PackageJson> {
  const text = await readText(join(cwd, 'package.json'));
  if (text === undefined) throw new Error('Нет package.json: запускайте kvant в корне проекта.');
  const json: unknown = JSON.parse(text);
  if (typeof json !== 'object' || json === null) throw new Error('package.json: ожидался объект');
  return json as PackageJson;
}

/** `@base-ui/react@^1.9.0` → `@base-ui/react`. */
export const packageName = (spec: string): string => spec.replace(/(?<=.)@.*$/, '');

/** Specs whose package is not in package.json yet. Installed versions are never touched. */
export async function missingPackages(cwd: string, specs: readonly string[]): Promise<string[]> {
  const pkg = await readPackageJson(cwd);
  const installed = { ...pkg.peerDependencies, ...pkg.devDependencies, ...pkg.dependencies };
  return specs.filter((spec, index) => specs.indexOf(spec) === index && !(packageName(spec) in installed));
}

export function packageInstaller(cwd: string, manager: PackageManager): Installer {
  return (packages, { dev }) =>
    new Promise((resolve, reject) => {
      const args = [manager === 'npm' ? 'install' : 'add', ...(dev ? ['-D'] : []), ...packages];
      // Windows needs a shell for pnpm.cmd / npm.cmd; specs are validated by the registry schema, so nothing to inject.
      const child = spawn(manager, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
      child.on('error', (error) => reject(new Error(`Не удалось запустить ${manager}: ${error.message}`)));
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${manager} ${args.join(' ')} завершился с кодом ${code ?? '?'}`))));
    });
}
