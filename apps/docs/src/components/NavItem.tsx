import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { cn } from '@/kvant';

export interface NavItemProps {
  to: string;
  children: ReactNode;
  /** Planned components: quieter text. */
  muted?: boolean;
  /** Exact match only (index pages). */
  end?: boolean;
  onNavigate?: () => void;
}

/** Sidebar link in the Kvant sidebar recipe, one step denser: h32 capsule, the current page is raised. */
export function NavItem({ to, children, muted, end, onNavigate }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex h-8 min-w-0 items-center gap-2 rounded-full px-3 text-label-sm font-medium transition-colors duration-(--duration-micro) ease-hover',
          isActive
            ? 'bg-surface-1 text-fg-1 shadow-raised'
            : muted
              ? 'text-fg-3 hover:bg-fill-1 hover:text-fg-2'
              : 'text-fg-2 hover:bg-fill-1 hover:text-fg-1',
        )
      }
    >
      {children}
    </NavLink>
  );
}

export function NavGroupTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-3 pt-5 pb-1.5">
      <span className="text-caption font-medium text-fg-3">{children}</span>
      {aside}
    </div>
  );
}
