import { useState } from 'react';
import { CanvasEditor, SegmentedControl } from '@/kvant';
import { DemoCanvas, DemoInspector, DemoPalette } from './workflow';

type Layout = 'all' | 'canvas';
type Width = 'wide' | 'narrow';

export default function CanvasEditorZones() {
  const [layout, setLayout] = useState<Layout>('all');
  const [width, setWidth] = useState<Width>('wide');
  const open = layout === 'all';
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {width === 'wide' ? (
          <SegmentedControl
            aria-label="Зоны редактора"
            value={layout}
            onValueChange={setLayout}
            options={[
              { value: 'all', label: 'Три зоны' },
              { value: 'canvas', label: 'Только канвас' },
            ]}
          />
        ) : null}
        <SegmentedControl
          aria-label="Ширина редактора"
          value={width}
          onValueChange={setWidth}
          options={[
            { value: 'wide', label: 'Широкий' },
            { value: 'narrow', label: 'Колонка 720' },
          ]}
        />
      </div>
      {/* the key remounts the editor: a narrow one starts with the palette folded and zones over the canvas */}
      <CanvasEditor
        key={width}
        className={width === 'narrow' ? 'h-[600px] w-full max-w-[720px] rounded-xl shadow-raised' : 'h-[600px] w-full rounded-xl shadow-raised'}
        breadcrumbs={[{ label: 'Автоматизации', href: '#' }]}
        title="Заявка из Telegram → сделка"
        version="Черновик · опубликована v7"
        saved="сохранено только что"
        paletteOpen={width === 'wide' ? open : undefined}
        onPaletteOpenChange={width === 'wide' ? (next) => setLayout(next ? 'all' : 'canvas') : undefined}
        inspectorOpen={width === 'wide' ? open : undefined}
        onInspectorOpenChange={width === 'wide' ? (next) => setLayout(next ? 'all' : 'canvas') : undefined}
        palette={<DemoPalette onInsert={() => undefined} />}
        inspector={<DemoInspector />}
        onValidate={() => undefined}
        onRun={() => undefined}
        onPublish={() => undefined}
      >
        <DemoCanvas />
      </CanvasEditor>
    </div>
  );
}
