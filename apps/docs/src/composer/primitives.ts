// Composer primitives: layout, text and icon. Canvas and exported code read the same class maps,
// written out in full so Tailwind finds every class in the source.
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Copy,
  CreditCard,
  Download,
  Ellipsis,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Heart,
  Inbox,
  Info,
  Lock,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { PropMeta, PropReader } from '@/kvant/meta';

export const ICONS = {
  Plus,
  Check,
  X,
  Pencil,
  Trash2,
  Ellipsis,
  Copy,
  Search,
  Filter,
  Download,
  Upload,
  Send,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wallet,
  CreditCard,
  Briefcase,
  Building2,
  User,
  Users,
  Mail,
  Phone,
  MessageCircle,
  Bell,
  Calendar,
  Clock,
  FileText,
  Inbox,
  Settings,
  Lock,
  Eye,
  Star,
  Heart,
  Sparkles,
  Info,
  CircleCheck,
  TriangleAlert,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function isIconName(value: unknown): value is IconName {
  return typeof value === 'string' && Object.hasOwn(ICONS, value);
}

export const ICON_NAMES: readonly IconName[] = Object.keys(ICONS).filter(isIconName);

export const GAPS = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48] as const;
const GAP_CLASS: Record<number, string> = {
  4: 'gap-1',
  8: 'gap-2',
  12: 'gap-3',
  16: 'gap-4',
  20: 'gap-5',
  24: 'gap-6',
  32: 'gap-8',
  40: 'gap-10',
  48: 'gap-12',
};

export const PADDINGS = [0, 8, 12, 16, 20, 24, 32, 40, 48] as const;
const PADDING_CLASS: Record<number, string> = {
  8: 'p-2',
  12: 'p-3',
  16: 'p-4',
  20: 'p-5',
  24: 'p-6',
  32: 'p-8',
  40: 'p-10',
  48: 'p-12',
};

export const WIDTHS = ['auto', 'full', '280', '320', '400', '560', '720'] as const;
const WIDTH_CLASS: Record<(typeof WIDTHS)[number], string> = {
  auto: '',
  full: 'w-full',
  '280': 'w-70 max-w-full',
  '320': 'w-80 max-w-full',
  '400': 'w-100 max-w-full',
  '560': 'w-140 max-w-full',
  '720': 'w-180 max-w-full',
};

export const ALIGNS = ['stretch', 'start', 'center', 'end', 'baseline'] as const;
const ALIGN_CLASS: Record<(typeof ALIGNS)[number], string> = {
  stretch: '',
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
};

