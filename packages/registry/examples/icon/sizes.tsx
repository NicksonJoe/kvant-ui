import { Calendar } from 'lucide-react';
import { ICON_SIZES, Icon, cn } from '@/kvant';

const uses: Record<(typeof ICON_SIZES)[number], string> = {
  12: 'Крошки, флажок, метки',
  14: 'Кнопка xs, теги, ошибка поля',
  16: 'Кнопки, поля, меню, строки',
  20: 'Кнопка lg, тосты, строки касания',
  24: 'Таббар, пустые состояния',
  32: 'Онбординг, экраны без данных',
};

const number = (value: number) => Number(value.toFixed(2)).toLocaleString('ru-RU');
const lines = Array.from({ length: 25 }, (_, index) => Math.min(index + 0.0625, 23.9375));

export default function IconSizes() {
  return (
    <div className="flex w-full flex-wrap items-start gap-10">
      <div className="flex w-[232px] shrink-0 flex-col gap-3">
        <div className="relative grid size-[232px] place-items-center rounded-xl bg-surface-1 shadow-raised">
          <svg aria-hidden viewBox="0 0 24 24" className="absolute size-48" fill="none">
            <path d={lines.map((at) => `M${at} 0V24M0 ${at}H24`).join('')} className="stroke-separator" strokeWidth={0.125} />
            <rect x={2.0625} y={2.0625} width={19.875} height={19.875} strokeWidth={0.125} strokeDasharray="0.5 0.5" className="fill-[color-mix(in_oklab,var(--color-accent)_6%,transparent)] stroke-accent" />
          </svg>
          <Calendar aria-hidden size={192} strokeWidth={1.5} className="relative text-fg-1" />
        </div>
        <p className="font-mono text-overline font-medium text-fg-3">
          сетка 24 · поле 2 · × 8
          <br />
          концы и стыки скруглены
        </p>
      </div>
      <div className="flex min-h-[232px] min-w-[min(640px,100%)] flex-1 overflow-x-auto rounded-xl bg-surface-1 shadow-raised">
        {ICON_SIZES.map((size) => {
          const stroke = size <= 16 ? 1.75 : 1.5;
          return (
            <div
              key={size}
              className={cn('flex min-w-[120px] flex-1 flex-col not-last:border-r not-last:border-separator', size === 16 && 'bg-[color-mix(in_oklab,var(--color-accent)_4%,transparent)]')}
            >
              <div className="grid h-[140px] place-items-center">
                <Icon icon={Calendar} size={size} className="text-fg-1" />
              </div>
              <div className="flex flex-col gap-0.5 px-4 pb-4">
                <span className="flex items-baseline gap-1.5">
                  <span className="text-body-sm font-semibold whitespace-nowrap text-fg-1 tabular-nums">{size} px</span>
                  {size === 16 ? <span className="text-caption font-medium text-accent-soft-fg">основной</span> : null}
                </span>
                <span className="font-mono text-overline font-medium whitespace-nowrap text-fg-3">
                  {number(stroke)} → {number((stroke * size) / 24)} px
                </span>
                <span className="min-h-control-md pt-1 text-caption text-fg-2">{uses[size]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
