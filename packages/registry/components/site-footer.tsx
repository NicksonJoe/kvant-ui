import { ArrowUpRight, ChevronDown, Globe } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Accordion, AccordionItem } from './accordion';
import { Button, buttonShape } from './button';
import { Input } from './input';
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from './menu';

export type SiteFooterVariant = 'full' | 'compact';
export type SiteFooterTone = 'success' | 'warning' | 'danger';

export interface SiteFooterStatus {
  tone: SiteFooterTone;
  /** What the dot means, for the screen reader: «всё работает». */
  label: string;
}

export interface SiteFooterLink {
  label: string;
  href: string;
  /** Another site: opens in a new tab, ↗ 12 fg-3 after the label. */
  external?: boolean;
  /** Counter after the label: «Вакансии 3». */
  count?: number;
  /** Dot 6 after the label: «Статус сервиса ●». */
  status?: SiteFooterStatus;
}

export interface SiteFooterColumn {
  title: string;
  /** No more than six. */
  links: readonly SiteFooterLink[];
}

export interface SiteFooterSocial {
  /** Accessible name: «Норда в Telegram». */
  label: string;
  href: string;
  icon: ReactNode;
}

const dotTone: Record<SiteFooterTone, string> = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' };

// Footer links: 500 fg-2; under the pointer fg-1 and a 1px border-coloured underline on the label only.
function FooterLink({ link, className }: { link: SiteFooterLink; className?: string }) {
  return (
    <a
      href={link.href}
      target={link.external ? '_blank' : undefined}
      rel={link.external ? 'noopener noreferrer' : undefined}
      className={cn(
        'group/link inline-flex items-center font-medium text-fg-2 transition-colors duration-(--duration-micro) ease-hover hover:text-fg-1',
        className,
      )}
    >
      <span className="decoration-border decoration-1 underline-offset-3 group-hover/link:underline">{link.label}</span>
      {link.external ? (
        <>
          <ArrowUpRight aria-hidden className="ml-1 size-3 shrink-0 stroke-2 text-fg-3" />
          <span className="sr-only"> (откроется в новой вкладке)</span>
        </>
      ) : null}
      {link.count === undefined ? null : (
        <span
          data-slot="site-footer-count"
          className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-fill-2 px-[5px] text-overline font-semibold text-fg-2 tabular-nums"
        >
          {link.count}
        </span>
      )}
      {link.status ? (
        <>
          <span aria-hidden className={cn('ml-2 size-1.5 shrink-0 rounded-full', dotTone[link.status.tone])} />
          <span className="sr-only">, {link.status.label}</span>
        </>
      ) : null}
    </a>
  );
}

// Circles 32 ghost, on a phone 44 on fill-1; fg-2, under the pointer fg-1. Text marks («VK») take 12/700, 13 on a phone.
const socialLink = cn(
  buttonShape({ size: 'sm', iconOnly: true }),
  'text-caption font-bold tracking-[-0.02em] text-fg-2 hover:bg-fill-1 hover:text-fg-1 active:bg-fill-2',
  '@max-[767px]:size-control-lg @max-[767px]:bg-fill-1 @max-[767px]:text-label-sm @max-[767px]:[&_svg]:size-4.5',
);

function Social({ items }: { items: readonly SiteFooterSocial[] }) {
  return (
    <div className="flex items-center gap-1">
      {items.map((item) => (
        <a key={item.href} data-slot="site-footer-social" href={item.href} aria-label={item.label} className={socialLink}>
          {item.icon}
        </a>
      ))}
    </div>
  );
}

export interface SiteFooterProps extends Omit<ComponentProps<'footer'>, 'children'> {
  /** full — landing and blog: brand, up to four columns, legal line · compact — one 64 row: docs, sign-in, checkout. */
  variant?: SiteFooterVariant;
  /** Logo link, the same as in the site header (compact: the mark only). */
  logo: ReactNode;
  /** One sentence under the logo (full). */
  description?: ReactNode;
  /** Newsletter under the description (full): `<SiteFooterSubscribe />`. */
  subscribe?: ReactNode;
  /** Link columns (full); below 768 they fold into an accordion. */
  columns?: readonly SiteFooterColumn[];
  /** A few links in one row (compact). */
  links?: readonly SiteFooterLink[];
  /** «© 2026 Норда · Сделано в Санкт-Петербурге». */
  legal: ReactNode;
  social?: readonly SiteFooterSocial[];
  /** Language switch on the right: `<SiteFooterLocale />`. */
  locale?: ReactNode;
}

/**
 * The pair of the site header: the same 1120 column (96 from the edges at 1312), the same logo and the same
 * 14/500 fg-2 links. A plain block at the end of the page — it does not animate in on scroll.
 */
