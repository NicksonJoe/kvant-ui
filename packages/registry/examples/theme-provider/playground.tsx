import { useSyncExternalStore } from 'react';
import { ThemeProvider } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const ATTRIBUTES = ['lang', 'data-accent', 'data-mode', 'data-font', 'data-shape', 'data-density'] as const;

function subscribe(notify: () => void): () => void {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [...ATTRIBUTES] });
  return () => observer.disconnect();
}
const snapshot = () => ATTRIBUTES.map((name) => document.documentElement.getAttribute(name) ?? '—').join(' ');

/** What <html> carries right now: the provider writes it after render. */
function RootAttributes() {
  const values = useSyncExternalStore(subscribe, snapshot, () => '').split(' ');
  return (
    <dl className="grid w-full max-w-80 grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-xl bg-surface-1 px-5 py-4 font-mono text-caption shadow-raised">
      {ATTRIBUTES.map((name, index) => (
        <div key={name} className="contents">
          <dt className="text-fg-3">{name}</dt>
          <dd className="text-fg-1">{values[index]}</dd>
        </div>
      ))}
    </dl>
  );
}

const playground: Playground = {
  render: (p) => (
    <ThemeProvider lang={p.pick('lang', ['ru', 'en', 'kk'] as const)}>
      <RootAttributes />
    </ThemeProvider>
  ),
  code: (p) => `<ThemeProvider${p.attrs(['lang'])}>
  {children}
</ThemeProvider>`,
};

export default playground;
