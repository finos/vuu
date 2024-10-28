import { NonLeafNode, NormalisedTreeSourceNode } from "@finos/vuu-utils";

export const getNodeParentPath = ({ id }: NormalisedTreeSourceNode) => {
  let pos = id.lastIndexOf("-");
  if (pos !== -1) {
    // using the built-in hierarchical id scheme
    // rootId-n-n.n
    const path = id.slice(pos + 1);
    const steps = path.split(".");
    if (steps.length === 1) {
      return null;
    } else {
      steps.pop();
      return `${id.slice(0, pos)}-${steps.join(".")}`;
    }
  } else if ((pos = id.lastIndexOf("/")) !== -1) {
    // using a path scheme step/step/step
    return id.slice(0, pos);
  }
};

export const isGroupNode = (node: NormalisedTreeSourceNode) =>
  node.childNodes !== undefined;
export const isCollapsibleGroupNode = (node: NormalisedTreeSourceNode) =>
  isGroupNode(node) && node.expanded !== undefined;
export const isHeader = (node: NormalisedTreeSourceNode) =>
  node.header === true;

const PATH_SEPARATORS = new Set([".", "/"]);

const isDescendantOf = (
  node: NormalisedTreeSourceNode,
  targetPath: string,
): node is NonLeafNode => {
  if (!targetPath.startsWith(node.id)) {
    return false;
  } else {
    return PATH_SEPARATORS.has(targetPath.charAt(node.id.length));
  }
};

export const getNodeById = (
  nodes: NormalisedTreeSourceNode[],
  id: string,
): NormalisedTreeSourceNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    } else if (isDescendantOf(node, id)) {
      return getNodeById(node.childNodes, id);
    }
  }
};

export const getIndexOfNode = (
  treeNodes: NormalisedTreeSourceNode[],
  node: NormalisedTreeSourceNode,
) => {
  const id = typeof node === "string" ? node : node.id;
  for (let i = 0; i < treeNodes.length; i++) {
    if (treeNodes[i].id === id) {
      return i;
    }
  }
};

export const replaceNode = (
  nodes: NormalisedTreeSourceNode[],
  id: string,
  props: Partial<NormalisedTreeSourceNode>,
): NormalisedTreeSourceNode[] => {
  let childNodes;
  const newNodes = nodes.map((node) => {
    if (node.id === id) {
      return {
        ...node,
        ...props,
      };
    } else if (isDescendantOf(node, id)) {
      childNodes = replaceNode(node.childNodes, id, props);
      return {
        ...node,
        childNodes,
      };
    } else {
      return node;
    }
  });

  return newNodes;
};
