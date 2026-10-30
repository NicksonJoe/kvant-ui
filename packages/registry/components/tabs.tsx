import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { createContext, use } from 'react';
import { cn } from '../lib/cn';

export type TabsVariant = 'underline' | 'pills';
const VariantContext = createContext<TabsVariant>('underline');

export interface TabsProps extends Omit<BaseTabs.Root.Props, 'className'> {
  className?: string;
}

export function Tabs({ className, ...props }: TabsProps) {
  return <BaseTabs.Root data-slot="tabs" className={cn('flex flex-col gap-4', className)} {...props} />;
}

export interface TabsListProps extends Omit<BaseTabs.List.Props, 'className'> {
  variant?: TabsVariant;
  className?: string;
}

/** Arrows move between tabs (activation follows focus), the indicator slides on the snappy spring. */
export function TabsList({ variant = 'underline', activateOnFocus = true, className, children, ...props }: TabsListProps) {
  return (
    <VariantContext value={variant}>
      <BaseTabs.List
        data-slot="tabs-list"
        data-variant={variant}
        activateOnFocus={activateOnFocus}
        className={cn(
          'relative z-0 flex items-center',
          variant === 'underline' ? 'gap-6 shadow-[inset_0_-1px_0_var(--color-separator)]' : 'gap-1',
          className,
        )}
        {...props}
      >
        {children}
        <BaseTabs.Indicator
          data-slot="tabs-indicator"
          className={cn(
            'kv-slide absolute left-0 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full',
            variant === 'underline' ? 'bottom-0 h-0.5 bg-accent' : 'top-(--active-tab-top) -z-1 h-(--active-tab-height) bg-fill-2',
          )}
        />
      </BaseTabs.List>
    </VariantContext>
  );
}

export interface TabsTabProps extends Omit<BaseTabs.Tab.Props, 'className'> {
  className?: string;
}

export function TabsTab({ className, ...props }: TabsTabProps) {
  const variant = use(VariantContext);
  return (
    <BaseTabs.Tab
      data-slot="tabs-tab"
      className={cn(
        'inline-flex select-none items-center gap-1.5 whitespace-nowrap text-label-md font-medium text-fg-2 transition-colors duration-(--duration-micro) ease-hover hover:not-data-disabled:text-fg-1 data-active:text-fg-1 data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:stroke-[1.75]',
        variant === 'underline' ? 'h-10 rounded-xs' : 'h-8 rounded-full px-3 focus-visible:outline-offset-0',
        className,
      )}
      {...props}
    />
  );
}

export interface TabsPanelProps extends Omit<BaseTabs.Panel.Props, 'className'> {
  className?: string;
}

export function TabsPanel({ className, ...props }: TabsPanelProps) {
  return <BaseTabs.Panel data-slot="tabs-panel" className={cn('outline-none', className)} {...props} />;
}
