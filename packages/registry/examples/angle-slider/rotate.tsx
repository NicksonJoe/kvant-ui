import { useState } from 'react';
import { AngleSlider } from '@/kvant';

export default function AngleSliderRotate() {
  const [angle, setAngle] = useState(135);
  return (
    <div className="flex flex-wrap items-center justify-center gap-12">
      <AngleSlider size="lg" aria-label="Поворот карточки" value={angle} onValueChange={setAngle} />
      <div className="grid size-50 place-items-center rounded-lg bg-surface-1 shadow-raised">
        <div
          className="h-19 w-27.5 rounded-[10px]"
          style={{ rotate: `${angle}deg`, backgroundImage: 'linear-gradient(in oklab 160deg, #81b4f6, #1467c2)' }}
        />
      </div>
    </div>
  );
}
