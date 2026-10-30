import type { ReactNode } from 'react';
import { Outlet } from 'react-router';
import { Toc, type TocItem } from '../components/Toc';

/** Docs and components: section navigation on the left (a sheet below lg), page on the right. */
export function SidebarLayout({ nav }: { nav: ReactNode }) {
  return (
    <div className="flex">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-separator px-3 pt-6 pb-12 lg:block">
        {nav}
      </aside>
      <main id="content" className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

/** Page column with the «На странице» table of contents on wide screens. */
export function PageShell({ toc = [], children }: { toc?: readonly TocItem[]; children: ReactNode }) {
  return (
    <div className="flex gap-12 px-4 pt-8 pb-16 sm:px-8 lg:px-12 lg:pt-10">
      <article className="flex min-w-0 flex-1 flex-col gap-10">{children}</article>
      <Toc items={toc} />
    </div>
  );
}
