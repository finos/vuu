export interface TreeSourceNode<T = unknown> {
  nodeData?: T;
  id: string;
  icon?: string;
  header?: boolean;
  label: string;
  /**
   * Segment used to build the row key for this node, defaults to label.
   * Allows a display label to differ from a stable key.
   */
  keySegment?: string;
  childNodes?: TreeSourceNode<T>[];
  /** node is rendered expanded initially */
  expanded?: boolean;
  tags?: string[];
}
