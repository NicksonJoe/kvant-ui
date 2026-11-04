import { Check, Sparkles } from 'lucide-react';
import { useId, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { pluralRu } from './canvas-check';
import { Spinner } from './spinner';

/* ---------- Colours and placement ---------- */

/** Participant colour 1–3 (not accent, warning or danger); more people cycle through the three. */
export type PresenceSlot = number;

const fallbacks = ['oklch(0.56 0.2 320)', 'oklch(0.55 0.12 215)', 'oklch(0.55 0.14 135)'] as const;

/** CSS colour of a participant: the presence token, with the Paper value as a fallback until the token ships. */
export function presenceColor(slot: PresenceSlot): string {
  const index = (((Math.trunc(slot) - 1) % 3) + 3) % 3;
  return `var(--color-presence-${index + 1}, ${fallbacks[index]})`;
}

const presenceFg = 'var(--color-presence-fg, oklch(0.995 0 0))';

/** Ring of a step someone else has selected: their colour 2 + a 16 % halo. For the node card. */
export function presenceRing(slot: PresenceSlot): CSSProperties {
  const color = presenceColor(slot);
  return { boxShadow: `0 0 0 2px ${color}, 0 0 0 6px color-mix(in oklab, ${color} 16%, transparent)` };
}

interface Placed {
  /** Graph coordinates: with both set the element is absolutely positioned in the engine's graph layer. */
  x?: number;
  y?: number;
}

const place = ({ x, y }: Placed, style?: CSSProperties): CSSProperties | undefined =>
  x === undefined || y === undefined ? style : { position: 'absolute', left: x, top: y, ...style };

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

/* ---------- Presence ---------- */

/** «Анна и Игорь здесь», «Анна, Игорь и ещё 3 здесь». */
export function presenceLabel(names: readonly string[]): string {
  if (names.length <= 1) return `${names[0] ?? 'Никого'} здесь`;
  if (names.length <= 3) return `${names.slice(0, -1).join(', ')} и ${names.at(-1)} здесь`;
  return `${names.slice(0, 2).join(', ')} и ещё ${names.length - 2} здесь`;
}

export interface CanvasCollaborator {
  id: string;
  name: string;
  /** Colour slot 1–3; default — by position in the list. */
  presence?: PresenceSlot;
}

export interface CanvasPresenceProps extends ComponentProps<'div'> {
  people: readonly CanvasCollaborator[];
}

/** Capsule in the canvas corner: faces of the people here and their names. */
export function CanvasPresence({ people, className, ...props }: CanvasPresenceProps) {
  return (
    <div data-slot="canvas-presence" className={cn('inline-flex h-8 items-center gap-2 rounded-full bg-surface-1 pr-2.5 pl-1 shadow-[0_0_0_1px_var(--color-border)]', className)} {...props}>
      <span aria-hidden className="flex -space-x-1">
        {people.slice(0, 3).map((person, index) => {
          const color = presenceColor(person.presence ?? index + 1);
          return (
            <span
              key={person.id}
              className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-fg-1 shadow-[0_0_0_2px_var(--color-surface-1)]"
              style={{ backgroundColor: `color-mix(in oklab, ${color} 22%, var(--color-surface-1))` }}
            >
              {initialsOf(person.name)}
            </span>
          );
        })}
      </span>
      <span className="text-caption text-fg-2">{presenceLabel(people.map((person) => person.name))}</span>
    </div>
  );
}

export interface CanvasCursorProps extends Omit<ComponentProps<'div'>, 'children'>, Placed {
  name: string;
  presence?: PresenceSlot;
}

/** Another person's pointer with their name; silent for screen readers — CanvasPresence says who is here. */
export function CanvasCursor({ name, presence = 1, x, y, className, style, ...props }: CanvasCursorProps) {
  const color = presenceColor(presence);
  return (
    <div
      aria-hidden
      data-slot="canvas-cursor"
      className={cn('pointer-events-none flex flex-col items-start gap-0.5 transition-[left,top] duration-(--duration-fast) ease-linear motion-reduce:transition-none', className)}
      style={place({ x, y }, style)}
      {...props}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]">
        <path d="M4 3 20 11l-7 2-3 7L4 3Z" fill={color} stroke="var(--color-surface-1)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className="flex h-5 items-center rounded-xs px-[7px] text-overline font-semibold whitespace-nowrap" style={{ backgroundColor: color, color: presenceFg }}>
        {name}
      </span>
    </div>
  );
}

export interface CanvasEditingLabelProps extends Omit<ComponentProps<'span'>, 'children'>, Placed {
  name: string;
  presence?: PresenceSlot;
}

