import { Menu as MenuIcon, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import {
  Button,
  DEFAULT_THEME,
  IconButton,
  Kbd,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
  cn,
} from '@/kvant';
import { useEnvironment } from '../lib/environment';
import { EnvironmentPanel } from './EnvironmentPanel';
import { Logo } from './Logo';
import { NavItem } from './NavItem';
import { SECTIONS } from './sections';
import { ComponentsNav, DocsNav } from './SectionNav';
import { SiteSearch } from './SiteSearch';

/** Sticky glass bar: wordmark, primary sections, search (⌘K) and the environment. */
export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-separator bg-glass backdrop-blur-[20px] backdrop-saturate-[1.8]">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
        <MobileNav />
        <Link to="/docs" className="flex shrink-0 items-center gap-2 rounded-full pr-2 text-label-lg font-semibold text-fg-1">
          <Logo />
          Kvant
        </Link>
        <nav aria-label="Разделы" className="ml-3 hidden items-center gap-1 lg:flex">
          {SECTIONS.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              className={({ isActive }) =>
                cn(
                  'flex h-8 items-center rounded-full px-3 text-label-md font-medium transition-colors duration-(--duration-micro) ease-hover',
                  isActive ? 'bg-fill-2 text-fg-1' : 'text-fg-2 hover:bg-fill-1 hover:text-fg-1',
                )
              }
            >
              {section.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          leadingIcon={<Search />}
          trailingIcon={<Kbd className="ml-6">⌘K</Kbd>}
          className="text-fg-2 max-md:hidden"
          onClick={() => setSearchOpen(true)}
        >
          Поиск
        </Button>
        <IconButton size="sm" aria-label="Поиск" icon={<Search />} className="md:hidden" onClick={() => setSearchOpen(true)} />
        <EnvironmentPopover />
      </div>
      <SiteSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

function EnvironmentPopover() {
  const [, setTheme] = useEnvironment();
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="sm" leadingIcon={<SlidersHorizontal />} aria-label="Среда" />}>
        <span className="hidden sm:inline">Среда</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex items-center justify-between">
          <PopoverTitle>Среда</PopoverTitle>
          <Button variant="link" size="sm" onClick={() => setTheme(DEFAULT_THEME)}>
            Сбросить
          </Button>
        </div>
        <EnvironmentPanel />
      </PopoverContent>
    </Popover>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<IconButton size="sm" aria-label="Меню" icon={<MenuIcon />} className="lg:hidden" />} />
      <SheetContent side="left">
        <SheetHeader title="Kvant" description="Библиотека интерфейсов" />
        <SheetBody className="gap-4">
          <nav aria-label="Разделы" className="flex flex-col gap-0.5">
            {SECTIONS.map((section) => (
              <NavItem key={section.to} to={section.to} onNavigate={close}>
                {section.label}
              </NavItem>
            ))}
          </nav>
          {pathname.startsWith('/docs') ? <DocsNav onNavigate={close} /> : null}
          {pathname.startsWith('/components') ? <ComponentsNav onNavigate={close} /> : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
