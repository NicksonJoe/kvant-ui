// What the composer can place: primitives, composable components (rendered from their own props and slots)
// and leaf components (rendered by their docs playground). Props and slots come from the registry meta.
import {
  FORCED_STATES,
  categories,
  createPropReader,
  getComponent,
  isReady,
  type ForcedState,
  type PartMeta,
  type Playground,
  type PropMeta,
  type PropReader,
  type PropValues,
  type ReadyComponentMeta,
} from '@/kvant/meta';
import { editableProps } from '../components/Controls';
import { getPlayground } from '../lib/registry';
import { CHILDREN, createId, type ComposerNode, type NodeProps } from './model';
import {
  CARD_EXTRA_PROPS,
  GRID_PROPS,
  ICON_PROPS,
  ROW_PROPS,
  SECTION_PROPS,
  STACK_PROPS,
  TEXT_PROPS,
  type IconName,
} from './primitives';

export interface SlotSpec {
  name: string;
  description: string;
  required: boolean;
}

interface BaseSpec {
  type: string;
  title: string;
  description: string;
  /** Palette group: `layout` or a meta category id. */
  group: string;
  /** What the inspector edits; leaf components add their playground knobs. */
  props: readonly PropMeta[];
  slots: readonly SlotSpec[];
  /** Forced states the canvas can show (from the meta states). */
  states: readonly ForcedState[];
  /** Values a new node starts with (defaults are not stored). */
  initial: PropValues;
  /** Extra words for the palette search. */
  keywords: string;
}

export type PrimitiveType = 'stack' | 'row' | 'grid' | 'card' | 'section' | 'text' | 'icon';

export interface PrimitiveSpec extends BaseSpec {
  kind: 'primitive';
  type: PrimitiveType;
}

/** Rendered as `<Export {...props} slot={…}>`: every slot accepts other nodes. */
export interface ComposableSpec extends BaseSpec {
  kind: 'composable';
  meta: ReadyComponentMeta;
  exportName: string;
}

/** Rendered and printed by the component's docs playground; no slots. */
export interface LeafSpec extends BaseSpec {
  kind: 'leaf';
  meta: ReadyComponentMeta;
  playground: Playground;
}

export type NodeSpec = PrimitiveSpec | ComposableSpec | LeafSpec;

const CHILDREN_SLOT: SlotSpec = { name: CHILDREN, description: 'Содержимое.', required: false };

function forcedStates(meta: ReadyComponentMeta): ForcedState[] {
  return FORCED_STATES.filter((state) => meta.states.some((item) => item.id === state));
}

function slotsOf(props: readonly PropMeta[]): SlotSpec[] {
  return props
    .filter((prop) => prop.type === 'node' && prop.name !== 'render')
    .map((prop) => ({ name: prop.name, description: prop.description, required: prop.required === true }));
}

function pick(values: PropValues, names: readonly string[]): PropValues {
  return Object.fromEntries(Object.entries(values).filter(([name]) => names.includes(name)));
}

function readyMeta(id: string): ReadyComponentMeta {
  const meta = getComponent(id);
  if (!meta || !isReady(meta)) throw new Error(`Composer needs the ready component «${id}»`);
  return meta;
}

/* ---------- primitives ---------- */

const card = readyMeta('card');
const cardHeader: PartMeta | undefined = card.parts?.find((part) => part.name === 'CardHeader');

