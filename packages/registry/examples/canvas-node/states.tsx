import { CanvasNodeCard, type CanvasNodeCardProps } from '@/kvant';

const STATES: readonly { label: string; note: string; props: Partial<CanvasNodeCardProps> }[] = [
  { label: 'Обычный', note: 'рамка hairline · тень 1/2', props: {} },
  { label: 'Выделен', note: 'кольцо accent 2 + ореол 6', props: { selected: true } },
  { label: 'В группе выделения', note: 'accent 55 %', props: { selected: 'group' } },
  { label: 'Выключен', note: 'opacity 55 %', props: { disabled: true, summary: 'пропускается при запуске' } },
  { label: 'Ждёт', note: 'очередь прогона', props: { status: 'waiting', statusText: 'Ждёт «Есть бюджет?»' } },
  { label: 'Выполняется', note: 'чип с бликом + спиннер', props: { status: 'running', statusText: 'Выполняется · 1,2 с' } },
  { label: 'Готово', note: 'значок success 18', props: { status: 'done', statusText: 'Готово · 0,8 с · 1 запись' } },
  { label: 'Ошибка', note: 'клик по чипу открывает лог', props: { status: 'error', statusText: 'Сервис занят · Повторить', selected: true } },
  { label: 'Не настроен', note: '«Проверить» ведёт сюда', props: { status: 'warning', statusText: 'Не выбран этап воронки' } },
  { label: 'Пропущен', note: 'ветка не сработала', props: { status: 'skipped', statusText: 'Пропущен · ветка «нет»' } },
  { label: 'Закреплённые данные', note: 'шаг не идёт, отдаёт сохранённое', props: { pinned: 'Закреплено · 3 поля' } },
];

export default function CanvasNodeStates() {
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-x-6 gap-y-8 rounded-xl bg-surface-2 p-8">
      {STATES.map((state) => (
        <div key={state.label} className="flex flex-col gap-3.5">
          <CanvasNodeCard
            kind="action"
            title="Создать сделку"
            summary="этап: Неразобранное"
            onStatusClick={state.props.status === 'error' ? () => undefined : undefined}
            {...state.props}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-body-xs font-medium text-fg-1">{state.label}</span>
            <span className="font-mono text-overline text-fg-3">{state.note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
