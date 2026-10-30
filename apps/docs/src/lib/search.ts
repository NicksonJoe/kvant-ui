import { categories, isReady } from '@/kvant/meta';
import { SECTIONS } from '../components/sections';
import { DOC_PAGES, docPath } from '../pages/docs';
import { navComponents } from './registry';
import { TOKENS, TOKEN_GROUPS, tokenAnchor } from './tokens';

export type SearchKind = 'section' | 'doc' | 'doc-section' | 'component' | 'planned' | 'token';

export interface SearchEntry {
  id: string;
  label: string;
  hint?: string;
  keywords?: readonly string[];
  to: string;
  kind: SearchKind;
}

export interface SearchGroup {
  label: string;
  entries: readonly SearchEntry[];
}

/** Everything ⌘K can open: site sections, doc pages and their sections, components and tokens. */
export function searchIndex(): SearchGroup[] {
  return [
    {
      label: 'Разделы',
      entries: SECTIONS.map((section) => ({ id: `section-${section.to}`, label: section.label, to: section.to, kind: 'section' })),
    },
    {
      label: 'Документация',
      entries: DOC_PAGES.flatMap((page) => [
        { id: `doc-${page.slug}`, label: page.title, hint: page.group, keywords: [page.lead], to: docPath(page.slug), kind: 'doc' as const },
        ...page.sections.map((section) => ({
          id: `doc-${page.slug}-${section.id}`,
          label: section.title,
          hint: page.title,
          to: `${docPath(page.slug)}#${section.id}`,
          kind: 'doc-section' as const,
        })),
      ]),
    },
    {
      label: 'Компоненты',
      entries: categories.flatMap((category) =>
        navComponents(category).map((meta) => ({
          id: `component-${meta.id}`,
          label: meta.title,
          hint: isReady(meta) ? category.title : `${category.title} · скоро`,
          keywords: [meta.id, meta.description, ...(isReady(meta) ? meta.source.exports : [])],
          to: `/components/${meta.id}`,
          kind: isReady(meta) ? ('component' as const) : ('planned' as const),
        })),
      ),
    },
    {
      label: 'Токены',
      entries: TOKENS.map((token) => ({
        id: `token-${token.name}`,
        label: token.name,
        hint: TOKEN_GROUPS.find((group) => group.id === token.group)?.title,
        to: `/docs/tokens#${tokenAnchor(token.name)}`,
        kind: 'token',
      })),
    },
  ];
}
