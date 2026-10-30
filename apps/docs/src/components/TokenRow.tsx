import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { splitTransition, toMs } from '../lib/easing';
import { CopyButton } from './CopyButton';
import { EasingCurve } from './EasingCurve';

const ring = 'shadow-[inset_0_0_0_1.5px_var(--color-accent)]';

/** A small live sample of the token: colour, size, radius, shadow or curve. */
function TokenPreview({ name, value }: { name: string; value: string }): ReactNode {
  const variable = `var(${name})`;
  const is = (prefix: string) => name.startsWith(`--${prefix}`);
  if (is('color-')) return <span className="h-7 w-16 rounded-md shadow-[inset_0_0_0_1px_var(--color-hairline)]" style={{ background: variable }} />;
  if (is('text-')) return <span className="leading-none text-fg-1" style={{ fontSize: `min(${variable}, 32px)` }}>Аа</span>;
  if (is('font-weight-')) return <span className="text-heading-md text-fg-1" style={{ fontWeight: variable }}>Аа</span>;
  if (is('font-')) return <span className="text-heading-md text-fg-1" style={{ fontFamily: variable }}>Аа</span>;
  if (is('tracking-')) return <span className="text-label-md text-fg-1" style={{ letterSpacing: variable }}>Квант</span>;
  if (is('leading-')) return <span className="w-2 rounded-xs bg-fill-3" style={{ height: `min(${variable}, 40px)` }} />;
  if (is('spacing-') || is('shift-')) return <span className="h-2 rounded-full bg-accent" style={{ width: variable }} />;
  if (is('radius-')) return <span className={`h-8 w-12 bg-accent-soft ${ring}`} style={{ borderRadius: variable }} />;
  if (is('shadow-')) return <span className="h-8 w-12 rounded-md bg-surface-1" style={{ boxShadow: variable }} />;
  if (is('scale-')) return <span className={`size-7 rounded-md bg-accent-soft ${ring}`} style={{ scale: variable }} />;
  if (is('opacity-')) return <span className="size-8 rounded-md bg-accent" style={{ opacity: variable }} />;
  if (is('ease-') || is('spring-')) return <EasingCurve easing={splitTransition(value).easing} />;
  if (is('duration-')) {
    // 0–800 ms on the bar; the spinner and the shimmer run off its end
    const share = Math.min(1, (toMs(value) ?? 0) / 800);
    return (
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-fill-2">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${share * 100}%` }} />
      </span>
    );
  }
  return null;
}

export interface TokenRowProps {
  /** Custom property: `--color-accent`. */
  name: string;
  /** Live value on <html>. */
  value: string;
  /** Anchor id (the row on /docs/tokens). */
  id?: string;
  /** Highlighted: the row the URL points at. */
  target?: boolean;
  /** Makes the name a link, e.g. to the token's row on /docs/tokens. */
  to?: string;
}

/** Sample, name, live value and a copy button for `var(--name)`. */
export function TokenRow({ name, value, id, target = false, to }: TokenRowProps) {
  const nameClass = 'font-mono text-caption text-fg-1 md:w-64 md:shrink-0';
  return (
    <div id={id} data-target={target ? '' : undefined} className="flex items-center gap-4 px-4 py-1.5 data-target:bg-accent-soft">
      <span className="flex h-10 w-24 shrink-0 items-center">
        <TokenPreview name={name} value={value} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-row md:items-center md:gap-4">
        {to ? (
          <Link to={to} className={`${nameClass} underline-offset-3 hover:underline`}>
            {name}
          </Link>
        ) : (
          <code className={nameClass}>{name}</code>
        )}
        <code title={value} className="line-clamp-2 min-w-0 font-mono text-caption break-all text-fg-3">
          {value || '—'}
        </code>
      </div>
      <CopyButton value={`var(${name})`} label={`Скопировать var(${name})`} />
    </div>
  );
}
