import { PhoneHomeIndicator, PhoneStatusBar } from '@/kvant';

/** Both elements take fg-1 of the mode, so the dark screen needs nothing extra. */
export default function PhoneChromeModes() {
  return (
    <div className="flex w-full flex-wrap gap-4">
      {(['light', 'dark'] as const).map((mode) => (
        <div key={mode} data-mode={mode} className="flex w-full max-w-[402px] flex-col overflow-hidden rounded-xl bg-background shadow-[inset_0_0_0_1px_var(--color-hairline)]">
          <PhoneStatusBar />
          <div className="h-16" />
          <PhoneHomeIndicator />
        </div>
      ))}
    </div>
  );
}
