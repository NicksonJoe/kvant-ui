import { Pause, Play } from 'lucide-react';
import { Button, FloatingPanel, Timer, useStopwatch } from '@/kvant';

export default function FloatingPanelWorkspace() {
  const stopwatch = useStopwatch({ initial: 12 * 60_000 + 41_000, autoStart: true, interval: 1000 });

  return (
    <div className="relative h-100 w-full overflow-hidden rounded-xl bg-surface-2 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
      <div className="flex flex-col gap-2 p-6">
        <p className="text-label-md font-medium text-fg-1">Макет главной · «Орбита Лаб»</p>
        <p className="max-w-[48ch] text-body-sm text-fg-2">
          Панель живёт внутри этой области: перетащите её за шапку — у края она притянется к линии 16 px, а при свёртке останется у ближнего угла.
        </p>
      </div>
      <FloatingPanel
        strategy="absolute"
        defaultCollapsed
        title="Учёт времени"
        badge={stopwatch.running ? 'идёт' : 'пауза'}
        footer={
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={stopwatch.running ? <Pause aria-hidden /> : <Play aria-hidden />}
            onClick={stopwatch.toggle}
          >
            {stopwatch.running ? 'Пауза' : 'Продолжить'}
          </Button>
        }
      >
        <Timer mode="stopwatch" value={stopwatch.elapsed} paused={!stopwatch.running} aria-label="Учёт времени" />
      </FloatingPanel>
    </div>
  );
}
