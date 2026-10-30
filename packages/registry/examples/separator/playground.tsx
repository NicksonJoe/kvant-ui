import { Separator } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => {
    const orientation = p.pick('orientation', ['horizontal', 'vertical'] as const);
    return orientation === 'horizontal' ? (
      <div className="flex w-64 flex-col gap-3 text-body-sm text-fg-2">
        <span>Сделки</span>
        <Separator />
        <span>Клиенты</span>
      </div>
    ) : (
      <div className="flex h-5 items-center gap-3 text-body-sm text-fg-2">
        <span>Сделки</span>
        <Separator orientation="vertical" />
        <span>Клиенты</span>
      </div>
    );
  },
  code: (p) => `<Separator${p.attrs(['orientation'])} />`,
};

export default playground;
