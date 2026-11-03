import { CodeBlock, themeScript } from '@/kvant';

const html = `<!doctype html>
<html lang="ru" data-accent="cobalt" data-mode="light">
  <head>
    <script>
${themeScript.replace(/^/gm, '      ')}
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

const main = `import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/kvant';
import { App } from './app';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider lang="ru">
    <App />
  </ThemeProvider>,
);`;

const ssr = `import { themeScript } from '@/kvant';

// Next.js, Remix and other SSR: the same script, first in <head>
<head>
  <script dangerouslySetInnerHTML={{ __html: themeScript }} />
</head>`;

export default function ThemeProviderSetup() {
  return (
    <CodeBlock
      className="w-full max-w-192"
      files={[
        { name: 'index.html', code: html },
        { name: 'main.tsx', code: main },
        { name: 'layout.tsx', code: ssr },
      ]}
    />
  );
}
