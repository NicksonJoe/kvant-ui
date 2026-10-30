import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Activity feed grouped by days; days are separated by a line. */
export function Timeline({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline"
      className={cn('flex flex-col gap-4 [&>section+section]:border-t [&>section+section]:border-separator [&>section+section]:pt-4', className)}
      {...props}
    />
  );
}

export interface TimelineDayProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** «Сегодня», «Вчера», «27 октября». */
  label: ReactNode;
  children: ReactNode;
}

export function TimelineDay({ label, className, children, ...props }: TimelineDayProps) {
  const id = useId();
  return (
    <section data-slot="timeline-day" className={cn('flex flex-col gap-3', className)} {...props}>
      <h3 id={id} className="text-caption font-medium text-fg-3">
        {label}
      </h3>
      <ol aria-labelledby={id} className="flex flex-col">
        {children}
      </ol>
    </section>
  );
}

export interface TimelineItemProps extends Omit<ComponentProps<'li'>, 'children'> {
  /** Shown in mono so the column does not jump: «14:32». */
  time: string;
  /** Machine-readable moment for <time>, e.g. `2026-10-29T14:32`. */
  dateTime?: string;
  /** The newest event: accent dot with a soft ring. */
  latest?: boolean;
  /** The event sentence; wrap names in <b>. */
  children: ReactNode;
  /** Secondary line under the event: amount, document, source. */
  description?: ReactNode;
  /** Extra block: stage badges, a comment bubble, a file chip. */
  details?: ReactNode;
}

/** Dot 10 on a 1px rail that links the events of one day. New events rise 8px and fade in. */
export function TimelineItem({ time, dateTime, latest, children, description, details, className, ...props }: TimelineItemProps) {
  return (
    <li
      data-slot="timeline-item"
      data-latest={latest || undefined}
      className={cn(
        'group/item relative flex gap-3 pb-5 last:pb-0',
        'transition-[opacity,translate] duration-(--duration-base) ease-out starting:translate-y-(--shift-md) starting:opacity-0',
        className,
      )}
      {...props}
    >
      <span aria-hidden className="absolute top-4 bottom-0 left-[4.5px] w-px bg-separator group-last/item:hidden" />
      <span
        aria-hidden
        className={cn(
          'relative mt-[5px] size-2.5 shrink-0 rounded-full',
          latest ? 'bg-accent shadow-[0_0_0_3px_var(--color-accent-soft)]' : 'bg-surface-1 shadow-[inset_0_0_0_2px_var(--color-fg-4)]',
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start gap-3">
          <p className="min-w-0 flex-1 text-body-sm text-fg-2 [&_b]:font-medium [&_b]:text-fg-1">{children}</p>
          <time dateTime={dateTime} className="w-11 shrink-0 text-right font-mono text-caption text-fg-3">
            {time}
          </time>
        </div>
        {description ? <p className="text-body-xs text-fg-3">{description}</p> : null}
        {details ? <div className="flex flex-wrap items-center gap-2 pt-1">{details}</div> : null}
      </div>
    </li>
  );
}
