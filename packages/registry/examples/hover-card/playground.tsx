import { Avatar, HoverCard, HoverCardContent, HoverCardTrigger } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <HoverCard>
      <HoverCardTrigger href="#anna-severova">Анна Северова</HoverCardTrigger>
      <HoverCardContent
        side={p.pick('side', ['top', 'bottom', 'left', 'right'] as const)}
        align={p.pick('align', ['start', 'center', 'end'] as const)}
        sideOffset={p.pick('sideOffset', [4, 8, 12] as const)}
      >
        <div className="flex items-center gap-3">
          <Avatar name="Анна Северова" size={48} status="online" />
          <div className="flex flex-col">
            <span className="text-label-md font-semibold">Анна Северова</span>
            <span className="text-body-xs text-fg-3">Аккаунт-менеджер · в сети</span>
          </div>
        </div>
        <p className="text-body-xs text-fg-2">Ведёт ключевых клиентов digital-направления.</p>
      </HoverCardContent>
    </HoverCard>
  ),
  code: (p) => `<HoverCard>
  <HoverCardTrigger href="/team/anna">Анна Северова</HoverCardTrigger>
  <HoverCardContent${p.attrs(['side', 'align', 'sideOffset'])}>
    <div className="flex items-center gap-3">
      <Avatar name="Анна Северова" size={48} status="online" />
      …
    </div>
  </HoverCardContent>
</HoverCard>`,
};

export default playground;
