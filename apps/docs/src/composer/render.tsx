// Canvas rendering: real Kvant components. Every node marks its element with data-node (leaf components get a
// `display: contents` wrapper, since their playground owns the markup); empty slots become drop placeholders.
import { Component, createContext, createElement, memo, use, type ComponentType, type ReactNode } from 'react';
import * as kvant from '@/kvant';
import { Card, CardHeader, cn } from '@/kvant';
import { getSpec, readProps, type ComposableSpec, type NodeSpec, type PrimitiveSpec } from './catalog';
import { CHILDREN, ROOT_ID, type ComposerNode } from './model';
import {
  ICONS,
  SECTION_DESCRIPTION,
  SECTION_HEADER,
  SECTION_TITLE,
  cardWidthClass,
  gridClasses,
  iconClasses,
  isIconName,
  rowClasses,
  sectionClasses,
  stackClasses,
  textStyle,
} from './primitives';

export interface CanvasMode {
  /** Edit: placeholders for empty containers and slots. Preview: the composition as it ships. */
  editing: boolean;
  /** While dragging, empty slots show their drop zones (otherwise the inspector lists them). */
  dragging: boolean;
}

export const CanvasModeContext = createContext<CanvasMode>({ editing: false, dragging: false });

const exports = new Map<string, unknown>(Object.entries(kvant));

function kvantComponent(name: string): ComponentType<Record<string, unknown>> | null {
  const value = exports.get(name);
  // components are functions; memo / forwardRef wrappers are objects
  return typeof value === 'function' || (typeof value === 'object' && value !== null) ? (value as ComponentType<Record<string, unknown>>) : null;
}

const CARD_VARIANTS = ['raised', 'flat', 'outline', 'interactive'] as const;
const CARD_PADDINGS = ['compact', 'default', 'spacious'] as const;

function SlotPlaceholder({ zone, name }: { zone: string; name: string }) {
  return (
    <span
      data-zone={zone}
      className="inline-flex min-h-6 min-w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-accent bg-accent-soft px-1.5 font-mono text-[10px] leading-4 text-accent-soft-fg"
    >
      {name}
    </span>
  );
}

function EmptyContainer() {
  return (
    <span className="flex min-h-16 min-w-24 flex-1 items-center justify-center rounded-lg border border-dashed border-border px-3 text-caption text-fg-3">
      Перетащите сюда
    </span>
  );
}

function slotContent(node: ComposerNode, slot: string, mode: CanvasMode, container: boolean): ReactNode {
  const children = node.slots[slot] ?? [];
  if (children.length > 0) return children.map((child) => <NodeView key={child.id} node={child} />);
  if (!mode.editing) return undefined;
  // the empty page shows the start screen instead
  if (container) return node.id === ROOT_ID ? undefined : <EmptyContainer />;
  return mode.dragging ? <SlotPlaceholder zone={`${node.id}:${slot}`} name={slot} /> : undefined;
}

function renderPrimitive(spec: PrimitiveSpec, node: ComposerNode, mode: CanvasMode): ReactNode {
  const read = readProps(spec, node);
  const children = () => slotContent(node, CHILDREN, mode, true);
  // the page fills the frame, so its empty space is a drop zone too
  const page = node.id === ROOT_ID ? 'min-h-full flex-1' : '';
  switch (spec.type) {
    case 'stack':
      return (
        <div data-node={node.id} className={cn(stackClasses(read), page)}>
          {children()}
        </div>
      );
    case 'row':
      return (
        <div data-node={node.id} className={rowClasses(read)}>
          {children()}
        </div>
      );
    case 'grid':
      return (
        <div data-node={node.id} className={gridClasses(read)}>
          {children()}
        </div>
      );
    case 'section': {
      const title = read.text('title');
      const description = read.text('description');
      const heading = title ? <h2 className={SECTION_TITLE}>{title}</h2> : null;
      const note = description ? <p className={SECTION_DESCRIPTION}>{description}</p> : null;
      return (
        <section data-node={node.id} className={sectionClasses(read)}>
          {heading && note ? (
            <div className={SECTION_HEADER}>
              {heading}
              {note}
            </div>
          ) : (
            (heading ?? note)
          )}
          {children()}
        </section>
      );
    }
    case 'card': {
      const title = read.text('title');
      const description = read.text('description');
      const action = slotContent(node, 'action', mode, false);
      const hasAction = (node.slots.action?.length ?? 0) > 0;
      return (
        <Card
          data-node={node.id}
          variant={read.pick('variant', CARD_VARIANTS)}
          padding={read.pick('padding', CARD_PADDINGS)}
          className={cardWidthClass(read)}
        >
          {title || description || hasAction ? <CardHeader title={title} description={description || undefined} action={action} /> : null}
          {children()}
        </Card>
      );
    }
    case 'text': {
      const { tag, className } = textStyle(read);
      // an empty text keeps its line so it can still be selected
      return createElement(tag, { 'data-node': node.id, className }, read.text('text') || (mode.editing ? ' ' : ''));
    }
    case 'icon': {
      const name = read.text('name');
      const Icon = ICONS[isIconName(name) ? name : 'Sparkles'];
      return <Icon data-node={node.id} className={iconClasses(read) || undefined} />;
    }
  }
}

function renderComposable(spec: ComposableSpec, node: ComposerNode, mode: CanvasMode): ReactNode {
  const Export = kvantComponent(spec.exportName);
  if (!Export) throw new Error(`No Kvant export ${spec.exportName}`);
  // uncontrolled components (defaultValue, defaultPressed) remount when their props change
  const props: Record<string, unknown> = { key: JSON.stringify(node.props), 'data-node': node.id };
  for (const prop of spec.props) {
    const value = node.props[prop.name];
    if (value !== undefined && value !== '') props[prop.name] = value;
  }
  for (const slot of spec.slots) {
    const content = slotContent(node, slot.name, mode, false);
    if (content !== undefined) props[slot.name] = content;
  }
  return createElement(Export, props);
}

function renderSpec(spec: NodeSpec, node: ComposerNode, mode: CanvasMode): ReactNode {
  if (spec.kind === 'leaf') {
    return (
      <div data-node={node.id} className="contents">
        {spec.playground.render(readProps(spec, node))}
      </div>
    );
  }
  return spec.kind === 'composable' ? renderComposable(spec, node, mode) : renderPrimitive(spec, node, mode);
}

interface BoundaryProps {
  id: string;
  label: string;
  /** A new value (the edited node) tries to render again. */
  resetKey: unknown;
  children: ReactNode;
}

/** One broken node (an impossible prop combination) shows a note instead of blanking the canvas. */
class NodeBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidUpdate(previous: BoundaryProps) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <span data-node={this.props.id} className="inline-flex rounded-md bg-danger-soft px-2 py-1 text-caption text-danger-soft-fg">
        «{this.props.label}» не отрисовался — проверьте свойства
      </span>
    );
  }
}

export const NodeView = memo(function NodeView({ node }: { node: ComposerNode }) {
  const mode = use(CanvasModeContext);
  const spec = getSpec(node.type);
  if (!spec) return null;
  return (
    <NodeBoundary id={node.id} label={spec.title} resetKey={node}>
      {renderSpec(spec, node, mode)}
    </NodeBoundary>
  );
});
