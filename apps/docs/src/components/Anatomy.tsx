import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/kvant';
import type { AnatomyPart, ReadyComponentMeta } from '@/kvant/meta';
import { renderPlayground } from '../lib/registry';
import { FitScale } from './FitScale';

/** The parts from the meta, or one part per data-slot. */
function partsOf(meta: ReadyComponentMeta): readonly AnatomyPart[] {
  return meta.anatomyMap?.parts ?? meta.slots.map((slot) => ({ name: slot.name, selector: `[data-slot="${slot.name}"]`, description: slot.description }));
}

/** A live specimen and its parts: hovering, focusing or pinning a part outlines it on the specimen. */
export function Anatomy({ meta }: { meta: ReadyComponentMeta }) {
  const parts = useMemo(() => partsOf(meta), [meta]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [missing, setMissing] = useState<ReadonlySet<number>>(new Set());
  const active = hovered ?? pinned;
  const selector = active === null ? null : (parts[active]?.selector ?? null);

  // the specimen is mounted before its stage gets the ref: a good moment to see which parts it lacks
  const attachStage = useCallback(
    (stage: HTMLDivElement | null) => {
      stageRef.current = stage;
      if (stage) setMissing(new Set(parts.flatMap((part, index) => (stage.querySelector(part.selector) ? [] : [index]))));
    },
    [parts],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !selector) return;
    const elements = [...stage.querySelectorAll(selector)];
    for (const element of elements) element.setAttribute('data-anatomy-active', '');
    return () => {
      for (const element of elements) element.removeAttribute('data-anatomy-active');
    };
  }, [selector]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div ref={attachStage} className="docs-stage overflow-hidden rounded-2xl shadow-[0_0_0_1px_var(--color-hairline)]">
        <FitScale max={2} className="h-72 p-10">
          <div inert>{renderPlayground(meta, meta.anatomyMap?.values)}</div>
        </FitScale>
      </div>
      <ol aria-label="Части" className="flex flex-col gap-1">
        {parts.map((part, index) => (
          <li key={part.selector}>
            <button
              type="button"
              aria-pressed={pinned === index}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              onClick={() => setPinned((current) => (current === index ? null : index))}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-(--duration-micro) ease-hover hover:bg-fill-1 aria-pressed:bg-accent-soft',
                active === index && 'bg-fill-1',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full text-caption font-medium tabular-nums',
                  active === index ? 'bg-accent text-accent-fg' : 'bg-fill-2 text-fg-2',
                )}
              >
                {index + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-label-md font-medium text-fg-1">{part.name}</span>
                <code className="font-mono text-overline break-all text-fg-3">{part.selector}</code>
                <span className="text-body-xs text-fg-2">{part.description}</span>
                {missing.has(index) ? <span className="text-caption text-fg-3">нет на образце</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
