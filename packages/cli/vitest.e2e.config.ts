import { defineConfig } from 'vitest/config';

// Installs real packages into a temp Vite app: run on demand (pnpm --filter kvant-ui test:e2e), not with unit tests.
export default defineConfig({
  test: {
    include: ['test/**/*.e2e.ts'],
    testTimeout: 600_000,
    hookTimeout: 600_000,
  },
});
