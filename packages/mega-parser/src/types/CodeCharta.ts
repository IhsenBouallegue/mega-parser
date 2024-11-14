export interface FileCount {
  all?: number;
  added: number;
  removed: number;
  changed: number;
}

interface squarifiedNode {
  name: string;
  id?: number;
  type: NodeType;
  children?: CodeMapNode[];
  attributes?: KeyValuePair;
  edgeAttributes?: {
    [key: string]: EdgeMetricCount;
  };
  link?: string;
  path?: string;
  isExcluded?: boolean;
  isFlattened?: boolean;
  deltas?: {
    [key: string]: number;
  };
  fixedPosition?: FixedPosition;
  fileCount?: FileCount;
}

export interface CodeMapNode extends squarifiedNode {}
export interface FixedPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

export enum NodeType {
  FILE = "File",
  FOLDER = "Folder",
}

export interface AttributeDescriptor {
  title: string;
  description: string;
  hintLowValue: string;
  hintHighValue: string;
  link: string;
  direction?: number;
}

export enum AttributeTypeValue {
  absolute = "absolute",
  relative = "relative",
}

export enum ColorMode {
  trueGradient = "trueGradient",
  weightedGradient = "weightedGradient",
  focusedGradient = "focusedGradient",
  absolute = "absolute",
}

export interface Edge {
  fromNodeName: string;
  toNodeName: string;
  attributes: KeyValuePair;
  visible?: EdgeVisibility;
}

export enum EdgeVisibility {
  none = "none",
  from = "from",
  to = "to",
  both = "both",
}

export interface EdgeMetricCount {
  incoming: number;
  outgoing: number;
}

export type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> };

export interface KeyValuePair {
  [key: string]: number;
}

export interface Node {
  name: string;
  id: number;
  width: number;
  height: number;
  length: number;
  depth: number;
  mapNodeDepth: number;
  x0: number;
  z0: number;
  y0: number;
  isLeaf: boolean;
  deltas?: KeyValuePair;
  attributes: KeyValuePair;
  edgeAttributes: {
    [key: string]: EdgeMetricCount;
  };
  heightDelta: number;
  visible: boolean;
  path: string;
  link: string;
  markingColor: string | null;
  flat: boolean;
  color: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  incomingEdgePoint: any;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  outgoingEdgePoint: any;
}
