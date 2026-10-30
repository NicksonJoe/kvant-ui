import { TreeView } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  controls: [{ name: 'loading', type: 'boolean', default: false, description: 'Ветка «Полюс» загружается.' }],
  render: (p) => (
    <div className="w-full max-w-sm rounded-xl bg-surface-1 p-2 shadow-raised">
      <TreeView
        aria-label="Документы клиента"
        defaultExpanded={['sever']}
        nodes={[
          {
            id: 'sever',
            label: '«Студия Север»',
            meta: '3',
            children: [
              { id: 'contracts', label: 'Договоры', meta: '1', children: [{ id: 'c-117', label: 'Договор № 24-117.pdf', meta: '184 КБ' }] },
              { id: 'brief', label: 'Бриф.docx', meta: '48 КБ' },
            ],
          },
          p.bool('loading')
            ? { id: 'polus', label: 'Полюс', meta: 'Загрузка…', loading: true }
            : { id: 'polus', label: 'Полюс', meta: '1', children: [{ id: 'p1', label: 'Смета.xlsx', meta: '32 КБ' }] },
        ]}
      />
    </div>
  ),
  code: (p) => `<TreeView
  aria-label="Документы клиента"
  defaultExpanded={['sever']}
  nodes={[
    {
      id: 'sever',
      label: '«Студия Север»',
      children: [
        { id: 'contracts', label: 'Договоры', children: [{ id: 'c-117', label: 'Договор № 24-117.pdf', meta: '184 КБ' }] },
        { id: 'brief', label: 'Бриф.docx', meta: '48 КБ' },
      ],
    },
    { id: 'polus', label: 'Полюс'${p.bool('loading') ? ", meta: 'Загрузка…', loading: true" : ', children: [/* … */]'} },
  ]}
/>`,
};

export default playground;
