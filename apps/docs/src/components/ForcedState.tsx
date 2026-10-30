import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { ForcedState as ForcedStateId } from '@/kvant/meta';

export const FOCUSABLE = 'button, a[href], input, textarea, select, [tabindex]';
export const ATTRIBUTES: Record<ForcedStateId, string> = {
  hover: 'data-force-hover',
  pressed: 'data-force-pressed',
  focus: 'data-force-focus',
};

export interface ForcedStateProps {
  state?: ForcedStateId;
  children: ReactNode;
}

/**
 * Static preview for state matrices: the subtree is inert, and the first interactive element gets
 * `data-force-*`, which Kvant's hover / active / focus-visible variants treat like the real state.
 */
export function ForcedState({ state, children }: ForcedStateProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!state || !root) return;
    const target = root.querySelector(FOCUSABLE) ?? root.firstElementChild;
    const attribute = ATTRIBUTES[state];
    target?.setAttribute(attribute, '');
    return () => target?.removeAttribute(attribute);
  }, [state]);

  return (
    <div ref={ref} inert className="contents">
      {children}
    </div>
  );
}
