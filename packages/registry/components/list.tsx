import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { Check, ChevronRight } from 'lucide-react';
import { createContext, use, useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type ListVariant = 'plain' | 'inset';
const ListContext = createContext<ListVariant>('plain');

export interface ListProps extends ComponentProps<'ul'> {
  /** plain: r20 container, rows 44 (52 on touch) · inset: iOS inset-grouped, r24, rows 52, text 16. */
  variant?: ListVariant;
  /** Group label above the rows; it also names the list. */
  header?: ReactNode;
  /** Note under the rows. */
  footer?: ReactNode;
}

/** Rows of one kind on a surface: settings, contacts, choices. Separators start at the text. */
export function List({ variant = 'plain', header, footer, className, children, ...props }: ListProps) {
  const id = useId();
  const list = (
    <ul
      data-slot="list"
      data-variant={variant}
      aria-labelledby={header ? id : undefined}
      className={cn(
        'flex flex-col overflow-hidden bg-surface-1 shadow-raised',
        variant === 'inset' ? 'rounded-2xl' : 'rounded-xl',
        !header && !footer && className,
      )}
      {...props}
    >
      <ListContext value={variant}>{children}</ListContext>
    </ul>
  );
  if (!header && !footer) return list;
  return (
    <section data-slot="list-group" className={cn('flex flex-col gap-2', className)}>
      {header ? (
        <h3 id={id} className="px-4 text-label-sm font-medium text-fg-3">
          {header}
        </h3>
      ) : null}
      {list}
      {footer ? <p className="px-4 text-body-xs text-fg-3">{footer}</p> : null}
    </section>
  );
}

export interface ListSectionHeaderProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: ReactNode;
  /** Counter after the title, read with it: «Просроченные шаги, 2». */
  count?: number;
  /** The counter counts problems: danger instead of fg-4. */
  urgent?: boolean;
  /** Link on the right, usually «Все»; name it when several sections share the word. */
  action?: ReactNode;
}

/** Phone section title 44 high over a list: 20/28 title, counter and «Все». */
export function ListSectionHeader({ title, count, urgent = false, action, className, ...props }: ListSectionHeaderProps) {
  return (
    <div data-slot="list-section-header" className={cn('flex h-11 items-center gap-2 pr-2 pl-4', className)} {...props}>
      <h3 className="flex min-w-0 items-baseline gap-2 text-heading-md font-semibold text-fg-1">
        <span className="truncate">{title}</span>
        {count !== undefined ? (
          <>
            <span className="sr-only">,</span>{' '}
            <span className={cn('font-medium tabular-nums', urgent ? 'text-danger-soft-fg' : 'text-fg-4')}>{count}</span>
          </>
        ) : null}
      </h3>
      {action ? (
        // the link itself fills the 44 zone, not just its text
        <span className="ml-auto flex h-11 shrink-0 text-[15px]/5 font-medium tracking-body text-accent-soft-fg *:flex *:items-center *:px-2">{action}</span>
      ) : null}
    </div>
  );
}

export interface ListItemProps extends Omit<useRender.ComponentProps<'div'>, 'title' | 'children'> {
  title: ReactNode;
  subtitle?: ReactNode;
  /** 32px slot: a 20px icon or a 32px avatar. Keeps text of neighbouring rows on one line. */
  leading?: ReactNode;
  /** Trailing text, fg-3 tabular. */
  value?: ReactNode;
  /** Trailing chevron: the row opens a screen or a picker. */
  chevron?: boolean;
  /** Choice row: a check instead of the chevron (the slot stays reserved when false). */
  selected?: boolean;
  /** Danger text and icon: «Удалить рабочее пространство». */
  destructive?: boolean;
  disabled?: boolean;
  /** A Switch or Checkbox on the right; the whole row toggles it. */
  control?: ReactNode;
  /** Makes the row a link; for a router pass `render={<Link to="…" />}`. */
  href?: string;
}

/**
 * Row: a link with `href`, a button with `onClick`, a label with `control`, otherwise static.
 * Hover fill-1, press fill-2, focus ring drawn inside the row.
 */
export function ListItem({
  title,
  subtitle,
  leading,
  value,
  chevron,
  selected,
  destructive,
  disabled,
  control,
  href,
  render,
  className,
  ...props
}: ListItemProps) {
  const variant = use(ListContext);
  const interactive = Boolean(control || href || props.onClick || render);
  const tag = control ? 'label' : href ? 'a' : interactive ? 'button' : 'div';
  const byTag =
    tag === 'button'
      ? { type: 'button', disabled, 'aria-pressed': selected }
      : tag === 'a'
        ? { href, 'aria-disabled': disabled || undefined }
        : {};

  const element = useRender({
    defaultTagName: tag,
    render,
    props: mergeProps<'div'>(
      {
        className: cn(
          'relative flex w-full select-none items-center gap-3 px-4 text-left focus-visible:-outline-offset-2',
          variant === 'inset' ? 'min-h-13 py-3' : 'min-h-11 py-2 pointer-coarse:min-h-13',
          interactive && 'cursor-pointer transition-colors duration-(--duration-micro) ease-hover hover:bg-fill-1 active:bg-fill-2',
          disabled && 'pointer-events-none opacity-50',
          destructive ? 'text-danger-soft-fg' : 'text-fg-1',
          className,
        ),
        children: (
          <>
            {leading ? (
              <span
                className={cn(
                  'grid w-8 shrink-0 place-items-center [&>svg]:size-5 [&>svg]:stroke-[1.5]',
                  destructive ? '[&>svg]:text-danger-soft-fg' : '[&>svg]:text-fg-2',
                )}
              >
                {leading}
              </span>
            ) : null}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={cn('truncate font-medium', variant === 'inset' ? 'text-label-lg' : 'text-label-md')}>{title}</span>
              {subtitle ? <span className={cn('truncate text-fg-3', variant === 'inset' ? 'text-body-sm' : 'text-caption')}>{subtitle}</span> : null}
            </span>
            {value !== undefined ? (
              <span className={cn('shrink-0 text-fg-3 tabular-nums', variant === 'inset' ? 'text-body-md' : 'text-body-sm')}>{value}</span>
            ) : null}
            {control}
            {selected !== undefined ? (
              <span className="grid w-4 shrink-0 place-items-center">{selected ? <Check aria-hidden className="size-4 stroke-[1.75] text-accent" /> : null}</span>
            ) : chevron ? (
              <ChevronRight aria-hidden className="size-4 shrink-0 stroke-[1.75] text-fg-4" />
            ) : null}
          </>
        ),
      },
      byTag,
      props,
    ),
  });

  return (
    <li
      data-slot="list-item"
      data-selected={selected || undefined}
      className={cn(
        'relative not-last:after:absolute not-last:after:right-0 not-last:after:bottom-0 not-last:after:h-px not-last:after:bg-separator',
        leading ? 'not-last:after:left-15' : 'not-last:after:left-4',
      )}
    >
      {element}
    </li>
  );
}
