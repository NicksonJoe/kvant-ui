import { describe, expect, it } from 'vitest';
import { hitTest, resolveDrop, type Box, type Zone } from './drop';

const box = (left: number, top: number, width: number, height: number): Box => ({ left, top, width, height });

describe('hitTest', () => {
  const nodes = [
    { id: 'root', depth: 0, box: box(0, 0, 400, 400) },
    { id: 'card', depth: 1, box: box(20, 20, 300, 200) },
    { id: 'button', depth: 2, box: box(40, 40, 100, 36) },
    { id: 'icon', depth: 3, box: box(52, 50, 16, 16) },
  ];

  it('returns the deepest node under the point', () => {
    expect(hitTest({ x: 60, y: 58 }, nodes)).toBe('icon');
    expect(hitTest({ x: 120, y: 58 }, nodes)).toBe('button');
    expect(hitTest({ x: 200, y: 150 }, nodes)).toBe('card');
    expect(hitTest({ x: 390, y: 390 }, nodes)).toBe('root');
    expect(hitTest({ x: 500, y: 10 }, nodes)).toBeNull();
  });

  it('prefers the smaller box on the same depth', () => {
    expect(hitTest({ x: 5, y: 5 }, [{ id: 'wide', depth: 1, box: box(0, 0, 100, 100) }, { id: 'small', depth: 1, box: box(0, 0, 10, 10) }])).toBe('small');
  });
});

describe('resolveDrop', () => {
  const column: Zone = {
    parentId: 'card',
    slot: 'children',
    depth: 1,
    axis: 'vertical',
    box: box(0, 0, 300, 300),
    children: [
      { id: 'a', box: box(20, 20, 260, 40) },
      { id: 'b', box: box(20, 80, 260, 40) },
    ],
  };
  const row: Zone = {
    parentId: 'row',
    slot: 'children',
    depth: 2,
    axis: 'horizontal',
    box: box(20, 140, 260, 40),
    children: [
      { id: 'x', box: box(20, 140, 80, 40) },
      { id: 'y', box: box(110, 140, 80, 40) },
    ],
  };

  it('inserts by the vertical middle of the children and draws a line in the gap', () => {
    expect(resolveDrop({ x: 50, y: 30 }, [column])?.place).toEqual({ parentId: 'card', slot: 'children', index: 0 });
    const between = resolveDrop({ x: 50, y: 75 }, [column]);
    expect(between?.place.index).toBe(1);
    expect(between?.line).toEqual(box(0, 69, 300, 2));
    expect(resolveDrop({ x: 50, y: 250 }, [column])?.place.index).toBe(2);
  });

  it('picks the deepest zone and inserts before or after the nearest child in a row', () => {
    expect(resolveDrop({ x: 30, y: 160 }, [column, row])?.place).toEqual({ parentId: 'row', slot: 'children', index: 0 });
    const after = resolveDrop({ x: 95, y: 160 }, [column, row]);
    expect(after?.place.index).toBe(1);
    expect(after?.line).toEqual(box(104, 140, 2, 40));
    expect(resolveDrop({ x: 270, y: 160 }, [column, row])?.place.index).toBe(2);
  });

  it('highlights an empty zone instead of drawing a line', () => {
    const empty: Zone = { parentId: 'button', slot: 'leadingIcon', depth: 3, axis: 'horizontal', box: box(40, 40, 24, 24), children: [] };
    expect(resolveDrop({ x: 50, y: 50 }, [column, empty])).toEqual({
      place: { parentId: 'button', slot: 'leadingIcon', index: 0 },
      line: null,
      zone: empty.box,
    });
  });

  it('returns null outside every zone', () => {
    expect(resolveDrop({ x: 900, y: 900 }, [column, row])).toBeNull();
  });
});
