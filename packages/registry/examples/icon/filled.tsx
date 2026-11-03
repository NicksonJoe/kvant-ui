import { Bookmark, Star } from 'lucide-react';
import { useState } from 'react';
import { Icon, ToggleButton } from '@/kvant';

export default function IconFilled() {
  const [favourite, setFavourite] = useState(false);
  const [saved, setSaved] = useState(true);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        <ToggleButton
          iconOnly
          aria-label="В избранное"
          pressed={favourite}
          onPressedChange={setFavourite}
          icon={<Icon icon={Star} filled={favourite} />}
        />
        <ToggleButton iconOnly aria-label="В закладки" pressed={saved} onPressedChange={setSaved} icon={<Icon icon={Bookmark} filled={saved} />} />
      </div>
      <span className="text-caption text-fg-3">контур — покой, заливка — включено, рядом aria-pressed</span>
    </div>
  );
}