const primitives: readonly PrimitiveSpec[] = [
  {
    kind: 'primitive',
    type: 'stack',
    title: 'Стек',
    description: 'Колонка с равным отступом между элементами.',
    group: 'layout',
    props: STACK_PROPS,
    slots: [CHILDREN_SLOT],
    states: [],
    initial: {},
    keywords: 'stack column колонка вертикально',
  },
  {
    kind: 'primitive',
    type: 'row',
    title: 'Ряд',
    description: 'Элементы в строку: кнопки, метки, действия.',
    group: 'layout',
    props: ROW_PROPS,
    slots: [CHILDREN_SLOT],
    states: [],
    initial: {},
    keywords: 'row inline строка горизонтально',
  },
  {
    kind: 'primitive',
    type: 'grid',
    title: 'Сетка',
    description: 'Колонки одинаковой ширины.',
    group: 'layout',
    props: GRID_PROPS,
    slots: [CHILDREN_SLOT],
    states: [],
    initial: {},
    keywords: 'grid columns колонки',
  },
  {
    kind: 'primitive',
    type: 'card',
    title: card.title,
    description: card.description,
    group: 'layout',
    props: [...card.props, ...CARD_EXTRA_PROPS],
    slots: [
      { name: 'action', description: cardHeader?.props.find((prop) => prop.name === 'action')?.description ?? 'Действие в шапке.', required: false },
      CHILDREN_SLOT,
    ],
    states: forcedStates(card),
    initial: { title: 'Заголовок' },
    keywords: 'card карточка CardHeader',
  },
  {
    kind: 'primitive',
    type: 'section',
    title: 'Секция',
    description: 'Раздел страницы с заголовком и пояснением.',
    group: 'layout',
    props: SECTION_PROPS,
    slots: [CHILDREN_SLOT],
    states: [],
    initial: { title: 'Раздел' },
    keywords: 'section раздел',
  },
  {
    kind: 'primitive',
    type: 'text',
    title: 'Текст',
    description: 'Заголовок, абзац, подпись или сумма по шкале Kvant.',
    group: 'layout',
    props: TEXT_PROPS,
    slots: [],
    states: [],
    initial: { text: 'Текст' },
    keywords: 'text heading заголовок абзац подпись типографика',
  },
  {
    kind: 'primitive',
    type: 'icon',
    title: 'Иконка',
    description: 'Иконка Lucide; в слоте компонента получает его размер и цвет.',
    group: 'layout',
    props: ICON_PROPS,
    slots: [],
    states: [],
    initial: { name: 'Sparkles' },
    keywords: 'icon lucide пиктограмма',
  },
];

/* ---------- components ---------- */

/**
 * Components drawn straight from their props, so the canvas matches the exported code; their node props
 * become slots. The rest are leaves: their docs playground draws them with its sample data.
 */
const COMPOSABLE: readonly { id: string; exportName?: string; type?: string; title?: string; initial?: PropValues }[] = [
  { id: 'button' },
  { id: 'button', exportName: 'IconButton', type: 'icon-button', title: 'Кнопка-иконка', initial: { 'aria-label': 'Ещё' } },
  { id: 'toggle-button' },
  { id: 'fab' },
  { id: 'badge' },
  { id: 'avatar' },
  { id: 'input' },
  { id: 'password-input' },
  { id: 'textarea' },
  { id: 'checkbox' },
  { id: 'switch' },
  { id: 'field' },
  { id: 'fieldset' },
  { id: 'separator' },
  { id: 'empty-state' },
];

function composable(entry: (typeof COMPOSABLE)[number]): ComposableSpec {
  const meta = readyMeta(entry.id);
  const main = meta.propsOf ?? meta.source.exports[0] ?? meta.id;
  const exportName = entry.exportName ?? main;
  const part = exportName === main ? undefined : meta.parts?.find((item) => item.name === exportName);
  const props = part?.props ?? meta.props;
  const editable = editableProps(props);
  return {
    kind: 'composable',
    type: entry.type ?? meta.id,
    title: entry.title ?? meta.title,
    description: part?.description ?? meta.description,
    group: meta.category,
    props: editable,
    slots: slotsOf(props),
    states: forcedStates(meta),
    initial: entry.initial ?? pick(getPlayground(meta.id)?.initial ?? {}, editable.map((prop) => prop.name)),
    keywords: `${entry.type ?? meta.id} ${exportName}`,
    meta,
    exportName,
  };
}

