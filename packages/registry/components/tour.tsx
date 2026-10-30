import { Popover as BasePopover } from '@base-ui/react/popover';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button, CloseButton } from './button';

export interface TourStep {
  /** Element to highlight: a CSS selector or a function that finds it. */
  target: string | (() => Element | null);
  title: ReactNode;
  description: ReactNode;
  /** Card side relative to the target; flips at the screen edge. */
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourProps {
  /** Five steps or fewer; each target must be on the page. */
  steps: readonly TourStep[];
  open?: boolean;
  defaultOpen?: boolean;
  /** Called with `false` on «Готово», «Пропустить», × and Esc — remember that the tour was seen. */
  onOpenChange?: (open: boolean) => void;
}

function findTarget(target: TourStep['target']): Element | null {
  return typeof target === 'string' ? document.querySelector(target) : target();
}

const SPOTLIGHT_PADDING = 4;

/** Scrim with a cut-out in the target's shape (target + 4px); the target stays clickable, the rest of the page does not. */
function TourSpotlight({ target }: { target: TourStep['target'] }) {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const blockerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const spotlight = spotlightRef.current;
    const blocker = blockerRef.current;
    if (!spotlight || !blocker) return undefined;
    const element = findTarget(target);
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const place = () => {
      const rect = element?.getBoundingClientRect();
      // No target: a zero box mid-screen, its shadow still covers the page.
      const x = rect ? rect.left - SPOTLIGHT_PADDING : innerWidth / 2;
      const y = rect ? rect.top - SPOTLIGHT_PADDING : innerHeight / 2;
      const width = rect ? rect.width + SPOTLIGHT_PADDING * 2 : 0;
      const height = rect ? rect.height + SPOTLIGHT_PADDING * 2 : 0;
      const radius = element ? parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0 : 0;
      Object.assign(spotlight.style, {
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${radius + SPOTLIGHT_PADDING}px`,
      });
      const [right, bottom] = [x + width, y + height];
      blocker.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x}px ${y}px, ${right}px ${y}px, ${right}px ${bottom}px, ${x}px ${bottom}px, ${x}px ${y}px)`;
    };
    place();
    addEventListener('resize', place);
    addEventListener('scroll', place, true);
    return () => {
      removeEventListener('resize', place);
      removeEventListener('scroll', place, true);
    };
  }, [target]);

  return (
    <>
      <div ref={blockerRef} aria-hidden className="fixed inset-0 z-50" />
      <BasePopover.Backdrop
        ref={spotlightRef}
        data-slot="tour-spotlight"
        className="kv-backdrop pointer-events-none fixed z-50 shadow-[0_0_0_100vmax_var(--color-scrim)] transition-[left,top,width,height,border-radius,opacity] duration-(--duration-moderate) ease-standard"
      />
    </>
  );
}

/**
 * Guided walkthrough: one feature per step. The card sits 12px from a cut-out in the scrim and shows the step
 * counter, dots, «Назад» and «Далее»; arrows move between steps, Esc ends the tour.
 */
export function Tour({ steps, open, defaultOpen, onOpenChange }: TourProps) {
  const [index, setIndex] = useState(0);
  const actionsRef = useRef<BasePopover.Root.Actions>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const last = index === steps.length - 1;
  const go = (next: number) => setIndex(Math.min(Math.max(next, 0), steps.length - 1));

  return (
    <BasePopover.Root
      actionsRef={actionsRef}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next, details) => {
        // The tour ends only by choice: «Готово», «Пропустить», × or Esc.
        if (!next && (details.reason === 'outside-press' || details.reason === 'focus-out')) {
          details.cancel();
          return;
        }
        onOpenChange?.(next);
      }}
      onOpenChangeComplete={(next) => {
        if (!next) setIndex(0);
      }}
    >
      <BasePopover.Portal>
        {step ? (
          <>
            <TourSpotlight target={step.target} />
            {/* Keyed by step: Base UI resolves an anchor function once per mount. */}
            <BasePopover.Positioner
              key={index}
              anchor={() => findTarget(step.target)}
              side={step.side ?? 'bottom'}
              sideOffset={SPOTLIGHT_PADDING + 12}
              collisionPadding={16}
              className="z-50 outline-none"
            >
              <BasePopover.Popup
                ref={popupRef}
                data-slot="tour"
                // Focus starts on «Далее»: Enter walks the tour, the same button becomes «Готово».
                initialFocus={() => popupRef.current?.querySelector<HTMLElement>('[data-tour-next]') ?? true}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight') go(index + 1);
                  if (event.key === 'ArrowLeft') go(index - 1);
                }}
                className="kv-dialog flex w-80 max-w-(--available-width) flex-col gap-3 rounded-xl bg-overlay p-4 text-fg-1 shadow-modal outline-none"
              >
                <div className="flex h-7 items-center gap-3">
                  <span className="text-caption font-medium text-fg-3 tabular-nums">
                    {index + 1} из {steps.length}
                  </span>
                  <span aria-hidden className="flex flex-1 items-center gap-1">
                    {steps.map((_, dot) => (
                      <span
                        key={dot}
                        className={cn(
                          'h-1.5 rounded-full transition-[width,background-color] duration-(--duration-base) ease-standard',
                          dot === index ? 'w-4' : 'w-1.5',
                          dot <= index ? 'bg-accent' : 'bg-fill-3',
                        )}
                      />
                    ))}
                  </span>
                  <BasePopover.Close render={<CloseButton aria-label="Закрыть тур" className="-mr-1 size-7!" />} />
                </div>
                {/* Each step fades in (150ms) while the cut-out travels to the next target. */}
                <div key={index} className="flex flex-col gap-1 transition-opacity duration-(--duration-quick) ease-out starting:opacity-0">
                  <BasePopover.Title className="text-heading-xs font-semibold">{step.title}</BasePopover.Title>
                  <BasePopover.Description className="text-body-sm text-fg-2">{step.description}</BasePopover.Description>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {last ? null : (
                    <BasePopover.Close className="mr-auto rounded-xs text-label-sm font-medium text-fg-3 hover:text-fg-1">
                      Пропустить
                    </BasePopover.Close>
                  )}
                  {index > 0 ? (
                    <Button size="sm" variant="secondary" leadingIcon={<ChevronLeft />} className={cn(last && 'ml-auto')} onClick={() => go(index - 1)}>
                      Назад
                    </Button>
                  ) : null}
                  <Button
                    data-tour-next
                    size="sm"
                    trailingIcon={last ? undefined : <ChevronRight />}
                    className={cn(index === 0 && last && 'ml-auto')}
                    onClick={() => (last ? actionsRef.current?.close() : go(index + 1))}
                  >
                    {last ? 'Готово' : 'Далее'}
                  </Button>
                </div>
              </BasePopover.Popup>
            </BasePopover.Positioner>
          </>
        ) : null}
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
