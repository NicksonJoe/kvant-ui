import { useState } from 'react';
import { StepPalette } from '@/kvant';
import { STEP_GROUPS } from './data';

export default function StepPaletteSearch() {
  const [last, setLast] = useState('');
  return (
    <div className="flex w-full flex-wrap items-start gap-6">
      <div className="h-[480px] w-56 overflow-y-auto rounded-xl bg-surface-1 shadow-raised">
        <StepPalette groups={STEP_GROUPS} onInsert={(step) => setLast(step.title)} />
      </div>
      <p className="max-w-[40ch] text-body-sm text-fg-2" aria-live="polite">
        Нажмите «/» и введите «telegram» или «ии»: поиск смотрит и на ключевые слова. ↓ переводит фокус на шаги, Enter в поиске вставляет первый.
        {last ? ` Вставлен: «${last}».` : ''}
      </p>
    </div>
  );
}
