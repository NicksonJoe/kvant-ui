import type { PaperBoardId } from './paper';

/** Library map, in the order of the component inventory. */
export const CATEGORY_IDS = [
  'actions',
  'forms',
  'selection',
  'pickers',
  'navigation',
  'overlays',
  'feedback',
  'data-display',
  'content',
  'chat-ai',
  'utilities',
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

/** stable: ready for products · beta: works, API may change · planned: designed in Paper, not built yet. */
export type ComponentStatus = 'stable' | 'beta' | 'planned';

export type PropValue = string | number | boolean;
export type PropValues = Readonly<Record<string, PropValue>>;

export type PropType = 'enum' | 'boolean' | 'string' | 'number' | 'node' | 'function' | 'object';

export interface PropMeta {
  name: string;
  type: PropType;
  /** TypeScript type for the API table when `type` alone says too little, e.g. `(value: V) => void`. */
  signature?: string;
  /** Allowed values of an enum (or of a number with a fixed scale). */
  options?: readonly PropValue[];
  default?: PropValue;
  description: string;
  required?: boolean;
  /** `false` keeps the prop out of the Controls panel (it stays in the API table). */
  control?: false;
}

export interface PartMeta {
  name: string;
  description: string;
  props: readonly PropMeta[];
}

export interface SlotMeta {
  /** Value of `data-slot`. */
  name: string;
  description: string;
}

export const STATE_IDS = [
  'rest',
  'hover',
  'pressed',
  'focus',
  'disabled',
  'loading',
  'invalid',
  'read-only',
  'filled',
  'checked',
  'unchecked',
  'indeterminate',
  'selected',
  'open',
  'highlighted',
  'expanded',
  'collapsed',
  'empty',
] as const;
export type StateId = (typeof STATE_IDS)[number];

/** States the docs force with `data-force-*` instead of props. */
export const FORCED_STATES = ['hover', 'pressed', 'focus'] as const satisfies readonly StateId[];
export type ForcedState = (typeof FORCED_STATES)[number];

export interface StateMeta {
  id: StateId;
  /** Russian name used in state matrices: «наведение». */
  label: string;
  description: string;
  /** Props that put the component into this state (hover, pressed and focus are forced instead). */
  props?: PropValues;
  /** CSS hook shown under the name in state matrices: `:active · scale .97`, `aria-busy` (default: the pseudo-class or the prop). */
  selector?: string;
}

export interface MatrixRow {
  label: string;
  props: PropValues;
  /** Token path of the row, one line each: `bg accent → hover → pressed`. */
  tokens?: readonly string[];
}

/** State matrix for the docs: rows are variants, columns are states (or values of a prop). */
export interface StateMatrix {
  /** Enum prop whose options become rows. */
  rowProp?: string;
  rows?: readonly MatrixRow[];
  /** Enum prop whose options become columns instead of states. */
  columnProp?: string;
  /** State ids shown as columns (default: every state with props or a forced state). */
  columns?: readonly StateId[];
  /** Russian name of the row axis: «вариант». */
  rowsLabel?: string;
  /** Mono spec lines under the matrix: geometry, motion, footnotes. */
  notes?: readonly string[];
}

export interface KeyboardMeta {
  keys: readonly string[];
  action: string;
}

export interface MotionMeta {
  label: string;
  value: string;
  /** What the user sees: «Меняется только фон». */
  note?: string;
  /** Second line of parameters. */
  detail?: string;
  /** Curve drawn next to the row: a token (`ease-hover`, `spring-micro`), `linear` or `instant`. */
  easing?: string;
  /** What reduced motion does to it. */
  reduced?: string;
  /** Tokens the row uses, listed live on the «Движение» tab: `duration-micro`. */
  tokens?: readonly string[];
}

/** «Анатомия»: a live specimen whose parts are outlined when their row is hovered. */
export interface AnatomyMap {
  /** Playground values for the specimen (default: the playground's initial values). */
  values?: PropValues;
  parts: readonly AnatomyPart[];
}

export interface AnatomyPart {
  name: string;
  /** CSS selector inside the specimen: `[data-slot=button-label]`. */
  selector: string;
  description: string;
}

export interface ExampleMeta {
  /** File name in `examples/<component id>/` without the extension. */
  id: string;
  title: string;
  description?: string;
}

interface BaseMeta {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  paperBoard?: PaperBoardId;
  /** Parts from the outside in, in Russian. */
  anatomy?: readonly string[];
  related?: readonly string[];
}

export interface PlannedComponentMeta extends BaseMeta {
  status: 'planned';
}

export interface ReadyComponentMeta extends BaseMeta {
  status: 'stable' | 'beta';
  source: {
    /** Path inside the registry, e.g. `components/button.tsx`. */
    file: string;
    exports: readonly string[];
  };
  dependencies: {
    npm: readonly string[];
    /** Other Kvant components the source imports. */
    registry: readonly string[];
  };
  /** Export whose props are listed in `props` (default: the first export). */
  propsOf?: string;
  /** Props of the main export; they drive the Controls panel. */
  props: readonly PropMeta[];
  /** Other exports of the same component with their own props. */
  parts?: readonly PartMeta[];
  slots: readonly SlotMeta[];
  states: readonly StateMeta[];
  matrix?: StateMatrix;
  /** Parts for the «Анатомия» tab (default: one part per data-slot on the playground). */
  anatomyMap?: AnatomyMap;
  keyboard: readonly KeyboardMeta[];
  a11y: readonly string[];
  motion: readonly MotionMeta[];
  examples: readonly ExampleMeta[];
}

export type ComponentMeta = PlannedComponentMeta | ReadyComponentMeta;

export interface CategoryMeta {
  id: CategoryId;
  title: string;
  description: string;
  components: readonly ComponentMeta[];
}
