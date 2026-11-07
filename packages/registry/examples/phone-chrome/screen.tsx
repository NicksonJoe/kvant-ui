import { House, LayoutGrid, Users } from 'lucide-react';
import { List, ListItem, PhoneHomeIndicator, PhoneStatusBar, TabBar, TabBarItem } from '@/kvant';

/** A phone screen for a mockup: the status bar on top, the home indicator under the tab bar. */
export default function PhoneChromeScreen() {
  return (
    <div className="relative flex h-[480px] w-full max-w-[402px] flex-col overflow-hidden rounded-[36px] bg-background shadow-raised">
      <PhoneStatusBar />
      <h2 className="px-4 pt-1 pb-3 text-heading-lg font-bold text-fg-1">Сделки</h2>
      <div className="px-4">
        <List variant="inset" aria-label="Сделки">
          <ListItem href="#bakery" title="Айдентика для пекарни" subtitle="Подготовить презентацию концепций" value="1 284 900 ₽" />
          <ListItem href="#mall" title="Навигация для ТЦ" subtitle="Перезвонить по смете" value="1 920 000 ₽" />
        </List>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1">
        <TabBar aria-label="Разделы приложения" className="mx-4">
          <TabBarItem href="#home" icon={<House />} label="Сводка" />
          <TabBarItem href="#deals" icon={<LayoutGrid />} label="Сделки" active />
          <TabBarItem href="#clients" icon={<Users />} label="Клиенты" />
        </TabBar>
        <PhoneHomeIndicator />
      </div>
    </div>
  );
}
