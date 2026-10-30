import { Message } from '@/kvant';

export default function MessageStatuses() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Message direction="outgoing" time="14:07" status="sending">
        Смета во вложении
      </Message>
      <Message direction="outgoing" time="14:07" status="sent">
        Смета во вложении
      </Message>
      <Message direction="outgoing" time="14:07" status="delivered">
        Смета во вложении
      </Message>
      <Message direction="outgoing" time="14:07" status="read" footer={<span className="text-caption text-fg-3">Прочитано в 14:08</span>}>
        Смета во вложении
      </Message>
      <Message direction="outgoing" status="failed" onRetry={() => {}}>
        Смета во вложении
      </Message>
    </div>
  );
}
