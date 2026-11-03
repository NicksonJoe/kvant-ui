import { TriangleAlert } from 'lucide-react';
import { Button, POPCONFIRM_SIZES, POPCONFIRM_TONES, Popconfirm } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const sides = ['top', 'bottom', 'left', 'right'] as const;
const aligns = ['start', 'center', 'end'] as const;

const playground: Playground = {
  initial: {
    title: 'Удалить комментарий?',
    description: 'Его уже прочитали 3 участника сделки. Отменить можно в течение 7 секунд.',
    confirmLabel: 'Удалить',
    tone: 'danger',
  },
  controls: [{ name: 'icon', type: 'boolean', default: false, description: 'Иконка 20 перед текстом.' }],
  render: (p) => (
    <Popconfirm
      title={p.text('title')}
      description={p.text('description') || undefined}
      confirmLabel={p.text('confirmLabel') || undefined}
      tone={p.pick('tone', POPCONFIRM_TONES)}
      size={p.pick('size', POPCONFIRM_SIZES)}
      side={p.pick('side', sides)}
      align={p.pick('align', aligns)}
      loading={p.bool('loading')}
      error={p.text('error') || undefined}
      icon={p.bool('icon') ? <TriangleAlert /> : undefined}
      onConfirm={() => {}}
    >
      <Button variant="secondary">Удалить…</Button>
    </Popconfirm>
  ),
  code: (p) => `<Popconfirm${p.attrs(['title', 'description', 'confirmLabel', 'tone', 'size', 'side', 'align', 'loading', 'error'])}${
    p.bool('icon') ? ' icon={<TriangleAlert />}' : ''
  } onConfirm={remove}>
  <Button variant="secondary">Удалить…</Button>
</Popconfirm>`,
};

export default playground;
