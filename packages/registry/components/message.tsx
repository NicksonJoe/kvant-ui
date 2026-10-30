import { Check, CheckCheck, CircleAlert, Clock3 } from 'lucide-react';
import { Children, createContext, use, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
type Position = 'single' | 'first' | 'middle' | 'last';

const GroupContext = createContext<{ direction: MessageDirection; position: Position; avatar?: ReactNode } | null>(null);

// Inner corners of a group shrink to 6, outer ones stay 20.
const corners: Record<MessageDirection, Record<Position, string>> = {
  incoming: { single: '', first: 'rounded-bl-xs', middle: 'rounded-l-xs', last: 'rounded-tl-xs' },
  outgoing: { single: '', first: 'rounded-br-xs', middle: 'rounded-r-xs', last: 'rounded-tr-xs' },
};

const statusText: Record<MessageStatus, string> = {
  sending: 'Отправляется',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Не отправлено',
};

function StatusIcon({ status }: { status: MessageStatus }) {
  const Icon = status === 'sending' ? Clock3 : status === 'sent' ? Check : CheckCheck;
  return status === 'failed' ? null : (
    <>
      <Icon aria-hidden className={cn('size-3.5 stroke-[1.75] transition-opacity duration-(--duration-quick) starting:opacity-0', status === 'read' && 'stroke-[2.25]')} />
      <span className="sr-only">{statusText[status]}</span>
    </>
  );
}

export interface MessageGroupProps extends ComponentProps<'div'> {
  direction?: MessageDirection;
  /** Name over the first incoming bubble. */
  author?: ReactNode;
  /** Avatar (28) next to the last incoming bubble. */
  avatar?: ReactNode;
}

/** Consecutive messages of one author: name over the first, avatar and time at the last; 2px between bubbles. */
export function MessageGroup({ direction = 'incoming', author, avatar, className, children, ...props }: MessageGroupProps) {
  const items = Children.toArray(children);
  const position = (index: number): Position =>
    items.length === 1 ? 'single' : index === 0 ? 'first' : index === items.length - 1 ? 'last' : 'middle';
  return (
    <div
      data-slot="message-group"
      data-direction={direction}
      className={cn('flex flex-col gap-0.5', direction === 'outgoing' ? 'items-end' : 'items-start', className)}
      {...props}
    >
      {author && direction === 'incoming' ? <p className={cn('pb-1 text-caption text-fg-3', avatar !== undefined && 'pl-9')}>{author}</p> : null}
      {items.map((item, index) => (
        <GroupContext key={index} value={{ direction, position: position(index), avatar }}>
          {item}
        </GroupContext>
      ))}
    </div>
  );
}

export interface MessageProps extends Omit<ComponentProps<'div'>, 'children'> {
  children: ReactNode;
  /** Inside a MessageGroup the group decides. */
  direction?: MessageDirection;
  /** «14:02», shown at the end of the text. */
  time?: string;
  /** Outgoing delivery state; «failed» dims the bubble and offers a retry. */
  status?: MessageStatus;
  onRetry?: () => void;
  /** Under the bubble, e.g. «Прочитано в 14:08» or MessageReaction chips. */
  footer?: ReactNode;
}

/** Bubble p 8/12, r20, 14/20, max 440 wide. Incoming on surface-2, outgoing on accent. New messages rise 8px. */
export function Message({ children, direction: own, time, status, onRetry, footer, className, ...props }: MessageProps) {
  const group = use(GroupContext);
  const direction = group?.direction ?? own ?? 'incoming';
  const position = group?.position ?? 'single';
  const outgoing = direction === 'outgoing';
  const showAvatar = !outgoing && group?.avatar !== undefined;
  const failed = status === 'failed';

  return (
    <div
      data-slot="message"
      data-direction={direction}
      data-position={position}
      className={cn(
        'flex w-full items-end gap-2 transition-[opacity,translate] duration-(--duration-base) ease-out starting:translate-y-(--shift-md) starting:opacity-0',
        outgoing && 'justify-end',
        className,
      )}
      {...props}
    >
      {showAvatar ? <span className="flex w-7 shrink-0 justify-center">{position === 'last' || position === 'single' ? group?.avatar : null}</span> : null}
      <div className={cn('flex max-w-110 min-w-0 flex-col gap-1', outgoing ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-xl px-3 py-2 text-body-sm break-words whitespace-pre-wrap',
            outgoing ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-fg-1',
            corners[direction][position],
            failed && 'opacity-50',
          )}
        >
          {children}
          {time || (status && !failed) ? (
            <span
              className={cn(
                'ml-2 inline-flex translate-y-px items-center gap-1 align-baseline text-[11px]/4 tabular-nums',
                outgoing ? 'text-[color-mix(in_oklab,var(--color-accent-fg)_72%,transparent)]' : 'text-fg-3',
              )}
            >
              {time}
              {status ? <StatusIcon status={status} /> : null}
            </span>
          ) : null}
        </div>
        {failed ? (
          <p className="flex items-center gap-1 text-caption text-danger-soft-fg">
            <CircleAlert aria-hidden className="size-3.5 stroke-[1.75]" />
            Не отправлено
            {onRetry ? (
              <>
                <span aria-hidden className="text-fg-3">
                  ·
                </span>
                <button type="button" onClick={onRetry} className="rounded-xs font-medium text-accent-soft-fg hover:underline">
                  Повторить
                </button>
              </>
            ) : null}
          </p>
        ) : null}
        {footer}
      </div>
    </div>
  );
}

export interface MessageReactionProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** Icon of the reaction, not an emoji: <Heart />, <ThumbsUp />. */
  icon: ReactNode;
  count: number;
  /** Name for screen readers: «Сердце». */
  label: string;
  /** My reaction: accent-soft with an accent ring. */
  selected?: boolean;
}

