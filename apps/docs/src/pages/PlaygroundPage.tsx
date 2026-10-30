import { ToastProvider, TooltipProvider } from '@/kvant';
import { Composer } from '../composer/Composer';
import { EnvironmentProvider } from '../lib/environment';

/** Playground: its own full-screen page, outside the docs layout, with the providers the docs layout would give. */
export function PlaygroundPage() {
  return (
    <EnvironmentProvider>
      <TooltipProvider>
        <ToastProvider>
          <Composer />
        </ToastProvider>
      </TooltipProvider>
    </EnvironmentProvider>
  );
}