export function SiteFooter({
  variant = 'full',
  logo,
  description,
  subscribe,
  columns = [],
  links = [],
  legal,
  social = [],
  locale,
  className,
  ...props
}: SiteFooterProps) {
  if (variant === 'compact') {
    return (
      <footer data-slot="site-footer" data-variant="compact" className={cn('@container', className)} {...props}>
        <div className="mx-auto box-content flex max-w-280 flex-wrap items-center gap-x-8 gap-y-2 px-5 py-4 @min-[768px]:h-16 @min-[768px]:flex-nowrap @min-[768px]:px-8 @min-[768px]:py-0">
          <div className="flex shrink-0 items-center gap-2">
            {logo}
            <p className="text-label-sm text-fg-3">{legal}</p>
          </div>
          <nav aria-label="Подвал" className="min-w-0 @max-[767px]:order-last @max-[767px]:basis-full @min-[768px]:flex-1">
            <ul className="flex flex-wrap items-center gap-0.5 @max-[767px]:-ml-3">
              {links.map((link) => (
                <li key={link.href}>
                  <FooterLink link={link} className="h-control-sm rounded-full px-3 text-label-md" />
                </li>
              ))}
            </ul>
          </nav>
          {social.length > 0 ? <Social items={social} /> : null}
          {locale}
        </div>
      </footer>
    );
  }

  return (
    <footer
      data-slot="site-footer"
      data-variant="full"
      className={cn('@container border-t border-separator', className)}
      {...props}
    >
      {/* Breakpoints follow the footer's own width, so a narrow preview folds like a phone; 1184 = 1120 + margins 32. */}
      <div className="mx-auto box-content max-w-280 px-5 pt-10 pb-9 @min-[768px]:px-8 @min-[768px]:pt-16 @min-[768px]:pb-8">
        <div className="flex flex-col gap-7 @min-[768px]:gap-12 @min-[1184px]:flex-row @min-[1184px]:items-start @min-[1184px]:gap-16">
          <div className="flex flex-col gap-7 @min-[1184px]:w-88 @min-[1184px]:shrink-0">
            <div className="flex flex-col gap-4 @min-[768px]:gap-5">
              <div className="flex">{logo}</div>
              {description ? <p className="text-body-sm text-fg-2 @min-[768px]:max-w-[32ch]">{description}</p> : null}
            </div>
            {subscribe}
          </div>
          <nav aria-label="Подвал" className="min-w-0 @min-[1184px]:flex-1">
            <div data-slot="site-footer-columns" className="flex items-start gap-8 @max-[767px]:hidden">
              {columns.map((column) => (
                <div key={column.title} className="flex min-w-0 flex-1 basis-0 flex-col gap-3.5">
                  <h2 className="pb-1 text-label-sm font-semibold text-fg-1">{column.title}</h2>
                  <ul className="flex flex-col gap-3.5">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <FooterLink link={link} className="rounded-[4px] text-label-md" />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {/* Phone: the same columns, one open at a time; rows 52, links 16/24 in 44 touch rows. */}
            <Accordion
              className={cn(
                '@min-[768px]:hidden',
                '[&_[data-slot=accordion-item]]:py-0',
                '[&_[data-slot=accordion-trigger]]:rounded-none [&_[data-slot=accordion-trigger]]:px-0 [&_[data-slot=accordion-trigger]]:text-label-lg [&_[data-slot=accordion-trigger]]:font-semibold',
                '[&_[data-slot=accordion-trigger]]:hover:bg-transparent [&_[data-slot=accordion-trigger]]:active:bg-transparent [&_[data-slot=accordion-trigger]>svg]:size-4.5',
                '[&_[data-slot=accordion-panel]>div]:max-w-none [&_[data-slot=accordion-panel]>div]:px-0 [&_[data-slot=accordion-panel]>div]:pb-0',
              )}
            >
              {columns.map((column) => (
                <AccordionItem key={column.title} value={column.title} title={column.title}>
                  <ul className="flex flex-col pb-2">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <FooterLink link={link} className="h-control-lg rounded-[4px] text-body-md" />
                      </li>
                    ))}
                  </ul>
                </AccordionItem>
              ))}
            </Accordion>
          </nav>
        </div>
        <div className="mt-7 flex flex-col gap-4 @min-[768px]:mt-14 @min-[768px]:flex-row @min-[768px]:items-center @min-[768px]:gap-6 @min-[768px]:border-t @min-[768px]:border-separator @min-[768px]:pt-6">
          <p className="text-caption text-fg-3 @max-[767px]:order-last @min-[768px]:flex-1 @min-[768px]:text-label-sm">{legal}</p>
          {social.length > 0 || locale ? (
            <div className="flex items-center gap-1 @min-[768px]:gap-6">
              {social.length > 0 ? <Social items={social} /> : null}
              {social.length > 0 && locale ? <span aria-hidden className="h-4 w-px bg-border @max-[767px]:hidden" /> : null}
              {locale ? <div className="@max-[767px]:ml-auto">{locale}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

type SubscribeStatus = 'idle' | 'sending' | 'done' | 'failed';

export interface SiteFooterSubscribeProps extends Omit<ComponentProps<'form'>, 'onSubmit' | 'title' | 'children'> {
  /** «Письмо раз в месяц: что нового в Норде». */
  title: ReactNode;
  /** Placeholder and accessible name of the field. */
  placeholder?: string;
  /** Button label. */
  action?: string;
  /** Line under the field (hidden on a phone): «Без рекламы. Отписаться — одна ссылка в письме.» */
  note?: ReactNode;
  /** What replaces the form once the address is sent. */
  done?: ReactNode;
  /** Send the address; a rejected promise keeps the form and shows the error line. */
  onSubscribe: (email: string) => void | Promise<void>;
}

/** Newsletter in the footer: field and button md 36 in a row, on a phone lg 44 stacked. */
export function SiteFooterSubscribe({
  title,
  placeholder = 'Рабочая почта',
  action = 'Подписаться',
  note,
  done = 'Проверьте почту',
  onSubscribe,
  className,
  ...props
}: SiteFooterSubscribeProps) {
  const noteId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<SubscribeStatus>('idle');
  const doneRef = useRef<HTMLParagraphElement>(null);

  // The form is gone: focus moves to the result, so the screen reader reads it and Tab continues from here.
  useEffect(() => {
    if (status === 'done') doneRef.current?.focus();
  }, [status]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      await onSubscribe(email.trim());
      setStatus('done');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <div data-slot="site-footer-subscribe" className={cn('flex flex-col gap-2', className)}>
      <p className="text-label-sm font-semibold text-fg-1 @max-[767px]:pb-1">{title}</p>
      {status === 'done' ? (
        <p
          ref={doneRef}
          tabIndex={-1}
          data-slot="site-footer-subscribe-done"
          className="flex h-control-md items-center text-label-md font-medium text-success-soft-fg outline-none @max-[767px]:h-control-lg"
        >
          {done}
        </p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-2" {...props}>
          <div className="flex flex-col gap-2 @min-[768px]:flex-row @min-[768px]:items-center">
            <Input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder={placeholder}
              aria-label={placeholder}
              aria-describedby={note || status === 'failed' ? noteId : undefined}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="@min-[768px]:flex-1 @max-[767px]:h-control-lg @max-[767px]:px-4 @max-[767px]:text-body-md"
            />
            <Button type="submit" loading={status === 'sending'} className="@max-[767px]:h-control-lg @max-[767px]:w-full @max-[767px]:px-5 @max-[767px]:text-label-lg">
              {action}
            </Button>
          </div>
          {status === 'failed' ? (
            <p id={noteId} role="alert" className="text-caption text-danger-soft-fg">
              Не получилось подписаться. Попробуйте ещё раз.
            </p>
          ) : note ? (
            <p id={noteId} className="text-caption text-fg-3 @max-[767px]:hidden">
              {note}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}

export interface SiteFooterLocaleOption {
  value: string;
  label: string;
}

export interface SiteFooterLocaleProps {
  value: string;
  options: readonly SiteFooterLocaleOption[];
  onValueChange: (value: string) => void;
  className?: string;
}

/** Language on the right of the bottom row: globe, name, chevron in a 32 capsule; on a phone 14/20 in a 44 row, no globe. */
export function SiteFooterLocale({ value, options, onValueChange, className }: SiteFooterLocaleProps) {
  const current = options.find((option) => option.value === value) ?? options[0];
  return (
    <Menu>
      <MenuTrigger
        aria-label={`Язык: ${current?.label ?? value}`}
        className={cn(
          'kv-pressable flex h-control-sm items-center gap-1 rounded-full pr-2 pl-2.5 text-label-sm font-medium text-fg-2 hover:bg-fill-1 hover:text-fg-1 active:bg-fill-2 aria-expanded:bg-fill-2',
          '@max-[767px]:h-control-lg @max-[767px]:px-0 @max-[767px]:text-label-md @max-[767px]:hover:bg-transparent @max-[767px]:active:bg-transparent @max-[767px]:aria-expanded:bg-transparent',
          className,
        )}
      >
        <Globe aria-hidden className="size-3.5 shrink-0 stroke-[1.75] @max-[767px]:hidden" />
        {current?.label ?? value}
        <ChevronDown aria-hidden className="size-3.5 shrink-0 stroke-2 text-fg-3" />
      </MenuTrigger>
      <MenuContent side="top" align="end">
        <MenuRadioGroup value={value} onValueChange={(next: string) => onValueChange(next)}>
          {options.map((option) => (
            <MenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}
