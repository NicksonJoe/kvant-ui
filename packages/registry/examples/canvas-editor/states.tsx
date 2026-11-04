import type { ReactNode } from 'react';
import { CanvasEditor, CanvasReadonlyBar, CanvasState, type CanvasSaveState } from '@/kvant';

const dots = 'relative h-[300px] overflow-hidden rounded-xl bg-[radial-gradient(circle,var(--color-fill-3)_1.2px,transparent_1.4px)] bg-size-[20px_20px] shadow-[inset_0_0_0_1px_var(--color-hairline)]';

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption className="text-body-sm text-fg-1">{label}</figcaption>
      {children}
    </figure>
  );
}

function Header({ saveState }: { saveState: CanvasSaveState }) {
  return (
    <CanvasEditor
      className="w-full rounded-xl shadow-[0_0_0_1px_var(--color-hairline)]"
      breadcrumbs={[{ label: 'Автоматизации', href: '#' }]}
      title="Заявка → сделка"
      saveState={saveState}
      onRetrySave={() => undefined}
      onRun={() => undefined}
      onPublish={() => undefined}
    >
      {null}
    </CanvasEditor>
  );
}

export default function CanvasEditorStates() {
  return (
    <div className="grid w-full gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Cell label="Пустой граф">
        <div className={dots}>
          <CanvasState kind="empty" onAddStep={() => undefined} onBuildWithNorda={() => undefined} />
        </div>
      </Cell>
      <Cell label="Загрузка">
        <div className={dots}>
          <CanvasState kind="loading" />
        </div>
      </Cell>
      <Cell label="Не открылся">
        <div className="h-[300px] overflow-hidden rounded-xl">
          <CanvasState kind="error" version="v7" onRetry={() => undefined} onOpenVersion={() => undefined} />
        </div>
      </Cell>
      <Cell label="Только просмотр">
        <div className={dots}>
          <CanvasReadonlyBar className="absolute inset-x-4 top-4" onRequestAccess={() => undefined} />
        </div>
      </Cell>
      <Cell label="Нет сети и сбой сохранения">
        <div className="flex flex-col gap-3">
          <Header saveState="offline" />
          <Header saveState="failed" />
        </div>
      </Cell>
    </div>
  );
}
