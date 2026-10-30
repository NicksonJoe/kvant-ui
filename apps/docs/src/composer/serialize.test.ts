import { describe, expect, it } from 'vitest';
import { node, text } from './catalog';
import { blockItem, generateCode } from './codegen';
import { CHILDREN, ROOT_ID, emptyRoot, flatten, type ComposerNode } from './model';
import { decodeShare, encodeShare, parseDoc, parseImport, stringifyDoc } from './serialize';
import { TEMPLATES } from './templates';

function page(...blocks: ComposerNode[]): ComposerNode {
  return { ...emptyRoot(), slots: { [CHILDREN]: blocks } };
}

const doc = (root: unknown) => ({ format: 'kvant-composer', version: 1, root });

function template(id: string): ComposerNode {
  const found = TEMPLATES.find((item) => item.id === id);
  if (!found) throw new Error(`No template ${id}`);
  return found.create();
}

describe('round trip', () => {
  it.each(TEMPLATES.map((template) => [template.title, template] as const))('«%s» survives JSON unchanged', (_title, template) => {
    const root = page(template.create());
    const json = stringifyDoc(root);
    const parsed = parseImport(json);
    expect(parsed.id).toBe(ROOT_ID);
    expect(stringifyDoc(parsed)).toBe(json);
    expect(generateCode(parsed)).toBe(generateCode(root));
  });

  it('gives every node a fresh unique id and keeps empty containers droppable', () => {
    const root = page(node('stack'), template('deal-card'));
    const parsed = parseImport(stringifyDoc(root));
    const ids = flatten(parsed).map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => id !== ROOT_ID).some((id) => flatten(root).some((item) => item.id === id))).toBe(false);
    expect(parsed.slots[CHILDREN]?.[0]?.slots[CHILDREN]).toEqual([]);
  });

  it('round-trips share links with Cyrillic, quotes and no-break spaces', () => {
    const root = page(text('1 284 900 ₽ · «Хлебница» "ООО"'), node('button', { children: 'Создать' }));
    const encoded = encodeShare(root);
    expect(encoded).toMatch(/^[\w-]+$/);
    expect(stringifyDoc(decodeShare(encoded))).toBe(stringifyDoc(root));
  });

  it('keeps forced states the component has and drops the rest', () => {
    const root = parseDoc(
      doc({
        type: 'stack',
        slots: { children: [{ type: 'button', state: 'hover' }, { type: 'text', state: 'hover' }, { type: 'button', state: 'open' }] },
      }),
    );
    expect(root.slots[CHILDREN]?.map((item) => item.state)).toEqual(['hover', undefined, undefined]);
  });

  it('opens a block saved with «Сохранить как блок»', () => {
    const root = page(template('empty-state'));
    const item = blockItem(root, { name: 'empty-deals', title: 'Пустая воронка', description: '' });
    expect(stringifyDoc(parseImport(JSON.stringify(item)))).toBe(stringifyDoc(root));
  });
});

describe('untrusted input', () => {
  it('drops unknown props, invalid values and unknown slots', () => {
    const root = parseDoc(
      doc({
        type: 'stack',
        props: { gap: 7, align: 'center' },
        slots: {
          children: [{ type: 'button', props: { variant: 'neon', size: 'lg', onClick: 'alert(1)', children: 'Ок' }, slots: { evil: [{ type: 'text' }] } }],
        },
      }),
    );
    expect(root.props).toEqual({ align: 'center' });
    const button = root.slots[CHILDREN]?.[0];
    expect(button?.props).toEqual({ size: 'lg', children: 'Ок' });
    expect(button?.slots).toEqual({});
  });

  it('rejects broken JSON, foreign formats, unknown elements and a non-stack root', () => {
    expect(() => parseImport('{')).toThrow('Это не JSON');
    expect(() => parseImport('{"format":"figma"}')).toThrow('Это не документ Playground Kvant');
    expect(() => parseDoc({ format: 'kvant-composer', version: 9, root: { type: 'stack' } })).toThrow('Версия документа 9 не поддерживается');
    expect(() => parseDoc(doc({ type: 'stack', slots: { children: [{ type: 'script' }] } }))).toThrow('Неизвестный элемент «script»');
    expect(() => parseDoc(doc({ type: 'text' }))).toThrow('Корнем документа должен быть стек');
    expect(() => parseDoc(doc({ type: 'stack', slots: { children: 'all' } }))).toThrow('Слот «children» должен быть списком');
    expect(() => decodeShare('%%%')).toThrow('Ссылка повреждена');
  });

  it('limits nesting depth and size', () => {
    let deep: unknown = { type: 'stack' };
    for (let level = 0; level < 30; level += 1) deep = { type: 'stack', slots: { children: [deep] } };
    expect(() => parseDoc(doc(deep))).toThrow('Вложенность глубже 24 уровней');
    const wide = { type: 'stack', slots: { children: Array.from({ length: 1001 }, () => ({ type: 'text' })) } };
    expect(() => parseDoc(doc(wide))).toThrow('Больше 1000 элементов');
  });
});
