import {
  Bell,
  Calendar,
  ChartColumn,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  Copy,
  CreditCard,
  Download,
  Folder,
  House,
  Inbox,
  Link,
  Lock,
  Mail,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Send,
  Settings2,
  Star,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/kvant';
import type { DocPageDef } from './types';
import { DemoSurface, Prose, SpecList } from './widgets';

const icons: readonly [string, LucideIcon][] = [
  ['search', Search],
  ['plus', Plus],
  ['check', Check],
  ['x', X],
  ['chevron-down', ChevronDown],
  ['pencil', Pencil],
  ['copy', Copy],
  ['trash', Trash2],
  ['download', Download],
  ['upload', Upload],
  ['bell', Bell],
  ['mail', Mail],
  ['send', Send],
  ['paperclip', Paperclip],
  ['message-circle', MessageCircle],
  ['calendar', Calendar],
  ['clock', Clock],
  ['user', User],
  ['users', Users],
  ['house', House],
  ['inbox', Inbox],
  ['folder', Folder],
  ['chart-column', ChartColumn],
  ['credit-card', CreditCard],
  ['lock', Lock],
  ['link', Link],
  ['star', Star],
  ['settings-2', Settings2],
  ['circle-check', CircleCheck],
  ['triangle-alert', TriangleAlert],
];

export const iconsPage: DocPageDef = {
  slug: 'icons',
  title: 'Иконки',
  lead: 'Lucide: одна линия, один вес с текстом. Цвет наследуется от текста, эмодзи вместо иконок не используются.',
  boards: ['TJL-0'],
  sections: [
    {
      id: 'rules',
      title: 'Правила',
      content: (
        <SpecList
          items={[
            ['Штрих', '1,75 при 16 px и меньше, 1,5 при 20 px и больше — так иконка весит как соседний текст'],
            ['Размеры', '14 в xs-кнопках, 16 в обычных, 18 в боковой панели, 20 в крупных кнопках и уведомлениях'],
            ['Цвет', 'currentColor: иконка берёт цвет текста; вторичные — fg-2 или fg-3'],
            ['Подпись', 'Кнопке-иконке — aria-label, декоративной иконке — aria-hidden'],
          ]}
        />
      ),
    },
    {
      id: 'set',
      title: 'Ходовой набор',
      content: (
        <DemoSurface className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-10">
          {icons.map(([name, Icon]) => (
            <div key={name} className="flex flex-col items-center gap-2 rounded-lg p-3 text-fg-1">
              <span className="flex items-center gap-3">
                <Icon aria-hidden className="size-4 stroke-[1.75]" />
                <Icon aria-hidden className="size-5 stroke-[1.5]" />
              </span>
              <code className="max-w-full truncate font-mono text-[11px] text-fg-3">{name}</code>
            </div>
          ))}
        </DemoSurface>
      ),
    },
    {
      id: 'buttons',
      title: 'В кнопках',
      content: (
        <div className="flex flex-col gap-4">
          <Prose>
            <p>Кнопка сама задаёт размер и штрих иконки по своему размеру — передайте иконку без классов.</p>
          </Prose>
          <DemoSurface className="flex flex-wrap items-center gap-3">
            <Button size="xs" variant="secondary" leadingIcon={<Plus />}>
              xs · 14
            </Button>
            <Button size="sm" variant="secondary" leadingIcon={<Plus />}>
              sm · 16
            </Button>
            <Button size="md" variant="secondary" leadingIcon={<Plus />}>
              md · 16
            </Button>
            <Button size="lg" variant="secondary" leadingIcon={<Plus />}>
              lg · 20
            </Button>
          </DemoSurface>
        </div>
      ),
    },
  ],
};
