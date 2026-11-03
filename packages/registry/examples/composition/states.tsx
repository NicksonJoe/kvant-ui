import { useState, type ComponentProps, type ReactNode } from 'react';
import { Button, Checkbox, FocusGroup, mergeProps, useRender } from '@/kvant';

interface SegmentProps extends useRender.ComponentProps<'button'> {
  selected: boolean;
}

// A part of your own: state { selected } becomes data-selected, the style is written on the attribute.
function Segment({ selected, render, ...props }: SegmentProps) {
  const own: ComponentProps<'button'> & { 'data-slot': string } = {
    'data-slot': 'segment',
    type: 'button',
    'aria-pressed': selected,
    className:
      'flex h-[30px] items-center rounded-full px-3.5 text-body-xs font-medium text-fg-2 transition-colors duration-(--duration-micro) ease-hover hover:text-fg-1 data-selected:bg-surface-1 data-selected:text-fg-1 data-selected:shadow-segment',
  };
  return useRender({ defaultTagName: 'button', render, state: { selected }, props: mergeProps<'button'>(own, props) });
}

interface RowProps extends useRender.ComponentProps<'button'> {
  highlighted: boolean;
}

function Row({ highlighted, render, ...props }: RowProps) {
  const own: ComponentProps<'button'> & { 'data-slot': string } = {
    'data-slot': 'row',
    type: 'button',
    className: 'flex h-8 items-center rounded-md px-2.5 text-left text-body-xs text-fg-1 focus-visible:-outline-offset-2 data-highlighted:bg-fill-2 data-highlighted:font-medium',
  };
  return useRender({ defaultTagName: 'button', render, state: { highlighted }, props: mergeProps<'button'>(own, props) });
}

function State({ label, spec, children }: { label: string; spec: string; children: ReactNode }) {
  return (
    <div className="flex w-[280px] shrink-0 flex-col items-start gap-3">
      <span className="text-caption font-medium text-fg-3">{label}</span>
      {children}
      <code className="font-mono text-overline font-medium text-fg-1">{spec}</code>
    </div>
  );
}

const views = ['Сделки', 'Задачи'];
const actions = ['Переименовать', 'Открыть в новой вкладке'];

export default function CompositionStates() {
  const [view, setView] = useState(views[0]);
  const [row, setRow] = useState(0);
  return (
    <div className="flex w-full flex-wrap items-start gap-8">
      <State label="вкладка выбрана" spec="[data-selected] · surface-1, тень segment">
        <div role="group" aria-label="Вид" className="flex h-control-md items-center gap-0.5 rounded-full bg-fill-2 p-[3px]">
          {views.map((name) => (
            <Segment key={name} selected={view === name} onClick={() => setView(name)}>
              {name}
            </Segment>
          ))}
        </div>
      </State>
      <State label="пункт меню под клавишами" spec="[data-highlighted] · fill-2">
        <FocusGroup aria-label="Действия" orientation="vertical" className="flex w-[220px] flex-col rounded-lg bg-surface-1 p-1 shadow-overlay">
          {actions.map((name, index) => (
            <Row key={name} highlighted={row === index} onFocus={() => setRow(index)} onPointerEnter={() => setRow(index)}>
              {name}
            </Row>
          ))}
        </FocusGroup>
      </State>
      <State label="флажок отмечен" spec="[data-checked] · accent">
        <Checkbox defaultChecked>Напомнить за день до срока</Checkbox>
      </State>
      <State label="ссылка-кнопка недоступна" spec="[data-disabled] · 50 %, aria-disabled">
        <Button variant="secondary" disabled render={<a href="/invoices/new" />}>
          Выставить счёт
        </Button>
      </State>
    </div>
  );
}
