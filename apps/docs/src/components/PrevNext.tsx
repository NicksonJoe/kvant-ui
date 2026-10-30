import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/kvant';

export interface PrevNextTarget {
  to: string;
  title: string;
  caption: string;
}

export function PrevNext({ prev, next }: { prev?: PrevNextTarget; next?: PrevNextTarget }) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="Соседние страницы" className="grid gap-3 border-t border-separator pt-8 sm:grid-cols-2">
      {prev ? <PrevNextLink target={prev} direction="prev" /> : <span aria-hidden />}
      {next ? <PrevNextLink target={next} direction="next" /> : null}
    </nav>
  );
}

function PrevNextLink({ target, direction }: { target: PrevNextTarget; direction: 'prev' | 'next' }) {
  const Icon = direction === 'prev' ? ArrowLeft : ArrowRight;
  return (
    <Link
      to={target.to}
      className={cn(
        'kv-pressable group flex flex-col gap-1 rounded-xl p-4 shadow-[0_0_0_1px_var(--color-hairline)] [--kv-press-scale:var(--scale-press-wide)] hover:bg-fill-1',
        direction === 'next' && 'items-end text-right',
      )}
    >
      <span className="flex items-center gap-1.5 text-caption text-fg-3">
        {direction === 'prev' ? <Icon aria-hidden className="size-3.5" /> : null}
        {direction === 'prev' ? 'Назад' : 'Дальше'}
        {direction === 'next' ? <Icon aria-hidden className="size-3.5" /> : null}
      </span>
      <span className="text-label-md font-medium text-fg-1">{target.title}</span>
      <span className="text-caption text-fg-3">{target.caption}</span>
    </Link>
  );
}
