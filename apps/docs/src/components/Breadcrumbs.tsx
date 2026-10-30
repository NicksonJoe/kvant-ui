import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from 'react-router';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  return (
    <nav aria-label="Хлебные крошки">
      <ol className="flex flex-wrap items-center gap-1.5 text-label-sm text-fg-3">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 ? <ChevronRight aria-hidden className="size-3 shrink-0 stroke-[1.75] text-fg-4" /> : null}
            <li>
              {index === items.length - 1 ? (
                <span aria-current="page" className="font-medium text-fg-1">
                  {item.label}
                </span>
              ) : item.to ? (
                <Link to={item.to} className="rounded-xs hover:text-fg-1">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
