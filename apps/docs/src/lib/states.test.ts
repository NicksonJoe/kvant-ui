import { describe, expect, it } from 'vitest';
import type { ReadyComponentMeta, StateMeta } from '@/kvant/meta';
import { stateLanes } from './states';

function demo(states: readonly StateMeta[]): ReadyComponentMeta {
  return {
    id: 'demo',
    status: 'stable',
    title: 'Демо',
    description: 'Компонент для теста.',
    category: 'actions',
    source: { file: 'components/demo.tsx', exports: ['Demo'] },
    dependencies: { npm: [], registry: [] },
    props: [],
    slots: [],
    states,
    keyboard: [],
    a11y: [],
    motion: [],
    examples: [],
  };
}

const button = demo([
  { id: 'rest', label: 'покой', description: '' },
  { id: 'hover', label: 'наведение', description: '' },
  { id: 'pressed', label: 'нажатие', description: '', selector: ':active · scale .97' },
  { id: 'open', label: 'открыто', description: '' },
  { id: 'disabled', label: 'отключено', description: '', props: { disabled: true } },
  { id: 'read-only', label: 'только чтение', description: '', props: { readOnly: true, defaultValue: 'КП-114' } },
]);

describe('stateLanes', () => {
  it('keeps the states a static cell can show: rest, forced ones and the ones set by props', () => {
    expect(stateLanes(button).map((lane) => [lane.key, lane.forced, lane.selector])).toEqual([
      ['rest', undefined, 'default'],
      ['hover', 'hover', ':hover'],
      ['pressed', 'pressed', ':active · scale .97'],
      ['disabled', undefined, 'disabled'],
      ['read-only', undefined, 'readOnly'],
    ]);
  });

  it('follows an explicit column list', () => {
    expect(stateLanes(button, ['rest', 'disabled']).map((lane) => lane.key)).toEqual(['rest', 'disabled']);
  });

  it('falls back to the resting look when no state can be drawn', () => {
    expect(stateLanes(demo([{ id: 'open', label: 'открыто', description: '' }]))).toEqual([
      { key: 'rest', label: 'покой', selector: 'default', props: {} },
    ]);
  });
});
