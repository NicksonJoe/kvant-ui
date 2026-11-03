import { Calendar, Check, ChevronRight, Clock, File, Plus, X, type LucideIcon } from 'lucide-react';
import { ICON_TILE_SIZES, IconTile, cn, type IconTileTone } from '@/kvant';

const tones: { tone: IconTileTone; title: string; icon: LucideIcon }[] = [
  { tone: 'neutral', title: 'Нейтральный', icon: File },
  { tone: 'accent', title: 'Акцент', icon: Calendar },
  { tone: 'success', title: 'Успех', icon: Check },
  { tone: 'warning', title: 'Внимание', icon: Clock },
  { tone: 'danger', title: 'Ошибка', icon: X },
  { tone: 'solid', title: 'Сплошной', icon: Plus },
];

// 120 for the size, 112 per tone at full width; the tone columns shrink in a narrow frame.
const columns = 'grid grid-cols-[120px_repeat(6,minmax(0,112px))] items-center';

const specs = { 24: { icon: '14 · 1,75', row: 'h-16' }, 32: { icon: '16 · 1,75', row: 'h-[72px]' }, 40: { icon: '20 · 1,5', row: 'h-20' } } as const;

export default function IconTiles() {
  return (
    <div className="flex w-full flex-wrap items-start gap-6">
      <div className="w-[840px] max-w-full rounded-xl bg-surface-1 px-6 py-2 shadow-raised">
        <div className={cn(columns, 'h-10 border-b border-separator text-caption font-medium text-fg-3')}>
          <span>Размер</span>
          {tones.map((item) => (
            <span key={item.tone} className="truncate">
              {item.title}
            </span>
          ))}
        </div>
        {ICON_TILE_SIZES.map((size) => (
          <div key={size} className={cn(columns, 'not-last:border-b not-last:border-separator', specs[size].row)}>
            <span className="flex flex-col">
              <span className="text-body-sm font-semibold text-fg-1 tabular-nums">{size}</span>
              <span className="font-mono text-overline font-medium text-fg-3">иконка {specs[size].icon}</span>
            </span>
            {tones.map(({ tone, icon: Glyph }) => (
              <span key={tone}>
                <IconTile size={size} tone={tone}>
                  <Glyph />
                </IconTile>
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="flex min-w-[280px] flex-1 flex-col overflow-clip rounded-xl bg-surface-1 shadow-raised">
        <span className="px-4 pt-4 pb-1 text-caption font-medium text-fg-3">В интерфейсе</span>
        <div className="flex h-16 items-center gap-3 px-4">
          <IconTile size={40} tone="success">
            <Check />
          </IconTile>
          <span className="flex flex-1 flex-col">
            <span className="text-body-sm font-medium text-fg-1">Оплата получена</span>
            <span className="text-caption text-fg-3 tabular-nums">Мария Лебедева · 12 400 ₽</span>
          </span>
          <span className="text-caption text-fg-3 tabular-nums">18:42</span>
        </div>
        <div className="ml-[68px] h-px bg-separator" />
        <div className="flex h-14 items-center gap-4 pr-4 pl-5">
          <IconTile size={32} tone="accent">
            <Calendar />
          </IconTile>
          <span className="flex flex-1 flex-col">
            <span className="text-body-sm font-medium text-fg-1">Абонемент «8 занятий»</span>
            <span className="text-caption text-fg-3">Осталось 3 · до 30 ноября</span>
          </span>
          <ChevronRight aria-hidden className="size-4 stroke-[1.75] text-fg-4" />
        </div>
        <div className="ml-[68px] h-px bg-separator" />
        <div className="flex h-control-lg items-center gap-5 pr-4 pb-1 pl-6">
          <IconTile size={24}>
            <File />
          </IconTile>
          <span className="flex-1 text-body-xs text-fg-1">Договор оферты.pdf</span>
          <span className="text-caption text-fg-3 tabular-nums">248 КБ</span>
        </div>
      </div>
    </div>
  );
}
