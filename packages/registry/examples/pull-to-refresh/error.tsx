import { PullToRefresh } from '@/kvant';

export default function PullToRefreshError() {
  return (
    <PullToRefresh
      className="h-56 w-full max-w-sm overflow-hidden rounded-xl bg-surface-1 shadow-raised"
      onRefresh={async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        throw new Error('offline');
      }}
    >
      <p className="px-4 py-3 text-body-sm text-fg-2">Потяните вниз — сеть недоступна, и появится полоса с «Повторить».</p>
    </PullToRefresh>
  );
}
