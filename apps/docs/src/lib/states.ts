import { FORCED_STATES, type ForcedState, type PropValues, type ReadyComponentMeta, type StateId, type StateMeta } from '@/kvant/meta';

/** One state as a static cell: forced (hover, pressed, focus) or set by props. */
export interface StateLane {
  key: string;
  label: string;
  /** Mono line under the name: the CSS hook or the prop that sets the state. */
  selector: string;
  props: PropValues;
  forced?: ForcedState;
}

const PSEUDO_CLASSES: Record<ForcedState, string> = { hover: ':hover', pressed: ':active', focus: ':focus-visible' };

function forcedOf(id: StateId): ForcedState | undefined {
  return FORCED_STATES.find((state) => state === id);
}

function toLane(state: StateMeta): StateLane {
  const forced = forcedOf(state.id);
  const hook = forced ? PSEUDO_CLASSES[forced] : state.id === 'rest' ? 'default' : (Object.keys(state.props ?? {})[0] ?? state.id);
  return { key: state.id, label: state.label, selector: state.selector ?? hook, props: state.props ?? {}, ...(forced ? { forced } : {}) };
}

/** The states a static cell can show — rest, forced ones and those set by props — or the listed ones; never empty. */
export function stateLanes(meta: ReadyComponentMeta, only?: readonly StateId[]): StateLane[] {
  const lanes = meta.states
    .filter((state) => (only ? only.includes(state.id) : state.id === 'rest' || state.props !== undefined || forcedOf(state.id)))
    .map(toLane);
  return lanes.length > 0 ? lanes : [{ key: 'rest', label: 'покой', selector: 'default', props: {} }];
}
