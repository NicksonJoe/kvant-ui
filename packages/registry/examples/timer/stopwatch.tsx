import { Flag, Pause, Play } from 'lucide-react';
import { Button, Timer, TimerLaps, TimerRecording, useStopwatch } from '@/kvant';

export default function TimerStopwatch() {
  // continues the 47 min 18,6 s already logged on «Макет главной»: two laps and 12:41,2 of the third
  const stopwatch = useStopwatch({ initial: 47 * 60_000 + 18_600, laps: [16 * 60_000 + 31_500, 18 * 60_000 + 5_900], autoStart: true });

  return (
    <div className="flex w-160 max-w-full flex-col gap-6 rounded-xl bg-surface-1 p-6 shadow-raised">
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <h3 className="text-body-md font-semibold tracking-heading-xs text-fg-1">Учёт времени</h3>
          <p className="text-body-xs text-fg-3">Макет главной · «Орбита Лаб»</p>
        </div>
        {stopwatch.running ? <TimerRecording>Идёт запись</TimerRecording> : <span className="flex h-5 items-center text-caption font-medium text-fg-3">На паузе</span>}
      </div>
      <Timer mode="stopwatch" tenths value={stopwatch.elapsed} paused={!stopwatch.running} aria-label="Учёт времени по задаче" />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" leadingIcon={stopwatch.running ? <Pause aria-hidden /> : <Play aria-hidden />} onClick={stopwatch.toggle}>
          {stopwatch.running ? 'Пауза' : 'Продолжить'}
        </Button>
        <Button variant="secondary" leadingIcon={<Flag aria-hidden />} onClick={stopwatch.lap} disabled={!stopwatch.running}>
          Круг
        </Button>
        <span className="ml-auto text-body-xs text-fg-3">Сегодня всего 3 ч 12 мин</span>
      </div>
      <TimerLaps laps={stopwatch.laps} current={stopwatch.lapElapsed} aria-label="Круги" />
    </div>
  );
}
