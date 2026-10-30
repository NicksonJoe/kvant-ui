import { PromptAttachment } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { name: 'Смета_доработки.pdf', meta: '184 КБ · PDF' },
  render: (p) => (
    <PromptAttachment
      name={p.text('name')}
      meta={p.text('meta') || undefined}
      progress={p.pick('progress', [0, 64, 100] as const)}
      error={p.text('error') || undefined}
      onRemove={() => {}}
    />
  ),
  code: (p) => `<PromptAttachment${p.attrs(['name', 'meta', 'progress', 'error'])} onRemove={removeFile} />`,
};

export default playground;
