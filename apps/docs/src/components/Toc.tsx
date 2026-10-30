import { useEffect, useState } from 'react';
import { cn } from '@/kvant';

export interface TocItem {
  id: string;
  title: string;
  level?: 2 | 3;
}

/** «На странице»: anchors with scroll-spy. Items are data, the page renders matching ids. */
export function Toc({ items }: { items: readonly TocItem[] }) {
  const [active, setActive] = useState<string | undefined>(undefined);
  const ids = items.map((item) => item.id).join(' ');

  useEffect(() => {
    const elements = ids
      .split(' ')
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (first) setActive(first.target.id);
      },
      { rootMargin: '-72px 0px -65% 0px' },
    );
    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [ids]);

  if (items.length === 0) return null;
  // before the first heading reaches the spy zone, the page is «at» its first section
  const current = active ?? items[0]?.id;
  return (
    <nav aria-label="На странице" className="sticky top-20 hidden max-h-[calc(100dvh-7rem)] w-52 shrink-0 self-start overflow-y-auto xl:block">
      <p className="mb-3 text-caption font-medium text-fg-3">На странице</p>
      <ul className="flex flex-col border-l border-separator">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={current === item.id ? 'location' : undefined}
              className={cn(
                '-ml-px block border-l py-1 text-body-xs transition-colors duration-(--duration-micro) ease-hover',
                item.level === 3 ? 'pl-6' : 'pl-3',
                current === item.id ? 'border-accent text-fg-1' : 'border-transparent text-fg-3 hover:text-fg-1',
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
