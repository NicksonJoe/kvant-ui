import { Columns3, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
import { SegmentedControl } from '@/kvant';

type View = 'list' | 'board' | 'grid';

export default function SegmentedControlView() {
  const [view, setView] = useState<View>('board');
  return (
    <div className="flex flex-col items-center gap-3">
      <SegmentedControl<View>
        aria-label="Вид сделок"
        size="md"
        value={view}
        onValueChange={setView}
        options={[
          { value: 'list', label: <><List className="size-4" aria-hidden /> Список</> },
          { value: 'board', label: <><Columns3 className="size-4" aria-hidden /> Доска</> },
          { value: 'grid', label: <><LayoutGrid className="size-4" aria-hidden /> Плитка</> },
        ]}
      />
      <p className="text-body-xs text-fg-3">Выбран вид: {view === 'list' ? 'список' : view === 'board' ? 'доска' : 'плитка'}</p>
    </div>
  );
}
