import { useRender } from '@base-ui/react/use-render';
import { ChevronLeft, ChevronRight, Ellipsis, Folder } from 'lucide-react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Menu, MenuContent, MenuItem, MenuTrigger } from './menu';

export interface BreadcrumbItem {
  label: string;
  /** Not needed for the last item: it is the current page. */
  href?: string;
  /** 14px icon, usually only for the root («Главная»). */
  icon?: ReactNode;
  /** Router link instead of <a>: `<Link to="…" />`. */
  render?: ReactElement;
}

export interface BreadcrumbProps extends Omit<ComponentProps<'nav'>, 'children'> {
  /** From the root to the current page (last). */
  items: readonly BreadcrumbItem[];
  /** Visible slots: longer paths keep the root, «…» and the last `max − 2` items; the middle goes into the menu. */
  max?: number;
}

const link =
  'kv-pressable inline-flex h-6 items-center gap-1 rounded-full px-1 text-fg-3 decoration-1 underline-offset-3 [--kv-press-scale:1] hover:text-fg-1 hover:underline active:bg-fill-2 [&_svg]:size-3.5 [&_svg]:stroke-[1.75]';

function CrumbLink({ item, label, className, children }: { item: BreadcrumbItem; label?: string; className?: string; children: ReactNode }) {
  return useRender({ defaultTagName: 'a', render: item.render, props: { href: item.href, 'aria-label': label, className, children } });
}

/** Path from the root to the current page. On phones (<640) only one step back is left. */
export function Breadcrumb({ items, max = 4, className, ...props }: BreadcrumbProps) {
  const current = items[items.length - 1];
  const parent = items[items.length - 2];
  const collapse = items.length > max;
  const head = collapse ? items.slice(0, 1) : items.slice(0, -1);
  // the root, «…» and the last `max − 2` items (the current page included) stay visible
  const hidden = collapse ? items.slice(1, items.length - (max - 2)) : [];
  const tail = collapse ? items.slice(items.length - (max - 2), -1) : [];
  const separator = <ChevronRight aria-hidden className="size-3 shrink-0 stroke-[1.75] text-fg-4" />;

  const crumb = (item: BreadcrumbItem) => (
    <li key={item.label} className="flex min-w-0 items-center gap-1">
      <CrumbLink item={item} className={link}>
        {item.icon}
        <span className="truncate">{item.label}</span>
      </CrumbLink>
      {separator}
    </li>
  );

  return (
    <nav data-slot="breadcrumb" aria-label="Путь" className={cn('min-w-0 text-label-sm', className)} {...props}>
      <ol className="flex min-w-0 items-center gap-1 max-sm:hidden">
        {head.map(crumb)}
        {hidden.length > 0 ? (
          <li className="flex items-center gap-1">
            <Menu>
              <MenuTrigger
                aria-label="Скрытые разделы"
                className="kv-pressable grid h-6 w-7 place-items-center rounded-full text-fg-3 hover:bg-fill-1 hover:text-fg-1 active:bg-fill-2 aria-expanded:bg-fill-2 [&_svg]:size-4"
              >
                <Ellipsis aria-hidden />
              </MenuTrigger>
              <MenuContent>
                {hidden.map((item) => (
                  <MenuItem key={item.label} icon={item.icon ?? <Folder />} render={item.render ?? <a href={item.href} />}>
                    {item.label}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
            {separator}
          </li>
        ) : null}
        {tail.map(crumb)}
        {current ? (
          <li className="flex min-w-0 items-center px-1">
            <span aria-current="page" className="truncate font-medium text-fg-1">
              {current.label}
            </span>
          </li>
        ) : null}
      </ol>
      {parent ? (
        <CrumbLink
          item={parent}
          label={`Назад: ${parent.label}`}
          className="kv-pressable -ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-label-md font-medium text-fg-1 sm:hidden [&_svg]:size-4 [&_svg]:stroke-[1.75]"
        >
          <ChevronLeft aria-hidden />
          {parent.label}
        </CrumbLink>
      ) : null}
    </nav>
  );
}
