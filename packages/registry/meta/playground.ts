import type { ReactNode } from 'react';
import type { PropMeta, PropValue, PropValues } from './types';

/** Typed access to the values edited in the Controls panel; every read is validated against the meta. */
export interface PropReader {
  text(name: string): string;
  bool(name: string): boolean;
  num(name: string): number;
  /** One of `options`; an unknown value falls back to the meta default, then to the first option. */
  pick<T extends PropValue>(name: string, options: readonly T[]): T;
  /** JSX attributes for the props that differ from their defaults: ` variant="soft" loading`. */
  attrs(names: readonly string[]): string;
}

/** Live demo of a ready component: the same values render the preview and print its code. */
export interface Playground {
  /** Starting values for props without a component default (label text, placeholder…). */
  initial?: PropValues;
  /** Extra knobs that are not props, e.g. «icon: on/off»; shown in Controls, not in the API table. */
  controls?: readonly PropMeta[];
  render(props: PropReader): ReactNode;
  code(props: PropReader): string;
}

export function initialValues(props: readonly PropMeta[], initial: PropValues = {}): PropValues {
  const values: Record<string, PropValue> = {};
  for (const prop of props) {
    if (prop.default !== undefined) values[prop.name] = prop.default;
  }
  return { ...values, ...initial };
}

function formatAttr(name: string, value: PropValue | undefined, meta: PropMeta | undefined): string {
  if (value === undefined || value === '' || value === meta?.default) return '';
  if (value === false) return meta?.default === true ? ` ${name}={false}` : '';
  if (value === true) return ` ${name}`;
  if (typeof value === 'number') return ` ${name}={${value}}`;
  return /["{}]/.test(value) ? ` ${name}={${JSON.stringify(value)}}` : ` ${name}="${value}"`;
}

export function createPropReader(props: readonly PropMeta[], values: PropValues): PropReader {
  const metas = new Map(props.map((prop) => [prop.name, prop]));
  const get = (name: string): PropValue | undefined => values[name] ?? metas.get(name)?.default;

  return {
    text: (name) => String(get(name) ?? ''),
    bool: (name) => get(name) === true,
    num: (name) => {
      const value = Number(get(name));
      return Number.isFinite(value) ? value : 0;
    },
    pick: (name, options) => {
      const same = (value: PropValue | undefined) => options.find((option) => String(option) === String(value));
      const match = same(get(name)) ?? same(metas.get(name)?.default) ?? options[0];
      if (match === undefined) throw new Error(`Prop «${name}» has no options`);
      return match;
    },
    attrs: (names) => names.map((name) => formatAttr(name, values[name], metas.get(name))).join(''),
  };
}
