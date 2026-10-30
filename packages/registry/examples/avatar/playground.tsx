import { AVATAR_SIZES, Avatar } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const statuses = ['online', 'away', 'busy', 'offline'] as const;

const playground: Playground = {
  initial: { name: 'Анна Северова' },
  render: (p) => (
    <Avatar
      name={p.text('name') || 'Без имени'}
      size={p.pick('size', AVATAR_SIZES)}
      status={p.text('status') ? p.pick('status', statuses) : undefined}
    />
  ),
  code: (p) => `<Avatar${p.attrs(['name', 'size', 'status'])} />`,
};

export default playground;