function leaf(meta: ReadyComponentMeta, playground: Playground): LeafSpec {
  return {
    kind: 'leaf',
    type: meta.id,
    title: meta.title,
    description: meta.description,
    group: meta.category,
    props: [...meta.props, ...(playground.controls ?? [])],
    slots: [],
    states: forcedStates(meta),
    initial: playground.initial ?? {},
    keywords: `${meta.id} ${meta.source.exports.join(' ')}`,
    meta,
    playground,
  };
}

const composables = COMPOSABLE.map(composable);
const composableIds = new Set(COMPOSABLE.map((entry) => entry.id));

/** Components in library order; the card is the layout primitive, extra composable parts follow their component. */
const components: NodeSpec[] = categories.flatMap((category) =>
  category.components.filter(isReady).flatMap((meta): NodeSpec[] => {
    if (meta.id === 'card') return [];
    if (composableIds.has(meta.id)) return composables.filter((spec) => spec.meta.id === meta.id);
    const playground = getPlayground(meta.id);
    return playground ? [leaf(meta, playground)] : [];
  }),
);

const specs = new Map<string, NodeSpec>([...primitives, ...components].map((spec) => [spec.type, spec]));

export function getSpec(type: string): NodeSpec | undefined {
  return specs.get(type);
}

export function requireSpec(type: string): NodeSpec {
  const spec = specs.get(type);
  if (!spec) throw new Error(`Неизвестный элемент «${type}»`);
  return spec;
}

export function acceptsChildren(spec: NodeSpec): boolean {
  return spec.slots.some((slot) => slot.name === CHILDREN);
}

/** Typed reads of a node's props with the spec defaults as fallback; the same reader draws and prints the node. */
export function readProps(spec: NodeSpec, node: ComposerNode): PropReader {
  return createPropReader(spec.props, node.props);
}

/* ---------- new nodes ---------- */

/** A node with exactly these props (templates); the palette adds the spec's starting values via `createNode`. */
export function node(type: string, props: NodeProps = {}, slots: ComposerNode['slots'] = {}): ComposerNode {
  return { id: createId(), type, props, slots: { ...emptySlots(requireSpec(type)), ...slots } };
}

export function icon(name: IconName, props: NodeProps = {}): ComposerNode {
  return node('icon', { name, ...props });
}

export function text(value: string, props: NodeProps = {}): ComposerNode {
  return node('text', { text: value, ...props });
}

/** Containers always carry their `children` slot, so an empty one is still a drop zone. */
function emptySlots(spec: NodeSpec): ComposerNode['slots'] {
  return acceptsChildren(spec) ? { [CHILDREN]: [] } : {};
}

/** Starting content for components that are empty without it. */
const PRESETS: Readonly<Record<string, () => ComposerNode['slots']>> = {
  'icon-button': () => ({ icon: [icon('Ellipsis')] }),
  'toggle-button': () => ({ icon: [icon('Star')] }),
  fab: () => ({ icon: [icon('Plus')] }),
  field: () => ({ children: [node('input', { placeholder: 'name@domain.ru' })] }),
  fieldset: () => ({ children: [createNode('field')] }),
  'empty-state': () => ({
    icon: [icon('Inbox')],
    actions: [node('button', { size: 'sm', children: 'Создать' }, { leadingIcon: [icon('Plus')] })],
  }),
};

/** A node as the palette creates it: the spec's starting values plus preset slots. */
export function createNode(type: string): ComposerNode {
  return node(type, requireSpec(type).initial, PRESETS[type]?.() ?? {});
}

/* ---------- palette ---------- */

export interface PaletteGroup {
  id: string;
  title: string;
  specs: readonly NodeSpec[];
}

export const LAYOUT_GROUP: PaletteGroup = { id: 'layout', title: 'Раскладка и текст', specs: primitives };

export const COMPONENT_GROUPS: readonly PaletteGroup[] = categories
  .map((category) => ({ id: category.id, title: category.title, specs: components.filter((spec) => spec.group === category.id) }))
  .filter((group) => group.specs.length > 0);

export const ALL_SPECS: readonly NodeSpec[] = [...primitives, ...components];
