import { Stack, STACK_GAPS } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <Stack
      direction={p.pick('direction', ['column', 'row'] as const)}
      gap={p.pick('gap', STACK_GAPS)}
      align={p.text('align') === '' ? undefined : p.pick('align', ['start', 'center', 'end', 'stretch', 'baseline'] as const)}
      justify={p.text('justify') === '' ? undefined : p.pick('justify', ['start', 'center', 'end', 'between'] as const)}
      wrap={p.bool('wrap')}
      className="w-full max-w-md rounded-xl bg-surface-1 p-4 shadow-raised"
    >
      {['Контакты', 'Сделки', 'Пользователи'].map((label) => (
        <div key={label} className="rounded-lg bg-fill-1 px-4 py-3 text-label-md font-medium text-fg-1">
          {label}
        </div>
      ))}
    </Stack>
  ),
  code: (p) => `<Stack${p.attrs(['direction', 'gap', 'align', 'justify', 'wrap'])}>…</Stack>`,
};

export default playground;
