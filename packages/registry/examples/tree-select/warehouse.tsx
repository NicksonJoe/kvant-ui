import { useState } from 'react';
import { Field, TreeSelect } from '@/kvant';
import { regions } from './data';

export default function TreeSelectWarehouse() {
  const [warehouse, setWarehouse] = useState<string | null>('msk-south');
  const district = warehouse !== null && ['cfo', 'szfo', 'ufo', 'pfo'].includes(warehouse);
  return (
    <Field label="Склад отгрузки" error={district ? 'Нужен конкретный склад, а не округ' : undefined} className="w-104 max-w-full">
      <TreeSelect aria-label="Склад отгрузки" nodes={regions} value={warehouse} onValueChange={setWarehouse} placeholder="Выберите склад" />
    </Field>
  );
}
