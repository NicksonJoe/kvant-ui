import { Pencil } from 'lucide-react';
import { VisuallyHidden, buttonClasses } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { children: 'Изменить сделку «Айдентика»' },
  render: (p) => (
    <div className="flex flex-col items-center gap-3">
      <button type="button" className={buttonClasses({ variant: 'secondary', iconOnly: true })}>
        <Pencil aria-hidden />
        <VisuallyHidden>{p.text('children')}</VisuallyHidden>
      </button>
      <span className="text-caption text-fg-3">диктор слышит: «{p.text('children')}, кнопка»</span>
    </div>
  ),
  code: (p) => `<button type="button">
  <Pencil aria-hidden />
  <VisuallyHidden>${p.text('children')}</VisuallyHidden>
</button>`,
};

export default playground;