/** «Игорь правит» over a step someone else has selected; the step is not locked. Pair with presenceRing. */
export function CanvasEditingLabel({ name, presence = 2, x, y, className, style, ...props }: CanvasEditingLabelProps) {
  return (
    <span
      data-slot="canvas-editing-label"
      className={cn('inline-flex h-5 items-center rounded-t-xs rounded-br-xs rounded-bl-[2px] px-[7px] text-overline font-semibold whitespace-nowrap', className)}
      style={place({ x, y }, { backgroundColor: presenceColor(presence), color: presenceFg, ...style })}
      {...props}
    >
      {name} правит
    </span>
  );
}

/* ---------- Sticky and comments ---------- */

export interface CanvasStickyProps extends ComponentProps<'div'>, Placed {
  author?: string;
  /** «2 мин назад». */
  time?: string;
  presence?: PresenceSlot;
}

/** Sticky note on the canvas: warning-soft, 200 wide, the author's initial in their colour. */
export function CanvasSticky({ author, time, presence = 1, x, y, className, style, children, ...props }: CanvasStickyProps) {
  return (
    <div
      role="note"
      data-slot="canvas-sticky"
      className={cn('flex w-[200px] flex-col gap-2 rounded-r-md rounded-tl-[4px] rounded-bl-md bg-warning-soft p-3 shadow-[0_1px_3px_color-mix(in_oklab,var(--color-fg-1)_8%,transparent)]', className)}
      style={place({ x, y }, style)}
      {...props}
    >
      <div className="text-body-xs text-fg-1">{children}</div>
      {author ? (
        <p className="flex items-center gap-1.5 text-overline font-medium text-warning-soft-fg">
          <span
            aria-hidden
            className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-fg-1"
            style={{ backgroundColor: `color-mix(in oklab, ${presenceColor(presence)} 22%, transparent)` }}
          >
            {initialsOf(author).charAt(0)}
          </span>
          {[author, time].filter(Boolean).join(' · ')}
        </p>
      ) : null}
    </div>
  );
}

export interface CanvasCommentPinProps extends Omit<ComponentProps<'button'>, 'children'>, Placed {
  /** Author of the last comment: their initials and colour. */
  author: string;
  count?: number;
  presence?: PresenceSlot;
}

/** 30 pin next to a step that has a comment thread. */
export function CanvasCommentPin({ author, count = 1, presence = 1, x, y, className, style, ...props }: CanvasCommentPinProps) {
  return (
    <button
      type="button"
      data-slot="canvas-comment-pin"
      aria-label={`Комментарии: ${count}, последний от ${author}`}
      className={cn(
        'kv-pressable grid size-[30px] place-items-center rounded-t-[15px] rounded-br-[15px] rounded-bl-[3px] text-overline font-bold text-fg-1 shadow-[0_0_0_2px_var(--color-surface-1),0_2px_6px_color-mix(in_oklab,var(--color-fg-1)_14%,transparent)] [--kv-press-scale:var(--scale-press-icon)]',
        className,
      )}
      style={place({ x, y }, { backgroundColor: `color-mix(in oklab, ${presenceColor(presence)} 22%, var(--color-surface-1))`, ...style })}
      {...props}
    >
      {initialsOf(author)}
    </button>
  );
}

export interface CanvasComment {
  id: string;
  author: string;
  /** «10 мин назад». */
  time: string;
  text: ReactNode;
}

export interface CanvasCommentThreadProps extends Omit<ComponentProps<'section'>, 'children'>, Placed {
  /** «Комментарии к «Есть бюджет?»». */
  'aria-label': string;
  comments: readonly CanvasComment[];
  onReply?: (text: string) => void;
  /** «Решено» hides the pin. */
  onResolve?: () => void;
  /** Esc closes the thread. */
  onClose?: () => void;
}

