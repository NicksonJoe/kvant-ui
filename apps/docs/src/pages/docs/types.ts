import type { ReactNode } from 'react';
import type { PaperBoardId } from '@/kvant/meta';

export interface DocSection {
  id: string;
  title: string;
  content: ReactNode;
}

export interface DocPageDef {
  /** '' is the docs home (/docs). */
  slug: string;
  title: string;
  lead: string;
  boards?: readonly PaperBoardId[];
  sections: readonly DocSection[];
}
