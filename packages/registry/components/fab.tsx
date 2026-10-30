import { Button as BaseButton } from '@base-ui/react/button';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { positioner } from '../lib/recipes';

// 56 accent circle lifted like an overlay; pressed it sinks: accent-pressed, inner shadow, a short drop.
const fabShell =
  'kv-pressable inline-flex h-14 min-w-14 shrink-0 select-none items-center justify-center rounded-full bg-accent px-4 text-accent-fg ' +
  '[box-shadow:var(--shadow-accent-control),var(--shadow-overlay)] hover:bg-accent-hover ' +
  'active:bg-accent-pressed active:[box-shadow:var(--shadow-pressed-accent),var(--shadow-tooltip)] ' +
  'data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-6 [&_svg]:shrink-0 [&_svg]:stroke-[1.5]';

export interface FabProps extends Omit<BaseButton.Props, 'className' | 'children'> {
  icon: ReactNode;
  /** Accessible name; written next to the icon while `extended`. */
  label: string;
  /** Pill with the label. Fold it when the list scrolls down: the width closes in 250 ms. */
  extended?: boolean;
  className?: string;
}

/**
 * The one primary action of a phone screen, floating over content. Position it yourself:
 * `fixed right-4 bottom-[calc(16px+env(safe-area-inset-bottom))]`.
 */
export function Fab({ icon, label, extended = false, className, ...props }: FabProps) {
  return (
    <BaseButton data-slot="fab" data-extended={extended || undefined} aria-label={label} className={cn(fabShell, className)} {...props}>
      {icon}
      {/* grid 0fr ↔ 1fr animates the width the label needs; the text itself only fades. */}
      <span
        aria-hidden
        className={cn(
          'grid [transition:grid-template-columns_var(--duration-moderate)_var(--ease-standard),opacity_var(--duration-fast)_var(--ease-out)]',
          extended ? 'grid-cols-[1fr]' : 'grid-cols-[0fr] opacity-0',
        )}
      >
        <span className="min-w-0 overflow-hidden">
          <span className="block whitespace-nowrap pr-1 pl-2 text-label-lg font-semibold">{label}</span>
        </span>
      </span>
    </BaseButton>
  );
}

export interface FabAction {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}

export interface FabMenuProps {
  /** Icon of the main button; it turns 45° while open, so a plus becomes a cross. */
  icon: ReactNode;
  /** Name of the main button, e.g. «Создать». */
  label: string;
  /** Top to bottom: the last action sits next to the button. */
  actions: readonly FabAction[];
  disabled?: boolean;
  className?: string;
}

/**
 * Speed dial: the FAB opens a menu of labelled actions above itself over a scrim.
 * Arrows move between actions, Esc closes and returns focus to the button.
 */
export function FabMenu({ icon, label, actions, disabled, className }: FabMenuProps) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        data-slot="fab"
        aria-label={label}
        disabled={disabled}
        className={cn(
          fabShell,
          'data-popup-open:z-60 [&_svg]:[transition:rotate_var(--spring-snappy)] data-popup-open:[&_svg]:rotate-45',
          className,
        )}
      >
        {icon}
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Backdrop className="fixed inset-0 z-50 bg-scrim transition-opacity duration-(--duration-base) ease-out data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <BaseMenu.Positioner side="top" align="end" sideOffset={16} className={positioner}>
          <BaseMenu.Popup
            data-slot="fab-menu"
            className="group/fab flex flex-col items-end gap-3 pr-1.5 outline-none transition-opacity duration-(--duration-quick) ease-out data-ending-style:opacity-0"
          >
            {actions.map((action, index) => (
              <BaseMenu.Item
                key={action.label}
                onClick={action.onClick}
                // Items rise from the button upwards, 35 ms apart.
                style={{ '--kv-i': actions.length - 1 - index } as CSSProperties}
                className="group/action flex cursor-default select-none items-center gap-3 outline-none transition-[opacity,translate] delay-[calc(var(--kv-i)*35ms)] duration-(--duration-base) ease-out group-data-starting-style/fab:translate-y-(--shift-md) group-data-starting-style/fab:opacity-0"
              >
                <span className="flex h-8 items-center whitespace-nowrap rounded-full bg-overlay px-3 text-label-sm font-medium text-fg-1 shadow-overlay">
                  {action.label}
                </span>
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-overlay text-fg-1 shadow-overlay group-focus-visible/action:outline-2 group-focus-visible/action:outline-offset-2 group-focus-visible/action:outline-ring [&_svg]:size-5 [&_svg]:stroke-[1.5]"
                >
                  {action.icon}
                </span>
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
