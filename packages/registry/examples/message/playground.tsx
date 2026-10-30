import { Message } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const statuses = ['sending', 'sent', 'delivered', 'read', 'failed'] as const;

const playground: Playground = {
  initial: { children: 'Смета во вложении', time: '14:07', status: 'sent' },
  render: (p) => (
    <div className="w-full max-w-md">
      <Message
        direction={p.pick('direction', ['incoming', 'outgoing'] as const)}
        time={p.text('time') || undefined}
        status={p.text('status') ? p.pick('status', statuses) : undefined}
        onRetry={() => {}}
      >
        {p.text('children')}
      </Message>
    </div>
  ),
  code: (p) => `<Message${p.attrs(['direction', 'time', 'status'])}${p.text('status') === 'failed' ? ' onRetry={resend}' : ''}>
  ${p.text('children')}
</Message>`,
};

export default playground;
