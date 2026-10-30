// Reads the canvas DOM for the pure geometry in drop.ts: node boxes, slot zones and their direction.
import { getSpec } from './catalog';
import { union, type Axis, type Box, type NodeBox, type Zone } from './drop';
import { CHILDREN, findNode, walk, type ComposerNode } from './model';

function toBox(rect: DOMRect): Box | null {
  return rect.width > 0 || rect.height > 0 ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null;
}

/** `display: contents` wrappers (leaf components) have no box of their own: their children's union. */
export function boxOf(element: Element | null): Box | null {
  if (!element) return null;
  if (getComputedStyle(element).display !== 'contents') return toBox(element.getBoundingClientRect());
  return union([...element.children].map(boxOf).filter((box): box is Box => box !== null));
}

export function nodeElement(container: ParentNode, id: string): Element | null {
  return container.querySelector(`[data-node="${CSS.escape(id)}"]`);
}

function layoutAxis(element: Element | null): Axis {
  if (!element) return 'vertical';
  const style = getComputedStyle(element);
  if (style.display.includes('grid')) return 'horizontal';
  if (style.display.includes('flex')) return style.flexDirection.startsWith('row') ? 'horizontal' : 'vertical';
  return 'vertical';
}

/** The box that lays the element out, skipping `display: contents` wrappers. */
function layoutParent(element: Element | null): Element | null {
  let parent = element?.parentElement ?? null;
  while (parent && getComputedStyle(parent).display === 'contents') parent = parent.parentElement;
  return parent;
}

export function nodeBoxes(container: ParentNode, root: ComposerNode): NodeBox[] {
  const boxes: NodeBox[] = [];
  walk(root, (node, depth) => {
    const box = boxOf(nodeElement(container, node.id));
    if (box) boxes.push({ id: node.id, depth, box });
  });
  return boxes;
}

const inflate = (box: Box, by: number): Box => ({ left: box.left - by, top: box.top - by, width: box.width + by * 2, height: box.height + by * 2 });

/**
 * Slots that can take `dragged`: containers are their own element, other slots the union of their
 * content or their empty placeholder. Nothing inside the dragged node; no card inside a card.
 */
export function dropZones(container: ParentNode, root: ComposerNode, dragged: ComposerNode | null): Zone[] {
  const zones: Zone[] = [];
  const draggedCard = dragged !== null && findCard(dragged);
  const visit = (node: ComposerNode, depth: number, inCard: boolean) => {
    if (dragged && findNode(dragged, node.id)) return;
    const spec = getSpec(node.type);
    const cardHere = inCard || node.type === 'card';
    if (spec && !(draggedCard && cardHere)) {
      for (const slot of spec.slots) {
        const kids = node.slots[slot.name] ?? [];
        const children = kids.flatMap((kid) => {
          const box = boxOf(nodeElement(container, kid.id));
          return box ? [{ id: kid.id, box }] : [];
        });
        const own = spec.kind === 'primitive' && slot.name === CHILDREN ? nodeElement(container, node.id) : null;
        const firstChild = kids[0] ? nodeElement(container, kids[0].id) : null;
        const content = union(children.map((child) => child.box));
        const box = own
          ? boxOf(own)
          : content
            ? inflate(content, 4)
            : boxOf(container.querySelector(`[data-zone="${CSS.escape(`${node.id}:${slot.name}`)}"]`));
        if (box) zones.push({ parentId: node.id, slot: slot.name, depth, axis: layoutAxis(own ?? layoutParent(firstChild)), box, children });
      }
    }
    for (const kids of Object.values(node.slots)) for (const kid of kids) visit(kid, depth + 1, cardHere);
  };
  visit(root, 0, false);
  return zones;
}

function findCard(node: ComposerNode): boolean {
  let found = false;
  walk(node, (item) => {
    if (item.type === 'card') found = true;
  });
  return found;
}
