import { Editable } from '@/kvant';

const details = [
  { label: 'Клиент', value: 'Студия «Север»' },
  { label: 'Контакт', value: 'Анна Северова' },
  { label: 'Сайт', value: 'studio-sever.ru' },
];

export default function EditableDetails() {
  return (
    <dl className="grid w-full max-w-104 grid-cols-[96px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 text-body-sm">
      {details.map((detail) => (
        <div key={detail.label} className="contents">
          <dt className="text-fg-3">{detail.label}</dt>
          <dd className="min-w-0 text-fg-1">
            <Editable aria-label={detail.label} defaultValue={detail.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
