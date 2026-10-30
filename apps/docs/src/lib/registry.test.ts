import { describe, expect, it } from 'vitest';
import { categories, isReady } from '@/kvant/meta';
import { componentOrder, pluralize, withImports } from './registry';

describe('withImports', () => {
  it('imports Kvant names from @/kvant and other JSX tags from lucide-react', () => {
    const code = '<Button leadingIcon={<Plus />} onClick={() => toast.add({ title: "Готово" })}>Создать</Button>';
    expect(withImports(code)).toBe(
      `import { Plus } from 'lucide-react';\nimport { Button, toast } from '@/kvant';\n\n${code}`,
    );
  });

  it('leaves code without known names alone', () => {
    expect(withImports('<div className="flex" />')).toBe('<div className="flex" />');
  });
});

describe('pluralize', () => {
  it('agrees the noun with the number and keeps them together', () => {
    const forms = { one: 'компонент', few: 'компонента', many: 'компонентов' };
    expect(pluralize(1, forms)).toBe('1 компонент');
    expect(pluralize(3, forms)).toBe('3 компонента');
    expect(pluralize(36, forms)).toBe('36 компонентов');
  });
});

describe('componentOrder', () => {
  it('lists every component once, ready ones first inside each category', () => {
    expect(new Set(componentOrder.map((meta) => meta.id)).size).toBe(componentOrder.length);
    for (const category of categories) {
      const ready = componentOrder.filter((meta) => meta.category === category.id).map(isReady);
      expect(ready, category.id).toEqual([...ready].sort((a, b) => Number(b) - Number(a)));
    }
  });
});
