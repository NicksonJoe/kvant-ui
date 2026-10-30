import { describe, expect, it } from 'vitest';
import { searchIndex } from './search';
import { TOKENS } from './tokens';

const groups = searchIndex();
const entries = groups.flatMap((group) => group.entries);

describe('searchIndex', () => {
  it('reaches every top-level page, the check page included', () => {
    expect(entries.map((entry) => entry.to)).toEqual(expect.arrayContaining(['/docs', '/components', '/playground', '/themes', '/check']));
  });

  it('reaches sections of the docs, not only pages', () => {
    expect(entries).toContainEqual(expect.objectContaining({ label: 'Пружины', hint: 'Движение', to: '/docs/motion#springs' }));
  });

  it('finds components by id and by their English exports', () => {
    const button = entries.find((entry) => entry.to === '/components/button');
    expect(button?.keywords).toEqual(expect.arrayContaining(['button', 'IconButton']));
  });

  it('lists every token with a link to its row', () => {
    expect(entries).toContainEqual(expect.objectContaining({ label: '--color-accent', to: '/docs/tokens#token-color-accent' }));
    expect(groups.find((group) => group.label === 'Токены')?.entries).toHaveLength(TOKENS.length);
  });

  it('gives every entry a unique id', () => {
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
  });
});
