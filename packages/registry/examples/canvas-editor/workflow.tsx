import { useState } from 'react';
import { Button, CanvasEditor, CanvasNodeCard, CanvasNote, StepPalette, type CanvasSaveState, type CanvasStepTemplate } from '@/kvant';
import { STEP_GROUPS } from '../step-palette/data';

/** Static picture of the graph: the real editor puts the canvas engine here. */
export function DemoCanvas() {
  return (
    <div className="relative size-full min-h-[560px] bg-[radial-gradient(circle,var(--color-fill-3)_1.2px,transparent_1.4px)] bg-size-[20px_20px]">
      <CanvasNodeCard className="absolute top-16 left-[280px]" kind="trigger" title="Новое сообщение" subtitle="Триггер · Telegram" summary="@norda_bot · личные" status="done" outputCount={12} />
      <CanvasNodeCard
        className="absolute top-52 left-[264px]"
        kind="agent"
        title="Разобрать заявку"
        subtitle="Агент Норды"
        status="running"
        statusText="Выполняется · 1,2 с"
        selected
      />
      <CanvasNodeCard className="absolute top-[360px] left-[280px]" kind="condition" title="Есть бюджет?" summary="budget ≥ 50 000" changed />
      <CanvasNote className="absolute top-16 left-[560px]" author={{ name: 'Анна', color: 'var(--color-chart-2)' }} time="2 мин назад">
        Порог бюджета согласовать с Игорем — может, 30 000 ₽ для повторных клиентов?
      </CanvasNote>
    </div>
  );
}

export function DemoPalette({ onInsert }: { onInsert: (template: CanvasStepTemplate) => void }) {
  return <StepPalette groups={STEP_GROUPS} onInsert={onInsert} />;
}

export function DemoInspector() {
  return (
    <div className="flex flex-col gap-1 p-4">
      <span className="text-body-sm font-semibold text-fg-1">Разобрать заявку</span>
      <span className="text-caption text-fg-3">Агент Норды · шаг 2</span>
      <p className="mt-4 text-body-xs text-fg-2">Здесь инспектор выделенного шага: параметры, данные и запуски.</p>
    </div>
  );
}

export default function CanvasEditorWorkflow() {
  const [saved, setSaved] = useState('сохранено только что');
  const [saveState, setSaveState] = useState<CanvasSaveState>('saved');
  const [errors, setErrors] = useState(1);
  const [message, setMessage] = useState('');
  return (
    <div className="flex w-full flex-col gap-3">
      <CanvasEditor
        className="h-[640px] w-full rounded-xl shadow-raised"
        breadcrumbs={[{ label: 'Автоматизации', href: '#' }]}
        title="Заявка из Telegram → сделка"
        version="Черновик · опубликована v7"
        saved={saved}
        saveState={saveState}
        onRetrySave={() => setSaveState('saved')}
        errors={errors}
        people={[
          { name: 'Анна Носова', color: 'var(--color-chart-2)' },
          { name: 'Игорь Гусев', color: 'var(--color-chart-6)' },
          { name: 'Мария Котова', color: 'var(--color-chart-3)' },
          { name: 'Пётр Лосев', color: 'var(--color-chart-8)' },
        ]}
        onHistory={() => setMessage('Открыта история изменений')}
        onValidate={() => setMessage(errors > 0 ? '1 шаг не настроен: «Ответить шаблоном» — не выбран шаблон' : 'Ошибок нет')}
        onRun={() => setMessage('Тестовый запуск начался')}
        onPublish={() => setSaved('опубликовано как v8')}
        palette={<DemoPalette onInsert={(step) => setSaved(`добавлен шаг «${step.title}»`)} />}
        actions={
          errors > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setErrors(0)}>
              Исправить
            </Button>
          ) : null
        }
        inspector={<DemoInspector />}
      >
        <DemoCanvas />
      </CanvasEditor>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setSaveState(saveState === 'failed' ? 'saved' : 'failed')}>
          {saveState === 'failed' ? 'Сохранение прошло' : 'Сбой сохранения'}
        </Button>
        <p className="min-h-5 text-body-sm text-fg-2">{message}</p>
      </div>
    </div>
  );
}
