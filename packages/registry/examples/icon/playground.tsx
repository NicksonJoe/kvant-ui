import { Bookmark, Calendar, Search, Star, type LucideIcon } from 'lucide-react';
import { ICON_SIZES, Icon } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const ICONS = ['Calendar', 'Search', 'Star', 'Bookmark'] as const;
const glyphs: Record<(typeof ICONS)[number], LucideIcon> = { Calendar, Search, Star, Bookmark };

const playground: Playground = {
  controls: [{ name: 'glyph', type: 'enum', options: ICONS, default: 'Calendar', description: 'Какая иконка Lucide в icon.' }],
  render: (p) => (
    <div className="flex items-center gap-2 text-fg-1">
      <Icon icon={glyphs[p.pick('glyph', ICONS)]} size={p.pick('size', ICON_SIZES)} filled={p.bool('filled')} label={p.text('label') || undefined} />
      <span className="text-body-sm">Подпись рядом</span>
    </div>
  ),
  code: (p) => `<Icon icon={${p.pick('glyph', ICONS)}}${p.attrs(['size', 'label', 'filled'])} />`,
};

export default playground;
