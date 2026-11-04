// Graph model shared by the canvas engine, node cards, editor chrome and graph checks.

export type CanvasNodeKind = 'trigger' | 'action' | 'condition' | 'loop' | 'wait' | 'agent' | 'data' | 'group' | 'note';

/** Run state of a step or an edge: waiting → running → done | error; warning is a config problem before any run. */
export type CanvasRunStatus = 'idle' | 'waiting' | 'running' | 'done' | 'error' | 'warning' | 'skipped';

export type CanvasPortSide = 'top' | 'right' | 'bottom' | 'left';

export type CanvasPortDirection = 'in' | 'out';

/** flow carries the order of steps; the rest carry data and are coloured by type. */
export type CanvasPortType = 'flow' | 'text' | 'number' | 'date' | 'boolean' | 'object' | 'list' | 'tool' | 'memory' | 'knowledge';

export type CanvasEdgePath = 'bezier' | 'smoothstep' | 'step' | 'straight' | 'orthogonal';

export interface CanvasPoint {
  x: number;
  y: number;
}

/** x/y is the screen offset of the graph origin, zoom is the scale. */
export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasPort {
  id: string;
  side: CanvasPortSide;
  direction: CanvasPortDirection;
  type?: CanvasPortType;
  label?: string;
  /** More than one edge may attach; outputs default to true, inputs to false. */
  multiple?: boolean;
  /** Centre along the side in px from the node's top (left/right) or left edge (top/bottom); default: spread evenly. */
  offset?: number;
  /** An input the step cannot run without: drawn in danger while nothing is connected. */
  required?: boolean;
}

export interface CanvasNode<TData = unknown> {
  id: string;
  kind: CanvasNodeKind;
  /** Top-left corner in graph coordinates; relative to the parent group when parentId is set. */
  position: CanvasPoint;
  width?: number;
  height?: number;
  ports: readonly CanvasPort[];
  parentId?: string;
  selected?: boolean;
  collapsed?: boolean;
  disabled?: boolean;
  status?: CanvasRunStatus;
  /** Size handles when selected; default: groups and notes (steps keep a fixed width). */
  resizable?: boolean;
  data: TData;
}

export interface CanvasEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
  path?: CanvasEdgePath;
  label?: string;
  status?: CanvasRunStatus;
  selected?: boolean;
}

export interface CanvasGraph<TData = unknown> {
  nodes: readonly CanvasNode<TData>[];
  edges: readonly CanvasEdge[];
}

/** An edge before it has an id: what a drag from port to port proposes. */
export interface CanvasConnection {
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
}

/** select is not an edit: history replaces the present instead of adding a step. add and update come from the editor around the canvas. */
export type CanvasChangeType = 'select' | 'move' | 'resize' | 'connect' | 'reconnect' | 'delete' | 'paste' | 'layout' | 'label' | 'add' | 'update';

/** Why the graph changed; history uses it to merge and skip steps. */
export interface CanvasChange {
  type: CanvasChangeType;
  nodeIds?: readonly string[];
  edgeIds?: readonly string[];
  /** Changes with the same key in a row within a second are one history step (arrow-key nudges). */
  mergeKey?: string;
}
