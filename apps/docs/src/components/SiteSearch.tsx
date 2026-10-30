import {
  BookOpen,
  CircleDashed,
  Component,
  FileText,
  FlaskConical,
  Hash,
  LayoutGrid,
  ListChecks,
  Moon,
  Palette,
  PanelsTopLeft,
  Sun,
  Variable,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ACCENTS, CommandPalette, type CommandGroup } from '@/kvant';
import { ACCENT_NAMES, useEnvironment } from '../lib/environment';
import { searchIndex, type SearchEntry, type SearchKind } from '../lib/search';
import type { SECTIONS } from './sections';

const sectionIcons: Record<(typeof SECTIONS)[number]['to'], ReactNode> = {
  '/docs': <BookOpen />,
  '/components': <LayoutGrid />,
  '/blocks': <PanelsTopLeft />,
  '/playground': <FlaskConical />,
  '/themes': <Palette />,
  '/check': <ListChecks />,
};

const kindIcons: Record<Exclude<SearchKind, 'section'>, ReactNode> = {
  doc: <FileText />,
  'doc-section': <Hash />,
  component: <Component />,
  planned: <CircleDashed />,
  token: <Variable />,
};

function iconOf(entry: SearchEntry): ReactNode {
  if (entry.kind !== 'section') return kindIcons[entry.kind];
  return Object.entries(sectionIcons).find(([to]) => to === entry.to)?.[1];
}

// built once: the index is static data
const INDEX = searchIndex();

export interface SiteSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** ⌘K over sections, docs and their sections, components, the environment and tokens. */
export function SiteSearch({ open, onOpenChange }: SiteSearchProps) {
  const navigate = useNavigate();
  const [, setTheme] = useEnvironment();

  const fromIndex = (label: string): CommandGroup[] =>
    INDEX.filter((group) => group.label === label).map((group) => ({
      label: group.label,
      items: group.entries.map((entry) => ({
        id: entry.id,
        label: entry.label,
        hint: entry.hint,
        keywords: entry.keywords,
        icon: iconOf(entry),
        onSelect: () => navigate(entry.to),
      })),
    }));

  const environment: CommandGroup = {
    label: 'Среда',
    items: [
      { id: 'mode-light', label: 'Светлый режим', icon: <Sun />, keywords: ['тема'], onSelect: () => setTheme({ mode: 'light' }) },
      { id: 'mode-dark', label: 'Тёмный режим', icon: <Moon />, keywords: ['тема', 'ночь'], onSelect: () => setTheme({ mode: 'dark' }) },
      ...ACCENTS.map((accent) => ({
        id: `accent-${accent}`,
        label: `Тема «${ACCENT_NAMES[accent]}»`,
        icon: <Palette />,
        keywords: [accent, 'цвет', 'акцент'],
        onSelect: () => setTheme({ accent }),
      })),
    ],
  };

  // the environment goes before tokens: tokens are many and mostly found by typing
  const groups = [...fromIndex('Разделы'), ...fromIndex('Документация'), ...fromIndex('Компоненты'), environment, ...fromIndex('Токены')];

  return <CommandPalette open={open} onOpenChange={onOpenChange} groups={groups} placeholder="Компоненты, страницы, токены, темы" />;
}
