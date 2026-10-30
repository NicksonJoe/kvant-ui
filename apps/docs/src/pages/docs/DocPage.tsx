import { ExternalLink } from 'lucide-react';
import { useParams } from 'react-router';
import { Button } from '@/kvant';
import { PAPER_BOARDS, PAPER_FILE_URL } from '@/kvant/meta';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { PrevNext } from '../../components/PrevNext';
import { PageShell } from '../../layouts/SidebarLayout';
import { NotFound } from '../NotFound';
import { DOC_PAGES, docPath } from '.';

export function DocRoute() {
  const { slug = '' } = useParams();
  const index = DOC_PAGES.findIndex((page) => page.slug === slug);
  const page = DOC_PAGES[index];
  if (!page) return <NotFound />;

  const prev = DOC_PAGES[index - 1];
  const next = DOC_PAGES[index + 1];

  return (
    <PageShell toc={page.sections.map((section) => ({ id: section.id, title: section.title }))}>
      <header className="flex flex-col gap-4">
        <Breadcrumbs items={[{ label: 'Документация', to: '/docs' }, { label: page.group }, { label: page.title }]} />
        <h1 className="text-display-sm font-semibold text-fg-1">{page.title}</h1>
        <p className="max-w-[72ch] text-body-lg text-fg-2">{page.lead}</p>
        {page.boards ? (
          <div className="flex flex-wrap gap-2">
            {page.boards.map((board) => (
              <Button
                key={board}
                size="xs"
                variant="secondary"
                trailingIcon={<ExternalLink />}
                render={<a href={PAPER_FILE_URL} target="_blank" rel="noreferrer" />}
                nativeButton={false}
              >
                Paper · {PAPER_BOARDS[board]}
              </Button>
            ))}
          </div>
        ) : null}
      </header>
      {page.sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id} className="flex flex-col gap-5">
          <h2 id={section.id} className="text-heading-lg font-semibold text-fg-1">
            {section.title}
          </h2>
          {section.content}
        </section>
      ))}
      <PrevNext
        prev={prev ? { to: docPath(prev.slug), title: prev.title, caption: prev.group } : undefined}
        next={next ? { to: docPath(next.slug), title: next.title, caption: next.group } : undefined}
      />
    </PageShell>
  );
}
