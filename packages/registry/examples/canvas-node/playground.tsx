import { CanvasNodeCard, type CanvasNodeSize } from '@/kvant';
import type { CanvasNodeKind, CanvasRunStatus } from '@/kvant/components/canvas-types';
import type { Playground } from '@/kvant/meta';

const KINDS: readonly CanvasNodeKind[] = ['trigger', 'action', 'condition', 'loop', 'wait', 'agent', 'data', 'group', 'note'];
const SIZES: readonly CanvasNodeSize[] = ['full', 'compact', 'collapsed'];
const STATUSES: readonly CanvasRunStatus[] = ['idle', 'waiting', 'running', 'done', 'error', 'warning', 'skipped'];

const playground: Playground = {
  initial: { title: 'Создать сделку', summary: 'этап: Неразобранное', statusText: '' },
  render: (p) => {
    const selected = p.pick('selected', [false, true, 'group'] as const);
    return (
      <div className="grid place-items-center rounded-xl bg-surface-2 p-12">
        <CanvasNodeCard
          kind={p.pick('kind', KINDS)}
          title={p.text('title')}
          subtitle={p.text('subtitle') || undefined}
          size={p.pick('size', SIZES)}
          summary={p.text('summary') || undefined}
          status={p.pick('status', STATUSES)}
          statusText={p.text('statusText') || undefined}
          changed={p.bool('changed')}
          selected={selected}
          disabled={p.bool('disabled')}
        />
      </div>
    );
  },
  code: (p) => `<CanvasNodeCard${p.attrs(['kind', 'title', 'subtitle', 'size', 'summary', 'status', 'statusText', 'changed', 'selected', 'disabled'])} />`,
};

export default playground;
