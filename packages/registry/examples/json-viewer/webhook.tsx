import { Badge, JsonViewer, type JsonValue } from '@/kvant';

const payload: JsonValue = {
  id: 1042,
  title: 'Сайт и CRM-интеграция',
  amount: 640000,
  closed: false,
  lostReason: null,
  client: {
    name: 'Орбита Лаб',
    contacts: [
      { name: 'Илья Громов', phone: '+7 900 123-45-67' },
      { name: 'Анна Северова', phone: '+7 900 765-43-21', role: 'бухгалтер' },
    ],
  },
  history: [
    { at: '2026-10-02T10:14:00+03:00', stage: 'qualification', by: 'Илья Громов' },
    { at: '2026-10-05T16:40:00+03:00', stage: 'negotiation', by: 'Илья Громов' },
    { at: '2026-10-09T12:05:00+03:00', stage: 'negotiation', by: 'Анна Северова' },
    { at: '2026-10-12T09:30:00+03:00', stage: 'negotiation', by: 'Илья Громов' },
    { at: '2026-10-15T18:20:00+03:00', stage: 'proposal', by: 'Илья Громов' },
    { at: '2026-10-17T11:00:00+03:00', stage: 'proposal', by: 'Вера Лебедева' },
    { at: '2026-10-20T14:45:00+03:00', stage: 'proposal', by: 'Илья Громов' },
    { at: '2026-10-22T10:10:00+03:00', stage: 'contract', by: 'Анна Северова' },
    { at: '2026-10-24T15:35:00+03:00', stage: 'contract', by: 'Илья Громов' },
    { at: '2026-10-28T13:00:00+03:00', stage: 'contract', by: 'Илья Громов' },
    { at: '2026-10-30T17:25:00+03:00', stage: 'contract', by: 'Пётр Ильин' },
    { at: '2026-11-04T13:18:00+03:00', stage: 'contract', by: 'Илья Громов' },
  ],
};

/** A webhook from the integration log: click a row or press ⇧⌘C to copy its JSONPath. */
export default function Webhook() {
  return (
    <JsonViewer
      className="w-full max-w-190"
      title="webhook · deal.updated"
      meta={
        <>
          <Badge tone="success" className="rounded-xs px-1.5 font-mono text-[11px] font-semibold">
            200
          </Badge>
          <span className="text-caption text-fg-3">сегодня 13:18 · 1,2 КБ</span>
        </>
      }
      value={payload}
      defaultExpanded={['$', '$.client', '$.client.contacts', '$.client.contacts[0]']}
    />
  );
}
