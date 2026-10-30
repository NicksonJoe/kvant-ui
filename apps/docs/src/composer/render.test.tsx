import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToastProvider, TooltipProvider } from '@/kvant';
import { ALL_SPECS, createNode, node } from './catalog';
import { CHILDREN, emptyRoot, type ComposerNode } from './model';
import { CanvasModeContext, NodeView, type CanvasMode } from './render';
import { TEMPLATES } from './templates';

function page(...blocks: ComposerNode[]): ComposerNode {
  return { ...emptyRoot(), slots: { [CHILDREN]: blocks } };
}

function draw(root: ComposerNode, mode: Partial<CanvasMode> = {}) {
  return render(
    <TooltipProvider>
      <ToastProvider>
        <CanvasModeContext value={{ editing: true, dragging: false, ...mode }}>
          <NodeView node={root} />
        </CanvasModeContext>
      </ToastProvider>
    </TooltipProvider>,
  );
}

describe('NodeView', () => {
  it.each(ALL_SPECS.map((spec) => [spec.title, spec.type] as const))('draws «%s» from the palette', (_title, type) => {
    const item = createNode(type);
    const { container } = draw(page(item));
    expect(container.textContent).not.toContain('не отрисовался');
    expect(container.querySelector(`[data-node="${item.id}"]`)).not.toBeNull();
  });

  it.each(TEMPLATES.map((template) => [template.title, template] as const))('draws the «%s» template', (_title, template) => {
    const { container } = draw(page(template.create()));
    expect(container.textContent).not.toContain('не отрисовался');
  });

  it('shows empty slots as drop zones only while dragging in edit mode', () => {
    const button = node('button', { children: 'Сохранить' });
    const zone = `[data-zone="${button.id}:leadingIcon"]`;
    expect(draw(page(button)).container.querySelector(zone)).toBeNull();
    expect(draw(page(button), { dragging: true }).container.querySelector(zone)).not.toBeNull();
    expect(draw(page(button), { editing: false, dragging: true }).container.querySelector(zone)).toBeNull();
  });
});
