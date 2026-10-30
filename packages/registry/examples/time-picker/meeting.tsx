import { TimePicker } from '@/kvant';

export default function TimePickerMeeting() {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label-sm font-medium text-fg-2">Время встречи</span>
      <TimePicker aria-label="Время встречи" defaultValue="10:30" min="09:00" max="19:00" className="w-52" />
      <span className="text-caption text-fg-3">Москва, UTC+3 · напомним за 15 минут</span>
    </div>
  );
}
