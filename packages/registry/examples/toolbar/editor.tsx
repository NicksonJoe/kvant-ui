import { Bold, ChevronDown, Italic, Link, List, MessageCircle, Redo2, Strikethrough, Underline, Undo2 } from 'lucide-react';
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator, ToolbarToggle } from '@/kvant';

export default function ToolbarEditor() {
  return (
    <div className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-surface-1 px-8 pt-8 pb-24 shadow-raised">
      <h3 className="text-heading-md font-semibold text-fg-1">Встреча со «Студией Север», 27 октября</h3>
      <p className="mt-3 max-w-[60ch] text-body-md text-fg-2">
        Обсудили структуру сайта и сроки. Клиент хочет запуститься до конца ноября, поэтому дизайн главной согласуем на следующей неделе. Бюджет
        на анимацию утверждают отдельно — нужен расчёт по часам.
      </p>
      <Toolbar aria-label="Форматирование" className="absolute bottom-5 left-1/2 -translate-x-1/2">
        <ToolbarGroup>
          <ToolbarButton label="Отменить" shortcut="⌘Z" icon={<Undo2 />} />
          <ToolbarButton label="Повторить" shortcut="⇧⌘Z" icon={<Redo2 />} disabled />
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarButton label="Стиль текста">
          Текст <ChevronDown />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarGroup>
          <ToolbarToggle label="Жирный" shortcut="⌘B" icon={<Bold />} defaultPressed />
          <ToolbarToggle label="Курсив" shortcut="⌘I" icon={<Italic />} />
          <ToolbarToggle label="Подчёркнутый" shortcut="⌘U" icon={<Underline />} />
          <ToolbarToggle label="Зачёркнутый" icon={<Strikethrough />} />
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <ToolbarButton label="Ссылка" shortcut="⌘K" icon={<Link />} />
          <ToolbarButton label="Список" icon={<List />} />
          <ToolbarButton label="Комментарий" icon={<MessageCircle />} />
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
}