/** Reaction chip 24 high under a bubble; pops on the bouncy spring when added. */
export function MessageReaction({ icon, count, label, selected = false, className, ...props }: MessageReactionProps) {
  return (
    <button
      type="button"
      data-slot="message-reaction"
      aria-pressed={selected}
      aria-label={`${label}: ${count}`}
      className={cn(
        'kv-pressable inline-flex h-6 items-center gap-1 rounded-full px-2 text-caption font-medium tabular-nums [&_svg]:size-3.5 [&_svg]:stroke-[1.75]',
        'transition-[scale,background-color] [transition-timing-function:var(--ease-spring-10)] starting:scale-50',
        selected
          ? 'bg-accent-soft text-accent-soft-fg shadow-[inset_0_0_0_1px_var(--color-accent)]'
          : 'bg-surface-1 text-fg-2 shadow-control hover:bg-control-hover',
        className,
      )}
      {...props}
    >
      {icon}
      {count}
    </button>
  );
}

export interface ChatDividerProps extends ComponentProps<'div'> {
  /** day: date chip · unread: accent lines around «2 новых сообщения». */
  variant?: 'day' | 'unread';
}

export function ChatDivider({ variant = 'day', className, children, ...props }: ChatDividerProps) {
  return (
    <div
      data-slot="chat-divider"
      role="separator"
      className={cn('flex items-center gap-3 py-1 text-caption', variant === 'unread' && 'font-medium text-accent-soft-fg', className)}
      {...props}
    >
      {variant === 'unread' ? (
        <>
          <span aria-hidden className="h-px flex-1 bg-[color-mix(in_oklab,var(--color-accent)_40%,transparent)]" />
          {children}
          <span aria-hidden className="h-px flex-1 bg-[color-mix(in_oklab,var(--color-accent)_40%,transparent)]" />
        </>
      ) : (
        <span className="mx-auto rounded-full bg-fill-2 px-2.5 py-1 font-medium text-fg-2">{children}</span>
      )}
    </div>
  );
}

export interface TypingIndicatorProps extends ComponentProps<'div'> {
  avatar?: ReactNode;
  /** «Анна печатает…». */
  children?: ReactNode;
}

/** Three dots waving in opacity (1200ms, 150ms apart); still under reduced motion. */
export function TypingIndicator({ avatar, className, children, ...props }: TypingIndicatorProps) {
  return (
    <div data-slot="typing-indicator" role="status" className={cn('flex items-center gap-2', className)} {...props}>
      {avatar !== undefined ? <span className="flex w-7 shrink-0 justify-center">{avatar}</span> : null}
      <span aria-hidden className="kv-typing flex h-9 items-center gap-1 rounded-xl bg-surface-2 px-3.5">
        <span className="size-1.5 rounded-full bg-fg-3" />
        <span className="size-1.5 rounded-full bg-fg-3" />
        <span className="size-1.5 rounded-full bg-fg-3" />
      </span>
      {children ? <span className="text-caption text-fg-3">{children}</span> : null}
    </div>
  );
}
