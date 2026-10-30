import { Outlet, ScrollRestoration } from 'react-router';
import { ToastProvider, TooltipProvider } from '@/kvant';
import { TopBar } from '../components/TopBar';
import { EnvironmentProvider } from '../lib/environment';
import { PreviewProvider } from '../lib/preview';

export function RootLayout() {
  return (
    <EnvironmentProvider>
      <PreviewProvider>
        <TooltipProvider>
          <ToastProvider>
            <a
              href="#content"
              className="sr-only z-50 rounded-full bg-surface-1 px-4 py-2 text-label-md shadow-overlay focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
              Перейти к содержимому
            </a>
            <TopBar />
            <Outlet />
            {/* every directly opened URL gets the key "default": key it by URL, or one page restores another page's scroll */}
            <ScrollRestoration getKey={(location) => (location.key === 'default' ? location.pathname + location.search : location.key)} />
          </ToastProvider>
        </TooltipProvider>
      </PreviewProvider>
    </EnvironmentProvider>
  );
}
