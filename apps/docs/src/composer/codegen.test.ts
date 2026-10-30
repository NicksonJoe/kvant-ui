import { describe, expect, it } from 'vitest';
import { parseItem } from '../../../../packages/cli/src/schema.ts';
import { icon, node, text } from './catalog';
import { blockItem, blockSlug, componentName, generateCode, installCommand, usedComponents } from './codegen';
import { CHILDREN, emptyRoot, type ComposerNode } from './model';
import { TEMPLATES } from './templates';

function page(...blocks: ComposerNode[]): ComposerNode {
  return { ...emptyRoot(), slots: { [CHILDREN]: blocks } };
}

function template(id: string): ComposerNode {
  const found = TEMPLATES.find((item) => item.id === id);
  if (!found) throw new Error(`No template ${id}`);
  return found.create();
}

describe('generateCode', () => {
  it.each(TEMPLATES.map((item) => [item.title, item.id] as const))('prints «%s» as a component with its imports', (_title, id) => {
    expect(generateCode(page(template(id)))).toMatchSnapshot();
  });

  it('wraps several blocks in the page stack', () => {
    const code = generateCode(page(text('Сделки', { variant: 'heading' }), node('button', { children: 'Новая сделка' }, { leadingIcon: [icon('Plus')] })), {
      name: 'Deals',
    });
    expect(code).toMatchSnapshot();
  });

  it('returns null for an empty page and needs no imports', () => {
    expect(generateCode(emptyRoot())).toBe('export function Block() {\n  return null;\n}\n');
  });

  it('omits props at their defaults and keeps the rest', () => {
    const code = generateCode(page(node('button', { variant: 'primary', size: 'md', loading: true, children: 'Сохранить' })));
    expect(code).toContain('return <Button loading>Сохранить</Button>;');
  });

  it('escapes text that JSX would read as syntax', () => {
    const code = generateCode(page(node('stack', {}, { children: [text('{x} <b>'), node('badge', { children: 'Скажите "да"' })] })));
    expect(code).toContain('<p className="text-body-md">{"{x} <b>"}</p>');
    expect(code).toContain('<Badge>Скажите "да"</Badge>');
  });

  it('prints leaf components with their docs snippet', () => {
    const code = generateCode(page(node('select')));
    expect(code).toContain("import { Select } from '@/kvant';");
    expect(code).toContain('<Select');
  });
});

describe('dependencies', () => {
  it('lists the registry items behind every Kvant name in the code', () => {
    expect(usedComponents(page(template('deal-card')))).toEqual(['avatar', 'badge', 'button', 'card']);
    expect(installCommand(page(template('sign-in')))).toBe('npx kvant-ui add button card checkbox field input link password-input');
  });

  it('needs no command for a page of layout and text', () => {
    expect(installCommand(page(node('stack', {}, { children: [text('Только текст')] })))).toBeNull();
  });
});

describe('blockItem', () => {
  it('is an item `kvant add` accepts: component files next to the block, the document to reopen it', () => {
    const item = blockItem(page(template('deal-card')), { name: 'deal-card', title: 'Карточка сделки', description: 'Блок из Playground' });
    const parsed = parseItem(JSON.parse(JSON.stringify(item)), 'deal-card.json');
    expect(parsed).toMatchObject({
      name: 'deal-card',
      type: 'component',
      registryDependencies: ['avatar', 'badge', 'button', 'card'],
      dependencies: ['lucide-react@^1.63.0'],
      css: [],
    });
    expect(parsed.files).toHaveLength(1);
    expect(parsed.files[0]?.target).toBe('blocks/deal-card.tsx');
    expect(parsed.files[0]?.barrel).toBe(true);
    expect(parsed.files[0]?.content).toMatchSnapshot();
    expect(item.composer.format).toBe('kvant-composer');
  });
});

describe('names', () => {
  it('transliterates a Russian title into an item name', () => {
    expect(blockSlug('Карточка сделки')).toBe('kartochka-sdelki');
    expect(blockSlug('Форма входа — v2')).toBe('forma-vkhoda-v2');
    expect(blockSlug('«»')).toBe('block');
  });

  it('turns an item name into a component name', () => {
    expect(componentName('deal-card')).toBe('DealCard');
    expect(componentName('2fa')).toBe('Block2fa');
  });
});
