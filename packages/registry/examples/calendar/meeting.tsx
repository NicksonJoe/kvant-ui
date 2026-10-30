import { useState } from 'react';
import { Calendar, Card } from '@/kvant';

const long = new Intl.DateTimeFormat('ru', { weekday: 'long', day: 'numeric', month: 'long' });

export default function CalendarMeeting() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Card padding="compact" className="w-fit">
      <Calendar value={date} onValueChange={setDate} />
      <p className="text-body-xs text-fg-3">{date ? `Встреча: ${long.format(date)}` : 'Выберите день встречи'}</p>
    </Card>
  );
}
