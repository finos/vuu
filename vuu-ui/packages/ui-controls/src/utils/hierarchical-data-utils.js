export const getNodeParentPath = ({ id }) => {
  const pos = id.lastIndexOf('-');
  const path = id.slice(pos + 1);
  const steps = path.split('.');
  if (steps.length === 1) {
    return null;
  } else {
    steps.pop();
    return `${id.slice(0, pos)}-${steps.join('.')}`;
  }
};

export const isGroupNode = (node) => node.childNodes !== undefined;
export const isCollapsibleGroupNode = (node) => isGroupNode(node) && node.expanded !== undefined;
export const isHeader = (node) => node.header === true;

const isDescendantOf = (basePath, targetPath) => {
  if (!targetPath.startsWith(basePath)) {
    return false;
  } else {
    return targetPath.charAt(basePath.length) === '.';
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
      return node.set(props);
    } else if (isDescendantOf(node.id, id)) {
      childNodes = replaceNode(node.childNodes, id, props);
      return node.set({ childNodes });
    } else {
      return node;
    }
  });

  return newNodes;
};
