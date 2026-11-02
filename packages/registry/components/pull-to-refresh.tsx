import { ArrowDown, Check, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './spinner';

const HIDDEN = 16;
const THRESHOLD = 88;
const MAX = 160;
const REST = 56;

/** Finger travel → indicator offset: 1:1 to the threshold, then resistance 0.4 up to 160. */
export function pullDistance(travel: number): number {
  if (travel <= THRESHOLD) return Math.max(0, travel);
  return Math.min(MAX, THRESHOLD + (travel - THRESHOLD) * 0.4);
}

type Phase = 'idle' | 'pulling' | 'armed' | 'refreshing' | 'done' | 'error';

export interface PullToRefreshProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Reloads the list. Resolve with a short result — «1 новая сделка» — or nothing for «Обновлено». */
  onRefresh: () => Promise<ReactNode>;
  children: ReactNode;
}

/**
 * Pull the list down from its top: a 28 ring fills from 16 to 88, closes at the threshold and turns into a spinner on
 * release; the result shows as a plaque for 1.2 s, an error as a danger band with «Повторить». Touch only.
 */
export function PullToRefresh({ onRefresh, className, children, ...props }: PullToRefreshProps) {
  const area = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<ReactNode>(null);

  useEffect(() => {
    const element = area.current;
    if (!element) return;
    // the page must not scroll or bounce while the list is pulled; React's touchmove is passive
    const hold = (event: TouchEvent) => {
      if (start.current !== null && element.scrollTop <= 0 && (event.touches[0]?.clientY ?? 0) > start.current) event.preventDefault();
    };
    element.addEventListener('touchmove', hold, { passive: false });
    return () => element.removeEventListener('touchmove', hold);
  }, []);

  useEffect(() => {
    if (phase !== 'done') return;
    const timer = window.setTimeout(() => setPhase('idle'), 1200);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const refresh = async () => {
    setPhase('refreshing');
    setPull(REST);
    try {
      const [value] = await Promise.all([onRefresh(), new Promise((resolve) => window.setTimeout(resolve, 600))]);
      setResult(value ?? null);
      setPhase('done');
    } catch {
      setPhase('error');
    }
    setPull(0);
  };

  const busy = phase === 'refreshing';
  const progress = Math.min(1, Math.max(0, (pull - HIDDEN) / (THRESHOLD - HIDDEN)));
  const ring = 2 * Math.PI * 11;

  return (
    <div data-slot="pull-to-refresh" className={cn('relative flex min-h-0 flex-col', className)} {...props}>
      <p role="status" className="sr-only">
        {busy ? 'Обновляем…' : phase === 'done' ? 'Обновлено' : phase === 'error' ? 'Не удалось обновить' : ''}
      </p>
      <div
        aria-hidden
        data-slot="pull-to-refresh-indicator"
        className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1.5 pt-3"
        style={{ opacity: busy ? 1 : pull > HIDDEN ? 0.4 + progress * 0.6 : 0 }}
      >
        <span className="relative grid size-7 place-items-center text-accent">
          {busy ? (
            <Spinner size={24} inherit />
          ) : (
            <>
              <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
                <circle cx="14" cy="14" r="11" fill="none" stroke="var(--color-fill-3)" strokeWidth="2.5" />
                <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${progress * ring} ${ring}`} />
              </svg>
              {phase === 'armed' ? <ArrowDown className="absolute size-3.5 stroke-[2.25]" /> : null}
            </>
          )}
        </span>
        {phase === 'armed' ? <span className="text-label-sm font-medium text-fg-2">Отпустите, чтобы обновить</span> : null}
      </div>

      {phase === 'done' ? (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
          {result ? (
            <span className="rounded-full bg-accent px-3 py-1.5 text-label-sm font-medium text-accent-fg shadow-overlay">{result}</span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-surface-1 px-3 py-1.5 text-label-sm font-medium text-fg-1 shadow-overlay">
              <Check aria-hidden className="size-4 text-success" />
              Обновлено
            </span>
          )}
        </div>
      ) : null}

      {phase === 'error' ? (
        <div className="flex items-center gap-3 bg-danger-soft px-4 py-2 text-body-sm text-danger-soft-fg">
          <span className="flex-1">Не удалось обновить. Данные — как были.</span>
          <button type="button" onClick={refresh} className="flex h-11 items-center gap-1.5 font-medium">
            <RotateCw aria-hidden className="size-4 stroke-[1.75]" />
            Повторить
          </button>
        </div>
      ) : null}

      <div
        ref={area}
        data-slot="pull-to-refresh-area"
        onTouchStart={(event: ReactTouchEvent<HTMLDivElement>) => {
          if (busy || event.currentTarget.scrollTop > 0) return;
          start.current = event.touches[0]?.clientY ?? null;
        }}
        onTouchMove={(event) => {
          const y = event.touches[0]?.clientY;
          if (start.current === null || y === undefined) return;
          const next = pullDistance(y - start.current);
          setPull(next);
          setPhase(next >= THRESHOLD ? 'armed' : next > 0 ? 'pulling' : 'idle');
        }}
        onTouchEnd={() => {
          if (start.current === null) return;
          start.current = null;
          if (phase === 'armed') void refresh();
          else {
            setPull(0);
            setPhase('idle');
          }
        }}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto overscroll-y-contain',
          phase !== 'pulling' && phase !== 'armed' && 'transition-transform duration-(--duration-slow) ease-fluid',
        )}
        style={{ transform: `translateY(${pull}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
