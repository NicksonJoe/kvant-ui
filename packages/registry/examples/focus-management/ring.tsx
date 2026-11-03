import { Button, Input, cn, focusRing } from '@/kvant';

const rows = [
  { name: '«Студия Север»', sum: '48 000 ₽' },
  { name: '«Орбита Лаб»', sum: '126 500 ₽' },
  { name: 'Атлас Дизайн', sum: '9 900 ₽' },
];

export default function FocusManagementRing() {
  return (
    <div className="grid w-full max-w-192 gap-8 sm:grid-cols-3">
      <div className="flex flex-col items-center gap-3">
        <Button>Сохранить</Button>
        <span className="text-center font-mono text-overline text-fg-3">снаружи · offset 2</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Input aria-label="Поиск клиента" placeholder="Север" className="w-full max-w-48" />
        <span className="text-center font-mono text-overline text-fg-3">вровень · рамка 1 + тень 1</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex w-full max-w-52 flex-col overflow-hidden rounded-md bg-surface-1 shadow-[0_0_0_1px_var(--color-border)]">
          {rows.map((row) => (
            <button
              key={row.name}
              type="button"
              className={cn('flex h-9 items-center justify-between gap-3 px-3 text-body-xs text-fg-1 not-first:border-t not-first:border-separator hover:bg-fill-1', focusRing.inset)}
            >
              {row.name}
              <span className="text-fg-2 tabular-nums">{row.sum}</span>
            </button>
          ))}
        </div>
        <span className="text-center font-mono text-overline text-fg-3">внутрь · offset −2</span>
      </div>
    </div>
  );
}
