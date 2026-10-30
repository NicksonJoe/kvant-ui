import type { ReactNode } from 'react';
import { cn } from '@/kvant';

/** A design token with a live colour: follows the current theme and mode. */
export function Swatch({ token, note }: { token: string; note?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className="size-10 shrink-0 rounded-md shadow-[inset_0_0_0_1px_var(--color-hairline)]"
        style={{ background: `var(--color-${token})` }}
      />
      <span className="flex min-w-0 flex-col">
        <code className="truncate font-mono text-caption text-fg-1">{token}</code>
        {note ? <span className="truncate text-caption text-fg-3">{note}</span> : null}
      </span>
    </div>
  );
}

export function SwatchGrid({ tokens }: { tokens: readonly (readonly [string, string?])[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 2xl:grid-cols-3">
      {tokens.map(([token, note]) => (
        <Swatch key={token} token={token} note={note} />
      ))}
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="docs-prose">{children}</div>;
}

/** Two-column spec list: term on the left, explanation on the right. */
export function SpecList({ items, className }: { items: readonly (readonly [ReactNode, ReactNode])[]; className?: string }) {
  return (
    <dl className={cn('grid max-w-4xl grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-[minmax(10rem,auto)_1fr]', className)}>
      {items.map(([term, text], index) => (
        <div key={index} className="contents">
          <dt className="text-label-md font-medium text-fg-1">{term}</dt>
          <dd className="text-body-sm text-fg-2">{text}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Calm surface for live demos inside foundations pages. */
export function DemoSurface({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('docs-stage rounded-2xl p-6 shadow-[0_0_0_1px_var(--color-hairline)]', className)}>{children}</div>;
}

export function Mono({ children }: { children: ReactNode }) {
  return <code className="font-mono text-caption text-fg-3">{children}</code>;
}
