import { Flag, Star } from 'lucide-react';
import { ToggleButton } from '@/kvant';

export default function ToggleButtonFavorite() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ToggleButton icon={<Star />} defaultPressed>
        Избранное
      </ToggleButton>
      <ToggleButton icon={<Flag />}>Важное</ToggleButton>
    </div>
  );
}
