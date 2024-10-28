import type { NonLeafNode, NormalisedTreeSourceNode } from "@finos/vuu-utils";

export const isExpanded = (
  node: NormalisedTreeSourceNode,
): node is NonLeafNode => node.expanded === true;
