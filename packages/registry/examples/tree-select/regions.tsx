import { useState } from 'react';
import { TreeSelect } from '@/kvant';
import { regions } from './data';

const plural = new Intl.PluralRules('ru');
const word = (n: number) => {
  const rule = plural.select(n);
  return rule === 'one' ? 'склад' : rule === 'few' ? 'склада' : 'складов';
};

export default function TreeSelectRegions() {
  const [picked, setPicked] = useState<string[]>(['msk-north', 'msk-south', 'msk-vnukovo', 'tula-center', 'tula-north', 'mo-sergiev', 'mo-khimki', 'ekb', 'chel', 'tyumen']);
  return (
    <div className="flex w-104 max-w-full flex-col gap-1.5">
      <span className="text-label-sm font-medium text-fg-2">Регионы продаж</span>
      <TreeSelect
        multiple
        searchable
        aria-label="Регионы продаж"
        nodes={regions}
        value={picked}
        onValueChange={setPicked}
        defaultExpanded={['cfo']}
        placeholder="Выберите регионы"
        summary={(leaves) => `Выбрано: ${leaves.length} ${word(leaves.length)}`}
      />
    </div>
  );
}
