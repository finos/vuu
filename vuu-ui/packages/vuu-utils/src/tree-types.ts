export interface TreeSourceNode {
  id: string;
  icon?: string;
  header?: boolean;
  label: string;
  childNodes?: TreeSourceNode[];
}
export interface NormalisedTreeSourceNode extends TreeSourceNode {
  childNodes?: NormalisedTreeSourceNode[];
  count: number;
  expanded?: boolean;
  index: number;
  level: number;
}

export interface NonLeafNode extends NormalisedTreeSourceNode {
  childNodes: NormalisedTreeSourceNode[];
}
