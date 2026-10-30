import { ArrowRight, Download, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/kvant';

export default function ButtonIconsAndLoading() {
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1600);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button leadingIcon={<Plus />}>Новая сделка</Button>
      <Button variant="secondary" leadingIcon={<Download />} loading={saving} onClick={save}>
        Скачать отчёт
      </Button>
      <Button variant="ghost" trailingIcon={<ArrowRight />}>
        Все клиенты
      </Button>
    </div>
  );
}
