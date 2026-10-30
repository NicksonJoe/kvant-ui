import { Search } from 'lucide-react';
import { Field, Input } from '@/kvant';

export default function InputAddons() {
  return (
    <div className="flex w-80 flex-col gap-4">
      <Field label="Бюджет проекта">
        <Input inputMode="numeric" defaultValue="1 284 900" suffix={<span className="text-fg-3">₽</span>} />
      </Field>
      <Input aria-label="Поиск по CRM" placeholder="Поиск по CRM" prefix={<Search />} kbd="⌘K" />
    </div>
  );
}
