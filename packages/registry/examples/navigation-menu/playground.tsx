import { LayoutGrid, Users } from 'lucide-react';
import { NavigationMenu, NavigationMenuGroup, NavigationMenuItem, NavigationMenuLink } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <NavigationMenu aria-label="Основное меню" delay={p.pick('delay', [0, 100, 300] as const)}>
      <NavigationMenuItem label="Возможности">
        <NavigationMenuGroup label="Продажи">
          <NavigationMenuLink href="#pipeline" icon={<LayoutGrid />} title="Воронка сделок" description="Этапы, вероятность и прогноз выручки" />
          <NavigationMenuLink href="#clients" icon={<Users />} title="Клиенты" description="Вся переписка и звонки в одной карточке" />
        </NavigationMenuGroup>
      </NavigationMenuItem>
      <NavigationMenuItem href="#pricing" label="Тарифы" active />
    </NavigationMenu>
  ),
  code: (p) => `<NavigationMenu aria-label="Основное меню"${p.attrs(['delay'])}>
  <NavigationMenuItem label="Возможности">
    <NavigationMenuGroup label="Продажи">
      <NavigationMenuLink href="/pipeline" icon={<LayoutGrid />} title="Воронка сделок" description="Этапы, вероятность и прогноз выручки" />
      <NavigationMenuLink href="/clients" icon={<Users />} title="Клиенты" description="Вся переписка и звонки в одной карточке" />
    </NavigationMenuGroup>
  </NavigationMenuItem>
  <NavigationMenuItem href="/pricing" label="Тарифы" active />
</NavigationMenu>`,
};

export default playground;
