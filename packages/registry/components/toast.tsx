import { Toast as BaseToast } from '@base-ui/react/toast';
import type { ToastManagerPromiseOptions, ToastManagerUpdateOptions } from '@base-ui/react/toast';
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Spinner } from './spinner';

/** Toast types understood by the renderer; `loading`/`error` come from `toast.promise`. */
export type ToastType = 'success' | 'warning' | 'danger' | 'error' | 'info' | 'loading';

// Errors and toasts with an action stay 8 s instead of the provider's 4 s: time to read and press «Отменить».
const LASTING_TIMEOUT = 8000;
const isError = (type: string | undefined) => type === 'danger' || type === 'error';

type Lasting = Pick<ToastManagerUpdateOptions<object>, 'type' | 'actionProps' | 'timeout' | 'priority'>;

/** Longer timeout for errors and toasts with an action; errors are announced at once (aria-live assertive). */
function withDefaults<T extends Lasting>(options: T): T {
  return {
    ...(isError(options.type) || options.actionProps ? { timeout: LASTING_TIMEOUT } : null),
    ...(isError(options.type) ? { priority: 'high' as const } : null),
    ...options,
  };
}

/** The same defaults for the outcome of `toast.promise`. */
function settled<V>(option: ToastManagerPromiseOptions<V, object>['success'], type: ToastType) {
  return (value: V): ToastManagerUpdateOptions<object> => {
    const resolved = typeof option === 'function' ? option(value) : option;
    return withDefaults({ type, ...(typeof resolved === 'string' ? { description: resolved } : resolved) });
  };
}

const manager = BaseToast.createToastManager<object>();

/**
 * App-wide toast manager: `toast.add({ title, description, type, actionProps })`,
 * `toast.promise(p, { loading, success, error })`, `toast.close(id)`. Works outside React too.
 */
export const toast: typeof manager = {
  ...manager,
  add: (options) => manager.add(withDefaults(options)),
  promise: (promise, options) =>
    manager.promise(promise, { ...options, success: settled(options.success, 'success'), error: settled(options.error, 'error') }),
};

const icons: Record<ToastType, ReactNode> = {
  success: <CircleCheck aria-hidden className="text-success" />,
  warning: <TriangleAlert aria-hidden className="text-warning-soft-fg" />,
  danger: <CircleX aria-hidden className="text-danger" />,
  error: <CircleX aria-hidden className="text-danger" />,
  info: <Info aria-hidden className="text-info" />,
  loading: <Spinner />,
};

function isToastType(type: string | undefined): type is ToastType {
  return type !== undefined && type in icons;
}

const action = 'shrink-0 rounded-xs px-1 text-label-sm font-semibold text-accent-soft-fg decoration-1 underline-offset-3 hover:underline';

export interface ToastProviderProps {
  children: ReactNode;
  /** Auto-dismiss after this many ms (paused while hovered or focused); errors and toasts with an action stay 8 s. */
  timeout?: number;
}

/**
 * Stack of 3 in the bottom-right corner, 24px from the edges (phone: top centre, under the status bar).
 * Hover or focus expands it; swipe right or down to dismiss (phone: up).
 */
export function ToastProvider({ children, timeout = 4000 }: ToastProviderProps) {
  return (
    <BaseToast.Provider toastManager={toast} limit={3} timeout={timeout}>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport
          data-slot="toast-viewport"
          className="fixed inset-x-4 top-[max(16px,env(safe-area-inset-top))] z-[60] outline-none sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:w-[360px]"
        >
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}

function ToastList() {
  const { toasts } = BaseToast.useToastManager();
  return toasts.map((item) => (
    <BaseToast.Root
      key={item.id}
      toast={item}
      swipeDirection={['up', 'right', 'down']}
      data-slot="toast"
      className="kv-toast rounded-xl bg-glass-strong shadow-overlay backdrop-blur-[20px] backdrop-saturate-[1.8] focus-visible:outline-offset-2"
    >
      <BaseToast.Content className="kv-toast-content flex items-start gap-3 py-3 pr-3 pl-4">
        {isToastType(item.type) ? (
          // Keyed by type: the promise spinner crossfades into the result icon in 150ms.
          <span
            key={item.type}
            className="flex h-5 shrink-0 items-center transition-[opacity,scale] duration-(--duration-quick) ease-out starting:scale-80 starting:opacity-0 [&_svg]:size-5 [&_svg]:stroke-[1.5]"
          >
            {icons[item.type]}
          </span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <BaseToast.Title className="text-label-md font-medium text-fg-1" />
          <BaseToast.Description className="text-body-xs text-fg-2" />
          {item.actionProps && item.description ? <BaseToast.Action className={`-ml-1 mr-auto mt-1.5 ${action}`} /> : null}
        </div>
        {item.actionProps && !item.description ? <BaseToast.Action className={action} /> : null}
        <BaseToast.Close
          aria-label="Закрыть уведомление"
          className="grid size-5 shrink-0 place-items-center rounded-full text-fg-3 hover:text-fg-1 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
        >
          <X aria-hidden />
        </BaseToast.Close>
      </BaseToast.Content>
    </BaseToast.Root>
  ));
}

/** Live list of toasts and the same methods as `toast`, for components that render toast state. */
export const useToasts = BaseToast.useToastManager;
