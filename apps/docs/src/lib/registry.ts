import { createElement, type ComponentType, type ReactNode } from 'react';
import * as kvant from '@/kvant';
import {
  categories,
  createPropReader,
  initialValues,
  isReady,
  type CategoryMeta,
  type ComponentMeta,
  type Playground,
  type PropValues,
  type ReadyComponentMeta,
} from '@/kvant/meta';

const EXAMPLES = '../../../../packages/registry/examples/';
const exampleModules = import.meta.glob<{ default: ComponentType }>(
  ['../../../../packages/registry/examples/*/*.tsx', '!../../../../packages/registry/examples/*/playground.tsx'],
  { eager: true },
);
const playgroundModules = import.meta.glob<{ default: Playground }>('../../../../packages/registry/examples/*/playground.tsx', {
  eager: true,
});
const exampleSources = import.meta.glob<string>(
  ['../../../../packages/registry/examples/*/*.tsx', '!../../../../packages/registry/examples/*/playground.tsx'],
  { query: '?raw', import: 'default' },
);
const componentSources = import.meta.glob<string>('../../../../packages/registry/components/*.tsx', {
  query: '?raw',
  import: 'default',
});

/** The example as an element (examples are static modules, so this is a lookup, not a new component). */
export function renderExample(componentId: string, exampleId: string): ReactNode {
  const Example = exampleModules[`${EXAMPLES}${componentId}/${exampleId}.tsx`]?.default;
  return Example ? createElement(Example) : null;
}

export function getPlayground(componentId: string): Playground | undefined {
  return playgroundModules[`${EXAMPLES}${componentId}/playground.tsx`]?.default;
}

/** The component as its playground draws it, with the initial values plus `values` (a state, a row, a specimen). */
export function renderPlayground(meta: ReadyComponentMeta, values: PropValues = {}): ReactNode {
  const playground = getPlayground(meta.id);
  if (!playground) return null;
  const props = [...meta.props, ...(playground.controls ?? [])];
  return playground.render(createPropReader(props, { ...initialValues(props, playground.initial), ...values }));
}

export function loadExampleSource(componentId: string, exampleId: string): Promise<string> {
  const load = exampleSources[`${EXAMPLES}${componentId}/${exampleId}.tsx`];
  return load ? load() : Promise.reject(new Error(`No example ${componentId}/${exampleId}`));
}

/** `file` as in the meta: `components/button.tsx`. */
export function loadComponentSource(file: string): Promise<string> {
  const load = componentSources[`../../../../packages/registry/${file}`];
  return load ? load() : Promise.reject(new Error(`No source ${file}`));
}

/** Ready components first, then planned; inventory order inside each group. */
export function navComponents(category: CategoryMeta): ComponentMeta[] {
  return [...category.components.filter(isReady), ...category.components.filter((meta) => !isReady(meta))];
}

/** Reading order of the whole library: the sidebar order, used for prev/next. */
export const componentOrder: readonly ComponentMeta[] = categories.flatMap(navComponents);

export const readyComponents: readonly ReadyComponentMeta[] = categories.flatMap((category) => category.components.filter(isReady));

/** Prev / next targets over the sidebar order. */
export function neighbours(meta: ComponentMeta) {
  const index = componentOrder.findIndex((item) => item.id === meta.id);
  const target = (item: ComponentMeta | undefined) =>
    item ? { to: `/components/${item.id}`, title: item.title, caption: categoryOf(item).title } : undefined;
  return { prev: target(componentOrder[index - 1]), next: target(componentOrder[index + 1]) };
}

export function categoryOf(meta: ComponentMeta): CategoryMeta {
  const category = categories.find((item) => item.id === meta.category);
  if (!category) throw new Error(`Unknown category ${meta.category}`);
  return category;
}

const kvantExports = new Set(Object.keys(kvant));

/** Prepends the imports a snippet needs: Kvant names from `@/kvant`, other JSX tags (icons) from lucide-react. */
export function withImports(code: string): string {
  const words = new Set(code.match(/\b[A-Za-z_]\w*\b/g) ?? []);
  const fromKvant = [...words].filter((word) => kvantExports.has(word)).sort();
  const tags = new Set([...code.matchAll(/<([A-Z]\w*)/g)].map((match) => match[1] ?? ''));
  const icons = [...tags].filter((tag) => tag && !kvantExports.has(tag)).sort();
  const lines: string[] = [];
  if (icons.length > 0) lines.push(`import { ${icons.join(', ')} } from 'lucide-react';`);
  if (fromKvant.length > 0) lines.push(`import { ${fromKvant.join(', ')} } from '@/kvant';`);
  return lines.length > 0 ? `${lines.join('\n')}\n\n${code}` : code;
}

const plural = new Intl.PluralRules('ru');
type PluralForms = Record<'one' | 'few' | 'many', string>;

/** The form that agrees with the number: 1 → one, 3 → few, 36 → many. */
export function pluralWord(count: number, forms: PluralForms): string {
  const rule = plural.select(count);
  return rule === 'one' || rule === 'few' ? forms[rule] : forms.many;
}

/** «1 компонент», «3 компонента», «36 компонентов» (with a no-break space). */
export function pluralize(count: number, forms: PluralForms): string {
  return `${count}\u00a0${pluralWord(count, forms)}`;
}
