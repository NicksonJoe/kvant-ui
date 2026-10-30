import { Bell, Pin } from 'lucide-react';
import { ToggleButton, Tooltip } from '@/kvant';

export default function ToggleButtonIcons() {
  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Уведомления по сделке">
        <ToggleButton iconOnly icon={<Bell />} aria-label="Уведомления по сделке" defaultPressed />
      </Tooltip>
      <Tooltip content="Закрепить вверху списка">
        <ToggleButton iconOnly icon={<Pin />} aria-label="Закрепить вверху списка" />
      </Tooltip>
    </div>
  );
}
