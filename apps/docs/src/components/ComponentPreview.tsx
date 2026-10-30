import { cn } from '@/kvant';
import { createPropReader, initialValues, type ReadyComponentMeta } from '@/kvant/meta';
import { getPlayground } from '../lib/registry';
import { FitScale } from './FitScale';
import { THUMBNAILS } from './thumbnails';

/** Live mini-preview for catalogue cards: inert, scaled down to fit. */
export function ComponentPreview({ meta, className }: { meta: ReadyComponentMeta; className?: string }) {
  const playground = getPlayground(meta.id);
  const props = [...meta.props, ...(playground?.controls ?? [])];
  const content =
    THUMBNAILS[meta.id] ?? (playground ? playground.render(createPropReader(props, initialValues(props, playground.initial))) : null);

  return (
    <FitScale className={cn('docs-stage p-5', className)}>
      <div inert aria-hidden>
        {content}
      </div>
    </FitScale>
  );
}
