import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Examples import the library the way an app does: `@/kvant`.
  resolve: {
    alias: [
      { find: /^@\/kvant$/, replacement: `${root}index.ts` },
      { find: /^@\/kvant\/(.*)$/, replacement: `${root}$1` },
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
  },
});
