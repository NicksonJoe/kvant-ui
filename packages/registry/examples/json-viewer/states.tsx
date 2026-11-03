import { JsonDiff, JsonViewer } from '@/kvant';

const broken = `{
  "id": 1042,
  "title": "Сайт и CRM-интеграция",
  "amount": 640000,
  "closed": false,,
  "lostReason": null
}`;

/** A broken payload with the place of the error, loading, and versions that differ only in spaces. */
export default function States() {
  return (
    <div className="grid w-full gap-3 md:grid-cols-2">
      <JsonViewer className="md:col-span-2" title="webhook · deal.updated" meta={<span className="text-caption text-fg-3">сегодня 13:20 · 0,1 КБ</span>} value={broken} />
      <JsonViewer title="webhook · deal.created" value={{}} loading />
      <JsonDiff title="deal-1042.json" before={{ stage: 'contract', amount: 640000 }} after={'{\n    "stage": "contract",\n    "amount": 640000\n}'} />
    </div>
  );
}
