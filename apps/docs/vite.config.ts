import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const registry = fileURLToPath(new URL('../../packages/registry/', import.meta.url));
const src = fileURLToPath(new URL('./src/', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // examples live outside the root: without a watched folder import.meta.glob misses a new file until restart
    { name: 'kvant-watch-examples', configureServer: (server) => void server.watcher.add(`${registry}examples`) },
  ],
  resolve: {
    // Docs import the library the way an app does: `@/kvant` (examples are shown to users verbatim).
    alias: [
      { find: /^@\/kvant$/, replacement: `${registry}index.ts` },
      { find: /^@\/kvant\/(.*)$/, replacement: `${registry}$1` },
      { find: /^@\/(.*)$/, replacement: `${src}$1` },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: { port: 5190, strictPort: true },
  preview: { port: 5190, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['../../packages/registry/test/setup.ts'],
    // styles are not needed in tests; raw CSS is data (lib/tokens.ts reads tokens.css)
    css: { include: /\.css\?raw$/ },
  },
});
