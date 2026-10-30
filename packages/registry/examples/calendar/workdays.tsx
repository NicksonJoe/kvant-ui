import { Calendar, Card } from '@/kvant';

const today = new Date();
const inMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

export default function CalendarWorkdays() {
  return (
    <Card padding="compact" className="w-fit">
      <Calendar min={today} max={inMonth} isDateDisabled={isWeekend} />
    </Card>
  );
}
