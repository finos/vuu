import type { NonLeafNode, NormalisedTreeSourceNode } from "./treeTypes";

export const isExpanded = (
  node: NormalisedTreeSourceNode
): node is NonLeafNode => node.expanded === true;
