export interface TreeSourceNode<T = unknown> {
  nodeData?: T;
  id: string;
  icon?: string;
  header?: boolean;
  label: string;
  childNodes?: TreeSourceNode<T>[];
}
