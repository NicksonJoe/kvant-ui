import { ArrowUp, Copy, Ellipsis, Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge, VisuallyHidden, buttonClasses } from '@/kvant';

function Card({ label, heard, caption = 'диктор слышит', children }: { label: string; heard: string; caption?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 rounded-xl bg-surface-1 p-6 shadow-raised">
      <span className="text-caption font-medium text-fg-3">{label}</span>
      <div className="flex h-control-md items-center">{children}</div>
      <div className="flex flex-col gap-1.5 border-t border-separator pt-4">
        <span className="font-mono text-overline font-medium text-fg-3">{caption}</span>
        <span className="text-body-sm text-fg-1">{heard}</span>
      </div>
    </div>
  );
}

const iconButton = buttonClasses({ variant: 'ghost', size: 'sm', iconOnly: true });

export default function VisuallyHiddenText() {
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8">
      <Card label="кнопки-иконки в строке сделки" heard="«Изменить сделку „Айдентика“, кнопка» · «Копировать ссылку» · «Ещё действия, меню»">
        <div className="flex gap-1">
          <button type="button" className={iconButton}>
            <Pencil aria-hidden />
            <VisuallyHidden>Изменить сделку «Айдентика»</VisuallyHidden>
          </button>
          <button type="button" className={iconButton}>
            <Copy aria-hidden />
            <VisuallyHidden>Копировать ссылку</VisuallyHidden>
          </button>
          <button type="button" aria-haspopup="menu" className={iconButton}>
            <Ellipsis aria-hidden />
            <VisuallyHidden>Ещё действия</VisuallyHidden>
          </button>
        </div>
      </Card>
      <Card label="сокращённая сумма в KPI" heard="«Выручка за ноябрь: 1 312 400 рублей, рост на 8 процентов к октябрю»">
        <p className="flex items-baseline gap-2.5">
          <span aria-hidden className="text-heading-lg font-semibold text-fg-1 tabular-nums">
            1,3 млн ₽
          </span>
          <Badge aria-hidden tone="success" icon={<ArrowUp />}>
            8 %
          </Badge>
          <VisuallyHidden>Выручка за ноябрь: 1 312 400 рублей, рост на 8 процентов к октябрю</VisuallyHidden>
        </p>
      </Card>
      <Card
        label="первый Tab на странице"
        caption="видно только с клавиатуры"
        heard="Скрыта, пока не получит фокус; затем капсула 36 над шапкой, Enter ведёт к главному содержимому мимо меню"
      >
        {/* The look of a focused SkipLink; the live one is in the «Перейти к содержимому» example. */}
        <span aria-hidden data-force-focus className="inline-flex h-control-md items-center rounded-full bg-fg-1 px-4 text-label-md font-medium whitespace-nowrap text-surface-1">
          Перейти к содержимому
        </span>
      </Card>
    </div>
  );
}
