import { describe, expect, it } from 'vitest';
import { createPropReader, initialValues } from '../meta/playground';
import type { PropMeta } from '../meta/types';

const props: readonly PropMeta[] = [
  { name: 'variant', type: 'enum', options: ['primary', 'secondary'], default: 'primary', description: '' },
  { name: 'size', type: 'number', options: [32, 40], default: 32, description: '' },
  { name: 'loading', type: 'boolean', default: false, description: '' },
  { name: 'showClose', type: 'boolean', default: true, description: '' },
  { name: 'placeholder', type: 'string', description: '' },
];

describe('createPropReader', () => {
  it('reads values with the meta defaults as fallback', () => {
    const read = createPropReader(props, { loading: true, placeholder: 'Поиск' });
    expect(read.pick('variant', ['primary', 'secondary'] as const)).toBe('primary');
    expect(read.pick('size', [32, 40] as const)).toBe(32);
    expect(read.bool('loading')).toBe(true);
    expect(read.bool('showClose')).toBe(true);
    expect(read.text('placeholder')).toBe('Поиск');
  });

  it('falls back to the default when a value is not one of the options', () => {
    const read = createPropReader(props, { variant: 'neon' });
    expect(read.pick('variant', ['primary', 'secondary'] as const)).toBe('primary');
  });

  it('prints only the props that differ from their defaults, in JSX syntax', () => {
    const read = createPropReader(props, {
      variant: 'secondary',
      size: 40,
      loading: true,
      showClose: false,
      placeholder: 'Имя «как в паспорте»',
    });
    expect(read.attrs(['variant', 'size', 'loading', 'showClose', 'placeholder'])).toBe(
      ' variant="secondary" size={40} loading showClose={false} placeholder="Имя «как в паспорте»"',
    );
    expect(createPropReader(props, { variant: 'primary', loading: false, placeholder: '' }).attrs(['variant', 'loading', 'placeholder'])).toBe('');
  });

  it('escapes strings that would break a JSX attribute', () => {
    const read = createPropReader(props, { placeholder: 'Скажите "да"' });
    expect(read.attrs(['placeholder'])).toBe(' placeholder={"Скажите \\"да\\""}');
  });
});

describe('initialValues', () => {
  it('merges meta defaults with playground starting values', () => {
    expect(initialValues(props, { placeholder: 'Поиск' })).toEqual({
      variant: 'primary',
      size: 32,
      loading: false,
      showClose: true,
      placeholder: 'Поиск',
    });
  });
});
