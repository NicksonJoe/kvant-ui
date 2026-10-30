import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Menubar as BaseMenubar } from '@base-ui/react/menubar';
import { Check, ChevronRight } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { listGroupLabel, listItem, listItemTone, listSeparator, popupSurface, positioner } from '../lib/recipes';

/** Menu root: Base UI handles arrows, Home/End, typeahead, Esc and focus return. */
export const Menu = BaseMenu.Root;
export const MenuSub = BaseMenu.SubmenuRoot;
export const MenuRadioGroup = BaseMenu.RadioGroup;

export interface MenuTriggerProps extends Omit<BaseMenu.Trigger.Props, 'className'> {
  className?: string;
}

/** Usually `render={<Button variant="secondary" />}` so the trigger keeps the button look. */
export function MenuTrigger({ className, ...props }: MenuTriggerProps) {
  return <BaseMenu.Trigger data-slot="menu-trigger" className={className} {...props} />;
}

export interface MenuContentProps extends Omit<BaseMenu.Popup.Props, 'className'> {
  side?: BaseMenu.Positioner.Props['side'];
  align?: BaseMenu.Positioner.Props['align'];
  sideOffset?: number;
  className?: string;
}

export function MenuContent({ side = 'bottom', align = 'start', sideOffset = 4, className, ...props }: MenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner side={side} align={align} sideOffset={sideOffset} className={positioner}>
        <BaseMenu.Popup data-slot="menu" className={cn(popupSurface, className)} {...props} />
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

function Shortcut({ children }: { children: ReactNode }) {
  return <span className="ml-auto pl-4 font-mono text-caption text-fg-3">{children}</span>;
}

export interface MenuItemProps extends Omit<BaseMenu.Item.Props, 'className'> {
  icon?: ReactNode;
  /** Trailing hint, e.g. «⌘E». */
  shortcut?: ReactNode;
  destructive?: boolean;
  className?: string;
}

export function MenuItem({ icon, shortcut, destructive, className, children, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item
      data-slot="menu-item"
      className={cn(
        listItem,
        destructive ? 'text-danger-soft-fg data-highlighted:bg-danger-soft [&>svg]:text-danger-soft-fg' : listItemTone,
        className,
      )}
      {...props}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut ? <Shortcut>{shortcut}</Shortcut> : null}
    </BaseMenu.Item>
  );
}

export interface MenuCheckboxItemProps extends Omit<BaseMenu.CheckboxItem.Props, 'className'> {
  icon?: ReactNode;
  className?: string;
}

export function MenuCheckboxItem({ icon, className, children, ...props }: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem data-slot="menu-checkbox-item" className={cn(listItem, listItemTone, className)} {...props}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <BaseMenu.CheckboxItemIndicator className="ml-auto text-accent [&_svg]:text-accent">
        <Check aria-hidden />
      </BaseMenu.CheckboxItemIndicator>
    </BaseMenu.CheckboxItem>
  );
}

export interface MenuRadioItemProps extends Omit<BaseMenu.RadioItem.Props, 'className'> {
  icon?: ReactNode;
  className?: string;
}

export function MenuRadioItem({ icon, className, children, ...props }: MenuRadioItemProps) {
  return (
    <BaseMenu.RadioItem data-slot="menu-radio-item" className={cn(listItem, listItemTone, className)} {...props}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <BaseMenu.RadioItemIndicator className="ml-auto [&_svg]:text-accent">
        <Check aria-hidden />
      </BaseMenu.RadioItemIndicator>
    </BaseMenu.RadioItem>
  );
}

export interface MenuSubTriggerProps extends Omit<BaseMenu.SubmenuTrigger.Props, 'className'> {
  icon?: ReactNode;
  className?: string;
}

export function MenuSubTrigger({ icon, className, children, ...props }: MenuSubTriggerProps) {
  return (
    <BaseMenu.SubmenuTrigger
      data-slot="menu-sub-trigger"
      className={cn(listItem, listItemTone, 'data-popup-open:bg-fill-2', className)}
      {...props}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronRight aria-hidden className="ml-auto text-fg-4!" />
    </BaseMenu.SubmenuTrigger>
  );
}

/** Submenu popup: opens to the side, aligned with the trigger row. */
export function MenuSubContent(props: MenuContentProps) {
  return <MenuContent side="inline-end" align="start" sideOffset={4} {...props} />;
}

export function MenuGroup({ className, ...props }: Omit<BaseMenu.Group.Props, 'className'> & { className?: string }) {
  return <BaseMenu.Group className={className} {...props} />;
}

export function MenuGroupLabel({
  className,
  ...props
}: Omit<BaseMenu.GroupLabel.Props, 'className'> & { className?: string }) {
  return <BaseMenu.GroupLabel className={cn(listGroupLabel, className)} {...props} />;
}

export function MenuSeparator({
  className,
  ...props
}: Omit<BaseMenu.Separator.Props, 'className'> & { className?: string }) {
  return <BaseMenu.Separator className={cn(listSeparator, className)} {...props} />;
}

/* ---------- Context menu ---------- */

/** Right click, long press or Shift+F10 on an area; fill it with the same MenuItem family. */
export const ContextMenu = BaseContextMenu.Root;

export interface ContextMenuTriggerProps extends Omit<BaseContextMenu.Trigger.Props, 'className'> {
  className?: string;
}

/** The area that opens the menu; while the menu is open it carries a 2px ring. `render` makes a card the area. */
export function ContextMenuTrigger({ className, ...props }: ContextMenuTriggerProps) {
  return (
    <BaseContextMenu.Trigger
      data-slot="context-menu-trigger"
      className={cn('data-popup-open:outline-2 data-popup-open:outline-offset-0 data-popup-open:outline-ring', className)}
      {...props}
    />
  );
}

export interface ContextMenuContentProps extends Omit<BaseMenu.Popup.Props, 'className'> {
  className?: string;
}

/** Opens with its corner at the pointer and flips at the screen edge: opacity + scale .96 from that point, no shift. */
export function ContextMenuContent({ className, ...props }: ContextMenuContentProps) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner className={positioner}>
        <BaseContextMenu.Popup data-slot="context-menu" className={cn(popupSurface, '[--shift-sm:0px]', className)} {...props} />
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}

/* ---------- Menubar ---------- */

export interface MenubarProps extends Omit<BaseMenubar.Props, 'className'> {
  className?: string;
}

/**
 * Desktop app menus in a row of `Menu`s with `MenubarTrigger`. Once one menu is open, hover or ←/→ switch
 * menus with no animation; F10 moves focus to the bar.
 */
export function Menubar({ className, ...props }: MenubarProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'F10' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const first = ref.current?.querySelector<HTMLElement>('[data-slot="menubar-trigger"]:not([data-disabled])');
      if (!first) return;
      event.preventDefault();
      first.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return <BaseMenubar ref={ref} data-slot="menubar" className={cn('flex items-center gap-0.5', className)} {...props} />;
}

/** h32 capsule, 13/16 500; fill-2 while its menu is open. The menu opens from its left edge, 4px below. */
export function MenubarTrigger({ className, ...props }: MenuTriggerProps) {
  return (
    <BaseMenu.Trigger
      data-slot="menubar-trigger"
      className={cn(
        'inline-flex h-8 shrink-0 select-none items-center rounded-full px-3 text-label-sm font-medium text-fg-1 transition-colors duration-(--duration-micro) ease-hover hover:bg-fill-1 data-disabled:opacity-50 data-popup-open:bg-fill-2',
        className,
      )}
      {...props}
    />
  );
}
