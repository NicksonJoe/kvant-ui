import { JsonViewer, type JsonViewerView } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const value = {
  id: 1042,
  title: 'Сайт и CRM-интеграция',
  amount: 640000,
  closed: false,
  lostReason: null,
  client: { name: 'Орбита Лаб', contacts: [{ name: 'Илья Громов', phone: '+7 900 123-45-67' }] },
};

const playground: Playground = {
  initial: { title: 'webhook · deal.updated' },
  controls: [{ name: 'broken', type: 'boolean', default: false, description: 'Документ с лишней запятой.' }],
  render: (p) => (
    <JsonViewer
      key={`${p.pick<JsonViewerView>('defaultView', ['tree', 'text'])}-${p.bool('broken')}`}
      className="w-full max-w-160"
      title={p.text('title')}
      value={p.bool('broken') ? '{\n  "id": 1042,\n  "closed": false,,\n}' : value}
      defaultView={p.pick<JsonViewerView>('defaultView', ['tree', 'text'])}
      loading={p.bool('loading')}
    />
  ),
  code: (p) => `<JsonViewer${p.attrs(['title', 'defaultView', 'loading'])} value={payload} />`,
};

export default playground;
