import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';
import * as kvant from '..';
import {
  CATEGORY_IDS,
  categories,
  components,
  createPropReader,
  getComponent,
  initialValues,
  isReady,
  type Playground,
  type ReadyComponentMeta,
} from '../meta';

const examples = import.meta.glob<{ default: ComponentType }>(['../examples/*/*.tsx', '!../examples/*/playground.tsx'], {
  eager: true,
});
const playgrounds = import.meta.glob<{ default: Playground }>('../examples/*/playground.tsx', { eager: true });
const ready = components.filter(isReady);

const enumProps = (meta: ReadyComponentMeta) =>
  new Map(meta.props.filter((prop) => prop.options !== undefined).map((prop) => [prop.name, prop.options ?? []]));

describe('registry meta', () => {
  it('maps the whole inventory: 114 components with unique ids in 11 categories', () => {
    expect(components).toHaveLength(114);
    expect(new Set(components.map((meta) => meta.id)).size).toBe(components.length);
    expect(categories.map((category) => category.id)).toEqual(CATEGORY_IDS);
    for (const category of categories) {
      for (const meta of category.components) expect(meta.category, meta.id).toBe(category.id);
    }
  });

  it('only links related components that exist', () => {
    for (const meta of components) {
      for (const id of meta.related ?? []) expect(getComponent(id), `${meta.id} → ${id}`).toBeDefined();
    }
  });

  it.each(ready.map((meta) => [meta.id, meta] as const))('%s: exports, examples and playground exist', (id, meta) => {
    for (const name of meta.source.exports) expect(kvant, `${id} exports ${name}`).toHaveProperty(name);
    expect(meta.examples.length, `${id} examples`).toBeGreaterThanOrEqual(2);
    for (const example of meta.examples) expect(examples, `${id}/${example.id}`).toHaveProperty([`../examples/${id}/${example.id}.tsx`]);
    expect(playgrounds, `${id} playground`).toHaveProperty([`../examples/${id}/playground.tsx`]);
  });

  it.each(ready.map((meta) => [meta.id, meta] as const))('%s: defaults, matrix and states are consistent', (id, meta) => {
    for (const prop of meta.props) {
      if (prop.options && prop.default !== undefined) expect(prop.options, `${id}.${prop.name}`).toContain(prop.default);
    }
    const options = enumProps(meta);
    if (meta.propsOf) expect(meta.source.exports, `${id} propsOf`).toContain(meta.propsOf);
    if (meta.matrix?.rowProp) expect(options.has(meta.matrix.rowProp), `${id} rowProp`).toBe(true);
    if (meta.matrix?.columnProp) expect(options.has(meta.matrix.columnProp), `${id} columnProp`).toBe(true);
    const states = new Set(meta.states.map((state) => state.id));
    for (const column of meta.matrix?.columns ?? []) expect(states.has(column), `${id} column ${column}`).toBe(true);
  });
});

describe('examples and playgrounds', () => {
  it.each(Object.entries(examples))('%s renders', (_path, module) => {
    const Example = module.default;
    const { container } = render(<Example />);
    expect(container.childElementCount).toBeGreaterThan(0);
  });

  it.each(ready.map((meta) => [meta.id, meta] as const))('%s playground renders and prints code', (id, meta) => {
    const playground = playgrounds[`../examples/${id}/playground.tsx`]?.default;
    if (!playground) throw new Error(`${id}: no playground`);
    const props = [...meta.props, ...(playground.controls ?? [])];
    const read = createPropReader(props, initialValues(props, playground.initial));
    const { container } = render(<>{playground.render(read)}</>);
    expect(container.childElementCount).toBeGreaterThan(0);
    expect(playground.code(read)).toMatch(/^</);
  });
});
