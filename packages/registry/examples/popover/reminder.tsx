import { Bell } from 'lucide-react';
import { Button, Popover, PopoverClose, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '@/kvant';

export default function PopoverReminder() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="secondary" leadingIcon={<Bell />} />}>Напомнить</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Напоминание о сделке</PopoverTitle>
        <PopoverDescription>Напомним Анне Северовой о созвоне по смете в пятницу, 30 октября, в 11:00.</PopoverDescription>
        <div className="flex justify-end gap-2">
          <PopoverClose render={<Button size="sm" variant="ghost" />}>Позже</PopoverClose>
          <PopoverClose render={<Button size="sm" />}>Напомнить</PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}
