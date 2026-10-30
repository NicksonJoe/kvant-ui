// Writes apps/docs/public/r. Run: pnpm --filter kvant-ui registry
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

// Registry metadata imports without extensions, the way the bundler resolves it.
registerHooks({
  resolve(specifier, context, next) {
    if (!specifier.startsWith('.') || /\.[cm]?[jt]sx?$/.test(specifier)) return next(specifier, context);
    try {
      return next(`${specifier}.ts`, context);
    } catch {
      return next(`${specifier}/index.ts`, context);
    }
  },
});

const { OUT, registryFiles } = await import('./registry.ts');
const files = registryFiles();
mkdirSync(OUT, { recursive: true });
for (const stale of readdirSync(OUT)) if (stale.endsWith('.json') && !files.has(stale)) rmSync(new URL(stale, OUT));
for (const [name, text] of files) writeFileSync(new URL(name, OUT), text);
process.stdout.write(`Registry: ${files.size - 1} items → apps/docs/public/r\n`);
