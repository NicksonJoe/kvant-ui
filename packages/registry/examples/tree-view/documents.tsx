import { TreeView, type TreeNode } from '@/kvant';

const documents: readonly TreeNode[] = [
  {
    id: 'sever',
    label: '«Студия Север»',
    meta: '24',
    children: [
      {
        id: 'contracts',
        label: 'Договоры',
        meta: '3',
        children: [
          { id: 'c-117', label: 'Договор № 24-117.pdf', meta: '184 КБ' },
          { id: 'c-act', label: 'Акт сверки, октябрь.pdf', meta: '96 КБ' },
          { id: 'c-add', label: 'Доп. соглашение № 2.pdf', meta: '72 КБ' },
        ],
      },
      { id: 'brandbook', label: 'Брендбук', meta: '12', children: [{ id: 'b-logo', label: 'Логотип.svg', meta: '18 КБ' }] },
      { id: 'brief', label: 'Бриф.docx', meta: '48 КБ' },
    ],
  },
  { id: 'polus', label: 'Полюс', meta: '8', children: [{ id: 'p-estimate', label: 'Смета.xlsx', meta: '32 КБ' }] },
  { id: 'orbita', label: '«Орбита Лаб»', meta: 'Загрузка…', loading: true },
  { id: 'litera', label: 'Литера', meta: '15', children: [{ id: 'l-brief', label: 'Бриф.pdf', meta: '210 КБ' }] },
];

export default function TreeViewDocuments() {
  return (
    <div className="w-full max-w-sm rounded-xl bg-surface-1 p-2 shadow-raised">
      <TreeView aria-label="Документы клиента" nodes={documents} defaultExpanded={['sever', 'contracts']} defaultSelected="c-117" />
    </div>
  );
}
