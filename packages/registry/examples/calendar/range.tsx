import { RangeCalendar } from '@/kvant';

const today = new Date();
const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);

export default function CalendarRange() {
  return <RangeCalendar max={today} defaultValue={{ start: weekAgo, end: today }} />;
}
