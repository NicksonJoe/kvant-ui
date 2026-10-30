import { SearchField } from '@/kvant';

export default function SearchFieldShortcut() {
  return (
    <div className="flex flex-col items-start gap-2">
      <SearchField aria-label="Поиск по CRM" placeholder="Поиск по CRM" shortcut="/" className="w-72 max-w-full" />
      <p className="text-caption text-fg-3">Нажмите «/» в любом месте страницы. Esc очищает поле, второй Esc — выводит из него.</p>
    </div>
  );
}
