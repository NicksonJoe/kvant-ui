import { ArrowRight, ChartColumn, CircleCheck, CreditCard, LayoutGrid, Users, Zap } from 'lucide-react';
import { Button, NavigationMenu, NavigationMenuGroup, NavigationMenuItem, NavigationMenuLink } from '@/kvant';

export default function NavigationMenuSite() {
  return (
    <NavigationMenu aria-label="Основное меню">
      <NavigationMenuItem label="Возможности">
        <NavigationMenuGroup label="Продажи">
          <NavigationMenuLink href="#pipeline" icon={<LayoutGrid />} title="Воронка сделок" description="Этапы, вероятность и прогноз выручки" />
          <NavigationMenuLink href="#clients" icon={<Users />} title="Клиенты" description="Вся переписка и звонки в одной карточке" />
          <NavigationMenuLink href="#billing" icon={<CreditCard />} title="Счета и акты" description="Документы по шаблону за минуту" />
        </NavigationMenuGroup>
        <NavigationMenuGroup label="Команда">
          <NavigationMenuLink href="#tasks" icon={<CircleCheck />} title="Задачи" description="Поручения со сроками и напоминаниями" />
          <NavigationMenuLink href="#reports" icon={<ChartColumn />} title="Отчёты" description="Выручка, конверсия и загрузка людей" />
          <NavigationMenuLink href="#integrations" icon={<Zap />} title="Интеграции" description="Почта, телефония и 1С без программиста" />
        </NavigationMenuGroup>
        <div className="flex w-60 flex-col justify-end gap-1.5 rounded-md bg-surface-2 p-4">
          <p className="text-label-md font-semibold text-fg-1">Автоматизации воронки</p>
          <p className="text-body-xs text-fg-2">Сделка сама переходит в «Договор» после подписи КП.</p>
          <Button variant="link" size="sm" trailingIcon={<ArrowRight />} className="mt-1 self-start">
            Как это работает
          </Button>
        </div>
      </NavigationMenuItem>
      <NavigationMenuItem href="#pricing" label="Тарифы" />
      <NavigationMenuItem href="#customers" label="Клиенты" />
      <NavigationMenuItem href="#blog" label="Блог" />
    </NavigationMenu>
  );
}
