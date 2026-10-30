import { useState } from 'react';
import { Button, NavigationMenu, NavigationMenuItem, SiteHeader } from '@/kvant';

export default function TopbarSite() {
  const [scrolled, setScrolled] = useState(false);

  return (
    <div
      className="relative h-[420px] w-full overflow-y-auto rounded-xl bg-background shadow-raised"
      onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 8)}
    >
      <SiteHeader
        className="sticky top-0"
        scrolled={scrolled}
        logo={
          <a href="#home" className="flex items-center gap-2 text-[17px]/[22px] font-semibold text-fg-1">
            <span aria-hidden className="size-6 rounded-full border-[3px] border-fg-1 border-t-accent" />
            Норда
          </a>
        }
        actions={
          <>
            <Button variant="ghost" size="sm">
              Войти
            </Button>
            <Button size="sm">Попробовать бесплатно</Button>
          </>
        }
      >
        <NavigationMenu aria-label="Основное меню">
          <NavigationMenuItem href="#features" label="Возможности" />
          <NavigationMenuItem href="#pricing" label="Тарифы" active />
          <NavigationMenuItem href="#customers" label="Клиенты" />
          <NavigationMenuItem href="#docs" label="Документация" />
        </NavigationMenu>
      </SiteHeader>
      <div className="mx-auto flex max-w-280 flex-col gap-6 px-6 pt-12 pb-[480px]">
        <h1 className="text-display-sm font-semibold text-fg-1">Сделки, которые доходят до оплаты</h1>
        <p className="max-w-[60ch] text-body-lg text-fg-2">Норда ведёт клиента от первой заявки до закрывающих документов — без таблиц и потерянных писем.</p>
      </div>
    </div>
  );
}
