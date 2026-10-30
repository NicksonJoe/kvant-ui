import { color } from './color';
import { iconsPage } from './icons';
import { layers, shape, spacingPage } from './layout';
import { motion } from './motion';
import { installation, introduction, principles } from './start';
import { states } from './states';
import { tokensPage } from './tokens';
import type { DocPageDef } from './types';
import { typography } from './typography';

export type { DocPageDef } from './types';

export const DOC_GROUPS: readonly { title: string; pages: readonly DocPageDef[] }[] = [
  { title: 'Начало', pages: [introduction, installation, principles] },
  { title: 'Основы', pages: [color, typography, spacingPage, shape, layers, iconsPage, motion, states] },
  { title: 'Справочник', pages: [tokensPage] },
];

export const DOC_PAGES: readonly (DocPageDef & { group: string })[] = DOC_GROUPS.flatMap((group) =>
  group.pages.map((page) => ({ ...page, group: group.title })),
);

export function docPath(slug: string): string {
  return slug ? `/docs/${slug}` : '/docs';
}
