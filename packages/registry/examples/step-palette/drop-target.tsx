import { useState, type DragEvent } from 'react';
import { CANVAS_STEP_MIME, CanvasNodeCard, StepPalette, readCanvasStepDrag, type CanvasStepTemplate } from '@/kvant';
import { STEP_GROUPS } from './data';

const byId = new Map(STEP_GROUPS.flatMap((group) => group.items).map((item) => [item.id, item]));

export default function StepPaletteDropTarget() {
  const [steps, setSteps] = useState<readonly CanvasStepTemplate[]>([]);
  const [over, setOver] = useState(false);
  const add = (template: CanvasStepTemplate) => setSteps((current) => [...current, template]);

  const accepts = (event: DragEvent) => event.dataTransfer.types.includes(CANVAS_STEP_MIME);

  return (
    <div className="flex h-[560px] w-full overflow-hidden rounded-xl bg-surface-1 shadow-raised">
      <aside aria-label="Палитра шагов" className="w-56 shrink-0 overflow-y-auto border-r border-separator">
        <StepPalette groups={STEP_GROUPS} onInsert={add} />
      </aside>
      <div
        role="region"
        aria-label="Канвас"
        onDragOver={(event) => {
          if (!accepts(event)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          setOver(false);
          const payload = readCanvasStepDrag(event.dataTransfer);
          const template = payload ? byId.get(payload.templateId) : undefined;
          if (!template) return;
          event.preventDefault();
          add(template);
        }}
        className={`flex min-w-0 flex-1 flex-col items-center gap-4 overflow-y-auto bg-[radial-gradient(circle,var(--color-fill-3)_1.2px,transparent_1.4px)] bg-size-[20px_20px] p-8 ${over ? 'bg-accent-soft' : ''}`}
      >
        {steps.length === 0 ? <p className="mt-24 text-body-sm text-fg-3">Перетащите шаг сюда или нажмите на него в палитре</p> : null}
        {steps.map((step, index) => (
          <CanvasNodeCard key={`${step.id}-${index}`} kind={step.kind} title={step.title} icon={step.icon} logo={step.logo} />
        ))}
      </div>
    </div>
  );
}
