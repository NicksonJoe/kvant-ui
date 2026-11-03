import { useState } from 'react';
import { AngleSlider, cn } from '@/kvant';

const QUICK = [0, 45, 90, 135, 180];

export default function AngleSliderGradient() {
  const [angle, setAngle] = useState(135);
  return (
    <div className="flex w-70 max-w-full flex-col gap-3.5 rounded-lg bg-overlay p-3.5 shadow-overlay">
      <div className="h-14 rounded-[10px]" style={{ backgroundImage: `linear-gradient(in oklab ${angle}deg, #3986e4, #c6589c)` }} />
      <div className="flex items-center justify-between">
        <span className="text-label-sm font-medium text-fg-2">Угол</span>
        <AngleSlider variant="compact" aria-label="Угол градиента" value={angle} onValueChange={setAngle} />
      </div>
      <div className="flex gap-1">
        {QUICK.map((deg) => (
          <button
            key={deg}
            type="button"
            aria-pressed={angle === deg}
            onClick={() => setAngle(deg)}
            className={cn(
              'kv-pressable h-7 flex-1 rounded-sm text-caption tabular-nums',
              angle === deg ? 'bg-accent-soft font-semibold text-accent-soft-fg' : 'bg-fill-1 text-fg-2 hover:bg-fill-2',
            )}
          >
            {deg}°
          </button>
        ))}
      </div>
    </div>
  );
}
