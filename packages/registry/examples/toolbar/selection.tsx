import { Bold, CircleCheck, Italic, Link, MessageCircle } from 'lucide-react';
import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarToggle } from '@/kvant';

export default function ToolbarSelection() {
  return (
    <div className="flex w-full max-w-xl flex-col items-start gap-2 rounded-xl bg-surface-1 px-8 py-10 shadow-raised">
      <Toolbar aria-label="Действия с выделенным текстом" variant="selection" className="ml-16">
        <ToolbarToggle label="Жирный" shortcut="⌘B" icon={<Bold />} />
        <ToolbarToggle label="Курсив" shortcut="⌘I" icon={<Italic />} />
        <ToolbarButton label="Ссылка" shortcut="⌘K" icon={<Link />} />
        <ToolbarSeparator />
        <ToolbarButton label="Комментарий" icon={<MessageCircle />}>
          Комментарий
        </ToolbarButton>
        <ToolbarButton label="Создать задачу" icon={<CircleCheck />}>
          Создать задачу
        </ToolbarButton>
      </Toolbar>
      <p className="max-w-[56ch] text-body-md text-fg-2">
        Клиент попросил добавить в смету <mark className="rounded-[3px] bg-accent-soft-hover px-0.5 text-fg-1">анимацию логотипа на 12 секунд</mark> и перенести
        презентацию на четверг.
      </p>
    </div>
  );
}
