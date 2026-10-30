import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { ChevronDown } from 'lucide-react';
import { createContext, use, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import { Button } from './button';

export type AccordionVariant = 'plain' | 'inset';
const VariantContext = createContext<AccordionVariant>('plain');

// Height follows the content: 0 → auto in 200ms ease-standard, text fades in 50ms later; closing is 150ms.
const panelMotion =
  'overflow-hidden h-(--panel-height) [transition:height_var(--duration-base)_var(--ease-standard),opacity_var(--duration-quick)_var(--ease-out)_50ms] ' +
  'data-starting-style:h-0 data-starting-style:opacity-0 data-ending-style:h-0 data-ending-style:opacity-0 data-ending-style:[transition-duration:var(--duration-quick)] data-ending-style:[transition-delay:0ms]';

export interface AccordionProps<V extends string> extends Omit<BaseAccordion.Root.Props<V>, 'className'> {
  /** plain: rows on the page split by lines · inset: every item is its own card (settings, help). */
  variant?: AccordionVariant;
  className?: string;
}

/** One item open at a time by default; `multiple` lets several stay open. Enter / Space toggle, Tab moves on. */
export function Accordion<V extends string>({ variant = 'plain', className, ...props }: AccordionProps<V>) {
  return (
    <VariantContext value={variant}>
      <BaseAccordion.Root
        data-slot="accordion"
        data-variant={variant}
        className={cn(variant === 'plain' ? 'flex flex-col border-t border-separator' : 'flex flex-col gap-2', className)}
        {...props}
      />
    </VariantContext>
  );
}

export interface AccordionItemProps extends Omit<BaseAccordion.Item.Props, 'className' | 'title'> {
  title: ReactNode;
  /** Inset variant: 18px icon in a 36 circle before the title. */
  icon?: ReactNode;
  className?: string;
}

export function AccordionItem({ title, icon, className, children, ...props }: AccordionItemProps) {
  const variant = use(VariantContext);
  const inset = variant === 'inset';
  return (
    <BaseAccordion.Item
      data-slot="accordion-item"
      className={cn(
        'group/item',
        inset ? 'rounded-lg bg-surface-1 p-1 shadow-raised data-disabled:opacity-50' : 'border-b border-separator py-1',
        className,
      )}
      {...props}
    >
      <BaseAccordion.Header className="m-0">
        <BaseAccordion.Trigger
          data-slot="accordion-trigger"
          className={cn(
            'kv-pressable flex min-h-13 w-full items-center gap-3 rounded-md px-3 text-left text-[15px]/5 font-medium text-fg-1 [--kv-press-scale:1]',
            'hover:bg-fill-1 active:bg-fill-2 data-disabled:pointer-events-none',
            !inset && 'data-disabled:opacity-50',
          )}
        >
          {inset && icon ? (
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-fg-2 transition-colors duration-(--duration-base) group-data-open/item:bg-accent-soft group-data-open/item:text-accent-soft-fg [&_svg]:size-4.5 [&_svg]:stroke-[1.75]"
            >
              {icon}
            </span>
          ) : null}
          <span className="flex min-w-0 flex-1 items-center gap-2">{title}</span>
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 stroke-[1.75] text-fg-3 transition-[rotate,color] duration-(--duration-base) ease-standard group-hover/item:text-fg-1 group-data-open/item:rotate-180 group-data-open/item:text-fg-2"
          />
        </BaseAccordion.Trigger>
      </BaseAccordion.Header>
      <BaseAccordion.Panel data-slot="accordion-panel" className={cn(panelMotion, '[--panel-height:var(--accordion-panel-height)]')}>
        <div className={cn('max-w-[72ch] pb-4 text-body-sm text-fg-2', inset ? (icon ? 'pr-3 pl-15' : 'px-3') : 'px-3')}>{children}</div>
      </BaseAccordion.Panel>
    </BaseAccordion.Item>
  );
}

export interface CollapsibleProps extends Omit<BaseCollapsible.Root.Props, 'className' | 'title'> {
  title: ReactNode;
  /** Hint under the title that tells what is inside, so the block is not opened for one line. */
  summary?: ReactNode;
  /** Hint while open, e.g. «Проверены по ЕГРЮЛ 27.10.2026». */
  openSummary?: ReactNode;
  className?: string;
}

/** One rarely needed section inside a card. Only the «Показать / Скрыть» button toggles it. */
export function Collapsible({
  title,
  summary,
  openSummary,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
  ...props
}: CollapsibleProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen);
  return (
    <BaseCollapsible.Root
      data-slot="collapsible"
      open={open}
      onOpenChange={(next, details) => {
        setOpen(next);
        onOpenChange?.(next, details);
      }}
      className={cn('flex flex-col rounded-xl bg-surface-1 p-5 shadow-raised', className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-heading-xs font-semibold text-fg-1">{title}</h3>
          {summary ? <p className="text-body-xs text-fg-3">{open ? openSummary ?? summary : summary}</p> : null}
        </div>
        <BaseCollapsible.Trigger
          render={<Button variant="ghost" size="sm" trailingIcon={<ChevronDown />} />}
          className="-mr-2 [&_svg]:transition-[rotate] [&_svg]:duration-(--duration-base) [&_svg]:ease-standard data-panel-open:[&_svg]:rotate-180"
        >
          {open ? 'Скрыть' : 'Показать'}
        </BaseCollapsible.Trigger>
      </div>
      <BaseCollapsible.Panel data-slot="collapsible-panel" className={cn(panelMotion, '[--panel-height:var(--collapsible-panel-height)]')}>
        <div className="mt-4 border-t border-separator pt-4">{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
