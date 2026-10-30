import { NavigationMenu, NavigationMenuItem } from '@/kvant';

export default function NavigationMenuLinks() {
  return (
    <NavigationMenu aria-label="Документация">
      <NavigationMenuItem href="#start" label="Начало работы" />
      <NavigationMenuItem href="#components" label="Компоненты" active />
      <NavigationMenuItem href="#themes" label="Темы" />
      <NavigationMenuItem href="#changelog" label="Что нового" />
    </NavigationMenu>
  );
}
