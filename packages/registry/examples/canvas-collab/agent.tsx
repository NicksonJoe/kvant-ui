import { useEffect, useState } from 'react';
import { Button, CANVAS_GHOST_CLASS, CanvasAgentPrompt, CanvasAgentProposal } from '@/kvant';

const steps = ['Новое сообщение', 'Разобрать заявку', 'Есть бюджет?', 'Ответить шаблоном', 'Создать сделку', 'Уведомить'];

export default function CanvasAgentBuild() {
  const [shown, setShown] = useState(0);
  const [decision, setDecision] = useState<'accepted' | 'rejected' | null>(null);
  const building = shown < steps.length;
  useEffect(() => {
    if (!building) return undefined;
    const timer = window.setTimeout(() => setShown((count) => count + 1), 500);
    return () => window.clearTimeout(timer);
  }, [building, shown]);

  return (
    <div className="flex w-full max-w-[650px] flex-col gap-5 rounded-xl bg-background p-5 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
      <CanvasAgentPrompt
        text="Заявка из Telegram → разбери бюджет → если есть, создай сделку и напиши менеджеру, если нет — ответь шаблоном."
        status={building ? 'building' : 'done'}
        steps={steps.length}
        edges={5}
      />
      <div className="grid grid-cols-3 gap-4">
        {steps.slice(0, shown).map((title) => (
          <div key={title} className={`rounded-md px-3 py-2.5 text-body-xs font-semibold text-fg-1 ${decision === 'accepted' ? 'bg-surface-1 shadow-raised' : CANVAS_GHOST_CLASS}`}>
            {title}
          </div>
        ))}
      </div>
      {decision ? (
        <div className="flex items-center gap-3 text-body-sm text-fg-2">
          {decision === 'accepted' ? 'Шаги добавлены одной записью в истории.' : 'Предложение отклонено.'}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDecision(null);
              setShown(0);
            }}
          >
            Ещё раз
          </Button>
        </div>
      ) : building ? null : (
        <CanvasAgentProposal steps={steps.length} edges={5} onAccept={() => setDecision('accepted')} onStepwise={() => setDecision('accepted')} onReject={() => setDecision('rejected')} />
      )}
    </div>
  );
}
