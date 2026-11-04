import { CanvasEditor } from '@/kvant';
import type { Playground } from '@/kvant/meta';
import { DemoCanvas, DemoInspector, DemoPalette } from './workflow';

const playground: Playground = {
  initial: { title: 'Заявка из Telegram → сделка', version: 'Черновик · опубликована v7', saved: 'сохранено только что' },
  controls: [
    { name: 'palette', type: 'boolean', default: true, description: 'Палитра шагов слева.' },
    { name: 'inspector', type: 'boolean', default: true, description: 'Инспектор справа.' },
  ],
  render: (p) => (
    <CanvasEditor
      className="h-[640px] w-full rounded-xl shadow-raised"
      breadcrumbs={[{ label: 'Автоматизации', href: '#' }]}
      title={p.text('title')}
      version={p.text('version') || undefined}
      saved={p.text('saved') || undefined}
      saveState={p.pick('saveState', ['saved', 'saving', 'offline', 'failed'] as const)}
      onRetrySave={() => undefined}
      errors={p.num('errors')}
      people={[
        { name: 'Анна Носова', color: 'var(--color-chart-2)' },
        { name: 'Игорь Гусев', color: 'var(--color-chart-6)' },
      ]}
      onHistory={() => undefined}
      onValidate={() => undefined}
      onRun={() => undefined}
      onPublish={() => undefined}
      palette={p.bool('palette') ? <DemoPalette onInsert={() => undefined} /> : undefined}
      inspector={p.bool('inspector') ? <DemoInspector /> : undefined}
    >
      <DemoCanvas />
    </CanvasEditor>
  ),
  code: (p) =>
    `<CanvasEditor breadcrumbs={[{ label: 'Автоматизации', href: '/automations' }]}${p.attrs(['title', 'version', 'saved', 'saveState', 'errors'])} palette={<StepPalette … />} inspector={<Inspector … />} onRun={run} onPublish={publish}>\n  <NodeCanvas … />\n</CanvasEditor>`,
};

export default playground;
