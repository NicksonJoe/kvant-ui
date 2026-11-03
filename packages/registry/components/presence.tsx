import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { useEffect, useEffectEvent, useRef, useState, type ComponentProps, type CSSProperties } from 'react';

export type PresenceMotion = 'fade' | 'rise' | 'collapse';

type Phase = 'starting' | 'open' | 'ending' | 'closed';

export interface PresenceProps extends useRender.ComponentProps<'div'> {
  /** Shown or not; on false the element stays until its exit transition ends. */
  present: boolean;
  /**
   * Curve from the motion catalogue: `fade` — skeleton → content, `rise` — list cascade on the first show,
   * `collapse` — a row added to a shown list. `rise` and `collapse` leave like a removed row and need one child.
   */
  motion?: PresenceMotion;
  /** Row number for `rise`: rows 0–7 enter 35ms apart, later rows together with the eighth. */
  index?: number;
  /** After the exit, once the element is gone: drop the row from your data here. */
  onExitComplete?: () => void;
}

/**
 * Enter and exit for content of your own, with the same `data-starting-style` / `data-ending-style` hooks Base UI
 * popups use. Reduced motion is in the tokens: no shift, no cascade, height changes at once, opacity stays.
 */
export function Presence({ present, motion = 'fade', index, onExitComplete, render, ...props }: PresenceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>(present ? 'starting' : 'closed');
  const [shown, setShown] = useState(present);
  if (present !== shown) {
    setShown(present);
    // Shown again mid-exit: turn back from where it is, without restarting the enter.
    setPhase(present ? (phase === 'closed' ? 'starting' : 'open') : 'ending');
  }

  const exited = useEffectEvent(() => onExitComplete?.());

  useEffect(() => {
    const element = ref.current;
    if (!element || (phase !== 'starting' && phase !== 'ending')) return undefined;
    let active = true;
    let frame = 0;
    if (phase === 'starting') {
      // Two frames: the starting style has to be painted once for the transition to run from it.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => setPhase('open'));
      });
    } else {
      // A frame first: the exit transition exists only after the browser has applied data-ending-style.
      frame = requestAnimationFrame(() => {
        void Promise.allSettled(element.getAnimations().map((animation) => animation.finished)).then(() => {
          if (!active) return;
          setPhase('closed');
          exited();
        });
      });
    }
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [phase]);

  // Typed apart from the call: data-* keys are not part of the div props type.
  const own: ComponentProps<'div'> & Record<`data-${string}`, string | undefined> = {
    'data-slot': 'presence',
    'data-motion': motion,
    'data-starting-style': phase === 'starting' ? '' : undefined,
    'data-ending-style': phase === 'ending' ? '' : undefined,
    className: 'kv-presence',
    style: index === undefined ? undefined : ({ '--kv-i': index } as CSSProperties),
  };
  return useRender({ render, ref, enabled: phase !== 'closed', props: mergeProps<'div'>(own, props) });
}