export const JUSTIFIES = ['start', 'center', 'end', 'between'] as const;
const JUSTIFY_CLASS: Record<(typeof JUSTIFIES)[number], string> = {
  start: '',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

export const COLUMNS = [1, 2, 3, 4, 5, 6] as const;
const COLUMNS_CLASS: Record<(typeof COLUMNS)[number], string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

export const TEXT_VARIANTS = ['body', 'small', 'caption', 'label', 'title', 'heading', 'display'] as const;
export type TextVariant = (typeof TEXT_VARIANTS)[number];
export type TextTag = 'p' | 'span' | 'h1' | 'h2' | 'h3';
const TEXT_STYLE: Record<TextVariant, { tag: TextTag; size: string; weight?: string }> = {
  body: { tag: 'p', size: 'text-body-md' },
  small: { tag: 'p', size: 'text-body-sm' },
  caption: { tag: 'span', size: 'text-caption' },
  label: { tag: 'span', size: 'text-label-md', weight: 'font-medium' },
  title: { tag: 'h3', size: 'text-heading-xs', weight: 'font-semibold' },
  heading: { tag: 'h2', size: 'text-heading-md', weight: 'font-semibold' },
  display: { tag: 'h1', size: 'text-display-sm', weight: 'font-semibold' },
};

export const TONES = ['default', 'secondary', 'tertiary', 'accent', 'success', 'warning', 'danger'] as const;
const TONE_CLASS: Record<(typeof TONES)[number], string> = {
  default: '',
  secondary: 'text-fg-2',
  tertiary: 'text-fg-3',
  accent: 'text-accent-soft-fg',
  success: 'text-success-soft-fg',
  warning: 'text-warning-soft-fg',
  danger: 'text-danger-soft-fg',
};

export const WEIGHTS = ['auto', 'regular', 'medium', 'semibold'] as const;
const WEIGHT_CLASS: Record<(typeof WEIGHTS)[number], string> = {
  auto: '',
  regular: 'font-regular',
  medium: 'font-medium',
  semibold: 'font-semibold',
};

export const TEXT_ALIGNS = ['start', 'center', 'end'] as const;
const TEXT_ALIGN_CLASS: Record<(typeof TEXT_ALIGNS)[number], string> = { start: '', center: 'text-center', end: 'text-right' };

export const ICON_SIZES = ['auto', '16', '20', '24'] as const;
const ICON_SIZE_CLASS: Record<(typeof ICON_SIZES)[number], string> = { auto: '', '16': 'size-4', '20': 'size-5', '24': 'size-6' };

export function classes(...parts: readonly (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

const width = (read: PropReader) => WIDTH_CLASS[read.pick('width', WIDTHS)];
const gap = (read: PropReader) => GAP_CLASS[read.num('gap')] ?? '';
const padding = (read: PropReader) => PADDING_CLASS[read.num('padding')] ?? '';

export function stackClasses(read: PropReader): string {
  return classes(
    'flex flex-col',
    ALIGN_CLASS[read.pick('align', ALIGNS)],
    JUSTIFY_CLASS[read.pick('justify', JUSTIFIES)],
    gap(read),
    padding(read),
    width(read),
  );
}

export function rowClasses(read: PropReader): string {
  return classes(
    'flex',
    read.bool('wrap') && 'flex-wrap',
    ALIGN_CLASS[read.pick('align', ALIGNS)],
    JUSTIFY_CLASS[read.pick('justify', JUSTIFIES)],
    gap(read),
    padding(read),
    width(read),
  );
}

export function gridClasses(read: PropReader): string {
  return classes('grid', COLUMNS_CLASS[read.pick('columns', COLUMNS)], gap(read), padding(read), width(read));
}

/** Section and its optional heading block, in the same shape on the canvas and in the code. */
export function sectionClasses(read: PropReader): string {
  return classes('flex flex-col', gap(read), padding(read), width(read));
}
export const SECTION_HEADER = 'flex flex-col gap-1';
export const SECTION_TITLE = 'text-heading-sm font-semibold';
export const SECTION_DESCRIPTION = 'text-body-sm text-fg-3';

export function cardWidthClass(read: PropReader): string {
  return width(read);
}

export function textStyle(read: PropReader): { tag: TextTag; className: string } {
  const style = TEXT_STYLE[read.pick('variant', TEXT_VARIANTS)];
  const weight = read.pick('weight', WEIGHTS);
  return {
    tag: style.tag,
    className: classes(
      style.size,
      weight === 'auto' ? style.weight : WEIGHT_CLASS[weight],
      TONE_CLASS[read.pick('tone', TONES)],
      TEXT_ALIGN_CLASS[read.pick('align', TEXT_ALIGNS)],
      read.bool('numeric') && 'tabular-nums',
    ),
  };
}

export function iconClasses(read: PropReader): string {
  const tone = read.pick('tone', ['inherit', ...TONES.slice(1)] as const);
  return classes(ICON_SIZE_CLASS[read.pick('size', ICON_SIZES)], tone === 'inherit' ? '' : TONE_CLASS[tone]);
}

/* ---------- Inspector props of the primitives ---------- */

const gapProp = (fallback: number): PropMeta => ({
  name: 'gap',
  type: 'number',
  options: GAPS,
  default: fallback,
  description: 'Расстояние между элементами, px.',
});
const paddingProp = (fallback: number): PropMeta => ({
  name: 'padding',
  type: 'number',
  options: PADDINGS,
  default: fallback,
  description: 'Внутренний отступ, px.',
});
const widthProp: PropMeta = {
  name: 'width',
  type: 'enum',
  options: WIDTHS,
  default: 'auto',
  description: 'По содержимому, во всю ширину или фиксированная в px (не шире родителя).',
};
const justifyProp: PropMeta = {
  name: 'justify',
  type: 'enum',
  options: JUSTIFIES,
  default: 'start',
  description: 'Распределение вдоль оси; between разносит элементы к краям.',
};

export const STACK_PROPS: readonly PropMeta[] = [
  gapProp(16),
  {
    name: 'align',
    type: 'enum',
    options: ALIGNS.slice(0, 4),
    default: 'stretch',
    description: 'Поперёк оси: stretch растягивает элементы на всю ширину.',
  },
  justifyProp,
  paddingProp(0),
  widthProp,
];

export const ROW_PROPS: readonly PropMeta[] = [
  gapProp(8),
  { name: 'align', type: 'enum', options: ALIGNS, default: 'center', description: 'Выравнивание по высоте; baseline — по базовой линии текста.' },
  justifyProp,
  { name: 'wrap', type: 'boolean', default: false, description: 'Переносить элементы на новую строку, когда не хватает места.' },
  paddingProp(0),
  widthProp,
];

export const GRID_PROPS: readonly PropMeta[] = [
  { name: 'columns', type: 'number', options: COLUMNS, default: 2, description: 'Число колонок одинаковой ширины.' },
  gapProp(16),
  paddingProp(0),
  widthProp,
];

export const SECTION_PROPS: readonly PropMeta[] = [
  { name: 'title', type: 'string', description: 'Заголовок раздела, 20 px semibold.' },
  { name: 'description', type: 'string', description: 'Пояснение под заголовком, fg-3.' },
  gapProp(16),
  paddingProp(24),
  widthProp,
];

export const CARD_EXTRA_PROPS: readonly PropMeta[] = [
  { name: 'title', type: 'string', description: 'Заголовок шапки (CardHeader); пустой — без шапки.' },
  { name: 'description', type: 'string', description: 'Описание под заголовком, fg-3.' },
  widthProp,
];

export const TEXT_PROPS: readonly PropMeta[] = [
  { name: 'text', type: 'string', default: 'Текст', description: 'Содержимое. Русская типографика: «ёлочки», неразрывные пробелы, «1 284 900 ₽».' },
  {
    name: 'variant',
    type: 'enum',
    options: TEXT_VARIANTS,
    default: 'body',
    description: 'Ступень шкалы: body 16, small 14, caption 12, label 14 medium, title 16, heading 24, display 32.',
  },
  { name: 'tone', type: 'enum', options: TONES, default: 'default', description: 'Цвет: наследуется, fg-2, fg-3 или мягкий цвет статуса.' },
  { name: 'weight', type: 'enum', options: WEIGHTS, default: 'auto', description: 'Начертание поверх ступени шкалы.' },
  { name: 'align', type: 'enum', options: TEXT_ALIGNS, default: 'start', description: 'Выравнивание строки.' },
  { name: 'numeric', type: 'boolean', default: false, description: 'Табличные цифры: суммы и даты не прыгают.' },
];

export const ICON_PROPS: readonly PropMeta[] = [
  { name: 'name', type: 'enum', options: ICON_NAMES, default: 'Sparkles', description: 'Иконка Lucide.', control: false },
  { name: 'size', type: 'enum', options: ICON_SIZES, default: 'auto', description: 'auto — размер задаёт компонент (16 в кнопке, 24 в пустом состоянии).' },
  { name: 'tone', type: 'enum', options: ['inherit', ...TONES.slice(1)], default: 'inherit', description: 'Цвет; inherit — цвет текста вокруг.' },
];