/** Comment thread at a step: 290 wide, newest last, a reply field and «Решено». */
export function CanvasCommentThread({ comments, onReply, onResolve, onClose, x, y, className, style, onKeyDown, ...props }: CanvasCommentThreadProps) {
  const [draft, setDraft] = useState('');
  const fieldId = useId();
  const send = () => {
    const text = draft.trim();
    if (!text || !onReply) return;
    onReply(text);
    setDraft('');
  };
  return (
    <section
      data-slot="canvas-comment-thread"
      className={cn('flex w-[290px] flex-col rounded-[14px] bg-overlay shadow-[0_0_0_1px_var(--color-border),0_12px_32px_color-mix(in_oklab,var(--color-fg-1)_12%,transparent)]', className)}
      style={place({ x, y }, style)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key === 'Escape' && onClose && !event.defaultPrevented) {
          event.preventDefault();
          onClose();
        }
      }}
      {...props}
    >
      {comments.map((comment) => (
        <article key={comment.id} className="flex flex-col gap-1 border-b border-separator px-3.5 py-3">
          <p className="flex items-center gap-1.5">
            <span className="text-caption font-semibold text-fg-1">{comment.author}</span>
            <span className="text-overline text-fg-3">{comment.time}</span>
          </p>
          <div className="text-body-xs text-fg-1">{comment.text}</div>
        </article>
      ))}
      <div className="flex h-control-lg shrink-0 items-center gap-2 pr-2 pl-3.5">
        {onReply ? (
          <>
            <label htmlFor={fieldId} className="sr-only">
              Ответить
            </label>
            <input
              id={fieldId}
              value={draft}
              placeholder="Ответить…"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
                event.preventDefault();
                send();
              }}
              className="min-w-0 flex-1 bg-transparent text-body-xs text-fg-1 outline-none placeholder:text-fg-3"
            />
          </>
        ) : (
          <span className="flex-1" />
        )}
        {onResolve ? (
          <Button variant="secondary" size="xs" onClick={onResolve}>
            Решено
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/* ---------- Agent builds the graph ---------- */

const graphSize = (steps: number, edges: number) => `${steps} ${pluralRu(steps, ['шаг', 'шага', 'шагов'])} и ${edges} ${pluralRu(edges, ['связь', 'связи', 'связей'])}`;

/** Ghost step the agent proposes: accent 5 % with a dashed 55 % outline. For the node card. */
export const CANVAS_GHOST_CLASS = 'bg-[color-mix(in_oklab,var(--color-accent)_5%,var(--color-surface-1))] outline-dashed outline-1 outline-[color-mix(in_oklab,var(--color-accent)_55%,transparent)] shadow-none';

export interface CanvasAgentPromptProps extends Omit<ComponentProps<'div'>, 'children'>, Placed {
  /** The task in words, as the person wrote it. */
  text: ReactNode;
  status: 'building' | 'done';
  steps?: number;
  edges?: number;
}

/** The request to Норда on the canvas and how far the build got. */
export function CanvasAgentPrompt({ text, status, steps = 0, edges = 0, x, y, className, style, ...props }: CanvasAgentPromptProps) {
  return (
    <div
      data-slot="canvas-agent-prompt"
      data-status={status}
      className={cn('flex w-[400px] max-w-full gap-2.5 rounded-md bg-surface-1 p-3 shadow-[0_0_0_1px_var(--color-border),0_4px_12px_color-mix(in_oklab,var(--color-fg-1)_6%,transparent)]', className)}
      style={place({ x, y }, style)}
      {...props}
    >
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-chart-7)_14%,transparent)] text-chart-7">
        <Sparkles className="size-3.5 stroke-2" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="text-[13px]/[19px] text-fg-1">{text}</div>
        <p role="status" className="flex items-center gap-1.5 text-caption font-medium text-accent-soft-fg">
          {status === 'building' ? <Spinner size={16} className="size-3 text-accent" /> : <Check aria-hidden className="size-3 stroke-[3] text-success-soft-fg" />}
          {status === 'building' ? 'Собираю граф…' : `Готово · ${graphSize(steps, edges)}`}
        </p>
      </div>
    </div>
  );
}

export interface CanvasAgentProposalProps extends Omit<ComponentProps<'section'>, 'children'> {
  steps: number;
  edges: number;
  /** Everything goes in as one history entry from Норда. */
  onAccept: () => void;
  /** Walk the ghosts one by one. */
  onStepwise?: () => void;
  onReject: () => void;
}

/** Bar under the ghost steps: accept all, one by one, or reject. */
export function CanvasAgentProposal({ steps, edges, onAccept, onStepwise, onReject, className, ...props }: CanvasAgentProposalProps) {
  const label = `Норда предлагает ${graphSize(steps, edges)}`;
  return (
    <section
      data-slot="canvas-agent-proposal"
      aria-label={label}
      className={cn('flex h-12 items-center justify-between gap-3 rounded-md bg-surface-1 pr-1.5 pl-4 shadow-[0_0_0_1px_var(--color-border),0_8px_24px_color-mix(in_oklab,var(--color-fg-1)_10%,transparent)]', className)}
      {...props}
    >
      <p className="truncate text-body-xs font-medium text-fg-1">{label}</p>
      <div className="flex shrink-0 gap-1.5">
        <Button variant="ghost" size="sm" onClick={onReject}>
          Отклонить
        </Button>
        {onStepwise ? (
          <Button variant="secondary" size="sm" onClick={onStepwise}>
            По одному
          </Button>
        ) : null}
        <Button size="sm" onClick={onAccept}>
          Принять всё
        </Button>
      </div>
    </section>
  );
}
