export const getNodeParentPath = ({ id }) => {
  let pos = id.lastIndexOf('-');
  if (pos !== -1) {
    // using the built-in hierarchical id scheme
    // rootId-n-n.n
    const path = id.slice(pos + 1);
    const steps = path.split('.');
    if (steps.length === 1) {
      return null;
    } else {
      steps.pop();
      return `${id.slice(0, pos)}-${steps.join('.')}`;
    }
  } else if ((pos = id.lastIndexOf('/')) !== -1) {
    // using a path scheme step/step/step
    return id.slice(0, pos);
  }
};

export const isGroupNode = (node) => node.childNodes !== undefined;
export const isCollapsibleGroupNode = (node) => isGroupNode(node) && node.expanded !== undefined;
export const isHeader = (node) => node.header === true;

const PATH_SEPARATORS = new Set(['.', '/']);

const isDescendantOf = (basePath, targetPath) => {
  if (!targetPath.startsWith(basePath)) {
    return false;
  } else {
    return PATH_SEPARATORS.has(targetPath.charAt(basePath.length));
  }
};

export const getNodeById = (nodes, id) => {
  for (let node of nodes) {
    if (node.id === id) {
      return node;
    } else if (isDescendantOf(node.id, id)) {
      return getNodeById(node.childNodes, id);
    }
  }
};

export const getIndexOfNode = (indexPositions, node) => {
  const id = typeof node === 'string' ? node : node.id;
  for (let i = 0; i < indexPositions.length; i++) {
    if (indexPositions[i].id === id) {
      return i;
    }
  }
};

export const replaceNode = (nodes, id, props) => {
  let childNodes;
  const newNodes = nodes.map((node) => {
    if (node.id === id) {
      return {
        ...node,
        ...props
      };
    } else if (isDescendantOf(node.id, id)) {
      childNodes = replaceNode(node.childNodes, id, props);
      return {
        ...node,
        childNodes
      };
    } else {
      return node;
    }
  });

  return newNodes;
};
