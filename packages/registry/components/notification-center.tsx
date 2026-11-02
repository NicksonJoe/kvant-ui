import { Popover as BasePopover } from '@base-ui/react/popover';
import { ArrowRight, Bell, CheckCheck } from 'lucide-react';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { CountBadge } from './badge';
import { buttonClasses } from './button';
import { PopoverContent } from './popover';

export interface NotificationItem {
  id: string;
  /** Day group label: «Сегодня», «Вчера», «28 октября». Items of one group go together. */
  group: string;
  /** The line itself; bold the actor and the object. */
  title: ReactNode;
  /** Quoted comment under the line. */
  quote?: ReactNode;
  /** «5 мин назад · Т-Банк». */
  meta: ReactNode;
  /** Avatar 32 or an icon circle. */
  leading?: ReactNode;
  unread?: boolean;
  /** Counts in the «Упоминания» tab. */
  mention?: boolean;
  /** Positive inline actions: «Принять». */
  actions?: ReactNode;
}

const TABS = [
  { id: 'all', label: 'Все', empty: 'Уведомлений пока нет', match: () => true },
  { id: 'unread', label: 'Непрочитанные', empty: 'Всё прочитано', match: (item: NotificationItem) => item.unread === true },
  { id: 'mentions', label: 'Упоминания', empty: 'Упоминаний нет', match: (item: NotificationItem) => item.mention === true },
] as const;
type TabId = (typeof TABS)[number]['id'];

export interface NotificationCenterProps {
  items: readonly NotificationItem[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onMarkAllRead?: () => void;
  onItemClick?: (id: string) => void;
  /** Link to the full inbox at the bottom of the panel. */
  footer?: ReactNode;
}

/**
 * Bell with an unread count and a 400-wide panel under it: tabs, items by day, inline actions.
 * The panel only shows; archiving and deleting belong to the full inbox.
 */
export function NotificationCenter({ items, open, defaultOpen, onOpenChange, onMarkAllRead, onItemClick, footer }: NotificationCenterProps) {
  const [tab, setTab] = useState<TabId>('all');
  const unread = items.filter((item) => item.unread).length;
  const current = TABS.find((entry) => entry.id === tab) ?? TABS[0];
  const shown = items.filter(current.match);
  const groups = [...new Set(shown.map((item) => item.group))];

  return (
    <BasePopover.Root open={open} defaultOpen={defaultOpen} onOpenChange={(next) => onOpenChange?.(next)}>
      <BasePopover.Trigger
        data-slot="notification-bell"
        aria-label={unread > 0 ? `Уведомления, ${unread} непрочитанных` : 'Уведомления'}
        className={cn(buttonClasses({ variant: 'ghost', size: 'md', iconOnly: true }), 'relative data-popup-open:bg-fill-2')}
      >
        <Bell aria-hidden />
        {unread > 0 ? <CountBadge aria-hidden count={unread} className="absolute -top-0.5 -right-0.5" /> : null}
      </BasePopover.Trigger>
      <PopoverContent align="end" className="max-h-[min(560px,var(--available-height))] w-100 gap-0 overflow-hidden rounded-2xl p-0">
        <div data-slot="notification-header" className="flex flex-col gap-3 border-b border-separator px-4 pt-4">
          <div className="flex items-center justify-between gap-2">
            <BasePopover.Title className="text-heading-xs font-semibold">Уведомления</BasePopover.Title>
            {unread > 0 && onMarkAllRead ? (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="flex h-7 items-center gap-1.5 rounded-full px-2 text-label-sm font-medium text-accent-soft-fg hover:bg-fill-1"
              >
                <CheckCheck aria-hidden className="size-4 stroke-[1.75]" />
                Прочитать всё
              </button>
            ) : null}
          </div>
          <div role="tablist" aria-label="Какие уведомления показать" className="flex gap-4">
            {TABS.map((entry) => {
              const count = entry.id === 'all' ? 0 : items.filter(entry.match).length;
              const selected = entry.id === tab;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setTab(entry.id)}
                  className={cn(
                    '-mb-px flex h-9 items-center gap-1.5 border-b-2 text-label-sm font-medium',
                    selected ? 'border-accent text-fg-1' : 'border-transparent text-fg-2 hover:text-fg-1',
                  )}
                >
                  {entry.label}
                  {count > 0 ? <span className="rounded-full bg-fill-2 px-1.5 text-caption text-fg-2 tabular-nums">{count}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
        <div role="tabpanel" data-slot="notification-list" className="min-h-0 flex-1 overflow-y-auto py-1">
          {shown.length === 0 ? <p className="px-4 py-10 text-center text-body-sm text-fg-3">{current.empty}</p> : null}
          {groups.map((group) => (
            <section key={group} aria-label={group}>
              <h3 className="px-4 pt-3 pb-1 text-caption font-medium text-fg-3">{group}</h3>
              {shown
                .filter((item) => item.group === group)
                .map((item) => (
                  <article key={item.id} data-slot="notification" data-unread={item.unread || undefined} className="flex items-start gap-3 px-4 py-2.5 hover:bg-fill-1">
                    <span className="flex size-8 shrink-0 items-center justify-center">{item.leading}</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <button type="button" onClick={() => onItemClick?.(item.id)} className="text-left text-body-sm text-fg-1 outline-offset-2">
                        {item.title}
                      </button>
                      {item.quote ? <p className="border-l-2 border-border pl-2 text-body-xs text-fg-2">{item.quote}</p> : null}
                      <p className="text-caption text-fg-3">{item.meta}</p>
                      {item.actions ? <div className="flex items-center gap-2 pt-1">{item.actions}</div> : null}
                    </div>
                    <span className="flex w-2 shrink-0 justify-center pt-1.5">
                      {item.unread ? (
                        <span className="size-2 rounded-full bg-accent">
                          <span className="sr-only">не прочитано</span>
                        </span>
                      ) : null}
                    </span>
                  </article>
                ))}
            </section>
          ))}
        </div>
        {footer ? (
          <div className="flex justify-center border-t border-separator p-2 text-label-sm font-medium text-accent-soft-fg [&_svg]:size-4">{footer}</div>
        ) : null}
      </PopoverContent>
    </BasePopover.Root>
  );
}

/** Footer link of the panel: «Все уведомления →». */
export function NotificationCenterLink({ className, children = 'Все уведомления', ...props }: ComponentProps<'a'>) {
  return (
    <a className={cn('flex h-8 items-center gap-1.5 rounded-full px-3 hover:bg-fill-1', className)} {...props}>
      {children}
      <ArrowRight aria-hidden />
    </a>
  );
}
